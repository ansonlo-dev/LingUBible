/**
 * 學期日期資料快取。
 * 由資料庫 Terms 表的 start_date / end_date 填入（見 CourseService.getAllTerms），
 * 讓 getCurrentTermCode() 能以實際學期日期判斷「當前學期」，而非僅靠月份推估。
 */
interface TermDateInfo {
  term_code: string;
  start_date: string;
  end_date: string;
}

const TERM_DATES_STORAGE_KEY = 'lingubible_term_dates_v1';

// 模組載入時先從 localStorage 還原，讓回訪使用者在首次 render 即可用資料庫日期判斷當前學期
let cachedTermDates: TermDateInfo[] | null = (() => {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(TERM_DATES_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
})();

/**
 * 寫入學期日期快取（由資料層在取得 Terms 後呼叫），並寫穿至 localStorage。
 */
export function setTermDates(terms: Array<{ term_code?: string; start_date?: string; end_date?: string }>): void {
  const valid = (terms || [])
    .filter(t => t && t.term_code && t.start_date && t.end_date)
    .map(t => ({ term_code: t.term_code as string, start_date: t.start_date as string, end_date: t.end_date as string }));
  if (valid.length === 0) return;
  // 以 term_code 為鍵合併，避免「只取部分學期」的呼叫覆蓋掉較完整的快取
  const merged = new Map<string, TermDateInfo>();
  for (const t of cachedTermDates || []) merged.set(t.term_code, t);
  for (const t of valid) merged.set(t.term_code, t);
  cachedTermDates = Array.from(merged.values());
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TERM_DATES_STORAGE_KEY, JSON.stringify(cachedTermDates));
    }
  } catch {
    // 忽略 localStorage 寫入失敗（無痕模式 / 配額），快取仍存在於記憶體
  }
}

/**
 * 依資料庫的 start_date / end_date 找出包含指定日期的學期代碼。
 * 找不到（資料未載入或日期落在學期之間的空檔）時回傳 null。
 */
function getCurrentTermCodeFromData(date: Date = new Date()): string | null {
  if (!cachedTermDates || cachedTermDates.length === 0) return null;
  const now = date.getTime();
  for (const term of cachedTermDates) {
    const start = new Date(term.start_date).getTime();
    // 以該日 23:59:59.999 為界，讓 end_date 當天仍算在學期內
    const end = new Date(term.end_date).getTime() + (24 * 60 * 60 * 1000 - 1);
    if (!Number.isNaN(start) && !Number.isNaN(end) && now >= start && now <= end) {
      return term.term_code;
    }
  }
  return null;
}

/**
 * 判斷當前日期屬於哪個學期。
 * 優先使用資料庫 Terms 表的實際日期區間；資料尚未載入時退回以月份推估。
 */
export function getCurrentTermCode(): string {
  const fromData = getCurrentTermCodeFromData();
  if (fromData) return fromData;

  // 後備方案：資料未載入時以月份推估（與資料庫的學年命名一致）
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // getMonth() 返回 0-11，需要加1

  // 嶺南大學學期安排：
  // Term 1: 9月-12月 (對應學年的第一學期)
  // Term 2: 1月-5月 (對應學年的第二學期)
  // Summer: 6月-8月 (暑期學期，較少開設課程)

  // 注意：term_code 後綴與資料庫一致（T1 / T2 / S）
  if (month >= 9 && month <= 12) {
    // 9-12月屬於當年的 Term 1
    return `${year}-T1`;
  } else if (month >= 1 && month <= 5) {
    // 1-5月屬於上一年開始的學年的 Term 2
    return `${year - 1}-T2`;
  } else {
    // 6-8月屬於暑期。暑期學期屬於「前一年9月開始」的學年，
    // 與 Term 2 一樣以該學年的起始年份命名（例如 2026 年 6-8 月屬於 2025-26 學年）
    return `${year - 1}-S`;
  }
}

/**
 * 檢查給定的學期代碼是否為當前學期
 */
export function isCurrentTerm(termCode: string): boolean {
  return termCode === getCurrentTermCode();
}

/**
 * 獲取當前學期的顯示名稱
 */
export function getCurrentTermName(): string {
  const termCode = getCurrentTermCode();
  return getTermDisplayName(termCode);
}

/**
 * 將學期代碼轉換為顯示名稱
 * 支援多語言和不同的學期格式
 */
export function getTermDisplayName(termCode: string, t?: any): string {
  // 回退到英文顯示邏輯
  const parts = termCode.split('-');
  if (parts.length !== 2) {
    return termCode; // 如果格式不正確，返回原始代碼
  }
  
  const year = parts[0];
  const term = parts[1];
  
  // 統一使用學年格式 (YYYY-YY) 以保持一致性
  const startYear = parseInt(year);
  const endYearShort = (startYear + 1).toString().slice(-2);
  const academicYear = `${year}-${endYearShort}`;
  
  switch (term) {
    case 'T1':
      return `${academicYear}, Term 1`;
    case 'T2':
      return `${academicYear}, Term 2`;
    case 'S':  // 處理數據庫中的 S 格式
    case 'Summer':
      return `${academicYear}, Summer Term`;
    default:
      return termCode;
  }
}

/**
 * 將學期代碼解析為可比較的時序值。
 * 同一學年內的順序：Term 1 → Term 2 → Summer（暑期為該學年最晚的學期）。
 */
function getTermSortKey(termCode: string): number {
  const parts = (termCode || '').split('-');
  if (parts.length !== 2) return -Infinity;

  const year = parseInt(parts[0]);
  if (Number.isNaN(year)) return -Infinity;

  let termOrder = 0;
  switch (parts[1]) {
    case 'T1':
      termOrder = 1;
      break;
    case 'T2':
      termOrder = 2;
      break;
    case 'S':
    case 'Summer':
      termOrder = 3;
      break;
  }

  return year * 10 + termOrder;
}

/**
 * 以時序（新到舊）比較兩個學期代碼。
 * 注意：不可用字串排序，因為 'S' < 'T'，會把暑期錯排在 Term 1/2 之後，
 * 但暑期其實是該學年最晚的學期，應排在 Term 2 之前（更新）。
 */
export function compareTermCodesDesc(a: string, b: string): number {
  return getTermSortKey(b) - getTermSortKey(a);
}

/**
 * 確定學期狀態（當前、過去或未來）
 */
export function getTermStatus(termCode: string): 'current' | 'past' | 'future' {
  const currentTermCode = getCurrentTermCode();
  
  if (termCode === currentTermCode) {
    return 'current';
  }
  
  // Parse term codes to compare chronologically
  const parseTermCode = (code: string): { year: number; termOrder: number } => {
    const parts = code.split('-');
    if (parts.length !== 2) {
      return { year: 0, termOrder: 0 };
    }
    
    const year = parseInt(parts[0]);
    const term = parts[1];
    
    // Define term order within an academic year
    let termOrder = 0;
    switch (term) {
      case 'T1':
        termOrder = 1;
        break;
      case 'T2':
        termOrder = 2;
        break;
      case 'S':  // 處理數據庫中的 S 格式
      case 'Summer':
        termOrder = 3;
        break;
    }
    
    return { year, termOrder };
  };
  
  const current = parseTermCode(currentTermCode);
  const target = parseTermCode(termCode);
  
  // Compare by year first, then by term order
  if (target.year < current.year || (target.year === current.year && target.termOrder < current.termOrder)) {
    return 'past';
  } else if (target.year > current.year || (target.year === current.year && target.termOrder > current.termOrder)) {
    return 'future';
  }
  
  return 'current'; // fallback
} 