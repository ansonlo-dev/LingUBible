// Academic Calendar 2026-27 (Lingnan University)
// Sources: official ACADEMIC CALENDAR 2026-27 PDF, plus the Registry
// "Important Dates" page (https://www.ln.edu.hk/reg/undergraduate-programmes/important-dates)
// for course-registration, assessment (grades/appeals) and graduation dates.
// Events are all-day / multi-day. Dates are ISO "YYYY-MM-DD" (local, HK time).
// `end` is inclusive; omit it for single-day events.

export type CalendarCategory =
  | 'term' // Term classes begin / end (major milestones)
  | 'exam' // Examination periods
  | 'holiday' // General holidays & class suspensions
  | 'addDrop' // Add/drop, change of course sections period
  | 'registration' // Registration windows
  | 'deadline' // Payment / submission / late-registration deadlines
  | 'assessment' // Exam timetable publication, grade release, appeals, DAP meetings
  | 'graduation' // Graduation evaluation cut-offs, info release, degree conferment
  | 'event'; // Senate meetings, orientation, congregation, major events

export interface AcademicEvent {
  id: string;
  start: string; // inclusive
  end?: string; // inclusive; absent → single day
  category: CalendarCategory;
  // Optional second category for events that belong to two groups at once (e.g.
  // Congregation is an event AND a class-suspension holiday). Rendered as a
  // two-tone striped bar instead of being duplicated.
  category2?: CalendarCategory;
  title: string; // English
  title_tc: string; // Traditional Chinese
  title_sc: string; // Simplified Chinese
}

// Display order / colour priority when an event sits on a day with several others.
export const CATEGORY_ORDER: CalendarCategory[] = [
  'term',
  'exam',
  'holiday',
  'addDrop',
  'registration',
  'deadline',
  'assessment',
  'graduation',
  'event',
];

export const ACADEMIC_YEAR_LABEL = '2026-27';

// When this file's event data was last refreshed from the Registry's calendar
// pages. Shown on the calendar page — update whenever the data is re-imported.
export const CALENDAR_DATA_UPDATED = '2026/07/15';

// First day of Term 1 — used as the calendar's default landing month.
export const TERM_START_DATE = '2026-09-01';

// First day of Term 2 — the "term start" jump target once Term 1 is under way.
export const TERM_2_START_DATE = '2027-01-08';

export const ACADEMIC_EVENTS: AcademicEvent[] = [
  // ───────────────────────── AUG 2026 ─────────────────────────
  {
    id: 'jupas-results',
    start: '2026-08-05',
    category: 'event',
    title: 'Publication of JUPAS Main Round Offer Results',
    title_tc: '公布 JUPAS 大學聯招正取結果',
    title_sc: '公布 JUPAS 大学联招正取结果',
  },
  {
    id: 'online-reporting-start',
    start: '2026-08-05',
    category: 'event',
    title: 'First day for Online Reporting Days for new UG students (JUPAS-admitted)',
    title_tc: '新生網上報到首日（聯招取錄學生）',
    title_sc: '新生网上报到首日（联招录取学生）',
  },
  {
    id: 'reg-year23',
    start: '2026-08-18',
    category: 'registration',
    title: 'Registration — new UG students (Year 2 or 3)',
    title_tc: '新生註冊（二年級或三年級）',
    title_sc: '新生注册（二年级或三年级）',
  },
  {
    id: 'reg-year1',
    start: '2026-08-19',
    category: 'registration',
    title: 'Registration — new UG students (Year 1)',
    title_tc: '新生註冊（一年級）',
    title_sc: '新生注册（一年级）',
  },
  {
    id: 'tuition-current',
    start: '2026-08-21',
    category: 'deadline',
    title: 'Last day for tuition payment — current UG students',
    title_tc: '在學本科生繳交學費截止日',
    title_sc: '在校本科生缴交学费截止日',
  },
  {
    id: 'orientation',
    start: '2026-08-24',
    category: 'event',
    title: 'New Student Orientation',
    title_tc: '新生迎新活動',
    title_sc: '新生迎新活动',
  },
  {
    id: 'adddrop-t1',
    start: '2026-08-28',
    end: '2026-09-07',
    category: 'addDrop',
    title: 'Course add/drop, change of course sections, full/part-time status & study programmes (UG)',
    title_tc: '加退選、更改課程組別、全/兼讀身分及修讀計劃（本科生）',
    title_sc: '加退选、更改课程组别、全/兼读身分及修读计划（本科生）',
  },
  {
    id: 'credit-transfer-t1',
    start: '2026-08-28',
    category: 'deadline',
    title: 'Last day for submission of UG credit transfer / course exemption applications',
    title_tc: '遞交本科學分轉移／豁免修讀申請截止日',
    title_sc: '递交本科学分转移／豁免修读申请截止日',
  },

  // ───────────────────────── SEP 2026 ─────────────────────────
  {
    id: 'term1-begin',
    start: '2026-09-01',
    category: 'term',
    title: 'Academic Year 2026-27 starts; Term 1 classes begin',
    title_tc: '2026-27 學年開始；第一學期上課',
    title_sc: '2026-27 学年开始；第一学期上课',
  },
  {
    id: 'late-reg-t1',
    start: '2026-09-07',
    category: 'deadline',
    title: 'Last day for late registration for UG students',
    title_tc: '本科生逾期註冊截止日',
    title_sc: '本科生逾期注册截止日',
  },
  {
    id: 'reg-slrs-t1',
    start: '2026-09-08',
    end: '2026-09-09',
    category: 'registration',
    title: 'Registration for Service-Learning and Research Scheme',
    title_tc: '服務研習及研究計劃註冊',
    title_sc: '服务研习及研究计划注册',
  },
  {
    id: 'reg-ilp-t1',
    start: '2026-09-14',
    end: '2026-09-17',
    category: 'registration',
    title: 'Registration for Integrated Learning Programme',
    title_tc: '綜合學習課程註冊',
    title_sc: '综合学习课程注册',
  },

  // ───────────────────────── OCT 2026 ─────────────────────────
  {
    id: 'tuition-new',
    start: '2026-10-09',
    category: 'deadline',
    title: 'Last day for tuition payment — new UG students',
    title_tc: '新生繳交學費截止日',
    title_sc: '新生缴交学费截止日',
  },
  {
    id: 'senate-1',
    start: '2026-10-12',
    category: 'event',
    title: '1st Senate Meeting',
    title_tc: '第一次教務會議',
    title_sc: '第一次教务会议',
  },

  // ───────────────────────── NOV 2026 ─────────────────────────
  {
    id: 'term1-end',
    start: '2026-11-30',
    category: 'term',
    title: 'Term 1 UG classes end',
    title_tc: '第一學期本科課堂結束',
    title_sc: '第一学期本科课堂结束',
  },

  // ───────────────────────── DEC 2026 ─────────────────────────
  {
    id: 'congregation',
    start: '2026-12-01',
    end: '2026-12-02',
    category: 'event',
    category2: 'holiday', // a ceremony (event) that also suspends classes (holiday)
    title: 'Congregation (classes suspended)',
    title_tc: '畢業典禮（停課）',
    title_sc: '毕业典礼（停课）',
  },
  {
    id: 'senate-2',
    start: '2026-12-07',
    category: 'event',
    title: '2nd Senate Meeting',
    title_tc: '第二次教務會議',
    title_sc: '第二次教务会议',
  },
  {
    id: 'exam-t1-1',
    start: '2026-12-08',
    end: '2026-12-12',
    category: 'exam',
    title: 'Term 1 UG examinations',
    title_tc: '第一學期本科考試',
    title_sc: '第一学期本科考试',
  },
  {
    id: 'exam-t1-2',
    start: '2026-12-14',
    end: '2026-12-19',
    category: 'exam',
    title: 'Term 1 UG examinations',
    title_tc: '第一學期本科考試',
    title_sc: '第一学期本科考试',
  },
  {
    id: 'exam-t1-reserve',
    start: '2026-12-21',
    category: 'exam',
    title: 'Reserved for exams postponed due to extenuating circumstances',
    title_tc: '預留作因特殊情況延期考試之用',
    title_sc: '预留作因特殊情况延期考试之用',
  },

  // ───────────────────────── JAN 2027 ─────────────────────────
  {
    id: 'adddrop-t2',
    start: '2027-01-05',
    end: '2027-01-14',
    category: 'addDrop',
    title: 'Course add/drop, change of course sections, full/part-time status & study programmes (UG)',
    title_tc: '加退選、更改課程組別、全/兼讀身分及修讀計劃（本科生）',
    title_sc: '加退选、更改课程组别、全/兼读身分及修读计划（本科生）',
  },
  {
    id: 'credit-transfer-t2',
    start: '2027-01-07',
    category: 'deadline',
    title: 'Last day for submission of UG credit transfer / course exemption applications',
    title_tc: '遞交本科學分轉移／豁免修讀申請截止日',
    title_sc: '递交本科学分转移／豁免修读申请截止日',
  },
  {
    id: 'term2-begin',
    start: '2027-01-08',
    category: 'term',
    title: 'Term 2 classes begin',
    title_tc: '第二學期上課',
    title_sc: '第二学期上课',
  },
  {
    id: 'late-reg-t2',
    start: '2027-01-14',
    category: 'deadline',
    title: 'Last day for late registration for UG students',
    title_tc: '本科生逾期註冊截止日',
    title_sc: '本科生逾期注册截止日',
  },
  {
    id: 'reg-slrs-t2a',
    start: '2027-01-15',
    category: 'registration',
    title: 'Registration for Service-Learning and Research Scheme',
    title_tc: '服務研習及研究計劃註冊',
    title_sc: '服务研习及研究计划注册',
  },
  {
    id: 'reg-slrs-t2b',
    start: '2027-01-18',
    category: 'registration',
    title: 'Registration for Service-Learning and Research Scheme',
    title_tc: '服務研習及研究計劃註冊',
    title_sc: '服务研习及研究计划注册',
  },
  {
    id: 'reg-ilp-t2',
    start: '2027-01-19',
    end: '2027-01-22',
    category: 'registration',
    title: 'Registration for Integrated Learning Programme',
    title_tc: '綜合學習課程註冊',
    title_sc: '综合学习课程注册',
  },

  // ───────────────────────── FEB 2027 ─────────────────────────
  {
    id: 'senate-3',
    start: '2027-02-01',
    category: 'event',
    title: '3rd Senate Meeting',
    title_tc: '第三次教務會議',
    title_sc: '第三次教务会议',
  },
  {
    id: 'cny',
    start: '2027-02-05',
    end: '2027-02-12',
    category: 'holiday',
    title: 'Chinese New Year Holidays (students)',
    title_tc: '農曆新年假期（學生）',
    title_sc: '农历新年假期（学生）',
  },
  {
    id: 'tuition-t2',
    start: '2027-02-15',
    category: 'deadline',
    title: 'Last day for tuition payment for Term 2 (UG)',
    title_tc: '第二學期本科生繳交學費截止日',
    title_sc: '第二学期本科生缴交学费截止日',
  },
  {
    id: 'sports-day',
    start: '2027-02-23',
    category: 'holiday',
    title: 'Sports Day (classes suspended)',
    title_tc: '陸運會（停課）',
    title_sc: '陆运会（停课）',
  },

  // ───────────────────────── MAR 2027 ─────────────────────────
  {
    id: 'senate-4',
    start: '2027-03-08',
    category: 'event',
    title: '4th Senate Meeting',
    title_tc: '第四次教務會議',
    title_sc: '第四次教务会议',
  },

  // ───────────────────────── APR 2027 ─────────────────────────
  {
    id: 'senate-5',
    start: '2027-04-19',
    category: 'event',
    title: '5th Senate Meeting',
    title_tc: '第五次教務會議',
    title_sc: '第五次教务会议',
  },
  {
    id: 'term2-end',
    start: '2027-04-20',
    category: 'term',
    title: 'Term 2 UG classes end',
    title_tc: '第二學期本科課堂結束',
    title_sc: '第二学期本科课堂结束',
  },
  {
    id: 'exam-t2-1',
    start: '2027-04-28',
    end: '2027-04-30',
    category: 'exam',
    title: 'Term 2 UG examinations',
    title_tc: '第二學期本科考試',
    title_sc: '第二学期本科考试',
  },

  // ───────────────────────── MAY 2027 ─────────────────────────
  {
    id: 'exam-t2-2',
    start: '2027-05-03',
    end: '2027-05-08',
    category: 'exam',
    title: 'Term 2 UG examinations',
    title_tc: '第二學期本科考試',
    title_sc: '第二学期本科考试',
  },
  {
    id: 'exam-t2-3',
    start: '2027-05-10',
    end: '2027-05-11',
    category: 'exam',
    title: 'Term 2 UG examinations',
    title_tc: '第二學期本科考試',
    title_sc: '第二学期本科考试',
  },
  {
    id: 'exam-t2-reserve',
    start: '2027-05-12',
    category: 'exam',
    title: 'Reserved for exams postponed due to extenuating circumstances',
    title_tc: '預留作因特殊情況延期考試之用',
    title_sc: '预留作因特殊情况延期考试之用',
  },
  {
    id: 'senate-6',
    start: '2027-05-24',
    category: 'event',
    title: '6th Senate Meeting',
    title_tc: '第六次教務會議',
    title_sc: '第六次教务会议',
  },

  // ───────────────────────── AUG 2027 ─────────────────────────
  {
    id: 'year-end',
    start: '2027-08-31',
    category: 'event',
    title: 'Academic Year 2026-27 ends',
    title_tc: '2026-27 學年結束',
    title_sc: '2026-27 学年结束',
  },

  // ──────────────── Course registration (Registry "Important Dates") ────────────────
  {
    id: 'reg-current-2023',
    start: '2026-07-21',
    category: 'registration',
    title: 'Online registration for current students, Terms 1 & 2 2026-27 (2023 intake or before)',
    title_tc: '在學學生網上註冊選課(2026-27 兩學期;2023 年或以前入學)',
    title_sc: '在校学生网上注册选课(2026-27 两学期;2023 年或以前入学)',
  },
  {
    id: 'reg-current-2024',
    start: '2026-07-22',
    category: 'registration',
    title: 'Online registration for current students, Terms 1 & 2 2026-27 (2024 intake)',
    title_tc: '在學學生網上註冊選課(2026-27 兩學期;2024 年入學)',
    title_sc: '在校学生网上注册选课(2026-27 两学期;2024 年入学)',
  },
  {
    id: 'reg-current-2025',
    start: '2026-07-23',
    category: 'registration',
    title: 'Online registration for current students, Terms 1 & 2 2026-27 (2025 intake)',
    title_tc: '在學學生網上註冊選課(2026-27 兩學期;2025 年入學)',
    title_sc: '在校学生网上注册选课(2026-27 两学期;2025 年入学)',
  },

  // ──────────── Assessment: Term 1 2025-26 (Registry "Important Dates") ────────────
  {
    id: 'assess-t1-2526-timetable',
    start: '2025-10-28',
    category: 'assessment',
    title: 'Publication of examination timetable (Term 1, 2025-26)',
    title_tc: '公布考試時間表(2025-26 第一學期)',
    title_sc: '公布考试时间表(2025-26 第一学期)',
  },
  {
    id: 'assess-t1-2526-grades',
    start: '2026-01-13',
    category: 'assessment',
    title: 'Release of grades, GPAs, academic probation & preliminary discontinuation/graduation information (Term 1, 2025-26)',
    title_tc: '公布成績、GPA、留校察看及初步退學／畢業資訊(2025-26 第一學期)',
    title_sc: '公布成绩、GPA、留校察看及初步退学／毕业资讯(2025-26 第一学期)',
  },
  {
    id: 'assess-t1-2526-appeals',
    start: '2026-01-13',
    end: '2026-01-27',
    category: 'assessment',
    title: 'Appeals for review of grades and reassessment (Term 1, 2025-26)',
    title_tc: '成績覆核及重新評核申請(2025-26 第一學期)',
    title_sc: '成绩复核及重新评核申请(2025-26 第一学期)',
  },
  {
    id: 'assess-t1-2526-confirmed',
    start: '2026-01-30',
    category: 'assessment',
    title: 'Release of confirmed discontinuation & graduation information (Term 1, 2025-26)',
    title_tc: '公布確定退學及畢業資訊(2025-26 第一學期)',
    title_sc: '公布确定退学及毕业资讯(2025-26 第一学期)',
  },
  {
    id: 'assess-t1-2526-disc-appeals',
    start: '2026-01-30',
    end: '2026-02-06',
    category: 'assessment',
    title: 'Appeals against the discontinuation of studies (Term 1, 2025-26)',
    title_tc: '退學決定上訴(2025-26 第一學期)',
    title_sc: '退学决定上诉(2025-26 第一学期)',
  },
  {
    id: 'assess-t1-2526-dap',
    start: '2026-03-02',
    category: 'assessment',
    title: 'Discontinuation Appeals Panel (DAP) meeting (Term 1, 2025-26)',
    title_tc: '退學上訴委員會(DAP)會議(2025-26 第一學期)',
    title_sc: '退学上诉委员会(DAP)会议(2025-26 第一学期)',
  },

  // ──────────── Assessment: Term 2 2025-26 (Registry "Important Dates") ────────────
  {
    id: 'assess-t2-2526-timetable',
    start: '2026-03-17',
    category: 'assessment',
    title: 'Publication of examination timetable (Term 2, 2025-26)',
    title_tc: '公布考試時間表(2025-26 第二學期)',
    title_sc: '公布考试时间表(2025-26 第二学期)',
  },
  {
    id: 'assess-t2-2526-grades',
    start: '2026-06-03',
    category: 'assessment',
    title: 'Release of grades, GPAs, academic probation & preliminary discontinuation/graduation information (Term 2, 2025-26)',
    title_tc: '公布成績、GPA、留校察看及初步退學／畢業資訊(2025-26 第二學期)',
    title_sc: '公布成绩、GPA、留校察看及初步退学／毕业资讯(2025-26 第二学期)',
  },
  {
    id: 'assess-t2-2526-appeals',
    start: '2026-06-03',
    end: '2026-06-17',
    category: 'assessment',
    title: 'Appeals for review of grades and reassessment (Term 2, 2025-26)',
    title_tc: '成績覆核及重新評核申請(2025-26 第二學期)',
    title_sc: '成绩复核及重新评核申请(2025-26 第二学期)',
  },
  {
    id: 'assess-t2-2526-confirmed',
    start: '2026-06-25',
    category: 'assessment',
    title: 'Release of confirmed discontinuation & graduation information (Term 2, 2025-26)',
    title_tc: '公布確定退學及畢業資訊(2025-26 第二學期)',
    title_sc: '公布确定退学及毕业资讯(2025-26 第二学期)',
  },
  {
    id: 'assess-t2-2526-disc-appeals',
    start: '2026-06-26',
    end: '2026-07-02',
    category: 'assessment',
    title: 'Appeals against the discontinuation of studies (Term 2, 2025-26)',
    title_tc: '退學決定上訴(2025-26 第二學期)',
    title_sc: '退学决定上诉(2025-26 第二学期)',
  },
  {
    id: 'assess-t2-2526-dap',
    start: '2026-07-22',
    category: 'assessment',
    title: 'Discontinuation Appeals Panel (DAP) meeting (Term 2, 2025-26)',
    title_tc: '退學上訴委員會(DAP)會議(2025-26 第二學期)',
    title_sc: '退学上诉委员会(DAP)会议(2025-26 第二学期)',
  },

  // ────────── Assessment: Summer Term 2025-26 (Registry "Important Dates") ──────────
  // Summer-term examinations (if any) are arranged directly by the course-offering
  // units, so there is no fixed exam period to show here.
  {
    id: 'assess-su-2526-grades',
    start: '2026-07-20',
    category: 'assessment',
    title: 'Release of grades, GPAs, academic probation & preliminary discontinuation/graduation information (Summer Term, 2025-26)',
    title_tc: '公布成績、GPA、留校察看及初步退學／畢業資訊(2025-26 夏季學期)',
    title_sc: '公布成绩、GPA、留校察看及初步退学／毕业资讯(2025-26 夏季学期)',
  },
  {
    id: 'assess-su-2526-appeals',
    start: '2026-07-20',
    end: '2026-08-03',
    category: 'assessment',
    title: 'Appeals for review of grades and reassessment (Summer Term, 2025-26)',
    title_tc: '成績覆核及重新評核申請(2025-26 夏季學期)',
    title_sc: '成绩复核及重新评核申请(2025-26 夏季学期)',
  },
  {
    id: 'assess-su-2526-confirmed',
    start: '2026-08-05',
    category: 'assessment',
    title: 'Release of confirmed discontinuation & graduation information (Summer Term, 2025-26)',
    title_tc: '公布確定退學及畢業資訊(2025-26 夏季學期)',
    title_sc: '公布确定退学及毕业资讯(2025-26 夏季学期)',
  },
  {
    id: 'assess-su-2526-disc-appeals',
    start: '2026-08-06',
    end: '2026-08-12',
    category: 'assessment',
    title: 'Appeals against the discontinuation of studies (Summer Term, 2025-26)',
    title_tc: '退學決定上訴(2025-26 夏季學期)',
    title_sc: '退学决定上诉(2025-26 夏季学期)',
  },
  {
    id: 'assess-su-2526-dap',
    start: '2026-08-25',
    category: 'assessment',
    title: 'Discontinuation Appeals Panel (DAP) meeting (Summer Term, 2025-26)',
    title_tc: '退學上訴委員會(DAP)會議(2025-26 夏季學期)',
    title_sc: '退学上诉委员会(DAP)会议(2025-26 夏季学期)',
  },

  // ────────── Graduation & degree conferment 2025-26 (Registry "Important Dates") ──────────
  // Cut-off dates are also the deadline for updating English/Chinese names for
  // graduation certificates. The "release of graduation information" dates for the
  // 1st–3rd exercises coincide with the confirmed discontinuation/graduation
  // releases above, so they are not duplicated here.
  {
    id: 'grad-2526-cutoff-1',
    start: '2026-01-05',
    category: 'graduation',
    title: 'Cut-off date for graduation evaluation — 1st conferment exercise, 2025-26 (Term 1 graduates)',
    title_tc: '畢業評估截止日 — 2025-26 第一次學位頒授(第一學期畢業)',
    title_sc: '毕业评估截止日 — 2025-26 第一次学位颁授(第一学期毕业)',
  },
  {
    id: 'grad-2526-confer-1',
    start: '2026-03-31',
    category: 'graduation',
    title: 'Degree conferment & issuance of graduation certificates — 1st conferment exercise, 2025-26',
    title_tc: '學位頒授及發出畢業證書 — 2025-26 第一次學位頒授',
    title_sc: '学位颁授及发出毕业证书 — 2025-26 第一次学位颁授',
  },
  {
    id: 'grad-2526-cutoff-2',
    start: '2026-05-26',
    category: 'graduation',
    title: 'Cut-off date for graduation evaluation — 2nd conferment exercise, 2025-26 (Term 2 graduates)',
    title_tc: '畢業評估截止日 — 2025-26 第二次學位頒授(第二學期畢業)',
    title_sc: '毕业评估截止日 — 2025-26 第二次学位颁授(第二学期毕业)',
  },
  {
    id: 'grad-2526-confer-2',
    start: '2026-07-31',
    category: 'graduation',
    title: 'Degree conferment & issuance of graduation certificates — 2nd conferment exercise, 2025-26',
    title_tc: '學位頒授及發出畢業證書 — 2025-26 第二次學位頒授',
    title_sc: '学位颁授及发出毕业证书 — 2025-26 第二次学位颁授',
  },
  {
    id: 'grad-2526-cutoff-3',
    start: '2026-07-13',
    category: 'graduation',
    title: 'Cut-off date for graduation evaluation — 3rd conferment exercise, 2025-26 (Summer Term graduates)',
    title_tc: '畢業評估截止日 — 2025-26 第三次學位頒授(夏季學期畢業)',
    title_sc: '毕业评估截止日 — 2025-26 第三次学位颁授(夏季学期毕业)',
  },
  {
    id: 'grad-2526-confer-3',
    start: '2026-08-31',
    category: 'graduation',
    title: 'Degree conferment & issuance of graduation certificates — 3rd conferment exercise, 2025-26',
    title_tc: '學位頒授及發出畢業證書 — 2025-26 第三次學位頒授',
    title_sc: '学位颁授及发出毕业证书 — 2025-26 第三次学位颁授',
  },
  {
    id: 'grad-2526-cutoff-4',
    start: '2026-09-10',
    category: 'graduation',
    title: 'Cut-off date for graduation evaluation — 4th conferment exercise, 2025-26 (Summer Term graduates)',
    title_tc: '畢業評估截止日 — 2025-26 第四次學位頒授(夏季學期畢業)',
    title_sc: '毕业评估截止日 — 2025-26 第四次学位颁授(夏季学期毕业)',
  },
  {
    id: 'grad-2526-release-4',
    start: '2026-10-06',
    category: 'graduation',
    title: 'Release of graduation information — 4th conferment exercise, 2025-26',
    title_tc: '公布畢業資訊 — 2025-26 第四次學位頒授',
    title_sc: '公布毕业资讯 — 2025-26 第四次学位颁授',
  },
  {
    id: 'grad-2526-confer-4',
    start: '2026-11-15',
    category: 'graduation',
    title: 'Degree conferment & issuance of graduation certificates — 4th conferment exercise, 2025-26',
    title_tc: '學位頒授及發出畢業證書 — 2025-26 第四次學位頒授',
    title_sc: '学位颁授及发出毕业证书 — 2025-26 第四次学位颁授',
  },

  // ────────── Graduation & degree conferment 2026-27 (Registry "Important Dates") ──────────
  {
    id: 'grad-2627-cutoff-1',
    start: '2027-01-04',
    category: 'graduation',
    title: 'Cut-off date for graduation evaluation — 1st conferment exercise, 2026-27 (Term 1 graduates)',
    title_tc: '畢業評估截止日 — 2026-27 第一次學位頒授(第一學期畢業)',
    title_sc: '毕业评估截止日 — 2026-27 第一次学位颁授(第一学期毕业)',
  },
  {
    id: 'grad-2627-release-1',
    start: '2027-02-02',
    category: 'graduation',
    title: 'Release of graduation information — 1st conferment exercise, 2026-27',
    title_tc: '公布畢業資訊 — 2026-27 第一次學位頒授',
    title_sc: '公布毕业资讯 — 2026-27 第一次学位颁授',
  },
  {
    id: 'grad-2627-confer-1',
    start: '2027-03-31',
    category: 'graduation',
    title: 'Degree conferment & issuance of graduation certificates — 1st conferment exercise, 2026-27',
    title_tc: '學位頒授及發出畢業證書 — 2026-27 第一次學位頒授',
    title_sc: '学位颁授及发出毕业证书 — 2026-27 第一次学位颁授',
  },
  {
    id: 'grad-2627-cutoff-2',
    start: '2027-05-25',
    category: 'graduation',
    title: 'Cut-off date for graduation evaluation — 2nd conferment exercise, 2026-27 (Term 2 graduates)',
    title_tc: '畢業評估截止日 — 2026-27 第二次學位頒授(第二學期畢業)',
    title_sc: '毕业评估截止日 — 2026-27 第二次学位颁授(第二学期毕业)',
  },
  {
    id: 'grad-2627-release-2',
    start: '2027-06-29',
    category: 'graduation',
    title: 'Release of graduation information — 2nd conferment exercise, 2026-27',
    title_tc: '公布畢業資訊 — 2026-27 第二次學位頒授',
    title_sc: '公布毕业资讯 — 2026-27 第二次学位颁授',
  },
  {
    id: 'grad-2627-confer-2',
    start: '2027-07-31',
    category: 'graduation',
    title: 'Degree conferment & issuance of graduation certificates — 2nd conferment exercise, 2026-27',
    title_tc: '學位頒授及發出畢業證書 — 2026-27 第二次學位頒授',
    title_sc: '学位颁授及发出毕业证书 — 2026-27 第二次学位颁授',
  },

  // ─────────────────── Hong Kong general (public) holidays ───────────────────
  // Official dates from the HKSAR Government gazette (gov.hk), for the dates that
  // fall within the 2026-27 academic year. Classified as `holiday` (purple).
  {
    id: 'hk-mid-autumn',
    start: '2026-09-26',
    category: 'holiday',
    title: 'Day following Chinese Mid-Autumn Festival',
    title_tc: '中秋節翌日',
    title_sc: '中秋节翌日',
  },
  {
    id: 'hk-national-day',
    start: '2026-10-01',
    category: 'holiday',
    title: 'National Day',
    title_tc: '國慶日',
    title_sc: '国庆日',
  },
  {
    id: 'hk-chung-yeung',
    start: '2026-10-19',
    category: 'holiday',
    title: 'Day following Chung Yeung Festival',
    title_tc: '重陽節翌日',
    title_sc: '重阳节翌日',
  },
  {
    id: 'hk-christmas',
    start: '2026-12-25',
    category: 'holiday',
    title: 'Christmas Day',
    title_tc: '聖誕節',
    title_sc: '圣诞节',
  },
  {
    id: 'hk-christmas-after',
    start: '2026-12-26',
    category: 'holiday',
    title: 'First weekday after Christmas Day',
    title_tc: '聖誕節後第一個周日',
    title_sc: '圣诞节后第一个周日',
  },
  {
    id: 'hk-new-year',
    start: '2027-01-01',
    category: 'holiday',
    title: "New Year's Day",
    title_tc: '一月一日',
    title_sc: '一月一日',
  },
  {
    id: 'hk-cny-1',
    start: '2027-02-06',
    category: 'holiday',
    title: "Lunar New Year's Day",
    title_tc: '農曆年初一',
    title_sc: '农历年初一',
  },
  {
    id: 'hk-cny-3',
    start: '2027-02-08',
    category: 'holiday',
    title: 'Third day of Lunar New Year',
    title_tc: '農曆年初三',
    title_sc: '农历年初三',
  },
  {
    id: 'hk-cny-4',
    start: '2027-02-09',
    category: 'holiday',
    title: 'Fourth day of Lunar New Year',
    title_tc: '農曆年初四',
    title_sc: '农历年初四',
  },
  {
    id: 'hk-good-friday',
    start: '2027-03-26',
    category: 'holiday',
    title: 'Good Friday',
    title_tc: '耶穌受難節',
    title_sc: '耶稣受难节',
  },
  {
    id: 'hk-good-friday-after',
    start: '2027-03-27',
    category: 'holiday',
    title: 'Day following Good Friday',
    title_tc: '耶穌受難節翌日',
    title_sc: '耶稣受难节翌日',
  },
  {
    id: 'hk-easter-monday',
    start: '2027-03-29',
    category: 'holiday',
    title: 'Easter Monday',
    title_tc: '復活節星期一',
    title_sc: '复活节星期一',
  },
  {
    id: 'hk-ching-ming',
    start: '2027-04-05',
    category: 'holiday',
    title: 'Ching Ming Festival',
    title_tc: '清明節',
    title_sc: '清明节',
  },
  {
    id: 'hk-labour-day',
    start: '2027-05-01',
    category: 'holiday',
    title: 'Labour Day',
    title_tc: '勞動節',
    title_sc: '劳动节',
  },
  {
    id: 'hk-buddha',
    start: '2027-05-13',
    category: 'holiday',
    title: 'Birthday of the Buddha',
    title_tc: '佛誕',
    title_sc: '佛诞',
  },
  {
    id: 'hk-tuen-ng',
    start: '2027-06-09',
    category: 'holiday',
    title: 'Tuen Ng Festival',
    title_tc: '端午節',
    title_sc: '端午节',
  },
  {
    id: 'hk-hksar-day',
    start: '2027-07-01',
    category: 'holiday',
    title: 'Hong Kong Special Administrative Region Establishment Day',
    title_tc: '香港特別行政區成立紀念日',
    title_sc: '香港特别行政区成立纪念日',
  },
];
