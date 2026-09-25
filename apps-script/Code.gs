/**
 * Backend for the "ดูแลกระดูกพรุน" (Osteoporosis Care) app.
 *
 * SETUP — do all five steps, the last two matter most:
 *   1. Open your Google Sheet > Extensions > Apps Script.
 *   2. Delete everything in the editor and paste this whole file in. Save.
 *   3. Project Settings (gear icon) > Time zone: (GMT+07:00) Bangkok.
 *   4. Deploy > Manage deployments > (pencil icon) > Version: New version
 *      > Deploy.  Saving alone does NOT update the live /exec URL, which is
 *      why an older copy of this script can keep answering requests.
 *   5. Check it worked: open the /exec URL in a browser. You should see
 *      {"ok":true,"service":"osteoporosis-care","protocol":3,"version":"2026-09-26", ...}
 *      then run `node tools/verify-backend.js <the /exec URL>` from the repo
 *      (README, "Check the deployed backend"). Until both pass, the fixes in
 *      this file are not live.
 *
 * Access must be "Anyone" (not "Anyone with a Google account"), otherwise
 * Google answers with a login page that the app cannot follow.
 *
 * When a version changes a tab's columns, the first request after deploying
 * moves the old tab aside as "<Name> (before <that version>)" and starts a
 * fresh one. Nothing is deleted; patients' phones register again on their
 * own. 2026-09-25.2 did this; 2026-09-26 changes no columns.
 *
 * READING RESULTS: after saving, reload the spreadsheet. A menu
 * "ดูแลกระดูกพรุน" appears, and two tabs for reading are built and kept up
 * to date each time the file is opened: สรุปผู้ป่วย (one row per patient)
 * and ผลรายครั้ง (every result, newest first). See "readable results" below.
 *
 * SECURITY — what this script can and cannot promise:
 *   - SHARED_TOKEN is NOT a password. It ships inside the app, and the app's
 *     code is public, so anyone can read it. It only stops stray requests.
 *   - Each phone makes a random key at registration and sends it with every
 *     record. The Devices tab keeps a hash of it, bound to that HN. A record
 *     is written only when its key belongs to the HN it names, so knowing
 *     another patient's HN is not enough to write to, or overwrite, their
 *     rows. Nothing here reads patient rows back out to anyone.
 *   - Patients need only their HN: staff hand out no codes. The first phone
 *     to register an HN is bound to it. Another phone for the same HN (a new
 *     phone, a reset app, a tablet) is accepted without staff when the year
 *     of birth and sex it sends match the HN's registration (the clinic's
 *     choice, option C, 2026-09-25); otherwise it waits as "pending".
 *     Guessing is held to LIMITS.registrationsPerHnPerSixHours, and every
 *     miss is in the Audit tab. This proves knowledge of those details, not
 *     identity: someone who knows a patient's HN, birth year and sex can add
 *     a phone. It can add rows under the HN, labelled with its own phone,
 *     but cannot change or supersede the rows another phone wrote.
 *   - Nothing is ever overwritten. A correction to a day's check-in is a new
 *     row with the next version number, naming the row it supersedes, and
 *     each phone keeps its own chain. The Audit tab logs every accepted
 *     change, every additional phone and every mismatch.
 *   - Every value is checked against the same rules the app uses (per-record
 *     fields, types, real dates, clinical ranges, consent evidence), capped,
 *     and passed through safeCell so text such as =IMAGE(...) is stored as
 *     text and never runs as a formula.
 *   - Submissions are limited per phone, per HN and per day (LIMITS).
 *   - Share the Google Sheet only with the care team. It holds HNs and health
 *     data.
 *
 * STAFF — nothing is needed day to day. A "pending" row in Devices is a phone
 * whose year of birth or sex did not match: set it to "active" once you know
 * it is the patient's. A phone that should no longer send (lost, or not the
 * patient's): set it to "revoked"; it then cannot write or register again.
 */

var SCRIPT_VERSION = '2026-09-26';
var SHARED_TOKEN = 'mQ6tfi1HQa0fBNbhzt2AoVk_YKMfmX5v';
var MAX_TEXT = 200;
var MAX_BODY = 20000;

// ---- submission rules: shared with apps-script/Code.gs, keep both copies identical ----
// What the backend accepts, checked the same way in the app (before a record
// is queued) and in the Apps Script (because anyone can post to it). A test
// compares the two copies line by line.

var PROTOCOL_VERSION = 3;
var HN_PATTERN = /^[A-Za-z0-9][A-Za-z0-9\/-]{0,19}$/;
// 32 random bytes, base64url: the phone's key, made at registration.
var DEVICE_KEY_PATTERN = /^[A-Za-z0-9_-]{43}$/;
// 'pdpa-' + the first 12 hex digits of SHA-256 over the consent notice as
// shown (title, body and checkbox; Thai then English). A new wording needs a
// new entry here; older entries stay so records queued offline still arrive.
var CONSENT_VERSIONS = ['pdpa-068d6b909058'];
var CONSENT_LANGS = ['th', 'en'];
var CONSENT_MAX_AGE_DAYS = 400;
var CLOCK_SKEW_MS = 2 * 24 * 60 * 60 * 1000;
var PATIENT_SEXES = ['female', 'male'];
var PATIENT_AGE = { min: 18, max: 120 };
var EARLIEST_RECORD_DATE = '2020-01-01';
var EARLIEST_SCAN_DATE = '1990-01-01';
var BONE_STATUSES = ['unknown', 'normal', 'osteopenia', 'osteoporosis', 'severeOsteoporosis'];
var FALL_RISKS = ['low', 'moderate', 'high'];
// bisphosphonate_weekly is the pre-2026-09 id, still possible in an old queue.
var MEDICATIONS = ['alendronate', 'risedronate', 'ibandronate', 'denosumab', 'zoledronate', 'teriparatide', 'romosozumab', 'bisphosphonate_weekly'];
var FRAX_TOOLS = ['incomplete', 'FRAX-official', 'app-estimate'];

var REGISTRATION_FIELDS = ['token', 'schemaVersion', 'patientId', 'hn', 'yearOfBirth', 'age', 'sex',
  'consent', 'consentVersion', 'consentAt', 'consentLang', 'deviceKey'];
var RECORD_ENVELOPE = ['token', 'schemaVersion', 'patientId', 'deviceKey', 'date', 'type'];

// Ranges are the app's own input limits: nothing the app lets a patient
// enter is refused, and nothing outside what a body can measure is stored.
var RECORD_SCHEMAS = {
  checkin: {
    atLeastOne: true,
    fields: {
      heightCm: { type: 'number', min: 100, max: 210 },
      chairStandReps: { type: 'integer', min: 0, max: 60 },
      tugSeconds: { type: 'number', min: 1, max: 300 },
      safetyScore: { type: 'integer', min: 0, max: 50 },
      falls: { type: 'integer', min: 0, max: 1 },
      missedDoses: { type: 'integer', min: 0, max: 1 },
      balanceLevel: { type: 'integer', min: 1, max: 3 },
      boneStatus: { type: 'enum', values: BONE_STATUSES },
      fallRisk: { type: 'enum', values: FALL_RISKS }
    }
  },
  falls: {
    fields: {
      injured: { type: 'integer', min: 0, max: 1, required: true },
      cause: { type: 'text', max: 200 }
    }
  },
  adherence: {
    fields: {
      medication: { type: 'enum', values: MEDICATIONS, required: true },
      doseNumber: { type: 'integer', min: 1, max: 5000, required: true }
    }
  },
  // Estimates from the food-frequency answers (0-21 servings a week of each
  // food), so the ceiling is what those answers can produce, not intake.
  nutrition: {
    atLeastOne: true,
    fields: {
      calciumIntakeMg: { type: 'number', min: 0, max: 10000 },
      calciumSupplementMg: { type: 'number', min: 0, max: 3000 },
      vitaminDSupplementIu: { type: 'number', min: 0, max: 10000 },
      proteinIntakeG: { type: 'number', min: 0, max: 1500 }
    }
  },
  bmd: {
    fields: {
      scanDate: { type: 'scanDate', required: true },
      spineT: { type: 'number', min: -6, max: 6 },
      hipT: { type: 'number', min: -6, max: 6 },
      lowestT: { type: 'number', min: -6, max: 6, required: true },
      boneStatus: { type: 'enum', values: BONE_STATUSES }
    }
  },
  frax: {
    fields: {
      tool: { type: 'enum', values: FRAX_TOOLS, required: true },
      weightKg: { type: 'number', min: 25, max: 200 },
      heightCm: { type: 'number', min: 100, max: 210 },
      bmi: { type: 'number', min: 10, max: 80 },
      majorFractureRisk: { type: 'number', min: 0, max: 100 },
      hipFractureRisk: { type: 'number', min: 0, max: 100 }
    }
  }
};

function isPresent(value) {
  return value !== undefined && value !== null && value !== '';
}

/** A yyyy-MM-dd string naming a day that exists: 2026-02-30 is refused. */
function isRealDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  var y = Number(value.slice(0, 4));
  var m = Number(value.slice(5, 7));
  var d = Number(value.slice(8, 10));
  var t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

function shiftDate(ymd, days) {
  var t = new Date(Date.UTC(Number(ymd.slice(0, 4)), Number(ymd.slice(5, 7)) - 1, Number(ymd.slice(8, 10)) + days));
  return t.toISOString().slice(0, 10);
}

function isWholeNumber(value) {
  return typeof value === 'number' && isFinite(value) && Math.floor(value) === value;
}

function fieldIsValid(rule, value, payload) {
  if (rule.type === 'number' || rule.type === 'integer') {
    if (typeof value !== 'number' || !isFinite(value)) return false;
    if (rule.type === 'integer' && Math.floor(value) !== value) return false;
    return value >= rule.min && value <= rule.max;
  }
  if (rule.type === 'enum') return rule.values.indexOf(value) !== -1;
  if (rule.type === 'text') return typeof value === 'string' && value.length <= rule.max;
  if (rule.type === 'scanDate') return isRealDate(value) && value >= EARLIEST_SCAN_DATE && value <= payload.date;
  return false;
}

/** Checks that need two fields at once. */
function crossCheck(payload) {
  var errors = [];
  if (payload.type === 'bmd') {
    var scores = [payload.spineT, payload.hipT].filter(isPresent);
    if (!scores.length) errors.push('missing spineT');
    else if (Math.abs(Math.min.apply(null, scores) - payload.lowestT) > 0.001) errors.push('invalid lowestT');
  }
  if (payload.type === 'frax') {
    var hasWeight = isPresent(payload.weightKg);
    var hasHeight = isPresent(payload.heightCm);
    if (isPresent(payload.bmi)) {
      var metres = payload.heightCm / 100;
      if (!hasWeight || !hasHeight) errors.push('invalid bmi');
      else if (Math.abs(Math.round(payload.weightKg / (metres * metres) * 10) / 10 - payload.bmi) > 0.15) errors.push('invalid bmi');
    }
    var hasMajor = isPresent(payload.majorFractureRisk);
    var hasHip = isPresent(payload.hipFractureRisk);
    // On a real FRAX report the hip figure is never the larger: a hip fracture
    // is one of the major osteoporotic fractures. The app's own estimate can
    // put it above for high-risk profiles, and is sent as it is shown.
    if (payload.tool === 'FRAX-official' && hasMajor && hasHip && payload.hipFractureRisk > payload.majorFractureRisk) {
      errors.push('invalid hipFractureRisk');
    }
    if (payload.tool !== 'incomplete' && !hasMajor && !hasHip) errors.push('missing majorFractureRisk');
  }
  return errors;
}

/**
 * Every reason a record would be refused, first one first. todayYmd is the
 * checker's own date; a record may be dated up to one day ahead of it, for
 * the phone and the script sitting either side of midnight.
 */
function checkRecord(payload, todayYmd) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return ['invalid request'];
  if (payload.schemaVersion !== PROTOCOL_VERSION || typeof payload.deviceKey !== 'string' ||
      !DEVICE_KEY_PATTERN.test(payload.deviceKey)) return ['app update required'];
  var schema = Object.prototype.hasOwnProperty.call(RECORD_SCHEMAS, payload.type) ? RECORD_SCHEMAS[payload.type] : null;
  if (!schema) return ['unknown record type'];

  var errors = [];
  if (typeof payload.token !== 'string' || !payload.token) errors.push('missing token');
  if (typeof payload.patientId !== 'string' || !HN_PATTERN.test(payload.patientId)) errors.push('invalid patientId');
  if (!isRealDate(payload.date) || payload.date < EARLIEST_RECORD_DATE || payload.date > shiftDate(todayYmd, 1)) {
    errors.push('invalid date');
  }
  Object.keys(payload).forEach(function (key) {
    if (RECORD_ENVELOPE.indexOf(key) === -1 && !Object.prototype.hasOwnProperty.call(schema.fields, key)) {
      errors.push('unexpected field ' + key);
    }
  });
  var present = 0;
  Object.keys(schema.fields).forEach(function (name) {
    var rule = schema.fields[name];
    if (!isPresent(payload[name])) {
      if (rule.required) errors.push('missing ' + name);
      return;
    }
    present += 1;
    if (!fieldIsValid(rule, payload[name], payload)) errors.push('invalid ' + name);
  });
  if (schema.atLeastOne && present === 0) errors.push('missing measurement');
  return errors.length ? errors : crossCheck(payload);
}

/**
 * Every reason a registration would be refused. The consent fields are the
 * evidence of what was agreed to, in which language and when; they say
 * nothing about who agreed (see "Identity" in the README).
 */
function checkRegistration(payload, nowMs) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return ['invalid request'];
  if (payload.schemaVersion !== PROTOCOL_VERSION || typeof payload.deviceKey !== 'string' ||
      !DEVICE_KEY_PATTERN.test(payload.deviceKey)) return ['app update required'];

  var errors = [];
  Object.keys(payload).forEach(function (key) {
    if (REGISTRATION_FIELDS.indexOf(key) === -1) errors.push('unexpected field ' + key);
  });
  if (typeof payload.token !== 'string' || !payload.token) errors.push('missing token');
  if (typeof payload.patientId !== 'string' || !HN_PATTERN.test(payload.patientId)) errors.push('invalid patientId');
  else if (payload.hn !== payload.patientId) errors.push('invalid hn');

  // The calendar year in Bangkok, as on the patient's phone: in the first
  // hours of 1 January the UTC year is still the old one.
  var year = new Date(nowMs + 7 * 3600000).getUTCFullYear();
  var yob = payload.yearOfBirth;
  if (!isPresent(yob)) errors.push('missing yearOfBirth');
  else if (!isWholeNumber(yob) || year - yob < PATIENT_AGE.min || year - yob > PATIENT_AGE.max) errors.push('invalid yearOfBirth');
  if (!isPresent(payload.age)) errors.push('missing age');
  else if (!isWholeNumber(payload.age) || (isWholeNumber(yob) && Math.abs(year - yob - payload.age) > 1)) errors.push('invalid age');
  if (!isPresent(payload.sex)) errors.push('missing sex');
  else if (PATIENT_SEXES.indexOf(payload.sex) === -1) errors.push('invalid sex');

  if (payload.consent !== true) errors.push('missing consent');
  if (CONSENT_VERSIONS.indexOf(payload.consentVersion) === -1) errors.push('invalid consentVersion');
  var at = typeof payload.consentAt === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/.test(payload.consentAt)
    ? Date.parse(payload.consentAt) : NaN;
  if (isNaN(at) || at > nowMs + CLOCK_SKEW_MS || at < nowMs - CONSENT_MAX_AGE_DAYS * 86400000) errors.push('invalid consentAt');
  if (CONSENT_LANGS.indexOf(payload.consentLang) === -1) errors.push('invalid consentLang');
  return errors;
}
// ---- end submission rules ----

// Windows are at most six hours: CacheService, which counts them, keeps a
// value no longer than that (a longer expiry is refused, and would fail
// every request).
var LIMITS = {
  perDevicePerHour: 120,
  perDevicePerSixHours: 300,
  registrationsPerHnPerSixHours: 10,
  newDevicesPerHour: 60,
  // Versions of one patient's record for one day, beyond which a record is
  // refused for good rather than queued forever.
  versionsPerDay: { checkin: 30, nutrition: 10, bmd: 10, frax: 10, falls: 10, adherence: 1 }
};

var SHEET_COLUMNS = {
  Devices: ['patientId', 'credentialId', 'credentialHash', 'status', 'createdAt', 'note'],
  Registrations: ['patientId', 'hn', 'yearOfBirth', 'age', 'sex', 'consent', 'consentVersion', 'consentAt', 'consentLang',
    'credentialId', 'version', 'supersedes', 'receiptId', 'receivedAt'],
  CheckIns: ['patientId', 'date', 'heightCm', 'chairStandReps', 'tugSeconds', 'safetyScore', 'falls', 'missedDoses',
    'balanceLevel', 'boneStatus', 'fallRisk', 'credentialId', 'version', 'supersedes', 'receiptId', 'receivedAt'],
  Falls: ['patientId', 'date', 'injured', 'cause', 'credentialId', 'receiptId', 'receivedAt'],
  Adherence: ['patientId', 'date', 'medication', 'doseNumber', 'credentialId', 'receiptId', 'receivedAt'],
  Nutrition: ['patientId', 'date', 'calciumIntakeMg', 'calciumSupplementMg', 'vitaminDSupplementIu', 'proteinIntakeG',
    'credentialId', 'version', 'supersedes', 'receiptId', 'receivedAt'],
  Bmd: ['patientId', 'date', 'scanDate', 'spineT', 'hipT', 'lowestT', 'boneStatus', 'credentialId', 'version', 'supersedes',
    'receiptId', 'receivedAt'],
  FractureRisk: ['patientId', 'date', 'tool', 'weightKg', 'heightCm', 'bmi', 'majorFractureRisk', 'hipFractureRisk',
    'credentialId', 'version', 'supersedes', 'receiptId', 'receivedAt'],
  Audit: ['receivedAt', 'receiptId', 'patientId', 'credentialId', 'request', 'date', 'action', 'detail']
};

/**
 * Records of the same kind on the same day are filled in over the course of
 * that day (height first, then a self-test, then a safety score). Each
 * change is a new version row carrying the day's values so far; the highest
 * version for a patient, day and phone is the current one, and the earlier
 * rows are its history. Each phone keeps its own chain, so one phone never
 * supersedes another's rows. A second fall on a day is a second event and
 * gets its own row; an exact repeat is skipped. A second dose on one day is
 * skipped.
 */
var SHEET_ROUTING = {
  checkin: { sheet: 'CheckIns', mode: 'versioned' },
  nutrition: { sheet: 'Nutrition', mode: 'versioned' },
  bmd: { sheet: 'Bmd', mode: 'versioned' },
  frax: { sheet: 'FractureRisk', mode: 'versioned' },
  falls: { sheet: 'Falls', mode: 'event' },
  adherence: { sheet: 'Adherence', mode: 'oncePerDay' }
};

function jsonReply(payload) {
  payload.version = SCRIPT_VERSION;
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function refuse(reason) {
  return jsonReply({ ok: false, error: reason });
}

/** Health check: open the /exec URL in a browser to confirm what is deployed. No patient data. */
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
    protocol: PROTOCOL_VERSION,
    tokenConfigured: SHARED_TOKEN.indexOf('REPLACE') === -1,
    sheets: sheetNames
  });
}

function doPost(e) {
  // One request at a time: two posts arriving together could both miss each
  // other's row and write the same record twice.
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return refuse('busy, try again');
  try {
    if (!e || !e.postData || !e.postData.contents) return refuse('no request body');
    if (e.postData.contents.length > MAX_BODY) return refuse('request too large');
    var payload;
    try { payload = JSON.parse(e.postData.contents); } catch (parseErr) { return refuse('invalid request'); }
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return refuse('invalid request');
    if (payload.token !== SHARED_TOKEN) {
      return refuse('invalid token — the app and this script are using different SHARED_TOKEN values');
    }
    return payload.type === undefined ? handleRegistration(payload) : handleRecord(payload);
  } catch (err) {
    return refuse(String(err).slice(0, MAX_TEXT));
  } finally {
    lock.releaseLock();
  }
}

/* ---------- identity ---------- */

function sha256Hex(text) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8);
  return bytes.map(function (b) { return ((b + 256) % 256).toString(16); })
    .map(function (h) { return h.length === 1 ? '0' + h : h; }).join('');
}

/** The key itself is never stored: only its SHA-256, and a short id for the audit trail. */
function credentialFor(deviceKey) {
  var hash = sha256Hex(deviceKey);
  return { hash: hash, id: hash.slice(0, 12) };
}

function devicesFor(patientId) {
  // A lookup never creates the tab: a refused request leaves the sheet as it was.
  if (!SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Devices')) return [];
  var table = openSheet('Devices');
  var cols = SHEET_COLUMNS.Devices;
  var out = [];
  for (var r = 1; r < table.data.length; r++) {
    var row = table.data[r];
    if (cellToString(row[cols.indexOf('patientId')]) !== patientId) continue;
    out.push({
      id: cellToString(row[cols.indexOf('credentialId')]),
      hash: cellToString(row[cols.indexOf('credentialHash')]),
      status: cellToString(row[cols.indexOf('status')]).trim().toLowerCase()
    });
  }
  return out;
}

function isActiveDevice(patientId, credential) {
  return devicesFor(patientId).some(function (d) { return d.status === 'active' && d.hash === credential.hash; });
}

/* ---------- limits ---------- */

var MAX_CACHE_SECONDS = 21600;

/** Counts one request against a window; true once the window is full. Best effort (CacheService). */
function overLimit(name, limit, seconds) {
  seconds = Math.min(seconds, MAX_CACHE_SECONDS);
  var cache = CacheService.getScriptCache();
  var key = 'limit:' + name + ':' + Math.floor(Date.now() / (seconds * 1000));
  var used = Number(cache.get(key) || 0);
  if (used >= limit) return true;
  cache.put(key, String(used + 1), seconds);
  return false;
}

/* ---------- registration ---------- */

function handleRegistration(payload) {
  var errors = checkRegistration(payload, Date.now());
  if (errors.length) return refuse(errors[0]);
  if (overLimit('reg:' + payload.patientId, LIMITS.registrationsPerHnPerSixHours, 21600)) return refuse('busy, try again');

  var credential = credentialFor(payload.deviceKey);
  var devices = devicesFor(payload.patientId);
  // A phone staff have revoked stays revoked: it cannot register its way back,
  // even when no other phone holds the HN (a lost phone, a withdrawal).
  if (devices.some(function (d) { return d.status === 'revoked' && d.hash === credential.hash; })) {
    return refuse('device revoked for this patient');
  }
  var mine = devices.some(function (d) { return d.status === 'active' && d.hash === credential.hash; });
  var others = devices.filter(function (d) { return d.status === 'active' && d.hash !== credential.hash; });

  if (!mine && others.length && !detailsMatch(payload, others)) {
    // Another phone holds this HN and this one's year of birth or sex differs
    // from that registration. Nothing about the patient is returned (not even
    // which of the two differs); staff can see the attempt and decide.
    var pending = devices.some(function (d) { return d.status === 'pending' && d.hash === credential.hash; });
    if (!pending) {
      appendRow('Devices', { patientId: payload.patientId, credentialId: credential.id, credentialHash: credential.hash,
        status: 'pending', createdAt: new Date(), note: 'year of birth or sex did not match the registration' });
    }
    audit(payload.patientId, credential.id, 'registration', '', 'mismatch', 'year of birth or sex did not match the registration', '');
    return refuse('details do not match this hn');
  }
  if (!mine) {
    if (overLimit('newdevice', LIMITS.newDevicesPerHour, 3600)) return refuse('busy, try again');
    appendRow('Devices', { patientId: payload.patientId, credentialId: credential.id, credentialHash: credential.hash,
      status: 'active', createdAt: new Date(), note: others.length ? 'additional phone: year of birth and sex matched' : '' });
    if (others.length) audit(payload.patientId, credential.id, 'registration', '', 'additional phone', 'year of birth and sex matched', '');
  }
  var result = writeVersioned('Registrations', payload, credential, ['patientId', 'credentialId'], 'registration');
  return jsonReply({ ok: true, result: result });
}

/**
 * Whether the year of birth and sex sent match the latest registration of
 * one of the HN's active phones. A patient's own corrections count: only
 * each phone's latest version is compared, never an earlier one.
 */
function detailsMatch(payload, activeDevices) {
  var table = openSheet('Registrations');
  var cols = SHEET_COLUMNS.Registrations;
  var ids = activeDevices.map(function (d) { return d.id; });
  var latest = {};
  for (var r = 1; r < table.data.length; r++) {
    var row = table.data[r];
    var id = cellToString(row[cols.indexOf('credentialId')]);
    if (cellToString(row[cols.indexOf('patientId')]) !== payload.patientId || ids.indexOf(id) === -1) continue;
    if (!latest[id] || Number(row[cols.indexOf('version')]) > Number(latest[id][cols.indexOf('version')])) latest[id] = row;
  }
  return Object.keys(latest).some(function (id) {
    var row = latest[id];
    return cellToString(row[cols.indexOf('yearOfBirth')]) === cellToString(payload.yearOfBirth) &&
      cellToString(row[cols.indexOf('sex')]) === cellToString(payload.sex);
  });
}

/* ---------- records ---------- */

function handleRecord(payload) {
  var errors = checkRecord(payload, todayInScriptZone());
  var credential = typeof payload.deviceKey === 'string' && DEVICE_KEY_PATTERN.test(payload.deviceKey)
    ? credentialFor(payload.deviceKey) : null;
  var patientId = typeof payload.patientId === 'string' && HN_PATTERN.test(payload.patientId) ? payload.patientId : null;
  var authorised = !!(credential && patientId && isActiveDevice(patientId, credential));

  if (errors.length) {
    // Refusals are logged only for a genuine device: a stranger's junk is not
    // worth a row, and logging it would let anyone grow the sheet.
    if (authorised) audit(patientId, credential.id, payload.type, payload.date, 'refused', errors[0], '');
    return refuse(errors[0]);
  }
  // The same answer whether or not the HN exists, so it cannot be used to
  // find out who is enrolled.
  if (!authorised) return refuse('device not registered for this patient');
  if (overLimit('hour:' + credential.id, LIMITS.perDevicePerHour, 3600) ||
      overLimit('six:' + credential.id, LIMITS.perDevicePerSixHours, 21600)) {
    return refuse('rate limited, try later');
  }

  var routing = SHEET_ROUTING[payload.type];
  var result;
  if (routing.mode === 'versioned') {
    result = writeVersioned(routing.sheet, payload, credential, ['patientId', 'date', 'credentialId'], payload.type);
  } else {
    result = writeEvent(routing, payload, credential);
  }
  return result.refused ? refuse(result.refused) : jsonReply({ ok: true, result: result });
}

/* ---------- writing: append only ---------- */

/**
 * This phone's latest row for the key (patient and phone, or patient, day and
 * phone), with this request's values laid over it, appended as the next
 * version. Returns duplicate_skipped when nothing changed. Existing rows are
 * never written, and another phone's rows are never the base of a version.
 */
function writeVersioned(sheetName, payload, credential, keyColumns, request) {
  var table = openSheet(sheetName);
  var cols = SHEET_COLUMNS[sheetName];
  var versionCol = cols.indexOf('version');
  var latest = null;
  var count = 0;
  for (var r = 1; r < table.data.length; r++) {
    var row = table.data[r];
    var same = keyColumns.every(function (k) {
      return cellToString(row[cols.indexOf(k)]) === (k === 'credentialId' ? credential.id : cellToString(payload[k]));
    });
    if (!same) continue;
    count += 1;
    if (!latest || Number(row[versionCol]) > Number(latest[versionCol])) latest = row;
  }
  var cap = LIMITS.versionsPerDay[request];
  if (cap && count >= cap) return { refused: 'too many changes for this date' };

  var values = {};
  var changed = [];
  cols.forEach(function (col, i) {
    if (['credentialId', 'version', 'supersedes', 'receiptId', 'receivedAt'].indexOf(col) !== -1) return;
    var before = latest ? latest[i] : '';
    var incoming = payload[col];
    if (isPresent(incoming) && cellToString(incoming) !== cellToString(before)) {
      changed.push(col);
      values[col] = incoming;
    } else {
      values[col] = before;
    }
  });
  if (latest && !changed.length) return { action: 'duplicate_skipped' };

  var receiptId = Utilities.getUuid();
  var version = latest ? Number(latest[versionCol]) + 1 : 1;
  values.credentialId = credential.id;
  values.version = version;
  values.supersedes = latest ? latest[cols.indexOf('receiptId')] : '';
  values.receiptId = receiptId;
  values.receivedAt = new Date();
  appendRow(sheetName, values, table.sheet);
  audit(payload.patientId, credential.id, request, payload.date || '', latest ? 'corrected' : 'inserted',
    latest ? 'changed: ' + changed.join(', ') : '', receiptId);
  return { action: latest ? 'corrected' : 'inserted', receiptId: receiptId, version: version };
}

function writeEvent(routing, payload, credential) {
  var table = openSheet(routing.sheet);
  var cols = SHEET_COLUMNS[routing.sheet];
  var sameDay = 0;
  for (var r = 1; r < table.data.length; r++) {
    var row = table.data[r];
    if (cellToString(row[cols.indexOf('patientId')]) !== payload.patientId ||
        cellToString(row[cols.indexOf('date')]) !== payload.date) continue;
    sameDay += 1;
    if (routing.mode === 'oncePerDay') return { action: 'duplicate_skipped' };
    var identical = cols.every(function (col, i) {
      if (['credentialId', 'receiptId', 'receivedAt'].indexOf(col) !== -1 || payload[col] === undefined) return true;
      return cellToString(row[i]) === cellToString(payload[col]);
    });
    if (identical) return { action: 'duplicate_skipped' };
  }
  if (sameDay >= LIMITS.versionsPerDay[payload.type]) return { refused: 'too many changes for this date' };

  var receiptId = Utilities.getUuid();
  var values = {};
  cols.forEach(function (col) { values[col] = payload[col]; });
  values.credentialId = credential.id;
  values.receiptId = receiptId;
  values.receivedAt = new Date();
  appendRow(routing.sheet, values, table.sheet);
  audit(payload.patientId, credential.id, payload.type, payload.date, 'inserted', '', receiptId);
  return { action: 'inserted', receiptId: receiptId };
}

function audit(patientId, credentialId, request, date, action, detail, receiptId) {
  appendRow('Audit', { receivedAt: new Date(), receiptId: receiptId, patientId: patientId, credentialId: credentialId,
    request: request, date: date, action: action, detail: detail });
}

function appendRow(sheetName, values, sheet) {
  var target = sheet || openSheet(sheetName, false).sheet;
  target.appendRow(SHEET_COLUMNS[sheetName].map(function (col) { return safeCell(values[col]); }));
}

/* ---------- sheets ---------- */

/**
 * The tab, and its rows when needData is set (the Audit tab is only ever
 * appended to, so it is never read whole). A tab whose header is not today's
 * columns (an older version of this script) is moved aside under a dated
 * name, never edited, and a fresh tab is started.
 */
function openSheet(name, needData) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var columns = SHEET_COLUMNS[name];
  var sheet = ss.getSheetByName(name);
  if (sheet) {
    if (!sheet.getLastRow()) {
      sheet.appendRow(columns);
      sheet.setFrozenRows(1);
      return { sheet: sheet, data: [columns] };
    }
    // Only this script's columns are compared: staff may add their own to
    // the right without the tab being moved aside.
    var width = Math.min(sheet.getLastColumn(), columns.length);
    var header = width ? sheet.getRange(1, 1, 1, width).getValues()[0].map(cellToString) : [];
    if (header.join('|') === columns.join('|')) {
      return { sheet: sheet, data: needData === false ? null : sheet.getDataRange().getValues() };
    }
    var aside = name + ' (before ' + SCRIPT_VERSION + ')';
    for (var n = 2; ss.getSheetByName(aside); n++) aside = name + ' (before ' + SCRIPT_VERSION + ') ' + n;
    sheet.setName(aside);
  }
  sheet = ss.insertSheet(name);
  sheet.appendRow(columns);
  sheet.setFrozenRows(1);
  return { sheet: sheet, data: [columns] };
}

/**
 * A value made safe to put in a cell. Every piece of text gets a leading
 * apostrophe, which Sheets does not show and which makes it keep the text
 * exactly as sent:
 *   - text starting with = + - or @ would otherwise be a formula, and anyone
 *     can post here: a "fall cause" of =IMAGE("https://…"&B2:B) would send
 *     other patients' HNs to a stranger's server when the sheet is opened;
 *   - text that looks like a number or a date would otherwise be converted:
 *     HN "0012345" would be stored as 12345 and never match its phone again.
 * Numbers stay numbers; objects and arrays are dropped; text is capped.
 */
function safeCell(value) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value;
  if (typeof value === 'number') return isFinite(value) ? value : '';
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return '';
  var text = value.replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, MAX_TEXT);
  return text === '' ? '' : "'" + text;
}

function cellToString(value) {
  if (value instanceof Date) return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return String(value === undefined || value === null ? '' : value);
}

function todayInScriptZone() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

/** Run this once from the editor to create the tabs and confirm access. */
function setUpSheets() {
  Object.keys(SHEET_COLUMNS).forEach(function (name) { openSheet(name); });
  return 'Created/verified: ' + Object.keys(SHEET_COLUMNS).join(', ');
}

/* ---------- readable results for staff ---------- */

/*
 * The tabs above are the record: machine column names, codes, every version
 * and the phone each came from. Staff read two more tabs, rebuilt from them
 * each time the spreadsheet is opened, and from the menu
 * "ดูแลกระดูกพรุน → อัปเดตผลผู้ป่วย":
 *   - สรุปผู้ป่วย: one row per patient, their latest results in words;
 *   - ผลรายครั้ง: every result, newest first, one line each.
 * They hold nothing of their own, so an edit made there is gone at the next
 * rebuild. They show each record's current version only, and nothing from a
 * phone whose status is 'revoked'. Labels and cut-offs are the app's own
 * (tests/t23 compares them with app-core.js), so the sheet says what the
 * patient's screen says. Opening the file never changes the record tabs.
 */
var SUMMARY_TAB = 'สรุปผู้ป่วย';
var RESULTS_TAB = 'ผลรายครั้ง';

var READABLE = {
  sex: { female: 'หญิง', male: 'ชาย' },
  boneStatus: {
    unknown: 'ยังไม่ทราบ',
    normal: 'กระดูกปกติ',
    osteopenia: 'กระดูกบาง (osteopenia)',
    osteoporosis: 'กระดูกพรุน (osteoporosis)',
    severeOsteoporosis: 'กระดูกพรุนที่เคยหักแล้ว (severe osteoporosis)'
  },
  fallRisk: { low: 'โอกาสหกล้มต่ำ', moderate: 'โอกาสหกล้มปานกลาง', high: 'โอกาสหกล้มสูง' },
  balanceLevel: { 1: 'ระดับ 1 — จับที่ยึดตลอด', 2: 'ระดับ 2 — แตะที่ยึดเบา ๆ', 3: 'ระดับ 3 — ทำได้เอง' },
  medication: {
    alendronate: 'ยาเม็ดอะเลนโดรเนต (alendronate)',
    risedronate: 'ยาเม็ดไรซีโดรเนต (risedronate)',
    ibandronate: 'ยาเม็ดไอแบนโดรเนต (ibandronate)',
    denosumab: 'ยาฉีดเดโนซูแมบ (denosumab)',
    zoledronate: 'ยาฉีดเข้าหลอดเลือดดำ โซเลโดรเนต (zoledronate)',
    teriparatide: 'ยาฉีดเทอริพาราไทด์ (teriparatide)',
    romosozumab: 'ยาฉีดโรโมโซซูแมบ (romosozumab)',
    // The pre-2026-09 id: the app maps it to weekly alendronate.
    bisphosphonate_weekly: 'ยาเม็ดอะเลนโดรเนต (alendronate)'
  },
  fraxTool: { 'FRAX-official': 'จากเว็บไซต์ FRAX', 'app-estimate': 'ค่าประมาณจากแอป', incomplete: 'ข้อมูลยังไม่ครบ' }
};

// The app's cut-offs (app-core.js), copied because this script cannot load
// the app; tests/t23 fails if the two drift apart.
var RESULT_RULES = {
  tugSlowSeconds: 12,     // TUG_THRESHOLD_SECONDS: 12 s or longer counts toward high fall risk
  heightLossCm: 2,        // HEIGHT_LOSS_FLAG_CM: tell the doctor, a vertebra may have collapsed
  safetyItems: 20,        // SAFETY_ITEMS.length: the home checklist
  // CHAIR_STAND_NORMS: [from age, to age, fewest stands in 30 s]
  chairStand: {
    male: [[60, 64, 14], [65, 69, 12], [70, 74, 12], [75, 79, 11], [80, 84, 10], [85, 89, 8], [90, 200, 7]],
    female: [[60, 64, 12], [65, 69, 11], [70, 74, 10], [75, 79, 10], [80, 84, 9], [85, 89, 8], [90, 200, 4]]
  }
};

function chairStandNormFor(age, sex) {
  var table = RESULT_RULES.chairStand[sex === 'male' ? 'male' : 'female'];
  for (var i = 0; i < table.length; i++) {
    if (age >= table[i][0] && age <= table[i][1]) return table[i][2];
  }
  return age < 60 ? table[0][2] : table[table.length - 1][2];
}

function calciumTargetFor(age, sex) {
  if (sex === 'female' && age >= 50) return 1200;
  if (sex === 'male' && age >= 70) return 1200;
  return 1000;
}

function proteinTargetFor(weightKg, age) {
  if (!(weightKg > 0)) return null;
  return Math.round(weightKg * (age >= 65 ? 1.2 : 1.0));
}

var THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

function isDateValue(value) {
  return Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime());
}

/** yyyy-MM-dd of a cell, whether Sheets kept it as text or turned it into a date. */
function ymdOf(value) {
  if (isDateValue(value)) return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return cellToString(value).trim();
}

/** 2026-09-25 → "25 ก.ย. 2569": the Buddhist-era year, as the app asks for it. */
function thaiDate(value) {
  var ymd = ymdOf(value);
  if (!isRealDate(ymd)) return ymd;
  return Number(ymd.slice(8, 10)) + ' ' + THAI_MONTHS[Number(ymd.slice(5, 7)) - 1] + ' ' + (Number(ymd.slice(0, 4)) + 543);
}

function thaiDateTime(value) {
  if (!isDateValue(value)) return thaiDate(value);
  var stamp = Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');
  return thaiDate(stamp.slice(0, 10)) + ' ' + stamp.slice(11, 16);
}

function numberIn(value) {
  if (typeof value === 'number') return isFinite(value) ? value : null;
  var text = cellToString(value).trim();
  return text !== '' && isFinite(Number(text)) ? Number(text) : null;
}

/** 1250 → "1,250"; 13.25 → "13.3". */
function formatNumber(value) {
  var rounded = Math.round(value * 10) / 10;
  var parts = String(Math.abs(rounded)).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (rounded < 0 ? '-' : '') + parts.join('.');
}

/** A record tab's rows as objects, or none if it is missing or laid out by an older script. */
function recordRows(name) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet || sheet.getLastRow() < 2) return [];
  var cols = SHEET_COLUMNS[name];
  var values = sheet.getDataRange().getValues();
  if (values[0].slice(0, cols.length).map(cellToString).join('|') !== cols.join('|')) return [];
  return values.slice(1).map(function (row) {
    var out = {};
    cols.forEach(function (col, i) { out[col] = row[i]; });
    out.patientId = cellToString(out.patientId);
    out.credentialId = cellToString(out.credentialId);
    out.date = out.date === undefined ? ymdOf(out.receivedAt) : ymdOf(out.date);
    return out;
  }).filter(function (r) { return r.patientId !== ''; });
}

/** The highest version for each patient, day and phone (each patient and phone, for registrations). */
function currentVersions(rows, byDate) {
  var best = {};
  var order = [];
  rows.forEach(function (row) {
    var key = row.patientId + '|' + (byDate ? row.date + '|' : '') + row.credentialId;
    if (!best[key]) order.push(key);
    if (!best[key] || Number(row.version) > Number(best[key].version)) best[key] = row;
  });
  return order.map(function (key) { return best[key]; });
}

function receivedMs(row) {
  return isDateValue(row.receivedAt) ? row.receivedAt.getTime() : 0;
}

function byDateThenReceived(a, b) {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  return receivedMs(a) - receivedMs(b);
}

/** The newest present value of a field, with the row it came from. */
function latestOf(rows, field) {
  for (var i = rows.length - 1; i >= 0; i--) {
    if (isPresent(rows[i][field]) && cellToString(rows[i][field]).trim() !== '') return { value: rows[i][field], row: rows[i] };
  }
  return null;
}

function label(table, value) {
  var key = cellToString(value).trim();
  return Object.prototype.hasOwnProperty.call(READABLE[table], key) ? READABLE[table][key] : key;
}

/* Sentences for one result each; the patient's age and sex decide the chair-stand norm. */

function chairStandText(reps, patient) {
  var text = formatNumber(reps) + ' ครั้งใน 30 วินาที';
  if (patient.age === null || !patient.sex) return text;
  var norm = chairStandNormFor(patient.age, patient.sex);
  return text + (reps >= norm ? ' (ผ่านเกณฑ์ ' + norm + ')' : ' (ต่ำกว่าเกณฑ์ ' + norm + ')');
}

function tugText(seconds) {
  return formatNumber(seconds) + ' วินาที' +
    (seconds >= RESULT_RULES.tugSlowSeconds ? ' (ช้า: ' + RESULT_RULES.tugSlowSeconds + ' วินาทีขึ้นไป เสี่ยงล้ม)' : ' (ปกติ)');
}

function checkinText(row, patient) {
  var parts = [];
  var n;
  if ((n = numberIn(row.heightCm)) !== null) parts.push('ส่วนสูง ' + formatNumber(n) + ' ซม.');
  if ((n = numberIn(row.chairStandReps)) !== null) parts.push('ลุก-นั่ง ' + chairStandText(n, patient));
  if ((n = numberIn(row.tugSeconds)) !== null) parts.push('ลุกเดินจับเวลา ' + tugText(n));
  if ((n = numberIn(row.safetyScore)) !== null) parts.push('บ้านปลอดภัย ' + formatNumber(n) + '/' + RESULT_RULES.safetyItems + ' ข้อ');
  if ((n = numberIn(row.falls)) !== null) parts.push(n ? 'เดือนนี้ล้ม' : 'เดือนนี้ไม่ล้ม');
  if ((n = numberIn(row.missedDoses)) !== null) parts.push(n ? 'ลืมยาบางครั้ง' : 'ใช้ยาครบ');
  if (isPresent(row.balanceLevel)) parts.push('การทรงตัว' + label('balanceLevel', row.balanceLevel));
  if (isPresent(row.boneStatus)) parts.push('สภาพกระดูก: ' + label('boneStatus', row.boneStatus));
  if (isPresent(row.fallRisk)) parts.push(label('fallRisk', row.fallRisk));
  return parts.join(' · ');
}

function bmdText(row) {
  var parts = [];
  var n;
  if ((n = numberIn(row.spineT)) !== null) parts.push('กระดูกสันหลัง ' + formatNumber(n));
  if ((n = numberIn(row.hipT)) !== null) parts.push('สะโพก ' + formatNumber(n));
  var text = 'T-score ' + parts.join(' · ');
  if (isPresent(row.scanDate)) text += ' (ตรวจ ' + thaiDate(row.scanDate) + ')';
  if (isPresent(row.boneStatus)) text += ' → ' + label('boneStatus', row.boneStatus);
  return text;
}

function fraxText(row) {
  var tool = cellToString(row.tool);
  var major = numberIn(row.majorFractureRisk);
  var hip = numberIn(row.hipFractureRisk);
  if (tool === 'incomplete' || (major === null && hip === null)) return label('fraxTool', 'incomplete');
  var parts = [];
  if (major !== null) parts.push('กระดูกหักสำคัญ ' + formatNumber(major) + '%');
  if (hip !== null) parts.push('สะโพกหัก ' + formatNumber(hip) + '%');
  return parts.join(' · ') + ' (' + label('fraxTool', tool) + ')';
}

function fraxDetailText(row) {
  var parts = [fraxText(row)];
  var n;
  if ((n = numberIn(row.weightKg)) !== null) parts.push('น้ำหนัก ' + formatNumber(n) + ' กก.');
  if ((n = numberIn(row.heightCm)) !== null) parts.push('ส่วนสูง ' + formatNumber(n) + ' ซม.');
  if ((n = numberIn(row.bmi)) !== null) parts.push('BMI ' + formatNumber(n));
  return parts.join(' · ');
}

function nutritionText(row, patient) {
  var parts = [];
  var n;
  if ((n = numberIn(row.calciumIntakeMg)) !== null) {
    var target = patient.age !== null && patient.sex ? calciumTargetFor(patient.age, patient.sex) : null;
    parts.push('แคลเซียมจากอาหาร ~' + formatNumber(n) + ' มก./วัน' + (target ? ' (เป้า ' + formatNumber(target) + ')' : ''));
  }
  if ((n = numberIn(row.calciumSupplementMg)) !== null) parts.push(n ? 'แอปแนะนำแคลเซียมเสริม ' + formatNumber(n) + ' มก./วัน' : 'ไม่ต้องเสริมแคลเซียม');
  if ((n = numberIn(row.vitaminDSupplementIu)) !== null) parts.push('แอปแนะนำวิตามินดี ' + formatNumber(n) + ' IU/วัน');
  if ((n = numberIn(row.proteinIntakeG)) !== null) {
    var protein = proteinTargetFor(patient.weightKg, patient.age === null ? 0 : patient.age);
    parts.push('โปรตีน ~' + formatNumber(n) + ' ก./วัน' + (protein ? ' (เป้า ' + protein + ')' : ''));
  }
  return parts.join(' · ');
}

function fallText(row) {
  var cause = cellToString(row.cause).trim();
  return (numberIn(row.injured) ? 'ล้มและบาดเจ็บ' : 'ล้ม ไม่บาดเจ็บ') + (cause ? ' — ' + cause : '');
}

function doseText(row) {
  var n = numberIn(row.doseNumber);
  return label('medication', row.medication) + (n !== null ? ' ครั้งที่ ' + formatNumber(n) : '');
}

/**
 * Both tabs' rows, built from the record tabs without changing them.
 * todayYmd is the script's own date; falls count over the year before it.
 */
function patientResults(todayYmd) {
  var devices = recordRows('Devices');
  var revoked = {};
  var phones = {};
  devices.forEach(function (d) {
    var status = cellToString(d.status).trim().toLowerCase();
    if (status === 'revoked') revoked[d.patientId + '|' + d.credentialId] = true;
    if (!phones[d.patientId]) phones[d.patientId] = { active: [], pending: 0 };
    if (status === 'active') phones[d.patientId].active.push(d.credentialId);
    if (status === 'pending') phones[d.patientId].pending += 1;
  });
  function kept(rows) { return rows.filter(function (r) { return !revoked[r.patientId + '|' + r.credentialId]; }); }

  var tables = {
    Registrations: currentVersions(kept(recordRows('Registrations')), false),
    CheckIns: currentVersions(kept(recordRows('CheckIns')), true),
    Nutrition: currentVersions(kept(recordRows('Nutrition')), true),
    Bmd: currentVersions(kept(recordRows('Bmd')), true),
    FractureRisk: currentVersions(kept(recordRows('FractureRisk')), true),
    Falls: kept(recordRows('Falls')),
    Adherence: kept(recordRows('Adherence'))
  };
  var ids = [];
  var rowsOf = {};
  Object.keys(tables).forEach(function (name) {
    tables[name].sort(byDateThenReceived);
    tables[name].forEach(function (row) {
      if (!rowsOf[row.patientId]) { rowsOf[row.patientId] = {}; ids.push(row.patientId); }
      (rowsOf[row.patientId][name] = rowsOf[row.patientId][name] || []).push(row);
    });
  });

  var thisYear = Number(todayYmd.slice(0, 4));
  var yearAgo = shiftDate(todayYmd, -365);
  var summary = [];
  var results = [];

  ids.forEach(function (id) {
    var mine = rowsOf[id];
    function list(name) { return mine[name] || []; }
    var registration = list('Registrations').slice().sort(function (a, b) { return receivedMs(a) - receivedMs(b); });
    var reg = registration.length ? registration[registration.length - 1] : {};
    var yob = numberIn(reg.yearOfBirth);
    var weight = latestOf(list('FractureRisk'), 'weightKg');
    var patient = {
      age: yob === null ? null : thisYear - yob,
      sex: cellToString(reg.sex),
      weightKg: weight ? numberIn(weight.value) : null
    };
    var phone = phones[id] || { active: [], pending: 0 };
    // The first phone bound to the HN (Devices keeps them in order) is the
    // patient's own; rows from any other are marked, since a further phone
    // joins on HN, year of birth and sex alone.
    var firstPhone = phone.active.length ? phone.active[0] : '';
    var attention = [];
    var lastMs = 0;

    function addResult(name, type, row, text) {
      if (!text) return;
      var notes = [];
      if (Number(row.version) > 1) notes.push('แก้ไขแล้ว ' + (Number(row.version) - 1) + ' ครั้ง (ประวัติอยู่ในแท็บ ' + name + ')');
      if (firstPhone && row.credentialId && row.credentialId !== firstPhone) notes.push('จากโทรศัพท์เครื่องอื่นของผู้ป่วย');
      results.push({ date: row.date, ms: receivedMs(row), cells: [thaiDate(row.date), id, type, text, notes.join(' · '), thaiDateTime(row.receivedAt)] });
      lastMs = Math.max(lastMs, receivedMs(row));
    }
    registration.forEach(function (row) {
      var n = numberIn(row.yearOfBirth);
      addResult('Registrations', 'ลงทะเบียน', row, [
        n === null ? '' : 'เกิดปี พ.ศ. ' + (n + 543),
        label('sex', row.sex),
        isPresent(row.consentAt) ? 'ยินยอมตามประกาศ PDPA เมื่อ ' + thaiDate(cellToString(row.consentAt).slice(0, 10)) : ''
      ].filter(Boolean).join(' · '));
    });
    list('CheckIns').forEach(function (row) { addResult('CheckIns', 'ติดตามผล', row, checkinText(row, patient)); });
    list('Falls').forEach(function (row) { addResult('Falls', 'การล้ม', row, fallText(row)); });
    list('Adherence').forEach(function (row) { addResult('Adherence', 'ใช้ยา', row, doseText(row)); });
    list('Nutrition').forEach(function (row) { addResult('Nutrition', 'อาหาร', row, nutritionText(row, patient)); });
    list('Bmd').forEach(function (row) { addResult('Bmd', 'ความหนาแน่นกระดูก (BMD)', row, bmdText(row)); });
    list('FractureRisk').forEach(function (row) { addResult('FractureRisk', 'ความเสี่ยงกระดูกหัก (FRAX)', row, fraxDetailText(row)); });

    var checkins = list('CheckIns');
    var when = function (found) { return found ? ' · ' + thaiDate(found.row.date) : ''; };

    var bone = latestOf(checkins, 'boneStatus');
    var bmdBone = latestOf(list('Bmd'), 'boneStatus');
    if (bmdBone && (!bone || bmdBone.row.date > bone.row.date)) bone = bmdBone;

    var bmd = list('Bmd').slice().sort(function (a, b) { return ymdOf(a.scanDate) < ymdOf(b.scanDate) ? -1 : ymdOf(a.scanDate) > ymdOf(b.scanDate) ? 1 : byDateThenReceived(a, b); });
    var latestBmd = bmd.length ? bmd[bmd.length - 1] : null;
    var fraxRows = list('FractureRisk');
    var frax = fraxRows.length ? fraxRows[fraxRows.length - 1] : null;

    var falls = list('Falls').filter(function (r) { return r.date >= yearAgo; });
    var injured = falls.filter(function (r) { return numberIn(r.injured); }).length;
    var fallsText = 'ไม่มี';
    if (falls.length) {
      var lastFall = falls[falls.length - 1];
      fallsText = falls.length + ' ครั้ง' + (injured ? ' (บาดเจ็บ ' + injured + ')' : '') +
        ' · ล่าสุด ' + thaiDate(lastFall.date) + (cellToString(lastFall.cause).trim() ? ': ' + cellToString(lastFall.cause).trim() : '');
      if (injured) attention.push('ล้มแล้วบาดเจ็บ');
      if (falls.length >= 2) attention.push('ล้ม ' + falls.length + ' ครั้งใน 12 เดือน');
    }

    var heights = checkins.filter(function (r) { return numberIn(r.heightCm) !== null; });
    var heightText = '';
    if (heights.length) {
      var first = heights[0];
      var last = heights[heights.length - 1];
      var now = numberIn(last.heightCm);
      var change = Math.round((now - numberIn(first.heightCm)) * 10) / 10;
      heightText = formatNumber(now) + ' ซม.' + when({ row: last });
      if (heights.length > 1) {
        heightText += change < 0 ? ' (ลดลง ' + formatNumber(-change) + ' ซม. จาก ' + thaiDate(first.date) + ')'
          : change > 0 ? ' (เพิ่มขึ้น ' + formatNumber(change) + ' ซม. จาก ' + thaiDate(first.date) + ')'
          : ' (เท่าเดิมตั้งแต่ ' + thaiDate(first.date) + ')';
      }
      if (-change >= RESULT_RULES.heightLossCm) attention.push('ส่วนสูงลดลง ' + formatNumber(-change) + ' ซม.');
    }

    var chair = latestOf(checkins, 'chairStandReps');
    if (chair && patient.age !== null && patient.sex && numberIn(chair.value) < chairStandNormFor(patient.age, patient.sex)) {
      attention.push('ลุก-นั่งต่ำกว่าเกณฑ์');
    }
    var tug = latestOf(checkins, 'tugSeconds');
    if (tug && numberIn(tug.value) >= RESULT_RULES.tugSlowSeconds) attention.push('ลุกเดินจับเวลา ' + RESULT_RULES.tugSlowSeconds + ' วินาทีขึ้นไป');
    var missed = latestOf(checkins, 'missedDoses');
    if (missed && numberIn(missed.value)) attention.push('ลืมยา');
    if (phone.pending) attention.push('มีโทรศัพท์รอยืนยันในแท็บ Devices');

    var balance = latestOf(checkins, 'balanceLevel');
    var safety = latestOf(checkins, 'safetyScore');
    var fallRisk = latestOf(checkins, 'fallRisk');
    var doses = list('Adherence');
    var dose = doses.length ? doses[doses.length - 1] : null;
    var nutritionRows = list('Nutrition');
    var nutrition = nutritionRows.length ? nutritionRows[nutritionRows.length - 1] : null;

    summary.push({ ms: lastMs, cells: [
      id,
      [patient.age === null ? '' : patient.age + ' ปี', label('sex', patient.sex)].filter(Boolean).join(' · '),
      attention.join(' · '),
      bone ? label('boneStatus', bone.value) : '',
      latestBmd ? bmdText(latestBmd).replace(/ → .*$/, '') : '',
      frax ? fraxText(frax) + ' · ' + thaiDate(frax.date) : '',
      fallRisk ? label('fallRisk', fallRisk.value) + when(fallRisk) : '',
      fallsText,
      heightText,
      chair ? chairStandText(numberIn(chair.value), patient) + when(chair) : '',
      tug ? tugText(numberIn(tug.value)) + when(tug) : '',
      balance ? label('balanceLevel', balance.value) : '',
      safety ? formatNumber(numberIn(safety.value)) + '/' + RESULT_RULES.safetyItems + ' ข้อ' + when(safety) : '',
      dose ? doseText(dose) + ' · ' + thaiDate(dose.date) : '',
      missed ? (numberIn(missed.value) ? 'ลืมบางครั้ง' : 'ใช้ยาครบ') + when(missed) : '',
      nutrition ? nutritionText(nutrition, patient) + ' · ' + thaiDate(nutrition.date) : '',
      lastMs ? thaiDateTime(new Date(lastMs)) : '',
      phone.active.length + ' เครื่อง' + (phone.pending ? ' (รอยืนยัน ' + phone.pending + ')' : '')
    ] });
  });

  summary.sort(function (a, b) { return b.ms - a.ms; });
  results.sort(function (a, b) { return a.date !== b.date ? (a.date < b.date ? 1 : -1) : b.ms - a.ms; });
  return {
    summary: summary.map(function (r) { return r.cells; }),
    results: results.map(function (r) { return r.cells; })
  };
}

var SUMMARY_HEADER = ['HN', 'อายุ · เพศ\nAge · sex', 'ควรดู\nNeeds attention', 'สภาพกระดูก\nBone condition',
  'BMD ล่าสุด (T-score)\nLatest BMD', 'ความเสี่ยงกระดูกหัก 10 ปี\nFRAX', 'โอกาสหกล้ม\nFall risk',
  'การล้มใน 12 เดือน\nFalls, 12 months', 'ส่วนสูง\nHeight', 'ลุก-นั่งเก้าอี้ 30 วินาที\nChair stand',
  'ลุกเดินจับเวลา (TUG)\nTimed Up and Go', 'ระดับการทรงตัว\nBalance level', 'บ้านปลอดภัย\nHome safety',
  'ยาล่าสุด\nLatest dose', 'การใช้ยาเดือนล่าสุด\nMissed doses', 'อาหาร\nNutrition', 'ส่งข้อมูลล่าสุด\nLast sent',
  'โทรศัพท์\nPhones'];
var SUMMARY_WIDTHS = [110, 110, 220, 200, 230, 260, 170, 230, 260, 220, 230, 190, 150, 260, 150, 380, 140, 110];
var RESULTS_HEADER = ['วันที่\nDate', 'HN', 'เรื่อง\nType', 'ผล\nResult', 'หมายเหตุ\nNote', 'ได้รับเมื่อ\nReceived'];
var RESULTS_WIDTHS = [110, 110, 170, 560, 260, 140];

/**
 * Text for a readable tab. Like safeCell, every piece of text is kept as
 * text, so a fall cause of "=IMAGE(…)" or a T-score of "-2.8" is shown, never
 * run; unlike it, the line break in a header survives and a sentence is not
 * cut at a patient field's length.
 */
function readableCell(value) {
  if (typeof value === 'number') return isFinite(value) ? value : '';
  var text = cellToString(value).replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, ' ').slice(0, 5000);
  return text === '' ? '' : "'" + text;
}

function writeReadableTab(name, position, title, header, widths, rows, highlightColumn) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name) || ss.insertSheet(name, position);
  var filter = sheet.getFilter();
  if (filter) filter.remove();
  sheet.clear(); // contents and formatting, so no highlight outlives its row
  var blank = header.map(function () { return ''; });
  var values = [[title].concat(blank.slice(1)), header].concat(rows).map(function (row) { return row.map(readableCell); });
  sheet.getRange(1, 1, values.length, header.length).setValues(values);
  sheet.setFrozenRows(2);
  sheet.getRange(1, 1).setFontWeight('bold');
  sheet.getRange(2, 1, 1, header.length).setFontWeight('bold').setBackground('#e8f0fb').setWrap(true);
  if (rows.length) {
    sheet.getRange(3, 1, rows.length, header.length).setWrap(true).setVerticalAlignment('top');
    if (highlightColumn) {
      sheet.getRange(3, highlightColumn, rows.length, 1).setBackgrounds(rows.map(function (row) {
        return [row[highlightColumn - 1] ? '#fde2e1' : null];
      }));
    }
  }
  widths.forEach(function (w, i) { sheet.setColumnWidth(i + 1, w); });
  sheet.getRange(2, 1, rows.length + 1, header.length).createFilter();
}

/** Rebuilds สรุปผู้ป่วย and ผลรายครั้ง. Run from the menu, or on its own each time the file opens. */
function refreshPatientResults() {
  var built = patientResults(todayInScriptZone());
  var stamp = 'อัปเดต ' + thaiDateTime(new Date()) +
    ' · สร้างใหม่จากแท็บข้อมูลทุกครั้งที่เปิดไฟล์ แก้ไขในแท็บนี้จะหายไป · ไม่รวมข้อมูลจากโทรศัพท์ที่ยกเลิก (revoked)' +
    ' / Rebuilt from the data tabs each time the file opens; edits here are lost.';
  writeReadableTab(SUMMARY_TAB, 0, 'สรุปผลผู้ป่วย · ' + built.summary.length + ' คน · ' + stamp,
    SUMMARY_HEADER, SUMMARY_WIDTHS, built.summary, SUMMARY_HEADER.indexOf('ควรดู\nNeeds attention') + 1);
  writeReadableTab(RESULTS_TAB, 1, 'ผลรายครั้ง ใหม่สุดอยู่บน · ' + built.results.length + ' รายการ · ' + stamp,
    RESULTS_HEADER, RESULTS_WIDTHS, built.results);
  return 'Updated ' + built.summary.length + ' patients, ' + built.results.length + ' results';
}

/** Simple trigger: adds the menu and brings the readable tabs up to date. */
function onOpen() {
  try {
    SpreadsheetApp.getUi().createMenu('ดูแลกระดูกพรุน')
      .addItem('อัปเดตผลผู้ป่วย / Update patient results', 'refreshPatientResults')
      .addToUi();
  } catch (err) {
    // No menu outside the spreadsheet's own window.
  }
  try {
    refreshPatientResults();
  } catch (err) {
    // A viewer without edit rights cannot rebuild; the tabs stay as they were.
    if (typeof console !== 'undefined') console.log('refreshPatientResults: ' + err);
  }
}
