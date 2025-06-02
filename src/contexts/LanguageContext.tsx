import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language } from '@/components/LanguageSwitcher';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Cookie helper functions
const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

const setCookie = (name: string, value: string, days: number = 365) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

// Get initial language from cookie or default to 'en'
const getInitialLanguage = (): Language => {
  if (typeof window === 'undefined') return 'en'; // SSR safety
  
  const savedLanguage = getCookie('language');
  if (savedLanguage && ['en', 'zh-TW', 'zh-CN'].includes(savedLanguage)) {
    return savedLanguage as Language;
  }
  
  // Fallback to browser language detection
  const browserLang = navigator.language || navigator.languages?.[0];
  if (browserLang) {
    if (browserLang.startsWith('zh-TW') || browserLang.startsWith('zh-Hant')) {
      return 'zh-TW';
    }
    if (browserLang.startsWith('zh-CN') || browserLang.startsWith('zh-Hans') || browserLang.startsWith('zh')) {
      return 'zh-CN';
    }
  }
  
  return 'en';
};

const translations = {
  en: {
    'hero.title': 'Welcome to',
    'hero.subtitle': 'Your platform for honest course and lecturer reviews. Help fellow students make informed decisions.',
    'hero.action': 'comment',
    'hero.actions': ['comment', 'vote', 'ask', 'answer'],
    'hero.getStarted': 'Get Started',
    'hero.comeHereTo': 'Come here to',
    'nav.home': 'Home',
    'nav.courses': 'Courses',
    'nav.lecturers': 'Lecturers',
    'nav.about': 'About',
    'nav.signIn': 'Sign In',
    'stats.totalCourses': 'Total Courses',
    'stats.lecturers': 'Lecturers',
    'stats.reviews': 'Reviews',
    'stats.activeStudents': 'Active Students',
    'stats.thisMonth': 'this month',
    'tabs.popularCourses': 'Popular Courses',
    'tabs.topLecturers': 'Top Lecturers',
    'footer.copyright': 'Copyleft, 2025@LingUBible, All rights reserved to the contributors',
    'footer.builtWith': 'Built with 💝 by ansonlo.dev',
    'footer.disclaimer': 'The website is not affiliated with Lingnan University',
    // Footer additional
    'footer.builtWithTools': 'Built with open-source tools by',
    'footer.beta': 'BETA',
    'footer.version': 'Version 0.0.1',
    'footer.contact': 'Contact',
    'footer.terms': 'Terms',
    'footer.privacy': 'Privacy',
    // Auth Modal
    'auth.signIn': 'Sign In',
    'auth.signUp': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.enterEmail': 'Enter your email',
    'auth.enterPassword': 'Enter your password',
    'auth.confirmPasswordPlaceholder': 'Confirm your password',
    'auth.alreadyHaveAccount': 'Already have an account? Sign in',
    'auth.dontHaveAccount': "Don't have an account? Sign up",
    'auth.passwordMismatch': 'Passwords do not match',
    'auth.authFailed': 'Authentication failed, please check your information',
    // Search
    'search.placeholder': 'Search courses, lecturers...',
    // Buttons
    'button.viewAll': 'View All',
    'button.review': 'Review',
    'button.viewDetails': 'View Details',
    'button.viewProfile': 'View Profile',
    // Course/Lecturer Cards
    'card.reviews': 'reviews',
    'card.students': 'students',
    'card.courses': 'courses',
    'card.specialties': 'Specialties',
    'card.more': 'more',
    'card.prof': 'Prof.',
    // Difficulty levels
    'difficulty.easy': 'Easy',
    'difficulty.medium': 'Medium',
    'difficulty.hard': 'Hard',
    // Departments
    'department.computerScience': 'Computer Science',
    'department.mathematics': 'Mathematics',
    'department.english': 'English',
    // Specialties
    'specialty.programming': 'Programming',
    'specialty.dataStructures': 'Data Structures',
    'specialty.algorithms': 'Algorithms',
    'specialty.machineLearning': 'Machine Learning',
    'specialty.calculus': 'Calculus',
    'specialty.linearAlgebra': 'Linear Algebra',
    'specialty.statistics': 'Statistics',
    'specialty.literature': 'Literature',
    'specialty.creativeWriting': 'Creative Writing',
    'specialty.poetry': 'Poetry',
    'specialty.drama': 'Drama',
    // Sample course titles
    'course.introCS': 'Introduction to Computer Science',
    'course.advancedMath': 'Advanced Mathematics',
    'course.englishLit': 'English Literature',
    // Sidebar
    'sidebar.myReviews': 'My Reviews',
    'sidebar.trending': 'Trending',
    'sidebar.settings': 'Settings',
  },
  'zh-TW': {
    'hero.title': '歡迎來到',
    'hero.subtitle': '真實可靠的Reg科聖經，幫助同學們作出明智的選擇',
    'hero.action': '評論',
    'hero.actions': ['評論', '投票', '提出問題', '回答問題'],
    'hero.getStarted': '開始使用',
    'hero.comeHereTo': '來這裡',
    'nav.home': '首頁',
    'nav.courses': '課程',
    'nav.lecturers': '講師',
    'nav.about': '關於',
    'nav.signIn': '登入',
    'stats.totalCourses': '總課程數',
    'stats.lecturers': '講師',
    'stats.reviews': '評價',
    'stats.activeStudents': '活躍學生',
    'stats.thisMonth': '本月',
    'tabs.popularCourses': '熱門課程',
    'tabs.topLecturers': '頂級講師',
    'footer.copyright': 'Copyleft, 2025@LingUBible, 所有權利歸貢獻者所有',
    'footer.builtWith': '由 ansonlo.dev 用 💝 製作',
    'footer.disclaimer': '本網站與嶺南大學沒有任何關係',
    // Footer additional
    'footer.builtWithTools': '由開源工具構建，作者',
    'footer.beta': 'BETA',
    'footer.version': '版本 0.0.1',
    'footer.contact': '聯絡',
    'footer.terms': '條款',
    'footer.privacy': '隱私',
    // Auth Modal
    'auth.signIn': '登入',
    'auth.signUp': '註冊',
    'auth.email': '電子郵件',
    'auth.password': '密碼',
    'auth.confirmPassword': '確認密碼',
    'auth.enterEmail': '請輸入您的電子郵件',
    'auth.enterPassword': '請輸入您的密碼',
    'auth.confirmPasswordPlaceholder': '請確認您的密碼',
    'auth.alreadyHaveAccount': '已有帳戶？立即登入',
    'auth.dontHaveAccount': '沒有帳戶？立即註冊',
    'auth.passwordMismatch': '兩次密碼不一致',
    'auth.authFailed': '認證失敗，請檢查資料',
    // Search
    'search.placeholder': '搜尋課程、講師...',
    // Buttons
    'button.viewAll': '查看全部',
    'button.review': '評價',
    'button.viewDetails': '查看詳情',
    'button.viewProfile': '查看檔案',
    // Course/Lecturer Cards
    'card.reviews': '評價',
    'card.students': '學生',
    'card.courses': '課程',
    'card.specialties': '專業領域',
    'card.more': '更多',
    'card.prof': '教授',
    // Difficulty levels
    'difficulty.easy': '簡單',
    'difficulty.medium': '中等',
    'difficulty.hard': '困難',
    // Departments
    'department.computerScience': '計算機科學',
    'department.mathematics': '數學',
    'department.english': '英語',
    // Specialties
    'specialty.programming': '程式設計',
    'specialty.dataStructures': '資料結構',
    'specialty.algorithms': '演算法',
    'specialty.machineLearning': '機器學習',
    'specialty.calculus': '微積分',
    'specialty.linearAlgebra': '線性代數',
    'specialty.statistics': '統計學',
    'specialty.literature': '文學',
    'specialty.creativeWriting': '創意寫作',
    'specialty.poetry': '詩歌',
    'specialty.drama': '戲劇',
    // Sample course titles
    'course.introCS': '計算機科學導論',
    'course.advancedMath': '高等數學',
    'course.englishLit': '英國文學',
    // Sidebar
    'sidebar.myReviews': '我的評價',
    'sidebar.trending': '熱門',
    'sidebar.settings': '設置',
  },
  'zh-CN': {
    'hero.title': '欢迎来到',
    'hero.subtitle': '您诚实的课程和讲师评价平台。帮助同学们做出明智的决定',
    'hero.action': '评论',
    'hero.actions': ['评论', '投票', '提出问题', '回答问题'],
    'hero.getStarted': '开始使用',
    'hero.comeHereTo': '来这里',
    'nav.home': '首页',
    'nav.courses': '课程',
    'nav.lecturers': '讲师',
    'nav.about': '关于',
    'nav.signIn': '登录',
    'stats.totalCourses': '总课程数',
    'stats.lecturers': '讲师',
    'stats.reviews': '评价',
    'stats.activeStudents': '活跃学生',
    'stats.thisMonth': '本月',
    'tabs.popularCourses': '热门课程',
    'tabs.topLecturers': '顶级讲师',
    'footer.copyright': 'Copyleft, 2025@LingUBible, 所有权利归贡献者所有',
    'footer.builtWith': '由 ansonlo.dev 用 💝 制作',
    'footer.disclaimer': '本网站与岭南大学没有关系',
    // Footer additional
    'footer.builtWithTools': '由开源工具构建，作者',
    'footer.beta': 'BETA',
    'footer.version': '版本 0.0.1',
    'footer.contact': '联系',
    'footer.terms': '条款',
    'footer.privacy': '隐私',
    // Auth Modal
    'auth.signIn': '登录',
    'auth.signUp': '注册',
    'auth.email': '电子邮箱',
    'auth.password': '密码',
    'auth.confirmPassword': '确认密码',
    'auth.enterEmail': '请输入您的电子邮箱',
    'auth.enterPassword': '请输入您的密码',
    'auth.confirmPasswordPlaceholder': '请确认您的密码',
    'auth.alreadyHaveAccount': '已有账户？立即登录',
    'auth.dontHaveAccount': '没有账户？立即注册',
    'auth.passwordMismatch': '两次密码不一致',
    'auth.authFailed': '认证失败，请检查资料',
    // Search
    'search.placeholder': '搜索课程、讲师...',
    // Buttons
    'button.viewAll': '查看全部',
    'button.review': '评价',
    'button.viewDetails': '查看详情',
    'button.viewProfile': '查看档案',
    // Course/Lecturer Cards
    'card.reviews': '评价',
    'card.students': '学生',
    'card.courses': '课程',
    'card.specialties': '专业领域',
    'card.more': '更多',
    'card.prof': '教授',
    // Difficulty levels
    'difficulty.easy': '简单',
    'difficulty.medium': '中等',
    'difficulty.hard': '困难',
    // Departments
    'department.computerScience': '计算机科学',
    'department.mathematics': '数学',
    'department.english': '英语',
    // Specialties
    'specialty.programming': '程序设计',
    'specialty.dataStructures': '数据结构',
    'specialty.algorithms': '算法',
    'specialty.machineLearning': '机器学习',
    'specialty.calculus': '微积分',
    'specialty.linearAlgebra': '线性代数',
    'specialty.statistics': '统计学',
    'specialty.literature': '文学',
    'specialty.creativeWriting': '创意写作',
    'specialty.poetry': '诗歌',
    'specialty.drama': '戏剧',
    // Sample course titles
    'course.introCS': '计算机科学导论',
    'course.advancedMath': '高等数学',
    'course.englishLit': '英国文学',
    // Sidebar
    'sidebar.myReviews': '我的评价',
    'sidebar.trending': '热门',
    'sidebar.settings': '设置',
  },
};

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  // Update language and save to cookie
  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    setCookie('language', newLanguage);
  };

  const t = (key: string): any => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
