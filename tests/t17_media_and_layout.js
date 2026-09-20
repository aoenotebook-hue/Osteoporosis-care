var fs = require('fs');
var path = require('path');
var core = require(path.join(__dirname, '..', 'app-core.js'));
var helpers = require('./helpers');

var root = path.join(__dirname, '..');
var html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function walk(dir, out) {
  fs.readdirSync(dir).forEach(function (f) {
    var p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p, out);
    else if (/\.(jpg|jpeg|png|mp4|webp)$/i.test(f)) out.push(path.relative(root, p).split(path.sep).join('/'));
  });
  return out;
}

/** Every media path the app can reach, however it reaches it. */
function referenced() {
  var used = {};
  Object.keys(core.MEDIA_MANIFEST).forEach(function (k) {
    var m = core.MEDIA_MANIFEST[k];
    if (m.src) used[m.src] = 1;
    if (m.poster) used[m.poster] = 1;
  });
  Object.keys(core.SELFCARE_MEDIA).forEach(function (k) {
    if (core.SELFCARE_MEDIA[k].src) used[core.SELFCARE_MEDIA[k].src] = 1;
  });
  core.MED_CLASSES.forEach(function (m) { if (m.photo) used[m.photo] = 1; });
  return used;
}

function run() {
  var cases = [];

  cases.push({
    name: 'every media file in the repository is actually shown somewhere',
    fn: function () {
      var used = referenced();
      var orphans = walk(path.join(root, 'media'), []).filter(function (f) { return !used[f]; });
      helpers.assertEqual(orphans.length, 0,
        'these files are uploaded but never rendered, so they are dead weight in the repo: ' + orphans.join(', '));
    }
  });

  cases.push({
    name: 'every media path the app points at exists on disk',
    fn: function () {
      var missing = Object.keys(referenced()).filter(function (f) { return !fs.existsSync(path.join(root, f)); });
      helpers.assertEqual(missing.length, 0, 'the app references files that are not there: ' + missing.join(', '));
    }
  });

  cases.push({
    name: 'all seventeen exercises have a picture, and a clip where one was filmed',
    fn: function () {
      core.EXERCISE_LIST.forEach(function (ex) {
        var media = core.getExerciseMedia(ex.id);
        helpers.assert(media !== null, ex.id + ' has no media entry');
        if (media.type === 'video') {
          helpers.assert(!!media.poster, ex.id + ' is a clip with no poster frame, so the card is blank until it plays');
        }
      });
    }
  });

  cases.push({
    name: 'media filenames carry no spaces or capitals',
    fn: function () {
      // A file named "Picking things up safely.jpg" can never be looked up by
      // exercise id, so it sits in the repo unreachable.
      var bad = walk(path.join(root, 'media'), []).filter(function (f) {
        var base = f.split('/').pop();
        return /\s/.test(base) || /[A-Z]/.test(base.replace(/\.[A-Za-z0-9]+$/, ''));
      });
      helpers.assertEqual(bad.length, 0, 'rename these so the app can find them: ' + bad.join(', '));
    }
  });

  cases.push({
    name: 'no picture is heavy enough to hurt on mobile data',
    fn: function () {
      var LIMIT_KB = 400;
      var heavy = walk(path.join(root, 'media'), []).filter(function (f) {
        return /\.(jpg|jpeg|png)$/i.test(f) && fs.statSync(path.join(root, f)).size > LIMIT_KB * 1024;
      });
      helpers.assertEqual(heavy.length, 0, 'compress these before shipping: ' + heavy.join(', '));
    }
  });

  cases.push({
    name: 'hiding an element actually hides it',
    fn: function () {
      // .a2hs-banner sets display:flex and .tab-bar display:grid, both of which
      // beat the browser's [hidden] rule, so the install banner sat on every
      // screen as an empty blue strip until this rule was added.
      helpers.assert(/\[hidden\]\s*\{\s*display:\s*none\s*!important/.test(html),
        'index.html needs a [hidden] rule strong enough to beat the component classes');
    }
  });

  cases.push({
    name: 'the header and tab bar line up with the content on a wide screen',
    fn: function () {
      // Without this the app reads as a stretched phone: a 680px column of
      // content under a header and tab bar spanning the whole window.
      var block = html.match(/@media \(min-width: 760px\)\s*\{[^@]*?\n  \}/);
      helpers.assert(!!block, 'there is no wide-screen rule at all');
      helpers.assert(/header\.app-header/.test(block[0]), 'the header is not aligned on a wide screen');
      helpers.assert(/nav\.tab-bar/.test(block[0]), 'the tab bar is not aligned on a wide screen');
    }
  });

  cases.push({
    name: 'the oral bisphosphonates offer the schedules they are really prescribed on',
    fn: function () {
      var alen = core.getMedClass('alendronate');
      var rise = core.getMedClass('risedronate');
      var iban = core.getMedClass('ibandronate');
      helpers.assert(alen.schedules.length >= 2, 'alendronate comes weekly and daily');
      helpers.assertEqual(rise.schedules.length, 3, 'risedronate comes daily, weekly and monthly');
      helpers.assertEqual(iban.schedules[0].cadenceType, 'months', 'ibandronate is monthly');

      // The interval must follow the chosen schedule, not the drug's default.
      helpers.assertEqual(core.computeNextDue('risedronate', '2026-01-10', 'daily'), '2026-01-11');
      helpers.assertEqual(core.computeNextDue('risedronate', '2026-01-10', 'weekly'), '2026-01-17');
      helpers.assertEqual(core.computeNextDue('risedronate', '2026-01-10', 'monthly'), '2026-02-10');
      // An unknown or missing id falls back to the first, never throws.
      helpers.assertEqual(core.computeNextDue('risedronate', '2026-01-10', 'nonsense'),
        core.computeNextDue('risedronate', '2026-01-10'));
    }
  });

  cases.push({
    name: 'a patient on the old generic bisphosphonate keeps their history',
    fn: function () {
      var moved = core.migrateMedicationId({ classId: 'bisphosphonate_weekly', startDate: '2025-01-01' });
      helpers.assertEqual(moved.classId, 'alendronate');
      helpers.assertEqual(moved.scheduleId, 'weekly');
      helpers.assertEqual(moved.startDate, '2025-01-01', 'the start date must survive the move');
      // A current id is left alone.
      helpers.assertEqual(core.migrateMedicationId({ classId: 'denosumab' }).classId, 'denosumab');
      helpers.assertEqual(core.migrateMedicationId(null), null);
    }
  });

  cases.push({
    name: 'denosumab still carries its stop-the-drug warning',
    fn: function () {
      // Stopping denosumab without a replacement can collapse several vertebrae
      // within a year or two. This warning was lost once in a refactor.
      var d = core.getMedClass('denosumab');
      helpers.assert(!!d.doNotStop && !!d.doNotStop.th && !!d.doNotStop.en, 'the do-not-stop warning is gone');
      helpers.assertEqual(d.doNotDelay, true);
      helpers.assert(html.indexOf("loc(med.doNotStop)") !== -1, 'the warning exists but is never rendered');
    }
  });

  cases.push({
    name: 'every food the nutrition review asks about has an icon',
    fn: function () {
      var table = html.match(/var FOOD_ICONS = \{[\s\S]*?\};/);
      helpers.assert(!!table, 'the icon table is missing');
      ['CALCIUM_FOODS', 'VITAMIN_D_FOODS', 'PROTEIN_FOODS'].forEach(function (list) {
        core[list].forEach(function (f) {
          helpers.assert(table[0].indexOf(f.id + ':') !== -1,
            list + '.' + f.id + ' has no icon, so its row reads as plain text among pictures');
        });
      });
    }
  });

  cases.push({
    name: 'Thai is the language the app opens in',
    fn: function () {
      helpers.assert(/lang:\s*'th'/.test(html), 'the default state must start in Thai');
      helpers.assert(!/navigator\.languages?\b/.test(html),
        'reading the browser language would open the app in English for a patient whose phone is set to English');
    }
  });

  return helpers.runSuite('t17_media_and_layout', cases);
}

module.exports = run;

if (require.main === module) {
  helpers.report(run());
}
