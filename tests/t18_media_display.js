var fs = require('fs');
var path = require('path');
var core = require(path.join(__dirname, '..', 'app-core.js'));
var helpers = require('./helpers');

var root = path.join(__dirname, '..');
var html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
var sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

/** Width and height from a JPEG's start-of-frame marker. */
function jpegSize(file) {
  var b = fs.readFileSync(path.join(root, file));
  if (b[0] !== 0xFF || b[1] !== 0xD8) return null;
  var i = 2;
  while (i < b.length) {
    if (b[i] !== 0xFF) { i++; continue; }
    var marker = b[i + 1];
    if (marker >= 0xC0 && marker <= 0xCF && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC) {
      return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
    }
    i += 2 + b.readUInt16BE(i + 2);
  }
  return null;
}

/** Width and height of the video track, from the MP4 track header. */
function mp4Size(file) {
  var b = fs.readFileSync(path.join(root, file));
  var at = -1;
  var from = 0;
  while ((from = b.indexOf('tkhd', from)) !== -1) {
    var w = b.readUInt32BE(from + (b[from + 4] === 1 ? 92 : 80)) / 65536;
    if (w > 0) { at = from; break; }
    from += 4;
  }
  if (at === -1) return null;
  var off = b[at + 4] === 1 ? 92 : 80;
  return { w: b.readUInt32BE(at + off) / 65536, h: b.readUInt32BE(at + off + 4) / 65536 };
}

function allEntries() {
  var out = [];
  Object.keys(core.MEDIA_MANIFEST).forEach(function (k) { out.push(['MEDIA_MANIFEST.' + k, core.MEDIA_MANIFEST[k]]); });
  Object.keys(core.SELFCARE_MEDIA).forEach(function (k) { out.push(['SELFCARE_MEDIA.' + k, core.SELFCARE_MEDIA[k]]); });
  return out;
}

function run() {
  var cases = [];

  cases.push({
    name: 'every .jpg is really a JPEG',
    fn: function () {
      // Two drug photos arrived as transparent PNGs named .jpg; flattening them
      // blindly turned the background black. A real JPEG has no transparency to lose.
      var files = [];
      ['exercises', 'selfcare', 'meds'].forEach(function (d) {
        fs.readdirSync(path.join(root, 'media', d)).forEach(function (f) {
          if (/\.jpe?g$/i.test(f)) files.push('media/' + d + '/' + f);
        });
      });
      files.forEach(function (f) {
        helpers.assert(jpegSize(f) !== null, f + ' is not a JPEG despite its name');
      });
    }
  });

  cases.push({
    name: 'the size written in the manifest matches the file, so frames do not jump',
    fn: function () {
      allEntries().forEach(function (pair) {
        var m = pair[1];
        var still = m.type === 'video' ? m.poster : m.src;
        var real = jpegSize(still);
        helpers.assert(m.w === real.w && m.h === real.h,
          pair[0] + ' says ' + m.w + 'x' + m.h + ' but ' + still + ' is ' + real.w + 'x' + real.h);
        if (m.type === 'video') {
          var clip = mp4Size(m.src);
          helpers.assert(clip && m.clipW === clip.w && m.clipH === clip.h,
            pair[0] + ' clip says ' + m.clipW + 'x' + m.clipH + ' but ' + m.src + ' is ' + (clip ? clip.w + 'x' + clip.h : 'unreadable'));
        }
      });
    }
  });

  cases.push({
    name: 'pictures and clips have a height cap, so a portrait picture never fills a desktop screen',
    fn: function () {
      helpers.assert(/--media-max:\s*min\(/.test(html), 'the default media height cap is missing');
      helpers.assert(/\.media-frame\s*\{[^}]*max-height:\s*var\(--media-max\)/.test(html), 'the frame does not use the cap');
      helpers.assert(/\.media-frame \.media-el\s*\{[^}]*object-fit:\s*contain/.test(html),
        'media must be contained, not cropped - a cropped exercise picture can hide the foot or hand position');
    }
  });

  cases.push({
    name: 'each exercise sits in its own numbered card, title before the picture',
    fn: function () {
      var move = html.match(/function renderMove\(\)[\s\S]*?\n  \}\n/)[0];
      var card = move.indexOf('exercise-card');
      var head = move.indexOf('exercise-head');
      var media = move.indexOf("mediaHtml ? '<div class=\"exercise-visual\">'");
      helpers.assert(card !== -1 && head !== -1 && media !== -1, 'the exercise card structure is missing');
      helpers.assert(head < media, 'the exercise name must come before its picture');
      helpers.assert(/exerciseNumber/.test(move), 'the card must say which exercise of how many it is');
      var opens = (move.match(/<div/g) || []).length;
      var closes = (move.match(/<\/div>/g) || []).length;
      helpers.assert(opens === closes, 'renderMove opens ' + opens + ' divs and closes ' + closes);
    }
  });

  cases.push({
    name: 'a clip starts as its still picture, with a button to play it',
    fn: function () {
      helpers.assert(/data-action="toggle-clip"/.test(html), 'no clip button');
      helpers.assert(/action === 'toggle-clip'/.test(html), 'the clip button has no handler');
      helpers.assert(/<video class="media-el" hidden/.test(html), 'the clip must start hidden behind its still');
      helpers.assert(/controlsList="nodownload/.test(html), 'the clip lost its no-download setting');
    }
  });

  cases.push({
    name: 'the service worker leaves clips to the network',
    fn: function () {
      helpers.assert(/headers\.has\('range'\)/.test(sw) && /\\\.mp4/.test(sw),
        'Safari will not play a clip served from a cached whole-file copy');
    }
  });

  cases.push({
    name: "the doctor's website opens in the patient's language",
    fn: function () {
      helpers.assertEqual(core.doctorSiteUrl('', 'th'), 'https://rueortho.vercel.app/', 'Thai home page');
      helpers.assertEqual(core.doctorSiteUrl('', 'en'), 'https://rueortho.vercel.app/en', 'English home page');
      core.DOCTOR_SITE.pages.forEach(function (p) {
        helpers.assert(/^\/[a-z-]+\/[a-z-]+$/.test(p.path), p.id + ' has an odd path: ' + p.path);
        helpers.assertEqual(core.doctorSiteUrl(p.path, 'en'), 'https://rueortho.vercel.app/en' + p.path, p.id + ' English');
        helpers.assert(p.title.th && p.title.en, p.id + ' needs a Thai and an English title');
      });
      helpers.assert(/html \+= doctorSiteCard\(\);/.test(html), 'the Learn tab does not show the website card');
    }
  });

  cases.push({
    name: 'English tab labels fit a 40px tab on a 320px phone',
    fn: function () {
      // Eight tabs share the bar; "Medicine" ran into its neighbours even at 390px.
      Object.keys(core.CONTENT).filter(function (k) { return /^nav[A-Z]/.test(k); }).forEach(function (k) {
        var label = core.CONTENT[k].en;
        helpers.assert(label.length <= 6, k + ' "' + label + '" is too long for the tab bar');
      });
    }
  });

  return helpers.runSuite('t18_media_display', cases);
}

module.exports = run;

if (require.main === module) {
  helpers.report(run());
}
