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

// 背景顏色方案 (60種) - 30淺色 + 25深色 + 5特殊漸變
const BACKGROUND_COLORS = [
  // 淺色系 (30種) - 適合淺色主題
  // 溫暖色調
  { name: 'background.sunset', light: 'from-orange-100 to-pink-100', dark: 'from-orange-900/30 to-pink-900/30' },
  { name: 'background.peach', light: 'from-orange-200 to-orange-100', dark: 'from-orange-900/30 to-red-900/30' },
  { name: 'background.coral', light: 'from-red-100 to-pink-100', dark: 'from-red-900/30 to-pink-900/30' },
  { name: 'background.rose', light: 'from-pink-100 to-rose-100', dark: 'from-pink-900/30 to-rose-900/30' },
  { name: 'background.apricot', light: 'from-orange-50 to-amber-100', dark: 'from-orange-900/30 to-amber-900/30' },
  { name: 'background.cream', light: 'from-yellow-50 to-orange-50', dark: 'from-yellow-900/30 to-orange-900/30' },
  { name: 'background.vanilla', light: 'from-amber-50 to-yellow-100', dark: 'from-amber-900/30 to-yellow-900/30' },
  { name: 'background.blush', light: 'from-rose-50 to-pink-100', dark: 'from-rose-900/30 to-pink-900/30' },
  { name: 'background.cherry', light: 'from-red-100 to-rose-100', dark: 'from-red-900/30 to-rose-900/30' },
  { name: 'background.salmon', light: 'from-pink-100 to-orange-100', dark: 'from-pink-900/30 to-orange-900/30' },
  
  // 冷色調
  { name: 'background.ocean', light: 'from-blue-100 to-cyan-100', dark: 'from-blue-900/30 to-cyan-900/30' },
  { name: 'background.sky', light: 'from-sky-100 to-blue-100', dark: 'from-sky-900/30 to-blue-900/30' },
  { name: 'background.mint', light: 'from-green-100 to-emerald-100', dark: 'from-green-900/30 to-emerald-900/30' },
  { name: 'background.forest', light: 'from-emerald-100 to-teal-100', dark: 'from-emerald-900/30 to-teal-900/30' },
  { name: 'background.powder', light: 'from-blue-50 to-sky-100', dark: 'from-blue-900/30 to-sky-900/30' },
  { name: 'background.seafoam', light: 'from-teal-50 to-green-100', dark: 'from-teal-900/30 to-green-900/30' },
  { name: 'background.aqua', light: 'from-cyan-50 to-blue-100', dark: 'from-cyan-900/30 to-blue-900/30' },
  { name: 'background.jade', light: 'from-green-50 to-emerald-100', dark: 'from-green-900/30 to-emerald-900/30' },
  { name: 'background.turquoise', light: 'from-teal-100 to-cyan-100', dark: 'from-teal-900/30 to-cyan-900/30' },
  { name: 'background.sage', light: 'from-emerald-50 to-teal-100', dark: 'from-emerald-900/30 to-teal-900/30' },
  
  // 紫色系
  { name: 'background.lavender', light: 'from-purple-100 to-pink-100', dark: 'from-purple-900/30 to-pink-900/30' },
  { name: 'background.grape', light: 'from-violet-100 to-purple-100', dark: 'from-violet-900/30 to-purple-900/30' },
  { name: 'background.lilac', light: 'from-purple-50 to-violet-100', dark: 'from-purple-900/30 to-violet-900/30' },
  { name: 'background.orchid', light: 'from-pink-100 to-purple-100', dark: 'from-pink-900/30 to-purple-900/30' },
  { name: 'background.mauve', light: 'from-violet-50 to-purple-100', dark: 'from-violet-900/30 to-purple-900/30' },
  
  // 中性淺色
  { name: 'background.pearl', light: 'from-gray-50 to-slate-100', dark: 'from-gray-900/30 to-slate-900/30' },
  { name: 'background.ivory', light: 'from-stone-50 to-neutral-100', dark: 'from-stone-900/30 to-neutral-900/30' },
  { name: 'background.sand', light: 'from-amber-50 to-stone-100', dark: 'from-amber-900/30 to-stone-900/30' },
  { name: 'background.linen', light: 'from-neutral-50 to-stone-100', dark: 'from-neutral-900/30 to-stone-900/30' },
  { name: 'background.opal', light: 'from-slate-50 to-gray-100', dark: 'from-slate-900/30 to-gray-900/30' },
  
  // 深色系 (30種) - 適合深色主題
  // 深暖色調
  { name: 'background.burgundy', light: 'from-red-800 to-rose-800', dark: 'from-red-900/30 to-rose-900/30' },
  { name: 'background.maroon', light: 'from-red-700 to-red-800', dark: 'from-red-900/30 to-red-900/30' },
  { name: 'background.crimson', light: 'from-rose-700 to-pink-800', dark: 'from-rose-900/30 to-pink-900/30' },
  { name: 'background.rust', light: 'from-orange-700 to-red-700', dark: 'from-orange-900/30 to-red-900/30' },
  { name: 'background.copper', light: 'from-amber-700 to-orange-800', dark: 'from-amber-900/30 to-orange-900/30' },
  { name: 'background.bronze', light: 'from-yellow-700 to-amber-800', dark: 'from-yellow-900/30 to-amber-900/30' },
  { name: 'background.mahogany', light: 'from-red-800 to-amber-800', dark: 'from-red-900/30 to-amber-900/30' },
  
  // 深冷色調
  { name: 'background.navy', light: 'from-blue-800 to-indigo-800', dark: 'from-blue-900/30 to-indigo-900/30' },
  { name: 'background.midnight', light: 'from-slate-800 to-blue-900', dark: 'from-slate-900/30 to-blue-900/30' },
  { name: 'background.steel', light: 'from-slate-700 to-gray-800', dark: 'from-slate-900/30 to-gray-900/30' },
  { name: 'background.emerald', light: 'from-green-700 to-emerald-800', dark: 'from-green-900/30 to-emerald-900/30' },
  { name: 'background.pine', light: 'from-green-800 to-teal-800', dark: 'from-green-900/30 to-teal-900/30' },
  { name: 'background.teal', light: 'from-teal-700 to-cyan-800', dark: 'from-teal-900/30 to-cyan-900/30' },
  { name: 'background.cobalt', light: 'from-blue-700 to-sky-800', dark: 'from-blue-900/30 to-sky-900/30' },
  { name: 'background.sapphire', light: 'from-sky-700 to-blue-800', dark: 'from-sky-900/30 to-blue-900/30' },
  { name: 'background.arctic', light: 'from-cyan-700 to-blue-800', dark: 'from-cyan-900/30 to-blue-900/30' },
  { name: 'background.deep_sea', light: 'from-teal-800 to-blue-900', dark: 'from-teal-900/30 to-blue-900/30' },
  
  // 深紫色系
  { name: 'background.plum', light: 'from-indigo-800 to-purple-800', dark: 'from-indigo-900/30 to-purple-900/30' },
  { name: 'background.eggplant', light: 'from-purple-800 to-violet-800', dark: 'from-purple-900/30 to-violet-900/30' },
  { name: 'background.amethyst', light: 'from-violet-700 to-purple-800', dark: 'from-violet-900/30 to-purple-900/30' },
  { name: 'background.indigo', light: 'from-indigo-700 to-violet-800', dark: 'from-indigo-900/30 to-violet-900/30' },
  { name: 'background.royal', light: 'from-blue-800 to-purple-800', dark: 'from-blue-900/30 to-purple-900/30' },
  
  // 深中性色和原有色彩
  { name: 'background.charcoal', light: 'from-gray-800 to-slate-800', dark: 'from-gray-900/30 to-slate-900/30' },
  { name: 'background.graphite', light: 'from-stone-800 to-gray-800', dark: 'from-stone-900/30 to-gray-900/30' },
  { name: 'background.obsidian', light: 'from-slate-800 to-stone-900', dark: 'from-slate-900/30 to-stone-900/30' },
  { name: 'background.cloud', light: 'from-gray-700 to-slate-800', dark: 'from-gray-900/30 to-slate-900/30' },
  { name: 'background.stone', light: 'from-stone-700 to-gray-800', dark: 'from-stone-900/30 to-gray-900/30' },
  { name: 'background.warm', light: 'from-amber-700 to-yellow-700', dark: 'from-amber-900/30 to-yellow-900/30' },
  { name: 'background.ice', light: 'from-blue-800 via-cyan-800 to-slate-700', dark: 'from-blue-900/30 via-cyan-900/30 to-slate-900/30' },
  
  // 特殊漸變 (5种)
  { name: 'background.rainbow', light: 'from-red-700 via-yellow-600 to-blue-800', dark: 'from-red-900/30 via-yellow-900/30 to-blue-900/30' },
  { name: 'background.aurora', light: 'from-green-700 via-blue-800 to-purple-800', dark: 'from-green-900/30 via-blue-900/30 to-purple-900/30' },
  { name: 'background.cosmic', light: 'from-indigo-800 via-purple-800 to-pink-700', dark: 'from-indigo-900/30 via-purple-900/30 to-pink-900/30' },
  { name: 'background.tropical', light: 'from-cyan-700 via-teal-800 to-green-800', dark: 'from-cyan-900/30 via-teal-900/30 to-green-900/30' },
  { name: 'background.fire', light: 'from-red-700 via-orange-700 to-yellow-600', dark: 'from-red-900/30 via-orange-900/30 to-yellow-900/30' }
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

  // 評論和回覆情境：根據是否匿名決定顯示類型
  if (context === 'review' || context === 'comment') {
    // 如果要顯示匿名頭像且有評論ID，顯示匿名頭像
    if (showAnonymousAvatar && reviewId) {
      const avatarData = getAnonymousAvatar(reviewId);
      return {
        type: 'emoji',
        content: avatarData.animal,
        background: avatarData.background
      };
    }
    
    // 如果要顯示個人頭像且有用戶ID（非匿名評論），顯示個人頭像
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

// 獲取隨機頭像組合
export const getRandomAvatarCombination = (): { animal: string; background: typeof BACKGROUND_COLORS[0]; animalIndex: number; backgroundIndex: number } => {
  const animalIndex = Math.floor(Math.random() * CUTE_AVATARS.length);
  const backgroundIndex = Math.floor(Math.random() * BACKGROUND_COLORS.length);
  
  return {
    animal: CUTE_AVATARS[animalIndex],
    background: BACKGROUND_COLORS[backgroundIndex],
    animalIndex,
    backgroundIndex
  };
};

// 獲取所有可能的頭像組合（分頁）
export const getAllAvatarCombinations = (page: number = 0, pageSize: number = 100): Array<{ animal: string; background: typeof BACKGROUND_COLORS[0]; animalIndex: number; backgroundIndex: number }> => {
  const combinations: Array<{ animal: string; background: typeof BACKGROUND_COLORS[0]; animalIndex: number; backgroundIndex: number }> = [];
  
  for (let animalIndex = 0; animalIndex < CUTE_AVATARS.length; animalIndex++) {
    for (let backgroundIndex = 0; backgroundIndex < BACKGROUND_COLORS.length; backgroundIndex++) {
      combinations.push({
        animal: CUTE_AVATARS[animalIndex],
        background: BACKGROUND_COLORS[backgroundIndex],
        animalIndex,
        backgroundIndex
      });
    }
  }
  
  const startIndex = page * pageSize;
  const endIndex = startIndex + pageSize;
  return combinations.slice(startIndex, endIndex);
};

// 隨機打亂所有組合
export const getShuffledAvatarCombinations = (): Array<{ animal: string; background: typeof BACKGROUND_COLORS[0]; animalIndex: number; backgroundIndex: number }> => {
  const combinations = getAllAvatarCombinations(0, getTotalCombinations());
  
  // Fisher-Yates 洗牌算法
  for (let i = combinations.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [combinations[i], combinations[j]] = [combinations[j], combinations[i]];
  }
  
  return combinations;
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