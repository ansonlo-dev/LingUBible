import { Star } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { useIsMobile } from '@/hooks/use-mobile';

// 格式化評分，移除尾隨零
const formatRating = (rating: number): string => {
  // 先格式化為兩位小數
  const formatted = rating.toFixed(2);
  // 移除尾隨零和小數點（如果需要）
  return formatted.replace(/\.?0+$/, '');
};

interface StarRatingProps {
  rating: number | null;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
  // Add props for tooltip functionality
  showTooltip?: boolean;
  ratingType?: 'workload' | 'difficulty' | 'usefulness' | 'teaching' | 'grading';
}

export const StarRating = ({ 
  rating, 
  maxRating = 5, 
  size = 'md', 
  showValue = false,
  className = '',
  showTooltip = false,
  ratingType = 'teaching'
}: StarRatingProps) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  // Function to get rating description based on type and value
  const getRatingDescription = (value: number, type: string): string => {
    if (value === 0) {
      switch (type) {
        case 'workload':
          return t('review.workload.none');
        case 'difficulty':
          return t('review.difficulty.none');
        case 'usefulness':
          return t('review.usefulness.none');
        case 'teaching':
        case 'grading':
        default:
          return t('review.rating.0');
      }
    }
    
    const roundedValue = Math.ceil(value);
    
    switch (type) {
      case 'workload':
        return t(`review.workload.${['', 'veryLight', 'light', 'moderate', 'heavy', 'veryHeavy'][roundedValue]}`);
      case 'difficulty':
        return t(`review.difficulty.${['', 'veryEasy', 'easy', 'moderate', 'hard', 'veryHard'][roundedValue]}`);
      case 'usefulness':
        return t(`review.usefulness.${['', 'notUseful', 'slightlyUseful', 'moderatelyUseful', 'veryUseful', 'extremelyUseful'][roundedValue]}`);
      case 'teaching':
      case 'grading':
      default:
        return t(`review.rating.${roundedValue}`);
    }
  };

  // Generate tooltip text
  const getTooltipText = (rating: number): string => {
    const description = getRatingDescription(rating, ratingType);
    return `${formatRating(rating)}/5 - ${description}`;
  };

  // 處理 null、undefined 和無效值
  if (rating === null || rating === undefined || typeof rating !== 'number' || isNaN(rating)) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <div className="flex items-center">
          {Array.from({ length: maxRating }, (_, index) => (
            <Star
              key={index}
              className={`${sizeClasses[size]} fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700`}
            />
          ))}
        </div>
        {showValue && (
          <span className={`${textSizeClasses[size]} text-muted-foreground ml-1`}>
            N/A
          </span>
        )}
      </div>
    );
  }

  // Handle N/A rating (-1)
  if (rating === -1) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <div className="flex items-center">
          {Array.from({ length: maxRating }, (_, index) => (
            <Star
              key={index}
              className={`${sizeClasses[size]} fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700`}
            />
          ))}
        </div>
        {showValue && (
          <span className={`${textSizeClasses[size]} text-muted-foreground ml-1`}>
            {t('review.notApplicable')}
          </span>
        )}
      </div>
    );
  }

  const renderStars = () => (
    <div className="flex items-center">
      {Array.from({ length: maxRating }, (_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= rating;
        const isPartial = starValue > rating && starValue - 1 < rating;
        const partialPercentage = isPartial ? (rating - (starValue - 1)) * 100 : 0;
        
        if (isPartial) {
          // 使用單個 SVG 和 linearGradient 來創建半填充效果
          const uniqueId = `star-gradient-${index}-${Math.random().toString(36).substr(2, 9)}`;
          
          return (
            <div key={index} className={`${sizeClasses[size]}`}>
              <svg 
                className={`${sizeClasses[size]}`}
                viewBox="0 0 24 24" 
                fill="currentColor"
              >
                <defs>
                  <linearGradient id={uniqueId} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset={`${partialPercentage}%`} stopColor="#facc15" />
                    <stop offset={`${partialPercentage}%`} stopColor="#e5e7eb" />
                  </linearGradient>
                  <linearGradient id={`${uniqueId}-dark`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset={`${partialPercentage}%`} stopColor="#facc15" />
                    <stop offset={`${partialPercentage}%`} stopColor="#374151" />
                  </linearGradient>
                </defs>
                <path 
                  d="m12,2l3.09,6.26L22,9.27l-5,4.87 1.18,6.88L12,17.77l-6.18,3.25L7,14.14 2,9.27l6.91-1.01L12,2Z" 
                  fill={`url(#${uniqueId})`}
                  className="dark:hidden"
                />
                <path 
                  d="m12,2l3.09,6.26L22,9.27l-5,4.87 1.18,6.88L12,17.77l-6.18,3.25L7,14.14 2,9.27l6.91-1.01L12,2Z" 
                  fill={`url(#${uniqueId}-dark)`}
                  className="hidden dark:block"
                />
              </svg>
            </div>
          );
        }
        
        return (
          <Star
            key={index}
            className={`${sizeClasses[size]} ${
              isFilled 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700'
            }`}
          />
        );
      })}
    </div>
  );

  // Always use ResponsiveTooltip when showTooltip is true
  if (showTooltip) {
    return (
      <ResponsiveTooltip 
        content={getTooltipText(rating)}
      >
        <div className={`flex items-center gap-1 cursor-help ${className}`}>
          {renderStars()}
          {showValue && (
            <span className={`${textSizeClasses[size]} text-muted-foreground ml-1`}>
              {formatRating(rating)}
            </span>
          )}
        </div>
      </ResponsiveTooltip>
    );
  }

  // No tooltip version
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {renderStars()}
      {showValue && (
        <span className={`${textSizeClasses[size]} text-muted-foreground ml-1`}>
          {formatRating(rating)}
        </span>
      )}
    </div>
  );
}; 