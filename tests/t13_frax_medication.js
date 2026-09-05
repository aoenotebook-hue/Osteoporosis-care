var path = require('path');
var core = require(path.join(__dirname, '..', 'app-core.js'));
var helpers = require('./helpers');

var WOMAN_74 = { age: 74, sex: 'female' };

function run() {
  var cases = [];

  cases.push({
    name: 'the app never claims to compute FRAX itself',
    fn: function () {
      var exported = Object.keys(core).join(' ');
      helpers.assert(!/computeFrax|calculateFrax|fraxScore/i.test(exported),
        'FRAX coefficients are licensed, so nothing here may reproduce them: ' + exported);
      helpers.assert(/^https:\/\/frax\.shef\.ac\.uk/.test(core.FRAX_URL), 'the official calculator should be linked');
    }
  });

  cases.push({
    name: 'the worksheet gathers what the official calculator asks for',
    fn: function () {
      var sheet = core.buildFraxWorksheet(
        { age: 72, sex: 'female', priorFragilityFracture: true, longTermSteroid: true },
        { weightKg: 52, heightCm: 155, currentSmoking: true, rheumatoidArthritis: true },
        [{ date: '2026-01-01', spineT: -2.1, hipT: -2.4 }]
      );
      helpers.assertEqual(sheet.age, 72);
      helpers.assertEqual(sheet.sex, 'female');
      helpers.assertEqual(sheet.bmi, 21.6);
      helpers.assertEqual(sheet.femoralNeckTScore, -2.4, 'FRAX takes the femoral neck score, not the lowest site');

      var byId = {};
      sheet.factors.forEach(function (f) { byId[f.id] = f; });
      helpers.assertEqual(byId.previousFracture.value, true, 'carried from the assessment');
      helpers.assertEqual(byId.previousFracture.fromAssessment, true, 'and marked as already answered');
      helpers.assertEqual(byId.glucocorticoids.value, true, 'carried from the assessment');
      helpers.assertEqual(byId.currentSmoking.value, true);
      helpers.assertEqual(byId.rheumatoidArthritis.value, true);
      helpers.assertEqual(byId.alcohol3Units.value, false);
      helpers.assertEqual(byId.parentHipFracture.fromAssessment, false, 'this one is asked on the card');
    }
  });

  cases.push({
    name: 'every FRAX input the calculator lists has a label the patient can read',
    fn: function () {
      core.FRAX_FACTORS.forEach(function (factor) {
        var entry = core.CONTENT[factor.labelKey];
        helpers.assert(!!entry, factor.id + ' has no label in CONTENT');
        helpers.assert(entry.th !== entry.en, factor.labelKey + ' looks untranslated');
      });
    }
  });

  cases.push({
    name: 'a worksheet is only complete once weight and height are known',
    fn: function () {
      helpers.assertEqual(core.fraxWorksheetComplete(core.buildFraxWorksheet(WOMAN_74, {})), false);
      helpers.assertEqual(core.fraxWorksheetComplete(core.buildFraxWorksheet(WOMAN_74, { weightKg: 55, heightCm: 158 })), true,
        'no bone scan is needed to fill the worksheet in');
      helpers.assertEqual(core.fraxWorksheetComplete(core.buildFraxWorksheet({ sex: 'female' }, { weightKg: 55, heightCm: 158 })), false);
    }
  });

  cases.push({
    name: 'a clinician-entered result is carried through, and absent when never recorded',
    fn: function () {
      var withResult = core.buildFraxWorksheet(WOMAN_74,
        { weightKg: 55, heightCm: 158, majorFractureRisk: 18.5, hipFractureRisk: 7.2, recordedOn: '2026-06-01' });
      helpers.assertEqual(withResult.recordedMajorRisk, 18.5);
      helpers.assertEqual(withResult.recordedHipRisk, 7.2);
      helpers.assertEqual(withResult.recordedOn, '2026-06-01');

      var without = core.buildFraxWorksheet(WOMAN_74, {});
      helpers.assertEqual(without.recordedMajorRisk, null);
      helpers.assertEqual(without.recordedHipRisk, null);
    }
  });

  cases.push({
    name: 'the official result always wins over the estimate',
    fn: function () {
      var sheet = core.buildFraxWorksheet(WOMAN_74,
        { weightKg: 55, heightCm: 158, majorFractureRisk: 18.5, hipFractureRisk: 7.2, recordedOn: '2026-06-01' });
      var shown = core.fractureRiskToShow(sheet);
      helpers.assertEqual(shown.isOfficial, true);
      helpers.assertEqual(shown.major, 18.5, 'the doctor’s number is shown untouched');
      helpers.assertEqual(shown.hip, 7.2);
      helpers.assertEqual(shown.isEstimate, undefined, 'an official result is never labelled an estimate');
    }
  });

  cases.push({
    name: 'with no official result the estimate stands in, labelled as the app’s own',
    fn: function () {
      var sheet = core.buildFraxWorksheet(WOMAN_74, { weightKg: 55, heightCm: 158 });
      var shown = core.fractureRiskToShow(sheet);
      helpers.assertEqual(shown.isOfficial, false);
      helpers.assertEqual(shown.isEstimate, true);
      helpers.assert(shown.major > 0 && shown.hip > 0, 'a number should be offered');
      helpers.assert(/FRAX meta-analyses/.test(shown.source), 'the estimate must name where its numbers came from');
    }
  });

  cases.push({
    name: 'an incomplete worksheet produces no number at all rather than a guess',
    fn: function () {
      helpers.assertEqual(core.estimateFractureRisk(core.buildFraxWorksheet(WOMAN_74, {})), null);
      helpers.assertEqual(core.fractureRiskToShow(core.buildFraxWorksheet(WOMAN_74, {})), null);
      helpers.assertEqual(core.fractureRiskToShow(null), null);
    }
  });

  cases.push({
    name: 'the estimate starts from the age and sex baseline and shows its working',
    fn: function () {
      var plain = core.estimateFractureRisk(core.buildFraxWorksheet(WOMAN_74, { weightKg: 60, heightCm: 158 }));
      helpers.assertEqual(plain.steps.length, 0, 'no risk factors means nothing multiplies the baseline');
      helpers.assertEqual(plain.major, 10, 'a 74-year-old woman starts at the 70-74 baseline');
      helpers.assertEqual(plain.hip, 2.6);

      var men = core.estimateFractureRisk(core.buildFraxWorksheet({ age: 74, sex: 'male' }, { weightKg: 65, heightCm: 168 }));
      helpers.assert(men.major < plain.major, 'men of the same age start lower');
    }
  });

  cases.push({
    name: 'each risk factor raises the estimate and appears in the working',
    fn: function () {
      var base = core.estimateFractureRisk(core.buildFraxWorksheet(WOMAN_74, { weightKg: 60, heightCm: 158 }));
      var smoker = core.estimateFractureRisk(core.buildFraxWorksheet(WOMAN_74,
        { weightKg: 60, heightCm: 158, currentSmoking: true }));
      helpers.assert(smoker.major > base.major, 'a smoker should read higher');
      helpers.assertEqual(smoker.steps.length, 1);
      helpers.assertEqual(smoker.steps[0].labelKey, 'fraxSmoking');

      var several = core.estimateFractureRisk(core.buildFraxWorksheet(
        { age: 74, sex: 'female', priorFragilityFracture: true, longTermSteroid: true },
        { weightKg: 60, heightCm: 158, currentSmoking: true }));
      helpers.assert(several.major > smoker.major, 'more risks should read higher still');
      helpers.assertEqual(several.steps.length, 3);
    }
  });

  cases.push({
    name: 'a low body weight and a low hip T-score both count, and are shown',
    fn: function () {
      var normalWeight = core.estimateFractureRisk(core.buildFraxWorksheet(WOMAN_74, { weightKg: 60, heightCm: 158 }));
      var thin = core.estimateFractureRisk(core.buildFraxWorksheet(WOMAN_74, { weightKg: 44, heightCm: 158 }));
      helpers.assert(thin.major > normalWeight.major, 'a BMI under 20 raises the estimate');
      helpers.assertEqual(thin.steps[0].labelKey, 'fraxLowBmi');

      var scanned = core.estimateFractureRisk(core.buildFraxWorksheet(WOMAN_74,
        { weightKg: 60, heightCm: 158 }, [{ date: '2026-01-01', spineT: -2.1, hipT: -2.4 }]));
      helpers.assertEqual(scanned.usedTScore, true);
      helpers.assert(scanned.hip > normalWeight.hip, 'a thin hip raises the hip figure most');
      helpers.assertEqual(scanned.steps[scanned.steps.length - 1].labelKey, 'fraxBmdStep');
    }
  });

  cases.push({
    name: 'the T-score is judged against what is normal for that age, not against a young adult',
    fn: function () {
      var noScan = core.estimateFractureRisk(core.buildFraxWorksheet(WOMAN_74, { weightKg: 60, heightCm: 158 }));

      // -1.6 is the average for a 74-year-old woman, so it should change nothing.
      var typical = core.estimateFractureRisk(core.buildFraxWorksheet(WOMAN_74,
        { weightKg: 60, heightCm: 158 }, [{ date: '2026-01-01', hipT: -1.6 }]));
      helpers.assertEqual(typical.steps.length, 0, 'an age-typical scan is not a risk factor');
      helpers.assertEqual(typical.major, noScan.major);

      // A T-score of -0.4 would once have counted as "normal, adds nothing".
      // For a 74-year-old it is better than her peers, so it should lower the figure.
      var goodScan = core.estimateFractureRisk(core.buildFraxWorksheet(WOMAN_74,
        { weightKg: 60, heightCm: 158 }, [{ date: '2026-01-01', hipT: -0.4 }]));
      helpers.assert(goodScan.major < noScan.major, 'strong bone for her age should lower the estimate');
      helpers.assert(goodScan.steps[0].majorRr < 1, 'and show as a multiplier below 1');
    }
  });

  cases.push({
    name: 'a relative risk is measured against the population average, not a risk-free person',
    fn: function () {
      // A previous fracture carries a published RR of 1.86, but roughly a fifth
      // of this age group has had one and the baseline already includes them,
      // so applying 1.86 whole would count that risk twice.
      var withFracture = core.estimateFractureRisk(core.buildFraxWorksheet(
        { age: 74, sex: 'female', priorFragilityFracture: true }, { weightKg: 60, heightCm: 158 }));
      var step = withFracture.steps[0];
      helpers.assertEqual(step.labelKey, 'fraxPreviousFracture');
      helpers.assert(step.majorRr > 1, 'it must still raise the estimate');
      helpers.assert(step.majorRr < 1.86, 'but by less than the raw published figure: got ' + step.majorRr);
    }
  });

  cases.push({
    name: 'stacked risks are pulled back, because they overlap rather than compound',
    fn: function () {
      var one = core.estimateFractureRisk(core.buildFraxWorksheet(
        { age: 74, sex: 'female', priorFragilityFracture: true }, { weightKg: 60, heightCm: 158 }));
      var many = core.estimateFractureRisk(core.buildFraxWorksheet(
        { age: 74, sex: 'female', priorFragilityFracture: true, longTermSteroid: true },
        { weightKg: 60, heightCm: 158, currentSmoking: true, parentHipFracture: true }));

      helpers.assertEqual(one.overlapAdjusted, false, 'a single factor needs no overlap adjustment');
      helpers.assertEqual(many.overlapAdjusted, true, 'several do, and the card must be able to say so');
      helpers.assert(many.major > one.major, 'more risks still means more risk');

      var naive = many.steps.reduce(function (acc, s) { return acc * s.majorRr; }, many.baseline.major);
      helpers.assert(many.major < naive,
        'the figure must sit below the naive product of the multipliers: got ' + many.major + ' vs ' + naive.toFixed(1));
    }
  });

  cases.push({
    name: 'the estimate lands near published FRAX figures for known profiles',
    fn: function () {
      // Sense-check against the ranges the official Thai tool gives for these
      // profiles. Wide bands: this is a guard against the estimate drifting
      // off by multiples, not a claim to reproduce FRAX.
      function estimate(profile, answers, bmd) {
        return core.estimateFractureRisk(core.buildFraxWorksheet(profile, answers, bmd));
      }
      function inRange(label, value, lo, hi) {
        helpers.assert(value >= lo && value <= hi, label + ' should sit near ' + lo + '-' + hi + '%, got ' + value + '%');
      }

      var plain65 = estimate({ age: 65, sex: 'female' }, { weightKg: 58, heightCm: 155 });
      inRange('65-year-old woman, no risk factors, major', plain65.major, 4, 9);
      inRange('65-year-old woman, no risk factors, hip', plain65.hip, 0.8, 3);

      var heavy74 = estimate({ age: 74, sex: 'female', priorFragilityFracture: true },
        { weightKg: 48, heightCm: 155, parentHipFracture: true }, [{ date: '2026-01-01', hipT: -2.6 }]);
      inRange('74-year-old woman, fracture + family history + thin hip, major', heavy74.major, 18, 30);
      inRange('74-year-old woman, fracture + family history + thin hip, hip', heavy74.hip, 7, 14);

      var severe80 = estimate({ age: 80, sex: 'female', priorFragilityFracture: true },
        { weightKg: 52, heightCm: 152 }, [{ date: '2026-01-01', hipT: -3.0 }]);
      inRange('80-year-old woman, fracture + severe osteoporosis, major', severe80.major, 20, 32);
      inRange('80-year-old woman, fracture + severe osteoporosis, hip', severe80.hip, 9, 18);
    }
  });

  cases.push({
    name: 'the estimate is offered as a range, never as a single exact figure',
    fn: function () {
      var result = core.estimateFractureRisk(core.buildFraxWorksheet(WOMAN_74, { weightKg: 60, heightCm: 158 }));
      helpers.assert(result.majorRange[0] < result.major, 'the range should open below the point estimate');
      helpers.assert(result.majorRange[1] > result.major, 'and close above it');
      helpers.assert(result.hipRange[0] < result.hipRange[1], 'the hip range must be ordered');
    }
  });

  cases.push({
    name: 'stacking every risk factor cannot push the estimate past its cap',
    fn: function () {
      var everything = {
        weightKg: 38, heightCm: 158,
        parentHipFracture: true, currentSmoking: true, rheumatoidArthritis: true,
        secondaryOsteoporosis: true, alcohol3Units: true
      };
      var result = core.estimateFractureRisk(core.buildFraxWorksheet(
        { age: 88, sex: 'female', priorFragilityFracture: true, longTermSteroid: true },
        everything, [{ date: '2026-01-01', hipT: -4.5 }]));
      helpers.assert(result.major <= 90, 'a probability cannot exceed the cap: got ' + result.major);
      helpers.assert(result.hip <= 70, 'nor can the hip figure: got ' + result.hip);
      helpers.assert(result.majorRange[1] <= 90, 'the top of the range is capped too');
      helpers.assert(result.hipRange[1] <= 70);
      helpers.assert(result.hip <= result.major, 'a broken hip is a subset of any major fracture');
      helpers.assertEqual(result.overlapAdjusted, true, 'a profile this stacked must be pulled back');
    }
  });

  cases.push({
    name: 'the estimate is never presented as a FRAX result',
    fn: function () {
      helpers.assert(/not an official FRAX result/i.test(core.CONTENT.fraxEstimateLabel.en),
        'the English label must say plainly that this is not FRAX');
      helpers.assert(core.CONTENT.fraxEstimateLabel.th.indexOf('ไม่ใช่ผล FRAX') !== -1,
        'the Thai label must say the same');
      helpers.assert(!!core.CONTENT.fraxSourceLabel, 'the card must be able to name its source');
      helpers.assert(!!core.CONTENT.fraxBaselineCaveat, 'the baseline needs its local-validation caveat on screen');
    }
  });

  cases.push({
    name: 'BMI is computed from weight and height, or left out when either is missing',
    fn: function () {
      helpers.assertEqual(core.computeBmi(60, 160), 23.4);
      helpers.assertEqual(core.computeBmi(null, 160), null);
      helpers.assertEqual(core.computeBmi(60, 0), null);
    }
  });

  cases.push({
    name: 'the lowest T-score of the sites measured drives the bone status',
    fn: function () {
      helpers.assertEqual(core.lowestTScore({ spineT: -2.1, hipT: -2.8 }), -2.8);
      helpers.assertEqual(core.lowestTScore({ spineT: -2.1 }), -2.1);
      helpers.assertEqual(core.lowestTScore({}), null);
      helpers.assertEqual(core.lowestTScore(null), null);

      var latest = core.latestBmdEntry([
        { date: '2022-01-01', spineT: -1.2 },
        { date: '2026-01-01', spineT: -2.6, hipT: -2.9 }
      ]);
      helpers.assertEqual(latest.date, '2026-01-01', 'the most recent scan wins');
      helpers.assertEqual(core.resolveBoneStatus({ tScore: core.lowestTScore(latest) }), 'osteoporosis');
    }
  });

  cases.push({
    name: 'months on a drug are counted whole, never negative',
    fn: function () {
      helpers.assertEqual(core.monthsBetween('2026-01-15', '2026-06-15'), 5);
      helpers.assertEqual(core.monthsBetween('2026-01-15', '2026-06-14'), 4, 'a part month does not round up');
      helpers.assertEqual(core.monthsBetween('2025-06-01', '2026-06-01'), 12);
      helpers.assertEqual(core.monthsBetween('2026-06-01', '2026-06-01'), 0);
      helpers.assertEqual(core.monthsBetween(null, '2026-06-01'), null);
    }
  });

  cases.push({
    name: 'medication progress reports duration and doses',
    fn: function () {
      var progress = core.medicationProgress({
        classId: 'denosumab', startDate: '2025-06-10',
        adherenceLog: [{ date: '2025-06-10' }, { date: '2025-12-10' }]
      }, '2026-06-10');
      helpers.assertEqual(progress.months, 12);
      helpers.assertEqual(progress.doses, 2);
      helpers.assertEqual(progress.isInjection, true);
      helpers.assertEqual(progress.courseTotalDoses, null, 'denosumab has no fixed course length');
    }
  });

  cases.push({
    name: 'romosozumab is tracked as a numbered course of 12 injections',
    fn: function () {
      helpers.assertEqual(core.getMedClass('romosozumab').courseTotalDoses, 12);

      var third = core.medicationProgress({
        classId: 'romosozumab', startDate: '2026-01-05',
        adherenceLog: [{ date: '2026-01-05' }, { date: '2026-02-05' }]
      }, '2026-03-05');
      helpers.assertEqual(third.nextDoseNumber, 3, 'after two injections the next is number 3');
      helpers.assertEqual(third.courseComplete, false);

      var done = core.medicationProgress({
        classId: 'romosozumab', startDate: '2026-01-05',
        adherenceLog: new Array(12).fill({ date: '2026-01-05' })
      }, '2027-01-05');
      helpers.assertEqual(done.courseComplete, true);
      helpers.assertEqual(done.nextDoseNumber, 12, 'the counter does not run past the course');
    }
  });

  cases.push({
    name: 'no medication or no start date means no progress rather than a crash',
    fn: function () {
      helpers.assertEqual(core.medicationProgress({}, '2026-06-01'), null);
      helpers.assertEqual(core.medicationProgress({ classId: 'denosumab' }, '2026-06-01'), null);
      helpers.assertEqual(core.medicationProgress(null, '2026-06-01'), null);
    }
  });

  cases.push({
    name: 'changing drug archives the old one with its duration and dose count',
    fn: function () {
      var archived = core.archiveMedication({
        classId: 'bisphosphonate_weekly', startDate: '2024-03-01',
        adherenceLog: [{ date: '2024-03-01' }, { date: '2024-03-08' }]
      }, '2026-03-01');
      helpers.assertEqual(archived.classId, 'bisphosphonate_weekly');
      helpers.assertEqual(archived.months, 24);
      helpers.assertEqual(archived.doses, 2);
      helpers.assertEqual(archived.endDate, '2026-03-01');
      helpers.assertEqual(core.archiveMedication({}, '2026-03-01'), null);
    }
  });

  return helpers.runSuite('t13_frax_medication', cases);
}

module.exports = run;

if (require.main === module) {
  helpers.report(run());
}
