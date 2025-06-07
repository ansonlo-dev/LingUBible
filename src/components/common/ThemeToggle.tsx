import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { theme } from '@/lib/utils';

// 主題切換函數
function setTheme(isDark: boolean) {
  const root = document.documentElement;
  const themeName = isDark ? 'dark' : 'light';
  
  if (isDark) {
    root.classList.add('dark');
    root.style.backgroundColor = 'rgb(0, 0, 0)';
    root.style.color = 'rgb(255, 255, 255)';
    document.body.style.backgroundColor = 'rgb(0, 0, 0)';
    document.body.style.color = 'rgb(255, 255, 255)';
  } else {
    root.classList.remove('dark');
    root.style.backgroundColor = 'rgb(255, 255, 255)';
    root.style.color = 'rgb(0, 0, 0)';
    document.body.style.backgroundColor = 'rgb(255, 255, 255)';
    document.body.style.color = 'rgb(0, 0, 0)';
  }
  
  // 保存主題設定
  theme.set(themeName);
}

interface ThemeToggleProps {
  variant?: 'button' | 'toggle';
}

export function ThemeToggle({ variant = 'button' }: ThemeToggleProps) {
  // 直接從 DOM 讀取當前主題狀態
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    // 確保初始狀態與存儲的主題同步
    const effectiveTheme = theme.getEffectiveTheme();
    const shouldUseDark = effectiveTheme === 'dark';
    
    if (shouldUseDark !== isDark) {
      setTheme(shouldUseDark);
    }
    
    // 監聽 dark class 變化
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const newIsDark = document.documentElement.classList.contains('dark');
          setIsDark(newIsDark);
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setTheme(newTheme);
    // setIsDark 會由 MutationObserver 自動更新
  };

  if (variant === 'toggle') {
    return (
      <div className="flex items-center gap-2">
        <Sun className="h-4 w-4 text-muted-foreground" />
        <button
          onClick={toggleTheme}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            isDark ? 'bg-primary' : 'bg-secondary'
          }`}
          role="switch"
          aria-checked={isDark}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isDark ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <Moon className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-foreground focus-visible:ring-0 focus-visible:ring-offset-0">
      {isDark ? (
        <Moon className="h-[1.2rem] w-[1.2rem]" />
      ) : (
        <Sun className="h-[1.2rem] w-[1.2rem] text-black" />
      )}
      <span className="sr-only">切換主題</span>
    </Button>
  );
}
