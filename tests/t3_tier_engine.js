var path = require('path');
var core = require(path.join(__dirname, '..', 'app-core.js'));
var helpers = require('./helpers');

function run() {
  var cases = [];

  var tierCases = [
    { profile: { age: 60, fallsLast12mo: 0 }, expected: 'A', desc: 'young, no risk factors -> A' },
    { profile: { age: 60, tScore: -1.5, fallsLast12mo: 0 }, expected: 'A', desc: 'osteopenia T-score, no other risk -> A' },
    { profile: { age: 60, tScore: -2.6, fallsLast12mo: 0 }, expected: 'B', desc: 'osteoporosis T-score -> B' },
    { profile: { age: 60, dxaOsteoporosis: true }, expected: 'B', desc: 'explicit DXA osteoporosis flag -> B' },
    { profile: { age: 60, longTermSteroid: true }, expected: 'B', desc: 'long-term steroid -> B' },
    { profile: { age: 60, fallsLast12mo: 1 }, expected: 'B', desc: 'one fall in 12 months -> B' },
    { profile: { age: 76, fallsLast12mo: 0 }, expected: 'B', desc: 'age >= 75 -> B' },
    { profile: { age: 74, fallsLast12mo: 0 }, expected: 'A', desc: 'age just under 75 with no other risk -> A' },
    { profile: { age: 60, priorFragilityFracture: true, fractureSite: 'wrist' }, expected: 'C', desc: 'prior fragility fracture -> C' },
    {
      profile: { age: 80, priorFragilityFracture: true, longTermSteroid: true, fallsLast12mo: 3 },
      expected: 'C',
      desc: 'conflicting inputs (fracture + steroid + falls + age) -> most conservative tier C'
    },
    {
      profile: { age: 76, longTermSteroid: true, fallsLast12mo: 2 },
      expected: 'B',
      desc: 'multiple Tier B risk factors without fracture stay at B (not escalated to C)'
    }
  ];

  tierCases.forEach(function (c) {
    cases.push({
      name: c.desc,
      fn: function () {
        helpers.assertEqual(core.resolveTier(c.profile), c.expected, c.desc);
      }
    });
  });

  cases.push({
    name: 'default balance level: Tier C always starts at level 1',
    fn: function () {
      var level = core.resolveBalanceLevel({ priorFragilityFracture: true }, { currentLevel: null });
      helpers.assertEqual(level, 1);
    }
  });

  cases.push({
    name: 'default balance level: walking aid forces level 1 regardless of tier',
    fn: function () {
      var level = core.resolveBalanceLevel({ age: 60, walksWithAid: true }, { currentLevel: null });
      helpers.assertEqual(level, 1);
    }
  });

  cases.push({
    name: 'default balance level: fear of falling forces level 1',
    fn: function () {
      var level = core.resolveBalanceLevel({ age: 60, fearOfFalling: true }, { currentLevel: null });
      helpers.assertEqual(level, 1);
    }
  });

  cases.push({
    name: 'default balance level: Tier A/B without aid or fear starts at level 2',
    fn: function () {
      var level = core.resolveBalanceLevel({ age: 60 }, { currentLevel: null });
      helpers.assertEqual(level, 2);
    }
  });

  cases.push({
    name: 'a fall in the last 4 weeks always drops the level by one',
    fn: function () {
      var level = core.resolveBalanceLevel({ age: 60 }, {
        currentLevel: 3, fallsLast4Weeks: 1,
        weeklySessionCounts: [3, 3, 3, 3], age: 60, sex: 'female', chairStandReps: 20, tugSeconds: 8
      });
      helpers.assertEqual(level, 2);
    }
  });

  cases.push({
    name: 'a fall never drops the level below 1',
    fn: function () {
      var level = core.resolveBalanceLevel({ age: 60 }, { currentLevel: 1, fallsLast4Weeks: 2 });
      helpers.assertEqual(level, 1);
    }
  });

  cases.push({
    name: 'level rises only when the full gate is met (sessions + chair-stand + TUG + no fall)',
    fn: function () {
      var history = {
        currentLevel: 1, fallsLast4Weeks: 0,
        weeklySessionCounts: [3, 4, 3, 3], age: 65, sex: 'female', chairStandReps: 15, tugSeconds: 9
      };
      helpers.assertEqual(core.resolveBalanceLevel({}, history), 2, 'gate fully met should advance level');
    }
  });

  cases.push({
    name: 'level does not rise if fewer than 4 weeks of sufficient sessions logged',
    fn: function () {
      var history = {
        currentLevel: 1, fallsLast4Weeks: 0,
        weeklySessionCounts: [3, 3, 3], age: 65, sex: 'female', chairStandReps: 15, tugSeconds: 9
      };
      helpers.assertEqual(core.resolveBalanceLevel({}, history), 1, 'insufficient session history should not advance');
    }
  });

  cases.push({
    name: 'level does not rise if chair-stand result is below age/sex norm',
    fn: function () {
      var history = {
        currentLevel: 1, fallsLast4Weeks: 0,
        weeklySessionCounts: [3, 3, 3, 3], age: 65, sex: 'female', chairStandReps: 3, tugSeconds: 9
      };
      helpers.assertEqual(core.resolveBalanceLevel({}, history), 1, 'failing chair-stand norm should not advance');
    }
  });

  cases.push({
    name: 'level does not rise if TUG is at or above the 12 second threshold',
    fn: function () {
      var history = {
        currentLevel: 1, fallsLast4Weeks: 0,
        weeklySessionCounts: [3, 3, 3, 3], age: 65, sex: 'female', chairStandReps: 15, tugSeconds: 13
      };
      helpers.assertEqual(core.resolveBalanceLevel({}, history), 1, 'TUG >= 12s should block advancement');
    }
  });

  cases.push({
    name: 'level never rises above 3',
    fn: function () {
      var history = {
        currentLevel: 3, fallsLast4Weeks: 0,
        weeklySessionCounts: [3, 3, 3, 3], age: 65, sex: 'female', chairStandReps: 15, tugSeconds: 9
      };
      helpers.assertEqual(core.resolveBalanceLevel({}, history), 3);
    }
  });

  return helpers.runSuite('t3_tier_engine', cases);
}

module.exports = run;

if (require.main === module) {
  helpers.report(run());
}
