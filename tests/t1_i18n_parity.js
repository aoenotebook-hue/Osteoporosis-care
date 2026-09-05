var path = require('path');
var core = require(path.join(__dirname, '..', 'app-core.js'));
var helpers = require('./helpers');

function checkPair(pair, label) {
  helpers.assert(pair && typeof pair.th === 'string' && pair.th.length > 0, 'missing Thai text for ' + label);
  helpers.assert(pair && typeof pair.en === 'string' && pair.en.length > 0, 'missing English text for ' + label);
}

function run() {
  var cases = [];

  cases.push({
    name: 'every CONTENT key has non-empty Thai and English text',
    fn: function () {
      Object.keys(core.CONTENT).forEach(function (key) {
        checkPair(core.CONTENT[key], 'CONTENT.' + key);
      });
    }
  });

  cases.push({
    name: 'Thai and English strings are actually different text',
    fn: function () {
      Object.keys(core.CONTENT).forEach(function (key) {
        var entry = core.CONTENT[key];
        // Abbreviations and units that are written the same way in both languages.
        if (['iuUnit', 'headerHnLabel'].indexOf(key) !== -1) return;
        helpers.assert(entry.th !== entry.en, 'CONTENT.' + key + ' has identical TH and EN text — likely an untranslated string');
      });
    }
  });

  cases.push({
    name: 'onboarding question labels and options resolve to real content',
    fn: function () {
      core.ONBOARDING_QUESTIONS.forEach(function (q) {
        helpers.assert(!!core.CONTENT[q.labelKey], 'missing CONTENT for labelKey "' + q.labelKey + '"');
        (q.options || []).forEach(function (opt) {
          if (opt.labelKey) helpers.assert(!!core.CONTENT[opt.labelKey], 'missing CONTENT for option "' + opt.labelKey + '"');
          else checkPair(opt.label, 'inline option label in ' + q.id);
        });
      });
    }
  });

  cases.push({
    name: 'tab labels are short enough to fit a seven-tab bar',
    fn: function () {
      ['navHome', 'navDrug', 'navBone', 'navMove', 'navSafety', 'navTrack', 'navAlert'].forEach(function (key) {
        var entry = core.CONTENT[key];
        helpers.assert(!!entry, 'missing tab label ' + key);
        helpers.assert(entry.th.length <= 9, 'Thai tab label "' + entry.th + '" is too long for the tab bar');
        helpers.assert(entry.en.length <= 10, 'English tab label "' + entry.en + '" is too long for the tab bar');
      });
    }
  });

  cases.push({
    name: 'resource links and red flags resolve to real content, with actions on every flag',
    fn: function () {
      core.RESOURCE_LINKS.forEach(function (link) {
        helpers.assert(!!core.CONTENT[link.titleKey], 'missing CONTENT for "' + link.titleKey + '"');
        helpers.assert(!!core.CONTENT[link.descKey], 'missing CONTENT for "' + link.descKey + '"');
      });
      core.RED_FLAGS.forEach(function (flag) {
        helpers.assert(!!core.CONTENT[flag.key], 'missing CONTENT for red flag "' + flag.key + '"');
        helpers.assert(!!core.CONTENT[flag.actionKey], 'missing action text for red flag "' + flag.id + '"');
        helpers.assert(['critical', 'serious'].indexOf(flag.severity) !== -1, flag.id + ' has an unknown severity');
        helpers.assert(!!flag.icon, flag.id + ' is missing an icon');
      });
    }
  });

  cases.push({
    name: 'medication content is bilingual across every field',
    fn: function () {
      core.MED_CLASSES.forEach(function (med) {
        ['name', 'whatItDoes', 'instructions', 'missedDose', 'sideEffects', 'tellDoctor'].forEach(function (field) {
          checkPair(med[field], med.id + '.' + field);
        });
        if (med.doNotStop) checkPair(med.doNotStop, med.id + '.doNotStop');
      });
    }
  });

  cases.push({
    name: 'nutrition food tables are bilingual',
    fn: function () {
      [core.CALCIUM_FOODS, core.VITAMIN_D_FOODS, core.PROTEIN_FOODS].forEach(function (table) {
        table.forEach(function (food) {
          checkPair(food.name, food.id + '.name');
          checkPair(food.serving, food.id + '.serving');
        });
      });
    }
  });

  cases.push({
    name: 'exercises are bilingual in name, amount and how-to',
    fn: function () {
      core.EXERCISE_LIST.forEach(function (ex) {
        checkPair(ex.name, ex.id + '.name');
        checkPair(ex.amount, ex.id + '.amount');
        checkPair(ex.howTo, ex.id + '.howTo');
      });
    }
  });

  cases.push({
    name: 'safety items are bilingual',
    fn: function () {
      core.SAFETY_ITEMS.forEach(function (item) { checkPair(item.name, item.id + '.name'); });
    }
  });

  return helpers.runSuite('t1_i18n_parity', cases);
}

module.exports = run;

if (require.main === module) {
  helpers.report(run());
}
