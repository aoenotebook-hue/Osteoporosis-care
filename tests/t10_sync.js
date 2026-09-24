var fs = require('fs');
var path = require('path');
var core = require(path.join(__dirname, '..', 'app-core.js'));
var helpers = require('./helpers');

function run() {
  var cases = [];

  cases.push({
    name: 'dedup key is built from patientId + date + type',
    fn: function () {
      helpers.assertEqual(core.buildDedupKey('HN123', '2026-05-10', 'checkin'), 'HN123_2026-05-10_checkin');
    }
  });

  cases.push({
    name: 'two records with the same patient/date/type collapse to one',
    fn: function () {
      var records = [
        { patientId: 'HN1', date: '2026-05-10', type: 'checkin', note: 'first' },
        { patientId: 'HN1', date: '2026-05-10', type: 'checkin', note: 'duplicate-should-be-dropped' }
      ];
      var deduped = core.dedupeRecords(records);
      helpers.assertEqual(deduped.length, 1);
      helpers.assertEqual(deduped[0].note, 'first');
    }
  });

  cases.push({
    name: 'records differing by type, date, or patient are all kept',
    fn: function () {
      var records = [
        { patientId: 'HN1', date: '2026-05-10', type: 'checkin' },
        { patientId: 'HN1', date: '2026-05-10', type: 'falls' },
        { patientId: 'HN1', date: '2026-05-11', type: 'checkin' },
        { patientId: 'HN2', date: '2026-05-10', type: 'checkin' }
      ];
      helpers.assertEqual(core.dedupeRecords(records).length, 4);
    }
  });

  cases.push({
    name: 'offline queue replay is idempotent: deduping an already-deduped list is a no-op',
    fn: function () {
      var records = [
        { patientId: 'HN1', date: '2026-05-10', type: 'adherence' },
        { patientId: 'HN1', date: '2026-05-11', type: 'adherence' }
      ];
      var once = core.dedupeRecords(records);
      var twice = core.dedupeRecords(once.concat(once));
      helpers.assertEqual(twice.length, 2);
    }
  });

  cases.push({
    name: 'empty record list dedupes to empty',
    fn: function () {
      helpers.assertEqual(core.dedupeRecords([]).length, 0);
    }
  });

  cases.push({
    name: 'several check-in measurements on one day merge into a single queued record',
    fn: function () {
      var queue = [];
      core.queueRecord(queue, { patientId: 'HN1', date: '2026-05-10', type: 'checkin', heightCm: 158 });
      core.queueRecord(queue, { patientId: 'HN1', date: '2026-05-10', type: 'checkin', tugSeconds: 10.2 });
      core.queueRecord(queue, { patientId: 'HN1', date: '2026-05-10', type: 'checkin', chairStandReps: 12 });
      helpers.assertEqual(queue.length, 1, 'same-day check-ins should collapse to one record');
      helpers.assertEqual(queue[0].payload.heightCm, 158, 'the earlier height must not be lost');
      helpers.assertEqual(queue[0].payload.tugSeconds, 10.2);
      helpers.assertEqual(queue[0].payload.chairStandReps, 12);
    }
  });

  cases.push({
    name: 'check-ins on different days stay separate records',
    fn: function () {
      var queue = [];
      core.queueRecord(queue, { patientId: 'HN1', date: '2026-05-10', type: 'checkin', heightCm: 158 });
      core.queueRecord(queue, { patientId: 'HN1', date: '2026-05-11', type: 'checkin', heightCm: 157 });
      helpers.assertEqual(queue.length, 2);
    }
  });

  cases.push({
    name: 'two falls on the same day are kept as two events, not merged',
    fn: function () {
      var queue = [];
      core.queueRecord(queue, { patientId: 'HN1', date: '2026-05-10', type: 'falls', injured: 0, cause: 'พรม' });
      core.queueRecord(queue, { patientId: 'HN1', date: '2026-05-10', type: 'falls', injured: 1, cause: 'บันได' });
      helpers.assertEqual(queue.length, 2, 'a second fall the same day is a real event');
    }
  });

  cases.push({
    name: 'a repeated adherence record on one day is not duplicated by the backend dedup key',
    fn: function () {
      var key1 = core.buildDedupKey('HN1', '2026-05-10', 'adherence');
      var key2 = core.buildDedupKey('HN1', '2026-05-10', 'adherence');
      helpers.assertEqual(key1, key2);
    }
  });

  cases.push({
    name: 'a record the backend refuses for good is set aside, and the rest still go',
    fn: function () {
      // The queue goes in order. A record Code.gs will never accept used to
      // stay first in line forever, so nothing recorded after it arrived.
      var root = path.join(__dirname, '..');
      var ui = fs.readFileSync(path.join(root, 'app-ui.js'), 'utf8');
      var gs = fs.readFileSync(path.join(root, 'apps-script', 'Code.gs'), 'utf8');
      var src = (ui.match(/var PERMANENT_REJECTION = \/(.+)\/;/) || [])[1];
      helpers.assert(src, 'app-ui.js has no PERMANENT_REJECTION list');
      var permanent = new RegExp(src);

      var validateBody = (gs.match(/function validate\(payload\) \{([\s\S]*?)\n\}/) || [])[1] || '';
      var refusals = (validateBody.match(/return '[^']+'/g) || []).map(function (r) { return r.slice(8, -1); });
      helpers.assert(refusals.length >= 4, 'could not read the refusals in Code.gs validate()');
      refusals.concat(['request too large']).forEach(function (reason) {
        helpers.assert(permanent.test(reason), '"' + reason + '" from Code.gs would block the queue forever');
      });

      // These can clear up (a redeploy, a quieter moment, a signal), so the
      // record must stay queued and be tried again.
      ['busy, try again', 'invalid token — the app and this script are using different SHARED_TOKEN values',
        'no request body', 'offline', 'HTTP 500', 'Exception: Service Spreadsheets timed out'].forEach(function (reason) {
        helpers.assert(!permanent.test(reason), '"' + reason + '" would throw away a record that could still arrive');
      });

      helpers.assert(/setAsideRejected\(state\.syncQueue\.shift\(\)/.test(ui), 'a refused record should be kept aside, not deleted');
      helpers.assert(/tr\('syncFooterRejected'\)/.test(ui) && core.CONTENT.syncFooterRejected, 'the patient is not told a record was refused');
      helpers.assert(/syncRejected: \[\]/.test(ui), 'syncRejected is missing from the saved state');
    }
  });

  cases.push({
    name: 'the "records waiting" line updates when an upload finishes',
    fn: function () {
      var ui = fs.readFileSync(path.join(__dirname, '..', 'app-ui.js'), 'utf8');
      var flush = (ui.match(/function flushSyncQueue\(onDone\) \{([\s\S]*?)\n  \}\n/) || [])[1] || '';
      helpers.assert(flush, 'flushSyncQueue not found');
      helpers.assert((flush.match(/refreshFooter\(\)/g) || []).length >= 3, 'the footer is not redrawn after every upload outcome');
    }
  });

  cases.push({
    name: 'a new version installs fresh files, not ones the browser kept from the last visit',
    fn: function () {
      // GitHub Pages lets a file be reused for 10 minutes. Without cache:
      // 'reload' the new service worker stored the old page and served it,
      // cache-first, until the version after.
      var sw = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
      helpers.assert(/new Request\(url, \{ cache: 'reload' \}\)/.test(sw), 'the install step can pick up stale files from the HTTP cache');
    }
  });

  return helpers.runSuite('t10_sync', cases);
}

module.exports = run;

if (require.main === module) {
  helpers.report(run());
}
