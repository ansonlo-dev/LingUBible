import { useEffect, useState } from 'react';

interface FloatingGlareProps {
  count?: number;
  className?: string;
  style?: React.CSSProperties;
}

interface GlareItem {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
}

export function FloatingGlare({ count = 6, className = '', style = {} }: FloatingGlareProps) {
  const [glares, setGlares] = useState<GlareItem[]>([]);

  useEffect(() => {
    const generateGlares = () => {
      const newGlares: GlareItem[] = [];
      for (let i = 0; i < count; i++) {
        newGlares.push({
          id: i,
          x: Math.random() * 100, // 0-100% 位置（更分散）
          y: Math.random() * 100, // 0-100% 位置（更分散）
          size: Math.random() * 200 + 80, // 80-280px 大小（更大範圍）
          opacity: Math.random() * 0.5 + 0.3, // 0.3-0.8 透明度（提高可見度）
          duration: Math.random() * 10 + 8, // 8-18秒動畫時間（更慢）
          delay: Math.random() * 6, // 0-6秒延遲（更分散）
        });
      }
      setGlares(newGlares);
    };

    generateGlares();
  }, [count]);

  return (
    <div 
      className={`absolute inset-0 pointer-events-none ${className}`} 
      style={{ 
        contain: 'layout style', 
        transform: 'translateZ(0)', 
        minHeight: '100vh',
        minWidth: '100vw',
        ...style
      }}
    >
      {glares.map((glare) => (
        <div
          key={glare.id}
          className="absolute rounded-full bg-gradient-to-r from-red-500/20 via-red-400/30 to-red-600/20 blur-xl animate-float floating-glare-enhanced dark:from-red-400/35 dark:via-red-300/50 dark:to-red-500/35"
          style={{
            left: `${glare.x}%`,
            top: `${glare.y}%`,
            width: `${glare.size}px`,
            height: `${glare.size}px`,
            opacity: glare.opacity,
            animationDuration: `${glare.duration}s`,
            animationDelay: `${glare.delay}s`,
            transform: 'translate(-50%, -50%) translateZ(0)',
            willChange: 'transform, opacity',
          }}
        />
      ))}
      
      {/* 額外的大型背景光暈 */}
      <div 
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-radial from-red-500/10 via-red-400/5 to-transparent rounded-full blur-3xl animate-pulse dark:from-red-400/20 dark:via-red-300/10"
        style={{ animationDuration: '12s', transform: 'translateZ(0)', willChange: 'opacity' }}
      />
      <div 
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-radial from-red-600/10 via-red-500/5 to-transparent rounded-full blur-3xl animate-pulse dark:from-red-500/20 dark:via-red-400/10"
        style={{ animationDuration: '15s', animationDelay: '3s', transform: 'translateZ(0)', willChange: 'opacity' }}
      />
    </div>
  );
} 