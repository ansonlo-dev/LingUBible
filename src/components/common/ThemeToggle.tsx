import { useState, useEffect } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { theme } from '@/lib/utils';

// 主題類型
type ThemeMode = 'light' | 'dark' | 'system';

// 主題切換函數
function setTheme(mode: ThemeMode) {
  const root = document.documentElement;
  
  // 保存主題設定
  theme.set(mode);
  
  // 獲取實際應該應用的主題
  const effectiveTheme = theme.getEffectiveTheme();
  const isDark = effectiveTheme === 'dark';
  
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
}

interface ThemeToggleProps {
  variant?: 'button' | 'toggle';
}

export function ThemeToggle({ variant = 'button' }: ThemeToggleProps) {
  // 獲取當前主題模式
  const [currentMode, setCurrentMode] = useState<ThemeMode>(() => {
    const stored = theme.get();
    return stored || 'system';
  });

  // 獲取當前實際的主題（用於顯示狀態）
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    // 確保初始狀態與存儲的主題同步
    const storedMode = theme.get() || 'system';
    if (storedMode !== currentMode) {
      setCurrentMode(storedMode);
    }
    
    // 應用主題
    setTheme(storedMode);
    
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
    
    // 監聽系統主題變化（僅當設定為 system 時）
    const unwatch = theme.watchSystemTheme((systemIsDark) => {
      const currentStoredMode = theme.get() || 'system';
      if (currentStoredMode === 'system') {
        // 重新應用主題以反映系統變化
        setTheme('system');
      }
    });
    
    return () => {
      observer.disconnect();
      unwatch();
    };
  }, []);

  const handleThemeChange = (mode: ThemeMode) => {
    setCurrentMode(mode);
    setTheme(mode);
  };

  if (variant === 'toggle') {
    return (
      <div className="w-full flex justify-center">
        <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg w-fit min-w-[120px]">
          <button
            onClick={() => handleThemeChange('light')}
            className={`flex items-center justify-center h-7 px-2 text-xs font-bold transition-all rounded-md flex-1 ${
              currentMode === 'light'
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'hover:bg-secondary dark:hover:bg-gray-700 text-muted-foreground hover:text-foreground'
            }`}
            aria-label="切換到亮色主題"
          >
            <Sun className="h-5 w-5 stroke-2" />
          </button>
          <button
            onClick={() => handleThemeChange('dark')}
            className={`flex items-center justify-center h-7 px-2 text-xs font-bold transition-all rounded-md flex-1 ${
              currentMode === 'dark'
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'hover:bg-secondary dark:hover:bg-gray-700 text-muted-foreground hover:text-foreground'
            }`}
            aria-label="切換到深色主題"
          >
            <Moon className="h-5 w-5 stroke-2" />
          </button>
          <button
            onClick={() => handleThemeChange('system')}
            className={`flex items-center justify-center h-7 px-2 text-xs font-bold transition-all rounded-md flex-1 ${
              currentMode === 'system'
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'hover:bg-secondary dark:hover:bg-gray-700 text-muted-foreground hover:text-foreground'
            }`}
            aria-label="跟隨系統主題"
          >
            <Monitor className="h-5 w-5 stroke-2" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center">
      <div className="flex flex-col gap-1 p-1 bg-secondary/50 rounded-lg w-fit min-w-[40px]">
        <button
          onClick={() => handleThemeChange('light')}
          className={`flex items-center justify-center h-6 w-full text-xs font-bold transition-all rounded-md ${
            currentMode === 'light'
              ? 'bg-primary text-primary-foreground shadow-sm' 
              : 'hover:bg-secondary dark:hover:bg-gray-700 text-muted-foreground hover:text-foreground'
          }`}
          aria-label="切換到亮色主題"
        >
          <Sun className="h-4 w-4 stroke-2" />
        </button>
        <button
          onClick={() => handleThemeChange('dark')}
          className={`flex items-center justify-center h-6 w-full text-xs font-bold transition-all rounded-md ${
            currentMode === 'dark'
              ? 'bg-primary text-primary-foreground shadow-sm' 
              : 'hover:bg-secondary dark:hover:bg-gray-700 text-muted-foreground hover:text-foreground'
          }`}
          aria-label="切換到深色主題"
        >
          <Moon className="h-4 w-4 stroke-2" />
        </button>
        <button
          onClick={() => handleThemeChange('system')}
          className={`flex items-center justify-center h-6 w-full text-xs font-bold transition-all rounded-md ${
            currentMode === 'system'
              ? 'bg-primary text-primary-foreground shadow-sm' 
              : 'hover:bg-secondary dark:hover:bg-gray-700 text-muted-foreground hover:text-foreground'
          }`}
          aria-label="跟隨系統主題"
        >
          <Monitor className="h-4 w-4 stroke-2" />
        </button>
      </div>
    </div>
  );
}
