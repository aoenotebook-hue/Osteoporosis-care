var fs = require('fs');
var path = require('path');
var vm = require('vm');
var core = require(path.join(__dirname, '..', 'app-core.js'));
var helpers = require('./helpers');

var root = path.join(__dirname, '..');
var ui = fs.readFileSync(path.join(root, 'app-ui.js'), 'utf8');
var page = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

/** One function's source from app-ui.js, from its first line to its closing brace. */
function fn(name) {
  var m = ui.match(new RegExp('\\n  function ' + name + '\\([^)]*\\) \\{[\\s\\S]*?\\n  \\}'));
  helpers.assert(m, 'app-ui.js has no function ' + name);
  return m[0];
}

function run() {
  var cases = [];

  cases.push({
    name: 'year of birth is chosen on a dial, and nothing is recorded until the patient chooses',
    fn: function () {
      helpers.assert(ui.indexOf('<input type="number" id="yobInput"') === -1, 'the old typed year box is back');
      var wheel = fn('birthYearWheel');
      helpers.assert(/C\.PATIENT_AGE\.max/.test(wheel) && /C\.PATIENT_AGE\.min/.test(wheel), 'the dial covers exactly the ages the rules accept');
      var field = fn('wheelField');
      helpers.assert(/value="' \+ \(chosen \? esc\(opts\.value\) : ''\) \+ '"/.test(field), 'the hidden answer must start empty');
      // Scrolling the dial into place when it is drawn is not an answer.
      helpers.assert(/if \(!touched\) return;/.test(fn('wireWheel')), 'a scroll the patient did not make would choose a year');
      helpers.assert(/if \(isNaN\(yearRaw\)\) return fail\('registerYearRequired'\)/.test(fn('handleRegisterSubmit')), 'no year: the patient must be told');
    }
  });

  cases.push({
    name: 'falls in the past year are one tap each, and still grade fall risk the same way',
    fn: function () {
      var q = core.ONBOARDING_QUESTIONS.filter(function (x) { return x.field === 'fallsLast12mo'; })[0];
      helpers.assertEqual(q.type, 'count');
      helpers.assertEqual(q.max, 5);
      var numbers = core.ONBOARDING_QUESTIONS.filter(function (x) { return x.type === 'number'; }).map(function (x) { return x.field; });
      helpers.assertEqual(numbers.join(), 'tScore', 'only the T-score is still a number box');
      [[0, 'low'], [1, 'moderate'], [2, 'high'], [5, 'high']].forEach(function (c) {
        helpers.assertEqual(core.resolveFallRisk({ fallsLast12mo: c[0] }, {}), c[1], c[0] + ' falls');
      });
      helpers.assert(/answerType === 'number' \? Number\(raw\)/.test(ui), 'the tapped count must be stored as a number');
    }
  });

  cases.push({
    name: 'the T-score slider names the same band the app classifies by',
    fn: function () {
      var zones = [
        { max: core.T_SCORE_OSTEOPOROSIS, tone: 'bad', text: 'osteoporosis' },
        { max: core.T_SCORE_NORMAL, below: true, tone: 'mid', text: 'osteopenia' },
        { tone: 'good', text: 'normal' }
      ];
      helpers.assert(/max: C\.T_SCORE_OSTEOPOROSIS, tone: 'bad'/.test(ui) && /max: C\.T_SCORE_NORMAL, below: true, tone: 'mid'/.test(ui),
        'the slider bands must come from the app\'s own cut-offs');
      var ctx = { tr: function (k) { return k; } };
      vm.createContext(ctx);
      vm.runInContext(fn('zoneFor'), ctx);
      [-4, -2.6, -2.5, -2.4, -1.1, -1.05, -1, -0.9, 0, 2].forEach(function (t) {
        helpers.assertEqual(ctx.zoneFor(zones, t), core.resolveBoneStatus({ tScore: t }), 'T-score ' + t);
      });
      helpers.assertEqual(ctx.zoneFor(zones, null), '', 'nothing chosen, no band');
      var slider = fn('sliderField');
      helpers.assert(/\(has \? '' : ' unset'\)/.test(slider), 'an untouched slider must look untouched');
    }
  });

  cases.push({
    name: 'the medicine question shows each medicine full width with its picture',
    fn: function () {
      var onboarding = fn('renderOnboarding');
      helpers.assert(/q\.field === 'currentMedClass'/.test(onboarding) && /class="med-photo"/.test(onboarding), 'no pictures on the medicine question');
      core.MED_CLASSES.forEach(function (m) {
        helpers.assert(m.photo && fs.existsSync(path.join(root, m.photo)), m.id + ' has no picture on disk');
      });
    }
  });

  cases.push({
    name: 'nutrition questions read as whole lines, with a slider and a box for each number',
    fn: function () {
      var row = fn('freqRow');
      helpers.assert(/sliderField\(\{ id: id, compact: true/.test(row), 'food rows need the slider and box');
      helpers.assert(/<span class="freq-food">[\s\S]*<span class="freq-serving">/.test(row), 'name and serving belong on one line of text');
      helpers.assert(!/\.freq-(food|serving) \{[^}]*display: block/.test(page), 'a food name or serving is forced onto a line of its own again');
      var wizard = fn('renderNutritionWizard');
      ['sunMinutes', 'weightKg'].forEach(function (id) {
        helpers.assert(new RegExp("sliderField\\(\\{ id: '" + id + "'").test(wizard), id + ' needs the slider and box');
      });
      helpers.assert(!/nutritionServingsPerWeek'\)\) \+ '<\/p>/.test(wizard), 'a unit on its own line under the list is back');
    }
  });

  cases.push({
    name: 'Track: BMD on sliders, height on a dial, falls as a graph and a summary only',
    fn: function () {
      var bmd = fn('renderBmdCard');
      helpers.assert(/tScoreSlider\('bmdSpineT'/.test(bmd) && /tScoreSlider\('bmdHipT'/.test(bmd), 'BMD needs the sliders');
      helpers.assert(!/field-row/.test(bmd), 'side by side, the two boxes were too narrow to read');
      helpers.assert(/heightWheel\('heightInput'\)/.test(fn('renderHeightCard')), 'height needs the dial');
      var falls = fn('renderFallsCard');
      helpers.assert(/barChart\(/.test(falls), 'the graph must stay');
      helpers.assert(/fallsSummaryCount/.test(falls), 'the summary must stay');
      helpers.assert(!/<ul|<li|falls\.slice\(/.test(falls), 'the list of fall dates is back');
      helpers.assert(/if \(isNaN\(cm\)\) nudgeWheel\('heightInput'\)/.test(ui), 'saving an untouched dial must point at it');
    }
  });

  cases.push({
    name: 'charts count in whole numbers, and Thai dates use the Buddhist era',
    fn: function () {
      helpers.assert(/Math\.max\(2, Math\.ceil\([\s\S]*?\) \/ 2\) \* 2\)/.test(fn('barChart')), 'a bar chart topped at 1 labels its middle line "1" too');
      helpers.assert(/displayYear\(d\.getFullYear\(\)\)/.test(fn('formatDate')), 'Thai dates must show the Buddhist-era year');
      helpers.assert(/displayYear\(d\.getFullYear\(\)\)/.test(fn('shortDate')), 'chart dates must show the Buddhist-era year');
      helpers.assert(/state\.lang === 'th' \? year \+ 543 : year/.test(fn('displayYear')), 'English keeps the Western year');
    }
  });

  return helpers.runSuite('t24_easy_inputs', cases);
}

module.exports = run;

if (require.main === module) {
  helpers.report(run());
}
