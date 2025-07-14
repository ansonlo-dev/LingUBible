import React, { useState, useEffect, useRef } from 'react';

const CIRCLES_DESKTOP = [
  { size: 120, top: '10%', left: '10%', duration: 18, delay: 0 },
  { size: 80, top: '30%', left: '75%', duration: 22, delay: 2 },
  { size: 100, top: '60%', left: '20%', duration: 16, delay: 4 },
  { size: 60, top: '75%', left: '65%', duration: 20, delay: 1 },
  { size: 140, top: '50%', left: '45%', duration: 26, delay: 3 },
  { size: 90, top: '85%', left: '30%', duration: 24, delay: 5 },
  { size: 110, top: '25%', left: '90%', duration: 20, delay: 6 },
  { size: 70, top: '90%', left: '80%', duration: 18, delay: 7 },
  { size: 85, top: '5%', left: '50%', duration: 28, delay: 8 },
];

const CIRCLES_MOBILE = [
  { size: 80, top: '15%', left: '15%', duration: 20, delay: 0 },
  { size: 60, top: '70%', left: '70%', duration: 24, delay: 3 },
  { size: 100, top: '45%', left: '80%', duration: 18, delay: 1 },
  { size: 70, top: '85%', left: '25%', duration: 22, delay: 4 },
  { size: 90, top: '30%', left: '85%', duration: 26, delay: 2 },
];

export function FloatingCircles({ className = '', style = {}, zIndex = 0 }) {
  const [isMobile, setIsMobile] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    checkMobile();
    checkDarkMode();

    // 延遲顯示動畫，避免初始化時的跳躍
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    window.addEventListener('resize', checkMobile);
    
    // 監聽主題變化
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => {
      clearTimeout(showTimer);
      window.removeEventListener('resize', checkMobile);
      observer.disconnect();
    };
  }, []);

  // 根據設備和模式選擇圓圈配置
  const circles = isMobile ? CIRCLES_MOBILE : CIRCLES_DESKTOP;
  
  // 在手機版黑暗模式下進一步減少圓圈數量
  const filteredCircles = (isMobile && isDark) 
    ? circles.slice(0, 2) // 只顯示前2個圓圈
    : circles;

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none absolute inset-0 w-full h-full select-none transition-opacity duration-300 ${className}`}
      style={{ 
        zIndex, 
        contain: 'layout style paint', 
        transform: 'translateZ(0)', 
        height: '100vh',
        width: '100vw',
        position: 'fixed',
        top: 0,
        left: 0,
        opacity: isVisible ? 1 : 0,
        isolation: 'isolate',
        ...style 
      }}
      aria-hidden="true"
    >
      {isVisible && filteredCircles.map((c, i) => {
        // 使用隨機化的延遲來避免同步問題
        const randomOffset = Math.random() * 2; // 0-2秒的隨機偏移
        const finalDelay = c.delay + randomOffset;
        
        return (
          <span
            key={`circle-${i}-${isVisible}`}
            className="floating-circle"
            style={{
              position: 'absolute',
              width: c.size,
              height: c.size,
              top: `${parseFloat(c.top)}vh`,
              left: `calc(${parseFloat(c.left)}vw - ${c.size / 2}px)`,
              background: `radial-gradient(circle, rgba(220,38,38,0.25) 0%, rgba(185,28,28,0.15) 70%, transparent 100%)`,
              animationDuration: `${c.duration}s`,
              animationDelay: `${finalDelay}s`,
              animationFillMode: 'both',
              animationPlayState: 'running',
              transform: 'translateX(0) translateY(0) translateZ(0)',
              willChange: 'transform, opacity',
              // 在手機版黑暗模式下降低透明度
              opacity: (isMobile && isDark) ? 0.6 : 1,
            }}
          />
        );
      })}
    </div>
  );
}

export default FloatingCircles; 