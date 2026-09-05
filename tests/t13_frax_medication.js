var path = require('path');
var core = require(path.join(__dirname, '..', 'app-core.js'));
var helpers = require('./helpers');

function run() {
  var cases = [];

  cases.push({
    name: 'the app never invents a FRAX score, since the formula is licensed',
    fn: function () {
      var exported = Object.keys(core).join(' ');
      helpers.assert(!/computeFrax|calculateFrax|fraxScore/i.test(exported),
        'nothing should compute a FRAX score locally: ' + exported);
      helpers.assert(/^https:\/\/frax\.shef\.ac\.uk\//.test(core.FRAX_URL), 'the official calculator should be linked');
    }
  });

  cases.push({
    name: 'the worksheet gathers what the official calculator asks for',
    fn: function () {
      var sheet = core.buildFraxWorksheet(
        { age: 72, sex: 'female', priorFragilityFracture: true, longTermSteroid: true },
        { weightKg: 52, heightCm: 155, currentSmoking: true },
        [{ date: '2026-01-01', spineT: -2.8, hipT: -2.4 }]
      );
      helpers.assertEqual(sheet.age, 72);
      helpers.assertEqual(sheet.sex, 'female');
      helpers.assertEqual(sheet.bmi, 21.6);
      helpers.assertEqual(sheet.femoralNeckTScore, -2.4, 'FRAX uses the hip reading');

      var byId = {};
      sheet.factors.forEach(function (f) { byId[f.id] = f.value; });
      helpers.assertEqual(byId.previousFracture, true, 'taken from the assessment, not asked twice');
      helpers.assertEqual(byId.glucocorticoids, true, 'taken from the assessment, not asked twice');
      helpers.assertEqual(byId.currentSmoking, true);
      helpers.assertEqual(byId.parentHipFracture, false);
    }
  });

  cases.push({
    name: 'a worksheet is only complete once weight and height are known',
    fn: function () {
      var incomplete = core.buildFraxWorksheet({ age: 70, sex: 'female' }, {}, []);
      helpers.assertEqual(core.fraxWorksheetComplete(incomplete), false);
      var complete = core.buildFraxWorksheet({ age: 70, sex: 'female' }, { weightKg: 55, heightCm: 158 }, []);
      helpers.assertEqual(core.fraxWorksheetComplete(complete), true);
    }
  });

  cases.push({
    name: 'a clinician-entered result is carried through, and absent when never recorded',
    fn: function () {
      var withResult = core.buildFraxWorksheet({ age: 70, sex: 'female' },
        { weightKg: 55, heightCm: 158, majorFractureRisk: 18.5, hipFractureRisk: 7.2, recordedOn: '2026-06-01' }, []);
      helpers.assertEqual(withResult.recordedMajorRisk, 18.5);
      helpers.assertEqual(withResult.recordedHipRisk, 7.2);
      helpers.assertEqual(withResult.recordedOn, '2026-06-01');

      var without = core.buildFraxWorksheet({ age: 70, sex: 'female' }, {}, []);
      helpers.assertEqual(without.recordedMajorRisk, null);
      helpers.assertEqual(without.recordedHipRisk, null);
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
