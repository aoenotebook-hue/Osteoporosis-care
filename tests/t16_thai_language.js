var fs = require('fs');
var path = require('path');
var core = require(path.join(__dirname, '..', 'app-core.js'));
var helpers = require('./helpers');

// The page and its interface script, read as one: the script moved out of
// index.html on 2026-09-24 so the page could carry a strict CSP.
var html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8') +
  fs.readFileSync(path.join(__dirname, '..', 'app-ui.js'), 'utf8');

/** Every Thai string the patient can see, with where it came from. */
function allThai() {
  var out = [];
  Object.keys(core.CONTENT).forEach(function (k) { out.push({ src: 'CONTENT.' + k, th: core.CONTENT[k].th }); });
  Object.keys(core.LISTS).forEach(function (k) {
    core.LISTS[k].forEach(function (i, n) { out.push({ src: 'LISTS.' + k + '[' + n + ']', th: i.th }); });
  });
  function walk(arr, name, fields) {
    (arr || []).forEach(function (o) {
      fields.forEach(function (f) { if (o[f] && o[f].th) out.push({ src: name + '.' + (o.id || '') + '.' + f, th: o[f].th }); });
    });
  }
  walk(core.MED_CLASSES, 'MED', ['name', 'route', 'whatItDoes', 'instructions', 'missedDose', 'sideEffects', 'tellDoctor']);
  walk(core.EXERCISE_LIST, 'EX', ['name', 'howTo', 'amount']);
  walk(core.SAFETY_ITEMS, 'SAFETY', ['name']);
  walk(core.CALCIUM_FOODS, 'FOOD', ['name', 'serving']);
  walk(core.VITD_FOODS, 'VITD', ['name']);
  walk(core.FOOD_AVOID_ITEMS, 'AVOID', ['name', 'why']);
  walk(core.ONBOARDING_QUESTIONS, 'Q', ['label']);
  return out;
}

function offenders(re, skip) {
  return allThai().filter(function (x) {
    if (skip && skip.indexOf(x.src) !== -1) return false;
    return re.test(x.th);
  }).map(function (x) { return x.src + ' → "' + x.th.slice(0, 50) + '"'; });
}

function run() {
  var cases = [];

  cases.push({
    name: 'one word for taking medicine and food, not three',
    fn: function () {
      // กิน / ทาน / รับประทาน all appeared for the same act. The doctor chose
      // รับประทาน, the register printed on Thai pharmacy labels.
      //
      // Two traps in checking this. "ทาน" is a substring of "รับประทาน", so
      // the allowed word has to be removed before looking for the banned one.
      // And "กิน" is a substring of "เกิน" (to exceed), which appears in
      // "ไม่เกินวันละ 2 แก้ว" and must survive untouched.
      var bad = allThai().filter(function (x) {
        var stripped = x.th.split('รับประทาน').join('');
        return /ทาน/.test(stripped) || /(?:^|[^เ])กิน/.test(x.th);
      }).map(function (x) { return x.src + ' → "' + x.th.slice(0, 50) + '"'; });
      helpers.assertEqual(bad.length, 0,
        'ใช้ "รับประทาน" ให้เหมือนกันทั้งแอป พบ กิน/ทาน ที่: ' + bad.join(' | '));
    }
  });

  cases.push({
    name: 'the formal wording did not swallow เกิน along the way',
    fn: function () {
      // A careless find-and-replace of กิน turns "ไม่เกินวันละ 2 แก้ว" into
      // nonsense, and it is advice about alcohol, so it matters.
      var kept = allThai().filter(function (x) { return /ไม่เกินวันละ/.test(x.th); });
      helpers.assert(kept.length >= 2, '"ไม่เกินวันละ" หายไป — น่าจะโดนแทนที่คำผิด');
      allThai().forEach(function (x) {
        helpers.assert(!/เรับประทาน/.test(x.th), x.src + ' เพี้ยนจากการแทนที่คำ: ' + x.th.slice(0, 40));
      });
    }
  });

  cases.push({
    name: 'the app speaks of โอกาส, not ความเสี่ยง, to the patient',
    fn: function () {
      // "โอกาสหกล้ม" and "โอกาสกระดูกหัก" are the patient-facing labels, so a
      // stray "ความเสี่ยง" reads as a different thing. Resource titles quote
      // the real names of outside tools and are left alone.
      var allowed = ['CONTENT.resSteadiTitle', 'CONTENT.resSteadiDesc'];
      var bad = offenders(/ความเสี่ยง/, allowed);
      helpers.assertEqual(bad.length, 0, 'ควรใช้ "โอกาส" พบ "ความเสี่ยง" ที่: ' + bad.join(' | '));
    }
  });

  cases.push({
    name: 'the app always addresses the reader as ท่าน',
    fn: function () {
      var bad = offenders(/(?:^|[^กจ])ฉัน|ผมของ|ดิฉัน/);
      helpers.assertEqual(bad.length, 0, 'ใช้ "ท่าน" ตลอด พบสรรพนามอื่นที่: ' + bad.join(' | '));
    }
  });

  cases.push({
    name: 'no English passive dressed up as Thai',
    fn: function () {
      // ถูก + verb is a translation habit; in Thai it carries a bad-thing
      // connotation (ถูกตี, ถูกขโมย) and reads wrong for neutral actions.
      var bad = offenders(/ถูก(?!ต้อง|วิธี|ทาง|หลัก)/);
      helpers.assertEqual(bad.length, 0, 'เลี่ยง "ถูก + กริยา" พบที่: ' + bad.join(' | '));
    }
  });

  cases.push({
    name: 'no borrowed English word a 75-year-old would not know',
    fn: function () {
      // เช็คอิน reads as hotels and airports, not as a monthly health record.
      var bad = offenders(/เช็คอิน|แท็บ|คลิก|เซฟ|อัปเดต|ดาวน์โหลด/);
      helpers.assertEqual(bad.length, 0, 'เลี่ยงคำทับศัพท์ พบที่: ' + bad.join(' | '));
    }
  });

  cases.push({
    name: 'no English comma habit inside Thai sentences',
    fn: function () {
      var bad = offenders(/[ก-๙]\s*,/);
      helpers.assertEqual(bad.length, 0, 'ภาษาไทยใช้เว้นวรรคแทนลูกน้ำ พบที่: ' + bad.join(' | '));
    }
  });

  cases.push({
    name: 'every Thai sentence the patient reads lives in the content file',
    fn: function () {
      // Thai hardcoded in index.html escapes both the clinical review and the
      // i18n tests - that is how a dental warning sat unchecked for months.
      // Only the script: the page head now carries a CSP whose 'self' and
      // 'none' keywords would pair up with quotes in the markup around them.
      var ui = fs.readFileSync(path.join(__dirname, '..', 'app-ui.js'), 'utf8');
      var literals = ui.match(/'[^']*[฀-๿][^']*'/g) || [];
      var allowed = /^'(?:[฀-๿]{1,4}\.|ไทย|[\s·×−–—\/]+|\s*)'$/;
      var stray = literals.filter(function (lit) {
        if (allowed.test(lit)) return false;
        // month abbreviations arrive as a data row, not as a sentence
        return lit.replace(/'/g, '').trim().length > 6;
      });
      helpers.assertEqual(stray.length, 0,
        'ย้ายข้อความไทยเหล่านี้ไปไว้ใน CONTENT: ' + stray.join(' | '));
    }
  });

  cases.push({
    name: 'the clinical strings moved out of index.html are really being shown',
    fn: function () {
      ['drugDentalBody', 'nutritionEggsPerDay', 'chartViewAsTable', 'chartDateHeader'].forEach(function (key) {
        helpers.assert(core.CONTENT[key] !== undefined, key + ' หายไปจาก CONTENT');
        helpers.assert(html.indexOf("tr('" + key + "')") !== -1, key + ' ไม่ได้ถูกนำไปแสดง');
      });
    }
  });

  cases.push({
    name: 'Thai and English are written separately, not translated word for word',
    fn: function () {
      // A Thai string identical to its English twin means one was never written.
      var same = [];
      Object.keys(core.CONTENT).forEach(function (k) {
        var e = core.CONTENT[k];
        if (e.th === e.en && !/^[A-Za-z0-9\s().,%-]*$/.test(e.th)) same.push(k);
      });
      helpers.assertEqual(same.length, 0, 'เขียนคนละภาษา ไม่ใช่แปลตรงตัว: ' + same.join(', '));
    }
  });

  return helpers.runSuite('t16_thai_language', cases);
}

module.exports = run;

if (require.main === module) {
  helpers.report(run());
}
