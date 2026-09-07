var fs = require('fs');
var path = require('path');
var core = require(path.join(__dirname, '..', 'app-core.js'));
var helpers = require('./helpers');

var html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function run() {
  var cases = [];

  cases.push({
    name: 'nothing renders until a file is actually uploaded',
    fn: function () {
      // The manifest ships empty. A missing file must leave no broken box.
      core.SELFCARE_MEDIA_KEYS.forEach(function (key) {
        helpers.assertEqual(core.getSelfcareMedia(key), null, key + ' should be gated while the manifest is empty');
      });
      helpers.assertEqual(core.getSelfcareMedia('no_such_key'), null);
      helpers.assertEqual(core.getSelfcareMedia(undefined), null);
    }
  });

  cases.push({
    name: 'an entry with no src is treated as absent, not as a broken picture',
    fn: function () {
      core.SELFCARE_MEDIA.temp_probe = { type: 'image', src: '' };
      helpers.assertEqual(core.getSelfcareMedia('temp_probe'), null, 'an empty src must not render');
      core.SELFCARE_MEDIA.temp_probe = { type: 'image', src: 'media/selfcare/x.jpg' };
      helpers.assert(core.getSelfcareMedia('temp_probe') !== null, 'a real src must render');
      delete core.SELFCARE_MEDIA.temp_probe;
    }
  });

  cases.push({
    name: 'there is a key for every medicine, room, self-test and food picture',
    fn: function () {
      helpers.assertEqual(core.SELFCARE_MEDIA_KEYS.length, 14);
      core.MED_CLASSES.forEach(function (med) {
        helpers.assert(core.SELFCARE_MEDIA_KEYS.indexOf('med_' + med.id) !== -1,
          med.id + ' has no media key, so adding that medicine would leave its picture unreachable');
      });
      var rooms = [];
      core.SAFETY_ITEMS.forEach(function (i) { if (rooms.indexOf(i.room) === -1) rooms.push(i.room); });
      rooms.forEach(function (room) {
        helpers.assert(core.SELFCARE_MEDIA_KEYS.indexOf('safety_' + room) !== -1, room + ' has no media key');
      });
    }
  });

  cases.push({
    name: 'every key the tabs ask for is a key the core knows about',
    fn: function () {
      // Literal keys, plus the two the Medicine and Safety tabs build at runtime.
      var asked = [];
      // Require a comma or bracket after the quote, so the two runtime-built
      // calls - selfcareMedia('med_' + med.id) - are not read as literal keys.
      var re = /selfcareMedia\('([a-z0-9_]+)'\s*[,)]/g;
      var m;
      while ((m = re.exec(html)) !== null) asked.push(m[1]);
      helpers.assert(asked.length >= 4, 'expected the tabs to ask for the fixed keys');
      asked.forEach(function (key) {
        helpers.assert(core.SELFCARE_MEDIA_KEYS.indexOf(key) !== -1,
          'index.html renders "' + key + '", which is not in SELFCARE_MEDIA_KEYS');
      });
      helpers.assert(/selfcareMedia\('med_' \+ med\.id/.test(html), 'the Medicine tab must ask per medicine');
      helpers.assert(/selfcareMedia\('safety_' \+ room\.id/.test(html), 'the Safety tab must ask per room');
    }
  });

  cases.push({
    name: 'all four tabs are wired, not just some',
    fn: function () {
      [['med_', 'Medicine'], ['test_chair_stand', 'Track'], ['safety_', 'Safety'], ['food_calcium', 'Food']]
        .forEach(function (pair) {
          helpers.assert(html.indexOf("selfcareMedia('" + pair[0]) !== -1, pair[1] + ' tab is not wired up');
        });
      helpers.assert(html.indexOf("selfcareMedia('test_tug'") !== -1, 'the TUG card is not wired up');
      helpers.assert(html.indexOf("selfcareMedia('food_vitamin_d'") !== -1, 'the vitamin D card is not wired up');
    }
  });

  cases.push({
    name: 'self-care pictures carry the same copy protection as the exercise ones',
    fn: function () {
      // Both go through mediaBlock, so there is one implementation to protect.
      helpers.assert(/function mediaBlock/.test(html), 'the shared media renderer must exist');
      var body = html.slice(html.indexOf('function mediaBlock'), html.indexOf('function selfcareMedia'));
      helpers.assert(body.indexOf('draggable="false"') !== -1, 'images must not be draggable');
      helpers.assert(body.indexOf('controlsList="nodownload') !== -1, 'video must offer no download');
      helpers.assert(body.indexOf('disablePictureInPicture') !== -1, 'video must not pop out');
      helpers.assert(html.indexOf('function selfcareMedia') !== -1 &&
        /selfcareMedia\(key, altText\)[\s\S]{0,160}mediaBlock\(C\.getSelfcareMedia\(key\), altText\)/.test(html),
        'selfcareMedia must delegate to mediaBlock rather than building its own markup');
      helpers.assert(/mediaBlock\(C\.getExerciseMedia/.test(html), 'the Move tab must use the shared renderer too');
    }
  });

  cases.push({
    name: 'the keys match the filenames the media brief tells the doctor to upload',
    fn: function () {
      // If these drift, files get generated under names nothing ever looks up.
      var brief = fs.readFileSync(path.join(__dirname, '..', 'media', 'all-media-prompts.md'), 'utf8');
      core.SELFCARE_MEDIA_KEYS.forEach(function (key) {
        helpers.assert(brief.indexOf('media/selfcare/' + key + '.jpg') !== -1,
          'the brief has no media/selfcare/' + key + '.jpg, so that picture would never be produced');
      });
    }
  });

  return helpers.runSuite('t15_selfcare_media', cases);
}

module.exports = run;

if (require.main === module) {
  helpers.report(run());
}
