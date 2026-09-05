/**
 * Backend for the "ดูแลกระดูกพรุน" (Osteoporosis Care) app.
 *
 * SETUP — do all four steps, the last one matters most:
 *   1. Open your Google Sheet > Extensions > Apps Script.
 *   2. Delete everything in the editor and paste this whole file in. Save.
 *   3. Deploy > Manage deployments > (pencil icon) > Version: New version
 *      > Deploy.  Saving alone does NOT update the live /exec URL, which is
 *      why an older copy of this script can keep answering requests.
 *   4. Check it worked: open the /exec URL in a browser. You should see
 *      {"ok":true,"service":"osteoporosis-care","version":"2026-09-05", ...}
 *      If the version does not match the one below, step 3 did not take.
 *
 * Access must be "Anyone" (not "Anyone with a Google account"), otherwise
 * Google answers with a login page that the app cannot follow.
 */

var SCRIPT_VERSION = '2026-09-05b';
var SHARED_TOKEN = 'mQ6tfi1HQa0fBNbhzt2AoVk_YKMfmX5v';

var SHEET_COLUMNS = {
  Registrations: ['patientId', 'hn', 'yearOfBirth', 'age', 'sex', 'consent', 'receivedAt'],
  CheckIns: ['patientId', 'date', 'heightCm', 'chairStandReps', 'tugSeconds', 'safetyScore', 'falls', 'missedDoses', 'balanceLevel', 'boneStatus', 'fallRisk', 'receivedAt'],
  Falls: ['patientId', 'date', 'injured', 'cause', 'receivedAt'],
  Adherence: ['patientId', 'date', 'medication', 'doseNumber', 'receivedAt'],
  Nutrition: ['patientId', 'date', 'calciumIntakeMg', 'calciumSupplementMg', 'vitaminDSupplementIu', 'proteinIntakeG', 'receivedAt'],
  Bmd: ['patientId', 'date', 'scanDate', 'spineT', 'hipT', 'lowestT', 'boneStatus', 'receivedAt'],
  FractureRisk: ['patientId', 'date', 'tool', 'weightKg', 'heightCm', 'bmi', 'majorFractureRisk', 'hipFractureRisk', 'receivedAt']
};

/**
 * Records of the same kind on the same day are filled in over the course of
 * that day (height first, then a self-test, then a safety score), so they
 * merge into one row. A second fall on the same day is a real second event,
 * so falls only skip an exact repeat of a record already stored.
 */
var SHEET_ROUTING = {
  checkin: { sheet: 'CheckIns', dedupe: 'merge' },
  nutrition: { sheet: 'Nutrition', dedupe: 'merge' },
  bmd: { sheet: 'Bmd', dedupe: 'merge' },
  frax: { sheet: 'FractureRisk', dedupe: 'merge' },
  adherence: { sheet: 'Adherence', dedupe: 'date' },
  falls: { sheet: 'Falls', dedupe: 'content' }
};

function jsonReply(payload) {
  payload.version = SCRIPT_VERSION;
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Health check: open the /exec URL in a browser to confirm what is deployed. */
function doGet() {
  var sheetNames = [];
  try {
    sheetNames = SpreadsheetApp.getActiveSpreadsheet().getSheets().map(function (s) { return s.getName(); });
  } catch (err) {
    return jsonReply({ ok: false, error: 'This script is not bound to a spreadsheet: ' + err });
  }
  return jsonReply({
    ok: true,
    service: 'osteoporosis-care',
    tokenConfigured: SHARED_TOKEN.indexOf('REPLACE') === -1,
    sheets: sheetNames
  });
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonReply({ ok: false, error: 'no request body' });
    }
    var payload = JSON.parse(e.postData.contents);

    if (payload.token !== SHARED_TOKEN) {
      return jsonReply({ ok: false, error: 'invalid token — the app and this script are using different SHARED_TOKEN values' });
    }
    if (payload.type === undefined) {
      return jsonReply({ ok: true, result: upsertRegistration(payload) });
    }
    return jsonReply({ ok: true, result: appendRecord(payload) });
  } catch (err) {
    return jsonReply({ ok: false, error: String(err) });
  }
}

function ensureSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(SHEET_COLUMNS[name]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function rowFor(columns, payload) {
  return columns.map(function (col) {
    if (col === 'receivedAt') return new Date();
    return payload[col] === undefined ? '' : payload[col];
  });
}

function cellToString(value) {
  if (value instanceof Date) return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return String(value === undefined || value === null ? '' : value);
}

function upsertRegistration(payload) {
  var sheet = ensureSheet('Registrations');
  var columns = SHEET_COLUMNS.Registrations;
  var data = sheet.getDataRange().getValues();
  var patientIdCol = columns.indexOf('patientId');

  for (var r = 1; r < data.length; r++) {
    if (cellToString(data[r][patientIdCol]) === cellToString(payload.patientId)) {
      sheet.getRange(r + 1, 1, 1, columns.length).setValues([rowFor(columns, payload)]);
      return { action: 'updated', sheet: 'Registrations', row: r + 1 };
    }
  }

  sheet.appendRow(rowFor(columns, payload));
  return { action: 'inserted', sheet: 'Registrations', row: sheet.getLastRow() };
}

function appendRecord(payload) {
  var routing = SHEET_ROUTING[payload.type];
  if (!routing) throw new Error('unknown record type: ' + payload.type);

  var sheet = ensureSheet(routing.sheet);
  var columns = SHEET_COLUMNS[routing.sheet];
  var data = sheet.getDataRange().getValues();
  var patientIdCol = columns.indexOf('patientId');
  var dateCol = columns.indexOf('date');

  for (var r = 1; r < data.length; r++) {
    var sameDay = cellToString(data[r][patientIdCol]) === cellToString(payload.patientId) &&
      cellToString(data[r][dateCol]) === cellToString(payload.date);
    if (!sameDay) continue;

    if (routing.dedupe === 'date') {
      return { action: 'duplicate_skipped', sheet: routing.sheet, row: r + 1 };
    }
    if (routing.dedupe === 'content') {
      var identical = true;
      for (var c = 0; c < columns.length; c++) {
        if (columns[c] === 'receivedAt' || payload[columns[c]] === undefined) continue;
        if (cellToString(data[r][c]) !== cellToString(payload[columns[c]])) { identical = false; break; }
      }
      if (identical) return { action: 'duplicate_skipped', sheet: routing.sheet, row: r + 1 };
      continue;
    }

    var merged = columns.map(function (col, i) {
      if (col === 'receivedAt') return new Date();
      return payload[col] === undefined || payload[col] === '' ? data[r][i] : payload[col];
    });
    sheet.getRange(r + 1, 1, 1, columns.length).setValues([merged]);
    return { action: 'merged', sheet: routing.sheet, row: r + 1 };
  }

  sheet.appendRow(rowFor(columns, payload));
  return { action: 'inserted', sheet: routing.sheet, row: sheet.getLastRow() };
}

/** Run this once from the editor to create the tabs and confirm access. */
function setUpSheets() {
  Object.keys(SHEET_COLUMNS).forEach(function (name) { ensureSheet(name); });
  return 'Created/verified: ' + Object.keys(SHEET_COLUMNS).join(', ');
}
