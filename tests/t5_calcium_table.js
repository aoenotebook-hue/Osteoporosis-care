var path = require('path');
var core = require(path.join(__dirname, '..', 'app-core.js'));
var helpers = require('./helpers');

function run() {
  var cases = [];

  cases.push({
    name: 'every food has a TH/EN name and serving, and a positive mg value',
    fn: function () {
      core.FOOD_TABLE.forEach(function (food) {
        helpers.assert(food.name.th && food.name.en, 'food ' + food.id + ' missing TH/EN name');
        helpers.assert(food.serving.th && food.serving.en, 'food ' + food.id + ' missing TH/EN serving');
        helpers.assert(typeof food.mgPerServing === 'number' && food.mgPerServing > 0, 'food ' + food.id + ' should have a positive mg value');
      });
    }
  });

  cases.push({
    name: 'no single serving exceeds 1500mg (sanity check against data entry errors)',
    fn: function () {
      core.FOOD_TABLE.forEach(function (food) {
        helpers.assert(food.mgPerServing <= 1500, 'food ' + food.id + ' has implausible mg value ' + food.mgPerServing);
      });
    }
  });

  cases.push({
    name: 'calcium totals sum selected foods correctly',
    fn: function () {
      var total = core.computeCalciumTotal(['milk', 'tofu', 'kale_thai']);
      helpers.assertEqual(total, 300 + 130 + 90);
    }
  });

  cases.push({
    name: 'unknown food ids are ignored rather than throwing',
    fn: function () {
      var total = core.computeCalciumTotal(['milk', 'not_a_real_food']);
      helpers.assertEqual(total, 300);
    }
  });

  cases.push({
    name: 'empty selection totals zero',
    fn: function () {
      helpers.assertEqual(core.computeCalciumTotal([]), 0);
      helpers.assertEqual(core.computeCalciumTotal(undefined), 0);
    }
  });

  cases.push({
    name: 'calcium target is 1200mg for women 50+ and men 70+, else 1000mg',
    fn: function () {
      helpers.assertEqual(core.calciumTargetMg(55, 'female'), 1200);
      helpers.assertEqual(core.calciumTargetMg(45, 'female'), 1000);
      helpers.assertEqual(core.calciumTargetMg(72, 'male'), 1200);
      helpers.assertEqual(core.calciumTargetMg(60, 'male'), 1000);
    }
  });

  return helpers.runSuite('t5_calcium_table', cases);
}

module.exports = run;

if (require.main === module) {
  helpers.report(run());
}
