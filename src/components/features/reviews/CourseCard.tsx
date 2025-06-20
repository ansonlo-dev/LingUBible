import { Star, MessageSquare, BookOpen, CheckCircle, XCircle, Scale, Brain, Target, Loader2, Crown, AlertTriangle, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { StarRating } from '@/components/ui/star-rating';
import { useCourseDetailedStats } from '@/hooks/useCourseDetailedStats';

interface CourseCardProps {
  title: string;
  code: string;
  department: string;
  language: string;
  rating?: number;
  reviewCount?: number;
  isOfferedInCurrentTerm?: boolean;
}

// 課程質量評估函數
const getCourseQuality = (stats: any, reviewCount: number) => {
  // 如果沒有評價數據，顯示為未知
  if (!stats || reviewCount === 0) {
    return 'noData';
  }

  const { averageWorkload, averageDifficulty, averageUsefulness } = stats;
  
  // 需要至少5個評論才能進行質量評級
  if (reviewCount >= 5) {
    // 計算綜合分數：(工作量 + 難度 + 實用性) / 3
    const overallScore = ((averageWorkload || 0) + (averageDifficulty || 0) + (averageUsefulness || 0)) / 3;
    
    if (overallScore >= 4.2) return 'excellent';  // 更嚴格：從 3.8 提升到 4.2
    if (overallScore >= 3.5) return 'good';       // 更嚴格：從 3.2 提升到 3.5
    if (overallScore >= 2.5) return 'average';    // 更嚴格：從 2.2 提升到 2.5
    if (overallScore >= 1.5) return 'poor';       // 更嚴格：從 1.2 提升到 1.5
    return 'terrible';
  }
  
  // 評論數量不足5個，顯示為評論不足
  if (reviewCount > 0 && reviewCount < 5) {
    return 'notEnoughReviews';
  }
  
  return 'noData';
};

// 獲取課程質量樣式
const getQualityStyles = (quality: string) => {
  switch (quality) {
    case 'excellent':
      return {
        cardClass: 'quality-excellent border-2 border-amber-600 dark:border-amber-500 bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-900/20 dark:to-yellow-800/20 shadow-lg shadow-amber-600/50 dark:shadow-amber-600/30',
        badgeClass: 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white border-amber-700 shadow-lg hover:from-amber-800 hover:to-yellow-800',
        badgeText: 'card.excellent',
        icon: Crown,
        iconColor: 'text-amber-600 dark:text-amber-500'
      };
    case 'good':
      return {
        cardClass: 'quality-good border-2 border-green-400 dark:border-green-500 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 shadow-md shadow-green-200/40 dark:shadow-green-900/20',
        badgeClass: 'bg-green-500 text-white border-green-600 shadow-sm hover:bg-green-700',
        badgeText: 'card.good',
        icon: ThumbsUp,
        iconColor: 'text-green-600 dark:text-green-400'
      };
    case 'average':
      return {
        cardClass: 'quality-average border-2 border-yellow-600 dark:border-yellow-500 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 shadow-sm shadow-yellow-200/30 dark:shadow-yellow-900/10',
        badgeClass: 'bg-yellow-600 text-white border-yellow-700 shadow-sm hover:bg-yellow-800',
        badgeText: 'card.average',
        icon: Scale,
        iconColor: 'text-yellow-600 dark:text-yellow-400'
      };
    case 'poor':
      return {
        cardClass: 'quality-poor border-2 border-orange-400 dark:border-orange-500 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 shadow-md shadow-orange-200/40 dark:shadow-orange-900/20',
        badgeClass: 'bg-orange-500 text-white border-orange-600 shadow-sm hover:bg-orange-700',
        badgeText: 'card.poor',
        icon: AlertTriangle,
        iconColor: 'text-orange-600 dark:text-orange-400'
      };
    case 'terrible':
      return {
        cardClass: 'quality-terrible border-2 border-red-600 dark:border-red-500 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 shadow-lg shadow-red-300/50 dark:shadow-red-900/40',
        badgeClass: 'bg-red-600 text-white border-red-700 shadow-sm hover:bg-red-800',
        badgeText: 'card.terrible',
        icon: ThumbsDown,
        iconColor: 'text-red-700 dark:text-red-400'
      };
    case 'notEnoughReviews':
      return {
        cardClass: 'quality-not-enough border-2 border-blue-400 dark:border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 shadow-sm shadow-blue-200/30 dark:shadow-blue-900/20',
        badgeClass: 'bg-blue-400 text-white border-blue-500 hover:bg-blue-600',
        badgeText: 'card.notEnoughReviews',
        icon: MessageSquare,
        iconColor: 'text-blue-500 dark:text-blue-400'
      };
    case 'noData':
      return {
        cardClass: 'quality-no-data border-2 border-gray-300 dark:border-gray-600',
        badgeClass: 'bg-gray-400 text-white border-gray-500 hover:bg-gray-600',
        badgeText: 'card.noData',
        icon: Loader2,
        iconColor: 'text-gray-500 dark:text-gray-400'
      };
    default:
      return {
        cardClass: 'quality-default border-2 border-gray-300 dark:border-gray-600',
        badgeClass: 'bg-gray-400 text-white hover:bg-gray-600',
        badgeText: 'card.noData',
        icon: null,
        iconColor: ''
      };
  }
};

export function CourseCard({
  title,
  code,
  department,
  language,
  rating = 0,
  reviewCount = 0,
  isOfferedInCurrentTerm = false
}: CourseCardProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const preloadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { stats, isLoading } = useCourseDetailedStats(code);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkTheme();
    
    // 監聽主題變化
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  const handleCardClick = () => {
    navigate(`/courses/${code}`);
  };

  // 懸停預載入處理
  const handleMouseEnter = () => {
    // 清除之前的定時器
    if (preloadTimeoutRef.current) {
      clearTimeout(preloadTimeoutRef.current);
    }
    
    // 延遲300ms後開始預載入，避免用戶快速掃過時觸發
    preloadTimeoutRef.current = setTimeout(() => {
      // Preload removed - no longer using cache
    }, 300);
  };

  const handleMouseLeave = () => {
    // 用戶離開時取消預載入
    if (preloadTimeoutRef.current) {
      clearTimeout(preloadTimeoutRef.current);
      preloadTimeoutRef.current = null;
    }
  };

  // 清理定時器
  useEffect(() => {
    return () => {
      if (preloadTimeoutRef.current) {
        clearTimeout(preloadTimeoutRef.current);
      }
    };
  }, []);

  // 獲取課程質量和樣式
  const quality = getCourseQuality(stats, reviewCount);
  const qualityStyles = getQualityStyles(quality);
  const QualityIcon = qualityStyles.icon;

  // 如果數據還在加載，使用預設樣式避免閃爍
  const cardClassName = isLoading 
    ? 'border-2 border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/10 dark:to-gray-800/10'
    : qualityStyles.cardClass;

  // 調試信息（生產環境可移除）
  // console.log(`Course ${code}:`, {
  //   stats,
  //   reviewCount,
  //   quality,
  //   overallScore: stats ? ((stats.averageWorkload || 0) + (stats.averageDifficulty || 0) + (stats.averageUsefulness || 0)) / 3 : 'N/A',
  //   cardClass: qualityStyles.cardClass
  // });

  // 統計框組件 - 更小的版本用於標題旁邊
  const StatBox = ({ icon: Icon, value, label, color, hasValidData }: { 
    icon: any, 
    value: number, 
    label: string, 
    color: string,
    hasValidData: boolean
  }) => (
    <div 
      className={`flex flex-col items-center px-1.5 py-1.5 bg-gradient-to-br ${color} rounded-md border text-xs hover:scale-105 transition-transform cursor-help`}
      title={`${label}: ${hasValidData ? value.toFixed(2) : 'N/A'}/5`}
    >
      {Icon && <Icon className="h-3 w-3 mb-0.5" />}
      <span className="font-bold text-xs">{hasValidData ? value.toFixed(2) : 'N/A'}</span>
    </div>
  );

  // 載入中的統計框 - 更小的版本
  const StatBoxLoading = ({ color }: { color: string }) => (
    <div className={`flex flex-col items-center px-1.5 py-1.5 bg-gradient-to-br ${color} rounded-md border text-xs`}>
      <Loader2 className="h-3 w-3 mb-0.5 animate-spin" />
      <span className="font-bold text-xs">--</span>
      <span className="text-xs font-medium leading-tight">--</span>
    </div>
  );

  // Show loading skeleton while stats are loading
  if (isLoading) {
    return (
      <div className="relative">
        <Card className="course-card border-2 border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/10 dark:to-gray-800/10">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0 space-y-2">
                {/* Course title skeleton */}
                <div className="flex items-start gap-2 mb-1">
                  <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded animate-pulse flex-1"></div>
                </div>
                {/* Course code skeleton */}
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-20"></div>
                {/* Review count skeleton */}
                <div className="flex items-center gap-1 mt-1">
                  <div className="h-3 w-3 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-16"></div>
                </div>
              </div>
              
              {/* Loading stat boxes skeleton */}
              <div className="flex gap-1.5 shrink-0">
                <div className="h-12 w-12 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                <div className="h-12 w-12 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                <div className="h-12 w-12 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="flex items-center justify-between mb-2">
              {/* Badge skeletons */}
              <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-16"></div>
              <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-20"></div>
            </div>
            
            <div className="mt-2">
              {/* Quality badge skeleton */}
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-24"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative">
      <Card 
        className={`course-card group cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] relative ${cardClassName}`}
        onClick={handleCardClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ overflow: 'hidden' }}
      >

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-1">
              <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors duration-200 line-clamp-2 flex-1">
                {title}
              </CardTitle>
            </div>
            <p className="text-sm text-gray-600 dark:text-muted-foreground font-mono">{code}</p>
            {/* Review count display */}
            <div className="flex items-center gap-1 mt-1">
              <MessageSquare className="h-3 w-3 text-gray-500 dark:text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {reviewCount} {reviewCount === 1 ? t('card.review') : t('card.reviews')}
              </span>
            </div>
          </div>
          
          {/* 3個水平統計框 - 移到右側，只在有評論時顯示 */}
          {(stats && reviewCount > 0) && (
            <div className="flex gap-1.5 shrink-0">
              <StatBox
                icon={Scale}
                value={stats?.averageWorkload || 0}
                label={t('card.workload')}
                color="from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800/30 text-blue-600 dark:text-blue-400"
                hasValidData={stats && reviewCount > 0 && stats.averageWorkload > 0}
              />
              <StatBox
                icon={Brain}
                value={stats?.averageDifficulty || 0}
                label={t('card.difficulty')}
                color="from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800/30 text-amber-600 dark:text-amber-400"
                hasValidData={stats && reviewCount > 0 && stats.averageDifficulty > 0}
              />
              <StatBox
                icon={Target}
                value={stats?.averageUsefulness || 0}
                label={t('card.usefulness')}
                color="from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800/30 text-green-600 dark:text-green-400"
                hasValidData={stats && reviewCount > 0 && stats.averageUsefulness > 0}
              />
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* 底部區域：開設狀態徽章和學系標籤 */}
        <div className="flex items-center justify-between">
          {/* 左側：開設狀態徽章 */}
          <div className="flex items-center gap-2">
            {/* 開設狀態徽章 */}
            <Badge 
              variant={isOfferedInCurrentTerm ? "default" : "secondary"}
              className={`text-xs font-medium ${
                isOfferedInCurrentTerm 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}
            >
              {isOfferedInCurrentTerm ? t('offered.yes') : t('offered.no')}
            </Badge>
          </div>

          {/* 右側：學系標籤 */}
          <Badge variant="secondary" className="text-xs bg-gray-600 text-white dark:bg-gray-700 dark:text-gray-200">
            {department}
          </Badge>
        </div>

        {/* 左下角：課程質量徽章 */}
        <div className="mt-2">
          <Badge 
            className={`text-xs font-bold ${qualityStyles.badgeClass} cursor-pointer transition-colors duration-200`}
            onClick={(e) => {
              e.stopPropagation();
              navigate('/course-grading-explain');
            }}
          >
            <div className="flex items-center gap-1">
              {quality === 'excellent' && <Crown className="h-3 w-3 text-white flex-shrink-0" />}
              {t(qualityStyles.badgeText)}
            </div>
          </Badge>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}
