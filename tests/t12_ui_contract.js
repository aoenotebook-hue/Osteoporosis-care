var fs = require('fs');
var path = require('path');
var core = require(path.join(__dirname, '..', 'app-core.js'));
var helpers = require('./helpers');

var html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

/**
 * Keys the UI builds at runtime rather than writing out literally
 * (tr(prefix + '_name'), tr('balanceLevel' + level), and so on).
 */
var DYNAMIC_CONTENT_KEYS = ['balanceLevel1', 'balanceLevel2', 'balanceLevel3'];

['Unknown', 'Normal', 'Osteopenia', 'Osteoporosis', 'SevereOsteoporosis'].forEach(function (status) {
  DYNAMIC_CONTENT_KEYS.push('boneStatus' + status + '_name', 'boneStatus' + status + '_desc');
});
['Low', 'Moderate', 'High'].forEach(function (risk) {
  DYNAMIC_CONTENT_KEYS.push('fallRisk' + risk + '_name', 'fallRisk' + risk + '_desc', 'fallRisk' + risk + '_action');
});

function matchAll(source, regex, group) {
  var found = [];
  var m;
  while ((m = regex.exec(source)) !== null) {
    if (found.indexOf(m[group]) === -1) found.push(m[group]);
  }
  return found;
}

function run() {
  var cases = [];

  cases.push({
    name: 'every core export the app reaches for actually exists',
    fn: function () {
      var referenced = matchAll(html, /\bC\.([A-Za-z_][A-Za-z0-9_]*)/g, 1);
      helpers.assert(referenced.length > 20, 'expected the UI to use the core module');
      referenced.forEach(function (name) {
        helpers.assert(core[name] !== undefined, 'index.html uses C.' + name + ', which app-core.js does not export');
      });
    }
  });

  cases.push({
    name: 'every property read off a core data object exists on it',
    fn: function () {
      var referenced = matchAll(html, /\bC\.([A-Z][A-Z0-9_]*)\.([A-Za-z_][A-Za-z0-9_]*)/g, 0);
      helpers.assert(referenced.length > 0, 'expected the UI to read core constants');
      referenced.forEach(function (expr) {
        var parts = expr.split('.');
        var owner = core[parts[1]];
        helpers.assert(owner !== undefined, 'index.html uses ' + expr + ' but C.' + parts[1] + ' is not exported');
        helpers.assert(owner[parts[2]] !== undefined,
          'index.html uses ' + expr + ' but "' + parts[2] + '" is missing from ' + parts[1] +
          ' — a rename in app-core.js would break that screen at runtime');
      });
    }
  });

  cases.push({
    name: 'every string the app asks for is defined in CONTENT',
    fn: function () {
      var keys = matchAll(html, /\btr\('([A-Za-z0-9_]+)'\)/g, 1);
      helpers.assert(keys.length > 50, 'expected the UI to use many content keys');
      keys.forEach(function (key) {
        helpers.assert(core.CONTENT[key] !== undefined, 'index.html asks for tr("' + key + '") but CONTENT has no such key');
      });
    }
  });

  cases.push({
    name: 'no CONTENT string is left defined but unused',
    fn: function () {
      // Keys reach the screen several ways - tr('key'), a lookup map such as
      // TAB_LABEL_KEY, or a labelKey field on a core data row - so a key counts
      // as used if it is quoted anywhere in either file outside its definition.
      var coreSrc = fs.readFileSync(path.join(__dirname, '..', 'app-core.js'), 'utf8');

      var orphans = Object.keys(core.CONTENT).filter(function (key) {
        if (DYNAMIC_CONTENT_KEYS.indexOf(key) !== -1) return false;
        var quoted = new RegExp("['\"]" + key + "['\"]");
        if (quoted.test(html)) return false;
        var withoutDefinition = coreSrc.replace(new RegExp('^\\s*' + key + ':', 'm'), '');
        return !quoted.test(withoutDefinition);
      });

      helpers.assertEqual(orphans.length, 0,
        'these CONTENT strings are never shown, so they would waste a clinical review: ' + orphans.join(', '));
    }
  });

  cases.push({
    name: 'every tab in the bar has a render branch and a label',
    fn: function () {
      var tabList = html.match(/var TABS = \[([^\]]+)\]/);
      helpers.assert(!!tabList, 'could not find the TABS list');
      var tabs = tabList[1].split(',').map(function (s) { return s.trim().replace(/'/g, ''); });
      helpers.assertEqual(tabs.length, 8, 'expected eight tabs');
      tabs.forEach(function (tab) {
        helpers.assert(html.indexOf("case '" + tab + "':") !== -1, 'tab "' + tab + '" has no render branch');
        helpers.assert(html.indexOf(tab + ': \'nav') !== -1, 'tab "' + tab + '" has no label mapping');
      });
    }
  });

  cases.push({
    name: 'patient-facing text stays short enough to read on a phone',
    fn: function () {
      // Anything longer than this is a wall of text on a small screen; break it
      // into a LISTS entry rendered as bullets instead.
      var LIMIT = 260;
      var tooLong = [];
      Object.keys(core.CONTENT).forEach(function (key) {
        var entry = core.CONTENT[key];
        if (entry.th.length > LIMIT) tooLong.push('CONTENT.' + key + ' (th ' + entry.th.length + ')');
        if (entry.en.length > LIMIT) tooLong.push('CONTENT.' + key + ' (en ' + entry.en.length + ')');
      });
      Object.keys(core.LISTS).forEach(function (listKey) {
        core.LISTS[listKey].forEach(function (item, i) {
          if (item.th.length > LIMIT) tooLong.push('LISTS.' + listKey + '[' + i + '] (th)');
          if (item.en.length > LIMIT) tooLong.push('LISTS.' + listKey + '[' + i + '] (en)');
        });
      });
      helpers.assertEqual(tooLong.length, 0, 'too long to read comfortably: ' + tooLong.join(', '));
    }
  });

  cases.push({
    name: 'every bullet list is bilingual and actually rendered',
    fn: function () {
      Object.keys(core.LISTS).forEach(function (listKey) {
        helpers.assert(core.LISTS[listKey].length > 0, listKey + ' is empty');
        core.LISTS[listKey].forEach(function (item, i) {
          helpers.assert(item.th && item.en, listKey + '[' + i + '] is missing a language');
          helpers.assert(item.th !== item.en, listKey + '[' + i + '] looks untranslated');
        });
        helpers.assert(html.indexOf("'" + listKey + "'") !== -1, listKey + ' is never rendered');
      });
    }
  });

  cases.push({
    name: 'the emergency screen can always build its call buttons',
    fn: function () {
      helpers.assert(!!core.ALERT_CONTACTS.hospitalPhone, 'the hospital number must exist for the Urgent tab');
      helpers.assert(!!core.ALERT_CONTACTS.emsPhone, 'the emergency number must exist for the Urgent tab');
      helpers.assert(html.indexOf('ALERT_CONTACTS.clinicPhone') === -1,
        'index.html still refers to the old clinicPhone key, which would break the Urgent tab');
    }
  });

  return helpers.runSuite('t12_ui_contract', cases);
}

module.exports = run;

if (require.main === module) {
  helpers.report(run());
}
