var path = require('path');
var core = require(path.join(__dirname, '..', 'app-core.js'));
var helpers = require('./helpers');

function run() {
  var cases = [];

  cases.push({
    name: 'safety checklist has exactly 20 items grouped across five rooms',
    fn: function () {
      helpers.assertEqual(core.SAFETY_ITEMS.length, 20);
      var rooms = {};
      core.SAFETY_ITEMS.forEach(function (item) { rooms[item.room] = true; });
      ['bedroom', 'bathroom', 'stairs', 'kitchen', 'outdoors'].forEach(function (room) {
        helpers.assert(!!rooms[room], 'missing safety items for room "' + room + '"');
      });
    }
  });

  cases.push({
    name: 'score counts only checked items and max equals total item count',
    fn: function () {
      var result = core.computeSafetyScore(['bedroom_nightlight', 'bathroom_grab_bar']);
      helpers.assertEqual(result.score, 2);
      helpers.assertEqual(result.max, 20);
    }
  });

  cases.push({
    name: 'no items checked yields a score of zero and three priority fixes',
    fn: function () {
      var result = core.computeSafetyScore([]);
      helpers.assertEqual(result.score, 0);
      helpers.assertEqual(result.priorityFixes.length, 3);
    }
  });

  cases.push({
    name: 'priority fixes are the highest-priority unchecked items, highest first',
    fn: function () {
      var result = core.computeSafetyScore([]);
      for (var i = 1; i < result.priorityFixes.length; i++) {
        helpers.assert(result.priorityFixes[i - 1].priority >= result.priorityFixes[i].priority, 'priority fixes should be sorted descending');
      }
      helpers.assertEqual(result.priorityFixes[0].priority, 5);
    }
  });

  cases.push({
    name: 'checked items never reappear in priority fixes',
    fn: function () {
      var allIds = core.SAFETY_ITEMS.map(function (i) { return i.id; });
      var topPriorityId = core.SAFETY_ITEMS.filter(function (i) { return i.priority === 5; })[0].id;
      var result = core.computeSafetyScore([topPriorityId]);
      var fixIds = result.priorityFixes.map(function (f) { return f.id; });
      helpers.assert(fixIds.indexOf(topPriorityId) === -1, 'a checked item should not be suggested as a priority fix');
      helpers.assert(allIds.indexOf(topPriorityId) !== -1);
    }
  });

  cases.push({
    name: 'a full checklist scores 20/20 with no priority fixes',
    fn: function () {
      var allIds = core.SAFETY_ITEMS.map(function (i) { return i.id; });
      var result = core.computeSafetyScore(allIds);
      helpers.assertEqual(result.score, 20);
      helpers.assertEqual(result.priorityFixes.length, 0);
    }
  });

  return helpers.runSuite('t7_safety_score', cases);
}

module.exports = run;

if (require.main === module) {
  helpers.report(run());
}
