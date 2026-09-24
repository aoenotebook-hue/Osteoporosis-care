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
 *
 * SECURITY — what this script can and cannot promise:
 *   - SHARED_TOKEN is NOT a password. It ships inside the app, and the app's
 *     code is public, so anyone can read it and post here. It only stops stray
 *     requests. Treat every row as patient-reported and unverified.
 *   - Because anyone can post, nothing is trusted: every value is checked
 *     (validate), capped in length, and neutralised before it reaches a cell
 *     (safeCell) so that text such as =IMAGE(...) is stored as text and never
 *     runs as a formula that could pull other patients' rows out of the sheet.
 *   - A registration is never overwritten: a changed one is added as a new row,
 *     so a stranger typing someone else's HN cannot silently replace that
 *     patient's details. Several rows for one HN are worth a look.
 *   - Share the Google Sheet only with the care team. It holds HNs and health
 *     data.
 */

var SCRIPT_VERSION = '2026-09-24';
var SHARED_TOKEN = 'mQ6tfi1HQa0fBNbhzt2AoVk_YKMfmX5v';

var MAX_TEXT = 200;
// Same rule as isValidHn() in app-core.js: letters, digits, '-' and '/',
// starting with a letter or digit, so an HN can never begin a formula.
var HN_PATTERN = /^[A-Za-z0-9][A-Za-z0-9\/-]{0,19}$/;
var DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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
  // One request at a time: two posts arriving together could both miss each
  // other's row in the duplicate check and write the same record twice.
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return jsonReply({ ok: false, error: 'busy, try again' });
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonReply({ ok: false, error: 'no request body' });
    }
    if (e.postData.contents.length > 20000) {
      return jsonReply({ ok: false, error: 'request too large' });
    }
    var payload = JSON.parse(e.postData.contents);

    if (!payload || typeof payload !== 'object' || payload.token !== SHARED_TOKEN) {
      return jsonReply({ ok: false, error: 'invalid token — the app and this script are using different SHARED_TOKEN values' });
    }
    var problem = validate(payload);
    if (problem) return jsonReply({ ok: false, error: problem });

    if (payload.type === undefined) {
      return jsonReply({ ok: true, result: registerPatient(payload) });
    }
    return jsonReply({ ok: true, result: appendRecord(payload) });
  } catch (err) {
    return jsonReply({ ok: false, error: String(err).slice(0, MAX_TEXT) });
  } finally {
    lock.releaseLock();
  }
}

/** The request's shape, before anything is written. Returns a reason, or null. */
function validate(payload) {
  if (typeof payload.patientId !== 'string' || !HN_PATTERN.test(payload.patientId)) return 'invalid patientId';
  if (payload.hn !== undefined && payload.hn !== null &&
      (typeof payload.hn !== 'string' || !HN_PATTERN.test(payload.hn))) return 'invalid hn';
  if (payload.date !== undefined && !(typeof payload.date === 'string' && DATE_PATTERN.test(payload.date))) return 'invalid date';
  if (payload.type !== undefined && !SHEET_ROUTING[payload.type]) return 'unknown record type';
  return null;
}

/**
 * A value made safe to put in a cell. Google Sheets reads any text that starts
 * with = + - or @ as a formula, and anyone can post here (see SECURITY above):
 * a "fall cause" of =IMAGE("https://…"&B2:B) would otherwise send other
 * patients' HNs to a stranger's server the next time the sheet is opened.
 * A leading apostrophe makes Sheets keep it as plain text, and is not shown.
 * Numbers stay numbers; objects and arrays are dropped; text is capped.
 */
function safeCell(value) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value;
  if (typeof value === 'number') return isFinite(value) ? value : '';
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return '';
  var text = value.replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, MAX_TEXT);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
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
    return safeCell(payload[col]);
  });
}

function cellToString(value) {
  if (value instanceof Date) return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return String(value === undefined || value === null ? '' : value);
}

/**
 * A registration identical to one already stored is skipped. A different one
 * for the same HN — a corrected birth year, or somebody else typing that HN —
 * is added as a new row rather than written over the first, so nothing a
 * patient registered can be silently replaced.
 */
function registerPatient(payload) {
  var sheet = ensureSheet('Registrations');
  var columns = SHEET_COLUMNS.Registrations;
  var data = sheet.getDataRange().getValues();
  var incoming = rowFor(columns, payload);

  for (var r = 1; r < data.length; r++) {
    var same = true;
    for (var c = 0; c < columns.length; c++) {
      if (columns[c] === 'receivedAt') continue;
      if (cellToString(data[r][c]) !== cellToString(payload[columns[c]])) { same = false; break; }
    }
    if (same) return { action: 'duplicate_skipped', sheet: 'Registrations', row: r + 1 };
  }

  sheet.appendRow(incoming);
  return { action: 'inserted', sheet: 'Registrations', row: sheet.getLastRow() };
}

function appendRecord(payload) {
  var routing = SHEET_ROUTING[payload.type];
  if (!routing) throw new Error('unknown record type');

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

    // Kept cells go through safeCell too: text stored as text reads back
    // without its apostrophe, and writing it back raw would make it a formula.
    var merged = columns.map(function (col, i) {
      if (col === 'receivedAt') return new Date();
      return safeCell(payload[col] === undefined || payload[col] === '' ? data[r][i] : payload[col]);
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
