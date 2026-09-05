(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.OsteoCore = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {

  var SCHEMA_VERSION = 1;

  var TIERS = { A: 'A', B: 'B', C: 'C' };

  function t(th, en) { return { th: th, en: en }; }

  var CONTENT = {
    appName: t('ดูแลกระดูก', 'Bone Health Companion'),
    appNameShort: t('ดูแลกระดูก', 'Bone Care'),
    orgLine: t('ศูนย์เวชศาสตร์ผู้สูงอายุ รามาธิบดี CNMI', 'CNMI Ramathibodi Orthopaedic Surgery'),

    langToggleTh: t('ไทย', 'Thai'),
    langToggleEn: t('อังกฤษ', 'English'),

    navHome: t('หน้าหลัก', 'Home'),
    navBone: t('กระดูก', 'Bone'),
    navMove: t('ออกกำลัง', 'Move'),
    navSafety: t('ป้องกันล้ม', 'Safety'),
    navTrack: t('ติดตาม', 'Track'),
    navAlert: t('สัญญาณเตือน', 'Alert'),

    a2hsPrompt: t('เพิ่มแอปนี้ที่หน้าจอหลักเพื่อใช้งานง่ายขึ้น', 'Add this app to your home screen for easy access'),
    a2hsInstall: t('เพิ่มหน้าจอหลัก', 'Add to Home Screen'),
    a2hsDismiss: t('ไว้ทีหลัง', 'Not now'),

    pdpaTitle: t('ความยินยอมการใช้ข้อมูลส่วนบุคคล (PDPA)', 'Personal Data Consent (PDPA)'),
    pdpaBody: t(
      'ข้อมูลของท่านจะถูกใช้เพื่อการดูแลรักษาและติดตามอาการทางการแพทย์ในโครงการดูแลกระดูก CNMI เท่านั้น ท่านสามารถขอถอนความยินยอมได้ทุกเมื่อโดยติดต่อคลินิก',
      'Your data will be used only for care and clinical follow-up in the CNMI Bone Health programme. You may withdraw consent at any time by contacting the clinic.'
    ),
    pdpaCheckbox: t('ข้าพเจ้ายินยอมให้เก็บและใช้ข้อมูลตามที่แจ้งข้างต้น', 'I consent to the collection and use of my data as described above'),

    registerTitle: t('ลงทะเบียนผู้ป่วย', 'Patient Registration'),
    registerName: t('ชื่อ-นามสกุล', 'Full name'),
    registerPhone: t('เบอร์โทรศัพท์', 'Phone number'),
    registerHN: t('หมายเลข HN', 'Hospital Number (HN)'),
    registerHNUnknown: t('ไม่ทราบเลข HN', "I don't know my HN"),
    registerYearOfBirth: t('ปีเกิด (พ.ศ. หรือ ค.ศ.)', 'Year of birth'),
    registerSex: t('เพศ', 'Sex'),
    registerSexMale: t('ชาย', 'Male'),
    registerSexFemale: t('หญิง', 'Female'),
    registerSubmit: t('ลงทะเบียน', 'Register'),
    registerOfflineNotice: t('ไม่มีสัญญาณอินเทอร์เน็ต ข้อมูลจะถูกส่งเมื่อกลับมาออนไลน์', 'No internet connection — your data will be sent once you are back online'),
    registerSuccess: t('ลงทะเบียนสำเร็จ', 'Registration successful'),

    onboardingTitle: t('แบบประเมินความเสี่ยง', 'Risk Assessment'),
    onboardingNext: t('ถัดไป', 'Next'),
    onboardingBack: t('ย้อนกลับ', 'Back'),
    onboardingFinish: t('เสร็จสิ้น', 'Finish'),
    qAge: t('อายุของท่านเท่าไร', 'What is your age?'),
    qSex: t('เพศของท่านคืออะไร', 'What is your sex?'),
    qPriorFracture: t('ท่านเคยกระดูกหักจากการล้มเบา ๆ หรือไม่ (สะโพก สันหลัง ข้อมือ ต้นแขน)', 'Have you ever had a fragility fracture (hip, spine, wrist, upper arm) from a minor fall?'),
    qFractureSite: t('กระดูกส่วนใดที่เคยหัก', 'Which bone was fractured?'),
    siteHip: t('สะโพก', 'Hip'),
    siteSpine: t('กระดูกสันหลัง', 'Spine'),
    siteWrist: t('ข้อมือ', 'Wrist'),
    siteHumerus: t('ต้นแขน', 'Upper arm (humerus)'),
    qTScore: t('ทราบค่า T-score จากการตรวจความหนาแน่นกระดูก (DXA) หรือไม่', 'Do you know your T-score from a bone density (DXA) scan?'),
    qTScoreValue: t('ค่า T-score ต่ำที่สุดของท่านคือเท่าไร', 'What is your lowest T-score value?'),
    qFalls: t('ในช่วง 12 เดือนที่ผ่านมา ท่านล้มกี่ครั้ง', 'In the past 12 months, how many times have you fallen?'),
    qSteroid: t('ท่านใช้ยาสเตียรอยด์ต่อเนื่องระยะยาวหรือไม่', 'Are you on long-term steroid medication?'),
    qCurrentMed: t('ท่านกำลังใช้ยารักษากระดูกพรุนอยู่หรือไม่ ชนิดใด', 'Are you currently on osteoporosis medication? Which type?'),
    qWalkAid: t('ท่านต้องใช้อุปกรณ์ช่วยเดินหรือไม่ (ไม้เท้า, walker)', 'Do you use a walking aid (cane, walker)?'),
    qFearFalling: t('ท่านกลัวการล้มจนไม่กล้าทำกิจกรรมบางอย่างหรือไม่', 'Are you afraid of falling to the point it limits your activities?'),
    yes: t('ใช่', 'Yes'),
    no: t('ไม่ใช่', 'No'),
    notSure: t('ไม่ทราบ', 'Not sure'),
    none: t('ไม่มี', 'None'),

    tierResultTitle: t('ผลการประเมิน', 'Your result'),
    tierA_name: t('ดูแลกระดูก', 'Bone Health'),
    tierA_desc: t('กระดูกเริ่มบางหรือมีความเสี่ยง แต่ยังไม่เคยกระดูกหักและไม่เคยล้มใน 12 เดือน เน้นสร้างนิสัยดูแลกระดูกและป้องกันการล้ม', 'You have osteopenia or risk factors, with no prior fracture and no fall in the past 12 months. Focus on building bone-healthy habits and preventing falls.'),
    tierB_name: t('เสี่ยงกระดูกหักสูง', 'High Fracture Risk'),
    tierB_desc: t('ท่านมีความเสี่ยงกระดูกหักสูง จากผลตรวจ DXA, การใช้ยาสเตียรอยด์, เคยล้ม หรืออายุมาก เน้นความปลอดภัยและการใช้ยาอย่างสม่ำเสมอ', 'You are at high fracture risk due to DXA results, steroid use, a recent fall, or age. Focus on safety and consistent medication use.'),
    tierC_name: t('หลังกระดูกหัก', 'Post-Fracture'),
    tierC_desc: t('ท่านเคยกระดูกหักจากการล้มเบา ๆ มาก่อน เน้นการเคลื่อนไหวอย่างปลอดภัยและป้องกันการหักซ้ำ', 'You have had a prior fragility fracture. Focus on safe movement and preventing another fracture.'),

    balanceLevel1: t('ระดับ 1 — มีที่พยุงตลอด', 'Level 1 — Supported'),
    balanceLevel2: t('ระดับ 2 — พยุงเบา ๆ', 'Level 2 — Light support'),
    balanceLevel3: t('ระดับ 3 — อิสระ', 'Level 3 — Independent'),

    homeGreeting: t('สวัสดี', 'Hello'),
    homeMedDue: t('ถึงเวลาทานยา/ฉีดยาวันนี้หรือไม่', 'Is medication due today?'),
    homeExerciseDone: t('วันนี้ออกกำลังกายแล้วหรือยัง', 'Have you exercised today?'),
    homeSafetyTip: t('เคล็ดลับความปลอดภัยวันนี้', "Today's safety tip"),
    homeCheckinDue: t('ถึงเวลาตรวจเช็คประจำเดือนแล้ว', 'Your monthly check-in is due'),
    homeLearnMore: t('เรียนรู้เพิ่มเติม / แหล่งข้อมูล', 'Learn more / Resources'),
    homeMarkDone: t('ทำแล้ว', 'Done'),

    boneWhatIsTitle: t('โรคกระดูกพรุนคืออะไร', 'What is osteoporosis?'),
    boneWhatIsBody: t(
      'โรคกระดูกพรุนคือภาวะที่กระดูกบางและเปราะลง ทำให้เสี่ยงต่อการหักได้ง่ายแม้ล้มเพียงเล็กน้อย การดูแลด้วยยา แคลเซียม วิตามินดี และการออกกำลังกายที่เหมาะสมช่วยลดความเสี่ยงกระดูกหักได้',
      'Osteoporosis is a condition where bones become thin and fragile, increasing the risk of fracture even from a minor fall. Medication, calcium, vitamin D, and appropriate exercise help reduce fracture risk.'
    ),
    boneMedSectionTitle: t('ยารักษากระดูกพรุน', 'Osteoporosis Medication'),
    boneNutritionSectionTitle: t('โภชนาการเพื่อกระดูก', 'Nutrition for Bones'),

    medPickClass: t('เลือกชนิดยาที่ท่านใช้', 'Select your medication type'),
    medStartDate: t('วันที่เริ่มยา/ครั้งล่าสุด', 'Start date / last dose date'),
    medNextDue: t('ครั้งถัดไป', 'Next dose due'),
    medMarkTaken: t('บันทึกว่าทานแล้ว', 'Mark as taken'),
    medAddCalendar: t('เพิ่มลงปฏิทินโทรศัพท์', 'Add to phone calendar'),
    medDoNotDelay: t('ห้ามเลื่อนนัดฉีดยานี้ กรุณาติดต่อคลินิกหากไม่สามารถมาตามนัด', 'Do not delay this injection — contact the clinic if you cannot attend as scheduled'),
    medAdherenceLog: t('ประวัติการทานยา', 'Adherence log'),

    calciumTitle: t('ตัวคำนวณแคลเซียม', 'Calcium Estimator'),
    calciumTargetLabel: t('เป้าหมายวันนี้', "Today's target"),
    calciumTotalLabel: t('รวมวันนี้', 'Total today'),
    calciumSuggestion: t('ลองเพิ่มอาหารนี้เพื่อให้ถึงเป้าหมาย', 'Try adding this food to reach your target'),
    calciumMgUnit: t('มก.', 'mg'),
    vitaminDTitle: t('วิตามินดี', 'Vitamin D'),
    vitaminDBody: t('รับแดดอ่อน ๆ 10-15 นาที 2-3 ครั้งต่อสัปดาห์ (ก่อน 9 โมงเช้า หรือหลัง 4 โมงเย็น) หรือทานอาหารเสริมตามแพทย์สั่ง', 'Get 10-15 minutes of gentle sun exposure 2-3 times a week (before 9am or after 4pm), or take supplements as prescribed'),
    proteinTitle: t('โปรตีน', 'Protein'),
    proteinBody: t('ทานโปรตีนให้เพียงพอทุกมื้อ เช่น ไข่ เนื้อสัตว์ไม่ติดมัน ปลา ถั่ว เต้าหู้ เพื่อช่วยซ่อมแซมกล้ามเนื้อและกระดูก', 'Eat enough protein at every meal — eggs, lean meat, fish, beans, tofu — to support muscle and bone repair'),
    avoidTitle: t('สิ่งที่ควรลด', 'Things to Reduce'),
    avoidBody: t('ลดเค็ม ลดคาเฟอีน จำกัดแอลกอฮอล์ และงดสูบบุหรี่ เพราะเร่งการสูญเสียมวลกระดูก', 'Reduce salt and caffeine, limit alcohol, and avoid smoking — these accelerate bone loss'),

    moveIntro: t('เลือกกลุ่มออกกำลังกายที่เหมาะกับระดับการทรงตัวของท่าน', 'Choose exercises matched to your current balance level'),
    moveGroupBalance: t('การทรงตัว', 'Balance'),
    moveGroupStrength: t('ความแข็งแรง', 'Strength'),
    moveGroupPosture: t('ท่าทาง/ปกป้องหลัง', 'Posture / Spine Safety'),
    moveWeeklyTarget: t('เป้าหมายรายสัปดาห์', 'Weekly target'),
    moveNeverDo: t('ท่าที่ควรหลีกเลี่ยง', 'Moves to Avoid'),
    moveNeverDoBody: t('งดท่าซิทอัพ ก้มแตะปลายเท้า และบิดตัวแรง ๆ โดยเฉพาะหากเคยกระดูกสันหลังหัก', 'Avoid sit-ups, toe-touches, and forceful twisting — especially if you have had a vertebral fracture'),
    exerciseRequires: t('อุปกรณ์ที่ต้องใช้', 'Requires'),
    exerciseReps: t('จำนวนครั้ง/เซต', 'Reps/Sets'),
    reqChair: t('เก้าอี้', 'Chair'),
    reqWall: t('กำแพง', 'Wall'),
    reqNone: t('ไม่ต้องใช้อุปกรณ์', 'No equipment'),
    videoUnavailable: t('วิดีโอกำลังจัดเตรียม — ทำตามคำอธิบาย', 'Video coming soon — follow the written steps'),
    sessionLogTitle: t('บันทึกการออกกำลังกาย', 'Exercise Session Log'),
    sessionLogSave: t('บันทึกวันนี้', 'Log today'),

    safetyAuditTitle: t('ตรวจสอบความปลอดภัยในบ้าน', 'Home Safety Audit'),
    safetyScoreLabel: t('คะแนนความปลอดภัย', 'Safety score'),
    safetyPriorityTitle: t('สิ่งที่ควรแก้ไขก่อน', 'Priority fixes'),
    safetyRoomBedroom: t('ห้องนอน', 'Bedroom'),
    safetyRoomBathroom: t('ห้องน้ำ', 'Bathroom'),
    safetyRoomStairs: t('บันได', 'Stairs'),
    safetyRoomKitchen: t('ห้องครัว', 'Kitchen'),
    safetyRoomOutdoors: t('นอกบ้าน', 'Outdoors'),
    footwearTitle: t('รองเท้า', 'Footwear'),
    footwearBody: t('เลือกรองเท้าหุ้มส้น พื้นไม่ลื่น กระชับพอดี หลีกเลี่ยงรองเท้าแตะหรือถุงเท้าเดินบนพื้นลื่น', 'Choose closed-heel, non-slip, well-fitting shoes. Avoid loose sandals or walking on slippery floors in socks'),
    visionTitle: t('ตรวจสายตา', 'Vision Check'),
    visionBody: t('ตรวจสายตาอย่างน้อยปีละครั้ง สายตาที่ไม่ชัดเพิ่มความเสี่ยงล้ม', 'Have your vision checked at least once a year — poor vision increases fall risk'),
    fallRiskMedsTitle: t('ยาที่เพิ่มความเสี่ยงล้ม', 'Medicines That Raise Fall Risk'),
    fallRiskMedsBody: t('ยานอนหลับ ยาลดความดันบางชนิด และแอลกอฮอล์ อาจทำให้วิงเวียนหรือง่วงซึม นำรายการยาไปปรึกษาแพทย์', 'Sleeping pills, some blood pressure medicines, and alcohol can cause dizziness or drowsiness — bring your medication list to discuss with your doctor'),
    gettingUpTitle: t('การลุกจากพื้นอย่างปลอดภัย', 'Getting Up From the Floor Safely'),
    gettingUpBody: t('หากล้ม อย่ารีบลุก ตั้งสติ พลิกตัวมาคว่ำ คลานไปหาเก้าอี้หรือเฟอร์นิเจอร์ที่มั่นคง แล้วค่อย ๆ พยุงตัวลุกขึ้น', "If you fall, don't rush to get up. Stay calm, roll onto your front, crawl to a sturdy chair or furniture, and slowly push yourself up"),
    reauditReminder: t('ควรตรวจสอบซ้ำทุก 6 เดือน', 'Re-check every 6 months'),

    fallsLogTitle: t('บันทึกการล้ม', 'Falls Log'),
    fallsLogAdd: t('บันทึกการล้มใหม่', 'Log a new fall'),
    fallsLogDate: t('วันที่', 'Date'),
    fallsLogInjured: t('บาดเจ็บหรือไม่', 'Were you injured?'),
    fallsLogCause: t('สาเหตุ', 'Cause'),
    heightTitle: t('ส่วนสูง', 'Height'),
    heightBaseline: t('ส่วนสูงเริ่มต้น', 'Baseline height'),
    heightCurrent: t('ส่วนสูงปัจจุบัน', 'Current height'),
    heightLossWarning: t('ส่วนสูงลดลงตั้งแต่ 2 ซม. ควรแจ้งแพทย์', 'Height has dropped 2 cm or more — please tell your doctor'),
    selfTestTitle: t('ทดสอบตนเอง', 'Self-Tests'),
    chairStandTitle: t('ทดสอบลุกนั่งเก้าอี้ 30 วินาที', '30-Second Chair Stand Test'),
    chairStandInstructions: t('นั่งกลางเก้าอี้ กอดอกไว้ ลุกยืนสุดแล้วนั่งลงให้ได้มากที่สุดใน 30 วินาที ควรมีคนอยู่ใกล้ ๆ', 'Sit in the middle of a chair, arms crossed. Stand fully then sit back down as many times as possible in 30 seconds. Have someone nearby'),
    tugTitle: t('ทดสอบลุกเดิน (Timed Up and Go)', 'Timed Up and Go (TUG) Test'),
    tugInstructions: t('ลุกจากเก้าอี้ เดิน 3 เมตร เลี้ยวกลับ แล้วนั่งลง จับเวลาทั้งหมด ควรมีคนอยู่ใกล้ ๆ และเก้าอี้พิงกำแพง', 'Stand up from a chair, walk 3 meters, turn around, and sit back down. Time the whole task. Have someone nearby and place the chair against a wall'),
    startTimer: t('เริ่มจับเวลา', 'Start timer'),
    stopTimer: t('หยุด', 'Stop'),
    seconds: t('วินาที', 'seconds'),
    reps: t('ครั้ง', 'reps'),
    adherenceStreak: t('ต่อเนื่อง', 'streak'),
    days: t('วัน', 'days'),
    dxaTitle: t('วันที่ตรวจความหนาแน่นกระดูก (DXA)', 'DXA Scan Date'),
    dxaLastDate: t('ตรวจครั้งล่าสุด', 'Last scan date'),
    dxaNextDue: t('ควรตรวจครั้งถัดไป', 'Next scan due'),
    monthlyCheckinTitle: t('เช็คอินประจำเดือน', 'Monthly Check-in'),
    monthlyCheckinFalls: t('เดือนนี้ท่านล้มหรือไม่', 'Did you fall this month?'),

    alertTitle: t('สัญญาณเตือนที่ต้องพบแพทย์ทันที', 'Warning Signs — Seek Care Immediately'),
    alertBackPain: t('ปวดหลังรุนแรงเฉียบพลัน หรือปวดใหม่หลังล้มเบา ๆ', 'Sudden severe back pain, or new pain after a minor fall'),
    alertHipPain: t('ปวดสะโพกหรือขาหนีบ ลงน้ำหนักไม่ได้หลังล้ม', 'Hip or groin pain, unable to bear weight after a fall'),
    alertHeadInjury: t('ศีรษะกระแทก หรือกินยาละลายลิ่มเลือดแล้วล้ม', 'Head strike, or a fall while taking blood thinners'),
    alertNeuro: t('ชา อ่อนแรงที่ขา หรือกลั้นปัสสาวะ/อุจจาระไม่ได้', 'Numbness or weakness in the legs, or new bladder/bowel control problems'),
    alertCallClinic: t('โทรคลินิก 02 839 6000', 'Call clinic 02 839 6000'),
    alertCallEms: t('โทรฉุกเฉิน 1669', 'Call emergency 1669'),

    resourcesTitle: t('แหล่งข้อมูลเพิ่มเติม', 'Additional Resources'),
    learnTScoreTitle: t('T-score คืออะไร', 'What is a T-score?'),
    learnTScoreBody: t('T-score เปรียบเทียบความหนาแน่นกระดูกของท่านกับคนหนุ่มสาวปกติ ค่ายิ่งต่ำ (ติดลบมาก) ยิ่งบ่งชี้กระดูกบาง', 'A T-score compares your bone density to that of a healthy young adult. A lower (more negative) score indicates thinner bone'),
    learnMedMattersTitle: t('ทำไมยาจึงสำคัญ', 'Why medication matters'),
    learnMedMattersBody: t('ยารักษากระดูกพรุนช่วยลดความเสี่ยงกระดูกหัก การหยุดยาบางชนิด (เช่น denosumab) กะทันหันโดยไม่ปรึกษาแพทย์อาจเพิ่มความเสี่ยงกระดูกสันหลังหักได้', 'Osteoporosis medication reduces fracture risk. Stopping some medications (such as denosumab) abruptly without medical advice can increase the risk of spinal fracture'),
    learnExpectTitle: t('ความคาดหวังที่เหมาะสม', 'Realistic expectations'),
    learnExpectBody: t('การดูแลกระดูกช่วยลดความเสี่ยงล้มและกระดูกหักได้ แต่ไม่สามารถรับประกันว่าจะไม่หักหรือย้อนกลับโรคได้ทั้งหมด', 'Bone care reduces the risk of falls and fractures, but cannot guarantee a fracture will never happen or fully reverse the disease'),
    learnWhatIsTitle: t('โรคกระดูกพรุนคืออะไร', 'What is osteoporosis?'),

    save: t('บันทึก', 'Save'),
    cancel: t('ยกเลิก', 'Cancel'),
    close: t('ปิด', 'Close'),
    edit: t('แก้ไข', 'Edit'),
    delete: t('ลบ', 'Delete'),
    loading: t('กำลังโหลด', 'Loading')
  };

  function parseYMD(s) {
    var parts = s.split('-');
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }

  function formatYMD(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  function addDaysSafe(dateStr, days) {
    var d = parseYMD(dateStr);
    d.setDate(d.getDate() + days);
    return formatYMD(d);
  }

  function addMonthsSafe(dateStr, months) {
    var d = parseYMD(dateStr);
    var targetYear = d.getFullYear();
    var targetMonth = d.getMonth() + months;
    while (targetMonth > 11) { targetMonth -= 12; targetYear += 1; }
    while (targetMonth < 0) { targetMonth += 12; targetYear -= 1; }
    var daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    var targetDay = Math.min(d.getDate(), daysInTargetMonth);
    return formatYMD(new Date(targetYear, targetMonth, targetDay));
  }

  function daysBetween(dateStrA, dateStrB) {
    var a = parseYMD(dateStrA);
    var b = parseYMD(dateStrB);
    return Math.round((b.getTime() - a.getTime()) / 86400000);
  }

  function resolveTier(profile) {
    profile = profile || {};
    var hasFragilityFracture = !!profile.priorFragilityFracture;
    if (hasFragilityFracture) return TIERS.C;

    var isOsteoporosisOnDxa = !!profile.dxaOsteoporosis || (typeof profile.tScore === 'number' && profile.tScore <= -2.5);
    var hasSteroid = !!profile.longTermSteroid;
    var hasRecentFall = (profile.fallsLast12mo || 0) >= 1;
    var isElderly = (profile.age || 0) >= 75;

    if (isOsteoporosisOnDxa || hasSteroid || hasRecentFall || isElderly) {
      return TIERS.B;
    }
    return TIERS.A;
  }

  function defaultBalanceLevelForProfile(profile, tier) {
    profile = profile || {};
    if (tier === TIERS.C || profile.walksWithAid || profile.fearOfFalling) {
      return 1;
    }
    return 2;
  }

  var CHAIR_STAND_NORMS = {
    male: [
      { minAge: 60, maxAge: 64, minReps: 14 },
      { minAge: 65, maxAge: 69, minReps: 12 },
      { minAge: 70, maxAge: 74, minReps: 12 },
      { minAge: 75, maxAge: 79, minReps: 11 },
      { minAge: 80, maxAge: 84, minReps: 10 },
      { minAge: 85, maxAge: 89, minReps: 8 },
      { minAge: 90, maxAge: 200, minReps: 7 }
    ],
    female: [
      { minAge: 60, maxAge: 64, minReps: 12 },
      { minAge: 65, maxAge: 69, minReps: 11 },
      { minAge: 70, maxAge: 74, minReps: 10 },
      { minAge: 75, maxAge: 79, minReps: 10 },
      { minAge: 80, maxAge: 84, minReps: 9 },
      { minAge: 85, maxAge: 89, minReps: 8 },
      { minAge: 90, maxAge: 200, minReps: 4 }
    ]
  };

  function meetsChairStandNorm(age, sex, reps) {
    var table = CHAIR_STAND_NORMS[sex === 'male' ? 'male' : 'female'];
    var band = null;
    for (var i = 0; i < table.length; i++) {
      if (age >= table[i].minAge && age <= table[i].maxAge) { band = table[i]; break; }
    }
    if (!band) band = age < 60 ? table[0] : table[table.length - 1];
    return reps >= band.minReps;
  }

  var TUG_THRESHOLD_SECONDS = 12;
  function meetsTUG(seconds) {
    return typeof seconds === 'number' && seconds < TUG_THRESHOLD_SECONDS;
  }

  function canAdvanceBalanceLevel(history) {
    history = history || {};
    var sessions = history.weeklySessionCounts || [];
    var last4 = sessions.slice(-4);
    var enoughSessions = last4.length === 4 && last4.every(function (c) { return c >= 3; });
    var chairOk = typeof history.age === 'number' && history.sex && typeof history.chairStandReps === 'number'
      ? meetsChairStandNorm(history.age, history.sex, history.chairStandReps)
      : false;
    var tugOk = history.tugSeconds === undefined ? true : meetsTUG(history.tugSeconds);
    var noRecentFall = (history.fallsLast4Weeks || 0) === 0;
    return enoughSessions && chairOk && tugOk && noRecentFall;
  }

  function resolveBalanceLevel(profile, history) {
    profile = profile || {};
    history = history || {};
    var tier = history.tier || resolveTier(profile);
    var currentLevel = history.currentLevel;

    if (!currentLevel) {
      return defaultBalanceLevelForProfile(profile, tier);
    }

    if ((history.fallsLast4Weeks || 0) > 0) {
      return Math.max(1, currentLevel - 1);
    }

    if (currentLevel < 3 && canAdvanceBalanceLevel(history)) {
      return currentLevel + 1;
    }

    return currentLevel;
  }

  var MED_CLASSES = [
    {
      id: 'bisphosphonate_weekly',
      name: t('ยาต้านการสลายกระดูกชนิดกิน รายสัปดาห์', 'Oral Bisphosphonate (Weekly)'),
      cadenceType: 'days',
      intervalDays: 7,
      instructions: t(
        'ทานตอนท้องว่างพร้อมน้ำเปล่าเท่านั้น นั่งหรือยืนตัวตรงอย่างน้อย 30 นาทีหลังทาน และรออย่างน้อย 30 นาทีก่อนทานอาหารหรือยาอื่น',
        'Take on an empty stomach with plain water only. Stay upright (sitting or standing) for at least 30 minutes afterward, and wait at least 30 minutes before eating or taking other medicine'
      )
    },
    {
      id: 'bisphosphonate_daily',
      name: t('ยาต้านการสลายกระดูกชนิดกิน รายวัน', 'Oral Bisphosphonate (Daily)'),
      cadenceType: 'days',
      intervalDays: 1,
      instructions: t(
        'ทานตอนท้องว่างพร้อมน้ำเปล่าเท่านั้น นั่งหรือยืนตัวตรงอย่างน้อย 30 นาทีหลังทาน และรออย่างน้อย 30 นาทีก่อนทานอาหารหรือยาอื่น',
        'Take on an empty stomach with plain water only. Stay upright for at least 30 minutes afterward, and wait at least 30 minutes before eating or taking other medicine'
      )
    },
    {
      id: 'denosumab',
      name: t('Denosumab (ฉีดทุก 6 เดือน)', 'Denosumab (6-monthly injection)'),
      cadenceType: 'months',
      intervalMonths: 6,
      doNotDelay: true,
      instructions: t(
        'ฉีดที่คลินิกทุก 6 เดือน ห้ามเลื่อนหรือหยุดยาเองโดยไม่ปรึกษาแพทย์ เพราะอาจเพิ่มความเสี่ยงกระดูกสันหลังหัก',
        'Injected at the clinic every 6 months. Do not delay or stop this medication on your own without consulting your doctor — this can increase the risk of spinal fracture'
      )
    },
    {
      id: 'zoledronate',
      name: t('Zoledronate (ฉีดเข้าเส้นเลือดทุกปี)', 'Zoledronate (yearly IV infusion)'),
      cadenceType: 'months',
      intervalMonths: 12,
      instructions: t(
        'ให้ยาทางหลอดเลือดดำที่โรงพยาบาลปีละครั้ง ควรดื่มน้ำให้เพียงพอก่อนและหลังรับยา',
        'Given as an IV infusion at the hospital once a year. Drink plenty of water before and after the infusion'
      )
    },
    {
      id: 'teriparatide',
      name: t('Teriparatide (ฉีดเองรายวัน)', 'Teriparatide (daily self-injection)'),
      cadenceType: 'days',
      intervalDays: 1,
      instructions: t(
        'ฉีดเองใต้ผิวหนังทุกวัน ระยะเวลาการใช้ยาโดยรวมควรปรึกษาแพทย์ผู้รักษา',
        'Self-injected under the skin daily. Discuss the total planned duration of treatment with your doctor'
      )
    },
    {
      id: 'romosozumab',
      name: t('Romosozumab (ฉีดทุกเดือน)', 'Romosozumab (monthly injection)'),
      cadenceType: 'months',
      intervalMonths: 1,
      instructions: t(
        'ฉีดที่คลินิกทุกเดือน โดยทั่วไปเป็นชุดการรักษา 12 เดือน แจ้งแพทย์หากมีประวัติโรคหัวใจหรือหลอดเลือดสมอง',
        'Injected at the clinic monthly, typically for a 12-month course. Tell your doctor if you have a history of heart disease or stroke'
      )
    },
    {
      id: 'calcium_vitd',
      name: t('แคลเซียม + วิตามินดี (เสริม)', 'Calcium + Vitamin D (supplement)'),
      cadenceType: 'days',
      intervalDays: 1,
      instructions: t(
        'ทานพร้อมมื้ออาหารทุกวันตามที่แพทย์แนะนำ',
        'Take with meals daily as recommended by your doctor'
      )
    }
  ];

  function getMedClass(id) {
    for (var i = 0; i < MED_CLASSES.length; i++) {
      if (MED_CLASSES[i].id === id) return MED_CLASSES[i];
    }
    return null;
  }

  function computeNextDue(medClassId, fromDateStr) {
    var med = getMedClass(medClassId);
    if (!med) throw new Error('Unknown medication class: ' + medClassId);
    if (med.cadenceType === 'days') {
      return addDaysSafe(fromDateStr, med.intervalDays);
    }
    if (med.cadenceType === 'months') {
      return addMonthsSafe(fromDateStr, med.intervalMonths);
    }
    throw new Error('Unknown cadence type for ' + medClassId);
  }

  var FOOD_TABLE = [
    { id: 'dried_small_fish', name: t('ปลาเล็กปลาน้อยตากแห้ง', 'Small dried fish'), mgPerServing: 226, serving: t('2 ช้อนโต๊ะ', '2 tbsp') },
    { id: 'tofu', name: t('เต้าหู้แข็ง', 'Firm tofu'), mgPerServing: 130, serving: t('1/2 ถ้วย', '1/2 cup') },
    { id: 'sesame', name: t('งาดำ', 'Black sesame seeds'), mgPerServing: 130, serving: t('1 ช้อนโต๊ะ', '1 tbsp') },
    { id: 'kale_thai', name: t('คะน้า', 'Chinese kale (คะน้า)'), mgPerServing: 90, serving: t('1 ถ้วยสุก', '1 cup cooked') },
    { id: 'moringa_leaf', name: t('ใบยอ', 'Moringa leaves (ใบยอ)'), mgPerServing: 250, serving: t('1 ถ้วยสุก', '1 cup cooked') },
    { id: 'milk', name: t('นมจืด', 'Plain milk'), mgPerServing: 300, serving: t('1 กล่อง (250 มล.)', '1 carton (250ml)') },
    { id: 'yogurt', name: t('โยเกิร์ต', 'Yoghurt'), mgPerServing: 250, serving: t('1 ถ้วย', '1 cup') },
    { id: 'sardine', name: t('ปลากระป๋อง (ซาร์ดีน)', 'Canned sardines'), mgPerServing: 240, serving: t('1/2 กระป๋อง', '1/2 can') },
    { id: 'shrimp_paste_shrimp', name: t('กุ้งแห้งตัวเล็ก', 'Small dried shrimp'), mgPerServing: 220, serving: t('2 ช้อนโต๊ะ', '2 tbsp') },
    { id: 'soy_milk_fortified', name: t('นมถั่วเหลืองเสริมแคลเซียม', 'Calcium-fortified soy milk'), mgPerServing: 300, serving: t('1 กล่อง (250 มล.)', '1 carton (250ml)') },
    { id: 'almonds', name: t('อัลมอนด์', 'Almonds'), mgPerServing: 75, serving: t('1/4 ถ้วย', '1/4 cup') },
    { id: 'egg', name: t('ไข่', 'Egg'), mgPerServing: 25, serving: t('1 ฟอง', '1 egg') }
  ];

  function calciumTargetMg(age, sex) {
    if (sex === 'female' && age >= 50) return 1200;
    if (sex === 'male' && age >= 70) return 1200;
    return 1000;
  }

  function computeCalciumTotal(selectedFoodIds) {
    selectedFoodIds = selectedFoodIds || [];
    var total = 0;
    selectedFoodIds.forEach(function (id) {
      var food = FOOD_TABLE.filter(function (f) { return f.id === id; })[0];
      if (food) total += food.mgPerServing;
    });
    return total;
  }

  var WEEKLY_TARGETS = {
    balanceSessionsPerWeek: 3,
    strengthSessionsPerWeek: 2,
    walkingMinutesMostDays: 30
  };

  var EXERCISE_LIST = [
    { id: 'sit_to_stand_hold', group: 'balance', name: t('ลุกยืนจากเก้าอี้ (มีที่จับ)', 'Sit-to-stand with support'), levels: [1, 2, 3], requires: ['chair'], avoidIf: [], reps: t('10 ครั้ง x 2 เซต', '10 reps x 2 sets') },
    { id: 'standing_marching', group: 'balance', name: t('ยืนย่ำเท้าอยู่กับที่ (จับพนักเก้าอี้)', 'Standing marching (hold chair back)'), levels: [1, 2, 3], requires: ['chair'], avoidIf: [], reps: t('20 ครั้ง', '20 reps') },
    { id: 'single_leg_stand_chair', group: 'balance', name: t('ยืนขาเดียว (เก้าอี้อยู่ใกล้)', 'Single-leg stance (chair nearby)'), levels: [2, 3], requires: ['chair'], avoidIf: [], reps: t('10 วินาที x 3 ครั้ง/ข้าง', '10 sec x 3 each side') },
    { id: 'tandem_stand', group: 'balance', name: t('ยืนเท้าเรียงชิด (ส้นชิดปลายเท้า)', 'Tandem stance (heel-to-toe)'), levels: [2, 3], requires: ['wall'], avoidIf: [], reps: t('10 วินาที x 3 ครั้ง', '10 sec x 3') },
    { id: 'tandem_walk', group: 'balance', name: t('เดินเท้าเรียงชิด', 'Tandem walk'), levels: [3], requires: [], avoidIf: [], reps: t('10 ก้าว x 2 เที่ยว', '10 steps x 2 passes') },
    { id: 'backward_walk', group: 'balance', name: t('เดินถอยหลัง', 'Backward walk'), levels: [3], requires: [], avoidIf: [], reps: t('10 ก้าว x 2 เที่ยว', '10 steps x 2 passes') },
    { id: 'weight_shifts', group: 'balance', name: t('โยกน้ำหนักตัวซ้าย-ขวา (จับเก้าอี้)', 'Side-to-side weight shifts (hold chair)'), levels: [1, 2, 3], requires: ['chair'], avoidIf: [], reps: t('10 ครั้ง/ข้าง', '10 reps each side') },

    { id: 'sit_to_stand', group: 'strength', name: t('ลุกนั่งเก้าอี้', 'Sit-to-stand'), levels: [1, 2, 3], requires: ['chair'], avoidIf: [], reps: t('10 ครั้ง x 2 เซต', '10 reps x 2 sets') },
    { id: 'heel_raises', group: 'strength', name: t('เขย่งปลายเท้า', 'Heel raises'), levels: [1, 2, 3], requires: ['chair'], avoidIf: [], reps: t('15 ครั้ง x 2 เซต', '15 reps x 2 sets') },
    { id: 'wall_pushups', group: 'strength', name: t('วิดพื้นกำแพง', 'Wall push-ups'), levels: [1, 2, 3], requires: ['wall'], avoidIf: [], reps: t('10 ครั้ง x 2 เซต', '10 reps x 2 sets') },
    { id: 'hip_abduction', group: 'strength', name: t('ยกขาออกด้านข้าง', 'Standing hip abduction'), levels: [1, 2, 3], requires: ['chair'], avoidIf: [], reps: t('10 ครั้ง/ข้าง x 2 เซต', '10 reps/side x 2 sets') },
    { id: 'step_ups', group: 'strength', name: t('ก้าวขึ้นบันไดขั้นเดียว', 'Single-step step-ups'), levels: [2, 3], requires: ['wall'], avoidIf: [], reps: t('8 ครั้ง/ข้าง', '8 reps/side') },

    { id: 'hip_hinge', group: 'posture', name: t('ก้มโดยงอสะโพก (Hip hinge)', 'Hip hinge (bend at hips, not spine)'), levels: [1, 2, 3], requires: [], avoidIf: [], reps: t('10 ครั้ง', '10 reps') },
    { id: 'chin_tuck', group: 'posture', name: t('เก็บคาง', 'Chin tuck'), levels: [1, 2, 3], requires: [], avoidIf: [], reps: t('10 ครั้ง x 2 เซต', '10 reps x 2 sets') },
    { id: 'scapular_squeeze', group: 'posture', name: t('หนีบสะบัก', 'Scapular squeeze'), levels: [1, 2, 3], requires: [], avoidIf: [], reps: t('10 ครั้ง x 2 เซต', '10 reps x 2 sets') },
    { id: 'safe_pickup', group: 'posture', name: t('วิธีหยิบของจากพื้นอย่างปลอดภัย', 'How to pick things up safely'), levels: [1, 2, 3], requires: [], avoidIf: [], reps: t('ฝึก 5 ครั้ง', 'Practice 5 times') },
    { id: 'seated_row_band', group: 'posture', name: t('ดึงยางยืดหลังตรง', 'Seated resistance-band row'), levels: [2, 3], requires: ['chair'], avoidIf: ['vertebralFracture'], reps: t('10 ครั้ง x 2 เซต', '10 reps x 2 sets') }
  ];

  function getExercisesForPatient(level, avoidTags) {
    avoidTags = avoidTags || [];
    return EXERCISE_LIST.filter(function (ex) {
      var levelOk = ex.levels.indexOf(level) !== -1;
      var avoided = ex.avoidIf.some(function (tag) { return avoidTags.indexOf(tag) !== -1; });
      return levelOk && !avoided;
    });
  }

  var SAFETY_ITEMS = [
    { id: 'bedroom_nightlight', room: 'bedroom', name: t('มีไฟกลางคืนใกล้เตียง', 'Night light near the bed'), priority: 4 },
    { id: 'bedroom_clear_path', room: 'bedroom', name: t('ทางเดินจากเตียงไปห้องน้ำไม่มีสิ่งกีดขวาง', 'Clear path from bed to bathroom'), priority: 5 },
    { id: 'bedroom_phone_reach', room: 'bedroom', name: t('มีโทรศัพท์อยู่ใกล้มือเมื่อนอน', 'Phone within reach at night'), priority: 3 },
    { id: 'bedroom_bed_height', room: 'bedroom', name: t('เตียงสูงพอดี ลุกนั่งง่าย', 'Bed height allows easy sit-to-stand'), priority: 2 },

    { id: 'bathroom_grab_bar', room: 'bathroom', name: t('มีราวจับในห้องน้ำ/ฝักบัว', 'Grab bars in the bathroom/shower'), priority: 5 },
    { id: 'bathroom_nonslip_mat', room: 'bathroom', name: t('มีแผ่นกันลื่นในห้องอาบน้ำ', 'Non-slip mat in the shower'), priority: 5 },
    { id: 'bathroom_raised_toilet', room: 'bathroom', name: t('โถส้วมสูงพอดีหรือมีที่จับ', 'Raised toilet seat or grab bar'), priority: 3 },
    { id: 'bathroom_dry_floor', room: 'bathroom', name: t('พื้นห้องน้ำแห้งไม่มีน้ำขัง', 'Bathroom floor kept dry'), priority: 4 },
    { id: 'bathroom_lighting', room: 'bathroom', name: t('ห้องน้ำมีแสงสว่างเพียงพอ', 'Bathroom well lit'), priority: 3 },

    { id: 'stairs_handrail', room: 'stairs', name: t('มีราวบันไดทั้งสองข้าง', 'Handrails on both sides of stairs'), priority: 5 },
    { id: 'stairs_edge_marking', room: 'stairs', name: t('ขอบขั้นบันไดมีแถบสีเตือน', 'Stair edges marked with contrast tape'), priority: 4 },
    { id: 'stairs_lighting', room: 'stairs', name: t('บันไดมีแสงสว่างเพียงพอ', 'Stairs well lit'), priority: 4 },
    { id: 'stairs_no_clutter', room: 'stairs', name: t('ไม่มีสิ่งของวางบนบันได', 'No clutter left on stairs'), priority: 3 },

    { id: 'kitchen_nonslip_mat', room: 'kitchen', name: t('มีแผ่นกันลื่นหน้าอ่างล้างจาน', 'Non-slip mat by the sink'), priority: 3 },
    { id: 'kitchen_reachable_shelf', room: 'kitchen', name: t('ของใช้บ่อยอยู่ในระดับหยิบง่าย ไม่ต้องปีนเก้าอี้', 'Frequently used items within easy reach — no climbing needed'), priority: 4 },
    { id: 'kitchen_cord_clutter', room: 'kitchen', name: t('ไม่มีสายไฟพาดผ่านทางเดิน', 'No cords crossing walkways'), priority: 3 },
    { id: 'kitchen_spill_clean', room: 'kitchen', name: t('เช็ดน้ำ/คราบมันที่หกทันที', 'Spills wiped up immediately'), priority: 3 },

    { id: 'outdoors_stepedge', room: 'outdoors', name: t('มีการทำเครื่องหมายขอบทางต่างระดับ', 'Uneven steps outside are marked'), priority: 3 },
    { id: 'outdoors_lighting', room: 'outdoors', name: t('ทางเข้าบ้านมีแสงสว่างเพียงพอตอนกลางคืน', 'Entryway well lit at night'), priority: 3 },
    { id: 'outdoors_no_rugs', room: 'outdoors', name: t('ไม่มีพรมหรือของวางกีดขวางทางเดิน', 'No loose rugs or clutter blocking walkways'), priority: 4 }
  ];

  function computeSafetyScore(checkedIds) {
    checkedIds = checkedIds || [];
    var checkedSet = {};
    checkedIds.forEach(function (id) { checkedSet[id] = true; });
    var score = SAFETY_ITEMS.filter(function (item) { return checkedSet[item.id]; }).length;
    var unchecked = SAFETY_ITEMS.filter(function (item) { return !checkedSet[item.id]; });
    unchecked.sort(function (a, b) { return b.priority - a.priority; });
    return {
      score: score,
      max: SAFETY_ITEMS.length,
      priorityFixes: unchecked.slice(0, 3)
    };
  }

  function checkHeightLoss(baselineCm, currentCm) {
    if (typeof baselineCm !== 'number' || typeof currentCm !== 'number') return false;
    return (baselineCm - currentCm) >= 2;
  }

  function computeAdherenceStreak(sortedIsoDates, todayIsoDate) {
    sortedIsoDates = sortedIsoDates || [];
    if (sortedIsoDates.length === 0) return 0;
    var dateSet = {};
    sortedIsoDates.forEach(function (d) { dateSet[d] = true; });
    var cursor = todayIsoDate || formatYMD(new Date());
    var streak = 0;
    while (dateSet[cursor]) {
      streak += 1;
      cursor = addDaysSafe(cursor, -1);
    }
    return streak;
  }

  function generateDeviceUuid() {
    var template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
    return template.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      var v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function isValidUuid(s) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
  }

  function buildRegistrationPayload(fields, token) {
    fields = fields || {};
    var hnUnknown = !fields.hn || !!fields.hnUnknown;
    var patientId = hnUnknown ? (fields.deviceUuid || generateDeviceUuid()) : fields.hn;
    return {
      schemaVersion: SCHEMA_VERSION,
      token: token,
      patientId: patientId,
      hn: hnUnknown ? null : fields.hn,
      hnUnknown: hnUnknown,
      name: fields.name || '',
      phone: fields.phone || '',
      yearOfBirth: fields.yearOfBirth || null,
      sex: fields.sex || null,
      consent: !!fields.consent
    };
  }

  function validateRegistrationPayload(payload) {
    var errors = [];
    if (!payload || typeof payload !== 'object') return { valid: false, errors: ['payload must be an object'] };
    if (!payload.token) errors.push('missing token');
    if (!payload.patientId) errors.push('missing patientId');
    if (!payload.name) errors.push('missing name');
    if (!payload.phone) errors.push('missing phone');
    if (!payload.consent) errors.push('consent must be true');
    if (typeof payload.schemaVersion !== 'number') errors.push('missing schemaVersion');
    return { valid: errors.length === 0, errors: errors };
  }

  function renderResourceCard(link, lang) {
    lang = lang === 'en' ? 'en' : 'th';
    var titleEntry = CONTENT[link.titleKey];
    var descEntry = CONTENT[link.descKey];
    return {
      title: titleEntry ? titleEntry[lang] : '',
      description: descEntry ? descEntry[lang] : ''
    };
  }

  function buildDedupKey(patientId, dateStr, type) {
    return patientId + '_' + dateStr + '_' + type;
  }

  function dedupeRecords(records) {
    var seen = {};
    var result = [];
    records.forEach(function (r) {
      var key = buildDedupKey(r.patientId, r.date, r.type);
      if (!seen[key]) {
        seen[key] = true;
        result.push(r);
      }
    });
    return result;
  }

  var RESOURCE_LINKS = [
    { id: 'topf', titleKey: 'resTopfTitle', descKey: 'resTopfDesc', url: 'https://www.topf.or.th' },
    { id: 'otago', titleKey: 'resOtagoTitle', descKey: 'resOtagoDesc', url: 'https://www.otago.ac.nz' },
    { id: 'steadi', titleKey: 'resSteadiTitle', descKey: 'resSteadiDesc', url: 'https://www.cdc.gov/steadi' },
    { id: 'who_falls', titleKey: 'resWhoTitle', descKey: 'resWhoDesc', url: 'https://www.who.int' }
  ];

  CONTENT.resTopfTitle = t('มูลนิธิโรคกระดูกพรุนแห่งประเทศไทย', 'Thai Osteoporosis Foundation'),
  CONTENT.resTopfDesc = t('แนวทางการดูแลรักษาโรคกระดูกพรุนฉบับภาษาไทย', 'Thai-language osteoporosis clinical practice guideline');
  CONTENT.resOtagoTitle = t('โปรแกรมออกกำลังกาย Otago', 'Otago Exercise Programme');
  CONTENT.resOtagoDesc = t('โปรแกรมออกกำลังกายที่บ้านเพื่อป้องกันการล้มในผู้สูงอายุ', 'Home-based exercise programme for fall prevention in older adults');
  CONTENT.resSteadiTitle = t('แบบคัดกรองความเสี่ยงล้ม STEADI', 'STEADI Fall Risk Screening');
  CONTENT.resSteadiDesc = t('เครื่องมือคัดกรองความเสี่ยงการล้มจาก CDC', 'Fall risk screening tool from the CDC');
  CONTENT.resWhoTitle = t('องค์การอนามัยโลก', 'World Health Organization');
  CONTENT.resWhoDesc = t('ข้อมูลสุขภาพกระดูกและการป้องกันการล้มระดับสากล', 'Global guidance on bone health and fall prevention');

  var RED_FLAGS = [
    { id: 'back_pain', key: 'alertBackPain' },
    { id: 'hip_pain', key: 'alertHipPain' },
    { id: 'head_injury', key: 'alertHeadInjury' },
    { id: 'neuro', key: 'alertNeuro' }
  ];

  var ALERT_CONTACTS = {
    clinicPhone: '02 839 6000',
    emsPhone: '1669'
  };

  var ONBOARDING_QUESTIONS = [
    { id: 'age', field: 'age', type: 'number', labelKey: 'qAge' },
    { id: 'sex', field: 'sex', type: 'choice', labelKey: 'qSex', options: [{ value: 'male', labelKey: 'registerSexMale' }, { value: 'female', labelKey: 'registerSexFemale' }] },
    { id: 'priorFragilityFracture', field: 'priorFragilityFracture', type: 'boolean', labelKey: 'qPriorFracture' },
    { id: 'fractureSite', field: 'fractureSite', type: 'choice', labelKey: 'qFractureSite', dependsOn: { field: 'priorFragilityFracture', value: true }, options: [{ value: 'hip', labelKey: 'siteHip' }, { value: 'spine', labelKey: 'siteSpine' }, { value: 'wrist', labelKey: 'siteWrist' }, { value: 'humerus', labelKey: 'siteHumerus' }] },
    { id: 'tScoreKnown', field: 'tScoreKnown', type: 'boolean', labelKey: 'qTScore' },
    { id: 'tScore', field: 'tScore', type: 'number', labelKey: 'qTScoreValue', dependsOn: { field: 'tScoreKnown', value: true } },
    { id: 'fallsLast12mo', field: 'fallsLast12mo', type: 'number', labelKey: 'qFalls' },
    { id: 'longTermSteroid', field: 'longTermSteroid', type: 'boolean', labelKey: 'qSteroid' },
    { id: 'currentMedClass', field: 'currentMedClass', type: 'choice', labelKey: 'qCurrentMed', options: [{ value: 'none', labelKey: 'none' }].concat(MED_CLASSES.map(function (m) { return { value: m.id, labelKey: null, label: m.name }; })) },
    { id: 'walksWithAid', field: 'walksWithAid', type: 'boolean', labelKey: 'qWalkAid' },
    { id: 'fearOfFalling', field: 'fearOfFalling', type: 'boolean', labelKey: 'qFearFalling' }
  ];

  return {
    SCHEMA_VERSION: SCHEMA_VERSION,
    TIERS: TIERS,
    CONTENT: CONTENT,
    parseYMD: parseYMD,
    formatYMD: formatYMD,
    addDaysSafe: addDaysSafe,
    addMonthsSafe: addMonthsSafe,
    daysBetween: daysBetween,
    resolveTier: resolveTier,
    defaultBalanceLevelForProfile: defaultBalanceLevelForProfile,
    resolveBalanceLevel: resolveBalanceLevel,
    canAdvanceBalanceLevel: canAdvanceBalanceLevel,
    CHAIR_STAND_NORMS: CHAIR_STAND_NORMS,
    meetsChairStandNorm: meetsChairStandNorm,
    TUG_THRESHOLD_SECONDS: TUG_THRESHOLD_SECONDS,
    meetsTUG: meetsTUG,
    MED_CLASSES: MED_CLASSES,
    getMedClass: getMedClass,
    computeNextDue: computeNextDue,
    FOOD_TABLE: FOOD_TABLE,
    calciumTargetMg: calciumTargetMg,
    computeCalciumTotal: computeCalciumTotal,
    WEEKLY_TARGETS: WEEKLY_TARGETS,
    EXERCISE_LIST: EXERCISE_LIST,
    getExercisesForPatient: getExercisesForPatient,
    SAFETY_ITEMS: SAFETY_ITEMS,
    computeSafetyScore: computeSafetyScore,
    checkHeightLoss: checkHeightLoss,
    computeAdherenceStreak: computeAdherenceStreak,
    generateDeviceUuid: generateDeviceUuid,
    isValidUuid: isValidUuid,
    buildRegistrationPayload: buildRegistrationPayload,
    validateRegistrationPayload: validateRegistrationPayload,
    renderResourceCard: renderResourceCard,
    buildDedupKey: buildDedupKey,
    dedupeRecords: dedupeRecords,
    RESOURCE_LINKS: RESOURCE_LINKS,
    RED_FLAGS: RED_FLAGS,
    ALERT_CONTACTS: ALERT_CONTACTS,
    ONBOARDING_QUESTIONS: ONBOARDING_QUESTIONS
  };
});
