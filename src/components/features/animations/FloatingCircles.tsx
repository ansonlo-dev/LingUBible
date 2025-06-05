import React, { useState, useEffect } from 'react';

const CIRCLES_DESKTOP = [
  { size: 120, top: '10%', left: '10%', duration: 18, delay: 0 },
  { size: 80, top: '30%', left: '75%', duration: 22, delay: 2 },
  { size: 100, top: '60%', left: '20%', duration: 16, delay: 4 },
  { size: 60, top: '75%', left: '65%', duration: 20, delay: 1 },
  { size: 140, top: '50%', left: '45%', duration: 26, delay: 3 },
];

const CIRCLES_MOBILE = [
  { size: 80, top: '15%', left: '15%', duration: 20, delay: 0 },
  { size: 60, top: '70%', left: '70%', duration: 24, delay: 3 },
  { size: 100, top: '45%', left: '80%', duration: 18, delay: 1 },
];

export function FloatingCircles({ className = '', style = {}, zIndex = 0 }) {
  const [isMobile, setIsMobile] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    checkMobile();
    checkDarkMode();

    window.addEventListener('resize', checkMobile);
    
    // 監聽主題變化
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => {
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
      className={`pointer-events-none absolute inset-0 w-full h-full overflow-hidden select-none ${className}`}
      style={{ zIndex, contain: 'layout style', transform: 'translateZ(0)', ...style }}
      aria-hidden="true"
    >
      {filteredCircles.map((c, i) => (
        <span
          key={i}
          className="floating-circle"
          style={{
            width: c.size,
            height: c.size,
            top: c.top,
            left: `calc(${c.left} - ${c.size / 2}px)`,
            background: `radial-gradient(circle, rgba(220,38,38,0.15) 0%, rgba(185,28,28,0.08) 70%, transparent 100%)`,
            animationDuration: `${c.duration}s`,
            animationDelay: `${c.delay}s`,
            transform: 'translateX(0) translateY(0) translateZ(0)',
            maxWidth: `calc(100% - ${c.size}px)`,
            maxHeight: `calc(100% - ${c.size}px)`,
            willChange: 'transform, opacity',
            // 在手機版黑暗模式下降低透明度
            opacity: (isMobile && isDark) ? 0.6 : 1,
          }}
        />
      ))}
    </div>
  );
}

export default FloatingCircles; 