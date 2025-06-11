import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { loadTranslation, preloadTranslations, type Language } from '../locales';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: Record<string, any>) => any;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Cookie utilities
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

const setCookie = (name: string, value: string, days: number = 365) => {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
};

const getInitialLanguage = (): Language => {
  // 1. Check saved cookie
  const savedLanguage = getCookie('language');
  if (savedLanguage && ['en', 'zh-TW', 'zh-CN'].includes(savedLanguage)) {
    return savedLanguage as Language;
  }
  
  // 2. Check browser language
  if (typeof navigator !== 'undefined') {
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.includes('zh-tw') || browserLang.includes('zh-hk')) {
      return 'zh-TW';
    }
    if (browserLang.includes('zh-cn') || browserLang.includes('zh')) {
      return 'zh-CN';
    }
  }
  
  // 3. Default to English
  return 'en';
};

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);
  const [translations, setTranslations] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load translations for current language
  const loadCurrentTranslations = async (lang: Language) => {
    try {
      setIsLoading(true);
      const translation = await loadTranslation(lang);
      setTranslations(translation);
    } catch (error) {
      console.error(`Failed to load translations for ${lang}:`, error);
      // Fallback to English if current language fails
      if (lang !== 'en') {
        try {
          const fallbackTranslation = await loadTranslation('en');
          setTranslations(fallbackTranslation);
        } catch (fallbackError) {
          console.error('Failed to load fallback English translations:', fallbackError);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize translations on mount
  useEffect(() => {
    loadCurrentTranslations(language);
    
    // Preload other languages in background for better performance
    setTimeout(() => {
      preloadTranslations(['en', 'zh-TW', 'zh-CN'].filter(lang => lang !== language));
    }, 1000);
  }, []);

  // Update language and load new translations
  const setLanguage = async (newLanguage: Language) => {
    console.log('🔄 切换语言到:', newLanguage);
    console.log('🔄 当前语言状态:', language);
    
    setLanguageState(newLanguage);
    setCookie('language', newLanguage);
    console.log('💾 新语言已保存到 Cookie:', newLanguage);
    
    // Load translations for new language
    await loadCurrentTranslations(newLanguage);
    
    // Trigger language change event
    if (typeof window !== 'undefined') {
      const languageChangeEvent = new CustomEvent('languageChanged', {
        detail: { language: newLanguage, previousLanguage: language }
      });
      window.dispatchEvent(languageChangeEvent);
    }
  };

  // Listen for system language changes (optional feature)
  useEffect(() => {
    const handleLanguageChange = () => {
      // Only respond to system language changes if no manual language is set
      const savedLanguage = getCookie('language');
      if (!savedLanguage) {
        const newLanguage = getInitialLanguage();
        setLanguageState(newLanguage);
        loadCurrentTranslations(newLanguage);
      }
    };

    // Listen for language change events (some browsers support this)
    window.addEventListener('languagechange', handleLanguageChange);
    
    return () => {
      window.removeEventListener('languagechange', handleLanguageChange);
    };
  }, []);

  const t = (key: string, params?: Record<string, any>): any => {
    let translation = translations[key] || key;
    
    // Debug toast-related translations
    if (key.startsWith('toast.')) {
      console.log(`🌐 翻译 "${key}" (语言: ${language}):`, translation);
    }
    
    // If there are parameters, perform string replacement
    if (params && typeof translation === 'string') {
      Object.keys(params).forEach(paramKey => {
        const placeholder = `{${paramKey}}`;
        translation = translation.replace(new RegExp(placeholder, 'g'), params[paramKey]);
      });
      
      // Debug parameter replacement results
      if (key.startsWith('toast.')) {
        console.log(`🌐 参数替换后 "${key}":`, translation);
      }
    }
    
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
