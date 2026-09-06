var fs = require('fs');
var path = require('path');
var helpers = require('./helpers');

var html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function run() {
  var cases = [];

  cases.push({
    name: 'text cannot be selected for copying',
    fn: function () {
      helpers.assert(/body\s*\{[^}]*user-select:\s*none/.test(html.replace(/\n/g, ' ')),
        'body must set user-select: none');
      helpers.assert(html.indexOf('-webkit-user-select: none') !== -1,
        'the WebKit prefix is required for Safari, which is most of these patients');
    }
  });

  cases.push({
    name: 'patients can still select and correct what they type',
    fn: function () {
      // Without this exemption a patient could not fix a mistyped HN, which
      // would be a far worse problem than the copying this is guarding against.
      var rule = html.replace(/\n/g, ' ').match(/input,\s*textarea,\s*select\s*\{([^}]*)\}/);
      helpers.assert(!!rule, 'form fields need their own user-select rule');
      helpers.assert(/user-select:\s*text/.test(rule[1]), 'form fields must stay selectable');
    }
  });

  cases.push({
    name: 'the iOS long-press "Save Image" menu is suppressed',
    fn: function () {
      helpers.assert(html.indexOf('-webkit-touch-callout: none') !== -1,
        'without this, a long press on iOS offers to save the picture');
    }
  });

  cases.push({
    name: 'pictures cannot be dragged out of the page',
    fn: function () {
      helpers.assert(/img,\s*video,\s*svg\s*\{[^}]*user-drag:\s*none/.test(html.replace(/\n/g, ' ')),
        'images and video must not be draggable');
      helpers.assert(html.indexOf('draggable="false"') !== -1,
        'the exercise image needs the draggable attribute too');
    }
  });

  cases.push({
    name: 'the video player offers no download or picture-in-picture route',
    fn: function () {
      helpers.assert(/controlsList="nodownload/.test(html),
        'the browser video menu would otherwise offer "Download"');
      helpers.assert(html.indexOf('disablePictureInPicture') !== -1,
        'picture-in-picture pops the video out of the app');
    }
  });

  cases.push({
    name: 'right-click, drag, copy and cut are all intercepted',
    fn: function () {
      var handler = html.match(/\['contextmenu',[^\]]*\]/);
      helpers.assert(!!handler, 'could not find the copy-deterrent handler list');
      ['contextmenu', 'dragstart', 'copy', 'cut'].forEach(function (type) {
        helpers.assert(handler[0].indexOf("'" + type + "'") !== -1, type + ' is not intercepted');
      });
    }
  });

  cases.push({
    name: 'the interception leaves form fields alone',
    fn: function () {
      helpers.assert(/function inFormField/.test(html),
        'the handler must exempt form fields, or cut and paste breaks while typing');
      helpers.assert(/if \(inFormField\(e\.target\)\) return;/.test(html),
        'the exemption must actually be applied in the handler');
    }
  });

  cases.push({
    name: 'printing to paper or PDF does not carry the content out',
    fn: function () {
      helpers.assert(/@media print\s*\{/.test(html), 'a print rule must exist');
      helpers.assert(/body > \*\s*\{\s*display: none/.test(html.replace(/\n/g, ' ')),
        'the print rule must hide the page content');
    }
  });

  cases.push({
    name: 'the honest limits are written down, not just the code',
    fn: function () {
      // This protection is deterrence, not security. If the README ever stops
      // saying so, someone will believe the content is actually protected.
      var readme = fs.readFileSync(path.join(__dirname, '..', 'README.md'), 'utf8');
      helpers.assert(/screenshot/i.test(readme), 'the README must address screenshots');
      helpers.assert(/cannot be blocked|no web app can|not possible/i.test(readme),
        'the README must state plainly that screenshots cannot be blocked');
    }
  });

  return helpers.runSuite('t14_content_protection', cases);
}

module.exports = run;

if (require.main === module) {
  helpers.report(run());
}
