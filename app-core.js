(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.OsteoCore = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {

  var SCHEMA_VERSION = 2;

  var TIERS = { A: 'A', B: 'B', C: 'C' };

  function t(th, en) { return { th: th, en: en }; }

  var CONTENT = {
    appName: t('ดูแลกระดูกพรุน', 'Osteoporosis Care'),
    appNameShort: t('ดูแลกระดูกพรุน', 'Osteoporosis Care'),

    langToggleTh: t('ไทย', 'Thai'),
    langToggleEn: t('อังกฤษ', 'English'),

    navHome: t('หน้าหลัก', 'Home'),
    navDrug: t('ยา', 'Medicine'),
    navBone: t('อาหาร', 'Food'),
    navMove: t('ออกกำลัง', 'Move'),
    navSafety: t('กันล้ม', 'Safety'),
    navTrack: t('ติดตาม', 'Track'),
    navAlert: t('ฉุกเฉิน', 'Urgent'),
    tabTitleBone: t('อาหารเพื่อกระดูก', 'Nutrition for Bone'),
    tabTitleMove: t('ออกกำลังกาย', 'Exercise'),
    tabTitleSafety: t('ป้องกันการล้ม', 'Fall Prevention'),

    a2hsPrompt: t('เพิ่มแอปนี้ไว้ที่หน้าจอหลัก เพื่อเปิดใช้ได้สะดวกขึ้น', 'Add this app to your home screen for easier access'),
    a2hsInstall: t('เพิ่มลงหน้าจอหลัก', 'Add to Home Screen'),
    a2hsDismiss: t('ไว้ภายหลัง', 'Not now'),

    pdpaTitle: t('ความยินยอมให้ใช้ข้อมูลส่วนบุคคล (PDPA)', 'Personal Data Consent (PDPA)'),
    pdpaBody: t(
      'ข้อมูลของท่านจะถูกเก็บและใช้เพื่อการดูแลรักษาและติดตามผลในโครงการดูแลกระดูกพรุนเท่านั้น ท่านสามารถขอถอนความยินยอมได้ทุกเมื่อโดยแจ้งที่โรงพยาบาล',
      'Your data is stored and used only for care and follow-up in this osteoporosis programme. You may withdraw your consent at any time by telling the hospital.'
    ),
    pdpaCheckbox: t('ข้าพเจ้ายินยอมให้เก็บและใช้ข้อมูลตามรายละเอียดข้างต้น', 'I consent to my data being collected and used as described above'),

    registerTitle: t('ลงทะเบียนครั้งแรก', 'First-time Registration'),
    registerIntro: t('กรอกข้อมูลเพียง 3 อย่าง เพื่อเริ่มใช้งาน', 'Just three details to get started'),
    registerHN: t('เลขประจำตัวผู้ป่วย (HN)', 'Hospital Number (HN)'),
    registerHNUnknown: t('ไม่ทราบเลข HN', "I don't know my HN"),
    registerYearOfBirth: t('ปีเกิด (พ.ศ. หรือ ค.ศ.)', 'Year of birth'),
    registerYearHint: t('เช่น 2495 หรือ 1952', 'e.g. 2495 (BE) or 1952 (CE)'),
    registerSex: t('เพศ', 'Sex'),
    registerSexMale: t('ชาย', 'Male'),
    registerSexFemale: t('หญิง', 'Female'),
    registerSubmit: t('เริ่มใช้งาน', 'Start'),
    registerAgeComputed: t('อายุของท่าน', 'Your age'),
    registerYearInvalid: t('กรุณากรอกปีเกิดให้ถูกต้อง', 'Please enter a valid year of birth'),
    registerHNRequired: t('กรุณากรอกเลข HN หรือเลือก "ไม่ทราบเลข HN"', 'Please enter your HN or tick "I don\'t know my HN"'),
    registerSexRequired: t('กรุณาเลือกเพศ', 'Please choose your sex'),
    registerConsentRequired: t('กรุณายอมรับความยินยอมก่อนเริ่มใช้งาน', 'Please accept the consent before starting'),
    yearsOld: t('ปี', 'years'),

    onboardingTitle: t('ประเมินความเสี่ยงกระดูกหัก', 'Fracture Risk Assessment'),
    onboardingIntro: t('ตอบคำถามสั้น ๆ เพื่อให้แอปแนะนำการดูแลที่เหมาะกับท่าน', 'A few short questions so the app can tailor your care'),
    onboardingNext: t('ถัดไป', 'Next'),
    onboardingBack: t('ย้อนกลับ', 'Back'),
    onboardingFinish: t('เริ่มใช้งาน', 'Continue'),
    onboardingProgress: t('ข้อที่', 'Question'),
    qPriorFracture: t('ท่านเคยกระดูกหักจากการล้มหรือกระแทกเบา ๆ หรือไม่', 'Have you ever broken a bone from a minor fall or bump?'),
    qFractureSite: t('กระดูกส่วนใดที่หัก', 'Which bone was broken?'),
    siteHip: t('สะโพก', 'Hip'),
    siteSpine: t('กระดูกสันหลัง', 'Spine'),
    siteWrist: t('ข้อมือ', 'Wrist'),
    siteHumerus: t('ต้นแขน', 'Upper arm'),
    siteOther: t('อื่น ๆ', 'Others'),
    qTScoreKnown: t('ท่านทราบผลตรวจความหนาแน่นกระดูก (DXA) หรือไม่', 'Do you know your bone density (DXA) result?'),
    qTScoreValue: t('ค่า T-score ที่ต่ำที่สุดคือเท่าไร', 'What is your lowest T-score?'),
    qFalls: t('ในช่วง 12 เดือนที่ผ่านมา ท่านล้มกี่ครั้ง', 'How many times have you fallen in the past 12 months?'),
    qSteroid: t('ท่านใช้ยาสเตียรอยด์ต่อเนื่องนานกว่า 3 เดือนหรือไม่', 'Have you taken steroid medication continuously for more than 3 months?'),
    qCurrentMed: t('ขณะนี้ท่านใช้ยารักษากระดูกพรุนชนิดใด', 'Which osteoporosis medication are you taking now?'),
    qWalkAid: t('ท่านใช้อุปกรณ์ช่วยเดินหรือไม่ (ไม้เท้า, วอล์คเกอร์)', 'Do you use a walking aid (cane, walker)?'),
    qFearFalling: t('ท่านกลัวการล้มจนต้องเลี่ยงกิจกรรมบางอย่างหรือไม่', 'Does fear of falling make you avoid some activities?'),
    yes: t('ใช่', 'Yes'),
    no: t('ไม่ใช่', 'No'),
    notSure: t('ไม่ทราบ', 'Not sure'),
    none: t('ไม่ได้ใช้ยา', 'Not taking any'),

    tierResultTitle: t('ผลการประเมินของท่าน', 'Your assessment'),
    tierA_name: t('ดูแลกระดูก', 'Bone Health'),
    tierA_desc: t('กระดูกของท่านเริ่มบางหรือมีปัจจัยเสี่ยง แต่ยังไม่เคยกระดูกหักและไม่ล้มใน 12 เดือนที่ผ่านมา เป้าหมายคือสร้างนิสัยดูแลกระดูกและป้องกันการล้ม', 'Your bones are thinning or you have risk factors, but you have not had a fracture or a fall in the past 12 months. The goal is to build bone-healthy habits and prevent falls.'),
    tierB_name: t('เสี่ยงกระดูกหักสูง', 'High Fracture Risk'),
    tierB_desc: t('ท่านมีความเสี่ยงกระดูกหักสูง จากผลตรวจ DXA การใช้ยาสเตียรอยด์ ประวัติล้ม หรืออายุ เป้าหมายคือใช้ยาสม่ำเสมอและป้องกันการล้มอย่างจริงจัง', 'You are at high risk of fracture because of your DXA result, steroid use, a fall, or your age. The goal is consistent medication and serious fall prevention.'),
    tierC_name: t('เคยกระดูกหักแล้ว', 'Post-Fracture'),
    tierC_desc: t('ท่านเคยกระดูกหักจากอุบัติเหตุเล็กน้อยมาก่อน ซึ่งเพิ่มโอกาสหักซ้ำ เป้าหมายคือเคลื่อนไหวอย่างปลอดภัยและป้องกันการหักครั้งต่อไป', 'You have already had a fracture from a minor injury, which raises the chance of another. The goal is safe movement and preventing the next fracture.'),
    tierLabel: t('ระดับการดูแล', 'Care level'),

    balanceLevel1: t('ระดับ 1 — จับที่ยึดตลอด', 'Level 1 — Always supported'),
    balanceLevel2: t('ระดับ 2 — แตะที่ยึดเบา ๆ', 'Level 2 — Light support'),
    balanceLevel3: t('ระดับ 3 — ทำได้เอง', 'Level 3 — Independent'),
    balanceLevelLabel: t('ระดับการทรงตัว', 'Balance level'),

    homeGreeting: t('สวัสดีค่ะ', 'Hello'),
    homeTodayTitle: t('วันนี้', 'Today'),
    homeMedDue: t('ยาของท่าน', 'Your medication'),
    homeMedNone: t('ยังไม่ได้บันทึกยา แตะเพื่อเพิ่ม', 'No medication recorded yet — tap to add'),
    homeMedDueToday: t('ถึงกำหนดวันนี้', 'Due today'),
    homeMedOverdue: t('เลยกำหนดแล้ว', 'Overdue'),
    homeMedUpcoming: t('ครั้งถัดไป', 'Next dose'),
    homeMedTakenToday: t('บันทึกแล้ววันนี้', 'Recorded today'),
    homeSafetyTip: t('เคล็ดลับความปลอดภัยวันนี้', "Today's safety tip"),
    homeCheckinDue: t('ถึงเวลาเช็คอินประจำเดือน', 'Your monthly check-in is due'),
    homeCheckinStart: t('เริ่มเช็คอิน', 'Start check-in'),
    homeNutritionDue: t('ถึงเวลาประเมินอาหารประจำปี', 'Your yearly nutrition review is due'),
    homeLearnMore: t('ความรู้เพิ่มเติม', 'Learn more'),
    homeMarkDone: t('บันทึกแล้ว', 'Done'),
    homeQuickLinks: t('ทางลัด', 'Quick links'),

    boneWhatIsTitle: t('โรคกระดูกพรุนคืออะไร', 'What is osteoporosis?'),
    boneWhatIsBody: t(
      'กระดูกพรุนคือภาวะที่เนื้อกระดูกบางลงและเปราะ ทำให้หักได้ง่ายแม้ล้มเบา ๆ มักไม่มีอาการจนกระทั่งกระดูกหัก การได้รับแคลเซียม วิตามินดี โปรตีนที่เพียงพอ ร่วมกับการใช้ยาและออกกำลังกายอย่างเหมาะสม ช่วยลดโอกาสกระดูกหักได้',
      'Osteoporosis means the bone becomes thin and fragile, so it can break even from a light fall. It usually causes no symptoms until a fracture happens. Enough calcium, vitamin D and protein, together with the right medication and exercise, lowers the chance of fracture.'
    ),
    boneNutritionTitle: t('ประเมินอาหารประจำปี', 'Yearly Nutrition Review'),
    boneNutritionIntro: t('ประเมินปีละครั้ง เพื่อคำนวณว่าท่านควรได้รับอาหารเสริมเท่าไร', 'Done once a year to work out how much supplement you need'),
    nutritionLastDone: t('ประเมินครั้งล่าสุด', 'Last reviewed'),
    nutritionNextDue: t('ครั้งถัดไป', 'Next review'),
    nutritionStart: t('เริ่มประเมิน', 'Start review'),
    nutritionRedo: t('ประเมินใหม่', 'Review again'),
    nutritionNeverDone: t('ยังไม่เคยประเมิน', 'Not yet reviewed'),
    nutritionSectionCalcium: t('แคลเซียม', 'Calcium'),
    nutritionSectionVitD: t('วิตามินดี', 'Vitamin D'),
    nutritionSectionProtein: t('โปรตีน', 'Protein'),
    nutritionFoodFrequencyIntro: t('ในหนึ่งสัปดาห์ ท่านทานอาหารต่อไปนี้กี่ครั้ง', 'In a typical week, how many servings of each do you eat?'),
    nutritionServingsPerWeek: t('ครั้ง/สัปดาห์', 'servings/week'),
    nutritionServingsPerDay: t('ครั้ง/วัน', 'servings/day'),
    nutritionWeightQuestion: t('น้ำหนักตัวของท่าน (กิโลกรัม)', 'Your body weight (kg)'),
    nutritionSunQuestion: t('ในหนึ่งสัปดาห์ ท่านโดนแดดที่แขนหรือขา (ไม่ทาครีมกันแดด) รวมกี่นาที', 'In a week, how many minutes of sun reaches your arms or legs (without sunscreen)?'),
    nutritionResultTitle: t('ผลการประเมินอาหาร', 'Your nutrition result'),
    nutritionEstimatedIntake: t('ได้รับจากอาหารประมาณ', 'Estimated from food'),
    nutritionTarget: t('เป้าหมายต่อวัน', 'Daily target'),
    nutritionGap: t('ยังขาดอยู่ประมาณ', 'Estimated shortfall'),
    nutritionSupplementAdvice: t('คำแนะนำอาหารเสริม', 'Supplement suggestion'),
    nutritionEnough: t('ท่านได้รับเพียงพอจากอาหารแล้ว ไม่จำเป็นต้องเสริมเพิ่ม', 'You are getting enough from food — no extra supplement needed'),
    nutritionConfirmDoctor: t('ตัวเลขนี้เป็นเพียงการประมาณ กรุณายืนยันขนาดยาที่เหมาะสมกับแพทย์ของท่าน', 'These figures are an estimate — please confirm the right dose with your doctor'),
    nutritionCalciumSupplementUnit: t('มก. ต่อวัน (คิดเป็นแคลเซียมธาตุ)', 'mg per day (as elemental calcium)'),
    nutritionVitDSupplementUnit: t('IU ต่อวัน', 'IU per day'),
    nutritionProteinGap: t('กรัมต่อวัน', 'grams per day'),
    nutritionProteinIdea: t('เพิ่มได้ง่าย ๆ เช่น', 'Easy ways to add this'),
    nutritionSunLow: t('ท่านโดนแดดน้อย จึงควรได้วิตามินดีเสริม', 'You get little sun, so a vitamin D supplement is advised'),
    nutritionSunOk: t('ท่านโดนแดดพอสมควร', 'You get a reasonable amount of sun'),
    calciumMgUnit: t('มก.', 'mg'),
    iuUnit: t('IU', 'IU'),
    gramUnit: t('กรัม', 'g'),
    minutesUnit: t('นาที', 'minutes'),
    kgUnit: t('กก.', 'kg'),

    avoidTitle: t('สิ่งที่ควรลด', 'Things to cut down'),
    avoidBody: t('ลดอาหารเค็มจัด ลดกาแฟเหลือไม่เกินวันละ 2 แก้ว จำกัดแอลกอฮอล์ และงดสูบบุหรี่ เพราะทั้งหมดนี้เร่งการสูญเสียมวลกระดูก', 'Cut down on very salty food, keep coffee to no more than 2 cups a day, limit alcohol and stop smoking — all of these speed up bone loss.'),

    drugTitle: t('ยารักษากระดูกพรุนของฉัน', 'My Osteoporosis Medication'),
    drugNoneTitle: t('ยังไม่ได้เลือกยา', 'No medication selected yet'),
    drugPickClass: t('เลือกยาที่ท่านใช้อยู่', 'Select the medication you are taking'),
    drugStartDate: t('วันที่เริ่มยา หรือวันที่ได้รับครั้งล่าสุด', 'Start date, or date of your most recent dose'),
    drugSave: t('บันทึกยา', 'Save medication'),
    drugChange: t('เปลี่ยนยา', 'Change medication'),
    drugNextDue: t('ครั้งถัดไป', 'Next dose due'),
    drugMarkTaken: t('บันทึกว่าได้รับยาแล้ว', 'Record dose taken'),
    drugAddCalendar: t('เพิ่มลงปฏิทินโทรศัพท์', 'Add to phone calendar'),
    drugWhatItDoes: t('ยานี้ช่วยอย่างไร', 'What this medicine does'),
    drugHowToTake: t('วิธีใช้ยาให้ถูกต้อง', 'How to take it correctly'),
    drugMissedDose: t('ถ้าลืมหรือพลาดนัด', 'If you miss a dose'),
    drugSideEffects: t('อาการที่พบได้และวิธีดูแล', 'Possible effects and what to do'),
    drugDentalNote: t('เรื่องฟันที่ต้องระวัง', 'Important dental note'),
    drugTellDoctor: t('ต้องแจ้งแพทย์เมื่อ', 'Tell your doctor if'),
    drugDoNotStop: t('ห้ามหยุดยาเอง', 'Do not stop on your own'),
    drugAdherenceLog: t('ประวัติการได้รับยา', 'Dose history'),
    drugAdherenceEmpty: t('ยังไม่มีประวัติ', 'No doses recorded yet'),
    drugSupplementNote: t('แคลเซียมและวิตามินดีเป็นอาหารเสริม ไม่ใช่ยารักษากระดูกพรุน ดูขนาดที่ท่านควรได้ที่แท็บอาหาร', 'Calcium and vitamin D are supplements, not osteoporosis treatment — see the Nutrition tab for your recommended amounts'),

    moveIntro: t('ท่าออกกำลังกายเหล่านี้คัดมาให้เหมาะกับระดับการทรงตัวของท่าน ทำช้า ๆ และหยุดทันทีหากเจ็บหรือเวียนศีรษะ', 'These exercises are matched to your balance level. Go slowly, and stop at once if you feel pain or dizziness.'),
    moveGroupBalance: t('ฝึกการทรงตัว', 'Balance'),
    moveGroupStrength: t('ฝึกความแข็งแรง', 'Strength'),
    moveGroupPosture: t('ท่าทางและถนอมหลัง', 'Posture & Spine Care'),
    moveHowOften: t('ความถี่ที่แนะนำ', 'How often'),
    moveBalanceFrequency: t('สัปดาห์ละ 3 วัน', '3 days a week'),
    moveStrengthFrequency: t('สัปดาห์ละ 2 วัน', '2 days a week'),
    movePostureFrequency: t('ทำได้ทุกวัน', 'Every day'),
    moveWalking: t('เดินเร็วพอควรวันละ 30 นาที เกือบทุกวัน', 'Brisk walking 30 minutes on most days'),
    moveHowTo: t('วิธีทำ', 'How to do it'),
    moveNeverDo: t('ท่าที่ต้องหลีกเลี่ยง', 'Movements to avoid'),
    moveNeverDoBody: t('หลีกเลี่ยงท่าซิทอัพ ท่าก้มแตะปลายเท้าโดยขาตรง การบิดตัวแรง ๆ และการยกของหนักโดยก้มหลัง เพราะเพิ่มแรงกดที่กระดูกสันหลัง', 'Avoid sit-ups, straight-leg toe touches, forceful twisting and lifting heavy things with a bent back — these load the spine.'),
    exerciseRequires: t('สิ่งที่ต้องเตรียม', 'You will need'),
    exerciseAmount: t('จำนวน', 'Amount'),
    reqChair: t('เก้าอี้มั่นคง', 'A sturdy chair'),
    reqWall: t('กำแพงหรือราวจับ', 'A wall or rail'),
    reqBand: t('ยางยืด', 'Resistance band'),
    reqNone: t('ไม่ต้องใช้อุปกรณ์', 'No equipment'),

    safetyAuditTitle: t('ตรวจความปลอดภัยในบ้าน', 'Home Safety Check'),
    safetyIntro: t('แตะรายการที่บ้านของท่านทำได้แล้ว รายการที่ยังไม่ได้ทำจะถูกเน้นไว้ให้แก้ไข', 'Tap what your home already has. Anything still missing stays highlighted for you to fix.'),
    safetyScoreLabel: t('คะแนนความปลอดภัย', 'Safety score'),
    safetyDone: t('ทำแล้ว', 'Done'),
    safetyTodo: t('ยังไม่ได้ทำ', 'Not yet'),
    safetyPriorityTitle: t('ควรแก้ไข 3 อย่างนี้ก่อน', 'Fix these three first'),
    safetyAllDone: t('เยี่ยมมาก บ้านของท่านผ่านครบทุกข้อ', 'Excellent — your home passes every item'),
    safetyRoomBedroom: t('ห้องนอน', 'Bedroom'),
    safetyRoomBathroom: t('ห้องน้ำ', 'Bathroom'),
    safetyRoomStairs: t('บันได', 'Stairs'),
    safetyRoomKitchen: t('ห้องครัว', 'Kitchen'),
    safetyRoomOutdoors: t('รอบบ้าน', 'Around the house'),
    footwearTitle: t('รองเท้า', 'Footwear'),
    footwearBody: t('ใส่รองเท้าหุ้มส้น พื้นยางกันลื่น ขนาดพอดีเท้า ไม่ใส่รองเท้าแตะหลวม ๆ หรือเดินเท้าเปล่า/ใส่ถุงเท้าบนพื้นลื่น', 'Wear closed-heel shoes with non-slip soles that fit well. Avoid loose sandals, and never walk on slippery floors in socks or bare feet.'),
    visionTitle: t('สายตา', 'Vision'),
    visionBody: t('ตรวจสายตาอย่างน้อยปีละครั้ง และถ้าใช้แว่นหลายระยะ ควรระวังเป็นพิเศษเวลาเดินลงบันได', 'Have your eyes checked at least once a year. If you wear multifocal glasses, take extra care on stairs.'),
    fallRiskMedsTitle: t('ยาที่อาจทำให้ล้มง่าย', 'Medicines that can make you fall'),
    fallRiskMedsBody: t('ยานอนหลับ ยาคลายกังวล ยาลดความดันบางชนิด ยาแก้แพ้ และแอลกอฮอล์ อาจทำให้ง่วงหรือหน้ามืด นำยาทั้งหมดที่ใช้ไปให้แพทย์ทบทวนปีละครั้ง', 'Sleeping pills, anti-anxiety medicines, some blood pressure pills, antihistamines and alcohol can cause drowsiness or dizziness. Bring all your medicines for your doctor to review once a year.'),
    gettingUpTitle: t('ถ้าล้มแล้วลุกไม่ขึ้น ทำอย่างไร', 'If you fall and cannot get up'),
    gettingUpBody: t('ตั้งสติ อย่ารีบลุก พลิกตัวตะแคงแล้วคลานไปหาเก้าอี้หรือเฟอร์นิเจอร์ที่มั่นคง คุกเข่าข้างหนึ่งแล้วค่อย ๆ ดันตัวขึ้นนั่ง หากลุกไม่ไหวให้ใช้โทรศัพท์ขอความช่วยเหลือและรักษาความอบอุ่นไว้', 'Stay calm and do not rush. Roll onto your side, crawl to a sturdy chair or furniture, kneel on one knee and push yourself up to sit. If you cannot get up, use your phone to call for help and keep yourself warm.'),
    reauditReminder: t('ควรตรวจซ้ำทุก 6 เดือน', 'Re-check every 6 months'),
    safetyLastChecked: t('ตรวจครั้งล่าสุด', 'Last checked'),
    safetySave: t('บันทึกผลการตรวจ', 'Save this check'),

    trackTitle: t('ติดตามผล', 'Your Progress'),
    trackNoData: t('ยังไม่มีข้อมูลพอที่จะแสดงกราฟ บันทึกอย่างน้อย 2 ครั้งเพื่อดูแนวโน้ม', 'Not enough data for a graph yet — record at least twice to see a trend'),
    trackLatest: t('ล่าสุด', 'Latest'),
    fallsLogTitle: t('บันทึกการล้ม', 'Falls'),
    fallsChartTitle: t('จำนวนครั้งที่ล้มในแต่ละเดือน', 'Falls per month'),
    fallsLogAdd: t('บันทึกการล้ม', 'Record a fall'),
    fallsLogDate: t('วันที่ล้ม', 'Date of the fall'),
    fallsLogInjured: t('บาดเจ็บหรือไม่', 'Were you injured?'),
    fallsLogCause: t('เกิดจากอะไร (ถ้าจำได้)', 'What caused it (if you remember)'),
    fallsNone: t('ยังไม่มีบันทึกการล้ม ดีมาก', 'No falls recorded — well done'),
    fallsInjured: t('บาดเจ็บ', 'Injured'),
    fallsNotInjured: t('ไม่บาดเจ็บ', 'Not injured'),
    heightTitle: t('ส่วนสูง', 'Height'),
    heightChartTitle: t('ส่วนสูงที่เปลี่ยนไป', 'Height over time'),
    heightBaseline: t('ส่วนสูงเริ่มต้น', 'Starting height'),
    heightCurrent: t('วัดส่วนสูงวันนี้ (ซม.)', "Today's height (cm)"),
    heightEvery6Months: t('วัดทุก 6 เดือน', 'Measure every 6 months'),
    heightLossWarning: t('ส่วนสูงลดลงตั้งแต่ 2 ซม. ขึ้นไป ควรแจ้งแพทย์เพราะอาจมีกระดูกสันหลังยุบ', 'Your height has dropped 2 cm or more — tell your doctor, as this can mean a spinal fracture'),
    heightLossOk: t('ส่วนสูงยังคงที่ดี', 'Your height is holding steady'),
    selfTestTitle: t('ทดสอบความแข็งแรงด้วยตนเอง', 'Self-Tests'),
    selfTestSafety: t('ความปลอดภัยก่อนทดสอบ: ต้องมีคนอยู่ด้วยเสมอ วางเก้าอี้ชิดกำแพง และหยุดทันทีหากเวียนศีรษะหรือเจ็บ', 'Safety first: always have someone with you, place the chair against a wall, and stop at once if you feel dizzy or sore.'),
    chairStandTitle: t('ลุก-นั่งเก้าอี้ 30 วินาที', '30-Second Chair Stand'),
    chairStandChartTitle: t('จำนวนครั้งที่ลุกได้ใน 30 วินาที', 'Chair stands in 30 seconds'),
    chairStandInstructions: t('นั่งกลางเก้าอี้ กอดอกไว้ ลุกขึ้นยืนให้สุดแล้วนั่งลง ทำซ้ำให้ได้มากที่สุดใน 30 วินาที', 'Sit in the middle of the chair with arms crossed. Stand up fully, then sit back down, as many times as you can in 30 seconds.'),
    chairStandNormLabel: t('เกณฑ์ตามอายุและเพศของท่าน', 'Your age and sex norm'),
    chairStandPass: t('ผ่านเกณฑ์', 'Meets the norm'),
    chairStandBelow: t('ต่ำกว่าเกณฑ์ ควรฝึกท่าลุก-นั่งเพิ่ม', 'Below the norm — practise sit-to-stand more'),
    tugTitle: t('ลุกเดินจับเวลา (TUG)', 'Timed Up and Go (TUG)'),
    tugChartTitle: t('เวลาที่ใช้ในการลุกเดิน (วินาที)', 'Timed Up and Go (seconds)'),
    tugInstructions: t('ลุกจากเก้าอี้ เดินไปข้างหน้า 3 เมตร เลี้ยวกลับ เดินกลับมานั่ง จับเวลาตั้งแต่เริ่มลุกจนนั่งลง', 'Stand up from the chair, walk 3 metres, turn around, walk back and sit down. Time it from standing to sitting.'),
    tugPass: t('อยู่ในเกณฑ์ปกติ', 'Within the normal range'),
    tugSlow: t('ใช้เวลา 12 วินาทีขึ้นไป บ่งชี้ความเสี่ยงล้มสูงขึ้น ควรปรึกษาแพทย์', '12 seconds or more suggests a higher fall risk — discuss with your doctor'),
    startTimer: t('เริ่มจับเวลา', 'Start'),
    stopTimer: t('หยุด', 'Stop'),
    recordResult: t('บันทึกผล', 'Save result'),
    seconds: t('วินาที', 'seconds'),
    reps: t('ครั้ง', 'times'),
    adherenceTitle: t('ความสม่ำเสมอในการใช้ยา', 'Medication adherence'),
    adherenceChartTitle: t('จำนวนครั้งที่ได้รับยาในแต่ละเดือน', 'Doses recorded per month'),
    adherenceStreak: t('ต่อเนื่อง', 'Streak'),
    days: t('วัน', 'days'),
    dxaTitle: t('การตรวจความหนาแน่นกระดูก (DXA)', 'Bone Density Scan (DXA)'),
    dxaLastDate: t('ตรวจครั้งล่าสุด', 'Last scan'),
    dxaNextDue: t('ควรตรวจครั้งถัดไปประมาณ', 'Next scan due around'),
    dxaNote: t('โดยทั่วไปตรวจซ้ำทุก 1-2 ปี ตามที่แพทย์กำหนด', 'Usually repeated every 1-2 years, as your doctor advises'),

    monthlyCheckinTitle: t('เช็คอินประจำเดือน', 'Monthly Check-in'),
    checkinIntro: t('ใช้เวลาประมาณ 1 นาที เพื่อบันทึกสิ่งสำคัญของเดือนนี้', 'About one minute to record what matters this month'),
    checkinStepFalls: t('เดือนนี้ท่านล้มหรือไม่', 'Have you fallen this month?'),
    checkinStepFallsHelp: t('นับรวมทุกครั้งที่เสียหลักจนล้มลงกับพื้น แม้ไม่บาดเจ็บ', 'Count every time you ended up on the ground, even without injury'),
    checkinStepMed: t('เดือนนี้ท่านใช้ยาได้ครบตามกำหนดหรือไม่', 'Did you take your medication as scheduled this month?'),
    checkinStepMedMissed: t('มีบางครั้งที่ลืม', 'I missed some doses'),
    checkinStepMedOk: t('ครบตามกำหนด', 'Yes, all of them'),
    checkinStepMedNone: t('ยังไม่ได้ใช้ยา', 'I am not on medication'),
    checkinStepHeight: t('ถึงกำหนดวัดส่วนสูงแล้ว', 'It is time to measure your height'),
    checkinStepHeightSkip: t('ยังไม่ได้วัด ขอข้ามไปก่อน', 'Skip for now'),
    checkinStepSelfTest: t('ถึงกำหนดทดสอบความแข็งแรงแล้ว', 'It is time for your self-tests'),
    checkinStepSelfTestGo: t('ไปทำแบบทดสอบ', 'Go to the tests'),
    checkinDone: t('เช็คอินเรียบร้อย', 'Check-in complete'),
    checkinDoneBody: t('บันทึกของเดือนนี้ถูกเก็บไว้แล้ว แล้วพบกันเดือนหน้า', 'This month is recorded. See you next month.'),
    checkinFallLogged: t('บันทึกการล้มแล้ว และปรับระดับการออกกำลังกายให้ปลอดภัยขึ้น', 'The fall is recorded, and your exercise level has been made safer'),
    checkinMissedAdvice: t('การใช้ยาไม่ต่อเนื่องทำให้ยาได้ผลน้อยลง หากมีปัญหาเรื่องการใช้ยา กรุณาแจ้งแพทย์', 'Missed doses make the medicine work less well. Please tell your doctor if you are having trouble taking it.'),
    step: t('ขั้นที่', 'Step'),
    of: t('จาก', 'of'),
    skip: t('ข้าม', 'Skip'),
    finish: t('เสร็จสิ้น', 'Finish'),

    alertTitle: t('เมื่อไรต้องรีบพบแพทย์', 'When to get help urgently'),
    alertIntro: t('หากมีอาการเหล่านี้ อย่ารอ ให้ติดต่อตามคำแนะนำในแต่ละข้อทันที', 'If you have any of these, do not wait — follow the action shown for that item straight away.'),
    alertCallNow: t('โทรฉุกเฉินทันที', 'Call emergency now'),
    alertCallClinicToday: t('ติดต่อโรงพยาบาลวันนี้', 'Contact the hospital today'),
    alertSeverityCritical: t('ฉุกเฉิน', 'Emergency'),
    alertSeveritySerious: t('ด่วน', 'Urgent'),
    alertBackPain: t('ปวดหลังรุนแรงทันทีทันใด โดยเฉพาะหลังล้ม ไอแรง ๆ หรือยกของ', 'Sudden severe back pain, especially after a fall, a hard cough, or lifting'),
    alertBackPainAction: t('อาจเป็นกระดูกสันหลังยุบ ให้นอนพักและติดต่อโรงพยาบาลภายในวันนี้', 'This can be a spinal fracture — rest and contact the hospital today'),
    alertHipPain: t('ปวดสะโพกหรือขาหนีบ ยืนหรือลงน้ำหนักไม่ได้หลังล้ม', 'Hip or groin pain and you cannot stand or bear weight after a fall'),
    alertHipPainAction: t('อาจเป็นกระดูกสะโพกหัก อย่าฝืนลุกเดิน โทร 1669 ทันที', 'This can be a hip fracture — do not try to walk, call 1669 now'),
    alertHeadInjury: t('ศีรษะกระแทก หรือล้มขณะใช้ยาละลายลิ่มเลือด/ยาต้านเกล็ดเลือด', 'A knock to the head, or a fall while on blood thinners'),
    alertHeadInjuryAction: t('เสี่ยงเลือดออกในสมอง โทร 1669 หรือไปห้องฉุกเฉินทันที', 'Risk of bleeding in the brain — call 1669 or go to the emergency room now'),
    alertNeuro: t('ขาชาหรืออ่อนแรง เดินเซผิดปกติ หรือกลั้นปัสสาวะ/อุจจาระไม่ได้', 'Numb or weak legs, unsteady walking, or loss of bladder or bowel control'),
    alertNeuroAction: t('อาจมีการกดทับเส้นประสาทไขสันหลัง โทร 1669 ทันที', 'The spinal nerves may be compressed — call 1669 now'),
    alertCallClinic: t('โทรโรงพยาบาล', 'Call the hospital'),
    alertCallEms: t('โทร 1669 (ฉุกเฉิน)', 'Call 1669 (emergency)'),
    alertAfterFall: t('ท่านเพิ่งบันทึกว่าล้มและบาดเจ็บ กรุณาอ่านรายการด้านล่างและติดต่อตามคำแนะนำ', 'You have just recorded a fall with injury. Please read the list below and follow the action shown.'),

    resourcesTitle: t('ความรู้เรื่องกระดูกพรุน', 'Learn About Osteoporosis'),
    learnWhatIsTitle: t('โรคกระดูกพรุนคืออะไร', 'What is osteoporosis?'),
    learnTScoreTitle: t('ค่า T-score หมายถึงอะไร', 'What does the T-score mean?'),
    learnTScoreBody: t('T-score เปรียบเทียบความหนาแน่นกระดูกของท่านกับคนหนุ่มสาวที่กระดูกปกติ ค่าตั้งแต่ -1 ขึ้นไปถือว่าปกติ ระหว่าง -1 ถึง -2.5 คือกระดูกบาง และ -2.5 หรือต่ำกว่าคือกระดูกพรุน', 'The T-score compares your bone density with that of a healthy young adult. Above -1 is normal, between -1 and -2.5 is thinning bone, and -2.5 or lower is osteoporosis.'),
    learnMedMattersTitle: t('ทำไมการใช้ยาต่อเนื่องจึงสำคัญ', 'Why staying on your medication matters'),
    learnMedMattersBody: t('ยารักษากระดูกพรุนช่วยลดโอกาสกระดูกหักได้อย่างชัดเจน แต่ต้องใช้ต่อเนื่องจึงจะได้ผล การหยุดยาบางชนิดเอง โดยเฉพาะยาฉีดเดโนซูแมบ อาจทำให้กระดูกสันหลังหักหลายระดับได้ จึงต้องปรึกษาแพทย์ก่อนหยุดยาเสมอ', 'Osteoporosis medication clearly lowers the chance of fracture, but only if taken consistently. Stopping some medicines on your own — especially denosumab injections — can lead to several spinal fractures at once, so always talk to your doctor before stopping.'),
    learnExpectTitle: t('ควรคาดหวังผลอย่างไร', 'What to expect'),
    learnExpectBody: t('การดูแลอย่างต่อเนื่องช่วยลดความเสี่ยงล้มและกระดูกหักได้มาก แต่ไม่สามารถรับประกันว่าจะไม่หักเลย และไม่ได้ทำให้กระดูกกลับมาเป็นปกติเหมือนตอนหนุ่มสาว เป้าหมายคือรักษาความแข็งแรงและใช้ชีวิตได้ตามปกติ', 'Consistent care greatly lowers the risk of falls and fractures, but it cannot guarantee you will never break a bone, and it does not return the bone to how it was when you were young. The goal is to keep your strength and keep living normally.'),

    resTopfTitle: t('มูลนิธิโรคกระดูกพรุนแห่งประเทศไทย', 'Thai Osteoporosis Foundation'),
    resTopfDesc: t('แนวทางการดูแลรักษาโรคกระดูกพรุนฉบับภาษาไทย', 'Thai-language guidance on osteoporosis care'),
    resOtagoTitle: t('โปรแกรมออกกำลังกาย Otago', 'Otago Exercise Programme'),
    resOtagoDesc: t('โปรแกรมออกกำลังกายที่บ้านซึ่งมีหลักฐานว่าช่วยลดการล้มในผู้สูงอายุ', 'Home exercise programme with strong evidence for reducing falls in older adults'),
    resSteadiTitle: t('แนวทางประเมินความเสี่ยงล้ม STEADI', 'STEADI Fall Risk Guidance'),
    resSteadiDesc: t('เครื่องมือประเมินและลดความเสี่ยงการล้มจาก CDC', 'Tools from the CDC for checking and reducing fall risk'),
    resWhoTitle: t('องค์การอนามัยโลก', 'World Health Organization'),
    resWhoDesc: t('ข้อมูลสุขภาพกระดูกและการป้องกันการล้มระดับสากล', 'International guidance on bone health and preventing falls'),

    navKnowledge: t('ความรู้', 'Learn'),
    tabTitleKnowledge: t('ความรู้เรื่องกระดูกพรุน', 'Learn About Osteoporosis'),

    reminderTitle: t('ใกล้ถึงกำหนดยาแล้ว', 'Your next dose is coming up'),
    reminderDaysLeft: t('อีก {n} วันถึงกำหนด', '{n} days to go'),
    reminderDueToday: t('ถึงกำหนดวันนี้', 'Due today'),
    reminderOverdue: t('เลยกำหนดมาแล้ว {n} วัน', 'Overdue by {n} days'),
    reminderBody: t('เตรียมนัดหมายหรือเตรียมยาให้พร้อม หากเป็นยาฉีดที่โรงพยาบาล ควรโทรยืนยันนัดล่วงหน้า', 'Get your appointment or your medicine ready. If it is an injection at the hospital, phone ahead to confirm your appointment.'),
    reminderEnableNotifications: t('เปิดแจ้งเตือนบนโทรศัพท์', 'Turn on phone reminders'),
    reminderNotificationsOn: t('เปิดแจ้งเตือนบนโทรศัพท์แล้ว', 'Phone reminders are on'),
    reminderNotificationsBlocked: t('โทรศัพท์ปิดการแจ้งเตือนไว้ ให้ใช้วิธีเพิ่มลงปฏิทินแทน', 'Notifications are blocked on this phone — use the calendar reminder instead'),
    reminderAddCalendar: t('ตั้งเตือนในปฏิทินโทรศัพท์', 'Set a calendar reminder'),
    reminderCalendarNote: t('ปฏิทินจะเตือนล่วงหน้า 7 วัน และเตือนซ้ำในวันนัด', 'Your calendar will remind you 7 days ahead, and again on the day'),
    reminderDismiss: t('รับทราบแล้ว', 'Got it'),
    reminderNotificationBody: t('ถึงกำหนดยารักษากระดูกพรุนของท่านในอีก 1 สัปดาห์', 'Your osteoporosis medication is due in one week'),

    homeCountdownTitle: t('นับถอยหลังถึงยาครั้งถัดไป', 'Countdown to your next dose'),
    homeCountdownDays: t('วัน', 'days'),
    homeCountdownToday: t('วันนี้', 'Today'),
    homeCountdownOverdue: t('เลยกำหนด', 'Overdue'),

    bmdTitle: t('ค่าความหนาแน่นกระดูก (BMD)', 'Bone Density (BMD)'),
    bmdIntro: t('บันทึกค่าจากใบผลตรวจ DXA ทุกครั้งที่ไปตรวจ เพื่อดูแนวโน้มว่ากระดูกดีขึ้นหรือแย่ลง', 'Copy the values from your DXA report at each scan, to see whether your bone is improving or declining.'),
    bmdSpine: t('กระดูกสันหลัง', 'Spine'),
    bmdHip: t('สะโพก', 'Hip'),
    bmdValueLabel: t('ค่า BMD (g/cm²)', 'BMD (g/cm²)'),
    bmdTScoreLabel: t('ค่า T-score', 'T-score'),
    bmdScanDate: t('วันที่ตรวจ', 'Scan date'),
    bmdAdd: t('บันทึกผลตรวจ', 'Save this scan'),
    bmdChartTitle: t('แนวโน้มค่าความหนาแน่นกระดูก', 'Bone density over time'),
    bmdNoData: t('ยังไม่มีผลตรวจที่บันทึกไว้', 'No scan results recorded yet'),
    bmdHigherBetter: t('ค่ายิ่งสูงยิ่งดี', 'Higher is better'),
    bmdLatestScan: t('ผลตรวจล่าสุด', 'Latest scan'),

    chartChangeSince: t('เปลี่ยนแปลงจากครั้งแรก', 'Change since the first record'),
    chartTrendUp: t('เพิ่มขึ้น', 'increased'),
    chartTrendDown: t('ลดลง', 'decreased'),
    chartTrendFlat: t('เท่าเดิม', 'unchanged'),

    syncTitle: t('การส่งข้อมูลให้โรงพยาบาล', 'Sending data to the hospital'),
    syncPending: t('ข้อมูลที่รอส่ง', 'Waiting to send'),
    syncItems: t('รายการ', 'records'),
    syncAllSent: t('ส่งข้อมูลครบแล้ว', 'Everything has been sent'),
    syncLastOk: t('ส่งสำเร็จล่าสุด', 'Last sent successfully'),
    syncLastError: t('ปัญหาล่าสุด', 'Last problem'),
    syncNever: t('ยังไม่เคยส่งสำเร็จ', 'Nothing has been sent yet'),
    syncSendNow: t('ลองส่งเดี๋ยวนี้', 'Try sending now'),
    syncSending: t('กำลังส่ง...', 'Sending...'),

    resetTitle: t('เริ่มกรอกข้อมูลใหม่', 'Start over'),
    resetBody: t('ลบข้อมูลทั้งหมดในเครื่องนี้ แล้วเริ่มลงทะเบียนใหม่ตั้งแต่ต้น ข้อมูลที่ส่งให้โรงพยาบาลแล้วจะยังคงอยู่', 'Erase everything stored on this phone and register again from the start. Data already sent to the hospital is not affected.'),
    resetButton: t('ล้างข้อมูลและเริ่มใหม่', 'Erase and start over'),
    resetConfirmQuestion: t('ยืนยันลบข้อมูลทั้งหมดในเครื่องนี้หรือไม่', 'Erase everything stored on this phone?'),
    resetConfirmYes: t('ใช่ ลบและเริ่มใหม่', 'Yes, erase and start over'),
    resetWarnUnsent: t('ยังมีข้อมูลที่ยังไม่ได้ส่งให้โรงพยาบาล หากลบตอนนี้ข้อมูลนั้นจะหายไป', 'Some records have not reached the hospital yet. Erasing now will lose them.'),

    footerDoctorLabel: t('แพทย์ผู้ดูแล', 'Your doctor'),
    footerHospitalPhone: t('โทรโรงพยาบาล', 'Hospital'),

    save: t('บันทึก', 'Save'),
    cancel: t('ยกเลิก', 'Cancel'),
    close: t('ปิด', 'Close'),
    back: t('ย้อนกลับ', 'Back'),
    edit: t('แก้ไข', 'Edit'),
    offlineNotice: t('ขณะนี้ไม่มีอินเทอร์เน็ต ข้อมูลจะถูกส่งให้อัตโนมัติเมื่อกลับมาออนไลน์', 'You are offline — your data will be sent automatically when you reconnect')
  };

  function parseYMD(s) {
    var parts = String(s).split('-');
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
    return formatYMD(new Date(targetYear, targetMonth, Math.min(d.getDate(), daysInTargetMonth)));
  }

  function daysBetween(dateStrA, dateStrB) {
    return Math.round((parseYMD(dateStrB).getTime() - parseYMD(dateStrA).getTime()) / 86400000);
  }

  var BUDDHIST_ERA_OFFSET = 543;

  function normalizeBirthYear(yearOfBirth) {
    var year = parseInt(yearOfBirth, 10);
    if (isNaN(year)) return null;
    if (year > 2200) return year - BUDDHIST_ERA_OFFSET;
    return year;
  }

  function deriveAge(yearOfBirth, todayYear) {
    var year = normalizeBirthYear(yearOfBirth);
    if (year === null) return null;
    var reference = todayYear || new Date().getFullYear();
    var age = reference - year;
    if (age < 0 || age > 130) return null;
    return age;
  }

  function resolveTier(profile) {
    profile = profile || {};
    if (profile.priorFragilityFracture) return TIERS.C;

    var osteoporosisOnDxa = !!profile.dxaOsteoporosis || (typeof profile.tScore === 'number' && profile.tScore <= -2.5);
    if (osteoporosisOnDxa || profile.longTermSteroid || (profile.fallsLast12mo || 0) >= 1 || (profile.age || 0) >= 75) {
      return TIERS.B;
    }
    return TIERS.A;
  }

  function defaultBalanceLevelForProfile(profile, tier) {
    profile = profile || {};
    if (tier === TIERS.C || profile.walksWithAid || profile.fearOfFalling) return 1;
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

  function chairStandNorm(age, sex) {
    var table = CHAIR_STAND_NORMS[sex === 'male' ? 'male' : 'female'];
    for (var i = 0; i < table.length; i++) {
      if (age >= table[i].minAge && age <= table[i].maxAge) return table[i].minReps;
    }
    return age < 60 ? table[0].minReps : table[table.length - 1].minReps;
  }

  function meetsChairStandNorm(age, sex, reps) {
    return reps >= chairStandNorm(age, sex);
  }

  var TUG_THRESHOLD_SECONDS = 12;
  function meetsTUG(seconds) {
    return typeof seconds === 'number' && seconds < TUG_THRESHOLD_SECONDS;
  }

  var SELF_TEST_FRESH_DAYS = 90;
  var LEVEL_SETTLE_DAYS = 28;

  function canAdvanceBalanceLevel(history) {
    history = history || {};
    var today = history.today || formatYMD(new Date());
    if ((history.fallsLast4Weeks || 0) > 0) return false;
    if (typeof history.age !== 'number' || !history.sex) return false;
    if (typeof history.chairStandReps !== 'number' || !meetsChairStandNorm(history.age, history.sex, history.chairStandReps)) return false;
    if (!meetsTUG(history.tugSeconds)) return false;
    if (!history.lastSelfTestDate || daysBetween(history.lastSelfTestDate, today) > SELF_TEST_FRESH_DAYS) return false;
    if (!history.levelSetDate || daysBetween(history.levelSetDate, today) < LEVEL_SETTLE_DAYS) return false;
    return true;
  }

  function resolveBalanceLevel(profile, history) {
    profile = profile || {};
    history = history || {};
    var tier = history.tier || resolveTier(profile);

    if (!history.currentLevel) return defaultBalanceLevelForProfile(profile, tier);
    if ((history.fallsLast4Weeks || 0) > 0) return Math.max(1, history.currentLevel - 1);
    if (history.currentLevel < 3 && canAdvanceBalanceLevel(history)) return history.currentLevel + 1;
    return history.currentLevel;
  }

  var MED_CLASSES = [
    {
      id: 'bisphosphonate_weekly',
      icon: '💊', cadenceLabel: t('สัปดาห์ละครั้ง', 'Once a week'), route: t('ยาเม็ด รับประทานเอง', 'Tablet, taken at home'),
      name: t('ยาบิสฟอสโฟเนตชนิดรับประทาน (สัปดาห์ละครั้ง)', 'Oral bisphosphonate (once a week)'),
      cadenceType: 'days',
      intervalDays: 7,
      dentalCare: true,
      whatItDoes: t('ชะลอการสลายของเนื้อกระดูก ทำให้กระดูกแข็งแรงขึ้นและลดโอกาสกระดูกหัก', 'Slows down the breakdown of bone, making it stronger and less likely to break.'),
      instructions: t('ทานตอนเช้าขณะท้องว่างทันทีหลังตื่นนอน พร้อมน้ำเปล่า 1 แก้วเต็ม (ห้ามใช้ชา กาแฟ นม หรือน้ำผลไม้) หลังทานยาให้นั่งหรือยืนตัวตรงอย่างน้อย 30 นาที ห้ามนอนราบ และรออย่างน้อย 30 นาทีก่อนทานอาหาร ยาอื่น หรือแคลเซียม', 'Take it first thing in the morning on an empty stomach with a full glass of plain water — not tea, coffee, milk or juice. Stay sitting or standing upright for at least 30 minutes, do not lie down, and wait at least 30 minutes before food, other medicines or calcium.'),
      missedDose: t('หากลืม ให้ทานในเช้าวันถัดไปเพียง 1 เม็ด แล้วกลับไปทานวันเดิมของสัปดาห์ถัดไป ห้ามทาน 2 เม็ดในวันเดียวกัน', 'If you forget, take one tablet the next morning, then go back to your usual day the following week. Never take two tablets on the same day.'),
      sideEffects: t('อาจแสบร้อนกลางอก กลืนลำบาก หรือปวดท้องได้ มักดีขึ้นเมื่อทานยาถูกวิธีและไม่นอนราบหลังทานยา หากแสบมากหรือกลืนเจ็บ ให้แจ้งแพทย์', 'It can cause heartburn, difficulty swallowing or stomach discomfort. This usually improves if you take it correctly and stay upright. Tell your doctor if it burns badly or hurts to swallow.'),
      tellDoctor: t('มีปัญหาโรคไต ระดับแคลเซียมในเลือดต่ำ กำลังจะทำฟันหรือผ่าตัดช่องปาก หรือมีอาการปวดต้นขาด้านนอกเรื้อรัง', 'You have kidney problems or low blood calcium, you are about to have dental work or oral surgery, or you develop lasting pain in the outer thigh.')
    },
    {
      id: 'bisphosphonate_daily',
      icon: '💊', cadenceLabel: t('ทุกวัน', 'Every day'), route: t('ยาเม็ด รับประทานเอง', 'Tablet, taken at home'),
      name: t('ยาบิสฟอสโฟเนตชนิดรับประทาน (ทุกวัน)', 'Oral bisphosphonate (daily)'),
      cadenceType: 'days',
      intervalDays: 1,
      dentalCare: true,
      whatItDoes: t('ชะลอการสลายของเนื้อกระดูก ทำให้กระดูกแข็งแรงขึ้นและลดโอกาสกระดูกหัก', 'Slows down the breakdown of bone, making it stronger and less likely to break.'),
      instructions: t('ทานทุกเช้าขณะท้องว่างทันทีหลังตื่นนอน พร้อมน้ำเปล่า 1 แก้วเต็ม หลังทานยาให้นั่งหรือยืนตัวตรงอย่างน้อย 30 นาที และรออย่างน้อย 30 นาทีก่อนทานอาหารหรือยาอื่น', 'Take it every morning on an empty stomach with a full glass of plain water. Stay upright for at least 30 minutes and wait at least 30 minutes before food or other medicines.'),
      missedDose: t('หากลืม ให้ข้ามมื้อนั้นไปเลย แล้วทานตามปกติในเช้าวันถัดไป ห้ามทาน 2 เม็ดพร้อมกัน', 'If you forget, skip that dose and take the next one as usual the following morning. Never take two tablets together.'),
      sideEffects: t('อาจแสบร้อนกลางอกหรือปวดท้อง มักดีขึ้นเมื่อทานยาถูกวิธี หากแสบมากหรือกลืนเจ็บ ให้แจ้งแพทย์', 'It can cause heartburn or stomach discomfort, which usually improves when taken correctly. Tell your doctor if it burns badly or hurts to swallow.'),
      tellDoctor: t('มีปัญหาโรคไต ระดับแคลเซียมในเลือดต่ำ กำลังจะทำฟัน หรือมีอาการปวดต้นขาด้านนอกเรื้อรัง', 'You have kidney problems or low blood calcium, you are about to have dental work, or you develop lasting pain in the outer thigh.')
    },
    {
      id: 'denosumab',
      icon: '💉', cadenceLabel: t('ทุก 6 เดือน', 'Every 6 months'), route: t('ยาฉีดใต้ผิวหนัง ที่โรงพยาบาล', 'Injection under the skin, at hospital'),
      name: t('ยาฉีดเดโนซูแมบ (ทุก 6 เดือน)', 'Denosumab injection (every 6 months)'),
      cadenceType: 'months',
      intervalMonths: 6,
      doNotDelay: true,
      dentalCare: true,
      whatItDoes: t('ยับยั้งเซลล์ที่สลายกระดูก ช่วยเพิ่มความหนาแน่นกระดูกและลดโอกาสกระดูกหัก', 'Blocks the cells that break down bone, increasing bone density and lowering fracture risk.'),
      instructions: t('พยาบาลหรือแพทย์จะฉีดเข้าใต้ผิวหนังที่โรงพยาบาลทุก 6 เดือน ควรนัดครั้งถัดไปทุกครั้งก่อนกลับบ้าน และควรได้รับแคลเซียมกับวิตามินดีเพียงพอร่วมด้วย', 'A nurse or doctor injects it under the skin at the hospital every 6 months. Book your next appointment before you leave, and make sure you also get enough calcium and vitamin D.'),
      missedDose: t('หากไม่สามารถมาตามนัดได้ ต้องโทรแจ้งโรงพยาบาลทันทีเพื่อนัดใหม่โดยเร็วที่สุด ไม่ควรทิ้งช่วงเกินกำหนด', 'If you cannot make your appointment, phone the hospital straight away to rebook as soon as possible. The gap should not be allowed to stretch out.'),
      sideEffects: t('อาจปวดเมื่อยกล้ามเนื้อหรือข้อ และเสี่ยงแคลเซียมในเลือดต่ำ หากมีอาการชารอบปาก ปลายมือปลายเท้า หรือกล้ามเนื้อเกร็งกระตุก ให้แจ้งแพทย์ทันที', 'You may have muscle or joint aches, and blood calcium can drop. Tell your doctor at once if you get numbness around the mouth, tingling hands or feet, or muscle cramps and twitching.'),
      tellDoctor: t('กำลังจะถอนฟันหรือผ่าตัดช่องปาก มีปัญหาโรคไต หรือมีการติดเชื้อที่ผิวหนัง', 'You are due to have a tooth out or oral surgery, you have kidney problems, or you develop a skin infection.'),
      doNotStop: t('ห้ามหยุดยานี้เองโดยเด็ดขาด การหยุดยาเดโนซูแมบโดยไม่มียาอื่นทดแทน อาจทำให้กระดูกสันหลังยุบหลายระดับพร้อมกันภายใน 1-2 ปี หากต้องการหยุดยาต้องวางแผนกับแพทย์เสมอ', 'Never stop this medicine on your own. Stopping denosumab without another medicine to follow it can cause several spinal fractures at once within a year or two. Any plan to stop must be made with your doctor.')
    },
    {
      id: 'zoledronate',
      icon: '🏥', cadenceLabel: t('ปีละครั้ง', 'Once a year'), route: t('ยาฉีดเข้าหลอดเลือดดำ ที่โรงพยาบาล', 'Drip into a vein, at hospital'),
      name: t('ยาฉีดเข้าหลอดเลือดดำ โซเลโดรเนต (ปีละครั้ง)', 'Zoledronate infusion (once a year)'),
      cadenceType: 'months',
      intervalMonths: 12,
      dentalCare: true,
      whatItDoes: t('ยาในกลุ่มบิสฟอสโฟเนตชนิดฉีด ออกฤทธิ์นานทั้งปี ช่วยลดการสลายกระดูกและลดโอกาสกระดูกหัก', 'A bisphosphonate given by drip that works for a whole year, reducing bone breakdown and fracture risk.'),
      instructions: t('ให้ยาทางหลอดเลือดดำที่โรงพยาบาล ใช้เวลาประมาณ 15-30 นาที ปีละครั้ง ควรดื่มน้ำให้มากทั้งก่อนและหลังได้รับยา', 'Given through a drip at the hospital, taking about 15-30 minutes, once a year. Drink plenty of water before and after.'),
      missedDose: t('หากเลยกำหนดนัดประจำปี ให้ติดต่อโรงพยาบาลเพื่อนัดใหม่ ไม่ต้องเพิ่มขนาดยาเพื่อชดเชย', 'If your yearly appointment has passed, contact the hospital to rebook. The dose is not increased to make up for it.'),
      sideEffects: t('หลังได้รับยาครั้งแรก อาจมีไข้ ปวดเมื่อยตัวคล้ายเป็นไข้หวัด 1-3 วัน ให้ดื่มน้ำมาก ๆ และทานยาพาราเซตามอลได้ อาการมักไม่เกิดซ้ำในปีถัดไป', 'After the first infusion you may feel feverish and achy like a mild flu for 1-3 days. Drink plenty of water and paracetamol is fine. This usually does not happen again in later years.'),
      tellDoctor: t('มีปัญหาโรคไต ระดับแคลเซียมในเลือดต่ำ หรือกำลังจะทำฟัน/ผ่าตัดช่องปาก', 'You have kidney problems or low blood calcium, or you are about to have dental work or oral surgery.')
    },
    {
      id: 'teriparatide',
      icon: '🖊️', cadenceLabel: t('ทุกวัน', 'Every day'), route: t('ปากกาฉีดยา ฉีดเองที่บ้าน', 'Injection pen, self-injected at home'),
      name: t('ยาฉีดเทอริพาราไทด์ (ฉีดเองทุกวัน)', 'Teriparatide (daily self-injection)'),
      cadenceType: 'days',
      intervalDays: 1,
      whatItDoes: t('กระตุ้นการสร้างเนื้อกระดูกใหม่ ใช้ในผู้ที่มีความเสี่ยงกระดูกหักสูงมาก', 'Stimulates the body to build new bone. It is used for people at very high risk of fracture.'),
      instructions: t('ฉีดเข้าใต้ผิวหนังบริเวณหน้าท้องหรือต้นขาวันละครั้ง เวลาใกล้เคียงกันทุกวัน เก็บปากกายาไว้ในตู้เย็น (2-8 องศาเซลเซียส) ห้ามแช่ช่องแข็ง ครั้งแรกควรฉีดขณะนั่งหรือนอน เพราะอาจมีหน้ามืด', 'Inject under the skin of the abdomen or thigh once a day, at about the same time each day. Keep the pen in the fridge (2-8°C) and never freeze it. For the first few doses, sit or lie down in case you feel light-headed.'),
      missedDose: t('หากลืม ให้ฉีดทันทีที่นึกได้ภายในวันเดียวกัน หากข้ามไปทั้งวันแล้ว ให้ฉีดตามปกติในวันถัดไป ห้ามฉีด 2 เข็มในวันเดียว', 'If you forget, inject as soon as you remember on the same day. If a whole day has passed, just take the next dose as usual — never inject twice in one day.'),
      sideEffects: t('อาจมีคลื่นไส้ ปวดศีรษะ เวียนศีรษะ หรือปวดบริเวณที่ฉีด มักดีขึ้นเอง หากหน้ามืดเป็นลมบ่อยให้แจ้งแพทย์', 'You may feel nauseated, have a headache or dizziness, or have soreness where you inject. This usually settles. Tell your doctor if you feel faint often.'),
      tellDoctor: t('มีประวัติมะเร็งกระดูก เคยฉายรังสีที่กระดูก มีระดับแคลเซียมในเลือดสูง หรือมีนิ่วในไต และควรปรึกษาแพทย์เรื่องระยะเวลาการใช้ยาทั้งหมด', 'You have had bone cancer or radiation to the bone, high blood calcium, or kidney stones. Also discuss with your doctor how long you should stay on it.')
    },
    {
      id: 'romosozumab',
      icon: '💉', cadenceLabel: t('เดือนละครั้ง', 'Once a month'), route: t('ยาฉีดใต้ผิวหนัง ที่โรงพยาบาล', 'Injection under the skin, at hospital'),
      name: t('ยาฉีดโรโมโซซูแมบ (เดือนละครั้ง)', 'Romosozumab injection (once a month)'),
      cadenceType: 'months',
      intervalMonths: 1,
      whatItDoes: t('ช่วยทั้งสร้างกระดูกใหม่และลดการสลายกระดูกไปพร้อมกัน ใช้เป็นชุดการรักษานาน 12 เดือน', 'Both builds new bone and reduces bone breakdown at the same time. It is given as a 12-month course.'),
      instructions: t('ฉีดใต้ผิวหนังที่โรงพยาบาลเดือนละครั้ง (ครั้งละ 2 เข็ม) ต่อเนื่อง 12 เดือน หลังครบกำหนดแพทย์จะเปลี่ยนเป็นยาชนิดอื่นเพื่อรักษาผลที่ได้ไว้', 'Given as an injection under the skin at the hospital once a month (two injections each time) for 12 months. After the course your doctor will move you to another medicine to keep the benefit.'),
      missedDose: t('หากพลาดนัด ให้ติดต่อโรงพยาบาลเพื่อฉีดโดยเร็วที่สุด แล้วนับรอบเดือนถัดไปจากวันที่ฉีดจริง', 'If you miss an appointment, contact the hospital to have it as soon as possible, then count the next month from the date you actually received it.'),
      sideEffects: t('อาจปวดข้อ ปวดศีรษะ หรือมีปฏิกิริยาบริเวณที่ฉีด', 'You may have joint pain, headache, or a reaction where you were injected.'),
      tellDoctor: t('เคยเป็นโรคหัวใจขาดเลือด กล้ามเนื้อหัวใจตาย หรือโรคหลอดเลือดสมอง ต้องแจ้งแพทย์ก่อนเริ่มยานี้เสมอ และหากมีอาการเจ็บแน่นหน้าอกหรืออ่อนแรงครึ่งซีกระหว่างใช้ยา ให้โทร 1669 ทันที', 'You have had a heart attack, angina or a stroke — always tell your doctor before starting. If you get chest pain or one-sided weakness while on it, call 1669 immediately.')
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
    if (med.cadenceType === 'days') return addDaysSafe(fromDateStr, med.intervalDays);
    if (med.cadenceType === 'months') return addMonthsSafe(fromDateStr, med.intervalMonths);
    throw new Error('Unknown cadence type for ' + medClassId);
  }

  var DOSE_REMINDER_LEAD_DAYS = 7;

  function doseReminderState(nextDueDate, todayStr) {
    if (!nextDueDate) return null;
    var days = daysBetween(todayStr || formatYMD(new Date()), nextDueDate);
    return {
      nextDue: nextDueDate,
      daysUntil: days,
      overdue: days < 0,
      dueToday: days === 0,
      dueSoon: days > 0 && days <= DOSE_REMINDER_LEAD_DAYS,
      shouldRemind: days <= DOSE_REMINDER_LEAD_DAYS
    };
  }

  function shouldShowDoseReminder(reminder, lastShownDate, todayStr) {
    if (!reminder || !reminder.shouldRemind) return false;
    if (!lastShownDate) return true;
    return daysBetween(lastShownDate, todayStr || formatYMD(new Date())) >= 1;
  }

  /**
   * Fraction of the interval already elapsed, for the countdown ring on Home.
   * Clamped to 0-1 so an overdue dose shows a full ring rather than overflowing.
   */
  function doseCycleProgress(medClassId, fromDateStr, todayStr) {
    var med = getMedClass(medClassId);
    if (!med || !fromDateStr) return 0;
    var nextDue = computeNextDue(medClassId, fromDateStr);
    var total = daysBetween(fromDateStr, nextDue);
    if (total <= 0) return 1;
    var elapsed = daysBetween(fromDateStr, todayStr || formatYMD(new Date()));
    return Math.max(0, Math.min(1, elapsed / total));
  }

  var NUTRITION_REVIEW_MONTHS = 12;

  function isNutritionReviewDue(lastAssessedDate, todayStr) {
    if (!lastAssessedDate) return true;
    var today = todayStr || formatYMD(new Date());
    return daysBetween(lastAssessedDate, today) >= 365;
  }

  var BASELINE_DIET_CALCIUM_MG = 200;

  var CALCIUM_FOODS = [
    { id: 'milk', name: t('นมจืด', 'Plain milk'), serving: t('1 แก้ว (240 มล.)', '1 glass (240ml)'), mgPerServing: 290 },
    { id: 'soy_milk_fortified', name: t('นมถั่วเหลืองเสริมแคลเซียม', 'Calcium-fortified soy milk'), serving: t('1 กล่อง (250 มล.)', '1 carton (250ml)'), mgPerServing: 300 },
    { id: 'yogurt', name: t('โยเกิร์ต', 'Yoghurt'), serving: t('1 ถ้วย', '1 cup'), mgPerServing: 250 },
    { id: 'small_dried_fish', name: t('ปลาเล็กปลาน้อย/ปลาข้าวสาร', 'Small whole dried fish'), serving: t('2 ช้อนโต๊ะ', '2 tbsp'), mgPerServing: 230 },
    { id: 'dried_shrimp', name: t('กุ้งแห้งตัวเล็ก', 'Small dried shrimp'), serving: t('2 ช้อนโต๊ะ', '2 tbsp'), mgPerServing: 220 },
    { id: 'sardine', name: t('ปลากระป๋องซาร์ดีน (ทานทั้งก้าง)', 'Canned sardines (with bones)'), serving: t('ครึ่งกระป๋อง', 'Half a can'), mgPerServing: 240 },
    { id: 'tofu', name: t('เต้าหู้แข็ง', 'Firm tofu'), serving: t('ครึ่งถ้วย', 'Half a cup'), mgPerServing: 130 },
    { id: 'dark_greens', name: t('ผักใบเขียวเข้ม (คะน้า ตำลึง ใบยอ)', 'Dark leafy greens (Chinese kale, ivy gourd, noni leaf)'), serving: t('1 ถ้วยสุก', '1 cup cooked'), mgPerServing: 150 },
    { id: 'sesame', name: t('งาดำ', 'Black sesame'), serving: t('1 ช้อนโต๊ะ', '1 tbsp'), mgPerServing: 130 },
    { id: 'cheese', name: t('ชีส', 'Cheese'), serving: t('1 แผ่น', '1 slice'), mgPerServing: 200 }
  ];

  function estimateDailyCalciumMg(servingsPerWeekById) {
    servingsPerWeekById = servingsPerWeekById || {};
    var weekly = 0;
    CALCIUM_FOODS.forEach(function (food) {
      var servings = parseFloat(servingsPerWeekById[food.id]) || 0;
      weekly += servings * food.mgPerServing;
    });
    return Math.round(BASELINE_DIET_CALCIUM_MG + weekly / 7);
  }

  function calciumTargetMg(age, sex) {
    if (sex === 'female' && age >= 50) return 1200;
    if (sex === 'male' && age >= 70) return 1200;
    return 1000;
  }

  var CALCIUM_TABLET_STEPS = [0, 500, 600, 1000, 1200];

  function recommendCalciumSupplement(intakeMg, targetMg) {
    var gap = Math.max(0, targetMg - intakeMg);
    var suggested = 0;
    for (var i = 0; i < CALCIUM_TABLET_STEPS.length; i++) {
      if (CALCIUM_TABLET_STEPS[i] <= gap) suggested = CALCIUM_TABLET_STEPS[i];
    }
    if (gap > 0 && suggested === 0) suggested = 500;
    return { intakeMg: intakeMg, targetMg: targetMg, gapMg: gap, suggestedSupplementMg: suggested, sufficient: gap === 0 };
  }

  var VITAMIN_D_FOODS = [
    { id: 'oily_fish', name: t('ปลาทะเลไขมันสูง (แซลมอน ทู่ ซาร์ดีน)', 'Oily sea fish (salmon, mackerel, sardine)'), serving: t('1 มื้อ', '1 serving'), iuPerServing: 350 },
    { id: 'egg_yolk', name: t('ไข่แดง', 'Egg yolk'), serving: t('1 ฟอง', '1 egg'), iuPerServing: 40 },
    { id: 'fortified_milk', name: t('นมเสริมวิตามินดี', 'Vitamin D fortified milk'), serving: t('1 แก้ว', '1 glass'), iuPerServing: 100 },
    { id: 'sun_mushroom', name: t('เห็ดตากแดด', 'Sun-dried mushrooms'), serving: t('1 ถ้วย', '1 cup'), iuPerServing: 100 }
  ];

  var VITAMIN_D_SUN_LOW_MINUTES = 60;
  var VITAMIN_D_STANDARD_IU = 800;
  var VITAMIN_D_LOW_SUN_IU = 1000;

  function estimateDailyVitaminDIu(servingsPerWeekById) {
    servingsPerWeekById = servingsPerWeekById || {};
    var weekly = 0;
    VITAMIN_D_FOODS.forEach(function (food) {
      var servings = parseFloat(servingsPerWeekById[food.id]) || 0;
      weekly += servings * food.iuPerServing;
    });
    return Math.round(weekly / 7);
  }

  function recommendVitaminD(dietIu, sunMinutesPerWeek) {
    var lowSun = (parseFloat(sunMinutesPerWeek) || 0) < VITAMIN_D_SUN_LOW_MINUTES;
    var suggested = lowSun ? VITAMIN_D_LOW_SUN_IU : VITAMIN_D_STANDARD_IU;
    return {
      dietIu: dietIu,
      lowSun: lowSun,
      targetIu: VITAMIN_D_STANDARD_IU,
      suggestedSupplementIu: suggested
    };
  }

  var PROTEIN_FOODS = [
    { id: 'meat_fish', name: t('เนื้อสัตว์หรือปลา', 'Meat or fish'), serving: t('ขนาดเท่าฝ่ามือ', 'Palm-sized piece'), gramsPerServing: 20 },
    { id: 'egg', name: t('ไข่', 'Egg'), serving: t('1 ฟอง', '1 egg'), gramsPerServing: 6 },
    { id: 'tofu_soy', name: t('เต้าหู้หรือถั่วเหลือง', 'Tofu or soy'), serving: t('ครึ่งถ้วย', 'Half a cup'), gramsPerServing: 8 },
    { id: 'milk_protein', name: t('นมหรือโยเกิร์ต', 'Milk or yoghurt'), serving: t('1 แก้ว/ถ้วย', '1 glass or cup'), gramsPerServing: 8 },
    { id: 'beans', name: t('ถั่วต้มหรือถั่วเมล็ดแห้ง', 'Cooked beans or pulses'), serving: t('ครึ่งถ้วย', 'Half a cup'), gramsPerServing: 7 }
  ];

  var BASELINE_DIET_PROTEIN_G = 15;

  function estimateDailyProteinG(servingsPerDayById) {
    servingsPerDayById = servingsPerDayById || {};
    var total = BASELINE_DIET_PROTEIN_G;
    PROTEIN_FOODS.forEach(function (food) {
      var servings = parseFloat(servingsPerDayById[food.id]) || 0;
      total += servings * food.gramsPerServing;
    });
    return Math.round(total);
  }

  function proteinTargetG(weightKg, age) {
    var weight = parseFloat(weightKg);
    if (!weight || weight <= 0) return null;
    var perKg = (age || 0) >= 65 ? 1.2 : 1.0;
    return Math.round(weight * perKg);
  }

  function recommendProtein(intakeG, targetG) {
    if (targetG === null) return null;
    var gap = Math.max(0, targetG - intakeG);
    return {
      intakeG: intakeG,
      targetG: targetG,
      gapG: gap,
      sufficient: gap === 0,
      exampleEggs: Math.ceil(gap / 6)
    };
  }

  function buildNutritionResult(answers, profile) {
    answers = answers || {};
    profile = profile || {};
    var calciumIntake = estimateDailyCalciumMg(answers.calcium);
    var calciumTarget = calciumTargetMg(profile.age || 60, profile.sex || 'female');
    var vitDDiet = estimateDailyVitaminDIu(answers.vitaminD);
    var proteinIntake = estimateDailyProteinG(answers.protein);
    var proteinTarget = proteinTargetG(answers.weightKg, profile.age);
    return {
      calcium: recommendCalciumSupplement(calciumIntake, calciumTarget),
      vitaminD: recommendVitaminD(vitDDiet, answers.sunMinutesPerWeek),
      protein: recommendProtein(proteinIntake, proteinTarget)
    };
  }

  var EXERCISE_LIST = [
    {
      id: 'sit_to_stand_hold', group: 'balance', levels: [1, 2, 3], requires: ['chair'], avoidIf: [],
      name: t('ลุกยืนจากเก้าอี้โดยจับที่พยุง', 'Sit-to-stand with support'),
      amount: t('10 ครั้ง 2 รอบ', '10 times, 2 rounds'),
      howTo: t('นั่งตรงขอบเก้าอี้ วางเท้าห่างกันเท่าช่วงสะโพก จับที่วางแขนหรือขอบโต๊ะ โน้มตัวไปข้างหน้าเล็กน้อยแล้วลุกขึ้นยืนช้า ๆ จากนั้นค่อย ๆ นั่งลงโดยไม่ทิ้งตัว', 'Sit at the front of the chair with feet hip-width apart. Hold the armrests or a table, lean forward slightly, stand up slowly, then lower yourself back down under control.')
    },
    {
      id: 'standing_marching', group: 'balance', levels: [1, 2, 3], requires: ['chair'], avoidIf: [],
      name: t('ยืนย่ำเท้าอยู่กับที่', 'Standing marching'),
      amount: t('ข้างละ 10 ครั้ง', '10 times each side'),
      howTo: t('ยืนตรงหลังเก้าอี้ จับพนักไว้ทั้งสองมือ ยกเข่าขึ้นสลับซ้าย-ขวาช้า ๆ ให้สูงระดับสะโพกเท่าที่ทำได้ ยืนตัวตรงและหายใจตามปกติ', 'Stand behind the chair holding the back with both hands. Slowly lift one knee then the other, as high as is comfortable. Keep your body upright and breathe normally.')
    },
    {
      id: 'weight_shifts', group: 'balance', levels: [1, 2, 3], requires: ['chair'], avoidIf: [],
      name: t('โยกน้ำหนักตัวซ้าย-ขวา', 'Side-to-side weight shifts'),
      amount: t('ข้างละ 10 ครั้ง', '10 times each side'),
      howTo: t('ยืนจับพนักเก้าอี้ เท้าห่างกันเท่าช่วงไหล่ ค่อย ๆ ถ่ายน้ำหนักไปที่ขาซ้ายจนขาขวาเบาลง ค้างไว้ 3 วินาที แล้วสลับข้าง', 'Stand holding the chair with feet shoulder-width apart. Slowly shift your weight onto the left leg until the right foot feels light, hold for 3 seconds, then swap sides.')
    },
    {
      id: 'single_leg_stand_chair', group: 'balance', levels: [2, 3], requires: ['chair'], avoidIf: [],
      name: t('ยืนขาเดียวโดยมีเก้าอี้อยู่ใกล้', 'Single-leg stance'),
      amount: t('ข้างละ 10 วินาที 3 ครั้ง', '10 seconds each side, 3 times'),
      howTo: t('ยืนข้างเก้าอี้ แตะพนักด้วยปลายนิ้วเบา ๆ ยกเท้าข้างหนึ่งขึ้นจากพื้นเล็กน้อย ยืนทรงตัวไว้ 10 วินาที แล้วสลับข้าง เมื่อมั่นใจขึ้นจึงลดการแตะลง', 'Stand beside the chair with your fingertips resting lightly on it. Lift one foot just off the floor and hold your balance for 10 seconds, then swap. As you gain confidence, touch the chair less.')
    },
    {
      id: 'tandem_stand', group: 'balance', levels: [2, 3], requires: ['wall'], avoidIf: [],
      name: t('ยืนเท้าเรียงต่อกัน', 'Heel-to-toe stand'),
      amount: t('10 วินาที 3 ครั้ง', '10 seconds, 3 times'),
      howTo: t('ยืนหันข้างเข้าหากำแพง วางส้นเท้าหน้าชิดปลายเท้าหลังให้เป็นเส้นตรง กางแขนเล็กน้อยเพื่อช่วยทรงตัว ยืนค้างไว้ 10 วินาที แล้วสลับเท้าหน้า', 'Stand side-on to the wall and place one heel directly in front of the other toes, in a straight line. Hold your arms out slightly for balance, hold for 10 seconds, then change which foot is in front.')
    },
    {
      id: 'tandem_walk', group: 'balance', levels: [3], requires: [], avoidIf: [],
      name: t('เดินต่อเท้าเป็นเส้นตรง', 'Heel-to-toe walking'),
      amount: t('10 ก้าว 2 เที่ยว', '10 steps, 2 passes'),
      howTo: t('เดินไปข้างหน้าโดยวางส้นเท้าหน้าชิดปลายเท้าหลังทุกก้าว มองตรงไปข้างหน้าไม่ก้มมองเท้า เดินใกล้กำแพงเผื่อต้องใช้มือยัน', 'Walk forward placing the heel of each step right in front of the toes of the other foot. Look ahead rather than down at your feet, and walk near a wall in case you need to steady yourself.')
    },
    {
      id: 'backward_walk', group: 'balance', levels: [3], requires: [], avoidIf: [],
      name: t('เดินถอยหลัง', 'Backward walking'),
      amount: t('10 ก้าว 2 เที่ยว', '10 steps, 2 passes'),
      howTo: t('เดินถอยหลังช้า ๆ ในทางเดินที่โล่งและไม่มีสิ่งกีดขวาง ก้าวสั้น ๆ วางปลายเท้าลงก่อน ควรมีคนอยู่ด้วยในครั้งแรก ๆ', 'Walk slowly backwards along a clear hallway with nothing in the way. Take short steps, putting the toes down first. Have someone with you the first few times.')
    },
    {
      id: 'sit_to_stand', group: 'strength', levels: [1, 2, 3], requires: ['chair'], avoidIf: [],
      name: t('ลุก-นั่งเก้าอี้', 'Sit-to-stand'),
      amount: t('10 ครั้ง 2 รอบ', '10 times, 2 rounds'),
      howTo: t('นั่งตรงขอบเก้าอี้ กอดอกไว้ถ้าทำได้ ลุกขึ้นยืนให้สุดโดยไม่ใช้มือช่วย แล้วนั่งลงช้า ๆ ถ้ายังลุกเองไม่ไหวให้ดันที่วางแขนช่วยได้', 'Sit at the front of the chair, arms crossed if you can. Stand up fully without using your hands, then sit down slowly. If that is too hard, push up from the armrests.')
    },
    {
      id: 'heel_raises', group: 'strength', levels: [1, 2, 3], requires: ['chair'], avoidIf: [],
      name: t('เขย่งปลายเท้า', 'Heel raises'),
      amount: t('15 ครั้ง 2 รอบ', '15 times, 2 rounds'),
      howTo: t('ยืนจับพนักเก้าอี้ ค่อย ๆ เขย่งส้นเท้าขึ้นให้สูงที่สุดเท่าที่ทำได้ ค้างไว้ 2 วินาที แล้วลดส้นลงช้า ๆ จนแตะพื้น', 'Hold the chair back and slowly rise up onto your toes as high as you comfortably can. Hold for 2 seconds, then lower your heels back to the floor slowly.')
    },
    {
      id: 'wall_pushups', group: 'strength', levels: [1, 2, 3], requires: ['wall'], avoidIf: [],
      name: t('ดันกำแพง', 'Wall push-ups'),
      amount: t('10 ครั้ง 2 รอบ', '10 times, 2 rounds'),
      howTo: t('ยืนหันหน้าเข้ากำแพง ห่างประมาณหนึ่งช่วงแขน วางฝ่ามือบนกำแพงระดับไหล่ งอศอกให้ตัวเข้าใกล้กำแพงโดยลำตัวตรง แล้วดันกลับ', 'Face the wall about an arm’s length away with palms on the wall at shoulder height. Bend your elbows to bring your body towards the wall, keeping it straight, then push back.')
    },
    {
      id: 'hip_abduction', group: 'strength', levels: [1, 2, 3], requires: ['chair'], avoidIf: [],
      name: t('ยกขาออกด้านข้าง', 'Standing hip abduction'),
      amount: t('ข้างละ 10 ครั้ง 2 รอบ', '10 each side, 2 rounds'),
      howTo: t('ยืนจับพนักเก้าอี้ ยืนตัวตรง ยกขาข้างหนึ่งออกไปด้านข้างช้า ๆ โดยเข่าเหยียดตรงและปลายเท้าชี้ไปข้างหน้า แล้วลดลงช้า ๆ อย่าเอนตัวตาม', 'Hold the chair and stand tall. Slowly lift one leg out to the side with the knee straight and toes pointing forward, then lower it slowly. Keep your body upright rather than leaning.')
    },
    {
      id: 'step_ups', group: 'strength', levels: [2, 3], requires: ['wall'], avoidIf: [],
      name: t('ก้าวขึ้นขั้นบันได', 'Step-ups'),
      amount: t('ข้างละ 8 ครั้ง', '8 times each side'),
      howTo: t('ยืนหน้าบันไดขั้นแรก จับราวบันไดไว้ ก้าวเท้าขวาขึ้นแล้วตามด้วยเท้าซ้าย จากนั้นถอยลงทีละเท้า ทำซ้ำโดยเริ่มด้วยเท้าขวาให้ครบ แล้วสลับเป็นเท้าซ้ายนำ', 'Stand at the bottom step holding the rail. Step up with the right foot, bring the left up, then step down one foot at a time. Repeat leading with the right, then swap to leading with the left.')
    },
    {
      id: 'hip_hinge', group: 'posture', levels: [1, 2, 3], requires: [], avoidIf: [],
      name: t('ก้มโดยพับสะโพก ไม่งอหลัง', 'Hip hinge — bend at the hips, not the back'),
      amount: t('10 ครั้ง', '10 times'),
      howTo: t('ยืนเท้าห่างเท่าช่วงสะโพก แขม่วหน้าท้องเล็กน้อย ดันสะโพกไปด้านหลังพร้อมงอเข่าเล็กน้อย โดยรักษาหลังให้ตรงเหมือนไม้บรรทัด แล้วยืดตัวขึ้นโดยใช้กล้ามเนื้อสะโพก', 'Stand with feet hip-width apart and gently tighten your stomach. Push your hips backwards and bend the knees slightly, keeping your back straight like a ruler, then stand up using your hip muscles.')
    },
    {
      id: 'chin_tuck', group: 'posture', levels: [1, 2, 3], requires: [], avoidIf: [],
      name: t('เก็บคาง ยืดคอ', 'Chin tuck'),
      amount: t('10 ครั้ง 2 รอบ', '10 times, 2 rounds'),
      howTo: t('นั่งหรือยืนตัวตรง มองตรงไปข้างหน้า เก็บคางเข้าหาลำคอเบา ๆ เหมือนทำคางสองชั้น ค้างไว้ 5 วินาที แล้วผ่อน ไม่ต้องก้มหรือเงยหน้า', 'Sit or stand tall looking straight ahead. Gently draw your chin back towards your neck, making a double chin, hold for 5 seconds, then release. Do not tip your head up or down.')
    },
    {
      id: 'scapular_squeeze', group: 'posture', levels: [1, 2, 3], requires: [], avoidIf: [],
      name: t('หนีบสะบัก', 'Shoulder blade squeeze'),
      amount: t('10 ครั้ง 2 รอบ', '10 times, 2 rounds'),
      howTo: t('นั่งหรือยืนตัวตรง ปล่อยแขนข้างลำตัว บีบสะบักทั้งสองข้างเข้าหากันเหมือนหนีบดินสอไว้ตรงกลางหลัง ค้าง 5 วินาที แล้วผ่อน ไหล่ไม่ยกขึ้น', 'Sit or stand tall with arms by your sides. Squeeze your shoulder blades together as if holding a pencil between them, hold 5 seconds, then release. Keep your shoulders down, not shrugged.')
    },
    {
      id: 'safe_pickup', group: 'posture', levels: [1, 2, 3], requires: [], avoidIf: [],
      name: t('วิธีหยิบของจากพื้นอย่างปลอดภัย', 'How to pick things up safely'),
      amount: t('ฝึก 5 ครั้ง', 'Practise 5 times'),
      howTo: t('เข้าไปใกล้ของให้มากที่สุด ย่อเข่าลงหรือคุกเข่าข้างหนึ่ง โดยรักษาหลังให้ตรง ใช้มือข้างหนึ่งยันที่ต้นขาหรือเฟอร์นิเจอร์ หยิบของแล้วดันตัวขึ้นด้วยแรงขา ห้ามก้มหลังบิดตัวขณะยกของ', 'Get as close to the object as you can. Bend your knees or kneel on one knee, keeping your back straight, and support yourself with a hand on your thigh or furniture. Pick the item up and push up with your legs. Never bend and twist your back while lifting.')
    },
    {
      id: 'seated_row_band', group: 'posture', levels: [2, 3], requires: ['chair', 'band'], avoidIf: ['vertebralFracture'],
      name: t('ดึงยางยืดโดยหลังตรง', 'Seated band row'),
      amount: t('10 ครั้ง 2 รอบ', '10 times, 2 rounds'),
      howTo: t('นั่งหลังตรงบนเก้าอี้ คล้องยางยืดไว้กับที่ยึดมั่นคงระดับอก จับปลายยางทั้งสองข้าง ดึงศอกไปด้านหลังพร้อมหนีบสะบัก ค้าง 2 วินาที แล้วผ่อนกลับช้า ๆ โดยไม่โน้มตัวตาม', 'Sit tall on the chair with the band anchored securely at chest height. Hold both ends and pull your elbows back, squeezing your shoulder blades. Hold 2 seconds, then release slowly without letting your body lean forward.')
    }
  ];

  var MEDIA_MANIFEST = {};

  function getExerciseMedia(exerciseId) {
    var entry = MEDIA_MANIFEST[exerciseId];
    return entry && entry.src ? entry : null;
  }

  function hasExerciseMedia(exerciseId) {
    return getExerciseMedia(exerciseId) !== null;
  }

  function getExercisesForPatient(level, avoidTags) {
    avoidTags = avoidTags || [];
    return EXERCISE_LIST.filter(function (ex) {
      if (ex.levels.indexOf(level) === -1) return false;
      return !ex.avoidIf.some(function (tag) { return avoidTags.indexOf(tag) !== -1; });
    });
  }

  var SAFETY_ITEMS = [
    { id: 'bedroom_nightlight', room: 'bedroom', priority: 4, icon: '💡', name: t('มีไฟกลางคืนหรือไฟหัวเตียงที่เปิดได้ง่าย', 'A night light or bedside lamp within easy reach') },
    { id: 'bedroom_clear_path', room: 'bedroom', priority: 5, icon: '🚶', name: t('ทางเดินจากเตียงไปห้องน้ำโล่ง ไม่มีของวางกีดขวาง', 'A clear path from the bed to the bathroom') },
    { id: 'bedroom_phone_reach', room: 'bedroom', priority: 3, icon: '📱', name: t('มีโทรศัพท์วางใกล้เตียง หยิบถึงขณะนอน', 'A phone beside the bed you can reach lying down') },
    { id: 'bedroom_bed_height', room: 'bedroom', priority: 2, icon: '🛏️', name: t('เตียงสูงพอดี นั่งแล้วเท้าแตะพื้น ลุกง่าย', 'The bed is the right height — feet touch the floor when sitting') },

    { id: 'bathroom_grab_bar', room: 'bathroom', priority: 5, icon: '🦯', name: t('มีราวจับข้างโถส้วมและในที่อาบน้ำ', 'Grab bars beside the toilet and in the shower') },
    { id: 'bathroom_nonslip_mat', room: 'bathroom', priority: 5, icon: '🧼', name: t('มีแผ่นกันลื่นในที่อาบน้ำ', 'A non-slip mat in the shower area') },
    { id: 'bathroom_dry_floor', room: 'bathroom', priority: 4, icon: '💧', name: t('พื้นห้องน้ำแห้งเสมอ ไม่มีน้ำขังหรือคราบสบู่', 'The bathroom floor is kept dry, with no puddles or soap film') },
    { id: 'bathroom_raised_toilet', room: 'bathroom', priority: 3, icon: '🚽', name: t('โถส้วมแบบนั่งราบ สูงพอดี ลุกได้สะดวก', 'A sitting toilet at a height you can get up from easily') },
    { id: 'bathroom_lighting', room: 'bathroom', priority: 3, icon: '🔆', name: t('ห้องน้ำสว่างเพียงพอทั้งกลางวันและกลางคืน', 'The bathroom is bright enough day and night') },

    { id: 'stairs_handrail', room: 'stairs', priority: 5, icon: '🪜', name: t('มีราวจับบันไดที่มั่นคง อย่างน้อยหนึ่งข้างตลอดแนว', 'A firm handrail running the full length, on at least one side') },
    { id: 'stairs_edge_marking', room: 'stairs', priority: 4, icon: '📏', name: t('ขอบขั้นบันไดเห็นชัด หรือมีแถบสีตัดกันติดไว้', 'Step edges are easy to see, or marked with contrasting tape') },
    { id: 'stairs_lighting', room: 'stairs', priority: 4, icon: '🔦', name: t('บันไดมีแสงสว่างพอ และมีสวิตช์ไฟทั้งบนและล่าง', 'The stairs are well lit, with a switch at the top and bottom') },
    { id: 'stairs_no_clutter', room: 'stairs', priority: 3, icon: '📦', name: t('ไม่มีของวางบนขั้นบันได', 'Nothing is left sitting on the steps') },

    { id: 'kitchen_reachable_shelf', room: 'kitchen', priority: 4, icon: '🥫', name: t('ของที่ใช้บ่อยอยู่ในระดับเอวถึงไหล่ ไม่ต้องปีนหรือเขย่ง', 'Everyday items sit between waist and shoulder height — no climbing or stretching') },
    { id: 'kitchen_nonslip_mat', room: 'kitchen', priority: 3, icon: '🧽', name: t('มีแผ่นกันลื่นหน้าอ่างล้างจาน', 'A non-slip mat in front of the sink') },
    { id: 'kitchen_cord_clutter', room: 'kitchen', priority: 3, icon: '🔌', name: t('ไม่มีสายไฟหรือสายอุปกรณ์พาดผ่านทางเดิน', 'No cords or cables run across the walkway') },
    { id: 'kitchen_spill_clean', room: 'kitchen', priority: 3, icon: '🧹', name: t('เช็ดน้ำหรือน้ำมันที่หกทันที', 'Spills of water or oil are wiped up straight away') },

    { id: 'outdoors_no_rugs', room: 'outdoors', priority: 4, icon: '🪞', name: t('ไม่มีพรมเช็ดเท้าเลื่อนได้หรือของวางขวางทางเข้าบ้าน', 'No sliding door mats or clutter at the entrance') },
    { id: 'outdoors_stepedge', room: 'outdoors', priority: 3, icon: '⚠️', name: t('ทางต่างระดับหรือธรณีประตูเห็นชัด หรือทำเครื่องหมายไว้', 'Steps and door thresholds are easy to see, or marked') },
    { id: 'outdoors_lighting', room: 'outdoors', priority: 3, icon: '🌙', name: t('ทางเข้าบ้านและบริเวณรอบบ้านมีไฟส่องสว่างตอนกลางคืน', 'The entrance and surrounds are lit at night') }
  ];

  function computeSafetyScore(checkedIds) {
    checkedIds = checkedIds || [];
    var checkedSet = {};
    checkedIds.forEach(function (id) { checkedSet[id] = true; });
    var unchecked = SAFETY_ITEMS.filter(function (item) { return !checkedSet[item.id]; });
    unchecked.sort(function (a, b) { return b.priority - a.priority; });
    return {
      score: SAFETY_ITEMS.length - unchecked.length,
      max: SAFETY_ITEMS.length,
      priorityFixes: unchecked.slice(0, 3)
    };
  }

  var SAFETY_REAUDIT_DAYS = 182;
  function isSafetyAuditDue(lastAuditDate, todayStr) {
    if (!lastAuditDate) return true;
    return daysBetween(lastAuditDate, todayStr || formatYMD(new Date())) >= SAFETY_REAUDIT_DAYS;
  }

  var HEIGHT_CHECK_DAYS = 182;
  var HEIGHT_LOSS_FLAG_CM = 2;

  function checkHeightLoss(baselineCm, currentCm) {
    if (typeof baselineCm !== 'number' || typeof currentCm !== 'number') return false;
    return (baselineCm - currentCm) >= HEIGHT_LOSS_FLAG_CM;
  }

  function isHeightCheckDue(lastHeightDate, todayStr) {
    if (!lastHeightDate) return true;
    return daysBetween(lastHeightDate, todayStr || formatYMD(new Date())) >= HEIGHT_CHECK_DAYS;
  }

  function isSelfTestDue(lastSelfTestDate, todayStr) {
    if (!lastSelfTestDate) return true;
    return daysBetween(lastSelfTestDate, todayStr || formatYMD(new Date())) >= SELF_TEST_FRESH_DAYS;
  }

  var CHECKIN_INTERVAL_DAYS = 28;
  function isMonthlyCheckinDue(lastCheckinDate, todayStr) {
    if (!lastCheckinDate) return true;
    return daysBetween(lastCheckinDate, todayStr || formatYMD(new Date())) >= CHECKIN_INTERVAL_DAYS;
  }

  function computeAdherenceStreak(isoDates, todayIsoDate) {
    isoDates = isoDates || [];
    if (!isoDates.length) return 0;
    var dateSet = {};
    isoDates.forEach(function (d) { dateSet[d] = true; });
    var cursor = todayIsoDate || formatYMD(new Date());
    var streak = 0;
    while (dateSet[cursor]) {
      streak += 1;
      cursor = addDaysSafe(cursor, -1);
    }
    return streak;
  }

  function monthKey(dateStr) {
    return String(dateStr).slice(0, 7);
  }

  function recentMonthKeys(count, todayStr) {
    var today = todayStr ? parseYMD(todayStr) : new Date();
    var keys = [];
    for (var i = count - 1; i >= 0; i--) {
      var d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      keys.push(formatYMD(d).slice(0, 7));
    }
    return keys;
  }

  function buildMonthlyCounts(dates, monthsBack, todayStr) {
    var keys = recentMonthKeys(monthsBack || 6, todayStr);
    var counts = {};
    (dates || []).forEach(function (d) {
      var key = monthKey(d);
      counts[key] = (counts[key] || 0) + 1;
    });
    return keys.map(function (key) {
      return { label: key, value: counts[key] || 0 };
    });
  }

  function buildTimeSeries(entries, valueKey) {
    return (entries || []).map(function (entry) {
      return { label: entry.date, value: entry[valueKey] };
    }).filter(function (point) {
      return typeof point.value === 'number' && !isNaN(point.value);
    });
  }

  function generateDeviceUuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
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
    var birthYear = normalizeBirthYear(fields.yearOfBirth);
    return {
      schemaVersion: SCHEMA_VERSION,
      token: token,
      patientId: hnUnknown ? (fields.deviceUuid || generateDeviceUuid()) : fields.hn,
      hn: hnUnknown ? null : fields.hn,
      hnUnknown: hnUnknown,
      yearOfBirth: birthYear,
      age: deriveAge(fields.yearOfBirth),
      sex: fields.sex || null,
      consent: !!fields.consent
    };
  }

  function validateRegistrationPayload(payload) {
    var errors = [];
    if (!payload || typeof payload !== 'object') return { valid: false, errors: ['payload must be an object'] };
    if (!payload.token) errors.push('missing token');
    if (!payload.patientId) errors.push('missing patientId');
    if (!payload.yearOfBirth) errors.push('missing yearOfBirth');
    if (!payload.sex) errors.push('missing sex');
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
    (records || []).forEach(function (r) {
      var key = buildDedupKey(r.patientId, r.date, r.type);
      if (!seen[key]) {
        seen[key] = true;
        result.push(r);
      }
    });
    return result;
  }

  var MERGEABLE_RECORD_TYPES = ['checkin', 'nutrition', 'bmd'];

  /**
   * A day can produce several check-in measurements (height, then a
   * self-test, then a safety score). They belong in one record, so a new
   * one merges into a queued record with the same dedup key rather than
   * queuing a second request that the backend would have to reconcile.
   * Falls are left alone: two falls in one day are two real events.
   */
  function queueRecord(queue, record) {
    queue = queue || [];
    if (MERGEABLE_RECORD_TYPES.indexOf(record.type) !== -1) {
      var key = buildDedupKey(record.patientId, record.date, record.type);
      for (var i = 0; i < queue.length; i++) {
        var queued = queue[i];
        if (queued.kind === 'record' && buildDedupKey(queued.payload.patientId, queued.payload.date, queued.payload.type) === key) {
          queue[i] = { kind: 'record', payload: Object.assign({}, queued.payload, record) };
          return queue;
        }
      }
    }
    queue.push({ kind: 'record', payload: record });
    return queue;
  }

  var RESOURCE_LINKS = [
    { id: 'topf', titleKey: 'resTopfTitle', descKey: 'resTopfDesc', url: 'https://www.topf.or.th' },
    { id: 'otago', titleKey: 'resOtagoTitle', descKey: 'resOtagoDesc', url: 'https://www.otago.ac.nz' },
    { id: 'steadi', titleKey: 'resSteadiTitle', descKey: 'resSteadiDesc', url: 'https://www.cdc.gov/steadi' },
    { id: 'who_falls', titleKey: 'resWhoTitle', descKey: 'resWhoDesc', url: 'https://www.who.int' }
  ];

  var RED_FLAGS = [
    { id: 'hip_pain', severity: 'critical', icon: '🦴', key: 'alertHipPain', actionKey: 'alertHipPainAction', call: 'ems' },
    { id: 'head_injury', severity: 'critical', icon: '🩸', key: 'alertHeadInjury', actionKey: 'alertHeadInjuryAction', call: 'ems' },
    { id: 'neuro', severity: 'critical', icon: '⚡', key: 'alertNeuro', actionKey: 'alertNeuroAction', call: 'ems' },
    { id: 'back_pain', severity: 'serious', icon: '🔥', key: 'alertBackPain', actionKey: 'alertBackPainAction', call: 'hospital' }
  ];

  var ALERT_CONTACTS = {
    hospitalPhone: '02 839 6000',
    emsPhone: '1669'
  };

  var DOCTOR = {
    name: t('นพ.สรวุฒิ ธรรมยงค์กิจ', 'Dr. Sorawut Thamyongkit'),
    hospitalPhone: ALERT_CONTACTS.hospitalPhone
  };

  var BMD_SITES = [
    { id: 'spine', labelKey: 'bmdSpine', color: 'var(--series-1)' },
    { id: 'hip', labelKey: 'bmdHip', color: 'var(--series-2)' }
  ];

  function buildBmdSeries(bmdLogs, site) {
    return (bmdLogs || []).map(function (entry) {
      return { label: entry.date, value: entry[site + 'Bmd'] };
    }).filter(function (point) {
      return typeof point.value === 'number' && !isNaN(point.value);
    });
  }

  function hasBmdData(bmdLogs) {
    return buildBmdSeries(bmdLogs, 'spine').length > 0 || buildBmdSeries(bmdLogs, 'hip').length > 0;
  }

  /**
   * Change between the first and last reading, so the chart can state the
   * trend in words instead of leaving the patient to eyeball the slope.
   */
  function seriesChange(points, decimals) {
    if (!points || points.length < 2) return null;
    var first = points[0].value;
    var last = points[points.length - 1].value;
    var delta = last - first;
    var places = typeof decimals === 'number' ? decimals : 1;
    return {
      first: first,
      last: last,
      delta: delta,
      deltaText: (delta > 0 ? '+' : delta < 0 ? '−' : '') + Math.abs(delta).toFixed(places),
      direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat',
      fromLabel: points[0].label,
      toLabel: points[points.length - 1].label
    };
  }

  var ONBOARDING_QUESTIONS = [
    { id: 'priorFragilityFracture', field: 'priorFragilityFracture', type: 'boolean', labelKey: 'qPriorFracture' },
    {
      id: 'fractureSite', field: 'fractureSite', type: 'choice', labelKey: 'qFractureSite',
      dependsOn: { field: 'priorFragilityFracture', value: true },
      options: [
        { value: 'hip', labelKey: 'siteHip' },
        { value: 'spine', labelKey: 'siteSpine' },
        { value: 'wrist', labelKey: 'siteWrist' },
        { value: 'humerus', labelKey: 'siteHumerus' },
        { value: 'other', labelKey: 'siteOther' }
      ]
    },
    { id: 'tScoreKnown', field: 'tScoreKnown', type: 'boolean', labelKey: 'qTScoreKnown' },
    { id: 'tScore', field: 'tScore', type: 'number', labelKey: 'qTScoreValue', dependsOn: { field: 'tScoreKnown', value: true } },
    { id: 'fallsLast12mo', field: 'fallsLast12mo', type: 'number', labelKey: 'qFalls' },
    { id: 'longTermSteroid', field: 'longTermSteroid', type: 'boolean', labelKey: 'qSteroid' },
    {
      id: 'currentMedClass', field: 'currentMedClass', type: 'choice', labelKey: 'qCurrentMed',
      options: [{ value: 'none', labelKey: 'none' }].concat(MED_CLASSES.map(function (m) {
        return { value: m.id, labelKey: null, label: m.name };
      }))
    },
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
    normalizeBirthYear: normalizeBirthYear,
    deriveAge: deriveAge,
    resolveTier: resolveTier,
    defaultBalanceLevelForProfile: defaultBalanceLevelForProfile,
    resolveBalanceLevel: resolveBalanceLevel,
    canAdvanceBalanceLevel: canAdvanceBalanceLevel,
    CHAIR_STAND_NORMS: CHAIR_STAND_NORMS,
    chairStandNorm: chairStandNorm,
    meetsChairStandNorm: meetsChairStandNorm,
    TUG_THRESHOLD_SECONDS: TUG_THRESHOLD_SECONDS,
    meetsTUG: meetsTUG,
    SELF_TEST_FRESH_DAYS: SELF_TEST_FRESH_DAYS,
    LEVEL_SETTLE_DAYS: LEVEL_SETTLE_DAYS,
    MED_CLASSES: MED_CLASSES,
    getMedClass: getMedClass,
    computeNextDue: computeNextDue,
    NUTRITION_REVIEW_MONTHS: NUTRITION_REVIEW_MONTHS,
    isNutritionReviewDue: isNutritionReviewDue,
    CALCIUM_FOODS: CALCIUM_FOODS,
    BASELINE_DIET_CALCIUM_MG: BASELINE_DIET_CALCIUM_MG,
    estimateDailyCalciumMg: estimateDailyCalciumMg,
    calciumTargetMg: calciumTargetMg,
    recommendCalciumSupplement: recommendCalciumSupplement,
    VITAMIN_D_FOODS: VITAMIN_D_FOODS,
    VITAMIN_D_SUN_LOW_MINUTES: VITAMIN_D_SUN_LOW_MINUTES,
    estimateDailyVitaminDIu: estimateDailyVitaminDIu,
    recommendVitaminD: recommendVitaminD,
    PROTEIN_FOODS: PROTEIN_FOODS,
    BASELINE_DIET_PROTEIN_G: BASELINE_DIET_PROTEIN_G,
    estimateDailyProteinG: estimateDailyProteinG,
    proteinTargetG: proteinTargetG,
    recommendProtein: recommendProtein,
    buildNutritionResult: buildNutritionResult,
    EXERCISE_LIST: EXERCISE_LIST,
    MEDIA_MANIFEST: MEDIA_MANIFEST,
    getExerciseMedia: getExerciseMedia,
    hasExerciseMedia: hasExerciseMedia,
    getExercisesForPatient: getExercisesForPatient,
    SAFETY_ITEMS: SAFETY_ITEMS,
    computeSafetyScore: computeSafetyScore,
    isSafetyAuditDue: isSafetyAuditDue,
    HEIGHT_LOSS_FLAG_CM: HEIGHT_LOSS_FLAG_CM,
    checkHeightLoss: checkHeightLoss,
    isHeightCheckDue: isHeightCheckDue,
    isSelfTestDue: isSelfTestDue,
    CHECKIN_INTERVAL_DAYS: CHECKIN_INTERVAL_DAYS,
    isMonthlyCheckinDue: isMonthlyCheckinDue,
    computeAdherenceStreak: computeAdherenceStreak,
    buildMonthlyCounts: buildMonthlyCounts,
    buildTimeSeries: buildTimeSeries,
    generateDeviceUuid: generateDeviceUuid,
    isValidUuid: isValidUuid,
    buildRegistrationPayload: buildRegistrationPayload,
    validateRegistrationPayload: validateRegistrationPayload,
    renderResourceCard: renderResourceCard,
    buildDedupKey: buildDedupKey,
    dedupeRecords: dedupeRecords,
    MERGEABLE_RECORD_TYPES: MERGEABLE_RECORD_TYPES,
    queueRecord: queueRecord,
    RESOURCE_LINKS: RESOURCE_LINKS,
    RED_FLAGS: RED_FLAGS,
    ALERT_CONTACTS: ALERT_CONTACTS,
    DOCTOR: DOCTOR,
    DOSE_REMINDER_LEAD_DAYS: DOSE_REMINDER_LEAD_DAYS,
    doseReminderState: doseReminderState,
    shouldShowDoseReminder: shouldShowDoseReminder,
    doseCycleProgress: doseCycleProgress,
    BMD_SITES: BMD_SITES,
    buildBmdSeries: buildBmdSeries,
    hasBmdData: hasBmdData,
    seriesChange: seriesChange,
    ONBOARDING_QUESTIONS: ONBOARDING_QUESTIONS
  };
});
