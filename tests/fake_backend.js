var fs = require('fs');
var path = require('path');
var vm = require('vm');
var crypto = require('crypto');

var GS_PATH = path.join(__dirname, '..', 'apps-script', 'Code.gs');

/**
 * apps-script/Code.gs run in Node against a stand-in for Google Sheets,
 * faithful in the ways the tests lean on:
 *   - text written to a cell that starts with = + - or @ becomes a formula,
 *     and a leading apostrophe keeps it as text (and is not read back);
 *   - like Sheets, text that looks like a number or a date is converted:
 *     "0012345" is stored as the number 12345, "2026-09-01" as a date;
 *   - every write to an existing row is counted, so a test can prove the
 *     script only ever appends.
 * Only synthetic records ever pass through it.
 */
function fakeSheets() {
  var sheets = {};
  var overwrites = [];
  function store(v) {
    if (typeof v === 'string' && v.charAt(0) === "'") return { text: v.slice(1) };
    if (typeof v === 'string' && /^[=+\-@]/.test(v)) return { formula: v };
    if (typeof v === 'string' && /^\d+(\.\d+)?$/.test(v)) return { value: Number(v) };
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) return { value: new Date(v + 'T00:00:00Z') };
    return { value: v };
  }
  function read(cell) {
    if (!cell) return '';
    if (cell.formula) return '#FORMULA';
    return cell.text !== undefined ? cell.text : cell.value;
  }
  function makeSheet(name) {
    var rows = [];
    var sheet = {
      rows: rows,
      getName: function () { return name; },
      setName: function (next) { delete sheets[name]; name = next; sheets[next] = sheet; return sheet; },
      appendRow: function (r) { rows.push(r.map(store)); },
      setFrozenRows: function () {},
      getLastRow: function () { return rows.length; },
      getLastColumn: function () {
        return rows.reduce(function (w, r) {
          for (var i = r.length; i > 0; i--) { if (read(r[i - 1]) !== '') return Math.max(w, i); }
          return w;
        }, 0);
      },
      getDataRange: function () { return { getValues: function () { return rows.map(function (r) { return r.map(read); }); } }; },
      getRange: function (row, col, numRows, numCols) {
        return {
          getValues: function () {
            var out = [];
            for (var i = 0; i < (numRows || 1); i++) {
              var r = rows[row - 1 + i] || [];
              var vals = [];
              for (var j = 0; j < (numCols || 1); j++) vals.push(read(r[col - 1 + j]));
              out.push(vals);
            }
            return out;
          },
          setValues: function (vals) {
            overwrites.push(name + ' row ' + row);
            rows[row - 1] = vals[0].map(store);
          }
        };
      }
    };
    return sheet;
  }
  var ss = {
    getSheetByName: function (n) { return sheets[n] || null; },
    insertSheet: function (n) { sheets[n] = makeSheet(n); return sheets[n]; },
    getSheets: function () { return Object.keys(sheets).map(function (k) { return sheets[k]; }); }
  };
  return { ss: ss, sheets: sheets, overwrites: overwrites, makeSheet: makeSheet };
}

function fakeCache() {
  var store = {};
  return {
    store: store,
    get: function (k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    put: function (k, v, seconds) {
      // Apps Script keeps a cached value for at most six hours.
      if (seconds > 21600) throw new Error('Exception: Argument too large: expirationInSeconds');
      store[k] = String(v);
    }
  };
}

/** Bangkok's date for a moment, as the deployed script (time zone Asia/Bangkok) sees it. */
function bangkokDate(d) {
  return new Date(d.getTime() + 7 * 3600000).toISOString().slice(0, 10);
}

function backend(options) {
  options = options || {};
  var fake = fakeSheets();
  var cache = fakeCache();
  var ctx = {
    SpreadsheetApp: { getActiveSpreadsheet: function () { return fake.ss; } },
    LockService: { getScriptLock: function () { return { tryLock: function () { return true; }, releaseLock: function () {} }; } },
    CacheService: { getScriptCache: function () { return cache; } },
    ContentService: {
      MimeType: { JSON: 'json' },
      createTextOutput: function (s) { return { body: s, setMimeType: function () { return this; } }; }
    },
    Utilities: {
      DigestAlgorithm: { SHA_256: 'SHA_256' },
      Charset: { UTF_8: 'UTF_8' },
      computeDigest: function (alg, text) {
        // Apps Script returns Java bytes: signed, -128..127.
        return Array.prototype.map.call(crypto.createHash('sha256').update(String(text), 'utf8').digest(), function (b) {
          return b > 127 ? b - 256 : b;
        });
      },
      getUuid: function () { return crypto.randomUUID(); },
      formatDate: function (d) { return bangkokDate(d); }
    },
    Session: { getScriptTimeZone: function () { return 'Asia/Bangkok'; } }
  };
  vm.createContext(ctx);
  vm.runInContext(options.source || fs.readFileSync(GS_PATH, 'utf8'), ctx);
  if (options.legacySheets) options.legacySheets(fake);
  return {
    ctx: ctx,
    sheets: fake.sheets,
    overwrites: fake.overwrites,
    cache: cache,
    token: ctx.SHARED_TOKEN,
    post: function (payload) {
      var body = typeof payload === 'string' ? payload : JSON.stringify(payload);
      return JSON.parse(ctx.doPost({ postData: { contents: body } }).body);
    },
    get: function () { return JSON.parse(ctx.doGet().body); },
    /** A tab's rows as objects keyed by its header, as staff would read them. */
    table: function (name) {
      var s = fake.sheets[name];
      if (!s) return [];
      var values = s.getDataRange().getValues();
      return values.slice(1).map(function (r) {
        var o = {};
        values[0].forEach(function (h, i) { o[h] = r[i]; });
        return o;
      });
    }
  };
}

/** A fresh synthetic device key, as the app makes one. */
function deviceKey() {
  return crypto.randomBytes(32).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

module.exports = { backend: backend, deviceKey: deviceKey, bangkokDate: bangkokDate };
