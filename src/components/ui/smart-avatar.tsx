import * as React from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { 
  getAvatarContent, 
  getAvatarSizeClass, 
  AvatarConfig,
  CustomAvatar
} from "@/utils/ui/avatarUtils"

interface SmartAvatarProps {
  // 用戶數據
  userId?: string;
  name?: string;
  email?: string;
  reviewId?: string;
  customAvatar?: CustomAvatar;
  
  // 頭像配置
  config: AvatarConfig;
  
  // 載入狀態
  isLoading?: boolean;
  
  // 樣式相關
  className?: string;
  fallbackClassName?: string;
  
  // 其他 Avatar 屬性
  [key: string]: any;
}

export const SmartAvatar = React.forwardRef<
  React.ElementRef<typeof Avatar>,
  SmartAvatarProps
>(({ 
  userId, 
  name, 
  email, 
  reviewId, 
  customAvatar,
  config, 
  isLoading = false,
  className, 
  fallbackClassName,
  ...props 
}, ref) => {

  const avatarContent = getAvatarContent(config, {
    userId,
    name,
    email,
    reviewId,
    customAvatar
  });

  const sizeClass = getAvatarSizeClass(config.size);

  // 如果內容為空（匿名情境下不顯示頭像），返回 null
  if (!avatarContent.content) {
    return null;
  }

  // 獲取背景樣式
  const getBackgroundClass = () => {
    if (isLoading) {
      return "bg-muted animate-pulse";
    }
    
    if (avatarContent.type === 'emoji' && avatarContent.background) {
      // 頭像背景始終使用亮色模式，不隨深色模式改變
      const bgClass = avatarContent.background.light;
      return `bg-gradient-to-br ${bgClass}`;
    }
    return "bg-muted";
  };

  return (
    <Avatar
      ref={ref}
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full",
        sizeClass,
        className
      )}
      {...props}
    >
      <AvatarFallback 
        className={cn(
          "flex h-full w-full items-center justify-center rounded-full transition-all duration-200",
          getBackgroundClass(),
          fallbackClassName
        )}
      >
        {isLoading ? (
          // 載入狀態顯示骨架屏
          <div className="w-full h-full bg-muted-foreground/20 rounded-full animate-pulse" />
        ) : avatarContent.type === 'emoji' ? (
          <span 
            className={cn(
              "select-none transition-opacity duration-200",
              config.size === 'sm' ? "text-lg" : 
              config.size === 'md' ? "text-2xl" : "text-3xl"
            )} 
            role="img" 
            aria-label="avatar"
          >
            {avatarContent.content}
          </span>
        ) : (
          <span className="font-semibold text-muted-foreground transition-opacity duration-200">
            {avatarContent.content}
          </span>
        )}
      </AvatarFallback>
    </Avatar>
  );
});

SmartAvatar.displayName = "SmartAvatar"; 