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

  // --- Bone status: diagnosis from density and fracture history only ---

  var boneCases = [
    { profile: {}, expected: 'unknown', desc: 'no scan and no fracture leaves the status unknown' },
    { profile: { tScore: -0.4 }, expected: 'normal', desc: 'T-score above -1.0 is normal' },
    { profile: { tScore: -1.0 }, expected: 'normal', desc: 'T-score exactly -1.0 is still normal' },
    { profile: { tScore: -1.8 }, expected: 'osteopenia', desc: 'T-score between -1.0 and -2.5 is thinning bone' },
    { profile: { tScore: -2.5 }, expected: 'osteoporosis', desc: 'T-score exactly -2.5 is osteoporosis' },
    { profile: { tScore: -3.1 }, expected: 'osteoporosis', desc: 'T-score below -2.5 is osteoporosis' },
    { profile: { priorFragilityFracture: true, fractureSite: 'hip' }, expected: 'severeOsteoporosis', desc: 'a hip fragility fracture is osteoporosis on clinical grounds' },
    { profile: { priorFragilityFracture: true, fractureSite: 'spine' }, expected: 'severeOsteoporosis', desc: 'a spine fragility fracture is osteoporosis on clinical grounds' },
    { profile: { priorFragilityFracture: true, fractureSite: 'hip', tScore: -0.2 }, expected: 'severeOsteoporosis', desc: 'a hip fracture outranks a normal-looking scan' },
    { profile: { priorFragilityFracture: true, fractureSite: 'wrist' }, expected: 'osteoporosis', desc: 'a wrist fragility fracture without a scan is osteoporosis' },
    { profile: { priorFragilityFracture: true, fractureSite: 'wrist', tScore: -2.7 }, expected: 'severeOsteoporosis', desc: 'a fracture plus an osteoporotic scan is the severe category' },
    { profile: { priorFragilityFracture: true, fractureSite: 'other', tScore: -1.2 }, expected: 'osteoporosis', desc: 'a fragility fracture with thinning bone still counts as osteoporosis' }
  ];

  boneCases.forEach(function (c) {
    cases.push({ name: c.desc, fn: function () { helpers.assertEqual(core.resolveBoneStatus(c.profile), c.expected, c.desc); } });
  });

  cases.push({
    name: 'age, steroids and falls do not by themselves make a bone diagnosis',
    fn: function () {
      helpers.assertEqual(core.resolveBoneStatus({ age: 82 }), 'unknown');
      helpers.assertEqual(core.resolveBoneStatus({ longTermSteroid: true }), 'unknown');
      helpers.assertEqual(core.resolveBoneStatus({ fallsLast12mo: 3 }), 'unknown');
      helpers.assertEqual(core.resolveBoneStatus({ age: 82, longTermSteroid: true, fallsLast12mo: 3, tScore: -0.5 }), 'normal',
        'risk factors must not override a normal density reading');
    }
  });

  // --- Fall risk: STEADI-style grading, separate from the bone diagnosis ---

  var fallCases = [
    { profile: {}, history: {}, expected: 'low', desc: 'no falls and no concerns is low risk' },
    { profile: { fallsLast12mo: 1 }, history: {}, expected: 'moderate', desc: 'one fall without injury is moderate risk' },
    { profile: { fallsLast12mo: 2 }, history: {}, expected: 'high', desc: 'two or more falls is high risk' },
    { profile: { fallsLast12mo: 1, fallWithInjury: true }, history: {}, expected: 'high', desc: 'one fall that caused injury is high risk' },
    { profile: {}, history: { tugSeconds: 12 }, expected: 'high', desc: 'a TUG of 12 seconds or more is high risk' },
    { profile: {}, history: { tugSeconds: 11.5 }, expected: 'low', desc: 'a TUG under 12 seconds does not raise the risk on its own' },
    { profile: { feelsUnsteady: true }, history: {}, expected: 'moderate', desc: 'feeling unsteady is moderate risk' },
    { profile: { fearOfFalling: true }, history: {}, expected: 'moderate', desc: 'worrying about falling is moderate risk' },
    { profile: { walksWithAid: true }, history: {}, expected: 'moderate', desc: 'using a walking aid is moderate risk' },
    { profile: { fallsLast12mo: 3, fearOfFalling: true }, history: { tugSeconds: 20 }, expected: 'high', desc: 'several signals together stay high, never averaged down' }
  ];

  fallCases.forEach(function (c) {
    cases.push({ name: c.desc, fn: function () { helpers.assertEqual(core.resolveFallRisk(c.profile, c.history), c.expected, c.desc); } });
  });

  cases.push({
    name: 'the two classifications are independent of each other',
    fn: function () {
      var brittleButSteady = { tScore: -3.0 };
      helpers.assertEqual(core.resolveBoneStatus(brittleButSteady), 'osteoporosis');
      helpers.assertEqual(core.resolveFallRisk(brittleButSteady, {}), 'low', 'thin bone does not by itself mean a fall risk');

      var unsteadyButStrong = { tScore: -0.5, fallsLast12mo: 2 };
      helpers.assertEqual(core.resolveBoneStatus(unsteadyButStrong), 'normal');
      helpers.assertEqual(core.resolveFallRisk(unsteadyButStrong, {}), 'high', 'falling often does not by itself mean thin bone');
    }
  });

  cases.push({
    name: 'every bone status and fall risk has a name, meaning and (for falls) an action',
    fn: function () {
      Object.keys(core.BONE_STATUS).forEach(function (key) {
        var status = core.BONE_STATUS[key];
        var name = status.charAt(0).toUpperCase() + status.slice(1);
        helpers.assert(!!core.CONTENT['boneStatus' + name + '_name'], 'missing name text for bone status ' + status);
        helpers.assert(!!core.CONTENT['boneStatus' + name + '_desc'], 'missing plain-language meaning for bone status ' + status);
      });
      Object.keys(core.FALL_RISK).forEach(function (key) {
        var risk = core.FALL_RISK[key];
        var name = risk.charAt(0).toUpperCase() + risk.slice(1);
        helpers.assert(!!core.CONTENT['fallRisk' + name + '_name'], 'missing name text for fall risk ' + risk);
        helpers.assert(!!core.CONTENT['fallRisk' + name + '_desc'], 'missing plain-language meaning for fall risk ' + risk);
        helpers.assert(!!core.CONTENT['fallRisk' + name + '_action'], 'missing management advice for fall risk ' + risk);
      });
    }
  });

  // --- The assessment questions feeding those two ---

  cases.push({
    name: 'the assessment no longer asks for age or sex, which come from registration',
    fn: function () {
      var fields = core.ONBOARDING_QUESTIONS.map(function (q) { return q.field; });
      helpers.assert(fields.indexOf('age') === -1, 'age should not be asked again');
      helpers.assert(fields.indexOf('sex') === -1, 'sex should not be asked again');
    }
  });

  cases.push({
    name: 'the assessment collects what each algorithm needs',
    fn: function () {
      var fields = core.ONBOARDING_QUESTIONS.map(function (q) { return q.field; });
      ['priorFragilityFracture', 'fractureSite', 'tScore'].forEach(function (field) {
        helpers.assert(fields.indexOf(field) !== -1, 'bone status needs "' + field + '"');
      });
      ['fallsLast12mo', 'fallWithInjury', 'feelsUnsteady', 'fearOfFalling', 'walksWithAid'].forEach(function (field) {
        helpers.assert(fields.indexOf(field) !== -1, 'fall risk needs "' + field + '"');
      });
    }
  });

  cases.push({
    name: 'the injury follow-up is only asked of someone who has fallen',
    fn: function () {
      var q = core.ONBOARDING_QUESTIONS.filter(function (x) { return x.field === 'fallWithInjury'; })[0];
      helpers.assertEqual(q.dependsOn.field, 'fallsLast12mo');
      helpers.assertEqual(q.dependsOn.min, 1);
    }
  });

  cases.push({
    name: 'the fracture site question offers an "other" option',
    fn: function () {
      var q = core.ONBOARDING_QUESTIONS.filter(function (x) { return x.field === 'fractureSite'; })[0];
      helpers.assert(q.options.map(function (o) { return o.value; }).indexOf('other') !== -1);
    }
  });

  cases.push({
    name: 'the medication question offers only real osteoporosis treatments',
    fn: function () {
      var values = core.ONBOARDING_QUESTIONS
        .filter(function (x) { return x.field === 'currentMedClass'; })[0]
        .options.map(function (o) { return o.value; });
      helpers.assert(values.indexOf('calcium_vitd') === -1, 'supplements are not a treatment option');
      helpers.assert(values.indexOf('bisphosphonate_daily') === -1, 'the daily oral bisphosphonate was removed');
      helpers.assert(values.indexOf('none') !== -1, 'a "not taking any" option should remain');
    }
  });

  // --- Balance level follows fall risk, and still ratchets ---

  cases.push({
    name: 'a high fall risk or a walking aid starts at the fully supported level',
    fn: function () {
      helpers.assertEqual(core.defaultBalanceLevelForProfile({ fallsLast12mo: 2 }), 1);
      helpers.assertEqual(core.defaultBalanceLevelForProfile({ walksWithAid: true }), 1);
      helpers.assertEqual(core.defaultBalanceLevelForProfile({}), 2);
    }
  });

  cases.push({
    name: 'a fall in the last 4 weeks always drops the level, even when the gate is otherwise met',
    fn: function () {
      helpers.assertEqual(core.resolveBalanceLevel({}, gateHistory({ currentLevel: 3, fallsLast4Weeks: 1 })), 2);
      helpers.assertEqual(core.resolveBalanceLevel({}, gateHistory({ currentLevel: 1, fallsLast4Weeks: 2 })), 1, 'never below level 1');
    }
  });

  cases.push({
    name: 'the level rises only on fresh passing self-tests after 4 settled weeks',
    fn: function () {
      helpers.assertEqual(core.resolveBalanceLevel({}, gateHistory()), 2, 'gate fully met');
      helpers.assertEqual(core.resolveBalanceLevel({}, gateHistory({ chairStandReps: 3 })), 1, 'chair-stand below norm blocks it');
      helpers.assertEqual(core.resolveBalanceLevel({}, gateHistory({ tugSeconds: 12 })), 1, 'a slow TUG blocks it');
      helpers.assertEqual(core.resolveBalanceLevel({}, gateHistory({ tugSeconds: undefined })), 1, 'a missing test blocks it');
      helpers.assertEqual(core.resolveBalanceLevel({}, gateHistory({ lastSelfTestDate: '2026-01-01' })), 1, 'a stale test blocks it');
      helpers.assertEqual(core.resolveBalanceLevel({}, gateHistory({ levelSetDate: '2026-05-25' })), 1, 'too soon after the last change');
      helpers.assertEqual(core.resolveBalanceLevel({}, gateHistory({ currentLevel: 3 })), 3, 'never above level 3');
    }
  });

  return helpers.runSuite('t3_classification', cases);
}

module.exports = run;

if (require.main === module) {
  helpers.report(run());
}
