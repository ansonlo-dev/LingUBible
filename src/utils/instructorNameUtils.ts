/**
 * 合併講師姓名處理工具
 *
 * `teaching_records.instructor_name` 欄位可能包含「多位共同授課講師」，
 * 以官方課程表的格式用 " / " 分隔，例如：
 *   "CHEUNG Yu Hin Ray / HO Yuen Wan"
 *   "LUN Miu Chi / YEUNG Wai Lan Victoria"
 *
 * 由於 `instructors` 集合只存個別講師的檔案（name / name_tc / name_sc 等），
 * 合併字串無法直接對應到單一講師檔案。因此凡是涉及「對應講師檔案、
 * 聚合統計、配對某位講師是否任教/被評」的地方，都必須先把合併字串拆成個別姓名。
 *
 * 設計原則：
 * - 顯示時：拆成個別講師，各自可點擊。
 * - 配對時：以「成員包含」判斷（client-side split-match）。
 * - 資料邊界：在 CourseService 讀取 teaching_records 後就把合併列展開成個別列，
 *   讓絕大多數下游邏輯維持「每列一位講師」的假設。
 */

/** 合併姓名使用的分隔符（含前後空白）。比對時對任何空白量都寬鬆處理。 */
export const INSTRUCTOR_NAME_SEPARATOR = ' / ';

const SPLIT_REGEX = /\s*\/\s*/;

/**
 * 把可能為合併格式的 instructor_name 拆成個別講師姓名陣列。
 * - 以 "/"（前後可有任意空白）分隔
 * - 去除前後空白、濾除空字串
 * - 若拆解後沒有任何有效姓名，回傳原字串（trim 後）作為單一元素
 */
export function splitInstructorNames(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const parts = raw
    .split(SPLIT_REGEX)
    .map(name => name.trim())
    .filter(name => name.length > 0);
  if (parts.length === 0) {
    const trimmed = raw.trim();
    return trimmed ? [trimmed] : [];
  }
  return parts;
}

/** 把個別講師姓名陣列合併回官方格式字串。 */
export function joinInstructorNames(names: string[]): string {
  return names
    .map(name => (name || '').trim())
    .filter(name => name.length > 0)
    .join(INSTRUCTOR_NAME_SEPARATOR);
}

/** 判斷某筆（可能為合併格式的）instructor_name 是否包含指定的單一講師。 */
export function instructorNameMatches(recordName: string | null | undefined, target: string | null | undefined): boolean {
  if (!recordName || !target) return false;
  const want = target.trim();
  if (!want) return false;
  return splitInstructorNames(recordName).some(name => name === want);
}

/** 判斷一個 instructor_name 是否為合併（多位）格式。 */
export function isCombinedInstructorName(raw: string | null | undefined): boolean {
  return splitInstructorNames(raw).length > 1;
}

/**
 * 將「可能含合併 instructor_name」的列展開成個別講師列。
 * 每個原始物件會依其拆解出的姓名數量複製，instructor_name 取代為個別姓名。
 * 其餘欄位（session_type、teaching_language、service_learning 等）保留不變。
 *
 * 注意：展開後可能出現多列共用同一個 $id，下游若以 $id 當唯一鍵需改用
 * `instructor_name|session_type` 等組合鍵。
 */
export function expandRecordsByInstructorName<T extends { instructor_name: string }>(records: T[]): T[] {
  const expanded: T[] = [];
  for (const record of records) {
    const names = splitInstructorNames(record.instructor_name);
    if (names.length <= 1) {
      // 維持原樣（含 UNKNOWN / 空字串等既有處理）
      expanded.push(record);
      continue;
    }
    for (const name of names) {
      expanded.push({ ...record, instructor_name: name });
    }
  }
  return expanded;
}
