export const SEO_CONFIG = {
  // 基本網站信息
  SITE_NAME: 'LingUBible',
  BASE_URL: 'https://lingubible.com',
  
  // 默認 meta 圖片
  DEFAULT_OG_IMAGE: 'https://lingubible.com/meta-image.png',
  
  // 支持的語言
  SUPPORTED_LANGUAGES: ['en', 'zh-TW', 'zh-CN'] as const,
  
  // 語言特定的 meta 數據
  LANGUAGE_META: {
    en: {
      title: 'LingUBible - Course & Lecturer Reviews',
      description: 'A course and lecturer review platform designed specifically for Lingnan University students.',
      keywords: 'Lingnan University,Course Reviews,Lecturer Ratings,Student Feedback,University Courses,Teaching Evaluation,Course Guide,Course Recommendations',
      locale: 'en_US',
      lang: 'en'
    },
    'zh-TW': {
      title: 'LingUBible - Reg科聖經 | 嶺南大學課程與講師評價平台',
      description: '真實可靠的Reg科聖經，幫助嶺南大學同學們作出明智的選課決定。查看課程評價、講師評分，找到最適合的課程和教授。',
      keywords: 'Reg科聖經,嶺南大學,LingU,嶺大,課程評價,講師評分,學生評價,選課指南,課程推薦,教學評估,大學課程,選課神器,嶺南選課,課程評論,教授評價,學生心得,選修課推薦,必修課評價,嶺南課程,LingUBible',
      locale: 'zh_TW',
      lang: 'zh-TW'
    },
    'zh-CN': {
      title: 'LingUBible - 课程与讲师评价平台',
      description: '您诚实的课程和讲师评价平台，帮助同学们做出明智的决定',
      keywords: '岭南大学,课程评价,讲师评分,学生评价,大学课程,教学评估,选课指南,课程推荐',
      locale: 'zh_CN',
      lang: 'zh-CN'
    }
  },
  
  // 頁面特定的 meta 數據
  PAGE_META: {
    home: {
      en: {
        title: 'LingUBible - Course & Lecturer Reviews',
        description: 'Seek insights broadly, choose courses wisely. A platform for Lingnan University students to share honest course and lecturer reviews.'
      },
      'zh-TW': {
        title: 'LingUBible - Reg科聖經 | 嶺南大學選課神器',
        description: '博覽群評，擇善而學。Reg科聖經助你選課無憂！查看真實課程評價、講師評分，找到最適合的課程。嶺南大學學生專屬的選課指南平台。'
      },
      'zh-CN': {
        title: 'LingUBible - 课程与讲师评价平台',
        description: '博览群评，择善而学。专为岭南大学学生设计的课程和讲师评价平台。'
      }
    },
    courses: {
      en: {
        title: 'Courses - LingUBible',
        description: 'Browse and review courses at Lingnan University. Find detailed course information and student reviews.'
      },
      'zh-TW': {
        title: '課程 - LingUBible',
        description: '瀏覽和評價嶺南大學的課程。查找詳細的課程信息和學生評價。'
      },
      'zh-CN': {
        title: '课程 - LingUBible',
        description: '浏览和评价岭南大学的课程。查找详细的课程信息和学生评价。'
      }
    },
    login: {
      en: {
        title: 'Sign In - LingUBible',
        description: 'Sign in to your LingUBible account to access course reviews and share your experiences.'
      },
      'zh-TW': {
        title: '登入 - LingUBible',
        description: '登入您的 LingUBible 帳戶以查看課程評價並分享您的經驗。'
      },
      'zh-CN': {
        title: '登录 - LingUBible',
        description: '登录您的 LingUBible 账户以查看课程评价并分享您的经验。'
      }
    },
    register: {
      en: {
        title: 'Sign Up - LingUBible',
        description: 'Create your LingUBible account to start reviewing courses and lecturers at Lingnan University.'
      },
      'zh-TW': {
        title: '註冊 - LingUBible',
        description: '創建您的 LingUBible 帳戶，開始評價嶺南大學的課程和講師。'
      },
      'zh-CN': {
        title: '注册 - LingUBible',
        description: '创建您的 LingUBible 账户，开始评价岭南大学的课程和讲师。'
      }
    }
  }
} as const;

export type SupportedLanguage = typeof SEO_CONFIG.SUPPORTED_LANGUAGES[number];
export type PageType = keyof typeof SEO_CONFIG.PAGE_META; 