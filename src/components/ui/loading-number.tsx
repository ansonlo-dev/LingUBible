import { useEffect, useState } from 'react';

interface LoadingNumberProps {
  targetValue?: number;
  duration?: number;
  className?: string;
}

export function LoadingNumber({ 
  targetValue = 0, 
  duration = 800,
  className = "" 
}: LoadingNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (targetValue === 0) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // 使用 easeOutCubic 緩動函數
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(easeOutCubic * targetValue);

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [targetValue, duration]);

  return (
    <span className={`tabular-nums ${className}`}>
      {displayValue.toLocaleString()}
    </span>
  );
}

interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export function LoadingDots({ 
  size = 'md', 
  color = 'bg-primary',
  className = "" 
}: LoadingDotsProps) {
  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className={`${sizeClasses[size]} ${color} rounded-full animate-bounce`}
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );
}

interface PulsingNumberProps {
  children: React.ReactNode;
  isLoading?: boolean;
  className?: string;
}

export function PulsingNumber({ 
  children, 
  isLoading = false,
  className = "" 
}: PulsingNumberProps) {
  return (
    <div className={`relative ${className}`}>
      <div className={`transition-opacity duration-300 ${isLoading ? 'opacity-30' : 'opacity-100'}`}>
        {children}
      </div>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingDots size="sm" />
        </div>
      )}
    </div>
  );
} 