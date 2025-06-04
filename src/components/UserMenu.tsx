import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export function UserMenu() {
  const { user, logout } = useAuth();
  const [isDark, setIsDark] = useState(false);

  // 監聽主題變化
  useEffect(() => {
    // 初始檢測
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkTheme();

    // 創建 MutationObserver 來監聽 class 變化
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          checkTheme();
        }
      });
    });

    // 開始觀察 html 元素的 class 屬性變化
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full w-10 h-10 bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          title={user.email}
        >
          <span className="text-lg font-bold text-foreground">
            {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end"
        className="bg-background border shadow-lg backdrop-blur-none w-40"
        style={{ 
          backgroundColor: isDark ? '#000000' : '#ffffff',
          backdropFilter: 'none',
          borderColor: isDark ? 'rgb(63, 63, 70)' : 'rgb(229, 231, 235)'
        }}
      >
        <DropdownMenuLabel className="px-4 py-2 text-sm">
          {user.email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => {
            await logout();
          }}
          className="px-4 py-2 text-sm"
        >
          登出
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
