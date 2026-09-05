var path = require('path');
var core = require(path.join(__dirname, '..', 'app-core.js'));
var helpers = require('./helpers');

function run() {
  var cases = [];

  cases.push({
    name: 'the checklist has 20 items across five rooms',
    fn: function () {
      helpers.assertEqual(core.SAFETY_ITEMS.length, 20);
      var rooms = {};
      core.SAFETY_ITEMS.forEach(function (item) { rooms[item.room] = true; });
      ['bedroom', 'bathroom', 'stairs', 'kitchen', 'outdoors'].forEach(function (room) {
        helpers.assert(!!rooms[room], 'missing items for room "' + room + '"');
      });
    }
  });

  cases.push({
    name: 'every item has its own icon so the list can be scanned visually',
    fn: function () {
      var seen = {};
      core.SAFETY_ITEMS.forEach(function (item) {
        helpers.assert(typeof item.icon === 'string' && item.icon.length > 0, item.id + ' is missing an icon');
        seen[item.icon] = (seen[item.icon] || 0) + 1;
      });
      Object.keys(seen).forEach(function (icon) {
        helpers.assert(seen[icon] === 1, 'icon ' + icon + ' is reused by more than one item');
      });
    }
  });

  cases.push({
    name: 'score counts checked items and max equals the item count',
    fn: function () {
      var result = core.computeSafetyScore(['bedroom_nightlight', 'bathroom_grab_bar']);
      helpers.assertEqual(result.score, 2);
      helpers.assertEqual(result.max, 20);
    }
  });

  cases.push({
    name: 'nothing checked scores zero and returns three priority fixes',
    fn: function () {
      var result = core.computeSafetyScore([]);
      helpers.assertEqual(result.score, 0);
      helpers.assertEqual(result.priorityFixes.length, 3);
      helpers.assertEqual(result.priorityFixes[0].priority, 5);
    }
  });

  cases.push({
    name: 'priority fixes are sorted by priority, highest first',
    fn: function () {
      var fixes = core.computeSafetyScore([]).priorityFixes;
      for (var i = 1; i < fixes.length; i++) {
        helpers.assert(fixes[i - 1].priority >= fixes[i].priority, 'priority fixes should be sorted descending');
      }
    }
  });

  cases.push({
    name: 'a checked item never reappears as a priority fix',
    fn: function () {
      var topId = core.SAFETY_ITEMS.filter(function (i) { return i.priority === 5; })[0].id;
      var fixIds = core.computeSafetyScore([topId]).priorityFixes.map(function (f) { return f.id; });
      helpers.assert(fixIds.indexOf(topId) === -1, 'a checked item should not be suggested');
    }
  });

  cases.push({
    name: 'a fully checked home scores 20/20 with nothing left to fix',
    fn: function () {
      var result = core.computeSafetyScore(core.SAFETY_ITEMS.map(function (i) { return i.id; }));
      helpers.assertEqual(result.score, 20);
      helpers.assertEqual(result.priorityFixes.length, 0);
    }
  });

  cases.push({
    name: 're-check is due when never done or after 6 months',
    fn: function () {
      helpers.assertEqual(core.isSafetyAuditDue(null, '2026-06-01'), true);
      helpers.assertEqual(core.isSafetyAuditDue('2026-05-01', '2026-06-01'), false);
      helpers.assertEqual(core.isSafetyAuditDue('2025-11-01', '2026-06-01'), true);
    }
  });

  return helpers.runSuite('t7_safety_score', cases);
}

module.exports = run;

if (require.main === module) {
  helpers.report(run());
}
