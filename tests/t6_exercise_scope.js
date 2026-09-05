var path = require('path');
var core = require(path.join(__dirname, '..', 'app-core.js'));
var helpers = require('./helpers');

function run() {
  var cases = [];

  cases.push({
    name: 'each balance level only sees exercises tagged for that level',
    fn: function () {
      [1, 2, 3].forEach(function (level) {
        var list = core.getExercisesForPatient(level, []);
        helpers.assert(list.length > 0, 'level ' + level + ' should have at least one exercise');
        list.forEach(function (ex) {
          helpers.assert(ex.levels.indexOf(level) !== -1, ex.id + ' should not appear for level ' + level);
        });
      });
    }
  });

  cases.push({
    name: 'level 1 never includes level-3-only exercises like tandem walk or backward walk',
    fn: function () {
      var list = core.getExercisesForPatient(1, []);
      var ids = list.map(function (ex) { return ex.id; });
      helpers.assert(ids.indexOf('tandem_walk') === -1, 'tandem_walk should not appear at level 1');
      helpers.assert(ids.indexOf('backward_walk') === -1, 'backward_walk should not appear at level 1');
    }
  });

  cases.push({
    name: 'a patient flagged with a vertebral fracture never sees avoidIf-flagged exercises, at any level',
    fn: function () {
      [1, 2, 3].forEach(function (level) {
        var list = core.getExercisesForPatient(level, ['vertebralFracture']);
        var flagged = list.filter(function (ex) { return ex.avoidIf.indexOf('vertebralFracture') !== -1; });
        helpers.assertEqual(flagged.length, 0, 'level ' + level + ' should hide vertebralFracture-flagged exercises');
      });
    }
  });

  cases.push({
    name: 'without the avoid tag, flagged exercises are still shown to eligible levels',
    fn: function () {
      var list = core.getExercisesForPatient(2, []);
      var ids = list.map(function (ex) { return ex.id; });
      helpers.assert(ids.indexOf('seated_row_band') !== -1, 'seated_row_band should be visible at level 2 with no avoid tags');
    }
  });

  cases.push({
    name: 'every exercise declares a valid group and non-empty levels array',
    fn: function () {
      var validGroups = ['balance', 'strength', 'posture'];
      core.EXERCISE_LIST.forEach(function (ex) {
        helpers.assert(validGroups.indexOf(ex.group) !== -1, ex.id + ' has invalid group "' + ex.group + '"');
        helpers.assert(Array.isArray(ex.levels) && ex.levels.length > 0, ex.id + ' must declare at least one level');
      });
    }
  });

  cases.push({
    name: 'media manifest gating leaves no blank tiles: every exercise has a name to fall back on when video is missing',
    fn: function () {
      core.EXERCISE_LIST.forEach(function (ex) {
        helpers.assert(ex.name && ex.name.th && ex.name.en, ex.id + ' must have a text fallback if video is unavailable');
      });
    }
  });

  cases.push({
    name: 'weekly targets match the plan (balance 3x, strength 2x, walking 30min most days)',
    fn: function () {
      helpers.assertEqual(core.WEEKLY_TARGETS.balanceSessionsPerWeek, 3);
      helpers.assertEqual(core.WEEKLY_TARGETS.strengthSessionsPerWeek, 2);
      helpers.assertEqual(core.WEEKLY_TARGETS.walkingMinutesMostDays, 30);
    }
  });

  return helpers.runSuite('t6_exercise_scope', cases);
}

module.exports = run;

if (require.main === module) {
  helpers.report(run());
}
