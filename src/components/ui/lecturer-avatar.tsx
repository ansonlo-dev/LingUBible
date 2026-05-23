import * as React from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { 
  getLecturerAvatarContent, 
  getLecturerAvatarSizeClass,
  LecturerAvatarConfig
} from "@/utils/ui/avatarUtils"

interface LecturerAvatarProps extends LecturerAvatarConfig {
  // 講師基本信息
  firstName?: string;
  lastName?: string;
  email?: string;
  
  // 樣式相關
  className?: string;
  fallbackClassName?: string;
  
  // 其他 Avatar 屬性
  [key: string]: any;
}

export const LecturerAvatar = React.forwardRef<
  React.ElementRef<typeof Avatar>,
  LecturerAvatarProps
>(({ 
  firstName = '', 
  lastName = '', 
  email = '',
  size = 'md',
  className, 
  fallbackClassName,
  ...props 
}, ref) => {
  const sizeClass = getLecturerAvatarSizeClass(size);
  const { initials, bgClass, textClass } = getLecturerAvatarContent(firstName, lastName, email);

  return (
    <Avatar
      ref={ref}
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full border-2 border-red-200 dark:border-red-800",
        sizeClass,
        className
      )}
      {...props}
    >
      <AvatarFallback 
        className={cn(
          "flex h-full w-full items-center justify-center rounded-full transition-all duration-200",
          bgClass,
          textClass,
          fallbackClassName
        )}
      >
        <span 
          className={cn(
            "select-none transition-opacity duration-200",
            size === 'sm' ? "text-xs" : 
            size === 'md' ? "text-sm" : 
            size === 'lg' ? "text-base" : "text-lg"
          )} 
          role="img" 
          aria-label={`${firstName} ${lastName} avatar`}
        >
          {initials}
        </span>
      </AvatarFallback>
    </Avatar>
  );
});

LecturerAvatar.displayName = "LecturerAvatar"; 