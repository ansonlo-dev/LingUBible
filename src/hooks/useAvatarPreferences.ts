import { useState, useEffect } from 'react';

export interface AvatarPreferences {
  showPersonalAvatar: boolean;
  showAnonymousAvatarInReviews: boolean;
}

const DEFAULT_PREFERENCES: AvatarPreferences = {
  showPersonalAvatar: true,
  showAnonymousAvatarInReviews: false
};

export function useAvatarPreferences() {
  const [preferences, setPreferences] = useState<AvatarPreferences>(DEFAULT_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);

  // 從 localStorage 載入偏好設置
  useEffect(() => {
    try {
      const saved = localStorage.getItem('avatarPreferences');
      if (saved) {
        const parsed = JSON.parse(saved);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      }
    } catch (error) {
      console.error('載入頭像偏好設置失敗:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // 更新偏好設置
  const updatePreferences = (newPreferences: Partial<AvatarPreferences>) => {
    const updated = { ...preferences, ...newPreferences };
    setPreferences(updated);
    
    try {
      localStorage.setItem('avatarPreferences', JSON.stringify(updated));
    } catch (error) {
      console.error('保存頭像偏好設置失敗:', error);
    }
  };

  // 重置為默認設置
  const resetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES);
    try {
      localStorage.removeItem('avatarPreferences');
    } catch (error) {
      console.error('重置頭像偏好設置失敗:', error);
    }
  };

  return {
    preferences,
    updatePreferences,
    resetPreferences,
    isLoaded
  };
} 