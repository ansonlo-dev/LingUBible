import React from 'react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface WingedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  asChild?: boolean;
}

export const WingedButton = React.forwardRef<HTMLButtonElement, WingedButtonProps>(
  ({ children, className, size = 'lg', variant = 'default', asChild, ...props }, ref) => {
    return (
      <div className="winged-button-container relative inline-block">
        {/* 左翅膀 */}
        <div className="wing wing-left">
          <svg viewBox="0 0 80 50" className="wing-svg">
            <path
              d="M75,25 Q60,5 40,8 Q25,12 15,18 Q8,22 5,25 Q8,28 15,32 Q25,38 40,42 Q60,45 75,25 Z"
              fill="currentColor"
              className="wing-path"
            />
            {/* 翅膀羽毛細節 */}
            <path
              d="M70,25 Q55,10 40,12 Q30,15 25,20 Q22,22 20,25 Q22,28 25,30 Q30,35 40,38 Q55,40 70,25 Z"
              fill="currentColor"
              className="wing-feather"
              opacity="0.7"
            />
            <path
              d="M65,25 Q52,15 40,16 Q35,18 32,22 Q30,24 29,25 Q30,26 32,28 Q35,32 40,34 Q52,35 65,25 Z"
              fill="currentColor"
              className="wing-feather"
              opacity="0.5"
            />
          </svg>
        </div>
        
        {/* 右翅膀 */}
        <div className="wing wing-right">
          <svg viewBox="0 0 80 50" className="wing-svg">
            <path
              d="M5,25 Q20,5 40,8 Q55,12 65,18 Q72,22 75,25 Q72,28 65,32 Q55,38 40,42 Q20,45 5,25 Z"
              fill="currentColor"
              className="wing-path"
            />
            {/* 翅膀羽毛細節 */}
            <path
              d="M10,25 Q25,10 40,12 Q50,15 55,20 Q58,22 60,25 Q58,28 55,30 Q50,35 40,38 Q25,40 10,25 Z"
              fill="currentColor"
              className="wing-feather"
              opacity="0.7"
            />
            <path
              d="M15,25 Q28,15 40,16 Q45,18 48,22 Q50,24 51,25 Q50,26 48,28 Q45,32 40,34 Q28,35 15,25 Z"
              fill="currentColor"
              className="wing-feather"
              opacity="0.5"
            />
          </svg>
        </div>
        
        {/* 按鈕本體 */}
        <Button
          ref={ref}
          size={size}
          variant={variant}
          className={cn(
            "winged-button relative z-10 transition-all duration-300",
            // 移除可能衝突的霓虹燈效果
            "!animate-none",
            className
          )}
          asChild={asChild}
          {...props}
        >
          {children}
        </Button>
      </div>
    );
  }
);

WingedButton.displayName = "WingedButton"; 