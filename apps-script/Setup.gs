/**
 * Run setupBirthdayMookilandDatabase() once from the Apps Script editor.
 * It creates a dedicated spreadsheet and initializes the database tabs.
 */
function setupBirthdayMookilandDatabase() {
  const props = PropertiesService.getScriptProperties();
  let spreadsheetId = props.getProperty("BM_SPREADSHEET_ID");
  let spreadsheet;

  if (spreadsheetId) {
    try {
      spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    } catch (error) {
      throw new Error(
        "The saved database spreadsheet cannot be opened. Check access or clear BM_SPREADSHEET_ID before running setup again. " +
        error.message
      );
    }
  } else {
    spreadsheet = SpreadsheetApp.create("Mookiland Birthday Booking Database");
    spreadsheetId = spreadsheet.getId();
    props.setProperty("BM_SPREADSHEET_ID", spreadsheetId);
  }

  initializeBirthdayMookilandSheets_(spreadsheet);
  props.setProperty("BM_SETUP_COMPLETED_AT", new Date().toISOString());

  const result = {
    success: true,
    spreadsheetId: spreadsheetId,
    spreadsheetUrl: spreadsheet.getUrl(),
    sheets: Object.keys(BM_SCHEMA),
    message: "Birthday Mookiland database is ready."
  };

  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function initializeBirthdayMookilandSheets_(spreadsheet) {
  Object.keys(BM_SCHEMA).forEach(function (sheetName) {
    let sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) sheet = spreadsheet.insertSheet(sheetName);

    const headers = BM_SCHEMA[sheetName];
    const current = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    const isBlank = current.every(function (value) { return value === ""; });

    if (isBlank) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight("bold")
        .setBackground("#173f35")
        .setFontColor("#ffffff");
      sheet.autoResizeColumns(1, headers.length);
    } else {
      const mismatch = headers.some(function (header, index) {
        return current[index] !== header;
      });
      if (mismatch) {
        throw new Error(
          "Header mismatch in sheet '" + sheetName +
          "'. Setup stopped to avoid overwriting existing data."
        );
      }
    }
  });

  seedSheetIfEmpty_(spreadsheet.getSheetByName("Settings"), ["Key", "Value", "UpdatedAt"],
    BM_DEFAULT_SETTINGS.map(function (row) { return [row[0], row[1], new Date()]; }));

  seedSheetIfEmpty_(spreadsheet.getSheetByName("Locations"), BM_SCHEMA.Locations, BM_DEFAULT_LOCATIONS);

  seedSheetIfEmpty_(spreadsheet.getSheetByName("Packages"), BM_SCHEMA.Packages, [
    ["BIRTHDAY-STD", "Mookiland Birthday Package", 275000, 325000, 10, true]
  ]);

  const admin = "dwi.purnami@mookiland.com";
  const adminSheet = spreadsheet.getSheetByName("AdminUsers");
  if (adminSheet.getLastRow() < 2) {
    adminSheet.appendRow([admin, "OWNER", true, new Date()]);
  }

  const defaultSheet = spreadsheet.getSheetByName("Sheet1");
  if (defaultSheet && spreadsheet.getSheets().length > 1 && defaultSheet.getLastRow() === 0) {
    spreadsheet.deleteSheet(defaultSheet);
  }
}

function seedSheetIfEmpty_(sheet, headers, rows) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight("bold")
      .setBackground("#173f35")
      .setFontColor("#ffffff");
  }
  if (sheet.getLastRow() === 1 && rows.length) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
}
