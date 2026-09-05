var path = require('path');
var core = require(path.join(__dirname, '..', 'app-core.js'));
var helpers = require('./helpers');

function run() {
  var cases = [];
  var TODAY = '2026-06-01';

  cases.push({
    name: 'the reminder window opens exactly one week before the dose',
    fn: function () {
      helpers.assertEqual(core.DOSE_REMINDER_LEAD_DAYS, 7);
      helpers.assertEqual(core.doseReminderState('2026-06-09', TODAY).shouldRemind, false, '8 days out is too early');
      helpers.assertEqual(core.doseReminderState('2026-06-08', TODAY).shouldRemind, true, '7 days out should remind');
      helpers.assertEqual(core.doseReminderState('2026-06-08', TODAY).daysUntil, 7);
    }
  });

  cases.push({
    name: 'a dose due today and an overdue dose are both flagged',
    fn: function () {
      var today = core.doseReminderState(TODAY, TODAY);
      helpers.assertEqual(today.dueToday, true);
      helpers.assertEqual(today.overdue, false);
      helpers.assertEqual(today.shouldRemind, true);

      var late = core.doseReminderState('2026-05-25', TODAY);
      helpers.assertEqual(late.overdue, true);
      helpers.assertEqual(late.daysUntil, -7);
      helpers.assertEqual(late.shouldRemind, true);
    }
  });

  cases.push({
    name: 'no medication date means no reminder rather than a crash',
    fn: function () {
      helpers.assertEqual(core.doseReminderState(null, TODAY), null);
      helpers.assertEqual(core.shouldShowDoseReminder(null, null, TODAY), false);
    }
  });

  cases.push({
    name: 'the pop-up shows once a day, not on every app open',
    fn: function () {
      var reminder = core.doseReminderState('2026-06-05', TODAY);
      helpers.assertEqual(core.shouldShowDoseReminder(reminder, null, TODAY), true, 'never shown before');
      helpers.assertEqual(core.shouldShowDoseReminder(reminder, TODAY, TODAY), false, 'already shown today');
      helpers.assertEqual(core.shouldShowDoseReminder(reminder, '2026-05-31', TODAY), true, 'shown yesterday, due again');
    }
  });

  cases.push({
    name: 'a dose outside the window never shows the pop-up',
    fn: function () {
      var reminder = core.doseReminderState('2026-08-01', TODAY);
      helpers.assertEqual(core.shouldShowDoseReminder(reminder, null, TODAY), false);
    }
  });

  cases.push({
    name: 'the countdown ring fills as the interval elapses and is clamped at both ends',
    fn: function () {
      helpers.assertEqual(core.doseCycleProgress('denosumab', '2026-01-01', '2026-01-01'), 0);
      helpers.assertEqual(Math.round(core.doseCycleProgress('denosumab', '2026-01-01', '2026-04-01') * 100), 50);
      helpers.assertEqual(core.doseCycleProgress('denosumab', '2026-01-01', '2026-09-01'), 1, 'overdue should not overflow the ring');
      helpers.assertEqual(core.doseCycleProgress('denosumab', null, '2026-04-01'), 0);
      helpers.assertEqual(core.doseCycleProgress('not_a_med', '2026-01-01', '2026-04-01'), 0);
    }
  });

  cases.push({
    name: 'every medication carries an icon, route and cadence label for the picker',
    fn: function () {
      core.MED_CLASSES.forEach(function (med) {
        helpers.assert(!!med.icon, med.id + ' is missing an icon');
        helpers.assert(med.route && med.route.th && med.route.en, med.id + ' is missing a TH/EN route');
        helpers.assert(med.cadenceLabel && med.cadenceLabel.th && med.cadenceLabel.en, med.id + ' is missing a TH/EN cadence label');
      });
    }
  });

  cases.push({
    name: 'BMD series are built per site and skip missing values',
    fn: function () {
      var logs = [
        { date: '2024-01-10', spineT: -2.6, hipT: -2.3 },
        { date: '2026-01-10', spineT: -2.4 }
      ];
      helpers.assertEqual(core.buildBmdSeries(logs, 'spine').length, 2);
      helpers.assertEqual(core.buildBmdSeries(logs, 'hip').length, 1, 'a scan without a hip value is skipped for hip');
      helpers.assertEqual(core.buildBmdSeries(logs, 'spine')[1].value, -2.4);
      helpers.assertEqual(core.hasBmdData(logs), true);
      helpers.assertEqual(core.hasBmdData([]), false);
      helpers.assertEqual(core.hasBmdData([{ date: '2026-01-10' }]), false);
    }
  });

  cases.push({
    name: 'series change reports direction and a signed amount for the chart chip',
    fn: function () {
      var up = core.seriesChange([{ label: 'a', value: 0.72 }, { label: 'b', value: 0.75 }], 3);
      helpers.assertEqual(up.direction, 'up');
      helpers.assertEqual(up.deltaText, '+0.030');

      var down = core.seriesChange([{ label: 'a', value: 158 }, { label: 'b', value: 156 }], 1);
      helpers.assertEqual(down.direction, 'down');
      helpers.assertEqual(down.deltaText, '−2.0');

      var flat = core.seriesChange([{ label: 'a', value: 10 }, { label: 'b', value: 10 }], 0);
      helpers.assertEqual(flat.direction, 'flat');
      helpers.assertEqual(core.seriesChange([{ label: 'a', value: 1 }]), null, 'one point is not a trend');
      helpers.assertEqual(core.seriesChange([]), null);
    }
  });

  cases.push({
    name: 'BMD records merge per scan day so a second site does not overwrite the first',
    fn: function () {
      helpers.assert(core.MERGEABLE_RECORD_TYPES.indexOf('bmd') !== -1, 'bmd should be mergeable');
      var queue = [];
      core.queueRecord(queue, { patientId: 'HN1', date: '2026-06-01', type: 'bmd', spineT: -2.4 });
      core.queueRecord(queue, { patientId: 'HN1', date: '2026-06-01', type: 'bmd', hipT: -2.1 });
      helpers.assertEqual(queue.length, 1);
      helpers.assertEqual(queue[0].payload.spineT, -2.4);
      helpers.assertEqual(queue[0].payload.hipT, -2.1);
    }
  });

  cases.push({
    name: 'the doctor shown in the footer is configured centrally, in both languages',
    fn: function () {
      helpers.assert(core.DOCTOR.name && core.DOCTOR.name.th && core.DOCTOR.name.en, 'the doctor name needs a TH/EN pair');
      helpers.assertEqual(core.DOCTOR.name.th, 'นพ.สรวุฒิ ธรรมยงค์กิจ');
      helpers.assertEqual(core.DOCTOR.name.en, 'Dr. Sorawut Thamyongkit');
      helpers.assertEqual(core.DOCTOR.hospitalPhone, core.ALERT_CONTACTS.hospitalPhone);
    }
  });

  cases.push({
    name: 'patient-facing wording says hospital, never clinic',
    fn: function () {
      Object.keys(core.CONTENT).forEach(function (key) {
        var entry = core.CONTENT[key];
        helpers.assert(entry.th.indexOf('คลินิก') === -1, 'CONTENT.' + key + ' still says คลินิก');
        helpers.assert(!/\bclinic\b/i.test(entry.en), 'CONTENT.' + key + ' still says clinic');
      });
      core.MED_CLASSES.forEach(function (med) {
        ['instructions', 'missedDose', 'tellDoctor', 'sideEffects', 'whatItDoes'].forEach(function (field) {
          helpers.assert(med[field].th.indexOf('คลินิก') === -1, med.id + '.' + field + ' still says คลินิก');
          helpers.assert(!/\bclinic\b/i.test(med[field].en), med.id + '.' + field + ' still says clinic');
        });
      });
      helpers.assert(!!core.ALERT_CONTACTS.hospitalPhone, 'the hospital phone number should be configured');
    }
  });

  return helpers.runSuite('t11_reminders_bmd', cases);
}

module.exports = run;

if (require.main === module) {
  helpers.report(run());
}
