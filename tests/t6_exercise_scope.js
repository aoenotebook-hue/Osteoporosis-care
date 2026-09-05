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
        helpers.assert(list.length > 0, 'level ' + level + ' should have exercises');
        list.forEach(function (ex) {
          helpers.assert(ex.levels.indexOf(level) !== -1, ex.id + ' should not appear at level ' + level);
        });
      });
    }
  });

  cases.push({
    name: 'level 1 never shows unsupported level-3 exercises',
    fn: function () {
      var ids = core.getExercisesForPatient(1, []).map(function (ex) { return ex.id; });
      helpers.assert(ids.indexOf('tandem_walk') === -1, 'tandem_walk should not appear at level 1');
      helpers.assert(ids.indexOf('backward_walk') === -1, 'backward_walk should not appear at level 1');
    }
  });

  cases.push({
    name: 'a vertebral fracture hides avoidIf-flagged exercises at every level',
    fn: function () {
      [1, 2, 3].forEach(function (level) {
        var flagged = core.getExercisesForPatient(level, ['vertebralFracture']).filter(function (ex) {
          return ex.avoidIf.indexOf('vertebralFracture') !== -1;
        });
        helpers.assertEqual(flagged.length, 0, 'level ' + level + ' should hide flagged exercises');
      });
    }
  });

  cases.push({
    name: 'without the avoid tag, flagged exercises still show for eligible levels',
    fn: function () {
      var ids = core.getExercisesForPatient(2, []).map(function (ex) { return ex.id; });
      helpers.assert(ids.indexOf('seated_row_band') !== -1, 'seated_row_band should show at level 2 with no avoid tags');
    }
  });

  cases.push({
    name: 'every exercise carries a written how-to so a patient can follow it alone',
    fn: function () {
      core.EXERCISE_LIST.forEach(function (ex) {
        helpers.assert(ex.howTo && ex.howTo.th && ex.howTo.en, ex.id + ' is missing a TH/EN how-to explanation');
        helpers.assert(ex.howTo.th.length > 40, ex.id + ' Thai how-to looks too short to follow');
        helpers.assert(ex.howTo.en.length > 40, ex.id + ' English how-to looks too short to follow');
        helpers.assert(ex.amount && ex.amount.th && ex.amount.en, ex.id + ' is missing a TH/EN amount');
      });
    }
  });

  cases.push({
    name: 'every exercise declares a valid group and at least one level',
    fn: function () {
      var groups = ['balance', 'strength', 'posture'];
      core.EXERCISE_LIST.forEach(function (ex) {
        helpers.assert(groups.indexOf(ex.group) !== -1, ex.id + ' has an invalid group');
        helpers.assert(Array.isArray(ex.levels) && ex.levels.length > 0, ex.id + ' must declare a level');
      });
    }
  });

  cases.push({
    name: 'media is only reported for exercises whose file is actually in the manifest',
    fn: function () {
      core.EXERCISE_LIST.forEach(function (ex) {
        var declared = core.MEDIA_MANIFEST[ex.id];
        if (!declared || !declared.src) {
          helpers.assertEqual(core.hasExerciseMedia(ex.id), false, ex.id + ' has no media file, so no media area should render');
          helpers.assertEqual(core.getExerciseMedia(ex.id), null);
        } else {
          helpers.assertEqual(core.hasExerciseMedia(ex.id), true, ex.id + ' declares media and should render it');
        }
      });
    }
  });

  cases.push({
    name: 'a manifest entry without a usable src is treated as no media',
    fn: function () {
      core.MEDIA_MANIFEST.__test_placeholder = { type: 'video', src: '' };
      helpers.assertEqual(core.hasExerciseMedia('__test_placeholder'), false);
      core.MEDIA_MANIFEST.__test_real = { type: 'image', src: 'media/exercises/test.jpg' };
      helpers.assertEqual(core.hasExerciseMedia('__test_real'), true);
      delete core.MEDIA_MANIFEST.__test_placeholder;
      delete core.MEDIA_MANIFEST.__test_real;
    }
  });

  return helpers.runSuite('t6_exercise_scope', cases);
}

module.exports = run;

if (require.main === module) {
  helpers.report(run());
}
