import React, { useState, useEffect } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface TechnologyNetworkAnimationProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  speed?: number;
  autoplay?: boolean;
  loop?: boolean;
}

const sizeClasses = {
  sm: 'h-16 w-16',
  md: 'h-24 w-24',
  lg: 'h-32 w-32',
  xl: 'h-48 w-48',
  '2xl': 'h-64 w-64',
  '3xl': 'h-80 w-80'
};

export const TechnologyNetworkAnimation: React.FC<TechnologyNetworkAnimationProps> = ({
  className = '',
  size = 'xl',
  speed = 0.25,
  autoplay = true,
  loop = true
}) => {
  const [key, setKey] = useState(0);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let previousOrientation = window.innerWidth > window.innerHeight;
    
    const handleOrientationChange = () => {
      // 延遲後重新渲染動畫（透過改變key強制重新載入）
      timeoutId = setTimeout(() => {
        setKey(prev => prev + 1);
      }, 300);
    };

    const handleResize = () => {
      const currentOrientation = window.innerWidth > window.innerHeight;
      // 檢測方向是否改變
      if (currentOrientation !== previousOrientation) {
        previousOrientation = currentOrientation;
        handleOrientationChange();
      }
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleResize);
    
    // 監聽視窗可見性變化
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // 頁面重新可見時，重新渲染動畫
        handleOrientationChange();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className={`inline-flex justify-center items-center ${className}`}>
      <div className={`${sizeClasses[size]} relative portrait:scale-[1.35] portrait:sm:scale-100 portrait:my-5 portrait:sm:my-0 transition-all duration-300`} style={{ aspectRatio: '1/1' }}>
        <DotLottieReact
          key={key}
          src="/animations/technology-network-red.lottie"
          className="absolute inset-0 w-full h-full object-contain"
          autoplay={autoplay}
          loop={loop}
          speed={speed}
        />
      </div>
    </div>
  );
};