var path = require('path');
var core = require(path.join(__dirname, '..', 'app-core.js'));
var helpers = require('./helpers');

function run() {
  var cases = [];

  cases.push({
    name: 'height loss of 2cm or more is flagged, less is not',
    fn: function () {
      helpers.assertEqual(core.checkHeightLoss(160, 158), true);
      helpers.assertEqual(core.checkHeightLoss(160, 157.5), true);
      helpers.assertEqual(core.checkHeightLoss(160, 159), false);
      helpers.assertEqual(core.checkHeightLoss(160, 161), false);
      helpers.assertEqual(core.checkHeightLoss(null, 158), false);
    }
  });

  cases.push({
    name: 'height re-measurement is due after 6 months',
    fn: function () {
      helpers.assertEqual(core.isHeightCheckDue(null, '2026-06-01'), true);
      helpers.assertEqual(core.isHeightCheckDue('2026-05-01', '2026-06-01'), false);
      helpers.assertEqual(core.isHeightCheckDue('2025-11-01', '2026-06-01'), true);
    }
  });

  cases.push({
    name: 'TUG at or above 12 seconds signals higher fall risk',
    fn: function () {
      helpers.assertEqual(core.TUG_THRESHOLD_SECONDS, 12);
      helpers.assertEqual(core.meetsTUG(11.9), true);
      helpers.assertEqual(core.meetsTUG(12), false);
      helpers.assertEqual(core.meetsTUG(undefined), false);
    }
  });

  cases.push({
    name: 'chair-stand results are compared against age and sex norms',
    fn: function () {
      helpers.assertEqual(core.chairStandNorm(65, 'female'), 11);
      helpers.assertEqual(core.meetsChairStandNorm(65, 'female', 11), true);
      helpers.assertEqual(core.meetsChairStandNorm(65, 'female', 5), false);
      helpers.assertEqual(core.meetsChairStandNorm(65, 'male', 12), true);
    }
  });

  cases.push({
    name: 'self-tests go stale after 90 days',
    fn: function () {
      helpers.assertEqual(core.isSelfTestDue(null, '2026-06-01'), true);
      helpers.assertEqual(core.isSelfTestDue('2026-05-01', '2026-06-01'), false);
      helpers.assertEqual(core.isSelfTestDue('2026-01-01', '2026-06-01'), true);
    }
  });

  cases.push({
    name: 'the monthly check-in is due after 28 days',
    fn: function () {
      helpers.assertEqual(core.isMonthlyCheckinDue(null, '2026-06-01'), true);
      helpers.assertEqual(core.isMonthlyCheckinDue('2026-05-20', '2026-06-01'), false);
      helpers.assertEqual(core.isMonthlyCheckinDue('2026-05-01', '2026-06-01'), true);
    }
  });

  cases.push({
    name: 'adherence streak counts consecutive days ending today and breaks on a gap',
    fn: function () {
      helpers.assertEqual(core.computeAdherenceStreak(['2026-05-08', '2026-05-09', '2026-05-10'], '2026-05-10'), 3);
      helpers.assertEqual(core.computeAdherenceStreak(['2026-05-05', '2026-05-09', '2026-05-10'], '2026-05-10'), 2);
      helpers.assertEqual(core.computeAdherenceStreak(['2026-05-08', '2026-05-09'], '2026-05-10'), 0);
      helpers.assertEqual(core.computeAdherenceStreak([], '2026-05-10'), 0);
    }
  });

  cases.push({
    name: 'a time series drops entries with no numeric value',
    fn: function () {
      var series = core.buildTimeSeries([
        { date: '2026-01-01', cm: 160 },
        { date: '2026-06-01', cm: null },
        { date: '2026-07-01', cm: 158.5 }
      ], 'cm');
      helpers.assertEqual(series.length, 2);
      helpers.assertEqual(series[0].value, 160);
      helpers.assertEqual(series[1].label, '2026-07-01');
    }
  });

  cases.push({
    name: 'monthly counts cover a fixed window even for months with nothing recorded',
    fn: function () {
      var counts = core.buildMonthlyCounts(['2026-06-02', '2026-06-20', '2026-04-11'], 6, '2026-06-15');
      helpers.assertEqual(counts.length, 6);
      helpers.assertEqual(counts[counts.length - 1].label, '2026-06');
      helpers.assertEqual(counts[counts.length - 1].value, 2);
      helpers.assertEqual(counts[counts.length - 3].value, 1, 'April should hold one fall');
      helpers.assertEqual(counts[counts.length - 2].value, 0, 'May should be empty');
    }
  });

  cases.push({
    name: 'a fall drops the balance level (falls log to engine integration)',
    fn: function () {
      helpers.assertEqual(core.resolveBalanceLevel({}, { currentLevel: 2, fallsLast4Weeks: 1 }), 1);
    }
  });

  return helpers.runSuite('t8_tracking', cases);
}

module.exports = run;

if (require.main === module) {
  helpers.report(run());
}
