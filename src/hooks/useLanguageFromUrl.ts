import { useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';

export function useLanguageFromUrl() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { language, setLanguage } = useLanguage();
  const location = useLocation();

  useEffect(() => {
    try {
      const langParam = searchParams.get('lang');
      
      // 如果 URL 中有語言參數且與當前語言不同，則更新語言
      if (langParam && ['en', 'zh-TW', 'zh-CN'].includes(langParam) && langParam !== language) {
        setLanguage(langParam as 'en' | 'zh-TW' | 'zh-CN');
        
        // 移除 URL 中的語言參數，保持 URL 乾淨
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('lang');
        setSearchParams(newSearchParams, { replace: true });
      }
    } catch (error) {
      console.warn('Error processing language URL parameter:', error);
    }
  }, [searchParams, language, setLanguage, setSearchParams, location.pathname]);

  return { language };
} 