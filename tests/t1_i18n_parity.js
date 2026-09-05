var path = require('path');
var core = require(path.join(__dirname, '..', 'app-core.js'));
var helpers = require('./helpers');

function run() {
  var cases = [];

  cases.push({
    name: 'every CONTENT key has non-empty th and en',
    fn: function () {
      Object.keys(core.CONTENT).forEach(function (key) {
        var entry = core.CONTENT[key];
        helpers.assert(entry && typeof entry.th === 'string' && entry.th.length > 0, 'missing th for key "' + key + '"');
        helpers.assert(entry && typeof entry.en === 'string' && entry.en.length > 0, 'missing en for key "' + key + '"');
      });
    }
  });

  cases.push({
    name: 'onboarding question labelKeys resolve in CONTENT',
    fn: function () {
      core.ONBOARDING_QUESTIONS.forEach(function (q) {
        helpers.assert(!!core.CONTENT[q.labelKey], 'missing CONTENT entry for labelKey "' + q.labelKey + '" (question ' + q.id + ')');
        (q.options || []).forEach(function (opt) {
          if (opt.labelKey) {
            helpers.assert(!!core.CONTENT[opt.labelKey], 'missing CONTENT entry for option labelKey "' + opt.labelKey + '"');
          } else {
            helpers.assert(opt.label && opt.label.th && opt.label.en, 'option missing inline th/en label');
          }
        });
      });
    }
  });

  cases.push({
    name: 'resource link titleKey/descKey resolve in CONTENT',
    fn: function () {
      core.RESOURCE_LINKS.forEach(function (link) {
        helpers.assert(!!core.CONTENT[link.titleKey], 'missing CONTENT entry for titleKey "' + link.titleKey + '"');
        helpers.assert(!!core.CONTENT[link.descKey], 'missing CONTENT entry for descKey "' + link.descKey + '"');
      });
    }
  });

  cases.push({
    name: 'red flag keys resolve in CONTENT',
    fn: function () {
      core.RED_FLAGS.forEach(function (flag) {
        helpers.assert(!!core.CONTENT[flag.key], 'missing CONTENT entry for red flag key "' + flag.key + '"');
      });
    }
  });

  cases.push({
    name: 'medication class name th/en pairs present',
    fn: function () {
      core.MED_CLASSES.forEach(function (med) {
        helpers.assert(med.name && med.name.th && med.name.en, 'med class ' + med.id + ' missing name th/en');
        helpers.assert(med.instructions && med.instructions.th && med.instructions.en, 'med class ' + med.id + ' missing instructions th/en');
      });
    }
  });

  cases.push({
    name: 'food table and exercise list th/en pairs present',
    fn: function () {
      core.FOOD_TABLE.forEach(function (food) {
        helpers.assert(food.name.th && food.name.en, 'food ' + food.id + ' missing name th/en');
        helpers.assert(food.serving.th && food.serving.en, 'food ' + food.id + ' missing serving th/en');
      });
      core.EXERCISE_LIST.forEach(function (ex) {
        helpers.assert(ex.name.th && ex.name.en, 'exercise ' + ex.id + ' missing name th/en');
        helpers.assert(ex.reps.th && ex.reps.en, 'exercise ' + ex.id + ' missing reps th/en');
      });
    }
  });

  cases.push({
    name: 'safety items have th/en names',
    fn: function () {
      core.SAFETY_ITEMS.forEach(function (item) {
        helpers.assert(item.name.th && item.name.en, 'safety item ' + item.id + ' missing name th/en');
      });
    }
  });

  return helpers.runSuite('t1_i18n_parity', cases);
}

module.exports = run;

if (require.main === module) {
  helpers.report(run());
}
