import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { avatarService } from "@/services/api/avatar";
import { CustomAvatar, preloadAvatar } from "@/utils/ui/avatarUtils";

// 創建全局事件系統
const AVATAR_UPDATE_EVENT = 'avatar-updated';

// 全局事件發射器
const emitAvatarUpdate = () => {
  window.dispatchEvent(new CustomEvent(AVATAR_UPDATE_EVENT));
};

// 本地快取鍵
const getAvatarCacheKey = (userId: string) => `custom_avatar_${userId}`;

// 從本地快取載入頭像
const loadAvatarFromCache = (userId: string): CustomAvatar | null => {
  try {
    const cached = localStorage.getItem(getAvatarCacheKey(userId));
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.error('載入頭像快取失敗:', error);
  }
  return null;
};

// 保存頭像到本地快取
const saveAvatarToCache = (userId: string, avatar: CustomAvatar | null) => {
  try {
    const cacheKey = getAvatarCacheKey(userId);
    if (avatar) {
      localStorage.setItem(cacheKey, JSON.stringify(avatar));
    } else {
      localStorage.removeItem(cacheKey);
    }
  } catch (error) {
    console.error('保存頭像快取失敗:', error);
  }
};

export function useCustomAvatar() {
  const { user } = useAuth();
  const [customAvatar, setCustomAvatar] = useState<CustomAvatar | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 載入用戶的自定義頭像
  useEffect(() => {
    if (user?.$id) {
      // 先從快取載入，避免閃爍
      const cachedAvatar = loadAvatarFromCache(user.$id);
      if (cachedAvatar) {
        setCustomAvatar(cachedAvatar);
        // 預載入頭像數據到內存快取
        preloadAvatar(user.$id, cachedAvatar);
      } else {
        // 如果沒有自定義頭像，預載入默認頭像
        preloadAvatar(user.$id);
      }
      
      // 然後從服務器載入最新數據
      loadCustomAvatar();
    } else {
      setCustomAvatar(null);
      setIsInitialLoading(false);
    }
  }, [user?.$id]);

  // 監聽全局頭像更新事件
  useEffect(() => {
    const handleAvatarUpdate = () => {
      if (user?.$id) {
        loadCustomAvatar();
      }
    };

    window.addEventListener(AVATAR_UPDATE_EVENT, handleAvatarUpdate);
    return () => {
      window.removeEventListener(AVATAR_UPDATE_EVENT, handleAvatarUpdate);
    };
  }, [user?.$id]);

  const loadCustomAvatar = async () => {
    if (!user?.$id) return;

    setIsLoading(true);
    setError(null);

    try {
      const avatar = await avatarService.getUserAvatar(user.$id);
      setCustomAvatar(avatar);
      
      // 更新本地快取
      saveAvatarToCache(user.$id, avatar);
      
      // 預載入頭像數據到內存快取
      if (avatar) {
        preloadAvatar(user.$id, avatar);
      } else {
        preloadAvatar(user.$id);
      }
    } catch (err) {
      setError('載入自定義頭像失敗');
      console.error('載入自定義頭像失敗:', err);
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false);
    }
  };

  // 保存自定義頭像
  const saveCustomAvatar = async (animal: string, backgroundIndex: number): Promise<boolean> => {
    if (!user?.$id) {
      setError('用戶未登入');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const success = await avatarService.saveUserAvatar(user.$id, {
        animal,
        backgroundIndex
      });

      if (success) {
        // 更新本地狀態
        const newAvatar = {
          animal,
          backgroundIndex,
          createdAt: new Date().toISOString()
        };
        setCustomAvatar(newAvatar);
        
        // 更新本地快取
        saveAvatarToCache(user.$id, newAvatar);
        
        // 發射全局更新事件
        emitAvatarUpdate();
        
        return true;
      } else {
        setError('保存頭像失敗');
        return false;
      }
    } catch (err) {
      setError('保存頭像失敗');
      console.error('保存頭像失敗:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 刪除自定義頭像
  const deleteCustomAvatar = async (): Promise<boolean> => {
    if (!user?.$id) {
      setError('用戶未登入');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const success = await avatarService.deleteUserAvatar(user.$id);

      if (success) {
        setCustomAvatar(null);
        
        // 清除本地快取
        saveAvatarToCache(user.$id, null);
        
        // 發射全局更新事件
        emitAvatarUpdate();
        
        return true;
      } else {
        setError('刪除頭像失敗');
        return false;
      }
    } catch (err) {
      setError('刪除頭像失敗');
      console.error('刪除頭像失敗:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 重新載入頭像
  const refreshAvatar = async () => {
    await loadCustomAvatar();
  };

  return {
    customAvatar,
    isLoading,
    isInitialLoading,
    error,
    saveCustomAvatar,
    deleteCustomAvatar,
    refreshAvatar,
    hasCustomAvatar: !!customAvatar
  };
} 