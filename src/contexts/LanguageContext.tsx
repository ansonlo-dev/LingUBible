
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Language } from '@/components/LanguageSwitcher';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    'hero.title': 'Welcome to',
    'hero.subtitle': 'Your platform for honest course and lecturer reviews. Help fellow students make informed decisions.',
    'hero.action': 'comment',
    'hero.actions': ['comment', 'vote', 'ask questions', 'answer questions'],
    'hero.getStarted': 'Get Started',
    'nav.home': 'Home',
    'nav.courses': 'Courses',
    'nav.lecturers': 'Lecturers',
    'nav.about': 'About',
    'nav.signIn': 'Sign In',
    'stats.totalCourses': 'Total Courses',
    'stats.lecturers': 'Lecturers',
    'stats.reviews': 'Reviews',
    'stats.activeStudents': 'Active Students',
    'tabs.popularCourses': 'Popular Courses',
    'tabs.topLecturers': 'Top Lecturers',
    'footer.copyright': 'Copyleft, 2025@LingUBible, All rights reserved to the contributors',
    'footer.builtWith': 'Built with 💝 by ansonlo.dev',
    'footer.disclaimer': 'The website is not affiliated with Lingnan University',
  },
  'zh-TW': {
    'hero.title': '歡迎來到',
    'hero.subtitle': '您誠實的課程和講師評價平台。幫助同學們做出明智的決定。',
    'hero.action': '評論',
    'hero.actions': ['評論', '投票', '提出問題', '回答問題'],
    'hero.getStarted': '開始使用',
    'nav.home': '首頁',
    'nav.courses': '課程',
    'nav.lecturers': '講師',
    'nav.about': '關於',
    'nav.signIn': '登入',
    'stats.totalCourses': '總課程數',
    'stats.lecturers': '講師',
    'stats.reviews': '評價',
    'stats.activeStudents': '活躍學生',
    'tabs.popularCourses': '熱門課程',
    'tabs.topLecturers': '頂級講師',
    'footer.copyright': 'Copyleft, 2025@LingUBible, 所有權利歸貢獻者所有',
    'footer.builtWith': '由 ansonlo.dev 用 💝 製作',
    'footer.disclaimer': '本網站與嶺南大學無關',
  },
  'zh-CN': {
    'hero.title': '欢迎来到',
    'hero.subtitle': '您诚实的课程和讲师评价平台。帮助同学们做出明智的决定。',
    'hero.action': '评论',
    'hero.actions': ['评论', '投票', '提出问题', '回答问题'],
    'hero.getStarted': '开始使用',
    'nav.home': '首页',
    'nav.courses': '课程',
    'nav.lecturers': '讲师',
    'nav.about': '关于',
    'nav.signIn': '登录',
    'stats.totalCourses': '总课程数',
    'stats.lecturers': '讲师',
    'stats.reviews': '评价',
    'stats.activeStudents': '活跃学生',
    'tabs.popularCourses': '热门课程',
    'tabs.topLecturers': '顶级讲师',
    'footer.copyright': 'Copyleft, 2025@LingUBible, 所有权利归贡献者所有',
    'footer.builtWith': '由 ansonlo.dev 用 💝 制作',
    'footer.disclaimer': '本网站与岭南大学无关',
  },
};

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = useState<Language>('en');

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
