import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { avatarService } from '@/services/api/avatar';
import { getAvatarContent, AvatarConfig, CustomAvatar } from '@/utils/ui/avatarUtils';
import { cn } from '@/lib/utils';

interface ReviewAvatarProps {
  /** 是否為匿名評論 */
  isAnonymous: boolean;
  /** 用戶ID（非匿名時需要） */
  userId?: string;
  /** 用戶名稱（非匿名時需要） */
  username?: string;
  /** 用戶郵箱（非匿名時需要） */
  userEmail?: string;
  /** 評論ID（匿名時用於生成一致的頭像） */
  reviewId?: string;
  /** 頭像大小 */
  size?: 'sm' | 'md' | 'lg';
  /** 額外的 CSS 類名 */
  className?: string;
}

export const ReviewAvatar: React.FC<ReviewAvatarProps> = ({
  isAnonymous,
  userId,
  username,
  userEmail,
  reviewId,
  size = 'md',
  className
}) => {
  const [customAvatar, setCustomAvatar] = useState<CustomAvatar | null>(null);
  const [loading, setLoading] = useState(false);

  // 獲取自定義頭像（僅非匿名用戶）
  useEffect(() => {
    if (!isAnonymous && userId) {
      setLoading(true);
      avatarService.getUserAvatar(userId)
        .then(avatar => {
          setCustomAvatar(avatar);
        })
        .catch(error => {
          console.error('獲取用戶頭像失敗:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isAnonymous, userId]);

  // 獲取頭像尺寸類名
  const getSizeClass = (size: 'sm' | 'md' | 'lg'): string => {
    switch (size) {
      case 'sm':
        return 'h-8 w-8';
      case 'md':
        return 'h-10 w-10';
      case 'lg':
        return 'h-12 w-12';
      default:
        return 'h-10 w-10';
    }
  };

  // 獲取文字大小類名
  const getTextSizeClass = (size: 'sm' | 'md' | 'lg'): string => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'md':
        return 'text-base';
      case 'lg':
        return 'text-lg';
      default:
        return 'text-base';
    }
  };

  if (isAnonymous) {
    // 匿名用戶：顯示紅灰色的默認人物圖標
    return (
      <Avatar className={cn(getSizeClass(size), className)}>
        <AvatarFallback className="bg-gradient-to-br from-red-100 to-gray-100 dark:from-red-900/30 dark:to-gray-900/30 border border-red-200 dark:border-red-800">
          <User className={cn(
            "text-red-600 dark:text-red-400",
            size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'
          )} />
        </AvatarFallback>
      </Avatar>
    );
  }

  // 非匿名用戶：顯示真實頭像
  if (loading) {
    return (
      <Avatar className={cn(getSizeClass(size), className)}>
        <AvatarFallback className="bg-muted">
          <div className="animate-pulse bg-muted-foreground/20 rounded-full w-full h-full" />
        </AvatarFallback>
      </Avatar>
    );
  }

  // 配置頭像
  const config: AvatarConfig = {
    showPersonalAvatar: true,
    showAnonymousAvatar: false,
    size: size,
    context: 'review'
  };

  const userData = {
    userId: userId,
    name: username,
    email: userEmail,
    customAvatar: customAvatar || undefined
  };

  const avatarContent = getAvatarContent(config, userData);

  if (avatarContent.type === 'emoji' && avatarContent.background) {
    // 顯示可愛動物頭像
    const isDark = document.documentElement.classList.contains('dark');
    const backgroundClass = isDark ? avatarContent.background.dark : avatarContent.background.light;
    
    return (
      <Avatar className={cn(getSizeClass(size), className)}>
        <AvatarFallback className={cn(
          'bg-gradient-to-br border',
          backgroundClass,
          'border-gray-200 dark:border-gray-700'
        )}>
          <span className={cn(
            'select-none',
            size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl'
          )}>
            {avatarContent.content}
          </span>
        </AvatarFallback>
      </Avatar>
    );
  } else {
    // 顯示首字母頭像
    return (
      <Avatar className={cn(getSizeClass(size), className)}>
        <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
          <span className={getTextSizeClass(size)}>
            {avatarContent.content}
          </span>
        </AvatarFallback>
      </Avatar>
    );
  }
}; 