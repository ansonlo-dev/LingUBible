import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { 
  sortGradesDescending, 
  calculateGradeStatistics, 
  normalizeGrade, 
  getCompleteGradeDistribution,
  getGPA 
} from '@/utils/gradeUtils';
import { cn } from '@/lib/utils';

interface GradeDistributionChartProps {
  /** 成績分佈數據 */
  gradeDistribution: Record<string, number>;
  /** 是否顯示載入狀態 */
  loading?: boolean;
  /** 圖表高度 */
  height?: number;
  /** 圖表標題 */
  title?: string;
  /** 是否顯示百分比 */
  showPercentage?: boolean;
  /** 最小高度，確保視覺效果 */
  minBarHeight?: number;
  /** 自訂類別名稱 */
  className?: string;
  /** 點擊成績條時的回調函數 */
  onBarClick?: (grade: string) => void;
  /** 圖表上下文，用於確定學生評論的翻譯鍵值 */
  context?: 'course' | 'instructor';
}

const GradeDistributionChart: React.FC<GradeDistributionChartProps> = React.memo(({
  gradeDistribution,
  loading = false,
  height = 120,
  title,
  showPercentage = true,
  minBarHeight = 4,
  className,
  onBarClick,
  context = 'course'
}) => {
  const { t, language } = useLanguage();

  // 使用 useMemo 優化性能，避免重複計算
  const { completeDistribution, sortedGrades, totalCount, maxCount, statistics } = React.useMemo(() => {
    // 獲取完整的成績分佈（包含 0 計數的成績）
    const completeDistribution = getCompleteGradeDistribution(gradeDistribution);
    const sortedGrades = sortGradesDescending(Object.keys(completeDistribution));
    
    // 計算總數
    const totalCount = Object.values(gradeDistribution).reduce((sum, count) => sum + count, 0);
    
    // 計算最大值用於標準化
    const maxCount = Math.max(...Object.values(completeDistribution));
    
    // 計算統計數據
    const statistics = calculateGradeStatistics(gradeDistribution);
    
    return {
      completeDistribution,
      sortedGrades,
      totalCount,
      maxCount,
      statistics
    };
  }, [gradeDistribution]);
  
  // 沒有數據時的顯示
  if (loading) {
    return (
      <div className={cn("p-4 animate-pulse", className)}>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <div className={cn("p-4 text-center text-muted-foreground", className)}>
        <div className="text-sm">{t('chart.noGradeData')}</div>
      </div>
    );
  }

  return (
    <div className={cn("p-3 sm:p-4 w-full", className)}>
      {/* 標題 */}
      {title && (
        <div className="mb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3">
            <h3 className="text-sm font-medium text-foreground truncate">{title}</h3>
            
            {/* 學生評論數 - 顯眼設計 */}
            <div className="flex flex-col items-center sm:items-end shrink-0">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-0.5">
                {context === 'course' ? t('pages.courseDetail.studentReviews') : t('instructors.studentReviews')}
              </span>
              <span className="text-2xl font-bold text-primary">
                {totalCount}
              </span>
            </div>
          </div>
          
          {/* 統計數據 */}
          {statistics.mean !== null && statistics.standardDeviation !== null && (
            <div className="flex flex-col gap-2 text-xs text-muted-foreground">
              {/* 平均GPA - 使用與課程/講師卡片相同的樣式 */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex flex-col items-start sm:items-center">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
                    {t('card.averageGPA')}
                  </span>
                  <span className="text-2xl font-black text-transparent bg-gradient-to-r from-red-600 via-red-500 to-red-400 dark:from-red-500 dark:via-red-400 dark:to-red-300 bg-clip-text drop-shadow-sm">
                    {statistics.mean.toFixed(2)}
                  </span>
                </div>
                
                <div className="flex flex-col items-start sm:items-end">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
                    {t('chart.standardDeviationLabel')}
                  </span>
                  <span className="text-lg font-bold text-muted-foreground">
                    {statistics.standardDeviation.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* 圖表 */}
      <div className="relative w-full pt-16" style={{ height: `${height + 64}px` }}>
        <div className="flex items-end justify-center gap-0.5 sm:gap-1 px-1" style={{ height: `${height}px` }}>
          {sortedGrades.map((grade) => {
            const count = completeDistribution[grade] || 0;
            const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0;
            const barHeight = maxCount > 0 && count > 0 ? Math.max((count / maxCount) * (height - 20), minBarHeight) : 2; // Show minimal bar for 0 counts
            
            return (
              <div
                key={grade}
                className={`flex flex-col items-center group relative flex-1 max-w-[32px] min-w-[20px] sm:min-w-[28px] ${
                  onBarClick && count > 0 ? 'cursor-pointer' : ''
                }`}
                onClick={() => {
                  if (onBarClick && count > 0) {
                    onBarClick(grade);
                  }
                }}
              > 
                {/* 數值標籤 - 手機版優化 */}
                <div 
                  className="absolute text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 bg-white dark:bg-gray-800 px-2 py-1 rounded whitespace-nowrap shadow-lg border border-gray-200 dark:border-gray-600 pointer-events-none"
                  style={{ 
                    top: barHeight > (height * 0.7) ? '-80px' : '-70px',
                    left: '50%',
                    transform: 'translateX(-50%)'
                  }}
                >
                  <div>{t('chart.count')}: {count}</div>
                  <div>{t('chart.percentage')}: {percentage.toFixed(1)}%</div>
                  <div>{t('chart.gradePoint')}: {getGPA(grade)?.toFixed(2) || 'N/A'}</div>
                </div>
                
                {/* 長條圖 */}
                <div
                  className={`rounded-t-sm transition-all duration-300 w-full max-w-6 ${
                    count > 0 
                      ? `bg-gradient-to-t from-primary to-primary/80 ${
                          onBarClick 
                            ? 'hover:from-primary/90 hover:to-primary/70 hover:scale-105 hover:shadow-md' 
                            : 'hover:from-primary/90 hover:to-primary/70'
                        }` 
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                  style={{ height: `${barHeight}px` }}
                />
                
                {/* 成績標籤 - 手機版優化 */}
                <div className="mt-1 text-xs text-muted-foreground font-medium text-center w-full">
                  {grade === 'N/A' ? (
                    <span className="text-[10px] sm:text-xs">
                      N/A
                    </span>
                  ) : (
                    grade
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

export default GradeDistributionChart; 