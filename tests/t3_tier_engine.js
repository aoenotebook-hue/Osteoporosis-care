var path = require('path');
var core = require(path.join(__dirname, '..', 'app-core.js'));
var helpers = require('./helpers');

var TODAY = '2026-06-01';

function gateHistory(overrides) {
  return Object.assign({
    currentLevel: 1,
    levelSetDate: '2026-04-01',
    lastSelfTestDate: '2026-05-20',
    fallsLast4Weeks: 0,
    age: 65,
    sex: 'female',
    chairStandReps: 15,
    tugSeconds: 9,
    today: TODAY
  }, overrides || {});
}

function run() {
  var cases = [];

  var tierCases = [
    { profile: { age: 60, fallsLast12mo: 0 }, expected: 'A', desc: 'no risk factors -> A' },
    { profile: { age: 60, tScore: -1.5, fallsLast12mo: 0 }, expected: 'A', desc: 'osteopenia T-score alone -> A' },
    { profile: { age: 60, tScore: -2.6 }, expected: 'B', desc: 'osteoporosis T-score -> B' },
    { profile: { age: 60, dxaOsteoporosis: true }, expected: 'B', desc: 'DXA osteoporosis flag -> B' },
    { profile: { age: 60, longTermSteroid: true }, expected: 'B', desc: 'long-term steroid -> B' },
    { profile: { age: 60, fallsLast12mo: 1 }, expected: 'B', desc: 'one fall in 12 months -> B' },
    { profile: { age: 76 }, expected: 'B', desc: 'age >= 75 -> B' },
    { profile: { age: 74, fallsLast12mo: 0 }, expected: 'A', desc: 'age just under 75, no other risk -> A' },
    { profile: { age: 60, priorFragilityFracture: true, fractureSite: 'wrist' }, expected: 'C', desc: 'prior fragility fracture -> C' },
    { profile: { age: 60, priorFragilityFracture: true, fractureSite: 'other' }, expected: 'C', desc: 'fracture at an "other" site still counts as C' },
    { profile: { age: 80, priorFragilityFracture: true, longTermSteroid: true, fallsLast12mo: 3 }, expected: 'C', desc: 'conflicting inputs -> most conservative tier C' },
    { profile: { age: 76, longTermSteroid: true, fallsLast12mo: 2 }, expected: 'B', desc: 'several Tier B factors without a fracture stay at B' }
  ];

  tierCases.forEach(function (c) {
    cases.push({ name: c.desc, fn: function () { helpers.assertEqual(core.resolveTier(c.profile), c.expected, c.desc); } });
  });

  cases.push({
    name: 'the risk assessment no longer asks for age or sex (taken from registration)',
    fn: function () {
      var fields = core.ONBOARDING_QUESTIONS.map(function (q) { return q.field; });
      helpers.assert(fields.indexOf('age') === -1, 'age should not be asked again');
      helpers.assert(fields.indexOf('sex') === -1, 'sex should not be asked again');
    }
  });

  cases.push({
    name: 'the fracture site question offers an "other" option',
    fn: function () {
      var q = core.ONBOARDING_QUESTIONS.filter(function (x) { return x.field === 'fractureSite'; })[0];
      var values = q.options.map(function (o) { return o.value; });
      helpers.assert(values.indexOf('other') !== -1, 'expected an "other" fracture site option');
    }
  });

  cases.push({
    name: 'the medication question no longer offers calcium + vitamin D',
    fn: function () {
      var q = core.ONBOARDING_QUESTIONS.filter(function (x) { return x.field === 'currentMedClass'; })[0];
      var values = q.options.map(function (o) { return o.value; });
      helpers.assert(values.indexOf('calcium_vitd') === -1, 'calcium/vitamin D should not be a treatment option');
      helpers.assert(values.indexOf('none') !== -1, 'a "not taking any" option should remain');
      helpers.assert(core.MED_CLASSES.every(function (m) { return m.id !== 'calcium_vitd'; }), 'calcium/vitamin D should not be a medication class');
    }
  });

  cases.push({
    name: 'Tier C always starts at balance level 1',
    fn: function () {
      helpers.assertEqual(core.resolveBalanceLevel({ priorFragilityFracture: true }, { currentLevel: null }), 1);
    }
  });

  cases.push({
    name: 'a walking aid or fear of falling forces level 1',
    fn: function () {
      helpers.assertEqual(core.resolveBalanceLevel({ age: 60, walksWithAid: true }, { currentLevel: null }), 1);
      helpers.assertEqual(core.resolveBalanceLevel({ age: 60, fearOfFalling: true }, { currentLevel: null }), 1);
    }
  });

  cases.push({
    name: 'everyone else starts at level 2',
    fn: function () {
      helpers.assertEqual(core.resolveBalanceLevel({ age: 60 }, { currentLevel: null }), 2);
    }
  });

  cases.push({
    name: 'a fall in the last 4 weeks always drops the level, even when the gate is otherwise met',
    fn: function () {
      helpers.assertEqual(core.resolveBalanceLevel({}, gateHistory({ currentLevel: 3, fallsLast4Weeks: 1 })), 2);
    }
  });

  cases.push({
    name: 'a fall never drops the level below 1',
    fn: function () {
      helpers.assertEqual(core.resolveBalanceLevel({}, gateHistory({ currentLevel: 1, fallsLast4Weeks: 2 })), 1);
    }
  });

  cases.push({
    name: 'the level rises when both self-tests pass, no fall, and enough time at the level',
    fn: function () {
      helpers.assertEqual(core.resolveBalanceLevel({}, gateHistory()), 2);
    }
  });

  cases.push({
    name: 'a chair-stand result below the age/sex norm blocks advancement',
    fn: function () {
      helpers.assertEqual(core.resolveBalanceLevel({}, gateHistory({ chairStandReps: 3 })), 1);
    }
  });

  cases.push({
    name: 'a TUG of 12 seconds or more blocks advancement',
    fn: function () {
      helpers.assertEqual(core.resolveBalanceLevel({}, gateHistory({ tugSeconds: 12 })), 1);
      helpers.assertEqual(core.resolveBalanceLevel({}, gateHistory({ tugSeconds: 11.9 })), 2);
    }
  });

  cases.push({
    name: 'a missing self-test blocks advancement (no session log to fall back on)',
    fn: function () {
      helpers.assertEqual(core.resolveBalanceLevel({}, gateHistory({ tugSeconds: undefined })), 1);
      helpers.assertEqual(core.resolveBalanceLevel({}, gateHistory({ chairStandReps: undefined })), 1);
      helpers.assertEqual(core.resolveBalanceLevel({}, gateHistory({ lastSelfTestDate: null })), 1);
    }
  });

  cases.push({
    name: 'stale self-tests (older than 90 days) do not count towards the gate',
    fn: function () {
      helpers.assertEqual(core.resolveBalanceLevel({}, gateHistory({ lastSelfTestDate: '2026-01-01' })), 1);
    }
  });

  cases.push({
    name: 'the level cannot rise again until 4 weeks have passed at the current level',
    fn: function () {
      helpers.assertEqual(core.resolveBalanceLevel({}, gateHistory({ levelSetDate: '2026-05-25' })), 1);
    }
  });

  cases.push({
    name: 'the level never rises above 3',
    fn: function () {
      helpers.assertEqual(core.resolveBalanceLevel({}, gateHistory({ currentLevel: 3 })), 3);
    }
  });

  return helpers.runSuite('t3_tier_engine', cases);
}

module.exports = run;

if (require.main === module) {
  helpers.report(run());
}
