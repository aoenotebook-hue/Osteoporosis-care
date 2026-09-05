/**
 * Backend for the "ดูแลกระดูก" (Bone Health Companion) PWA.
 * Deploy as a Web App (Execute as: Me, Access: Anyone) bound to a
 * Google Sheet with the tabs created by ensureSheet() below.
 *
 * After deploying, copy the Web App URL into WEBHOOK_URL and the
 * SHARED_TOKEN value below into SHARED_TOKEN in index.html.
 */

var SHARED_TOKEN = 'REPLACE_WITH_SHARED_TOKEN';

var SHEET_COLUMNS = {
  Registrations: ['patientId', 'hn', 'hnUnknown', 'name', 'phone', 'yearOfBirth', 'sex', 'consent', 'receivedAt'],
  CheckIns: ['patientId', 'date', 'heightCm', 'chairStandReps', 'tugSeconds', 'receivedAt'],
  Falls: ['patientId', 'date', 'injured', 'cause', 'receivedAt'],
  Adherence: ['patientId', 'date', 'receivedAt'],
  Exercise: ['patientId', 'date', 'group', 'receivedAt']
};

function doPost(e) {
  var output;
  try {
    var payload = JSON.parse(e.postData.contents);
    if (payload.token !== SHARED_TOKEN) {
      output = { ok: false, error: 'invalid token' };
    } else if (payload.type === undefined && payload.name !== undefined) {
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
  }
  return sheet;
}

function upsertRegistration(payload) {
  var sheet = ensureSheet('Registrations');
  var columns = SHEET_COLUMNS.Registrations;
  var data = sheet.getDataRange().getValues();
  var patientIdCol = columns.indexOf('patientId');

  for (var r = 1; r < data.length; r++) {
    if (data[r][patientIdCol] === payload.patientId) {
      var rowValues = columns.map(function (col) {
        return col === 'receivedAt' ? new Date() : payload[col];
      });
      sheet.getRange(r + 1, 1, 1, columns.length).setValues([rowValues]);
      return { action: 'updated', row: r + 1 };
    }
  }

  var newRow = columns.map(function (col) {
    return col === 'receivedAt' ? new Date() : payload[col];
  });
  sheet.appendRow(newRow);
  return { action: 'inserted', row: sheet.getLastRow() };
}

function typeToSheetName(type) {
  var map = { checkin: 'CheckIns', falls: 'Falls', adherence: 'Adherence', exercise: 'Exercise' };
  return map[type];
}

function appendDedupedRecord(payload) {
  var sheetName = typeToSheetName(payload.type);
  if (!sheetName) throw new Error('unknown record type: ' + payload.type);

  var sheet = ensureSheet(sheetName);
  var columns = SHEET_COLUMNS[sheetName];
  var data = sheet.getDataRange().getValues();
  var patientIdCol = columns.indexOf('patientId');
  var dateCol = columns.indexOf('date');

  for (var r = 1; r < data.length; r++) {
    if (data[r][patientIdCol] === payload.patientId && data[r][dateCol] === payload.date) {
      return { action: 'duplicate_skipped', row: r + 1 };
    }
  }

  var newRow = columns.map(function (col) {
    return col === 'receivedAt' ? new Date() : payload[col];
  });
  sheet.appendRow(newRow);
  return { action: 'inserted', row: sheet.getLastRow() };
}
