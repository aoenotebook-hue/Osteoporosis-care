var path = require('path');
var core = require(path.join(__dirname, '..', 'app-core.js'));
var helpers = require('./helpers');

function run() {
  var cases = [];

  cases.push({
    name: 'weekly bisphosphonate adds 7 days across a month boundary',
    fn: function () {
      helpers.assertEqual(core.computeNextDue('bisphosphonate_weekly', '2026-01-29'), '2026-02-05');
    }
  });

  cases.push({
    name: 'daily bisphosphonate adds 1 day',
    fn: function () {
      helpers.assertEqual(core.computeNextDue('bisphosphonate_daily', '2026-03-31'), '2026-04-01');
    }
  });

  cases.push({
    name: 'denosumab 6-month rollover across year boundary (Dec -> Jun)',
    fn: function () {
      helpers.assertEqual(core.computeNextDue('denosumab', '2025-12-15'), '2026-06-15');
    }
  });

  cases.push({
    name: 'denosumab from Aug 31 clamps to last day of February (non-leap year)',
    fn: function () {
      helpers.assertEqual(core.computeNextDue('denosumab', '2025-08-31'), '2026-02-28');
    }
  });

  cases.push({
    name: 'denosumab from Aug 31 clamps to Feb 29 in a leap year',
    fn: function () {
      helpers.assertEqual(core.computeNextDue('denosumab', '2027-08-31'), '2028-02-29');
    }
  });

  cases.push({
    name: 'zoledronate yearly infusion from a leap day lands on Feb 28 the next (non-leap) year',
    fn: function () {
      helpers.assertEqual(core.computeNextDue('zoledronate', '2024-02-29'), '2025-02-28');
    }
  });

  cases.push({
    name: 'zoledronate yearly infusion spanning two leap years stays on Feb 29',
    fn: function () {
      helpers.assertEqual(core.computeNextDue('zoledronate', '2024-02-29'), '2025-02-28');
      helpers.assertEqual(core.computeNextDue('zoledronate', '2028-02-29'), '2029-02-28');
    }
  });

  cases.push({
    name: 'romosozumab monthly injection from Jan 31 clamps to Feb 28/29',
    fn: function () {
      helpers.assertEqual(core.computeNextDue('romosozumab', '2026-01-31'), '2026-02-28');
      helpers.assertEqual(core.computeNextDue('romosozumab', '2028-01-31'), '2028-02-29');
    }
  });

  cases.push({
    name: 'teriparatide daily self-injection adds 1 day',
    fn: function () {
      helpers.assertEqual(core.computeNextDue('teriparatide', '2026-05-10'), '2026-05-11');
    }
  });

  cases.push({
    name: 'calcium + vitamin D supplement recurs daily',
    fn: function () {
      helpers.assertEqual(core.computeNextDue('calcium_vitd', '2026-05-10'), '2026-05-11');
    }
  });

  cases.push({
    name: 'unknown medication class throws instead of silently miscalculating',
    fn: function () {
      var threw = false;
      try {
        core.computeNextDue('not_a_real_med', '2026-01-01');
      } catch (e) {
        threw = true;
      }
      helpers.assert(threw, 'expected computeNextDue to throw for unknown medication id');
    }
  });

  cases.push({
    name: 'denosumab and zoledronate are flagged so the UI can show the do-not-delay warning',
    fn: function () {
      helpers.assert(core.getMedClass('denosumab').doNotDelay === true, 'denosumab should be doNotDelay');
    }
  });

  return helpers.runSuite('t4_med_schedule', cases);
}

module.exports = run;

if (require.main === module) {
  helpers.report(run());
}
