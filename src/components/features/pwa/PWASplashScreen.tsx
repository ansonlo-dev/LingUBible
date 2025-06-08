import { useState, useEffect } from 'react';
import { usePWAManifest } from '@/hooks/usePWAManifest';
import { useLanguage } from '@/contexts/LanguageContext';

interface PWASplashScreenProps {
  isVisible: boolean;
  onComplete?: () => void;
  duration?: number; // 顯示時長（毫秒）
}

export function PWASplashScreen({ 
  isVisible, 
  onComplete, 
  duration = 3000 
}: PWASplashScreenProps) {
  const { t } = useLanguage();
  const { getAppName, getAppIcon, isManifestReady } = usePWAManifest();
  const [animationPhase, setAnimationPhase] = useState<'enter' | 'main' | 'exit'>('enter');

  useEffect(() => {
    if (!isVisible) return;

    // 添加全局緊急退出函數到 window 對象
    (window as any).emergencyExitSplash = () => {
      console.log('緊急退出 PWA 啟動畫面 - 通過控制台命令');
      sessionStorage.setItem('pwa-splash-disabled', 'true');
      sessionStorage.setItem('app-loaded', 'true');
      onComplete?.();
    };

    const timer1 = setTimeout(() => {
      setAnimationPhase('main');
    }, 500);

    const timer2 = setTimeout(() => {
      setAnimationPhase('exit');
    }, duration - 500);

    const timer3 = setTimeout(() => {
      onComplete?.();
    }, duration);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      // 清理全局函數
      delete (window as any).emergencyExitSplash;
    };
  }, [isVisible, duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div 
      className={`
        fixed inset-0 z-[100000] flex flex-col items-center justify-center
        bg-gradient-to-br from-red-600 via-red-500 to-red-700
        transition-all duration-500 ease-in-out cursor-pointer
        ${animationPhase === 'exit' ? 'opacity-0 scale-110' : 'opacity-100 scale-100'}
      `}
      onClick={() => {
        console.log('PWA 啟動畫面被點擊，強制關閉');
        onComplete?.();
      }}
      onTouchStart={() => {
        console.log('PWA 啟動畫面被觸摸，強制關閉');
        onComplete?.();
      }}
    >
      {/* 背景動畫效果 */}
      <div className="absolute inset-0 overflow-hidden">
        {/* 漸變光暈 */}
        <div className={`
          absolute top-1/4 left-1/4 w-96 h-96 
          bg-gradient-radial from-white/20 to-transparent 
          rounded-full blur-3xl
          transition-all duration-2000 ease-out
          ${animationPhase === 'main' ? 'scale-150 opacity-30' : 'scale-100 opacity-10'}
        `} />
        
        {/* 浮動粒子效果 */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className={`
              absolute w-2 h-2 bg-white/30 rounded-full
              transition-all duration-3000 ease-out
              ${animationPhase === 'main' ? 'animate-float' : ''}
            `}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.2}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* 主要內容 */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo 容器 */}
        <div className={`
          relative mb-8
          transition-all duration-1000 ease-out
          ${animationPhase === 'enter' ? 'scale-50 opacity-0 translate-y-8' : 
            animationPhase === 'main' ? 'scale-100 opacity-100 translate-y-0' : 
            'scale-110 opacity-0 -translate-y-4'}
        `}>
          {/* Logo 背景光暈 */}
          <div className="absolute inset-0 bg-white/20 rounded-3xl blur-xl scale-110 animate-pulse" />
          
          {/* Logo */}
          <div className="relative w-24 h-24 md:w-32 md:h-32 bg-white rounded-3xl shadow-2xl flex items-center justify-center">
            {getAppIcon('192x192') ? (
              <img 
                src={getAppIcon('192x192')} 
                alt="LingUBible Logo" 
                className="w-16 h-16 md:w-20 md:h-20 object-contain"
              />
            ) : (
                             <div className="w-16 h-16 md:w-20 md:h-20 bg-red-600 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v6m0-6C10.832 8.477 9.246 8 7.5 8S4.168 8.477 3 9.253v9C4.168 17.477 5.754 17 7.5 17s3.332.477 4.5 1.253m0-9.253C13.168 8.477 14.754 8 16.5 8c1.746 0 3.332.477 4.5 1.253v9C19.832 17.477 18.246 17 16.5 17c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* 應用名稱 */}
        <div className={`
          text-center mb-6
          transition-all duration-1000 ease-out delay-300
          ${animationPhase === 'enter' ? 'opacity-0 translate-y-4' : 
            animationPhase === 'main' ? 'opacity-100 translate-y-0' : 
            'opacity-0 -translate-y-2'}
        `}>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {isManifestReady() ? getAppName().split(' - ')[0] : 'LingUBible'}
          </h1>
          <p className="text-white/80 text-sm md:text-base font-medium">
            課程與講師評價平台
          </p>
        </div>

        {/* 載入動畫 */}
        <div className={`
          transition-all duration-1000 ease-out delay-500
          ${animationPhase === 'enter' ? 'opacity-0 scale-50' : 
            animationPhase === 'main' ? 'opacity-100 scale-100' : 
            'opacity-0 scale-75'}
        `}>
          {/* 脈衝載入點 */}
          <div className="flex items-center space-x-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-3 h-3 bg-white/60 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
          
          {/* 載入文字 */}
          <p className="text-white/60 text-sm mt-4 text-center animate-pulse">
            載入中...
          </p>
        </div>

        {/* 進度條 */}
        <div className={`
          w-48 md:w-64 mt-8
          transition-all duration-1000 ease-out delay-700
          ${animationPhase === 'enter' ? 'opacity-0 translate-y-4' : 
            animationPhase === 'main' ? 'opacity-100 translate-y-0' : 
            'opacity-0 translate-y-2'}
        `}>
          <div className="h-1 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white/60 rounded-full animate-progress-bar" />
          </div>
        </div>
      </div>

      {/* 底部品牌信息 */}
      <div className={`
        absolute bottom-8 left-0 right-0 text-center
        transition-all duration-1000 ease-out delay-1000
        ${animationPhase === 'enter' ? 'opacity-0 translate-y-4' : 
          animationPhase === 'main' ? 'opacity-100 translate-y-0' : 
          'opacity-0 translate-y-2'}
      `}>
        <p className="text-white/40 text-xs">
          Powered by LingUBible
        </p>
      </div>
    </div>
  );
}

// 自定義 CSS 動畫樣式（需要添加到全局 CSS 中）
export const splashScreenStyles = `
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    33% { transform: translateY(-10px) rotate(120deg); }
    66% { transform: translateY(5px) rotate(240deg); }
  }

  @keyframes progress-bar {
    0% { width: 0%; }
    50% { width: 60%; }
    100% { width: 100%; }
  }

  .animate-float {
    animation: float 4s ease-in-out infinite;
  }

  .animate-progress-bar {
    animation: progress-bar 2.5s ease-out forwards;
  }

  .bg-gradient-radial {
    background: radial-gradient(circle, var(--tw-gradient-stops));
  }
`; 