import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

// 主題切換函數
function setTheme(isDark: boolean) {
  const root = document.documentElement;
  if (isDark) {
    root.classList.add('dark');
    document.body.style.backgroundColor = 'rgb(0, 0, 0)';
    document.body.style.color = 'rgb(255, 255, 255)';
    localStorage.setItem('theme', 'dark');
  } else {
    root.classList.remove('dark');
    document.body.style.backgroundColor = 'rgb(255, 255, 255)';
    document.body.style.color = 'rgb(0, 0, 0)';
    localStorage.setItem('theme', 'light');
  }
}

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // 初始化時檢查當前主題
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
    
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
    setIsDark(newTheme);
    setTheme(newTheme);
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-foreground">
      {isDark ? (
        <Moon className="h-[1.2rem] w-[1.2rem]" />
      ) : (
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
