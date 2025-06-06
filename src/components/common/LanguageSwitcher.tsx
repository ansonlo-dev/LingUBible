import { useState, useEffect } from 'react';
import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type Language = 'en' | 'zh-TW' | 'zh-CN';

interface LanguageSwitcherProps {
  onLanguageChange: (language: Language) => void;
  currentLanguage: Language;
  variant?: 'dropdown' | 'pills' | 'vertical-pills';
}

const languages = {
  'zh-TW': '繁體中文',
  'zh-CN': '简体中文',
  en: 'English',
};

const languageShortNames = {
  'zh-TW': '繁',
  'zh-CN': '简',
  en: 'EN',
};

export function LanguageSwitcher({ onLanguageChange, currentLanguage, variant = 'dropdown' }: LanguageSwitcherProps) {
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

  if (variant === 'pills') {
    return (
      <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg">
        {Object.entries(languageShortNames).map(([code, shortName]) => (
          <Button
            key={code}
            variant={currentLanguage === code ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onLanguageChange(code as Language)}
            className={`h-7 px-2 text-xs font-medium transition-all ${
              currentLanguage === code 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {shortName}
          </Button>
        ))}
      </div>
    );
  }

  if (variant === 'vertical-pills') {
    return (
      <div className="flex flex-col gap-1 p-1 bg-secondary/50 rounded-lg">
        {Object.entries(languageShortNames).map(([code, shortName]) => (
          <Button
            key={code}
            variant={currentLanguage === code ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onLanguageChange(code as Language)}
            className={`h-6 w-8 text-xs font-medium transition-all ${
              currentLanguage === code 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {shortName}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-lg hover:bg-secondary/80 transition-colors"
        >
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end"
        className="bg-background border shadow-lg backdrop-blur-none"
        style={{ 
          backgroundColor: isDark ? '#000000' : '#ffffff',
          backdropFilter: 'none',
          borderColor: isDark ? 'rgb(63, 63, 70)' : 'rgb(229, 231, 235)'
        }}
      >
        {Object.entries(languages).map(([code, name]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => onLanguageChange(code as Language)}
            className={currentLanguage === code ? 'bg-accent' : ''}
          >
            {name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
