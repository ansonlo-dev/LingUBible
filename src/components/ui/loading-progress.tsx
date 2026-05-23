import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface LoadingProgressProps {
  isLoading: boolean;
  progress?: number;
  showText?: boolean;
  text?: string;
  variant?: 'default' | 'subtle' | 'gradient';
  className?: string;
}

export function LoadingProgress({
  isLoading,
  progress,
  showText = true,
  text,
  variant = 'default',
  className
}: LoadingProgressProps) {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const startTimeRef = useRef<number>(0);

  // 簡化的載入步驟系統
  const loadingSteps = [
    { name: 'courses', label: '課程' },
    { name: 'instructors', label: '講師' },
    { name: 'reviews', label: '評價' },
    { name: 'stats', label: '統計' },
    { name: 'cache', label: '緩存' },
  ];

  useEffect(() => {
    if (!isLoading) {
      // 重置狀態
      setDisplayProgress(0);
      setCurrentStep(1);
      return;
    }

    if (progress !== undefined) {
      setDisplayProgress(progress);
      return;
    }

    // 重置並開始新的進度
    setDisplayProgress(0);
    setCurrentStep(1);
    startTimeRef.current = Date.now();

    let currentProgress = 0;
    let stepIndex = 0;

    const updateProgress = () => {
      const elapsedTime = Date.now() - startTimeRef.current;
      
      // 更均勻的進度分佈
      let increment;
      let maxProgress;
      
      if (elapsedTime < 1500) { 
        // 前1.5秒：穩定啟動 (0-30%)
        increment = Math.random() * 3 + 2; // 2-5
        maxProgress = 30;
      } else if (elapsedTime < 3500) { 
        // 1.5-3.5秒：穩定載入 (30-60%)
        increment = Math.random() * 3 + 1.5; // 1.5-4.5
        maxProgress = 60;
      } else if (elapsedTime < 6000) { 
        // 3.5-6秒：持續進展 (60-80%)
        increment = Math.random() * 2.5 + 1; // 1-3.5
        maxProgress = 80;
      } else if (elapsedTime < 8000) { 
        // 6-8秒：接近完成 (80-90%)
        increment = Math.random() * 2 + 0.5; // 0.5-2.5
        maxProgress = 90;
      } else { 
        // 8秒後：緩慢完成 (90-92%)，避免卡太久
        increment = Math.random() * 1 + 0.3; // 0.3-1.3
        maxProgress = 92;
      }

      currentProgress += increment;
      currentProgress = Math.min(currentProgress, maxProgress);
      
      setDisplayProgress(currentProgress);

      // 更新當前步驟（基於進度）
      const newStepIndex = Math.floor((currentProgress / 92) * loadingSteps.length);
      const stepNumber = Math.min(newStepIndex + 1, loadingSteps.length);
      setCurrentStep(stepNumber);
    };

    const interval = setInterval(updateProgress, 150);

    return () => clearInterval(interval);
  }, [isLoading, progress]);

  useEffect(() => {
    if (!isLoading && displayProgress > 0) {
      // 載入完成 - 快速到達100%然後隱藏
      setDisplayProgress(100);
      
      const hideTimeout = setTimeout(() => {
        setDisplayProgress(0);
        setCurrentStep(1);
      }, 400);

      return () => clearTimeout(hideTimeout);
    }
  }, [isLoading]);

  // 獲取當前載入文字
  const getLoadingText = () => {
    if (text) return text;
    
    const totalSteps = loadingSteps.length;
    const currentStepData = loadingSteps[currentStep - 1] || loadingSteps[0];
    
    return `載入${currentStepData.label} (${currentStep}/${totalSteps})`;
  };

  const getProgressBarClasses = () => {
    switch (variant) {
      case 'subtle':
        return 'bg-muted-foreground/20';
      case 'gradient':
        return 'bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20';
      default:
        return 'bg-primary/20';
    }
  };

  const getProgressFillClasses = () => {
    switch (variant) {
      case 'subtle':
        return 'bg-muted-foreground/60';
      case 'gradient':
        return 'bg-gradient-to-r from-primary via-primary/90 to-primary';
      default:
        return 'bg-primary';
    }
  };

  if (!isLoading && displayProgress === 0) {
    return null;
  }

  return (
    <div className={cn('w-full space-y-2', className)}>
      {showText && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">
            {getLoadingText()}
          </span>
          <span className="text-muted-foreground font-mono tabular-nums">
            {Math.round(displayProgress)}%
          </span>
        </div>
      )}
      
      <div className={cn(
        'relative h-2.5 rounded-full overflow-hidden shadow-sm',
        getProgressBarClasses()
      )}>
        <div
          className={cn(
            'absolute top-0 left-0 h-full rounded-full transition-all duration-300 ease-out',
            getProgressFillClasses()
          )}
          style={{ width: `${displayProgress}%` }}
        />
        
        {/* Simplified shine effect */}
        {displayProgress > 0 && displayProgress < 100 && (
          <div
            className="absolute top-0 left-0 h-full w-full overflow-hidden rounded-full"
          >
            <div
              className="absolute top-0 h-full w-1/4 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-pulse"
              style={{
                left: `${Math.max(displayProgress - 25, -25)}%`,
                transition: 'left 0.3s ease-out'
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}