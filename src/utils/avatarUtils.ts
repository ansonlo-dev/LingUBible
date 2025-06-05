// 頭像工具函數
export interface AvatarConfig {
  showPersonalAvatar: boolean; // 是否顯示個人頭像
  showAnonymousAvatar: boolean; // 是否顯示匿名頭像
  size: 'sm' | 'md' | 'lg';
  context: 'profile' | 'review' | 'comment' | 'menu';
}

// 擴展的可愛動物頭像列表 (60種)
const CUTE_AVATARS = [
  // 哺乳動物
  '🐱', '🐶', '🐰', '🐻', '🐼', '🐨', '🐯', '🦁', '🐵', '🐺',
  '🦊', '🐹', '🐷', '🐮', '🐸', '🐧', '🦝', '🐗', '🐴', '🦄',
  '🐙', '🐢', '🐳', '🐬', '🦭', '🦦', '🦘', '🐘', '🦏', '🦛',
  // 鳥類
  '🐦', '🦅', '🦆', '🦢', '🦉', '🦚', '🐓', '🦃', '🕊️', '🦜',
  // 海洋生物
  '🐠', '🐟', '🦈', '🐡', '🦀', '🦞', '🐚', '🪼', '🐋', '🦑',
  // 昆蟲和其他
  '🐝', '🦋', '🐞', '🐛', '🦗', '🕷️', '🐜', '🐌', '🐿️', '🦔'
];

// 背景顏色方案 (20種)
const BACKGROUND_COLORS = [
  // 溫暖色調
  { name: 'background.sunset', light: 'from-orange-100 to-pink-100', dark: 'from-orange-900/30 to-pink-900/30' },
  { name: 'background.peach', light: 'from-peach-100 to-orange-100', dark: 'from-orange-900/30 to-red-900/30' },
  { name: 'background.coral', light: 'from-red-100 to-pink-100', dark: 'from-red-900/30 to-pink-900/30' },
  { name: 'background.rose', light: 'from-pink-100 to-rose-100', dark: 'from-pink-900/30 to-rose-900/30' },
  
  // 冷色調
  { name: 'background.ocean', light: 'from-blue-100 to-cyan-100', dark: 'from-blue-900/30 to-cyan-900/30' },
  { name: 'background.sky', light: 'from-sky-100 to-blue-100', dark: 'from-sky-900/30 to-blue-900/30' },
  { name: 'background.mint', light: 'from-green-100 to-emerald-100', dark: 'from-green-900/30 to-emerald-900/30' },
  { name: 'background.forest', light: 'from-emerald-100 to-teal-100', dark: 'from-emerald-900/30 to-teal-900/30' },
  
  // 紫色系
  { name: 'background.lavender', light: 'from-purple-100 to-pink-100', dark: 'from-purple-900/30 to-pink-900/30' },
  { name: 'background.grape', light: 'from-violet-100 to-purple-100', dark: 'from-violet-900/30 to-purple-900/30' },
  { name: 'background.plum', light: 'from-indigo-100 to-purple-100', dark: 'from-indigo-900/30 to-purple-900/30' },
  
  // 中性色調
  { name: 'background.cloud', light: 'from-gray-100 to-slate-100', dark: 'from-gray-900/30 to-slate-900/30' },
  { name: 'background.stone', light: 'from-stone-100 to-gray-100', dark: 'from-stone-900/30 to-gray-900/30' },
  { name: 'background.warm', light: 'from-amber-100 to-yellow-100', dark: 'from-amber-900/30 to-yellow-900/30' },
  
  // 特殊漸變
  { name: 'background.rainbow', light: 'from-red-100 via-yellow-100 to-blue-100', dark: 'from-red-900/30 via-yellow-900/30 to-blue-900/30' },
  { name: 'background.aurora', light: 'from-green-100 via-blue-100 to-purple-100', dark: 'from-green-900/30 via-blue-900/30 to-purple-900/30' },
  { name: 'background.cosmic', light: 'from-indigo-100 via-purple-100 to-pink-100', dark: 'from-indigo-900/30 via-purple-900/30 to-pink-900/30' },
  { name: 'background.tropical', light: 'from-cyan-100 via-teal-100 to-green-100', dark: 'from-cyan-900/30 via-teal-900/30 to-green-900/30' },
  { name: 'background.fire', light: 'from-red-100 via-orange-100 to-yellow-100', dark: 'from-red-900/30 via-orange-900/30 to-yellow-900/30' },
  { name: 'background.ice', light: 'from-blue-100 via-cyan-100 to-white', dark: 'from-blue-900/30 via-cyan-900/30 to-slate-900/30' }
];

// 用戶自定義頭像接口
export interface CustomAvatar {
  animal: string;
  backgroundIndex: number;
  createdAt: string;
}

// 根據字符串生成一致的隨機索引
export const getConsistentRandomIndex = (seed: string, arrayLength: number): number => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 轉換為32位整數
  }
  return Math.abs(hash) % arrayLength;
};

// 頭像快取
const avatarCache = new Map<string, { animal: string; background: typeof BACKGROUND_COLORS[0] }>();

// 清除快取
export const clearAvatarCache = () => {
  avatarCache.clear();
};

// 獲取用戶的個人頭像（基於用戶ID的一致性隨機頭像）
export const getPersonalAvatar = (userId: string): { animal: string; background: typeof BACKGROUND_COLORS[0] } => {
  const cacheKey = `personal_${userId}`;
  
  if (avatarCache.has(cacheKey)) {
    return avatarCache.get(cacheKey)!;
  }
  
  const animalIndex = getConsistentRandomIndex(userId, CUTE_AVATARS.length);
  const backgroundIndex = getConsistentRandomIndex(userId + '_bg', BACKGROUND_COLORS.length);
  
  const result = {
    animal: CUTE_AVATARS[animalIndex],
    background: BACKGROUND_COLORS[backgroundIndex]
  };
  
  avatarCache.set(cacheKey, result);
  return result;
};

// 獲取匿名頭像（基於評論ID的隨機頭像）
export const getAnonymousAvatar = (reviewId: string): { animal: string; background: typeof BACKGROUND_COLORS[0] } => {
  const cacheKey = `anonymous_${reviewId}`;
  
  if (avatarCache.has(cacheKey)) {
    return avatarCache.get(cacheKey)!;
  }
  
  const animalIndex = getConsistentRandomIndex(reviewId, CUTE_AVATARS.length);
  const backgroundIndex = getConsistentRandomIndex(reviewId + '_bg', BACKGROUND_COLORS.length);
  
  const result = {
    animal: CUTE_AVATARS[animalIndex],
    background: BACKGROUND_COLORS[backgroundIndex]
  };
  
  avatarCache.set(cacheKey, result);
  return result;
};

// 獲取自定義頭像
export const getCustomAvatar = (customData: CustomAvatar): { animal: string; background: typeof BACKGROUND_COLORS[0] } => {
  const cacheKey = `custom_${customData.animal}_${customData.backgroundIndex}`;
  
  if (avatarCache.has(cacheKey)) {
    return avatarCache.get(cacheKey)!;
  }
  
  const result = {
    animal: customData.animal,
    background: BACKGROUND_COLORS[customData.backgroundIndex] || BACKGROUND_COLORS[0]
  };
  
  avatarCache.set(cacheKey, result);
  return result;
};

// 獲取姓名首字母
export const getInitials = (firstName: string = '', lastName: string = '', email: string = ''): string => {
  // 如果有名和姓，使用名和姓的首字母
  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  
  // 如果只有一個名字，使用前兩個字符
  if (firstName) {
    return firstName.length >= 2 
      ? `${firstName.charAt(0)}${firstName.charAt(1)}`.toUpperCase()
      : firstName.charAt(0).toUpperCase();
  }
  
  // 如果只有 lastName，使用前兩個字符
  if (lastName) {
    return lastName.length >= 2 
      ? `${lastName.charAt(0)}${lastName.charAt(1)}`.toUpperCase()
      : lastName.charAt(0).toUpperCase();
  }
  
  // 最後使用 email 的首字母
  if (email) {
    const emailName = email.split('@')[0];
    return emailName.length >= 2 
      ? `${emailName.charAt(0)}${emailName.charAt(1)}`.toUpperCase()
      : emailName.charAt(0).toUpperCase();
  }
  
  return '??';
};

// 講師頭像配置
export interface LecturerAvatarConfig {
  size: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

// 獲取講師頭像內容
export const getLecturerAvatarContent = (
  firstName: string = '', 
  lastName: string = '', 
  email: string = ''
): { initials: string; bgClass: string; textClass: string } => {
  const initials = getInitials(firstName, lastName, email);
  
  return {
    initials,
    bgClass: 'bg-red-600 dark:bg-red-700', // 統一使用紅色主題
    textClass: 'text-white font-semibold'
  };
};

// 獲取講師頭像尺寸類名
export const getLecturerAvatarSizeClass = (size: 'sm' | 'md' | 'lg' | 'xl'): string => {
  switch (size) {
    case 'sm':
      return 'h-8 w-8 text-sm';
    case 'md':
      return 'h-10 w-10 text-base';
    case 'lg':
      return 'h-16 w-16 text-lg';
    case 'xl':
      return 'h-20 w-20 text-xl';
    default:
      return 'h-10 w-10 text-base';
  }
};

// 根據配置獲取頭像內容
export const getAvatarContent = (config: AvatarConfig, userData: {
  userId?: string;
  name?: string;
  email?: string;
  reviewId?: string;
  customAvatar?: CustomAvatar;
}): { type: 'emoji' | 'text'; content: string; background?: typeof BACKGROUND_COLORS[0] } => {
  const { showPersonalAvatar, showAnonymousAvatar, context } = config;
  const { userId, name, email, reviewId, customAvatar } = userData;

  // 評論和回覆情境：使用匿名頭像或不顯示
  if (context === 'review' || context === 'comment') {
    if (showAnonymousAvatar && reviewId) {
      const avatarData = getAnonymousAvatar(reviewId);
      return {
        type: 'emoji',
        content: avatarData.animal,
        background: avatarData.background
      };
    }
    // 不顯示頭像的情況下返回空字符串
    return {
      type: 'text',
      content: ''
    };
  }

  // 個人資料和菜單情境：使用個人頭像
  if (context === 'profile' || context === 'menu') {
    if (showPersonalAvatar && userId) {
      // 優先使用自定義頭像
      if (customAvatar) {
        const avatarData = getCustomAvatar(customAvatar);
        return {
          type: 'emoji',
          content: avatarData.animal,
          background: avatarData.background
        };
      }
      
      // 使用默認生成的頭像
      const avatarData = getPersonalAvatar(userId);
      return {
        type: 'emoji',
        content: avatarData.animal,
        background: avatarData.background
      };
    }
    // 降級到文字首字母
    return {
      type: 'text',
      content: getInitials(name || '', '', email || '')
    };
  }

  // 默認情況
  return {
    type: 'text',
    content: getInitials(name || '', '', email || '')
  };
};

// 獲取頭像尺寸類名
export const getAvatarSizeClass = (size: 'sm' | 'md' | 'lg'): string => {
  switch (size) {
    case 'sm':
      return 'h-8 w-8 text-sm';
    case 'md':
      return 'h-10 w-10 text-base';
    case 'lg':
      return 'h-16 w-16 text-lg';
    default:
      return 'h-10 w-10 text-base';
  }
};

// 獲取所有可用的動物
export const getAllAnimals = (): string[] => {
  return [...CUTE_AVATARS];
};

// 獲取所有可用的背景
export const getAllBackgrounds = (): typeof BACKGROUND_COLORS => {
  return [...BACKGROUND_COLORS];
};

// 計算總組合數
export const getTotalCombinations = (): number => {
  return CUTE_AVATARS.length * BACKGROUND_COLORS.length;
};

// 獲取本地化的背景名稱
export const getLocalizedBackgroundName = (backgroundKey: string, t: (key: string) => string): string => {
  return t(backgroundKey);
};

// 預載入頭像數據
export const preloadAvatar = (userId: string, customAvatar?: CustomAvatar) => {
  if (!userId) return;
  
  const cacheKey = customAvatar ? `custom_${userId}` : `personal_${userId}`;
  
  if (!avatarCache.has(cacheKey)) {
    if (customAvatar) {
      avatarCache.set(cacheKey, getCustomAvatar(customAvatar));
    } else {
      avatarCache.set(cacheKey, getPersonalAvatar(userId));
    }
  }
}; 