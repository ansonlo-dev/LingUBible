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
 * 從講師全名中提取用於排序的實際姓名，忽略職稱
 * @param fullName 完整的講師姓名（包含職稱）
 * @returns 用於排序的實際姓名
 */
export function extractInstructorNameForSorting(fullName: string): string {
  if (!fullName) return '';
  
  // 定義常見的職稱前綴
  const titles = [
    'Dr.', 'Dr', 'Professor', 'Prof.', 'Prof', 'Ms.', 'Ms', 'Mr.', 'Mr', 
    'Mrs.', 'Mrs', 'Miss', 'Ir.', 'Ir', 'Rev.', 'Rev', 'Sr.', 'Sr', 'Jr.', 'Jr'
  ];
  
  // 移除多餘的空格並分割成單詞
  const words = fullName.trim().split(/\s+/);
  
  // 找到第一個不是職稱的單詞作為姓名的開始
  let nameStartIndex = 0;
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const isTitle = titles.some(title => 
      title.toLowerCase() === word.toLowerCase() || 
      title.toLowerCase() === word.toLowerCase().replace(/\.$/, '')
    );
    
    if (!isTitle) {
      nameStartIndex = i;
      break;
    }
  }
  
  // 返回去除職稱後的姓名
  return words.slice(nameStartIndex).join(' ').trim() || fullName;
}

/**
 * 翻譯部門名稱
 * @param departmentName 原始部門名稱
 * @param t 翻譯函數
 * @param isMobile 是否為移動設備，用於選擇短格式部門名稱
 * @returns 翻譯後的部門名稱，如果沒有對應翻譯則返回原始名稱
 */
export const translateDepartmentName = (department: string, t: any): string => {
  const departmentMap: { [key: string]: string } = {
    // Faculty of Arts departments
    'Chinese': t('department.chinese'),
    'Digital Arts and Creative Industries': t('department.digitalArts'),
    'English': t('department.english'),
    'History': t('department.history'),
    'Philosophy': t('department.philosophy'),
    'Translation': t('department.translation'),
    'Centre for English and Additional Languages': t('department.englishLanguageCentre'),
    'Chinese Language Education and Assessment Centre': t('department.chineseLanguageCentre'),
    
    // Faculty of Liberal Arts and Social Sciences
    'Cultural Studies': t('department.culturalStudies'),
    'Psychology': t('department.psychology'),
    'Economics': t('department.economics'),
    'Government and International Affairs': t('department.government'),
    'Sociology and Social Policy': t('department.sociology'),
    
    // Faculty of Business departments  
    'Accountancy': t('department.accountancy'),
    'Finance': t('department.finance'),
    'Management': t('department.management'),
    'Marketing and International Business': t('department.marketing'),
    'Operations and Risk Management': t('department.operations'),
    
    // Other units
    'Science Unit': t('department.scienceUnit'),
    'Wong Bing Lai Music and Performing Arts Unit': t('department.musicUnit'),
    'LEO Dr David P. Chan Institute of Data Science': t('department.dataScience'),
    
    // Default fallback
    default: department
  };
  
  return departmentMap[department] || departmentMap.default;
};

// Teaching language code mappings with translation support
export const getTeachingLanguageName = (code: string, t: any): string => {
  const translationKeys: { [key: string]: string } = {
    'E': 'teachingLanguage.english',
    'C': 'teachingLanguage.cantonese', 
    'P': 'teachingLanguage.putonghua',
    '1': 'teachingLanguage.englishCantonese',
    '2': 'teachingLanguage.englishPutonghua', 
    '3': 'teachingLanguage.cantonesePutonghua',
    '4': 'teachingLanguage.englishCantonesePutonghua',
    '5': 'teachingLanguage.others'
  };
  return translationKeys[code] ? t(translationKeys[code]) : code;
};

/**
 * Get term name with proper translation
 * @param termName - The term name from the database
 * @param t - Translation function
 * @returns Translated term name
 */
export function getTermName(termName: string, t: (key: string) => string): string {
  if (termName === '未知學期' || termName === 'UNKNOWN') {
    return t('term.unknown');
  }
  return termName;
}

/**
 * 處理英文單複數形式
 * @param count 數量
 * @param singular 單數形式
 * @param plural 複數形式
 * @returns 根據數量返回適當的單複數形式
 */
export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

/**
 * 處理包含單複數形式的翻譯字符串
 * @param text 包含 {count} 和 singular|plural 格式的翻譯字符串
 * @param count 數量
 * @returns 處理後的翻譯字符串
 */
export function processPluralTranslation(text: string, count: number): string {
  // 查找 singular|plural 格式的部分
  const pluralRegex = /(\w+)\|(\w+)/g;
  
  return text.replace(pluralRegex, (match, singular, plural) => {
    return count === 1 ? singular : plural;
  });
} 