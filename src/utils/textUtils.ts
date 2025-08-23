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
 * @param department 原始部門名稱（通常是縮寫代碼如CHI, ENG等，或多部門如"ECON / SOCSP"）
 * @param t 翻譯函數
 * @param showAbbreviation 是否在翻譯後的部門名稱前顯示縮寫前綴，默認為false
 * @returns 翻譯後的部門名稱，如果showAbbreviation為true則格式為「CHI - 中文系」，否則僅為「中文系」
 */
export const translateDepartmentName = (department: string, t: any, showAbbreviation: boolean = false): string => {
  // Handle empty or invalid department
  if (!department || department.trim() === '') {
    return '';
  }
  
  // Handle multi-department cases (separated by " / ")
  if (department.includes(' / ')) {
    const departments = department.split(' / ').map(dept => dept.trim());
    return departments.map(dept => translateSingleDepartment(dept, t, showAbbreviation)).join(' / ');
  }
  
  return translateSingleDepartment(department, t, showAbbreviation);
};

/**
 * 翻譯單一部門名稱
 * @param department 單一部門代碼
 * @param t 翻譯函數
 * @param showAbbreviation 是否顯示縮寫前綴
 * @returns 翻譯後的部門名稱
 */
const translateSingleDepartment = (department: string, t: any, showAbbreviation: boolean = false): string => {
  const departmentMap: { [key: string]: string } = {
    // mark update
    // Affiliated Units
    'LIFE': t('department.life'),
    
    // Faculty of Arts departments
    'AIGCS': t('department.aigcs'),
    'CEAL': t('department.ceal'),
    'CFCI': t('department.cfci'),
    'CLEAC': t('department.cleac'),
    'CHI': t('department.chinese'),
    'CS': t('department.culturalStudies'),
    'DACI': t('department.digitalArts'),
    'ENG': t('department.english'),
    'HIST': t('department.history'),
    'PHILO': t('department.philosophy'),
    'TRAN': t('department.translation'),
    
    // Faculty of Business departments  
    'ACCT': t('department.accountancy'),
    'BUS': t('department.businessOffice'),
    'FIN': t('department.finance'),
    'MGT': t('department.management'),
    'MKT': t('department.marketing'),
    'ORM': t('department.operations'),
    'HKIBS': t('department.hkibs'),
    'IIRM': t('department.iirm'),
    
    // Faculty of Social Sciences
    'ECON': t('department.economics'),
    'GOV': t('department.government'),
    'PSY': t('department.psychology'),
    'SOCSC': t('department.socialSciences'),
    'SOCSP': t('department.sociology'),
    
    // School of Data Science
    'DAI': t('department.dai'),
    'DIDS': t('department.dids'),
    'LEODCIDS': t('department.leodcids'),
    'SDS': t('department.sds'),
    
    // School of Graduate Studies
    'GS': t('department.graduateStudies'),
    
    // School of Interdisciplinary Studies
    'SIS': t('department.sis'),
    'SU': t('department.scienceUnit'),
    'WBLMP': t('department.musicUnit'),
    
    // Research Institutes, Centres and Programmes
    'APIAS': t('department.apias'),
    'IPS': t('department.ips'),
    
    // Units and Offices
    'OSL': t('department.osl'),
    'TLC': t('department.tlc'),
    
    // Default fallback
    default: department
  };
  
  const translatedName = departmentMap[department] || departmentMap.default;
  
  // Add abbreviation prefix only if showAbbreviation is true and it's a known department code
  if (showAbbreviation && departmentMap[department]) {
    return `${department} - ${translatedName}`;
  }
  
  return translatedName;
};

/**
 * 為多部門獲取學院信息
 * @param department 部門代碼（可能包含多個部門，用 " / " 分隔）
 * @returns 學院信息數組，每個元素包含學院翻譯鍵
 */
export const getFacultiesForMultiDepartment = (department: string): string[] => {
  // Handle multi-department cases
  const departments = department.includes(' / ') 
    ? department.split(' / ').map(dept => dept.trim())
    : [department];
  
  const facultyMapping: { [key: string]: string } = {
    // Affiliated Units
    'LIFE': 'faculty.affiliatedUnits',
    // Faculty of Arts
    'AIGCS': 'faculty.arts',
    'CEAL': 'faculty.arts',
    'CFCI': 'faculty.arts',
    'CLEAC': 'faculty.arts',
    'CHI': 'faculty.arts',
    'CS': 'faculty.arts',
    'DACI': 'faculty.arts',
    'ENG': 'faculty.arts',
    'HIST': 'faculty.arts',
    'PHILO': 'faculty.arts',
    'TRAN': 'faculty.arts',
    // Faculty of Business
    'ACCT': 'faculty.business',
    'BUS': 'faculty.business',
    'FIN': 'faculty.business',
    'MGT': 'faculty.business',
    'MKT': 'faculty.business',
    'ORM': 'faculty.business',
    'HKIBS': 'faculty.business',
    'IIRM': 'faculty.business',
    // Faculty of Social Sciences
    'ECON': 'faculty.socialSciences',
    'GOV': 'faculty.socialSciences',
    'PSY': 'faculty.socialSciences',
    'SOCSC': 'faculty.socialSciences',
    'SOCSP': 'faculty.socialSciences',
    // School of Data Science
    'DAI': 'faculty.dataScience',
    'DIDS': 'faculty.dataScience',
    'LEODCIDS': 'faculty.dataScience',
    'SDS': 'faculty.dataScience',
    // School of Graduate Studies
    'GS': 'faculty.graduateStudies',
    // School of Interdisciplinary Studies
    'SIS': 'faculty.interdisciplinaryStudies',
    'SU': 'faculty.interdisciplinaryStudies',
    'WBLMP': 'faculty.interdisciplinaryStudies',
    // Research Institutes, Centres and Programmes
    'APIAS': 'faculty.researchInstitutes',
    'IPS': 'faculty.researchInstitutes',
    // Units and Offices
    'OSL': 'faculty.unitsOffices',
    'TLC': 'faculty.unitsOffices'
  };

  // Get unique faculties
  const faculties = departments
    .map(dept => facultyMapping[dept])
    .filter(Boolean) // Remove undefined values
    .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
  
  return faculties;
};

/**
 * 拆分多部門講師的部門代碼
 * @param department 部門代碼（可能包含多個部門，用 " / " 分隔）
 * @returns 部門代碼數組
 */
export const splitInstructorDepartments = (department: string): string[] => {
  if (!department) return [];
  
  return department.includes(' / ')
    ? department.split(' / ').map(dept => dept.trim()).filter(Boolean)
    : [department];
};

/**
 * 檢查講師是否屬於指定部門（支持多部門講師）
 * @param instructorDepartment 講師的部門字串（可能包含多部門）
 * @param targetDepartment 目標部門代碼
 * @returns 是否匹配
 */
export const doesInstructorBelongToDepartment = (instructorDepartment: string, targetDepartment: string): boolean => {
  if (!instructorDepartment || !targetDepartment) return false;
  
  const instructorDepts = splitInstructorDepartments(instructorDepartment);
  return instructorDepts.includes(targetDepartment);
};

/**
 * 從講師列表中提取所有唯一部門代碼（處理多部門講師）
 * @param instructors 講師列表
 * @returns 唯一部門代碼數組
 */
export const extractUniqueDepartmentsFromInstructors = (instructors: Array<{ department: string }>): string[] => {
  const departmentSet = new Set<string>();
  
  instructors.forEach(instructor => {
    if (instructor.department) {
      const departments = splitInstructorDepartments(instructor.department);
      departments.forEach(dept => departmentSet.add(dept));
    }
  });
  
  return Array.from(departmentSet).sort();
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
 * 格式化講師頭銜，根據語言添加適當的點號和翻譯
 * @param title 原始頭銜（如：'Dr', 'Prof', 'Ms', 'Mr'）
 * @param language 語言設置 ('en', 'zh-TW', 'zh-CN')
 * @returns 格式化的頭銜
 */
export const formatInstructorTitle = (title: string, language: string): string => {
  if (!title) return '';

  // 中文頭銜對映表
  const chineseTitleMap: { [key: string]: string } = {
    'Dr': '博士',
    'Prof': '教授', 
    'Ms': '女士',
    'Mr': '先生',
    'Mrs': '女士'
  };

  // 標準化頭銜（移除可能存在的點號）
  const normalizedTitle = title.replace('.', '');

  if (language === 'zh-TW' || language === 'zh-CN') {
    // 中文模式：返回中文翻譯
    return chineseTitleMap[normalizedTitle] || title;
  } else {
    // 英文模式：添加點號
    return `${normalizedTitle}.`;
  }
};

/**
 * 獲取包含格式化頭銜的完整講師姓名
 * @param instructor 講師對象，包含name, name_tc, name_sc, title
 * @param language 語言設置
 * @returns 格式化的完整姓名
 */
export function getFormattedInstructorName(
  instructor: { 
    name: string; 
    name_tc?: string; 
    name_sc?: string; 
    title?: string;
  }, 
  language: string
): { primary: string; secondary?: string } {
  const title = instructor.title ? formatInstructorTitle(instructor.title, language) : '';
  
  switch (language) {
    case 'en':
      // 英文：顯示英文頭銜+英文姓名
      return { 
        primary: title ? `${title} ${instructor.name}` : instructor.name 
      };
    
    case 'zh-TW':
      // 繁體中文：優先顯示中文頭銜+中文姓名，回退到英文
      if (instructor.name_tc) {
        return {
          primary: title ? `${title} ${instructor.name_tc}` : instructor.name_tc,
          secondary: title ? `${formatInstructorTitle(instructor.title || '', 'en')} ${instructor.name}` : instructor.name
        };
      } else {
        return { 
          primary: title ? `${title} ${instructor.name}` : instructor.name 
        };
      }
    
    case 'zh-CN':
      // 簡體中文：優先顯示中文頭銜+中文姓名，回退到英文
      if (instructor.name_sc) {
        return {
          primary: title ? `${title} ${instructor.name_sc}` : instructor.name_sc,
          secondary: title ? `${formatInstructorTitle(instructor.title || '', 'en')} ${instructor.name}` : instructor.name
        };
      } else {
        return { 
          primary: title ? `${title} ${instructor.name}` : instructor.name 
        };
      }
    
    default:
      return { 
        primary: title ? `${title} ${instructor.name}` : instructor.name 
      };
  }
};

/**
 * Get term name with proper translation
 * @param termName - The term name from the database
 * @param t - Translation function
 * @returns Translated term name
 */
export function getTermName(termName: string, t: any): string {
  // Handle special format 3: UNKNOWN
  if (termName === '未知學期' || termName === 'UNKNOWN') {
    return t('term.unknown');
  }
  
  // Handle special format 2: year_on_or_before (e.g., "2021_on_or_before")
  const yearOnOrBeforeMatch = termName.match(/^(\d{4})_on_or_before$/);
  if (yearOnOrBeforeMatch) {
    const year = yearOnOrBeforeMatch[1];
    return t('term.yearOrBefore', { year });
  }
  
  // Handle special format 1: year only (e.g., "2021" or "2021年")
  const yearOnlyMatch = termName.match(/^(\d{4})年?$/);
  if (yearOnlyMatch) {
    return yearOnlyMatch[1]; // Extract and display only the year part
  }
  
  // Handle format: YYYY-T# (e.g., "2017-T1" to "2017-18, Term 1")
  const termCodeMatch = termName.match(/^(\d{4})-T(\d)$/);
  if (termCodeMatch) {
    const startYear = parseInt(termCodeMatch[1]);
    const termNumber = termCodeMatch[2];
    const endYear = (startYear + 1).toString().slice(-2); // Get last 2 digits of next year
    return `${startYear}-${endYear}, Term ${termNumber}`;
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

/**
 * 生成基於字符串的確定性偽隨機數 (0-1)
 * @param str 輸入字符串
 * @returns 0到1之間的偽隨機數
 */
function seededRandom(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Convert to positive number and normalize to 0-1
  return Math.abs(hash) / 2147483648;
}

/**
 * 基於課程代碼推斷教學語言 (確定性)
 * @param courseCode 課程代碼
 * @returns 推斷的語言代碼
 */
export function inferTeachingLanguage(courseCode: string): string {
  if (!courseCode) return 'E'; // Default to English
  
  const code = courseCode.toUpperCase();
  const rand = seededRandom(courseCode); // Deterministic pseudo-random based on course code
  
  // Chinese-related courses - vary between Cantonese and Putonghua
  if (code.includes('CHI') || code.includes('CHIL') || 
      code.includes('CHIN') || code.startsWith('CHI')) {
    // 60% Cantonese, 30% Putonghua, 10% mixed
    if (rand < 0.6) return 'C'; // Cantonese
    if (rand < 0.9) return 'P'; // Putonghua
    return '1'; // Mixed English/Cantonese
  }
  
  // Translation courses - varied language combinations
  if (code.includes('TRAN') || code.includes('TRANS')) {
    // Translation courses can use various language combinations
    if (rand < 0.4) return '1'; // English/Cantonese
    if (rand < 0.6) return '2'; // English/Putonghua 
    if (rand < 0.8) return '3'; // Cantonese/Putonghua
    return '4'; // English/Cantonese/Putonghua
  }
  
  // Philosophy courses - more language diversity
  if (code.includes('PHIL')) {
    if (rand < 0.4) return 'E'; // English
    if (rand < 0.7) return '1'; // English/Cantonese
    if (rand < 0.85) return 'C'; // Cantonese
    return '2'; // English/Putonghua
  }
  
  // Cultural studies - varied language usage
  if (code.includes('CS') || code.includes('CULT')) {
    if (rand < 0.5) return 'E'; // English
    if (rand < 0.7) return '1'; // English/Cantonese
    if (rand < 0.85) return 'C'; // Cantonese
    return '3'; // Cantonese/Putonghua
  }
  
  // History courses - might use local languages
  if (code.includes('HIST')) {
    if (rand < 0.6) return 'E'; // English
    if (rand < 0.8) return 'C'; // Cantonese
    if (rand < 0.9) return '1'; // English/Cantonese
    return 'P'; // Putonghua
  }
  
  // Language-specific courses (Chinese Language Education and Assessment Centre)
  if (code.includes('CHIL') || code.includes('CEAL')) {
    // Chinese Language courses - likely Putonghua or mixed
    if (rand < 0.5) return 'P'; // Putonghua
    if (rand < 0.8) return 'C'; // Cantonese
    return '3'; // Cantonese/Putonghua
  }
  
  // Business, English, Science courses typically in English, but some mixed
  if (code.includes('BUS') || code.includes('ENG') || 
      code.includes('SCI') || code.includes('MATH') || 
      code.includes('ECON') || code.includes('PSY') ||
      code.includes('MGT') || code.includes('MKT') ||
      code.includes('FIN') || code.includes('ACCT')) {
    // Mostly English, but some mixed for local business context
    if (rand < 0.85) return 'E'; // English
    if (rand < 0.95) return '1'; // English/Cantonese for local business context
    return '2'; // English/Putonghua for mainland business
  }
  
  // Government and Social Sciences - varied for local context
  if (code.includes('GOV') || code.includes('SOC') || code.includes('POL')) {
    if (rand < 0.6) return 'E'; // English
    if (rand < 0.8) return '1'; // English/Cantonese for local politics
    if (rand < 0.9) return 'C'; // Cantonese for local issues
    return '2'; // English/Putonghua for mainland affairs
  }
  
  // Default distribution for other courses
  if (rand < 0.75) return 'E'; // 75% English (most common)
  if (rand < 0.85) return 'C'; // 10% Cantonese
  if (rand < 0.92) return '1'; // 7% English/Cantonese
  if (rand < 0.97) return 'P'; // 5% Putonghua
  return '2'; // 3% English/Putonghua
}

/**
 * 獲取課程的教學語言（實際數據或推斷）
 * @param course 課程對象
 * @returns 教學語言代碼數組
 * @deprecated 此函數包含推測邏輯，請使用 getCourseTeachingLanguagesRealOnly
 */
export function getCourseTeachingLanguages(course: { teachingLanguages?: string[]; course_code: string }): string[] {
  // 如果有實際數據，使用實際數據
  if (course.teachingLanguages && course.teachingLanguages.length > 0) {
    return course.teachingLanguages;
  }
  
  // 否則推斷語言
  const inferredLanguage = inferTeachingLanguage(course.course_code);
  return [inferredLanguage];
}

/**
 * 獲取課程的教學語言（僅使用真實資料庫數據）
 * @param course 課程對象
 * @returns 教學語言代碼數組，如果沒有真實數據則返回空數組
 */
export function getCourseTeachingLanguagesRealOnly(course: { teachingLanguages?: string[]; course_code: string }): string[] {
  // 僅返回實際數據，不使用推測
  if (course.teachingLanguages && course.teachingLanguages.length > 0) {
    return course.teachingLanguages;
  }
  
  // 沒有真實數據時返回空數組
  return [];
}

/**
 * 獲取課程的教學語言（帶安全後備機制）
 * 主要使用真實資料庫數據，但在數據缺失時提供保守的後備
 * @param course 課程對象  
 * @returns 教學語言代碼數組
 */
export function getCourseTeachingLanguagesWithFallback(course: { teachingLanguages?: string[]; course_code: string }): string[] {
  // 優先使用真實數據
  if (course.teachingLanguages && course.teachingLanguages.length > 0) {
    return course.teachingLanguages;
  }
  
  // 數據缺失時的保守後備：僅對明顯的中文相關課程提供中文語言
  // 這避免了過度推測，只處理最明確的情況
  const code = course.course_code.toUpperCase();
  
  // 只對明確的中文課程提供語言推測
  if (code.startsWith('CHIL') || code.startsWith('CHIN') || 
      (code.includes('CHI') && (code.includes('1') || code.includes('2') || code.includes('3')))) {
    return ['C']; // 中文課程推斷為粵語
  }
  
  // 其他情況返回空數組，不顯示徽章
  return [];
}

/**
 * 檢查課程是否匹配指定的教學語言篩選
 * @param course 課程對象
 * @param filterLanguages 篩選的語言代碼數組
 * @returns 是否匹配
 * @deprecated 此函數包含推測邏輯，請使用 courseMatchesLanguageFilterRealOnly
 */
export function courseMatchesLanguageFilter(
  course: { teachingLanguages?: string[]; course_code: string }, 
  filterLanguages: string[]
): boolean {
  if (filterLanguages.length === 0) return true;
  
  const courseLanguages = getCourseTeachingLanguages(course);
  return courseLanguages.some(langCode => filterLanguages.includes(langCode));
}

/**
 * 檢查課程是否匹配指定的教學語言篩選（僅使用真實資料庫數據）
 * @param course 課程對象
 * @param filterLanguages 篩選的語言代碼數組
 * @returns 是否匹配
 */
export function courseMatchesLanguageFilterRealOnly(
  course: { teachingLanguages?: string[]; course_code: string }, 
  filterLanguages: string[]
): boolean {
  if (filterLanguages.length === 0) return true;
  
  const courseLanguages = getCourseTeachingLanguagesRealOnly(course);
  // 如果課程沒有真實的教學語言數據，則不匹配任何篩選
  if (courseLanguages.length === 0) return false;
  
  return courseLanguages.some(langCode => filterLanguages.includes(langCode));
} 