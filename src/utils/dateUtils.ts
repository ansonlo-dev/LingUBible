/**
 * 判斷當前日期屬於哪個學期
 * 根據嶺南大學的學期安排來判斷
 */
export function getCurrentTermCode(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // getMonth() 返回 0-11，需要加1
  
  // 嶺南大學學期安排：
  // Term 1: 9月-12月 (對應學年的第一學期)
  // Term 2: 1月-5月 (對應學年的第二學期)
  // Summer: 6月-8月 (暑期學期，較少開設課程)
  
  if (month >= 9 && month <= 12) {
    // 9-12月屬於當年的 Term 1
    return `${year}-T1`;
  } else if (month >= 1 && month <= 5) {
    // 1-5月屬於上一年開始的學年的 Term 2
    return `${year - 1}-T2`;
  } else {
    // 6-8月屬於暑期，通常課程較少，歸類為當年的夏季學期
    return `${year}-Summer`;
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
  const year = termCode.split('-')[0];
  const term = termCode.split('-')[1];
  
  switch (term) {
    case 'T1':
      return `${year}/${parseInt(year) + 1} Term 1`;
    case 'T2':
      return `${parseInt(year) + 1}/${parseInt(year) + 2} Term 2`;
    case 'Summer':
      return `${year} Summer`;
    default:
      return termCode;
  }
} 