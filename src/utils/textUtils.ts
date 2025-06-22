/**
 * Count words in a text string
 * @param text - The text to count words in
 * @returns Number of words
 */
export const countWords = (text: string): number => {
  if (!text || !text.trim()) {
    return 0;
  }
  
  // Remove extra whitespace and split by whitespace
  // This handles multiple spaces, tabs, and newlines
  const words = text.trim().split(/\s+/);
  return words.length;
};

/**
 * Validate word count for text input
 * @param text - The text to validate
 * @param minWords - Minimum required words (default: 5)
 * @param maxWords - Maximum allowed words (default: 1000)
 * @returns Object with validation result and message
 */
export const validateWordCount = (
  text: string, 
  minWords: number = 5, 
  maxWords: number = 1000
): { isValid: boolean; wordCount: number; message?: string } => {
  const wordCount = countWords(text);
  
  if (wordCount < minWords) {
    return {
      isValid: false,
      wordCount,
      message: `At least ${minWords} words required (${wordCount}/${minWords})`
    };
  }
  
  if (wordCount > maxWords) {
    return {
      isValid: false,
      wordCount,
      message: `Too many words (${wordCount}/${maxWords})`
    };
  }
  
  return {
    isValid: true,
    wordCount
  };
};

/**
 * Get word count status for display
 * @param text - The text to check
 * @param minWords - Minimum required words
 * @param maxWords - Maximum allowed words
 * @returns Object with display information
 */
export const getWordCountStatus = (
  text: string,
  minWords: number = 5,
  maxWords: number = 1000
): {
  wordCount: number;
  isValid: boolean;
  status: 'too-few' | 'valid' | 'too-many';
  color: 'text-red-500' | 'text-green-600' | 'text-orange-500' | 'text-gray-500';
} => {
  const wordCount = countWords(text);
  
  if (wordCount === 0) {
    return {
      wordCount,
      isValid: false,
      status: 'too-few',
      color: 'text-gray-500'
    };
  }
  
  if (wordCount < minWords) {
    return {
      wordCount,
      isValid: false,
      status: 'too-few',
      color: 'text-red-500'
    };
  }
  
  if (wordCount > maxWords) {
    return {
      wordCount,
      isValid: false,
      status: 'too-many',
      color: 'text-red-500'
    };
  }
  
  return {
    wordCount,
    isValid: true,
    status: 'valid',
    color: 'text-green-600'
  };
};

/**
 * 根據語言設置獲取課程標題
 * @param course 課程對象
 * @param language 語言設置 ('en', 'zh-TW', 'zh-CN')
 * @returns 格式化的課程標題
 */
export function getCourseTitle(
  course: { 
    course_title: string; 
    course_title_tc?: string; 
    course_title_sc?: string; 
  }, 
  language: string
): { primary: string; secondary?: string } {
  const englishTitle = course.course_title;
  const tcTitle = course.course_title_tc;
  const scTitle = course.course_title_sc;

  switch (language) {
    case 'en':
      // 英文：只顯示英文標題
      return { primary: englishTitle };
    
    case 'zh-TW':
      // 繁體中文：顯示英文標題，下方顯示繁體中文標題
      return {
        primary: englishTitle,
        secondary: tcTitle || undefined
      };
    
    case 'zh-CN':
      // 簡體中文：顯示英文標題，下方顯示簡體中文標題
      return {
        primary: englishTitle,
        secondary: scTitle || undefined
      };
    
    default:
      // 預設顯示英文標題
      return { primary: englishTitle };
  }
}

/**
 * 根據語言設置獲取講師姓名
 * @param instructor 講師對象
 * @param language 語言設置 ('en', 'zh-TW', 'zh-CN')
 * @returns 格式化的講師姓名
 */
export function getInstructorName(
  instructor: { 
    name: string; 
    name_tc?: string; 
    name_sc?: string; 
  }, 
  language: string
): { primary: string; secondary?: string } {
  const englishName = instructor.name;
  const tcName = instructor.name_tc;
  const scName = instructor.name_sc;

  switch (language) {
    case 'en':
      // 英文：只顯示英文姓名
      return { primary: englishName };
    
    case 'zh-TW':
      // 繁體中文：顯示英文姓名作為主要，如果有繁體中文姓名則作為次要
      return {
        primary: englishName,
        secondary: tcName || undefined
      };
    
    case 'zh-CN':
      // 簡體中文：顯示英文姓名作為主要，如果有簡體中文姓名則作為次要
      return {
        primary: englishName,
        secondary: scName || undefined
      };
    
    default:
      // 預設顯示英文姓名
      return { primary: englishName };
  }
}

/**
 * 翻譯部門名稱
 * @param departmentName 原始部門名稱
 * @param t 翻譯函數
 * @returns 翻譯後的部門名稱，如果沒有對應翻譯則返回原始名稱
 */
export function translateDepartmentName(departmentName: string, t: (key: string) => string): string {
  if (!departmentName) return '';
  
  // 直接映射到真實學系的對應關係
  const departmentMapping: { [key: string]: string } = {
    // 真實學系的直接映射
    'Chinese': 'chinese',
    'Cultural Studies': 'culturalStudies',
    'Digital Arts and Creative Industries': 'digitalArts',
    'English': 'english',
    'History': 'history',
    'Philosophy': 'philosophy',
    'Translation': 'translation',
    'Centre for English and Additional Languages': 'englishLanguageCentre',
    'Chinese Language Education and Assessment Centre': 'chineseLanguageCentre',
    'Accountancy': 'accountancy',
    'Finance': 'finance',
    'Management': 'management',
    'Marketing and International Business': 'marketing',
    'Operations and Risk Management': 'operations',
    'Psychology': 'psychology',
    'Economics': 'economics',
    'Government and International Affairs': 'government',
    'Sociology and Social Policy': 'sociology',
    'Office of the Core Curriculum': 'coreOffice',
    'Science Unit': 'scienceUnit',
    'Wong Bing Lai Music and Performing Arts Unit': 'musicUnit',
    'LEO Dr David P. Chan Institute of Data Science': 'dataScience',
    
    // 舊的不存在學系映射到新的真實學系
    'Computing & Decision Sciences': 'digitalArts', // 映射到數碼藝術及創意產業系
    'Business': 'management', // 映射到管理學系
    'Computer Science': 'digitalArts', // 映射到數碼藝術及創意產業系
    'Decision Sciences': 'digitalArts', // 映射到數碼藝術及創意產業系
  };
  
  // 檢查是否有直接映射
  if (departmentMapping[departmentName]) {
    const translationKey = `department.${departmentMapping[departmentName]}`;
    const translated = t(translationKey);
    if (translated !== translationKey) {
      return translated;
    }
  }
  
  // 如果沒有直接映射，嘗試標準化處理
  const normalizedName = departmentName
    .toLowerCase()
    .replace(/\s+/g, '') // 移除空格
    .replace(/[^a-z]/g, '') // 移除非字母字符
    // 轉換為駝峰命名法
    .replace(/^./, match => match.toLowerCase());
  
  const translationKey = `department.${normalizedName}`;
  const translated = t(translationKey);
  
  // 如果翻譯結果與鍵值相同，說明沒有找到翻譯，返回原始名稱
  return translated === translationKey ? departmentName : translated;
} 