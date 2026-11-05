/**
 * Birthday Mookiland Apps Script Web App.
 * Public endpoints:
 *   GET  ?action=health
 *   GET  ?action=config
 *   GET  ?action=availability&date=YYYY-MM-DD[&locationId=LOC-GARDEN]
 *   POST JSON { action:"createBooking", ...booking fields... }
 *
 * For POST from a browser, send Content-Type: text/plain;charset=utf-8
 * to avoid a cross-origin preflight request.
 */

function doGet(e) {
  try {
    const params = (e && e.parameter) || {};
    const action = String(params.action || "health");

    if (action === "health") {
      const id = PropertiesService.getScriptProperties().getProperty("BM_SPREADSHEET_ID");
      return jsonOutput_({
        success: true,
        app: "Mookiland Birthday Booking API",
        setupCompleted: Boolean(id),
        timestamp: new Date().toISOString()
      });
    }

    if (action === "config") return jsonOutput_(getPublicConfig_());

    if (action === "availability") {
      const date = String(params.date || "");
      if (!isValidDateString_(date)) {
        return jsonOutput_({ success: false, error: "Provide date as YYYY-MM-DD." });
      }
      expirePendingBookings_();
      return jsonOutput_(getAvailability_(date, String(params.locationId || "")));
    }

    return jsonOutput_({ success: false, error: "Unknown action." });
  } catch (error) {
    return jsonOutput_({ success: false, error: error.message || String(error) });
  }
}

function doPost(e) {
  try {
    const body = e && e.postData && e.postData.contents
      ? JSON.parse(e.postData.contents)
      : {};
    if (String(body.action || "") === "createBooking") {
      return jsonOutput_(createBooking_(body));
    }
    return jsonOutput_({ success: false, error: "Unknown POST action." });
  } catch (error) {
    return jsonOutput_({ success: false, error: error.message || String(error) });
  }
}

function createBooking_(payload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    expirePendingBookings_();

    const name = cleanText_(payload.customerName, 120);
    const email = cleanText_(payload.email, 180).toLowerCase();
    const whatsapp = cleanText_(payload.whatsapp, 40);
    const childName = cleanText_(payload.birthdayChild, 120);
    const birthdayAge = cleanText_(payload.birthdayAge, 20);
    const eventDate = String(payload.eventDate || "");
    const session = String(payload.session || "").toUpperCase();
    const locationId = String(payload.locationId || "");
    const childrenCount = Number(payload.childrenCount);

    if (!name || !email || !whatsapp || !childName) {
      throw new Error("Customer name, email, WhatsApp and birthday child's name are required.");
    }
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
      throw new Error("Please provide a valid email address.");
    }
    if (!isValidDateString_(eventDate) || eventDate <= todayString_()) {
      throw new Error("Event date must be a valid future date.");
    }
    if (["MORNING", "AFTERNOON"].indexOf(session) === -1) {
      throw new Error("Session must be MORNING or AFTERNOON.");
    }
    if (!Number.isInteger(childrenCount) || childrenCount < 1 || childrenCount > 100) {
      throw new Error("Children count must be between 1 and 100.");
    }

    const ss = getDatabase_();
    const location = getActiveLocation_(ss, locationId);
    if (!location) throw new Error("Selected location is unavailable.");

    const existing = findSlotConflict_(ss, eventDate, locationId, session);
    if (existing) throw new Error("Sorry, this location and session is no longer available.");

    const cfg = getPublicConfig_();
    const billableChildren = Math.max(childrenCount, cfg.minimumChildren);
    const isWeekend = isWeekendOrHoliday_(eventDate);
    const unitPrice = isWeekend ? cfg.weekendPackagePrice : cfg.weekdayPackagePrice;
    const venueFee = isWeekend ? Number(location.weekendFee || 0) : Number(location.weekdayFee || 0);
    const bookingTotal = billableChildren * unitPrice + venueFee;
    const depositRequired = Math.ceil(bookingTotal * cfg.depositPercent / 100);
    const now = new Date();
    const expires = new Date(now.getTime() + cfg.slotHoldHours * 60 * 60 * 1000);
    const bookingId = "BM-" + eventDate.replace(/-/g, "") + "-" +
      Utilities.getUuid().replace(/-/g, "").substring(0, 6).toUpperCase();

    const sheet = ss.getSheetByName("Bookings");
    const row = {
      BookingId: bookingId,
      CreatedAt: now,
      UpdatedAt: now,
      CustomerName: name,
      Email: email,
      WhatsApp: whatsapp,
      BirthdayChild: childName,
      BirthdayAge: birthdayAge,
      EventDate: eventDate,
      Session: session,
      LocationId: locationId,
      ChildrenCount: childrenCount,
      PackageUnitPrice: unitPrice,
      VenueFee: venueFee,
      AddOnsTotal: 0,
      BookingTotal: bookingTotal,
      DepositRequired: depositRequired,
      BookingStatus: "Pending Deposit",
      HoldExpiresAt: expires,
      PaymentStatus: "Unpaid",
      SpecialRequest: cleanText_(payload.specialRequest, 1000),
      Source: "Website"
    };
    appendObjectRow_(sheet, row);

    logActivity_(ss, "PUBLIC", "BOOKING_CREATED", "Booking", bookingId,
      "Slot held until " + expires.toISOString());

    return {
      success: true,
      bookingId: bookingId,
      bookingStatus: "Pending Deposit",
      paymentStatus: "Unpaid",
      eventDate: eventDate,
      session: session,
      location: location.name,
      childrenCount: childrenCount,
      billableChildren: billableChildren,
      packageUnitPrice: unitPrice,
      venueFee: venueFee,
      bookingTotal: bookingTotal,
      depositRequired: depositRequired,
      holdExpiresAt: expires.toISOString(),
      currency: cfg.currency
    };
  } finally {
    lock.releaseLock();
  }
}

function getAvailability_(date, locationId) {
  const ss = getDatabase_();
  const locations = getActiveLocations_(ss).filter(function (loc) {
    return !locationId || loc.id === locationId;
  });
  const sessions = ["MORNING", "AFTERNOON"];
  const slots = [];

  locations.forEach(function (loc) {
    sessions.forEach(function (session) {
      const blocked = isSlotBlocked_(ss, date, loc.id, session);
      const conflict = findSlotConflict_(ss, date, loc.id, session);
      slots.push({
        date: date,
        locationId: loc.id,
        location: loc.name,
        session: session,
        status: blocked ? "Blocked" : (conflict ? "Unavailable" : "Available")
      });
    });
  });

  return { success: true, date: date, slots: slots };
}

function expirePendingBookings_() {
  const ss = getDatabase_();
  const sheet = ss.getSheetByName("Bookings");
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return 0;

  const headers = values[0];
  const ix = headerIndexes_(headers);
  const now = new Date();
  let count = 0;

  for (let i = 1; i < values.length; i++) {
    const status = String(values[i][ix.BookingStatus] || "");
    const expires = values[i][ix.HoldExpiresAt];
    if (status === "Pending Deposit" && expires && new Date(expires).getTime() <= now.getTime()) {
      sheet.getRange(i + 1, ix.BookingStatus + 1).setValue("Expired");
      sheet.getRange(i + 1, ix.UpdatedAt + 1).setValue(now);
      count++;
    }
  }
  return count;
}

function findSlotConflict_(ss, date, locationId, session) {
  const sheet = ss.getSheetByName("Bookings");
  const values = sheet.getDataRange().getValues();
  if (values.length > 1) {
    const ix = headerIndexes_(values[0]);
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const status = String(row[ix.BookingStatus] || "");
      const held = status === "Confirmed" || status === "Pending Deposit";
      if (held && dateString_(row[ix.EventDate]) === date &&
          String(row[ix.LocationId]) === locationId &&
          String(row[ix.Session]).toUpperCase() === session) return true;
    }
  }
  return isSlotBlocked_(ss, date, locationId, session);
}

function isSlotBlocked_(ss, date, locationId, session) {
  const sheet = ss.getSheetByName("BlockedSlots");
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return false;
  const ix = headerIndexes_(values[0]);
  return values.slice(1).some(function (row) {
    return dateString_(row[ix.Date]) === date &&
      String(row[ix.LocationId]) === locationId &&
      (String(row[ix.Session]).toUpperCase() === session || String(row[ix.Session]).toUpperCase() === "ALL");
  });
}

function getActiveLocation_(ss, locationId) {
  return getActiveLocations_(ss).filter(function (loc) { return loc.id === locationId; })[0] || null;
}

function getActiveLocations_(ss) {
  const values = ss.getSheetByName("Locations").getDataRange().getValues();
  if (values.length < 2) return [];
  const ix = headerIndexes_(values[0]);
  return values.slice(1).filter(function (row) {
    return row[ix.Active] === true || String(row[ix.Active]).toLowerCase() === "true";
  }).map(function (row) {
    return {
      id: String(row[ix.LocationId]),
      name: String(row[ix.Name]),
      weekdayFee: Number(row[ix.WeekdayFee] || 0),
      weekendFee: Number(row[ix.WeekendFee] || 0)
    };
  });
}

function getPublicConfig_() {
  const ss = getDatabase_();
  const values = ss.getSheetByName("Settings").getDataRange().getValues();
  const settings = {};
  values.slice(1).forEach(function (row) {
    if (row[0]) settings[String(row[0])] = row[1];
  });
  return {
    success: true,
    businessName: settings.BusinessName || "Mookiland Birthday Party",
    currency: settings.Currency || "IDR",
    minimumChildren: Number(settings.MinimumChildren || 10),
    weekdayPackagePrice: Number(settings.WeekdayPackagePrice || 275000),
    weekendPackagePrice: Number(settings.WeekendPackagePrice || 325000),
    depositPercent: Number(settings.DepositPercent || 50),
    slotHoldHours: Number(settings.SlotHoldHours || 72),
    sessions: [
      { id: "MORNING", label: settings.SessionMorningLabel || "Morning" },
      { id: "AFTERNOON", label: settings.SessionAfternoonLabel || "Afternoon" }
    ],
    locations: getActiveLocations_(ss).map(function (loc) {
      return { id: loc.id, name: loc.name, weekdayFee: loc.weekdayFee, weekendFee: loc.weekendFee };
    })
  };
}

function getDatabase_() {
  const id = PropertiesService.getScriptProperties().getProperty("BM_SPREADSHEET_ID");
  if (!id) throw new Error("Database is not configured. Run setupBirthdayMookilandDatabase first.");
  return SpreadsheetApp.openById(id);
}

function appendObjectRow_(sheet, obj) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  sheet.appendRow(headers.map(function (header) {
    return Object.prototype.hasOwnProperty.call(obj, header) ? obj[header] : "";
  }));
}

function logActivity_(ss, actor, action, entityType, entityId, details) {
  ss.getSheetByName("ActivityLog").appendRow([
    new Date(), actor, action, entityType, entityId, details
  ]);
}

function headerIndexes_(headers) {
  const out = {};
  headers.forEach(function (header, index) { out[String(header)] = index; });
  return out;
}

function cleanText_(value, maxLength) {
  return String(value == null ? "" : value).trim().substring(0, maxLength);
}

function isValidDateString_(value) {
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(value)) return false;
  const d = new Date(value + "T00:00:00");
  return !isNaN(d.getTime()) && Utilities.formatDate(d, "UTC", "yyyy-MM-dd") === value;
}

function dateString_(value) {
  if (value instanceof Date) return Utilities.formatDate(value, "Asia/Makassar", "yyyy-MM-dd");
  return String(value || "").substring(0, 10);
}

function todayString_() {
  return Utilities.formatDate(new Date(), "Asia/Makassar", "yyyy-MM-dd");
}

function isWeekendOrHoliday_(dateString) {
  const day = new Date(dateString + "T12:00:00Z").getUTCDay();
  // Public holidays will be maintained in Settings/holiday calendar in a later stage.
  return day === 0 || day === 6;
}

function jsonOutput_(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
