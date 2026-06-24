// Academic Calendar 2026-27 (Lingnan University)
// Source: official ACADEMIC CALENDAR 2026-27 PDF.
// Events are all-day / multi-day. Dates are ISO "YYYY-MM-DD" (local, HK time).
// `end` is inclusive; omit it for single-day events.

export type CalendarCategory =
  | 'term' // Term classes begin / end (major milestones)
  | 'exam' // Examination periods
  | 'holiday' // General holidays & class suspensions
  | 'addDrop' // Add/drop, change of course sections period
  | 'registration' // Registration windows
  | 'deadline' // Payment / submission / late-registration deadlines
  | 'event'; // Senate meetings, orientation, congregation, major events

export interface AcademicEvent {
  id: string;
  start: string; // inclusive
  end?: string; // inclusive; absent → single day
  category: CalendarCategory;
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
  'event',
];

export const ACADEMIC_YEAR_LABEL = '2026-27';

// First day of Term 1 — used as the calendar's default landing month.
export const TERM_START_DATE = '2026-09-01';

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
];
