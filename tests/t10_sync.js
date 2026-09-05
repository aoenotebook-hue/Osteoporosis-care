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

  return helpers.runSuite('t10_sync', cases);
}

module.exports = run;

if (require.main === module) {
  helpers.report(run());
}
