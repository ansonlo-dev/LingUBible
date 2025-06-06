import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingDots, PulsingNumber } from '@/components/ui/loading-number';
import { useCounterAnimation } from '@/hooks/useCounterAnimation';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEffect } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  animationDelay?: number;
  isLoading?: boolean;
}

export function StatsCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  trend = 'neutral',
  animationDelay = 0,
  isLoading = false
}: StatsCardProps) {
  const { t } = useLanguage();
  const { elementRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1, // 降低閾值，更容易觸發
    triggerOnce: true
  });

  // 解析數字值
  const parseNumericValue = (val: string | number): number => {
    if (typeof val === 'number') return val;
    
    // 移除逗號和其他非數字字符，但保留數字
    const numericString = val.replace(/[^\d]/g, '');
    const parsed = parseInt(numericString, 10);
    return isNaN(parsed) ? 0 : parsed;
  };

  const numericValue = parseNumericValue(value);
  const isNumeric = numericValue > 0 && !isLoading;

  // 根據數值大小設置不同的起始百分比
  const getStartPercentage = (num: number): number => {
    if (num >= 10000) return 0.6; // 大數字從60%開始
    if (num >= 1000) return 0.5;  // 中等數字從50%開始
    if (num >= 100) return 0.3;   // 小數字從30%開始
    return 0.1; // 很小的數字從10%開始
  };

  const { count, startAnimation, hasAnimated, isAnimating } = useCounterAnimation({
    end: numericValue,
    duration: 1500,
    delay: animationDelay,
    startPercentage: getStartPercentage(numericValue)
  });

  useEffect(() => {
    if (isIntersecting && isNumeric && !hasAnimated && !isAnimating) {
      startAnimation();
    }
  }, [isIntersecting, isNumeric, hasAnimated, isAnimating, startAnimation]);

  // 格式化顯示值
  const formatDisplayValue = (val: number): string => {
    if (typeof value === 'string' && value.includes(',')) {
      return val.toLocaleString();
    }
    return val.toString();
  };

  const displayValue = isNumeric ? formatDisplayValue(count) : value;

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600 dark:text-green-400';
      case 'down': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-muted-foreground';
    }
  };

  return (
    <Card className="stats-card" ref={elementRef}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">{title}</p>
            
            <PulsingNumber isLoading={isLoading} className="mt-1">
              <p className="text-2xl font-bold text-foreground tabular-nums">
                {displayValue}
              </p>
            </PulsingNumber>
            
            {change && !isLoading && (
              <p className={`text-sm mt-1 transition-opacity duration-300 ${getTrendColor()}`}>
                {change}
              </p>
            )}
            
            {isLoading && (
              <div className="flex items-center space-x-2 mt-1">
                <LoadingDots size="sm" />
                <span className="text-xs text-muted-foreground">{t('stats.updating')}</span>
              </div>
            )}
          </div>
          
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <div className={`transition-all duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
              <Icon className="h-6 w-6 text-primary" />
            </div>
            {isLoading && (
              <div className="absolute">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
