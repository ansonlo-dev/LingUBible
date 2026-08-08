import { useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';

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

// Footer 的捐款膠囊已改為 DonationDialog 裡的 FooterDonateButton：現在有 Ko-fi
// 以外的方式（加密貨幣），單純開 Ko-fi 連結的按鈕不再適用。

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
    <ResponsiveTooltip content={t('kofi.supportProject') || 'Support this project'}>
      <button
        onClick={handleDonate}
        className={`${positionClass} bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2 text-sm font-medium border border-pink-400/30 cursor-help`}
      >
        <span className="text-base">❤️</span>
        <span className="hidden sm:inline font-semibold">{t('kofi.donate') || 'Donate'}</span>
      </button>
    </ResponsiveTooltip>
  );
} 