import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { avatarService } from '@/services/avatarService';
import { CustomAvatar } from '@/utils/avatarUtils';

// 創建全局事件系統
const AVATAR_UPDATE_EVENT = 'avatar-updated';

// 全局事件發射器
const emitAvatarUpdate = () => {
  window.dispatchEvent(new CustomEvent(AVATAR_UPDATE_EVENT));
};

export function useCustomAvatar() {
  const { user } = useAuth();
  const [customAvatar, setCustomAvatar] = useState<CustomAvatar | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 載入用戶的自定義頭像
  useEffect(() => {
    if (user?.$id) {
      loadCustomAvatar();
    } else {
      setCustomAvatar(null);
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
    } catch (err) {
      setError('載入自定義頭像失敗');
      console.error('載入自定義頭像失敗:', err);
    } finally {
      setIsLoading(false);
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
    error,
    saveCustomAvatar,
    deleteCustomAvatar,
    refreshAvatar,
    hasCustomAvatar: !!customAvatar
  };
} 