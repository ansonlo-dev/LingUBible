import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { theme } from '@/lib/utils';

// 主題類型（只保留亮色與深色）
type ThemeMode = 'light' | 'dark';

// 僅套用 dark class 與背景色（不儲存設定）
function applyDarkClass(isDark: boolean) {
  const root = document.documentElement;

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

// 主題切換函數（儲存使用者明確選擇並套用）
function setTheme(mode: ThemeMode) {
  theme.set(mode);
  applyDarkClass(mode === 'dark');
}

interface ThemeToggleProps {
  variant?: 'button' | 'toggle';
}

export function ThemeToggle({ variant = 'button' }: ThemeToggleProps) {
  // 當前要高亮的模式：已明確選擇則用該值，否則跟隨系統（首次訪問預設）
  const [currentMode, setCurrentMode] = useState<ThemeMode>(() => {
    const stored = theme.get();
    if (stored === 'light' || stored === 'dark') return stored;
    return theme.getEffectiveTheme();
  });

  useEffect(() => {
    // 同步初始顯示狀態
    const stored = theme.get();
    setCurrentMode(stored === 'light' || stored === 'dark' ? stored : theme.getEffectiveTheme());

    // 監聽 dark class 變化，保持高亮與實際主題同步
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const storedMode = theme.get();
          if (storedMode === 'light' || storedMode === 'dark') {
            setCurrentMode(storedMode);
          } else {
            setCurrentMode(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
          }
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    // 尚未明確選擇主題前，跟隨系統主題變化
    const unwatch = theme.watchSystemTheme((systemIsDark) => {
      const storedMode = theme.get();
      if (storedMode !== 'light' && storedMode !== 'dark') {
        applyDarkClass(systemIsDark);
        setCurrentMode(systemIsDark ? 'dark' : 'light');
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
        <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg w-fit min-w-[88px]">
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
      </div>
    </div>
  );
}
