var fs = require('fs');
var path = require('path');
var vm = require('vm');
var helpers = require('./helpers');

var root = path.join(__dirname, '..');

/**
 * A promise that settles at once, so the worker's activate step runs to the
 * end inside a synchronous test.
 */
function Settled(value) { this.value = value; }
Settled.prototype.then = function (fn) {
  var next = fn ? fn(this.value) : this.value;
  return next instanceof Settled ? next : new Settled(next);
};
Settled.resolve = function (v) { return v instanceof Settled ? v : new Settled(v); };
Settled.all = function (list) { return new Settled(list.map(function (p) { return p instanceof Settled ? p.value : p; })); };

/** sw.js run against stand-ins for the worker's globals; what activate left behind. */
function activateWith(existing) {
  var listeners = {};
  var names = existing.slice();
  var deleted = [];
  var ctx = {
    self: {
      addEventListener: function (type, fn) { listeners[type] = fn; },
      skipWaiting: function () { return new Settled(); },
      clients: { claim: function () { return new Settled(); } }
    },
    caches: {
      keys: function () { return new Settled(names.slice()); },
      delete: function (k) { deleted.push(k); names = names.filter(function (n) { return n !== k; }); return new Settled(true); },
      open: function () { return new Settled({ addAll: function () { return new Settled(); } }); }
    },
    Request: function (url) { this.url = url; },
    Promise: Settled
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root, 'sw.js'), 'utf8'), ctx);
  var finished = false;
  listeners.activate({ waitUntil: function (p) { p.then(function () { finished = true; }); } });
  if (!finished) throw new Error('activate did not finish');
  return { left: names, deleted: deleted, current: ctx.CACHE_NAME };
}

function run() {
  var cases = [];

  cases.push({
    name: "a new version deletes only this app's old caches; other apps' caches survive",
    fn: function () {
      var result = activateWith(['osteo-care-v4', 'osteo-care-v5', 'osteo-care-v6', 'osteo-care-v7', 'fall-diary-v2',
        'workbox-precache-v2-https://x/', 'rueortho-images', 'osteo-care']);
      helpers.assertEqual(result.current, 'osteo-care-v7');
      helpers.assertEqual(result.deleted.sort().join(), 'osteo-care-v4,osteo-care-v5,osteo-care-v6', 'deleted');
      ['fall-diary-v2', 'workbox-precache-v2-https://x/', 'rueortho-images', 'osteo-care', 'osteo-care-v7'].forEach(function (kept) {
        helpers.assert(result.left.indexOf(kept) !== -1, kept + ' was deleted');
      });
    }
  });

  cases.push({
    name: 'a change to the app files comes with a new cache name, or installed phones never see it',
    fn: function () {
      // The worker answers the app's own files from its cache and only
      // fetches them again when sw.js itself changes. tests/shell-version.json
      // records which files the current cache name was cut for.
      var crypto = require('crypto');
      var record = JSON.parse(fs.readFileSync(path.join(__dirname, 'shell-version.json'), 'utf8'));
      var hash = crypto.createHash('sha256');
      ['index.html', 'app-core.js', 'app-ui.js', 'manifest.webmanifest', 'icon.svg'].forEach(function (f) {
        hash.update(fs.readFileSync(path.join(root, f)));
      });
      var now = hash.digest('hex').slice(0, 16);
      var sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
      var cacheName = "osteo-care-v" + (sw.match(/CACHE_PREFIX \+ 'v(\d+)'/) || [])[1];
      helpers.assertEqual(cacheName, record.cacheName, 'sw.js and tests/shell-version.json disagree on the cache name');
      helpers.assertEqual(now, record.shellHash, 'the app files changed since ' + record.cacheName +
        ': raise the version in sw.js, then set tests/shell-version.json to {"cacheName": the new name, "shellHash": "' + now + '"}');
    }
  });

  cases.push({
    name: 'the host is told to refuse framing, and the page refuses it where the host cannot',
    fn: function () {
      var config = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
      var all = config.headers.filter(function (h) { return h.source === '/(.*)'; })[0];
      helpers.assert(all, 'vercel.json has no headers for every path');
      var h = {};
      all.headers.forEach(function (x) { h[x.key] = x.value; });
      helpers.assertEqual(h['X-Frame-Options'], 'DENY');
      helpers.assertEqual(h['X-Content-Type-Options'], 'nosniff');
      helpers.assert(/frame-ancestors 'none'/.test(h['Content-Security-Policy']), 'CSP header lacks frame-ancestors');
      // The header policy is the page's own plus frame-ancestors, which a
      // <meta> policy cannot carry; any other difference would narrow one side.
      var page = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
      var meta = page.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
      helpers.assertEqual(h['Content-Security-Policy'], meta + "; frame-ancestors 'none'");

      // GitHub Pages sends no such headers, so app-ui.js checks before it draws anything.
      var ui = fs.readFileSync(path.join(root, 'app-ui.js'), 'utf8');
      var guard = ui.indexOf('if (window.top !== window.self) {');
      helpers.assert(guard !== -1, 'no framing guard');
      helpers.assert(guard < ui.indexOf('var state = loadState();'), 'the guard must run before the app loads its data');
      helpers.assert(/if \(window\.top !== window\.self\) \{[\s\S]{0,700}?\n    return;\n  \}/.test(ui), 'the guard must stop the app');
    }
  });

  cases.push({
    name: 'only the app itself is published to the hosting origin',
    fn: function () {
      var ignored = fs.readFileSync(path.join(root, '.vercelignore'), 'utf8').split('\n').map(function (l) { return l.trim(); });
      ['apps-script', 'tests', 'tools'].forEach(function (dir) { helpers.assert(ignored.indexOf(dir) !== -1, dir + ' would be served'); });
      var sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
      ['./index.html', './app-core.js', './app-ui.js'].forEach(function (f) { helpers.assert(sw.indexOf("'" + f + "'") !== -1, f + ' not cached for offline use'); });
    }
  });

  return helpers.runSuite('t21_caches_and_hosting', cases);
}

module.exports = run;

if (require.main === module) {
  helpers.report(run());
}
