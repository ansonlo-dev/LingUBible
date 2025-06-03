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
    'hero.subtitle': 'Your platform for honest course and lecturer reviews. Help fellow students make informed decisions',
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
    'auth.passwordMatch': 'Passwords match',
    'auth.rememberMe': 'Remember me',
    'auth.authFailed': 'Authentication failed, please check your information',
    'auth.secureConnection': 'Your credentials will be encrypted and sent in a secure connection.',
    'auth.schoolPasswordReminder': 'Please do not use the same password as your school email account. For account security, we recommend using different passwords for each service.',
    'auth.forgotPassword': 'Forgot password?',
    'auth.resetPassword': 'Reset Password',
    'auth.sendResetEmail': 'Send Reset Email',
    'auth.resetEmailSent': 'Password reset email has been sent to your email address.',
    'auth.backToLogin': 'Back to Login',
    'auth.backToHome': 'Back to Home',
    'auth.noAccount': "Don't have an account?",
    'auth.haveAccount': 'Already have an account?',
    'auth.contact': 'Contact',
    'auth.terms': 'Terms',
    'auth.privacy': 'Privacy',
    'auth.help': 'Help Center',
    // Auth page titles and descriptions
    'auth.welcomeBack': 'Welcome back',
    'auth.createStudentAccount': 'Create your student account',
    'auth.fillInfoToCreate': 'Fill in the following information to create your student account',
    'auth.studentInfoVerification': 'Student Information Verification',
    'auth.passwordSetup': 'Password Setup',
    'auth.enterAccountInfo': 'Enter your account information to sign in',
    'auth.resetYourPassword': 'Reset your password',
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
    // Password Security
    'password.strength': 'Password Strength',
    'password.requirements': 'Password Requirements:',
    'password.length': 'Password length 8-40 characters',
    'password.uppercase': 'Contains at least 1 uppercase letter',
    'password.lowercase': 'Contains at least 1 lowercase letter',
    'password.special': 'Contains at least 1 special character (!@#$%^&* etc.)',
    'password.number': 'Contains at least 1 number',
    'password.notCommon': 'Not a common password',
    'password.notLeaked': 'Does not match known leaked password patterns',
    'password.notSimilarToEmail': 'Should not be similar to school email address',
    'password.lengthSuggestion': 'Recommend using 12+ characters for better security',
    'password.weak': 'Weak',
    'password.fair': 'Fair',
    'password.good': 'Good',
    'password.strong': 'Strong',
    'password.securityReminder': 'Security Reminder:',
    'password.schoolEmailWarning': 'Please do not use the same password as your school email account. For account security, we recommend using different passwords for each service.',
    'password.commonPasswordDanger': 'Danger:',
    'password.commonPasswordMessage': 'You are using a common password that is easily cracked. Please choose a more secure password.',
    'password.leakedPasswordRisk': 'High Risk:',
    'password.leakedPasswordMessage': 'This password matches known leaked password patterns and is extremely vulnerable to attackers. Please change to a more secure password immediately.',
    // Forgot password page
    'auth.emailSent': 'Email Sent',
    'auth.checkYourEmail': 'Please check your email',
    'auth.resetLinkSent': 'We have sent a password reset link to',
    'auth.resetLinkSentComplete': 'sent a password reset link.',
    'auth.checkSpamFolder': 'If you did not receive the email, please check your spam folder.',
    'auth.enterSchoolEmail': 'Enter your school email address and we will send you a reset link',
    'auth.schoolEmailPlaceholder': 'student@ln.edu.hk or student@ln.hk',
    'auth.useSchoolEmail': 'Please use your school email address (@ln.edu.hk or @ln.hk)',
    'auth.sendResetFailed': 'Failed to send reset email, please try again later',
    'auth.sending': 'Sending...',
    'auth.securityReminder': 'Security Reminder',
    'auth.resetLinkExpiry': 'The reset link will expire in 24 hours. If you did not request a password reset, please ignore this email.',
    // Swipe hint
    'swipe.hint': 'Swipe right anywhere on screen to open menu',
    'swipe.dismissHint': 'Scroll to dismiss hint',
    // Cookie consent
    'cookie.title': 'Cookie 使用同意',
    'cookie.description': '本網站使用 Cookie 來確保您獲得最佳的瀏覽體驗。',
    'cookie.accept': '我了解',
    'cookie.learnMore': '了解更多',
  },
  'zh-TW': {
    'hero.title': '歡迎來到',
    'hero.subtitle': '真實可靠的Reg科聖經，幫助同學們作出明智的選擇',
    'hero.action': '評論',
    'hero.actions': ['發表評價', '投票', '提出問題', '回答問題'],
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
    'auth.passwordMatch': '兩次密碼一致',
    'auth.rememberMe': '記住我',
    'auth.authFailed': '認證失敗，請檢查資料',
    'auth.secureConnection': '您的憑證將會被加密並在安全的連接中發送。',
    'auth.schoolPasswordReminder': '請不要使用與您的學校郵件帳戶相同的密碼。為了保護您的帳戶安全，建議為每個服務使用不同的密碼。',
    'auth.forgotPassword': '忘記密碼？',
    'auth.resetPassword': '重置密碼',
    'auth.sendResetEmail': '發送重置郵件',
    'auth.resetEmailSent': '密碼重置郵件已發送到您的電子郵件地址。',
    'auth.backToLogin': '返回登入',
    'auth.backToHome': '返回首頁',
    'auth.noAccount': '沒有帳戶？',
    'auth.haveAccount': '已有帳戶？',
    'auth.contact': '聯絡',
    'auth.terms': '條款',
    'auth.privacy': '隱私',
    'auth.help': '幫助中心',
    // Auth page titles and descriptions
    'auth.welcomeBack': '歡迎回來',
    'auth.createStudentAccount': '創建您的學生帳戶',
    'auth.fillInfoToCreate': '填寫以下資訊來創建您的學生帳戶',
    'auth.studentInfoVerification': '學生資訊驗證',
    'auth.passwordSetup': '密碼設定',
    'auth.enterAccountInfo': '輸入您的帳戶資訊來登入',
    'auth.resetYourPassword': 'Reset your password',
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
    // Password Security
    'password.strength': '密碼強度',
    'password.requirements': '密碼要求：',
    'password.length': '密碼長度為 8-40 個字符',
    'password.uppercase': '包含至少 1 個大寫字母',
    'password.lowercase': '包含至少 1 個小寫字母',
    'password.special': '包含至少 1 個特殊符號 (!@#$%^&*等)',
    'password.number': '包含至少 1 個數字',
    'password.notCommon': '不是常用密碼',
    'password.notLeaked': '不匹配已知洩露密碼模式',
    'password.notSimilarToEmail': '不應與學校郵件地址相似',
    'password.lengthSuggestion': '建議使用 12 個字符以上以提高安全性',
    'password.weak': '弱',
    'password.fair': '一般',
    'password.good': '良好',
    'password.strong': '強',
    'password.securityReminder': '安全提醒：',
    'password.schoolEmailWarning': '請不要使用與您的學校郵件帳戶相同的密碼。為了保護您的帳戶安全，建議為每個服務使用不同的密碼。',
    'password.commonPasswordDanger': '危險：',
    'password.commonPasswordMessage': '您使用的是常見密碼，這種密碼很容易被破解。請選擇一個更安全的密碼。',
    'password.leakedPasswordRisk': '高風險：',
    'password.leakedPasswordMessage': '此密碼匹配已知的洩露密碼模式，極易被攻擊者猜測。請立即更換為更安全的密碼。',
    // Forgot password page
    'auth.emailSent': '郵件已發送',
    'auth.checkYourEmail': '請檢查您的郵箱',
    'auth.resetLinkSent': '我們已向',
    'auth.resetLinkSentComplete': '發送了密碼重置連結。',
    'auth.checkSpamFolder': '如果您沒有收到郵件，請檢查垃圾郵件資料夾。',
    'auth.enterSchoolEmail': '輸入您的學校郵件地址，我們將發送重置連結給您',
    'auth.schoolEmailPlaceholder': 'student@ln.edu.hk 或 student@ln.hk',
    'auth.useSchoolEmail': '請使用您的學校郵件地址（@ln.edu.hk 或 @ln.hk）',
    'auth.sendResetFailed': '發送重置郵件失敗，請稍後再試',
    'auth.sending': '發送中...',
    'auth.securityReminder': '安全提醒',
    'auth.resetLinkExpiry': '重置連結將在 24 小時後過期。如果您沒有請求重置密碼，請忽略此郵件。',
    // Swipe hint
    'swipe.hint': '在屏幕任意位置向右滑動展開選單',
    'swipe.dismissHint': '滾動頁面關閉提示',
    // Cookie consent
    'cookie.title': 'Cookie 使用同意',
    'cookie.description': '本網站使用 Cookie 來確保您獲得最佳的瀏覽體驗。',
    'cookie.accept': '我了解',
    'cookie.learnMore': '了解更多',
  },
  'zh-CN': {
    'hero.title': '欢迎来到',
    'hero.subtitle': '您诚实的课程和讲师评价平台，帮助同学们做出明智的决定',
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
    'auth.passwordMatch': '两次密码一致',
    'auth.rememberMe': '记住我',
    'auth.authFailed': '认证失败，请检查资料',
    'auth.secureConnection': '您的凭证将会被加密并在安全的连接中发送。',
    'auth.schoolPasswordReminder': '请不要使用与您的学校邮件账户相同的密码。为了保护您的账户安全，建议为每个服务使用不同的密码。',
    'auth.forgotPassword': '忘记密码？',
    'auth.resetPassword': '重置密码',
    'auth.sendResetEmail': '发送重置邮件',
    'auth.resetEmailSent': '密码重置邮件已发送至您的电子邮箱。',
    'auth.backToLogin': '返回登录',
    'auth.backToHome': '返回首页',
    'auth.noAccount': '没有账户？',
    'auth.haveAccount': '已有账户？',
    'auth.contact': '联系',
    'auth.terms': '条款',
    'auth.privacy': '隐私',
    'auth.help': '帮助中心',
    // Auth page titles and descriptions
    'auth.welcomeBack': '欢迎回来',
    'auth.createStudentAccount': '创建您的学生账户',
    'auth.fillInfoToCreate': '填写以下信息来创建您的学生账户',
    'auth.studentInfoVerification': '学生信息验证',
    'auth.passwordSetup': '密码设置',
    'auth.enterAccountInfo': '输入您的账户信息来登录',
    'auth.resetYourPassword': '重置您的密码',
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
    // Password Security
    'password.strength': '密码强度',
    'password.requirements': '密码要求：',
    'password.length': '密码长度为 8-40 个字符',
    'password.uppercase': '包含至少 1 个大写字母',
    'password.lowercase': '包含至少 1 个小写字母',
    'password.special': '包含至少 1 个特殊符号 (!@#$%^&*等)',
    'password.number': '包含至少 1 个数字',
    'password.notCommon': '不是常用密码',
    'password.notLeaked': '不匹配已知泄露密码模式',
    'password.notSimilarToEmail': '不应与学校邮件地址相似',
    'password.lengthSuggestion': '建议使用 12 个字符以上以提高安全性',
    'password.weak': '弱',
    'password.fair': '一般',
    'password.good': '良好',
    'password.strong': '强',
    'password.securityReminder': '安全提醒：',
    'password.schoolEmailWarning': '请不要使用与您的学校邮件账户相同的密码。为了保护您的账户安全，建议为每个服务使用不同的密码。',
    'password.commonPasswordDanger': '危险：',
    'password.commonPasswordMessage': '您使用的是常见密码，这种密码很容易被破解。请选择一个更安全的密码。',
    'password.leakedPasswordRisk': '高风险：',
    'password.leakedPasswordMessage': '此密码匹配已知的泄露密码模式，极易被攻击者猜测。请立即更换为更安全的密码。',
    // Forgot password page
    'auth.emailSent': '邮件已发送',
    'auth.checkYourEmail': '请检查您的邮箱',
    'auth.resetLinkSent': '我们已向',
    'auth.resetLinkSentComplete': '发送了密码重置链接。',
    'auth.checkSpamFolder': '如果您没有收到邮件，请检查垃圾邮件文件夹。',
    'auth.enterSchoolEmail': '输入您的学校邮件地址，我们将发送重置链接给您',
    'auth.schoolEmailPlaceholder': 'student@ln.edu.hk 或 student@ln.hk',
    'auth.useSchoolEmail': '请使用您的学校邮件地址（@ln.edu.hk 或 @ln.hk）',
    'auth.sendResetFailed': '发送重置邮件失败，请稍后再试',
    'auth.sending': '发送中...',
    'auth.securityReminder': '安全提醒',
    'auth.resetLinkExpiry': '重置链接将在 24 小时后过期。如果您没有请求重置密码，请忽略此邮件。',
    // Swipe hint
    'swipe.hint': '在屏幕任意位置向右滑动展开菜单',
    'swipe.dismissHint': '滚动页面关闭提示',
    // Cookie consent
    'cookie.title': 'Cookie 使用同意',
    'cookie.description': '本网站使用 Cookie 来确保您获得最佳的浏览体验。',
    'cookie.accept': '我了解',
    'cookie.learnMore': '了解更多',
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
