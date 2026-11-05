/**
 * Birthday Mookiland Apps Script Web App.
 * Deployment and booking endpoints will be expanded in the next implementation stage.
 */
function doGet(e) {
  const action = e && e.parameter && e.parameter.action
    ? String(e.parameter.action)
    : "health";

  if (action === "health") {
    return jsonOutput_({
      success: true,
      app: "Mookiland Birthday Booking API",
      status: "setup-required-or-ready",
      setupCompleted: Boolean(
        PropertiesService.getScriptProperties().getProperty("BM_SPREADSHEET_ID")
      ),
      timestamp: new Date().toISOString()
    });
  }

  if (action === "config") {
    return jsonOutput_(getPublicConfig_());
  }

  return jsonOutput_({
    success: false,
    error: "Unknown action."
  });
}

function doPost(e) {
  return jsonOutput_({
    success: false,
    error: "Booking endpoints are not enabled yet. Complete database setup first."
  });
}

function getPublicConfig_() {
  const props = PropertiesService.getScriptProperties();
  const spreadsheetId = props.getProperty("BM_SPREADSHEET_ID");
  if (!spreadsheetId) {
    return { success: false, error: "Database has not been initialized." };
  }

  const ss = SpreadsheetApp.openById(spreadsheetId);
  const settingsSheet = ss.getSheetByName("Settings");
  const values = settingsSheet.getDataRange().getValues();
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
    ]
  };
}

function jsonOutput_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
