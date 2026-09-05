var path = require('path');
var core = require(path.join(__dirname, '..', 'app-core.js'));
var helpers = require('./helpers');

function run() {
  var cases = [];

  cases.push({
    name: 'every calcium food has TH/EN name and serving plus a plausible mg value',
    fn: function () {
      core.CALCIUM_FOODS.forEach(function (food) {
        helpers.assert(food.name.th && food.name.en, food.id + ' missing TH/EN name');
        helpers.assert(food.serving.th && food.serving.en, food.id + ' missing TH/EN serving');
        helpers.assert(food.mgPerServing > 0 && food.mgPerServing <= 1500, food.id + ' has an implausible mg value');
      });
    }
  });

  cases.push({
    name: 'calcium intake is a daily average of weekly servings plus the background diet',
    fn: function () {
      var intake = core.estimateDailyCalciumMg({ milk: 7 });
      helpers.assertEqual(intake, core.BASELINE_DIET_CALCIUM_MG + 290);
    }
  });

  cases.push({
    name: 'eating nothing from the list still credits the background Thai diet',
    fn: function () {
      helpers.assertEqual(core.estimateDailyCalciumMg({}), core.BASELINE_DIET_CALCIUM_MG);
      helpers.assertEqual(core.estimateDailyCalciumMg(undefined), core.BASELINE_DIET_CALCIUM_MG);
    }
  });

  cases.push({
    name: 'unknown food ids are ignored rather than throwing',
    fn: function () {
      helpers.assertEqual(core.estimateDailyCalciumMg({ not_a_food: 7 }), core.BASELINE_DIET_CALCIUM_MG);
    }
  });

  cases.push({
    name: 'calcium target is 1200mg for women 50+ and men 70+, otherwise 1000mg',
    fn: function () {
      helpers.assertEqual(core.calciumTargetMg(55, 'female'), 1200);
      helpers.assertEqual(core.calciumTargetMg(45, 'female'), 1000);
      helpers.assertEqual(core.calciumTargetMg(72, 'male'), 1200);
      helpers.assertEqual(core.calciumTargetMg(60, 'male'), 1000);
    }
  });

  cases.push({
    name: 'the calcium supplement suggestion never exceeds the shortfall',
    fn: function () {
      var rec = core.recommendCalciumSupplement(400, 1200);
      helpers.assertEqual(rec.gapMg, 800);
      helpers.assert(rec.suggestedSupplementMg <= rec.gapMg, 'suggested supplement should not exceed the gap');
      helpers.assertEqual(rec.suggestedSupplementMg, 600);
      helpers.assertEqual(rec.sufficient, false);
    }
  });

  cases.push({
    name: 'a diet that already meets the target suggests no supplement',
    fn: function () {
      var rec = core.recommendCalciumSupplement(1300, 1200);
      helpers.assertEqual(rec.gapMg, 0);
      helpers.assertEqual(rec.suggestedSupplementMg, 0);
      helpers.assertEqual(rec.sufficient, true);
    }
  });

  cases.push({
    name: 'a small shortfall still suggests the smallest usable tablet',
    fn: function () {
      var rec = core.recommendCalciumSupplement(1100, 1200);
      helpers.assertEqual(rec.gapMg, 100);
      helpers.assertEqual(rec.suggestedSupplementMg, 500);
    }
  });

  cases.push({
    name: 'vitamin D intake is averaged per day from weekly servings',
    fn: function () {
      helpers.assertEqual(core.estimateDailyVitaminDIu({ oily_fish: 7 }), 350);
      helpers.assertEqual(core.estimateDailyVitaminDIu({}), 0);
    }
  });

  cases.push({
    name: 'low sun exposure raises the suggested vitamin D dose',
    fn: function () {
      var low = core.recommendVitaminD(100, 20);
      var ok = core.recommendVitaminD(100, 120);
      helpers.assertEqual(low.lowSun, true);
      helpers.assertEqual(low.suggestedSupplementIu, 1000);
      helpers.assertEqual(ok.lowSun, false);
      helpers.assertEqual(ok.suggestedSupplementIu, 800);
    }
  });

  cases.push({
    name: 'protein intake counts daily servings on top of the background diet',
    fn: function () {
      helpers.assertEqual(core.estimateDailyProteinG({ meat_fish: 2, egg: 1 }), core.BASELINE_DIET_PROTEIN_G + 46);
      helpers.assertEqual(core.estimateDailyProteinG({}), core.BASELINE_DIET_PROTEIN_G);
    }
  });

  cases.push({
    name: 'protein target is 1.2 g/kg from age 65, otherwise 1.0 g/kg',
    fn: function () {
      helpers.assertEqual(core.proteinTargetG(50, 70), 60);
      helpers.assertEqual(core.proteinTargetG(50, 60), 50);
      helpers.assertEqual(core.proteinTargetG(null, 70), null, 'no weight means no target');
      helpers.assertEqual(core.proteinTargetG(0, 70), null);
    }
  });

  cases.push({
    name: 'the protein gap is expressed in grams and in whole eggs',
    fn: function () {
      var rec = core.recommendProtein(40, 60);
      helpers.assertEqual(rec.gapG, 20);
      helpers.assertEqual(rec.exampleEggs, 4);
      helpers.assertEqual(rec.sufficient, false);
      helpers.assertEqual(core.recommendProtein(70, 60).sufficient, true);
      helpers.assertEqual(core.recommendProtein(70, null), null);
    }
  });

  cases.push({
    name: 'the yearly review is due when never done or a year has passed',
    fn: function () {
      helpers.assertEqual(core.isNutritionReviewDue(null, '2026-06-01'), true);
      helpers.assertEqual(core.isNutritionReviewDue('2026-01-01', '2026-06-01'), false);
      helpers.assertEqual(core.isNutritionReviewDue('2025-06-01', '2026-06-01'), true);
    }
  });

  cases.push({
    name: 'a full review produces calcium, vitamin D and protein recommendations together',
    fn: function () {
      var result = core.buildNutritionResult({
        calcium: { milk: 7 },
        vitaminD: { egg_yolk: 7 },
        protein: { meat_fish: 2 },
        weightKg: 55,
        sunMinutesPerWeek: 30
      }, { age: 70, sex: 'female' });
      helpers.assertEqual(result.calcium.targetMg, 1200);
      helpers.assertEqual(result.calcium.intakeMg, 490);
      helpers.assertEqual(result.vitaminD.suggestedSupplementIu, 1000);
      helpers.assertEqual(result.protein.targetG, 66);
    }
  });

  return helpers.runSuite('t5_nutrition_estimators', cases);
}

module.exports = run;

if (require.main === module) {
  helpers.report(run());
}
