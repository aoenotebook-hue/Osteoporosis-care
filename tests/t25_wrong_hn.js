var path = require('path');
var fs = require('fs');
var core = require(path.join(__dirname, '..', 'app-core.js'));
var helpers = require('./helpers');
var fake = require('./fake_backend');

function daysAgo(n) { return fake.bangkokDate(new Date(Date.now() - n * 86400000)); }
var YEAR = Number(fake.bangkokDate(new Date()).slice(0, 4));

/** A synthetic phone. Only made-up HNs (TEST-…) are used. */
function phone(b, yob, sex) {
  var key = fake.deviceKey();
  var hash = require('crypto').createHash('sha256').update(key).digest('hex');
  var base = { token: b.token, schemaVersion: core.PROTOCOL_VERSION, deviceKey: key };
  return {
    key: key,
    id: hash.slice(0, 12),
    register: function (hn) {
      return b.post(Object.assign({}, base, { patientId: hn, hn: hn, yearOfBirth: yob, age: YEAR - yob, sex: sex, consent: true,
        consentVersion: core.PDPA_NOTICE_VERSION, consentAt: new Date().toISOString(), consentLang: 'th' }));
    },
    send: function (hn, record) { return b.post(Object.assign({}, base, { patientId: hn }, record)); },
    release: function (hn, extra) { return b.post(Object.assign({}, base, { patientId: hn, request: 'release' }, extra)); }
  };
}

function statusOf(b, hn, p) {
  return b.table('Devices').filter(function (d) { return String(d.patientId) === hn && d.credentialId === p.id; })
    .map(function (d) { return d.status; }).join(',');
}

function summaryRow(b, hn) {
  var rows = b.sheets['สรุปผู้ป่วย'].rows.map(function (r) { return r.map(function (c) { return String(c.text !== undefined ? c.text : c.value); }); });
  var header = rows[1];
  var row = rows.filter(function (r) { return r[0] === hn; })[0];
  if (!row) return null;
  var out = {};
  header.forEach(function (h, i) { out[h.split('\n')[1] || h] = row[i]; });
  return out;
}

function resultLines(b, hn) {
  return b.sheets['ผลรายครั้ง'].rows.slice(2).map(function (r) { return r.map(function (c) { return String(c.text !== undefined ? c.text : c.value); }); })
    .filter(function (r) { return r[1] === hn; });
}

function run() {
  var cases = [];

  cases.push({
    name: 'a patient who typed someone else\'s HN can let it go, and the owner then registers without staff',
    fn: function () {
      var b = fake.backend();
      var typo = phone(b, 1950, 'female');
      var owner = phone(b, 1944, 'male');
      helpers.assert(typo.register('TEST-OWNER').ok, 'the typo registers first');
      helpers.assert(typo.send('TEST-OWNER', { date: daysAgo(2), type: 'checkin', heightCm: 150 }).ok, 'and sends a height');
      helpers.assertEqual(owner.register('TEST-OWNER').error, 'details do not match this hn', 'the owner is held back');
      helpers.assertEqual(statusOf(b, 'TEST-OWNER', owner), 'pending');
      var note = b.table('Devices').filter(function (d) { return d.status === 'pending'; })[0].note;
      helpers.assert(/typed it wrong/.test(note) && /wrong-hn/.test(note), 'staff are told what to check: ' + note);

      var r = typo.release('TEST-OWNER');
      helpers.assert(r.ok && r.result.action === 'released', 'released: ' + JSON.stringify(r));
      helpers.assertEqual(statusOf(b, 'TEST-OWNER', typo), 'wrong-hn');
      helpers.assert(b.table('Audit').some(function (a) { return a.action === 'wrong-hn' && a.credentialId === typo.id; }), 'audited');
      helpers.assertEqual(typo.send('TEST-OWNER', { date: daysAgo(1), type: 'checkin', heightCm: 151 }).error, 'hn marked wrong',
        'the typo phone can no longer write under the HN');
      helpers.assertEqual(typo.register('TEST-OWNER').error, 'hn marked wrong', 'nor register it again on its own');

      var again = owner.register('TEST-OWNER');
      helpers.assert(again.ok, 'the owner is now accepted: ' + JSON.stringify(again));
      helpers.assertEqual(statusOf(b, 'TEST-OWNER', owner), 'active', 'the same Devices row, now active');
      helpers.assert(owner.send('TEST-OWNER', { date: daysAgo(1), type: 'checkin', heightCm: 170 }).ok, 'the owner sends');

      // And the typo phone registers its own, right HN as the first phone there.
      helpers.assert(typo.register('TEST-TYPO').ok, 'the right HN is accepted');
      helpers.assert(typo.send('TEST-TYPO', { date: daysAgo(2), type: 'checkin', heightCm: 150 }).ok, 'its history goes there');

      b.ctx.refreshPatientResults();
      var s = summaryRow(b, 'TEST-OWNER');
      helpers.assert(/^170 ซม\./.test(s.Height), 'the owner\'s summary has only the owner\'s height: ' + s.Height);
      helpers.assertEqual(s['Age · sex'], (YEAR - 1944) + ' ปี · ชาย', 'and the owner\'s details');
      var lines = resultLines(b, 'TEST-OWNER');
      var stray = lines.filter(function (l) { return l[3] === 'ส่วนสูง 150 ซม.'; })[0];
      helpers.assert(stray && /กรอก HN นี้ผิด/.test(stray[4]), 'the stray row is listed, marked, not counted');
      helpers.assert(/^150 ซม\./.test(summaryRow(b, 'TEST-TYPO').Height), 'the typo patient has their own summary row');
    }
  });

  cases.push({
    name: 'letting go of an HN proves nothing and changes nothing for anyone else',
    fn: function () {
      var b = fake.backend();
      var a = phone(b, 1950, 'female');
      var other = phone(b, 1950, 'female');
      helpers.assert(a.register('TEST-KEEP').ok, 'A holds the HN');
      var r = other.release('TEST-KEEP');
      helpers.assert(r.ok && r.result.action === 'nothing to release', 'another phone cannot release it: ' + JSON.stringify(r));
      var unknown = other.release('TEST-NOBODY');
      helpers.assertEqual(JSON.stringify(unknown), JSON.stringify(r), 'an unknown HN gets the very same answer');
      helpers.assertEqual(statusOf(b, 'TEST-KEEP', a), 'active', 'A untouched');
      helpers.assertEqual(a.release('TEST-KEEP', { extra: 1 }).error, 'unexpected field extra');
      helpers.assertEqual(b.post({ token: b.token, schemaVersion: core.PROTOCOL_VERSION, patientId: 'TEST-KEEP', deviceKey: 'short', request: 'release' }).error,
        'app update required');
      helpers.assertEqual(a.release('=1+1').error, 'invalid patientId');
      helpers.assert(a.release('TEST-KEEP').result.action === 'released' && a.release('TEST-KEEP').result.action === 'nothing to release',
        'a second release is harmless');
    }
  });

  cases.push({
    name: 'staff can mark a phone wrong-hn; its app is told, and the owner is let in',
    fn: function () {
      var b = fake.backend();
      var typo = phone(b, 1950, 'female');
      var owner = phone(b, 1944, 'male');
      typo.register('TEST-STAFF');
      helpers.assertEqual(owner.register('TEST-STAFF').error, 'details do not match this hn');
      // Staff edit the typo phone's status in the Devices tab.
      var cols = b.ctx.SHEET_COLUMNS.Devices;
      b.sheets.Devices.rows.forEach(function (r) {
        if (String(r[cols.indexOf('credentialId')].text) === typo.id) r[cols.indexOf('status')] = { text: 'wrong-hn' };
      });
      helpers.assertEqual(typo.send('TEST-STAFF', { date: daysAgo(1), type: 'checkin', heightCm: 150 }).error, 'hn marked wrong');
      helpers.assert(owner.register('TEST-STAFF').ok, 'the owner registers again and is accepted');
      helpers.assertEqual(statusOf(b, 'TEST-STAFF', owner), 'active');
    }
  });

  cases.push({
    name: 'a phone let in with different details is kept out of the summary and flagged',
    fn: function () {
      var b = fake.backend();
      var first = phone(b, 1950, 'female');
      var stranger = phone(b, 1980, 'male');
      first.register('TEST-MIX');
      first.send('TEST-MIX', { date: daysAgo(3), type: 'checkin', heightCm: 158 });
      stranger.register('TEST-MIX');
      // Staff let the pending phone in without checking.
      var cols = b.ctx.SHEET_COLUMNS.Devices;
      b.sheets.Devices.rows.forEach(function (r) {
        if (String(r[cols.indexOf('credentialId')].text) === stranger.id) r[cols.indexOf('status')] = { text: 'active' };
      });
      helpers.assert(stranger.register('TEST-MIX').ok, 'now active');
      helpers.assert(stranger.send('TEST-MIX', { date: daysAgo(1), type: 'checkin', heightCm: 181 }).ok);
      b.ctx.refreshPatientResults();
      var s = summaryRow(b, 'TEST-MIX');
      helpers.assert(/^158 ซม\./.test(s.Height), 'the stranger\'s height is not the patient\'s: ' + s.Height);
      helpers.assert(/ปีเกิดหรือเพศไม่ตรงกัน/.test(s['Needs attention']), 'flagged: ' + s['Needs attention']);
      var line = resultLines(b, 'TEST-MIX').filter(function (l) { return l[3] === 'ส่วนสูง 181 ซม.'; })[0];
      helpers.assert(line && /ไม่ตรงกับผู้ป่วย/.test(line[4]), 'the row is listed and marked');
    }
  });

  cases.push({
    name: 'an HN held only by a phone that let it go has no summary row',
    fn: function () {
      var b = fake.backend();
      var typo = phone(b, 1950, 'female');
      typo.register('TEST-GONE');
      typo.send('TEST-GONE', { date: daysAgo(1), type: 'checkin', heightCm: 150 });
      typo.release('TEST-GONE');
      b.ctx.refreshPatientResults();
      helpers.assertEqual(summaryRow(b, 'TEST-GONE'), null);
      helpers.assert(resultLines(b, 'TEST-GONE').length >= 1, 'its rows are still listed, marked');
    }
  });

  cases.push({
    name: 'a status staff type loosely still counts ("Wrong HN", "wrong_hn", " Active ")',
    fn: function () {
      ['Wrong HN', 'wrong_hn', ' WRONG-HN '].forEach(function (typed, i) {
        var b = fake.backend();
        var typo = phone(b, 1950, 'female');
        var owner = phone(b, 1944, 'male');
        var hn = 'TEST-LOOSE' + i;
        typo.register(hn);
        helpers.assertEqual(owner.register(hn).error, 'details do not match this hn');
        var cols = b.ctx.SHEET_COLUMNS.Devices;
        b.sheets.Devices.rows.forEach(function (r) {
          if (String(r[cols.indexOf('credentialId')].text) === typo.id) r[cols.indexOf('status')] = { text: typed };
        });
        helpers.assertEqual(typo.send(hn, { date: daysAgo(1), type: 'checkin', heightCm: 150 }).error, 'hn marked wrong', JSON.stringify(typed));
        helpers.assert(owner.register(hn).ok, 'the owner gets in after staff typed ' + JSON.stringify(typed));
      });
      helpers.assertEqual(fake.backend().ctx.deviceStatus(' Active '), 'active');
    }
  });

  cases.push({
    name: 'a wrong year of birth can be corrected by the same phone, keeping its history',
    fn: function () {
      var b = fake.backend();
      var first = phone(b, 1950, 'female');
      first.register('TEST-YEAR');
      first.send('TEST-YEAR', { date: daysAgo(3), type: 'checkin', heightCm: 158 });
      // The patient's new phone: the dial was left one year off.
      var slip = phone(b, 1951, 'female');
      helpers.assertEqual(slip.register('TEST-YEAR').error, 'details do not match this hn', 'held back');
      var fixed = phone(b, 1950, 'female');
      fixed.key = slip.key; // the same phone, sending corrected details
      var again = b.post({ token: b.token, schemaVersion: core.PROTOCOL_VERSION, patientId: 'TEST-YEAR', hn: 'TEST-YEAR',
        yearOfBirth: 1950, age: YEAR - 1950, sex: 'female', consent: true, consentVersion: core.PDPA_NOTICE_VERSION,
        consentAt: new Date().toISOString(), consentLang: 'th', deviceKey: slip.key });
      helpers.assert(again.ok, 'corrected details are accepted: ' + JSON.stringify(again));
      helpers.assert(slip.send('TEST-YEAR', { date: daysAgo(1), type: 'checkin', heightCm: 158.5 }).ok, 'and its records go');

      // The first phone itself corrects its sex: a new version, the old kept.
      var corrected = b.post({ token: b.token, schemaVersion: core.PROTOCOL_VERSION, patientId: 'TEST-YEAR', hn: 'TEST-YEAR',
        yearOfBirth: 1950, age: YEAR - 1950, sex: 'male', consent: true, consentVersion: core.PDPA_NOTICE_VERSION,
        consentAt: new Date().toISOString(), consentLang: 'th', deviceKey: first.key });
      helpers.assert(corrected.ok && corrected.result.version === 2, 'version 2 of its registration: ' + JSON.stringify(corrected));
      b.ctx.refreshPatientResults();
      helpers.assert(/ชาย/.test(summaryRow(b, 'TEST-YEAR')['Age · sex']), 'the summary uses the corrected sex');

      var ui = fs.readFileSync(path.join(__dirname, '..', 'app-ui.js'), 'utf8');
      var apply = (ui.match(/function applyDetailsChange\(yearBE, sex\) \{[\s\S]*?\n  \}/) || [''])[0];
      helpers.assert(/queueRegistration\(\)/.test(apply) && !/syncQueue = /.test(apply), 'the correction re-registers and keeps the queue');
      helpers.assert(/data-action="open-details-change"/.test(ui), 'the correction is offered');
    }
  });

  cases.push({
    name: 'the app confirms the HN before registering, and a change of HN resends everything in order',
    fn: function () {
      var ui = fs.readFileSync(path.join(__dirname, '..', 'app-ui.js'), 'utf8');
      helpers.assert(/registrationPending = \{ hn: hn,[^}]*\};\s*render\(\);\s*\}/.test(ui), 'registration must stop at the confirm step');
      helpers.assert(/if \(registrationPending\) commitRegistration\(\);/.test(ui), 'only the confirm button registers');
      var apply = (ui.match(/function applyHnChange\(newHn\) \{[\s\S]*?\n  \}/) || [''])[0];
      helpers.assert(/\[\{ kind: 'release', hn: oldHn \}, \{ kind: 'registration' \}\]/.test(apply), 'release, then registration, first in the queue');
      helpers.assert(/historyRecords\(newHn\)/.test(apply), 'the whole history is sent again');
      helpers.assert(/request: 'release'/.test(ui), 'the release request is sent');
      helpers.assert(/parsed\.error === 'hn marked wrong'/.test(ui), 'the app notices a wrong-hn reply');
    }
  });

  return helpers.runSuite('t25_wrong_hn', cases);
}

module.exports = run;

if (require.main === module) {
  helpers.report(run());
}
