import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

declare global {
  interface Window {
    kofiWidgetOverlay: {
      draw: (username: string, options: {
        'type': string;
        'floating-chat.donateButton.text': string;
        'floating-chat.donateButton.background-color': string;
        'floating-chat.donateButton.text-color': string;
      }) => void;
    };
  }
}

export function KofiWidget() {
  const { t } = useLanguage();

  useEffect(() => {
    // 動態載入 Ko-fi 腳本
    const script = document.createElement('script');
    script.src = 'https://storage.ko-fi.com/cdn/scripts/overlay-widget.js';
    script.async = true;
    
    script.onload = () => {
      // 腳本載入完成後初始化小工具
      if (window.kofiWidgetOverlay) {
        window.kofiWidgetOverlay.draw('lingubible', {
          'type': 'floating-chat',
          'floating-chat.donateButton.text': t('kofi.donate') || 'Donate',
          'floating-chat.donateButton.background-color': '#d9534f',
          'floating-chat.donateButton.text-color': '#fff'
        });
      }
    };

    document.head.appendChild(script);

    // 清理函數
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [t]);

  return null; // Ko-fi 小工具會自動渲染到頁面上
}

// Footer 中使用的 Ko-fi 按鈕組件（與 OpenStatusWidget 相同樣式）
export function FooterKofiButton({ className = '' }: { className?: string }) {
  const { t } = useLanguage();

  const handleDonate = () => {
    window.open('https://ko-fi.com/lingubible', '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      onClick={handleDonate}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 hover:scale-105 hover:shadow-md bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 border border-pink-200/60 dark:border-pink-700/60 text-pink-700 dark:text-red-400 hover:from-pink-200 hover:to-rose-200 dark:hover:from-pink-800/40 dark:hover:to-rose-800/40 hover:border-pink-300 dark:hover:border-pink-600 ${className}`}
      title={t('kofi.supportProject') || 'Support this project'}
    >
      {/* Ko-fi 標誌圖片 */}
      <img 
        src="/logomarkLogo.webp" 
        alt="Ko-fi" 
        className="w-5 h-5 object-contain"
      />
      <span className="font-semibold">{t('kofi.donate') || 'Donate'}</span>
    </button>
  );
}

// 備用的自定義 Ko-fi 按鈕組件（如果需要更多控制）
export function CustomKofiButton() {
  const { t } = useLanguage();

  const handleDonate = () => {
    window.open('https://ko-fi.com/lingubible', '_blank', 'noopener,noreferrer');
  };

  // 在開發模式下調整位置以避免與開發工具衝突
  const isDev = import.meta.env.DEV;
  const positionClass = isDev 
    ? "fixed bottom-4 right-20 z-[60]" // 開發模式下向左移動
    : "fixed bottom-4 right-4 z-[60]"; // 生產模式下正常位置

  return (
    <button
      onClick={handleDonate}
      className={`${positionClass} bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2 text-sm font-medium border border-pink-400/30`}
      title={t('kofi.supportProject') || 'Support this project'}
    >
      <span className="text-base">❤️</span>
      <span className="hidden sm:inline font-semibold">{t('kofi.donate') || 'Donate'}</span>
    </button>
  );
} 