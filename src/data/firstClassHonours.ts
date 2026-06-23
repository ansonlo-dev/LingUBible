// Auto-generated from "Graduate Lists.xlsx" (Lingnan University first-class honours graduate statistics).
// Static reference data — to add a future cohort, append the year to HONOURS_YEARS,
// add its figures under each programme's `years`, and add HONOURS_SUMMARY / HONOURS_SOURCES entries.

/** Cohorts present in the dataset, ascending. Add future years here. */
export const HONOURS_YEARS = [2024, 2025] as const;
export type HonoursYear = (typeof HONOURS_YEARS)[number];

export interface YearStat {
  /** Total graduates in the cohort. */
  total: number | null;
  /** Graduates awarded First Class Honours. */
  first: number | null;
  /** First-class share (0–1). */
  pct: number | null;
}

export interface HonoursProgrammeStat {
  en: string;
  tc: string;
  sc: string;
  /** Per-cohort figures, keyed by year. */
  years: Record<number, YearStat>;
}

export const HONOURS_PROGRAMME_STATS: HonoursProgrammeStat[] = [
  {
    en: "Bachelor of Arts (Honours) in Animation and Digital Arts",
    tc: "動畫及數碼藝術（榮譽）文學士",
    sc: "动画及数码艺术（荣誉）文学士",
    years: {
      2024: { total: 10, first: 1, pct: 0.1 },
      2025: { total: 25, first: 1, pct: 0.04 },
    },
  },
  {
    en: "Bachelor of Arts (Honours) in Chinese",
    tc: "中文（榮譽）文學士",
    sc: "中文（荣誉）文学士",
    years: {
      2024: { total: 66, first: 8, pct: 0.121212 },
      2025: { total: 84, first: 9, pct: 0.107143 },
    },
  },
  {
    en: "Bachelor of Arts (Honours) in Contemporary English Studies",
    tc: "當代英語語言文學課程（榮譽）文學士",
    sc: "当代英语语言文学课程（荣誉）文学士",
    years: {
      2024: { total: 29, first: 2, pct: 0.068966 },
      2025: { total: 24, first: 5, pct: 0.208333 },
    },
  },
  {
    en: "Bachelor of Arts (Honours) in Creative Media Industries",
    tc: "創意媒體產業（榮譽）文學士",
    sc: "创意媒体产业（荣誉）文学士",
    years: {
      2024: { total: 11, first: 0, pct: 0 },
      2025: { total: 16, first: 5, pct: 0.3125 },
    },
  },
  {
    en: "Bachelor of Arts (Honours) in Cultural Studies",
    tc: "文化研究（榮譽）文學士",
    sc: "文化研究（荣誉）文学士",
    years: {
      2024: { total: 28, first: 5, pct: 0.178571 },
      2025: { total: 28, first: 3, pct: 0.107143 },
    },
  },
  {
    en: "Bachelor of Arts (Honours) in Global Liberal Arts",
    tc: "環球博雅教育（榮譽）文學士",
    sc: "环球博雅教育（荣誉）文学士",
    years: {
      2024: { total: null, first: null, pct: null },
      2025: { total: 3, first: 0, pct: 0 },
    },
  },
  {
    en: "Bachelor of Arts (Honours) in History",
    tc: "歷史（榮譽）文學士",
    sc: "历史（荣誉）文学士",
    years: {
      2024: { total: 30, first: 6, pct: 0.2 },
      2025: { total: 35, first: 5, pct: 0.142857 },
    },
  },
  {
    en: "Bachelor of Arts (Honours) in Philosophy",
    tc: "哲學（榮譽）文學士",
    sc: "哲学（荣誉）文学士",
    years: {
      2024: { total: 28, first: 3, pct: 0.107143 },
      2025: { total: 21, first: 2, pct: 0.095238 },
    },
  },
  {
    en: "Bachelor of Arts (Honours) in Translation",
    tc: "翻譯（榮譽）文學士",
    sc: "翻译（荣誉）文学士",
    years: {
      2024: { total: 55, first: 4, pct: 0.072727 },
      2025: { total: 62, first: 8, pct: 0.129032 },
    },
  },
  {
    en: "Bachelor of Arts (Honours) in Visual Studies",
    tc: "視覺研究（榮譽）文學士",
    sc: "视觉研究（荣誉）文学士",
    years: {
      2024: { total: 24, first: 2, pct: 0.083333 },
      2025: { total: 25, first: 4, pct: 0.16 },
    },
  },
  {
    en: "Bachelor of Business Administration (Honours) in Accounting",
    tc: "工商管理（榮譽）學士 - 會計",
    sc: "工商管理（荣誉）学士 - 会计",
    years: {
      2024: { total: 43, first: 5, pct: 0.116279 },
      2025: { total: 48, first: 6, pct: 0.125 },
    },
  },
  {
    en: "Bachelor of Business Administration (Honours) in Digital Business",
    tc: "工商管理（榮譽）學士 - 數碼商業",
    sc: "工商管理（荣誉）学士 - 数码商业",
    years: {
      2024: { total: 19, first: 2, pct: 0.105263 },
      2025: { total: 23, first: 2, pct: 0.086957 },
    },
  },
  {
    en: "Bachelor of Business Administration (Honours) in e-Business",
    tc: "工商管理（榮譽）學士 - 電子商務",
    sc: "工商管理（荣誉）学士 - 电子商务",
    years: {
      2024: { total: 6, first: 1, pct: 0.166667 },
      2025: { total: 1, first: 0, pct: 0 },
    },
  },
  {
    en: "Bachelor of Business Administration (Honours) in Finance",
    tc: "工商管理（榮譽）學士 - 財務",
    sc: "工商管理（荣誉）学士 - 财务",
    years: {
      2024: { total: 24, first: 6, pct: 0.25 },
      2025: { total: 37, first: 7, pct: 0.189189 },
    },
  },
  {
    en: "Bachelor of Business Administration (Honours) in Human Resource Management",
    tc: "工商管理（榮譽）學士 - 人力資源管理",
    sc: "工商管理（荣誉）学士 - 人力资源管理",
    years: {
      2024: { total: 25, first: 1, pct: 0.04 },
      2025: { total: 25, first: 3, pct: 0.12 },
    },
  },
  {
    en: "Bachelor of Business Administration (Honours) in Marketing",
    tc: "工商管理（榮譽）學士 - 市場學",
    sc: "工商管理（荣誉）学士 - 市场学",
    years: {
      2024: { total: 48, first: 5, pct: 0.104167 },
      2025: { total: 58, first: 3, pct: 0.051724 },
    },
  },
  {
    en: "Bachelor of Business Administration (Honours) in Risk and Insurance Management",
    tc: "工商管理（榮譽）學士 - 風險及保險管理",
    sc: "工商管理（荣誉）学士 - 风险及保险管理",
    years: {
      2024: { total: 37, first: 9, pct: 0.243243 },
      2025: { total: 47, first: 7, pct: 0.148936 },
    },
  },
  {
    en: "Bachelor of Liberal Arts (Honours) in Global Development and Sustainability",
    tc: "環球可持續發展（榮譽）博雅學士",
    sc: "环球可持续发展（荣誉）博雅学士",
    years: {
      2024: { total: 22, first: 7, pct: 0.318182 },
      2025: { total: 13, first: 4, pct: 0.307692 },
    },
  },
  {
    en: "Bachelor of Science (Honours) in Data Science",
    tc: "數據科學（榮譽）理學士",
    sc: "数据科学（荣誉）理学士",
    years: {
      2024: { total: 21, first: 3, pct: 0.142857 },
      2025: { total: 39, first: 5, pct: 0.128205 },
    },
  },
  {
    en: "Bachelor of Social Sciences (Honours) in Business Psychology",
    tc: "商業心理學（榮譽）社會科學學士",
    sc: "商业心理学（荣誉）社会科学学士",
    years: {
      2024: { total: 31, first: 6, pct: 0.193548 },
      2025: { total: 32, first: 3, pct: 0.09375 },
    },
  },
  {
    en: "Bachelor of Social Sciences (Honours) in Economics",
    tc: "社會科學（榮譽）學士 - 經濟學",
    sc: "社会科学（荣誉）学士 - 经济学",
    years: {
      2024: { total: 21, first: 1, pct: 0.047619 },
      2025: { total: 23, first: 5, pct: 0.217391 },
    },
  },
  {
    en: "Bachelor of Social Sciences (Honours) in Government and International Affairs",
    tc: "社會科學（榮譽）學士 - 政府與國際事務學",
    sc: "社会科学（荣誉）学士 - 政府与国际事务学",
    years: {
      2024: { total: 14, first: 1, pct: 0.071429 },
      2025: { total: 24, first: 2, pct: 0.083333 },
    },
  },
  {
    en: "Bachelor of Social Sciences (Honours) in Health and Social Services Management",
    tc: "社會科學（榮譽）學士 - 健康及社會服務管理",
    sc: "社会科学（荣誉）学士 - 健康及社会服务管理",
    years: {
      2024: { total: 14, first: 1, pct: 0.071429 },
      2025: { total: 19, first: 1, pct: 0.052632 },
    },
  },
  {
    en: "Bachelor of Social Sciences (Honours) in International Economy and Politics",
    tc: "社會科學（榮譽）學士 - 國際經濟與政治",
    sc: "社会科学（荣誉）学士 - 国际经济与政治",
    years: {
      2024: { total: 9, first: 0, pct: 0 },
      2025: { total: 4, first: 1, pct: 0.25 },
    },
  },
  {
    en: "Bachelor of Social Sciences (Honours) in Political Science",
    tc: "社會科學（榮譽）學士 - 政治學",
    sc: "社会科学（荣誉）学士 - 政治学",
    years: {
      2024: { total: 4, first: 3, pct: 0.75 },
      2025: { total: 1, first: 0, pct: 0 },
    },
  },
  {
    en: "Bachelor of Social Sciences (Honours) in Psychology",
    tc: "社會科學（榮譽）學士 - 心理學",
    sc: "社会科学（荣誉）学士 - 心理学",
    years: {
      2024: { total: 43, first: 8, pct: 0.186047 },
      2025: { total: 56, first: 11, pct: 0.196429 },
    },
  },
  {
    en: "Bachelor of Social Sciences (Honours) in Public Management and Smart Governance",
    tc: "公共及智慧管理（榮譽）社會科學學士",
    sc: "公共及智慧管理（荣誉）社会科学学士",
    years: {
      2024: { total: 42, first: 4, pct: 0.095238 },
      2025: { total: 53, first: 7, pct: 0.132075 },
    },
  },
  {
    en: "Bachelor of Social Sciences (Honours) in Social and Public Policy Studies",
    tc: "社會科學（榮譽）學士 - 社會及公共政策研究",
    sc: "社会科学（荣誉）学士 - 社会及公共政策研究",
    years: {
      2024: { total: 27, first: 6, pct: 0.222222 },
      2025: { total: 24, first: 3, pct: 0.125 },
    },
  },
  {
    en: "Bachelor of Social Sciences (Honours) in Sociology",
    tc: "社會科學（榮譽）學士 - 社會學",
    sc: "社会科学（荣誉）学士 - 社会学",
    years: {
      2024: { total: 33, first: 7, pct: 0.212121 },
      2025: { total: 35, first: 4, pct: 0.114286 },
    },
  },
  {
    en: "Bachelor of Social Sciences (Honours) in Sports Coaching and Event Management",
    tc: "運動教練學及盛事管理（榮譽）社會科學學士",
    sc: "运动教练学及盛事管理（荣誉）社会科学学士",
    years: {
      2024: { total: 6, first: 2, pct: 0.333333 },
      2025: { total: 15, first: 3, pct: 0.2 },
    },
  },
];

/** University-wide totals per cohort. */
export const HONOURS_SUMMARY: Record<number, { total: number; first: number; pct: number }> = {
  2024: { total: 770, first: 109, pct: 0.141558 },
  2025: { total: 900, first: 119, pct: 0.132222 },
};

/** Source document for each cohort, shown as a citation. */
export const HONOURS_SOURCES: Record<number, { en: string; tc: string; sc: string }> = {
  2024: { en: 'Graduate List 2024', tc: '2024年畢業生名單', sc: '2024年毕业生名单' },
  2025: { en: 'Graduate List 2025', tc: '2025年畢業生名單', sc: '2025年毕业生名单' },
};
