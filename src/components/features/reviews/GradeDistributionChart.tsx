import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { 
  sortGradesDescending, 
  calculateGradeStatistics, 
  normalizeGrade, 
  getCompleteGradeDistribution 
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
}

const GradeDistributionChart: React.FC<GradeDistributionChartProps> = React.memo(({
  gradeDistribution,
  loading = false,
  height = 120,
  title,
  showPercentage = true,
  minBarHeight = 4,
  className
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 mb-2">
            <h3 className="text-sm font-medium text-foreground truncate">{title}</h3>
            <span className="text-xs text-muted-foreground shrink-0">
              {t('chart.totalStudents', { count: totalCount })}
            </span>
          </div>
          
          {/* 統計數據 */}
          {statistics.mean !== null && statistics.standardDeviation !== null && (
            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <span className="truncate">{t('chart.meanGPA', { mean: statistics.mean.toFixed(2) })}</span>
                <span className="truncate">{t('chart.standardDeviation', { std: statistics.standardDeviation.toFixed(2) })}</span>
              </div>

            </div>
          )}
        </div>
      )}
      
      {/* 圖表 */}
      <div className="relative w-full overflow-hidden" style={{ height: `${height}px` }}>
        <div className="flex items-end justify-center h-full gap-0.5 sm:gap-1 px-1">
          {sortedGrades.map((grade) => {
            const count = completeDistribution[grade] || 0;
            const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0;
            const barHeight = maxCount > 0 && count > 0 ? Math.max((count / maxCount) * (height - 20), minBarHeight) : 2; // Show minimal bar for 0 counts
            
            return (
              <div
                key={grade}
                className="flex flex-col items-center group relative flex-1 max-w-[32px] min-w-[20px] sm:min-w-[28px]"
              > 
                {/* 數值標籤 - 手機版優化 */}
                {count > 0 && (
                  <div className="absolute -top-5 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 bg-background px-1 rounded whitespace-nowrap">
                    {count}
                    {showPercentage && totalCount > 0 && (
                      <span className="text-xs text-muted-foreground/70 ml-1">
                        ({percentage.toFixed(1)}%)
                      </span>
                    )}
                  </div>
                )}
                
                {/* 長條圖 */}
                <div
                  className={`rounded-t-sm transition-all duration-300 w-full max-w-6 ${
                    count > 0 
                      ? 'bg-gradient-to-t from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70' 
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                  style={{ height: `${barHeight}px` }}
                  title={`${grade === 'N/A' ? t('review.notApplicable') : grade}: ${count} ${t('common.students')} (${percentage.toFixed(1)}%)`}
                />
                
                {/* 成績標籤 - 手機版優化 */}
                <div className="mt-1 text-xs text-muted-foreground font-medium text-center w-full truncate">
                  {grade === 'N/A' ? (
                    <span className="text-[10px] sm:text-xs">
                      {t('review.notApplicable')}
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