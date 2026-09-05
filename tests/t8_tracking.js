var path = require('path');
var core = require(path.join(__dirname, '..', 'app-core.js'));
var helpers = require('./helpers');

function run() {
  var cases = [];

  cases.push({
    name: 'height loss of 2cm or more is flagged',
    fn: function () {
      helpers.assert(core.checkHeightLoss(160, 158) === true, '2cm loss should flag');
      helpers.assert(core.checkHeightLoss(160, 157.5) === true, '2.5cm loss should flag');
    }
  });

  cases.push({
    name: 'height loss under 2cm is not flagged',
    fn: function () {
      helpers.assert(core.checkHeightLoss(160, 159) === false, '1cm loss should not flag');
      helpers.assert(core.checkHeightLoss(160, 160) === false, 'no change should not flag');
      helpers.assert(core.checkHeightLoss(160, 161) === false, 'height gain should not flag');
    }
  });

  cases.push({
    name: 'height loss check requires numeric inputs',
    fn: function () {
      helpers.assert(core.checkHeightLoss(null, 158) === false);
      helpers.assert(core.checkHeightLoss(160, undefined) === false);
    }
  });

  cases.push({
    name: 'TUG at or above 12 seconds indicates increased fall risk and blocks level advancement',
    fn: function () {
      helpers.assert(core.meetsTUG(11.9) === true);
      helpers.assert(core.meetsTUG(12) === false);
      helpers.assert(core.meetsTUG(15) === false);
      helpers.assertEqual(core.TUG_THRESHOLD_SECONDS, 12);
    }
  });

  cases.push({
    name: '30-second chair-stand result is checked against age/sex norms',
    fn: function () {
      helpers.assert(core.meetsChairStandNorm(65, 'female', 11) === true);
      helpers.assert(core.meetsChairStandNorm(65, 'female', 5) === false);
      helpers.assert(core.meetsChairStandNorm(65, 'male', 12) === true);
    }
  });

  cases.push({
    name: 'adherence streak counts consecutive days ending today',
    fn: function () {
      var streak = core.computeAdherenceStreak(['2026-05-08', '2026-05-09', '2026-05-10'], '2026-05-10');
      helpers.assertEqual(streak, 3);
    }
  });

  cases.push({
    name: 'adherence streak breaks on a missed day',
    fn: function () {
      var streak = core.computeAdherenceStreak(['2026-05-05', '2026-05-09', '2026-05-10'], '2026-05-10');
      helpers.assertEqual(streak, 2);
    }
  });

  cases.push({
    name: 'adherence streak is zero if today has no log',
    fn: function () {
      var streak = core.computeAdherenceStreak(['2026-05-08', '2026-05-09'], '2026-05-10');
      helpers.assertEqual(streak, 0);
    }
  });

  cases.push({
    name: 'empty log history gives a zero streak without throwing',
    fn: function () {
      helpers.assertEqual(core.computeAdherenceStreak([], '2026-05-10'), 0);
      helpers.assertEqual(core.computeAdherenceStreak(undefined, '2026-05-10'), 0);
    }
  });

  cases.push({
    name: 'a fall logged this month should be reflected by dropping the balance level (falls log -> level engine integration)',
    fn: function () {
      var level = core.resolveBalanceLevel({}, { currentLevel: 2, fallsLast4Weeks: 1 });
      helpers.assertEqual(level, 1);
    }
  });

  return helpers.runSuite('t8_tracking', cases);
}

module.exports = run;

if (require.main === module) {
  helpers.report(run());
}
