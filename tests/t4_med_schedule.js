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
    name: 'the daily oral bisphosphonate is no longer offered',
    fn: function () {
      helpers.assertEqual(core.getMedClass('bisphosphonate_daily'), null);
    }
  });

  cases.push({
    name: 'denosumab rolls 6 months across a year boundary',
    fn: function () {
      helpers.assertEqual(core.computeNextDue('denosumab', '2025-12-15'), '2026-06-15');
    }
  });

  cases.push({
    name: 'denosumab from Aug 31 clamps to the last day of February',
    fn: function () {
      helpers.assertEqual(core.computeNextDue('denosumab', '2025-08-31'), '2026-02-28');
      helpers.assertEqual(core.computeNextDue('denosumab', '2027-08-31'), '2028-02-29');
    }
  });

  cases.push({
    name: 'yearly zoledronate from a leap day lands on Feb 28 the next year',
    fn: function () {
      helpers.assertEqual(core.computeNextDue('zoledronate', '2024-02-29'), '2025-02-28');
      helpers.assertEqual(core.computeNextDue('zoledronate', '2028-02-29'), '2029-02-28');
    }
  });

  cases.push({
    name: 'monthly romosozumab from Jan 31 clamps to Feb 28/29',
    fn: function () {
      helpers.assertEqual(core.computeNextDue('romosozumab', '2026-01-31'), '2026-02-28');
      helpers.assertEqual(core.computeNextDue('romosozumab', '2028-01-31'), '2028-02-29');
    }
  });

  cases.push({
    name: 'teriparatide recurs daily',
    fn: function () {
      helpers.assertEqual(core.computeNextDue('teriparatide', '2026-05-10'), '2026-05-11');
    }
  });

  cases.push({
    name: 'an unknown medication id throws instead of miscalculating',
    fn: function () {
      var threw = false;
      try { core.computeNextDue('not_a_real_med', '2026-01-01'); } catch (e) { threw = true; }
      helpers.assert(threw, 'expected a throw for an unknown medication id');
    }
  });

  cases.push({
    name: 'calcium and vitamin D are not treated as osteoporosis medication',
    fn: function () {
      helpers.assertEqual(core.getMedClass('calcium_vitd'), null);
    }
  });

  cases.push({
    name: 'every medication carries the patient-facing care information the Drug tab renders',
    fn: function () {
      core.MED_CLASSES.forEach(function (med) {
        ['name', 'whatItDoes', 'instructions', 'missedDose', 'sideEffects', 'tellDoctor'].forEach(function (field) {
          helpers.assert(med[field] && med[field].th && med[field].en, med.id + ' is missing TH/EN "' + field + '"');
        });
      });
    }
  });

  cases.push({
    name: 'denosumab carries the do-not-stop warning and a do-not-delay flag',
    fn: function () {
      var denosumab = core.getMedClass('denosumab');
      helpers.assertEqual(denosumab.doNotDelay, true);
      helpers.assert(denosumab.doNotStop && denosumab.doNotStop.th && denosumab.doNotStop.en, 'denosumab needs a TH/EN do-not-stop warning');
    }
  });

  cases.push({
    name: 'bisphosphonates and denosumab are flagged for the dental warning',
    fn: function () {
      ['bisphosphonate_weekly', 'denosumab', 'zoledronate'].forEach(function (id) {
        helpers.assertEqual(core.getMedClass(id).dentalCare, true, id + ' should carry the dental note flag');
      });
    }
  });

  return helpers.runSuite('t4_med_schedule', cases);
}

module.exports = run;

if (require.main === module) {
  helpers.report(run());
}
