var path = require('path');
var childProcess = require('child_process');
var helpers = require('./helpers');

/**
 * tools/verify-backend.js is how a redeploy is confirmed. It is run here
 * against this repo's Code.gs (it must pass) and against the script as it was
 * before protocol 3 (it must fail, and stop before writing anything).
 */
function probeWith(sourceExpr) {
  var script = [
    "var fake = require(" + JSON.stringify(path.join(__dirname, 'fake_backend.js')) + ");",
    "var tool = require(" + JSON.stringify(path.join(__dirname, '..', 'tools', 'verify-backend.js')) + ");",
    "var b = fake.backend(" + sourceExpr + ");",
    "tool.probe({ get: async function () { return b.get(); }, post: async function (x) { return b.post(x); } }, { write: true })",
    "  .then(function (r) { console.log(JSON.stringify({ results: r, sheets: Object.keys(b.sheets) })); });"
  ].join('\n');
  var out = childProcess.execFileSync(process.execPath, ['-e', script], { encoding: 'utf8' });
  return JSON.parse(out.trim().split('\n').pop());
}

function run() {
  var cases = [];

  cases.push({
    name: 'every probe passes against this Code.gs, the write round trip included',
    fn: function () {
      var r = probeWith('');
      var failed = r.results.filter(function (x) { return !x.ok; });
      helpers.assertEqual(failed.map(function (x) { return x.name + ': ' + x.detail; }).join(' | '), '');
      helpers.assert(r.results.length >= 13, 'too few probes ran: ' + r.results.length);
    }
  });

  cases.push({
    name: 'against an older script the tool fails at once and writes nothing',
    fn: function () {
      var old = "{ source: require('fs').readFileSync(" + JSON.stringify(path.join(__dirname, '..', 'apps-script', 'Code.gs')) +
        ", 'utf8').replace(/SCRIPT_VERSION = '[^']+'/, \"SCRIPT_VERSION = '2026-09-24'\") }";
      var r = probeWith(old);
      helpers.assertEqual(r.results[0].ok, false, 'the version check should fail');
      helpers.assertEqual(r.results.length, 2, 'it should stop after the version check');
      helpers.assertEqual(r.sheets.length, 0, 'nothing should be written to an old script\'s sheet');
    }
  });

  return helpers.runSuite('t22_verify_tool', cases);
}

module.exports = run;

if (require.main === module) {
  helpers.report(run());
}
