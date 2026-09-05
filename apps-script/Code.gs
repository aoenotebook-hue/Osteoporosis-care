/**
 * Backend for the "ดูแลกระดูกพรุน" (Osteoporosis Care) PWA.
 * Deploy as a Web App (Execute as: Me, Access: Anyone) bound to a
 * Google Sheet. Tabs are created automatically on first write.
 *
 * SHARED_TOKEN must match the value in index.html. After editing this
 * file, use Deploy > Manage deployments > Edit > New version, or the
 * live /exec URL keeps running the old code.
 */

var SHARED_TOKEN = 'mQ6tfi1HQa0fBNbhzt2AoVk_YKMfmX5v';

var SHEET_COLUMNS = {
  Registrations: ['patientId', 'hn', 'hnUnknown', 'yearOfBirth', 'age', 'sex', 'consent', 'receivedAt'],
  CheckIns: ['patientId', 'date', 'heightCm', 'chairStandReps', 'tugSeconds', 'safetyScore', 'falls', 'missedDoses', 'balanceLevel', 'receivedAt'],
  Falls: ['patientId', 'date', 'injured', 'cause', 'receivedAt'],
  Adherence: ['patientId', 'date', 'receivedAt'],
  Nutrition: ['patientId', 'date', 'calciumIntakeMg', 'calciumSupplementMg', 'vitaminDSupplementIu', 'proteinIntakeG', 'receivedAt']
};

function doPost(e) {
  var output;
  try {
    var payload = JSON.parse(e.postData.contents);
    if (payload.token !== SHARED_TOKEN) {
      output = { ok: false, error: 'invalid token' };
    } else if (payload.type === undefined) {
      output = { ok: true, result: upsertRegistration(payload) };
    } else {
      output = { ok: true, result: appendDedupedRecord(payload) };
    }
  } catch (err) {
    output = { ok: false, error: String(err) };
  }
  return ContentService.createTextOutput(JSON.stringify(output)).setMimeType(ContentService.MimeType.JSON);
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

function upsertRegistration(payload) {
  var sheet = ensureSheet('Registrations');
  var columns = SHEET_COLUMNS.Registrations;
  var data = sheet.getDataRange().getValues();
  var patientIdCol = columns.indexOf('patientId');

  for (var r = 1; r < data.length; r++) {
    if (data[r][patientIdCol] === payload.patientId) {
      sheet.getRange(r + 1, 1, 1, columns.length).setValues([rowFor(columns, payload)]);
      return { action: 'updated', row: r + 1 };
    }
  }

  sheet.appendRow(rowFor(columns, payload));
  return { action: 'inserted', row: sheet.getLastRow() };
}

/**
 * A day can carry several different check-in measurements (height, then a
 * self-test, then a safety score), so those merge into one row per day
 * instead of the later ones being dropped as duplicates. A second fall on
 * the same day is a real event, so falls dedupe on their full content -
 * only a resent identical record is skipped.
 */
var SHEET_ROUTING = {
  checkin: { sheet: 'CheckIns', dedupe: 'merge' },
  nutrition: { sheet: 'Nutrition', dedupe: 'merge' },
  adherence: { sheet: 'Adherence', dedupe: 'date' },
  falls: { sheet: 'Falls', dedupe: 'content' }
};

function cellToString(value) {
  if (value instanceof Date) return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return String(value === undefined || value === null ? '' : value);
}

function appendDedupedRecord(payload) {
  var routing = SHEET_ROUTING[payload.type];
  if (!routing) throw new Error('unknown record type: ' + payload.type);

  var sheet = ensureSheet(routing.sheet);
  var columns = SHEET_COLUMNS[routing.sheet];
  var data = sheet.getDataRange().getValues();
  var patientIdCol = columns.indexOf('patientId');
  var dateCol = columns.indexOf('date');

  for (var r = 1; r < data.length; r++) {
    var sameDay = data[r][patientIdCol] === payload.patientId && cellToString(data[r][dateCol]) === payload.date;
    if (!sameDay) continue;

    if (routing.dedupe === 'date') {
      return { action: 'duplicate_skipped', row: r + 1 };
    }
    if (routing.dedupe === 'content') {
      var identical = columns.every(function (col, i) {
        if (col === 'receivedAt' || payload[col] === undefined) return true;
        return cellToString(data[r][i]) === cellToString(payload[col]);
      });
      if (identical) return { action: 'duplicate_skipped', row: r + 1 };
      continue;
    }

    var merged = columns.map(function (col, i) {
      if (col === 'receivedAt') return new Date();
      return payload[col] === undefined || payload[col] === '' ? data[r][i] : payload[col];
    });
    sheet.getRange(r + 1, 1, 1, columns.length).setValues([merged]);
    return { action: 'merged', row: r + 1 };
  }

  sheet.appendRow(rowFor(columns, payload));
  return { action: 'inserted', row: sheet.getLastRow() };
}
