import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language } from '@/components/LanguageSwitcher';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: Record<string, any>) => any;
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

// Get initial language from cookie or detect from system
const getInitialLanguage = (): Language => {
  if (typeof window === 'undefined') return 'en'; // SSR safety
  
  const savedLanguage = getCookie('language');
  if (savedLanguage && ['en', 'zh-TW', 'zh-CN'].includes(savedLanguage)) {
    return savedLanguage as Language;
  }
  
  // 如果沒有保存的語言，檢測系統語言
  const browserLang = navigator.language || navigator.languages?.[0];
  let detectedLanguage: Language = 'en'; // 默認英文
  
  if (browserLang) {
    console.log('檢測到的瀏覽器語言:', browserLang);
    
    if (browserLang.startsWith('zh-TW') || 
        browserLang.startsWith('zh-Hant') || 
        browserLang === 'zh-HK' || 
        browserLang === 'zh-MO') {
      detectedLanguage = 'zh-TW';
    } else if (browserLang.startsWith('zh-CN') || 
               browserLang.startsWith('zh-Hans') || 
               browserLang.startsWith('zh-SG') || 
               browserLang === 'zh') {
      detectedLanguage = 'zh-CN';
    } else if (browserLang.startsWith('en')) {
      detectedLanguage = 'en';
    } else {
      // 對於其他語言，默認使用英文
      detectedLanguage = 'en';
    }
  }
  
  console.log('自動檢測語言設定為:', detectedLanguage);
  
  // 自動保存檢測到的語言到 cookie
  setCookie('language', detectedLanguage);
  
  return detectedLanguage;
};

const translations = {
  en: {
    // Site metadata
    'site.name': 'LingUBible',
    'site.title': 'LingUBible - Course & Lecturer Reviews',
    'site.description': 'Platform for college students to review courses and lecturers',
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
    'auth.pleaseVerifyStudentEmail': 'Please verify your Lingnanians email address first',
    'auth.passwordNotSecure': 'Password does not meet security requirements, please check the password strength indicator',
    'auth.secureConnection': 'Your credentials will be encrypted and sent in a secure connection.',
    'auth.schoolPasswordReminder': 'Please do not use the same password as your university webmail account. For account security, we recommend using different passwords for each service.',
    'auth.forgotPassword': 'Forgot password?',
    'auth.resetPassword': 'Reset Password',
    'auth.sendResetEmail': 'Send Reset Email',
    'auth.resetEmailSent': 'Password reset email has been sent to your email address.',
    'auth.studentVerificationSuccess': 'Lingnanians email verification successful! You can now set up your password to complete registration.',
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
    'auth.createStudentAccount': 'Create your Lingnanians account',
    'auth.fillInfoToCreate': 'Fill in the following information to create your Lingnanians account',
    'auth.studentInfoVerification': 'Lingnanians Information Verification',
    'auth.passwordSetup': 'Password Setup',
    'auth.enterAccountInfo': 'Enter your account information to sign in',
    'auth.resetYourPassword': 'Reset your password',
    'auth.signOut': 'Sign Out',
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
    'password.schoolEmailWarning': 'Please do not use the same password as your university webmail account. For account security, we recommend using different passwords for each service.',
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
    'auth.resetLinkWillExpire': 'Reset link will expire in 24 hours',
    'auth.checkEmailInbox': 'Please check your inbox:',
    'auth.canRetryReset': 'You can retry sending reset email',
    'auth.resendReset': 'Resend',
    'auth.sendResetLink': 'Send Reset Link',
    'auth.studentEmailAddress': 'Lingnanians Email Address',
    'auth.resetPasswordDescription': 'Enter your Lingnanians email address and we will send you a reset link',
    'auth.emailNotRegistered': 'This email address is not registered. Please register first or check your email address.',
    'auth.checkingEmailExists': 'Checking if email is registered...',
    'auth.emailRegistered': 'Email address is registered',
    'auth.invalidCredentials': 'Invalid email or password. Please check and try again.',
    'auth.registrationFailed': 'Registration failed. Please check your information and try again.',
    // Processing
    'auth.processing': 'Processing...',
    // Email placeholder
    'auth.emailPlaceholder': 'student@ln.edu.hk or student@ln.hk',
    // Email validation
    'auth.invalidStudentEmail': 'This email address is not a valid Lingnanians email address. Please use a valid @ln.edu.hk or @ln.hk email address.',
    // Email checking status
    'auth.checkingEmail': 'Checking email availability...',
    'auth.checkingAccount': 'Checking account...',
    'auth.emailAvailable': 'Email address available',
    // Student verification
    'verification.title': 'Lingnanians Email Verification',
    'verification.sendCode': 'Send Verification Code',
    'verification.onlyStudentEmails': 'Only @ln.edu.hk or @ln.hk email addresses can register',
    'verification.codeExpiry': 'Verification code valid for 10 minutes',
    'verification.maxAttempts': 'Maximum attempts to verify 3 times',
    'verification.resendAfter': 'Can resend after',
    'verification.enterCode': 'Enter 6-digit verification code',
    'verification.verifying': 'Verifying...',
    'verification.verify': 'Verify',
    'verification.resend': 'Resend',
    'verification.sendingCode': 'Sending verification code...',
    'verification.codeSent': 'Verification code has been sent to your email address, please check your inbox',
    'verification.verifyFailed': 'Verification failed',
    // Email reminder
    'email.reminder.title': '📧 Email Delivery Reminder',
    'email.reminder.checkSpam': 'If you don\'t receive the email, please check your spam/junk folder',
    'email.reminder.whitelist': 'Consider adding noreply@lingubible.com to your email whitelist',
    'email.reminder.deliveryTime': 'Email delivery may take 1-2 minutes',
    'email.reminder.contactSupport': 'If you still don\'t receive the email after 5 minutes, please contact support',
    // Password strength
    'password.strengthLabel': 'Strength:',
    // Swipe hint
    'swipe.hint': 'Swipe right anywhere on screen to open menu',
    'swipe.dismissHint': 'Scroll to dismiss hint',
    // Cookie consent
    'cookie.title': 'Cookie Consent',
    'cookie.description': 'This website uses cookies to ensure you get the best browsing experience.',
    'cookie.accept': 'Accept',
    'cookie.learnMore': 'Learn More',
    'cookie.decline': 'Decline',
    'cookie.close': 'Close',
    // Cookie policy details
    'cookie.policy.title': 'How We Use Cookies',
    'cookie.policy.intro': 'We use cookies to enhance your browsing experience and improve our services. Here\'s how:',
    'cookie.policy.essential.title': 'Essential Cookies',
    'cookie.policy.essential.desc': 'These cookies are necessary for the website to function properly. They enable basic features like page navigation, user authentication, and security.',
    'cookie.policy.functional.title': 'Functional Cookies',
    'cookie.policy.functional.desc': 'These cookies remember your preferences (like language settings, theme, and sidebar state) to provide a personalized experience.',
    'cookie.policy.analytics.title': 'Analytics Cookies',
    'cookie.policy.analytics.desc': 'We use these cookies to understand how visitors interact with our website, helping us improve performance and user experience.',
    'cookie.policy.types': 'Types of cookies we use:',
    'cookie.policy.type1': '• Authentication cookies to keep you logged in',
    'cookie.policy.type2': '• Language preference cookies',
    'cookie.policy.type3': '• Theme and layout preference cookies',
    'cookie.policy.type4': '• Anonymous usage analytics',
    'cookie.policy.retention': 'Cookie Retention',
    'cookie.policy.retention.desc': 'Most cookies are stored for up to 1 year, while session cookies are deleted when you close your browser.',
    'cookie.policy.control': 'Your Control',
    'cookie.policy.control.desc': 'You can control cookies through your browser settings. However, disabling certain cookies may affect website functionality.',
    'cookie.policy.contact': 'If you have questions about our cookie policy, please contact us.',
    // PWA Install
    'pwa.installAvailable': 'App Available',
    'pwa.installDescription': 'Install LingUBible for a better experience',
    'pwa.installBenefits': 'Faster loading, offline access, and native app experience',
    'pwa.install': 'Install',
    'pwa.installApp': 'Install App',
    'pwa.howToInstall': 'How to Install',
    'pwa.notNow': 'Not Now',
    'pwa.dismiss': 'Dismiss',
    'pwa.gotIt': 'Got It',
    'pwa.installSuccess': 'App installed successfully!',
    'pwa.installFailed': 'Installation failed. Please try again.',
    'pwa.alreadyInstalled': 'App is already installed',
    'pwa.updateAvailable': 'App update available',
    'pwa.updateNow': 'Update Now',
    'pwa.updateLater': 'Update Later',
    // User Stats
    'stats.onlineUsers': 'Online Users',
    'stats.totalRegistered': 'Total Registered',
    'stats.todayLogins': 'Today Logins',
    'stats.thisMonthLogins': 'This Month',
    'stats.usersOnline': 'users online',
    'stats.loading': 'Loading...',
    // OpenStatus
    'status.operational': 'Operational',
    'status.degraded': 'Degraded',
    'status.down': 'Down',
    'status.checking': 'Checking',
    'status.poweredBy': 'Powered by OpenStatus',
    // Avatar
    'avatar.customize': 'Customize Avatar',
    'avatar.combinations': 'combinations',
    'avatar.preview': 'Preview',
    'avatar.randomize': 'Randomize',
    'avatar.save': 'Save Avatar',
    'avatar.saving': 'Saving...',
    'avatar.resetToDefault': 'Reset to Default',
    'avatar.animals': 'Animals',
    'avatar.backgrounds': 'Backgrounds',
    'avatar.totalStats': 'Total {animals} animals × {backgrounds} backgrounds = {total} combinations',
    'avatar.saveSuccess': 'Avatar Saved',
    'avatar.saveSuccessDesc': 'Your custom avatar has been successfully saved to the cloud',
    'avatar.saveFailed': 'Save Failed',
    'avatar.saveFailedDesc': 'Unable to save avatar, please try again later',
    'avatar.resetSuccess': 'Avatar Reset',
    'avatar.resetSuccessDesc': 'Restored to system default avatar',
    'avatar.deleteFailed': 'Delete Failed',
    'avatar.deleteFailedDesc': 'Unable to delete avatar, please try again later',
    // Background colors
    'background.sunset': 'Sunset',
    'background.peach': 'Peach',
    'background.coral': 'Coral',
    'background.rose': 'Rose',
    'background.ocean': 'Ocean',
    'background.sky': 'Sky',
    'background.mint': 'Mint',
    'background.forest': 'Forest',
    'background.lavender': 'Lavender',
    'background.grape': 'Grape',
    'background.plum': 'Plum',
    'background.cloud': 'Cloud',
    'background.stone': 'Stone',
    'background.warm': 'Warm',
    'background.rainbow': 'Rainbow',
    'background.aurora': 'Aurora',
    'background.cosmic': 'Cosmic',
    'background.tropical': 'Tropical',
    'background.fire': 'Fire',
    'background.ice': 'Ice',
  },
  'zh-TW': {
    // Site metadata
    'site.name': 'LingUBible',
    'site.title': 'LingUBible - 課程與講師評價平台',
    'site.description': '真實可靠的Reg科聖經，幫助同學們作出明智的選擇',
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
    'auth.pleaseVerifyStudentEmail': '請先驗證您的嶺南人電子郵件地址',
    'auth.passwordNotSecure': '密碼不符合安全要求，請檢查密碼強度指示器',
    'auth.secureConnection': '您的憑證將會被加密並在安全的連接中發送。',
    'auth.schoolPasswordReminder': '請不要使用與您的學校郵件帳戶相同的密碼。為了保護您的帳戶安全，建議為每個服務使用不同的密碼。',
    'auth.forgotPassword': '忘記密碼？',
    'auth.resetPassword': '重置密碼',
    'auth.sendResetEmail': '發送重置郵件',
    'auth.resetEmailSent': '密碼重置郵件已發送到您的電子郵件地址。',
    'auth.studentVerificationSuccess': '嶺南人郵件驗證成功！您現在可以設置密碼以完成註冊。',
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
    'auth.createStudentAccount': '創建您的嶺南人帳戶',
    'auth.fillInfoToCreate': '填寫以下資訊來創建您的嶺南人帳戶',
    'auth.studentInfoVerification': '嶺南人資訊驗證',
    'auth.passwordSetup': '密碼設定',
    'auth.enterAccountInfo': '輸入您的帳戶資訊來登入',
    'auth.resetYourPassword': 'Reset your password',
    'auth.signOut': '登出',
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
    'auth.resetLinkExpiry': '重置連結將在 24 小時後過期',
    'auth.resetLinkWillExpire': '重設連結將在 24 小時後過期',
    'auth.checkEmailInbox': '請檢查您的信箱：',
    'auth.canRetryReset': '您可以重新嘗試發送重設郵件',
    'auth.resendReset': '重新發送',
    'auth.sendResetLink': '發送重設連結',
    'auth.studentEmailAddress': '嶺南人郵件地址',
    'auth.resetPasswordDescription': '輸入您的嶺南人郵件地址，我們將發送重設密碼的連結給您',
    'auth.emailNotRegistered': '此郵件地址尚未註冊。請先註冊或檢查您的郵件地址。',
    'auth.checkingEmailExists': '檢查郵件是否已註冊...',
    'auth.emailRegistered': '郵件地址已註冊',
    'auth.invalidCredentials': '郵件地址或密碼錯誤，請檢查後重試',
    'auth.registrationFailed': '註冊失敗，請檢查資料後重試',
    // Processing
    'auth.processing': '處理中...',
    // Email placeholder
    'auth.emailPlaceholder': 'student@ln.edu.hk 或 student@ln.hk',
    // Email validation
    'auth.invalidStudentEmail': '此郵件地址不是有效的嶺南人郵件地址。請使用有效的 @ln.edu.hk 或 @ln.hk 郵件地址。',
    // Email checking status
    'auth.checkingEmail': '檢查郵件是否可用...',
    'auth.checkingAccount': '檢查帳戶...',
    'auth.emailAvailable': '郵件地址可用',
    // Student verification
    'verification.title': '嶺南人郵件驗證',
    'verification.sendCode': '發送驗證碼',
    'verification.onlyStudentEmails': '只有 @ln.edu.hk 或 @ln.hk 郵件地址的嶺南人才能註冊',
    'verification.codeExpiry': '驗證碼有效期為 10 分鐘',
    'verification.maxAttempts': '最多可嘗試驗證 3 次',
    'verification.resendAfter': '後可重新發送',
    'verification.enterCode': '請輸入 6 位數驗證碼',
    'verification.verifying': '驗證中...',
    'verification.verify': '驗證',
    'verification.resend': '重新',
    'verification.sendingCode': '正在發送驗證碼...',
    'verification.codeSent': '驗證碼已發送到您的郵件地址，請檢查您的信箱',
    'verification.verifyFailed': '驗證失敗',
    // Email reminder
    'email.reminder.title': '📧 郵件發送提醒',
    'email.reminder.checkSpam': '如果您沒有收到郵件，請檢查垃圾郵件資料夾',
    'email.reminder.whitelist': '建議將 noreply@lingubible.com 加入您的郵件白名單',
    'email.reminder.deliveryTime': '郵件發送可能需要 1-2 分鐘',
    'email.reminder.contactSupport': '如果 5 分鐘後仍未收到郵件，請聯繫技術支援',
    // Password strength
    'password.strengthLabel': '強度：',
    // Swipe hint
    'swipe.hint': '在屏幕任意位置向右滑動展開選單',
    'swipe.dismissHint': '滾動頁面關閉提示',
    // Cookie consent
    'cookie.title': 'Cookie 使用同意',
    'cookie.description': '本網站使用 Cookie 來確保您獲得最佳的瀏覽體驗。',
    'cookie.accept': '我了解',
    'cookie.learnMore': '了解更多',
    'cookie.decline': '拒絕',
    'cookie.close': '關閉',
    // Cookie policy details
    'cookie.policy.title': '我們如何使用 Cookie',
    'cookie.policy.intro': '我們使用 Cookie 來提升您的瀏覽體驗並改善我們的服務。具體如下：',
    'cookie.policy.essential.title': '必要 Cookie',
    'cookie.policy.essential.desc': '這些 Cookie 是網站正常運作所必需的。它們啟用基本功能，如頁面導航、用戶認證和安全性。',
    'cookie.policy.functional.title': '功能性 Cookie',
    'cookie.policy.functional.desc': '這些 Cookie 會記住您的偏好設定（如語言設定、主題和側邊欄狀態），以提供個人化體驗。',
    'cookie.policy.analytics.title': '分析 Cookie',
    'cookie.policy.analytics.desc': '我們使用這些 Cookie 來了解訪客如何與我們的網站互動，幫助我們改善性能和用戶體驗。',
    'cookie.policy.types': '我們使用的 Cookie 類型：',
    'cookie.policy.type1': '• 身份驗證 Cookie，保持您的登入狀態',
    'cookie.policy.type2': '• 語言偏好 Cookie',
    'cookie.policy.type3': '• 主題和佈局偏好 Cookie',
    'cookie.policy.type4': '• 匿名使用分析',
    'cookie.policy.retention': 'Cookie 保存期限',
    'cookie.policy.retention.desc': '大多數 Cookie 會保存最多 1 年，而會話 Cookie 會在您關閉瀏覽器時刪除。',
    'cookie.policy.control': '您的控制權',
    'cookie.policy.control.desc': '您可以通過瀏覽器設定來控制 Cookie。但是，禁用某些 Cookie 可能會影響網站功能。',
    'cookie.policy.contact': '如果您對我們的 Cookie 政策有疑問，請聯繫我們。',
    // PWA Install
    'pwa.installAvailable': '應用程式可安裝',
    'pwa.installDescription': '安裝 LingUBible 獲得更好的使用體驗',
    'pwa.installBenefits': '更快載入、離線存取和原生應用體驗',
    'pwa.install': '安裝',
    'pwa.installApp': '安裝應用',
    'pwa.howToInstall': '安裝方法',
    'pwa.notNow': '稍後再說',
    'pwa.dismiss': '關閉',
    'pwa.gotIt': '我知道了',
    'pwa.installSuccess': '應用安裝成功！',
    'pwa.installFailed': '安裝失敗，請重試。',
    'pwa.alreadyInstalled': '應用已安裝',
    'pwa.updateAvailable': '應用更新可用',
    'pwa.updateNow': '立即更新',
    'pwa.updateLater': '稍後更新',
    // User Stats
    'stats.onlineUsers': '在線用戶',
    'stats.totalRegistered': '總註冊數',
    'stats.todayLogins': '今日登入',
    'stats.thisMonthLogins': '本月登入',
    'stats.usersOnline': '位用戶在線',
    'stats.loading': '載入中...',
    // OpenStatus
    'status.operational': 'Operational',
    'status.degraded': 'Degraded',
    'status.down': 'Down',
    'status.checking': 'Checking',
    'status.poweredBy': 'Powered by OpenStatus',
    // Avatar
    'avatar.customize': '自定義頭像',
    'avatar.combinations': '種組合',
    'avatar.preview': '預覽效果',
    'avatar.randomize': '隨機生成',
    'avatar.save': '保存頭像',
    'avatar.saving': '保存中...',
    'avatar.resetToDefault': '重置為默認',
    'avatar.animals': '動物',
    'avatar.backgrounds': '背景',
    'avatar.totalStats': '共有 {animals} 種動物 × {backgrounds} 種背景 = {total} 種組合',
    'avatar.saveSuccess': '頭像已保存',
    'avatar.saveSuccessDesc': '您的自定義頭像已成功保存到雲端',
    'avatar.saveFailed': '保存失敗',
    'avatar.saveFailedDesc': '無法保存頭像，請稍後再試',
    'avatar.resetSuccess': '頭像已重置',
    'avatar.resetSuccessDesc': '已恢復為系統默認頭像',
    'avatar.deleteFailed': '刪除失敗',
    'avatar.deleteFailedDesc': '無法刪除頭像，請稍後再試',
    // Background colors
    'background.sunset': '夕陽',
    'background.peach': '蜜桃',
    'background.coral': '珊瑚',
    'background.rose': '玫瑰',
    'background.ocean': '海洋',
    'background.sky': '天空',
    'background.mint': '薄荷',
    'background.forest': '森林',
    'background.lavender': '薰衣草',
    'background.grape': '葡萄',
    'background.plum': '梅子',
    'background.cloud': '雲朵',
    'background.stone': '石頭',
    'background.warm': '暖陽',
    'background.rainbow': '彩虹',
    'background.aurora': '極光',
    'background.cosmic': '宇宙',
    'background.tropical': '熱帶',
    'background.fire': '火焰',
    'background.ice': '冰雪',
  },
  'zh-CN': {
    // Site metadata
    'site.name': 'LingUBible',
    'site.title': 'LingUBible - 课程与讲师评价平台',
    'site.description': '您诚实的课程和讲师评价平台，帮助同学们做出明智的决定',
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
    'auth.pleaseVerifyStudentEmail': '请先验证您的岭南人电子邮件地址',
    'auth.passwordNotSecure': '密码不符合安全要求，请检查密码强度指示器',
    'auth.secureConnection': '您的凭证将会被加密并在安全的连接中发送。',
    'auth.schoolPasswordReminder': '请不要使用与您的学校邮件账户相同的密码。为了保护您的账户安全，建议为每个服务使用不同的密码。',
    'auth.forgotPassword': '忘记密码？',
    'auth.resetPassword': '重置密码',
    'auth.sendResetEmail': '发送重置邮件',
    'auth.resetEmailSent': '密码重置邮件已发送至您的电子邮箱。',
    'auth.studentVerificationSuccess': '岭南人邮件验证成功！您现在可以设置密码以完成注册。',
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
    'auth.createStudentAccount': '创建您的岭南人账户',
    'auth.fillInfoToCreate': '填写以下信息来创建您的岭南人账户',
    'auth.studentInfoVerification': '岭南人信息验证',
    'auth.passwordSetup': '密码设置',
    'auth.enterAccountInfo': '输入您的账户信息来登录',
    'auth.resetYourPassword': '重置您的密码',
    'auth.signOut': '登出',
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
    'auth.resetLinkWillExpire': '重置链接将在 24 小时后过期',
    'auth.checkEmailInbox': '请检查您的邮箱：',
    'auth.canRetryReset': '您可以重新尝试发送重置邮件',
    'auth.resendReset': '重新发送',
    'auth.sendResetLink': '发送重置链接',
    'auth.studentEmailAddress': '岭南人邮件地址',
    'auth.resetPasswordDescription': '输入您的岭南人邮件地址，我们将发送重置密码的链接给您',
    'auth.emailNotRegistered': '此邮件地址尚未注册。请先注册或检查您的邮件地址。',
    'auth.checkingEmailExists': '检查邮件是否已注册...',
    'auth.emailRegistered': '邮件地址已注册',
    'auth.invalidCredentials': '邮件地址或密码错误，请检查后重试',
    'auth.registrationFailed': '注册失败，请检查资料后重试',
    // Processing
    'auth.processing': '处理中...',
    // Email placeholder
    'auth.emailPlaceholder': 'student@ln.edu.hk 或 student@ln.hk',
    // Email validation
    'auth.invalidStudentEmail': '此邮件地址不是有效的岭南人邮件地址。请使用有效的 @ln.edu.hk 或 @ln.hk 邮件地址。',
    // Email checking status
    'auth.checkingEmail': '检查邮件是否可用...',
    'auth.checkingAccount': '检查账户...',
    'auth.emailAvailable': '邮件地址可用',
    // Student verification
    'verification.title': '岭南人邮件验证',
    'verification.sendCode': '发送验证码',
    'verification.onlyStudentEmails': '只有 @ln.edu.hk 或 @ln.hk 邮件地址的岭南人才能注册',
    'verification.codeExpiry': '验证码有效期为 10 分钟',
    'verification.maxAttempts': '最多可尝试验证 3 次',
    'verification.resendAfter': '后可重新发送',
    'verification.enterCode': '请输入 6 位数验证码',
    'verification.verifying': '验证中...',
    'verification.verify': '验证',
    'verification.resend': '重新',
    'verification.sendingCode': '正在发送验证码...',
    'verification.codeSent': '验证码已发送到您的邮件地址，请检查您的信箱',
    'verification.verifyFailed': '验证失败',
    // Email reminder
    'email.reminder.title': '📧 邮件发送提醒',
    'email.reminder.checkSpam': '如果您没有收到邮件，请检查垃圾邮件文件夹',
    'email.reminder.whitelist': '建议将 noreply@lingubible.com 加入您的邮件白名单',
    'email.reminder.deliveryTime': '邮件发送可能需要 1-2 分钟',
    'email.reminder.contactSupport': '如果 5 分钟后仍未收到邮件，请联系技术支持',
    // Password strength
    'password.strengthLabel': '强度：',
    // Swipe hint
    'swipe.hint': '在屏幕任意位置向右滑动展开菜单',
    'swipe.dismissHint': '滚动页面关闭提示',
    // Cookie consent
    'cookie.title': 'Cookie 使用同意',
    'cookie.description': '本网站使用 Cookie 来确保您获得最佳的浏览体验。',
    'cookie.accept': '我了解',
    'cookie.learnMore': '了解更多',
    'cookie.decline': '拒绝',
    'cookie.close': '关闭',
    // Cookie policy details
    'cookie.policy.title': '我们如何使用 Cookie',
    'cookie.policy.intro': '我们使用 Cookie 来提升您的浏览体验并改善我们的服务。具体如下：',
    'cookie.policy.essential.title': '必要 Cookie',
    'cookie.policy.essential.desc': '这些 Cookie 是网站正常运作所必需的。它们启用基本功能，如页面导航、用户认证和安全性。',
    'cookie.policy.functional.title': '功能性 Cookie',
    'cookie.policy.functional.desc': '这些 Cookie 会记住您的偏好设置（如语言设置、主题和侧边栏状态），以提供个性化体验。',
    'cookie.policy.analytics.title': '分析 Cookie',
    'cookie.policy.analytics.desc': '我们使用这些 Cookie 来了解访客如何与我们网站互动，帮助我们改善性能和用户体验。',
    'cookie.policy.types': '我们使用的 Cookie 类型：',
    'cookie.policy.type1': '• 身份验证 Cookie，保持您的登录状态',
    'cookie.policy.type2': '• 语言偏好 Cookie',
    'cookie.policy.type3': '• 主题和布局偏好 Cookie',
    'cookie.policy.type4': '• 匿名使用分析',
    'cookie.policy.retention': 'Cookie 保存期限',
    'cookie.policy.retention.desc': '大多数 Cookie 会保存最多 1 年，而会话 Cookie 会在您关闭浏览器时删除。',
    'cookie.policy.control': '您的控制权',
    'cookie.policy.control.desc': '您可以通过浏览器设置来控制 Cookie。但是，禁用某些 Cookie 可能会影响网站功能。',
    'cookie.policy.contact': '如果您对我们的 Cookie 政策有疑问，请联系我们。',
    // PWA Install
    'pwa.installAvailable': '应用程序可安装',
    'pwa.installDescription': '安装 LingUBible 获得更好的使用体验',
    'pwa.installBenefits': '更快加载、离线访问和原生应用体验',
    'pwa.install': '安装',
    'pwa.installApp': '安装应用',
    'pwa.howToInstall': '安装方法',
    'pwa.notNow': '稍后再说',
    'pwa.dismiss': '关闭',
    'pwa.gotIt': '我知道了',
    'pwa.installSuccess': '应用安装成功！',
    'pwa.installFailed': '安装失败，请重试。',
    'pwa.alreadyInstalled': '应用已安装',
    'pwa.updateAvailable': '应用更新可用',
    'pwa.updateNow': '立即更新',
    'pwa.updateLater': '稍后更新',
    // User Stats
    'stats.onlineUsers': '在线用户',
    'stats.totalRegistered': '总注册数',
    'stats.todayLogins': '今日登录',
    'stats.thisMonthLogins': '本月登录',
    'stats.usersOnline': '位用户在线',
    'stats.loading': '加载中...',
    // OpenStatus
    'status.operational': 'Operational',
    'status.degraded': 'Degraded',
    'status.down': 'Down',
    'status.checking': 'Checking',
    'status.poweredBy': 'Powered by OpenStatus',
    // Avatar
    'avatar.customize': '自定义头像',
    'avatar.combinations': '种组合',
    'avatar.preview': '预览效果',
    'avatar.randomize': '随机生成',
    'avatar.save': '保存头像',
    'avatar.saving': '保存中...',
    'avatar.resetToDefault': '重置为默认',
    'avatar.animals': '动物',
    'avatar.backgrounds': '背景',
    'avatar.totalStats': '共有 {animals} 种动物 × {backgrounds} 种背景 = {total} 种组合',
    'avatar.saveSuccess': '头像已保存',
    'avatar.saveSuccessDesc': '您的自定义头像已成功保存到云端',
    'avatar.saveFailed': '保存失败',
    'avatar.saveFailedDesc': '无法保存头像，请稍后再试',
    'avatar.resetSuccess': '头像已重置',
    'avatar.resetSuccessDesc': '已恢复为系统默认头像',
    'avatar.deleteFailed': '删除失败',
    'avatar.deleteFailedDesc': '无法删除头像，请稍后再试',
    // Background colors
    'background.sunset': '夕阳',
    'background.peach': '蜜桃',
    'background.coral': '珊瑚',
    'background.rose': '玫瑰',
    'background.ocean': '海洋',
    'background.sky': '天空',
    'background.mint': '薄荷',
    'background.forest': '森林',
    'background.lavender': '薰衣草',
    'background.grape': '葡萄',
    'background.plum': '梅子',
    'background.cloud': '云朵',
    'background.stone': '石头',
    'background.warm': '暖阳',
    'background.rainbow': '彩虹',
    'background.aurora': '极光',
    'background.cosmic': '宇宙',
    'background.tropical': '热带',
    'background.fire': '火焰',
    'background.ice': '冰雪',
  },
};

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  // Update language and save to cookie
  const setLanguage = (newLanguage: Language) => {
    console.log('切換語言到:', newLanguage);
    setLanguageState(newLanguage);
    setCookie('language', newLanguage);
    
    // 觸發 PWA manifest 更新
    if (typeof window !== 'undefined' && window.updatePWAManifest) {
      setTimeout(() => {
        window.updatePWAManifest();
      }, 100); // 稍微延遲確保 cookie 已設置
    }
  };

  // 監聽系統語言變化（可選功能）
  useEffect(() => {
    const handleLanguageChange = () => {
      // 只有在沒有手動設置語言時才響應系統語言變化
      const savedLanguage = getCookie('language');
      if (!savedLanguage) {
        const newLanguage = getInitialLanguage();
        setLanguageState(newLanguage);
      }
    };

    // 監聽語言變化事件（某些瀏覽器支持）
    window.addEventListener('languagechange', handleLanguageChange);
    
    return () => {
      window.removeEventListener('languagechange', handleLanguageChange);
    };
  }, []);

  const t = (key: string, params?: Record<string, any>): any => {
    let translation = translations[language][key] || key;
    
    // 如果有參數，進行字符串替換
    if (params && typeof translation === 'string') {
      Object.keys(params).forEach(paramKey => {
        const placeholder = `{${paramKey}}`;
        translation = translation.replace(new RegExp(placeholder, 'g'), params[paramKey]);
      });
    }
    
    return translation;
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
