var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var core = require(path.join(__dirname, '..', 'app-core.js'));
var helpers = require('./helpers');
var fake = require('./fake_backend');

var root = path.join(__dirname, '..');

function daysAgo(n) { return fake.bangkokDate(new Date(Date.now() - n * 86400000)); }

/** A synthetic patient on a phone of their own. Only made-up HNs (TEST-…) are used. */
function patient(b, hn, extra) {
  var key = fake.deviceKey();
  var reg = Object.assign({
    token: b.token, schemaVersion: core.PROTOCOL_VERSION, patientId: hn, hn: hn, yearOfBirth: 1950,
    age: new Date().getUTCFullYear() - 1950, sex: 'female', consent: true, consentVersion: core.PDPA_NOTICE_VERSION,
    consentAt: new Date().toISOString(), consentLang: 'th', deviceKey: key
  }, extra);
  var registered = b.post(reg);
  return {
    key: key, hn: hn, reg: reg, registered: registered,
    post: function (record, asHn) {
      return b.post(Object.assign({ token: b.token, schemaVersion: core.PROTOCOL_VERSION, patientId: asHn || hn, deviceKey: key }, record));
    }
  };
}

/** Every cell value in every tab, as text. */
function everyCell(b) {
  var out = [];
  Object.keys(b.sheets).forEach(function (name) {
    b.sheets[name].rows.forEach(function (r) { r.forEach(function (c) { out.push(String(c.text !== undefined ? c.text : c.value)); }); });
  });
  return out;
}

function run() {
  var cases = [];

  cases.push({
    name: "patient A's phone cannot write to, or overwrite, patient B's records",
    fn: function () {
      var b = fake.backend();
      var a = patient(b, 'TEST-000A');
      var p = patient(b, 'TEST-000B');
      helpers.assert(a.registered.ok && p.registered.ok, 'both register');
      helpers.assert(p.post({ date: daysAgo(1), type: 'checkin', heightCm: 160 }).ok, "B's own record");
      var before = JSON.stringify(b.table('CheckIns'));

      // A's genuine key, B's HN: every kind of record, and a registration.
      ['checkin', 'falls', 'adherence', 'nutrition', 'bmd', 'frax'].forEach(function (type) {
        var fields = {
          checkin: { heightCm: 150 }, falls: { injured: 0 }, adherence: { medication: 'alendronate', doseNumber: 1 },
          nutrition: { calciumIntakeMg: 500 }, bmd: { scanDate: daysAgo(1), spineT: -2, lowestT: -2 },
          frax: { tool: 'incomplete' }
        }[type];
        var r = a.post(Object.assign({ date: daysAgo(1), type: type }, fields), 'TEST-000B');
        helpers.assertEqual(r.error, 'device not registered for this patient', type + ' from the wrong phone');
      });
      var takeover = b.post(Object.assign({}, p.reg, { deviceKey: a.key }));
      helpers.assertEqual(takeover.error, 'hn registered on another device', "A cannot claim B's HN");
      // A stranger with a fresh key fares no better.
      var stranger = fake.deviceKey();
      var r2 = b.post({ token: b.token, schemaVersion: core.PROTOCOL_VERSION, patientId: 'TEST-000B', deviceKey: stranger,
        date: daysAgo(1), type: 'checkin', heightCm: 999 });
      helpers.assert(!r2.ok, 'a stranger is refused');

      helpers.assertEqual(JSON.stringify(b.table('CheckIns')), before, "B's rows are exactly as they were");
      helpers.assert(p.post({ date: daysAgo(1), type: 'checkin', tugSeconds: 12 }).ok, 'B still writes');
      helpers.assertEqual(b.overwrites.length, 0, 'no row was written over');
    }
  });

  cases.push({
    name: "patient A's phone cannot read patient B's records back",
    fn: function () {
      var b = fake.backend();
      var a = patient(b, 'TEST-000A');
      var p = patient(b, 'TEST-000B', { sex: 'male' });
      p.post({ date: daysAgo(1), type: 'checkin', heightCm: 163.5 });
      p.post({ date: daysAgo(1), type: 'falls', injured: 1, cause: 'B-private-cause' });
      var pCredential = b.table('Devices').filter(function (d) { return d.patientId === 'TEST-000B'; })[0].credentialId;

      var replies = [
        b.get(),
        a.post({ date: daysAgo(1), type: 'checkin', heightCm: 150 }, 'TEST-000B'),
        a.post({ date: daysAgo(1), type: 'falls', injured: 1, cause: 'x' }, 'TEST-000B'),
        b.post(Object.assign({}, p.reg, { deviceKey: a.key })),
        a.post({ date: daysAgo(1), type: 'checkin', heightCm: 150 }),
        b.post(a.reg)
      ];
      var allowed = ['ok', 'error', 'result', 'version', 'service', 'protocol', 'tokenConfigured', 'sheets'];
      replies.forEach(function (reply) {
        var text = JSON.stringify(reply);
        ['163.5', 'B-private-cause', pCredential, 'male'].forEach(function (secret) {
          helpers.assert(text.indexOf(secret) === -1, 'a reply to A carried B\'s data (' + secret + '): ' + text);
        });
        Object.keys(reply).forEach(function (k) { helpers.assert(allowed.indexOf(k) !== -1, 'unexpected reply field ' + k); });
        if (reply.result) {
          Object.keys(reply.result).forEach(function (k) {
            helpers.assert(['action', 'receiptId', 'version'].indexOf(k) !== -1, 'an acknowledgement carried ' + k);
          });
        }
      });
      // There is no way to ask for rows: the script has no read action at all.
      var gs = fs.readFileSync(path.join(root, 'apps-script', 'Code.gs'), 'utf8');
      helpers.assert(!/e\.parameter/.test(gs), 'doGet must not take parameters');
      helpers.assert(!/getDataRange\(\)\.getValues\(\)[^;]*\n[^\n]*jsonReply/.test(gs), 'no sheet rows are returned in a reply');
    }
  });

  cases.push({
    name: 'the confirmed attack — height 160 rewritten as 999 — fails whoever sends it',
    fn: function () {
      var b = fake.backend();
      var p = patient(b, 'TEST-000B');
      p.post({ date: daysAgo(1), type: 'checkin', heightCm: 160 });
      var attacker = patient(b, 'TEST-000Z');
      helpers.assertEqual(attacker.post({ date: daysAgo(1), type: 'checkin', heightCm: 999 }, 'TEST-000B').error,
        'invalid heightCm', 'refused on the value before identity is even looked at');
      helpers.assertEqual(attacker.post({ date: daysAgo(1), type: 'checkin', heightCm: 170 }, 'TEST-000B').error,
        'device not registered for this patient', 'a plausible value from the wrong phone');
      helpers.assertEqual(p.post({ date: daysAgo(1), type: 'checkin', heightCm: 999 }).error, 'invalid heightCm', 'even from the right phone');
      var rows = b.table('CheckIns');
      helpers.assertEqual(rows.length, 1);
      helpers.assertEqual(rows[0].heightCm, 160, 'the height is still 160');
    }
  });

  cases.push({
    name: 'a valid correction keeps the earlier value and an audit trail',
    fn: function () {
      var b = fake.backend();
      var p = patient(b, 'TEST-000B');
      var day = daysAgo(1);
      var first = p.post({ date: day, type: 'checkin', heightCm: 160 });
      var second = p.post({ date: day, type: 'checkin', heightCm: 158 });
      var third = p.post({ date: day, type: 'checkin', tugSeconds: 11.5 });
      var repeat = p.post({ date: day, type: 'checkin', tugSeconds: 11.5 });
      helpers.assertEqual([first.result.action, second.result.action, third.result.action, repeat.result.action].join(),
        'inserted,corrected,corrected,duplicate_skipped');

      var rows = b.table('CheckIns');
      helpers.assertEqual(rows.map(function (r) { return r.version; }).join(), '1,2,3');
      helpers.assertEqual(rows[0].heightCm, 160, 'version 1 still holds the first value');
      helpers.assertEqual(rows[1].heightCm, 158);
      helpers.assertEqual(rows[1].supersedes, rows[0].receiptId);
      helpers.assertEqual(rows[2].supersedes, rows[1].receiptId);
      helpers.assertEqual(rows[2].heightCm, 158, 'a later version carries the day\'s values forward');
      helpers.assertEqual(rows[2].tugSeconds, 11.5);
      helpers.assertEqual(first.result.receiptId, rows[0].receiptId, 'the acknowledgement names the row it wrote');

      var trail = b.table('Audit').filter(function (a) { return a.request === 'checkin'; });
      helpers.assertEqual(trail.map(function (a) { return a.action; }).join(), 'inserted,corrected,corrected');
      helpers.assertEqual(trail[1].detail, 'changed: heightCm');
      helpers.assertEqual(trail[1].receiptId, rows[1].receiptId);
      helpers.assertEqual(b.overwrites.length, 0, 'the script only ever appends');
    }
  });

  cases.push({
    name: 'invalid registrations fail, and write nothing',
    fn: function () {
      var b = fake.backend();
      var now = Date.now();
      var year = new Date(now).getUTCFullYear();
      var good = {
        token: b.token, schemaVersion: core.PROTOCOL_VERSION, patientId: 'TEST-0001', hn: 'TEST-0001', yearOfBirth: 1950,
        age: year - 1950, sex: 'female', consent: true, consentVersion: core.PDPA_NOTICE_VERSION,
        consentAt: new Date(now).toISOString(), consentLang: 'th', deviceKey: fake.deviceKey()
      };
      function without(k) { var o = Object.assign({}, good); delete o[k]; return o; }
      [
        // The confirmed finding: token and patient ID alone.
        [{ token: b.token, patientId: 'TEST-0001' }, 'app update required'],
        [{ token: b.token, patientId: 'TEST-0001', schemaVersion: core.PROTOCOL_VERSION, deviceKey: fake.deviceKey() }, 'invalid hn'],
        [without('yearOfBirth'), 'missing yearOfBirth'],
        [without('sex'), 'missing sex'],
        [without('age'), 'missing age'],
        [Object.assign({}, good, { consent: false }), 'missing consent'],
        [without('consentVersion'), 'invalid consentVersion'],
        [Object.assign({}, good, { consentVersion: 'pdpa-000000000000' }), 'invalid consentVersion'],
        [without('consentAt'), 'invalid consentAt'],
        [Object.assign({}, good, { consentAt: new Date(now + 5 * 86400000).toISOString() }), 'invalid consentAt'],
        [Object.assign({}, good, { consentAt: new Date(now - 500 * 86400000).toISOString() }), 'invalid consentAt'],
        [Object.assign({}, good, { consentAt: 'yesterday' }), 'invalid consentAt'],
        [Object.assign({}, good, { consentLang: 'fr' }), 'invalid consentLang'],
        [Object.assign({}, good, { hn: 'TEST-0002' }), 'invalid hn'],
        [Object.assign({}, good, { yearOfBirth: '1950' }), 'invalid yearOfBirth'],
        [Object.assign({}, good, { yearOfBirth: year - 10, age: 10 }), 'invalid yearOfBirth'],
        [Object.assign({}, good, { yearOfBirth: 1850, age: year - 1850 }), 'invalid yearOfBirth'],
        [Object.assign({}, good, { age: 30 }), 'invalid age'],
        [Object.assign({}, good, { sex: 'x' }), 'invalid sex'],
        [Object.assign({}, good, { role: 'admin' }), 'unexpected field role'],
        [Object.assign({}, good, { deviceKey: 'abc' }), 'app update required'],
        [Object.assign({}, good, { schemaVersion: 2 }), 'app update required']
      ].forEach(function (pair) {
        var r = b.post(pair[0]);
        helpers.assertEqual(r.ok, false, JSON.stringify(pair[0]).slice(0, 80));
        helpers.assertEqual(r.error, pair[1], 'refusal for ' + pair[1]);
        // The app judges it the same way before sending.
        helpers.assertEqual(core.checkRegistration(pair[0], now)[0], pair[1], 'app and script disagree about ' + pair[1]);
      });
      helpers.assertEqual(Object.keys(b.sheets).length, 0, 'no tab was even created');
      helpers.assert(b.post(good).ok, 'the good one is accepted');
    }
  });

  cases.push({
    name: 'invalid measurements fail, whatever the kind of record',
    fn: function () {
      var b = fake.backend();
      var p = patient(b, 'TEST-0001');
      var day = daysAgo(1);
      function future(n) { return fake.bangkokDate(new Date(Date.now() + n * 86400000)); }
      [
        [{ type: 'checkin', heightCm: 999 }, 'invalid heightCm'],
        [{ type: 'checkin', heightCm: 99 }, 'invalid heightCm'],
        [{ type: 'checkin', heightCm: '160' }, 'invalid heightCm'],
        [{ type: 'checkin', chairStandReps: 61 }, 'invalid chairStandReps'],
        [{ type: 'checkin', chairStandReps: 10.5 }, 'invalid chairStandReps'],
        [{ type: 'checkin', tugSeconds: 0 }, 'invalid tugSeconds'],
        [{ type: 'checkin', balanceLevel: 4 }, 'invalid balanceLevel'],
        [{ type: 'checkin', boneStatus: 'fine' }, 'invalid boneStatus'],
        [{ type: 'checkin', falls: 2 }, 'invalid falls'],
        [{ type: 'checkin' }, 'missing measurement'],
        [{ type: 'checkin', heightCm: 160, weightKg: 60 }, 'unexpected field weightKg'],
        [{ type: 'checkin', heightCm: 160, date: '2026-02-30' }, 'invalid date'],
        [{ type: 'checkin', heightCm: 160, date: '2019-12-31' }, 'invalid date'],
        [{ type: 'checkin', heightCm: 160, date: future(3) }, 'invalid date'],
        [{ type: 'falls', injured: 2 }, 'invalid injured'],
        [{ type: 'falls' }, 'missing injured'],
        [{ type: 'adherence', medication: 'aspirin', doseNumber: 1 }, 'invalid medication'],
        [{ type: 'adherence', medication: 'alendronate', doseNumber: 0 }, 'invalid doseNumber'],
        [{ type: 'nutrition', calciumIntakeMg: -1 }, 'invalid calciumIntakeMg'],
        [{ type: 'nutrition', proteinIntakeG: 5000 }, 'invalid proteinIntakeG'],
        [{ type: 'bmd', scanDate: day, spineT: -7, lowestT: -7 }, 'invalid spineT'],
        [{ type: 'bmd', scanDate: day, spineT: -2, hipT: -3, lowestT: -2 }, 'invalid lowestT'],
        [{ type: 'bmd', scanDate: future(1), spineT: -2, lowestT: -2 }, 'invalid scanDate'],
        [{ type: 'bmd', scanDate: '1985-01-01', spineT: -2, lowestT: -2 }, 'invalid scanDate'],
        [{ type: 'bmd', scanDate: day, lowestT: -2 }, 'missing spineT'],
        [{ type: 'frax', tool: 'app-estimate', weightKg: 60, heightCm: 160, bmi: 30, majorFractureRisk: 10 }, 'invalid bmi'],
        [{ type: 'frax', tool: 'FRAX-official', majorFractureRisk: 5, hipFractureRisk: 9 }, 'invalid hipFractureRisk'],
        [{ type: 'frax', tool: 'FRAX-official' }, 'missing majorFractureRisk'],
        [{ type: 'frax', tool: 'incomplete', weightKg: 300 }, 'invalid weightKg'],
        [{ type: 'frax', tool: 'guess' }, 'invalid tool']
      ].forEach(function (pair) {
        var record = Object.assign({ date: day }, pair[0]);
        var r = p.post(record);
        helpers.assertEqual(r.error, pair[1], JSON.stringify(pair[0]));
        var full = Object.assign({ token: b.token, schemaVersion: core.PROTOCOL_VERSION, patientId: 'TEST-0001', deviceKey: p.key }, record);
        helpers.assertEqual(core.validateRecord(full, fake.bangkokDate(new Date())).errors[0], pair[1], 'the app judges ' + pair[1] + ' differently');
      });
      ['CheckIns', 'Falls', 'Adherence', 'Nutrition', 'Bmd', 'FractureRisk'].forEach(function (tab) {
        helpers.assertEqual(b.table(tab).length, 0, tab + ' should be empty');
      });
      var refusals = b.table('Audit').filter(function (a) { return a.action === 'refused'; });
      helpers.assertEqual(refusals.length, 30, 'each refusal from a genuine phone is logged');

      // And the valid version of each is accepted.
      [
        { type: 'checkin', heightCm: 160, chairStandReps: 12, tugSeconds: 9.8, safetyScore: 14, falls: 0, missedDoses: 1, balanceLevel: 2, boneStatus: 'osteoporosis', fallRisk: 'moderate' },
        { type: 'falls', injured: 1, cause: 'slipped in the bathroom' },
        { type: 'adherence', medication: 'denosumab', doseNumber: 3 },
        { type: 'nutrition', calciumIntakeMg: 650, calciumSupplementMg: 500, vitaminDSupplementIu: 1000, proteinIntakeG: '' },
        { type: 'bmd', scanDate: '2025-06-01', spineT: -2.7, hipT: -2.1, lowestT: -2.7, boneStatus: 'osteoporosis' },
        { type: 'frax', tool: 'app-estimate', weightKg: 52, heightCm: 154, bmi: 21.9, majorFractureRisk: 18, hipFractureRisk: 6.5 }
      ].forEach(function (record) {
        var r = p.post(Object.assign({ date: day }, record));
        helpers.assert(r.ok, record.type + ' refused: ' + r.error);
      });
    }
  });

  cases.push({
    name: 'submissions are limited per phone, per day and per HN, in windows CacheService can hold',
    fn: function () {
      var b = fake.backend();
      var p = patient(b, 'TEST-0001');
      b.ctx.LIMITS.perDevicePerHour = 3;
      for (var i = 1; i <= 3; i++) helpers.assert(p.post({ date: daysAgo(i), type: 'falls', injured: 0 }).ok, 'within the limit');
      helpers.assertEqual(p.post({ date: daysAgo(4), type: 'falls', injured: 0 }).error, 'rate limited, try later');

      var q = patient(b, 'TEST-0002');
      b.ctx.LIMITS.perDevicePerHour = 100;
      b.ctx.LIMITS.versionsPerDay.checkin = 2;
      q.post({ date: daysAgo(1), type: 'checkin', heightCm: 160 });
      q.post({ date: daysAgo(1), type: 'checkin', heightCm: 159 });
      helpers.assertEqual(q.post({ date: daysAgo(1), type: 'checkin', heightCm: 158 }).error, 'too many changes for this date');

      b.ctx.LIMITS.registrationsPerHnPerSixHours = 2;
      var reg = Object.assign({}, q.reg);
      b.post(reg);
      helpers.assertEqual(b.post(reg).error, 'busy, try again', 'repeated registrations for one HN are throttled');

      b.ctx.LIMITS.newDevicesPerHour = 3;
      helpers.assertEqual(patient(b, 'TEST-0003').registered.ok, true);
      helpers.assertEqual(patient(b, 'TEST-0004').registered.error, 'busy, try again', 'new phones per hour are capped');

      helpers.assertEqual(b.post('{"token":"' + b.token + '","pad":"' + new Array(21000).join('a') + '"}').error, 'request too large');
    }
  });

  cases.push({
    name: 'staff move a patient to a new phone by revoking the old one',
    fn: function () {
      var b = fake.backend();
      var old = patient(b, 'TEST-0001');
      var fresh = patient(b, 'TEST-0001');
      helpers.assertEqual(fresh.registered.error, 'hn registered on another device');
      helpers.assertEqual(patient(b, 'TEST-0001', { deviceKey: fresh.key }).registered.error, 'hn registered on another device');
      var devices = b.table('Devices');
      helpers.assertEqual(devices.map(function (d) { return d.status; }).join(), 'active,pending', 'one pending row, however often it asks');
      helpers.assertEqual(b.table('Audit').filter(function (a) { return a.action === 'conflict'; }).length, 1);

      // Staff change the old phone's status in the Devices tab.
      b.sheets.Devices.rows[1][3] = { value: 'revoked' };
      helpers.assert(b.post(fresh.reg).ok, 'the new phone is accepted once the old one is revoked');
      helpers.assertEqual(old.post({ date: daysAgo(1), type: 'falls', injured: 0 }).error, 'device not registered for this patient');
      helpers.assert(fresh.post({ date: daysAgo(1), type: 'falls', injured: 0 }).ok, 'the new phone writes');
      helpers.assertEqual(b.post(old.reg).error, 'device revoked for this patient', 'the revoked phone cannot register back');

      // Revoked with no other phone active (a lost phone): it still cannot come back.
      var lost = patient(b, 'TEST-0002');
      b.sheets.Devices.rows[b.sheets.Devices.rows.length - 1][3] = { value: 'Revoked ' };
      helpers.assertEqual(b.post(lost.reg).error, 'device revoked for this patient');
      helpers.assertEqual(lost.post({ date: daysAgo(1), type: 'falls', injured: 0 }).error, 'device not registered for this patient');
    }
  });

  cases.push({
    name: 'the phone key itself is never stored, only its hash',
    fn: function () {
      var b = fake.backend();
      var p = patient(b, 'TEST-0001');
      p.post({ date: daysAgo(1), type: 'checkin', heightCm: 160 });
      helpers.assertEqual(everyCell(b).filter(function (c) { return c.indexOf(p.key) !== -1; }).length, 0, 'the key reached a cell');
      var hash = crypto.createHash('sha256').update(p.key, 'utf8').digest('hex');
      helpers.assertEqual(b.table('Devices')[0].credentialHash, hash);
      helpers.assertEqual(b.table('CheckIns')[0].credentialId, hash.slice(0, 12), 'rows name the phone that wrote them');
    }
  });

  cases.push({
    name: "an older version's tabs are moved aside intact, not edited",
    fn: function () {
      var b = fake.backend({
        legacySheets: function (f) {
          var old = f.ss.insertSheet('CheckIns');
          old.appendRow(['patientId', 'date', 'heightCm', 'receivedAt']);
          old.appendRow(['4405123', '2026-09-01', 160, 'then']);
        }
      });
      var p = patient(b, 'TEST-0001');
      helpers.assert(p.post({ date: daysAgo(1), type: 'checkin', heightCm: 158 }).ok);
      var aside = b.sheets['CheckIns (before ' + b.ctx.SCRIPT_VERSION + ')'];
      helpers.assert(aside, 'the old tab was renamed');
      helpers.assertEqual(aside.rows.length, 2, 'and kept whole');
      helpers.assertEqual(b.table('CheckIns').length, 1);
      helpers.assertEqual(b.overwrites.length, 0);
    }
  });

  cases.push({
    name: 'an HN, date or text that Sheets would convert is stored exactly as sent',
    fn: function () {
      // Sheets turns "0012345" into the number 12345. The phone's HN would then
      // never match its Devices row again, and every upload would be refused.
      var b = fake.backend();
      ['0012345', '12-3456', '000'].forEach(function (hn) {
        var p = patient(b, hn);
        helpers.assert(p.registered.ok, hn + ' did not register: ' + p.registered.error);
        var first = p.post({ date: daysAgo(1), type: 'falls', injured: 0, cause: '2026-09-01' });
        helpers.assert(first.ok, hn + ': a record after registering was refused: ' + first.error);
        helpers.assertEqual(p.post({ date: daysAgo(1), type: 'checkin', heightCm: 160 }).result.action, 'inserted');
        helpers.assertEqual(p.post({ date: daysAgo(1), type: 'checkin', heightCm: 159 }).result.action, 'corrected',
          hn + ': the second change must find the first');
      });
      var devices = b.table('Devices').map(function (d) { return d.patientId; });
      helpers.assertEqual(devices.join(), '0012345,12-3456,000', 'HNs kept as text');
      helpers.assertEqual(b.table('Falls')[0].cause, '2026-09-01', 'a cause that looks like a date stays text');
    }
  });

  cases.push({
    name: 'staff may add their own columns to the right of a tab',
    fn: function () {
      var b = fake.backend();
      var p = patient(b, 'TEST-0001');
      p.post({ date: daysAgo(1), type: 'checkin', heightCm: 160 });
      var header = b.sheets.CheckIns.rows[0];
      header.push({ value: 'staff note' });
      b.sheets.CheckIns.rows[1].push({ value: 'checked by nurse' });
      helpers.assert(p.post({ date: daysAgo(1), type: 'checkin', heightCm: 159 }).ok, 'refused after a staff column was added');
      helpers.assertEqual(Object.keys(b.sheets).filter(function (n) { return /before/.test(n); }).length, 0,
        'the tab must not be moved aside for a staff column');
      helpers.assertEqual(b.table('CheckIns').length, 2);
    }
  });

  cases.push({
    name: "every fracture-risk estimate the app can show is accepted as it is shown",
    fn: function () {
      // The app's estimate can put the hip figure above the major one for
      // high-risk profiles; that is the clinical calculation, and the rules
      // must not refuse it (only an official FRAX report must have hip <= major).
      var key = core.encodeDeviceKey(new Uint8Array(32));
      var factors = core.FRAX_FACTORS.map(function (f) { return f.id; });
      var checked = 0;
      ['female', 'male'].forEach(function (sex) {
        [50, 65, 75, 85, 95].forEach(function (age) {
          for (var mask = 0; mask < (1 << factors.length); mask += 7) {
            [[35, 160], [60, 160], [90, 170]].forEach(function (wh) {
              [null, -2.5, -4].forEach(function (t) {
                var frax = { weightKg: wh[0], heightCm: wh[1] };
                factors.forEach(function (id, i) { if (mask & (1 << i)) frax[id] = true; });
                var shown = core.fractureRiskToShow(core.buildFraxWorksheet({ age: age, sex: sex }, frax,
                  t === null ? [] : [{ date: '2026-01-01', spineT: t, hipT: t }]));
                var record = { token: 't', schemaVersion: core.PROTOCOL_VERSION, patientId: 'TEST-1', deviceKey: key, date: '2026-09-01', type: 'frax',
                  weightKg: wh[0], heightCm: wh[1], bmi: core.computeBmi(wh[0], wh[1]),
                  tool: !shown ? 'incomplete' : (shown.isOfficial ? 'FRAX-official' : 'app-estimate'),
                  majorFractureRisk: shown && shown.major !== null ? shown.major : '', hipFractureRisk: shown && shown.hip !== null ? shown.hip : '' };
                var errors = core.checkRecord(record, '2026-09-02');
                helpers.assertEqual(errors.join(), '', 'refused: ' + JSON.stringify(record));
                checked += 1;
              });
            });
          }
        });
      });
      helpers.assert(checked > 1000, 'too few estimates checked');
      // A typed official result still has to make sense.
      helpers.assertEqual(core.checkRecord({ token: 't', schemaVersion: core.PROTOCOL_VERSION, patientId: 'TEST-1', deviceKey: key,
        date: '2026-09-01', type: 'frax', tool: 'FRAX-official', majorFractureRisk: 5, hipFractureRisk: 9 }, '2026-09-02')[0], 'invalid hipFractureRisk');
    }
  });

  cases.push({
    name: 'age is counted in the Bangkok year, as on the patient\'s phone',
    fn: function () {
      // 1 January, 01:00 in Bangkok is still 31 December in UTC.
      var newYearBangkok = Date.UTC(2026, 11, 31, 18, 0);
      var reg = { token: 't', schemaVersion: core.PROTOCOL_VERSION, patientId: 'TEST-1', hn: 'TEST-1', yearOfBirth: 2009, age: 18,
        sex: 'female', consent: true, consentVersion: core.PDPA_NOTICE_VERSION, consentAt: new Date(newYearBangkok).toISOString(),
        consentLang: 'th', deviceKey: core.encodeDeviceKey(new Uint8Array(32)) };
      helpers.assertEqual(core.checkRegistration(reg, newYearBangkok).join(), '', 'turning 18 in 2027 (Bangkok) is 18');
    }
  });

  cases.push({
    name: 'the app and the script run the very same rules',
    fn: function () {
      function block(file) {
        var text = fs.readFileSync(path.join(root, file), 'utf8');
        var start = text.indexOf('// ---- submission rules');
        var end = text.indexOf('// ---- end submission rules ----');
        helpers.assert(start !== -1 && end > start, file + ' has no submission rules block');
        return text.slice(start, end).split('\n').map(function (l) { return l.trim(); }).join('\n');
      }
      helpers.assertEqual(block('app-core.js'), block('apps-script/Code.gs'), 'the two copies of the rules differ');

      // The consent version is the notice as shown; editing the notice needs a new version.
      var keys = ['pdpaTitle', 'pdpaBody', 'pdpaCheckbox'];
      var notice = ['th', 'en'].map(function (l) { return keys.map(function (k) { return core.CONTENT[k][l]; }).join('\n'); }).join('\n');
      var version = 'pdpa-' + crypto.createHash('sha256').update(notice, 'utf8').digest('hex').slice(0, 12);
      helpers.assertEqual(core.PDPA_NOTICE_VERSION, version, 'the consent notice changed: add ' + version + ' to CONSENT_VERSIONS in both files');

      // The lists the rules hold match the app's own.
      core.MED_CLASSES.forEach(function (m) { helpers.assert(core.MEDICATIONS.indexOf(m.id) !== -1, m.id + ' missing from MEDICATIONS'); });
      helpers.assertEqual(core.BONE_STATUSES.join(), Object.keys(core.BONE_STATUS).map(function (k) { return core.BONE_STATUS[k]; }).join());
      helpers.assertEqual(core.FALL_RISKS.join(), Object.keys(core.FALL_RISK).map(function (k) { return core.FALL_RISK[k]; }).join());

      // The nutrition estimate at the most every food-frequency answer allows (21 a week) is accepted.
      function every(list, n) { var o = {}; list.forEach(function (f) { o[f.id] = n; }); return o; }
      var most = core.buildNutritionResult({ calcium: every(core.CALCIUM_FOODS, 21), vitaminD: every(core.VITAMIN_D_FOODS, 21),
        protein: every(core.PROTEIN_FOODS, 21), weightKg: 200, sunMinutesPerWeek: 0 }, { age: 60, sex: 'male' });
      var nutritionRecord = { token: 't', schemaVersion: core.PROTOCOL_VERSION, patientId: 'TEST-1', deviceKey: core.encodeDeviceKey(new Uint8Array(32)),
        date: '2026-09-01', type: 'nutrition', calciumIntakeMg: most.calcium.intakeMg, calciumSupplementMg: most.calcium.suggestedSupplementMg,
        vitaminDSupplementIu: most.vitaminD.suggestedSupplementIu, proteinIntakeG: most.protein ? most.protein.intakeG : '' };
      helpers.assertEqual(core.validateRecord(nutritionRecord, '2026-09-02').errors.join(), '', 'the largest nutrition estimate is refused');
      var ui0 = fs.readFileSync(path.join(root, 'app-ui.js'), 'utf8');
      helpers.assert(/numberField\(\{ id: id, step: 1, min: 0, max: 21,/.test(ui0), 'food-frequency limit changed: re-check the nutrition ranges');

      // And the ranges are the app's input limits: nothing it lets a patient enter is refused.
      var ui = fs.readFileSync(path.join(root, 'app-ui.js'), 'utf8');
      [['heightInput', 'checkin', 'heightCm'], ['checkinHeight', 'checkin', 'heightCm'], ['chairStandRepsField', 'checkin', 'chairStandReps'],
        ['bmdSpineT', 'bmd', 'spineT'], ['bmdHipT', 'bmd', 'hipT'], ['fraxWeight', 'frax', 'weightKg'], ['fraxHeight', 'frax', 'heightCm']
      ].forEach(function (f) {
        var m = ui.match(new RegExp("id: '" + f[0] + "'[^}]*min: (-?[\\d.]+), max: (-?[\\d.]+)"));
        helpers.assert(m, f[0] + ' has no min/max');
        var rule = core.RECORD_SCHEMAS[f[1]].fields[f[2]];
        helpers.assertEqual(Number(m[1]) + '..' + Number(m[2]), rule.min + '..' + rule.max, f[0] + ' input range vs rule');
      });
    }
  });

  return helpers.runSuite('t20_identity_audit', cases);
}

module.exports = run;

if (require.main === module) {
  helpers.report(run());
}
