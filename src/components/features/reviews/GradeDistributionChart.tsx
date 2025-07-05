import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { 
  sortGradesDescending, 
  calculateGradeStatistics, 
  calculateBoxPlotStatistics,
  normalizeGrade, 
  getCompleteGradeDistribution,
  getGPA,
  BoxPlotStatistics 
} from '@/utils/gradeUtils';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, BoxSelect } from 'lucide-react';

// Chart type enum
type ChartType = 'bar' | 'boxplot';

// New interface for filter options
interface FilterOption {
  value: string;
  label: string;
  count: number;
}

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
  /** 篩選選項 - 用於下拉選單 */
  filterOptions?: FilterOption[];
  /** 當前選中的篩選值 */
  selectedFilter?: string;
  /** 篩選變更回調函數 */
  onFilterChange?: (value: string) => void;
  /** 篩選標籤（例如 "按課程篩選" 或 "按講師篩選"） */
  filterLabel?: string;
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
  context = 'course',
  filterOptions,
  selectedFilter,
  onFilterChange,
  filterLabel
}) => {
  const { t, language } = useLanguage();
  
  // Chart type state
  const [chartType, setChartType] = React.useState<ChartType>('bar');
  
  // Use responsive height
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const responsiveHeight = isMobile ? 90 : height;

  // 使用 useMemo 優化性能，避免重複計算
  const { completeDistribution, sortedGrades, totalCount, maxCount, statistics, boxPlotStats } = React.useMemo(() => {
    // 獲取完整的成績分佈（包含 0 計數的成績）
    const completeDistribution = getCompleteGradeDistribution(gradeDistribution);
    const sortedGrades = sortGradesDescending(Object.keys(completeDistribution));
    
    // 計算總數
    const totalCount = Object.values(gradeDistribution).reduce((sum, count) => sum + count, 0);
    
    // 計算最大值用於標準化
    const maxCount = Math.max(...Object.values(completeDistribution));
    
    // 計算統計數據
    const statistics = calculateGradeStatistics(gradeDistribution);
    
    // 計算箱線圖統計數據
    const boxPlotStats = calculateBoxPlotStatistics(gradeDistribution);
    
    return {
      completeDistribution,
      sortedGrades,
      totalCount,
      maxCount,
      statistics,
      boxPlotStats
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
    <div className={cn("p-2 sm:p-4 w-full", className)}>
      {/* 標題、篩選器和圖表類型選擇 */}
      <div className="mb-2">
        <div className="flex flex-col gap-2 mb-2">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
            <div className="flex flex-col gap-2">
              {title && (
                <h3 className="text-sm font-medium text-foreground truncate">{title}</h3>
              )}
              
              {/* 圖表類型切換按鈕 */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-full sm:w-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-7 px-2 text-xs gap-1 flex-1 sm:flex-none",
                    chartType === 'bar' 
                      ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100" 
                      : "bg-transparent hover:bg-white/50 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-400"
                  )}
                  onClick={() => setChartType('bar')}
                >
                  <BarChart3 className="h-3 w-3" />
                  {t('chart.barChart')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-7 px-2 text-xs gap-1 flex-1 sm:flex-none",
                    chartType === 'boxplot' 
                      ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100" 
                      : "bg-transparent hover:bg-white/50 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-400"
                  )}
                  onClick={() => setChartType('boxplot')}
                >
                  <BoxSelect className="h-3 w-3" />
                  {t('chart.boxPlot')}
                </Button>
              </div>
            </div>
            
            {/* 篩選器下拉選單 */}
            {filterOptions && filterOptions.length > 0 && onFilterChange && (
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto min-w-0">
                {filterLabel && (
                  <span className="text-sm text-muted-foreground whitespace-nowrap">{filterLabel}:</span>
                )}
                <Select value={selectedFilter || 'all'} onValueChange={onFilterChange}>
                  <SelectTrigger className="w-full sm:max-w-[280px] md:max-w-[320px] h-8 min-w-0">
                    <SelectValue placeholder={t('common.all')} />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-900 w-full max-w-[90vw] sm:max-w-[400px]">
                    <SelectItem value="all">{t('common.all')}</SelectItem>
                    {filterOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="pr-12">
                        <div className="flex items-center justify-between w-full min-w-0">
                          <span className="truncate flex-1 mr-2 min-w-0">{option.label}</span>
                          <Badge variant="secondary" className="ml-auto text-xs bg-primary/10 text-primary hover:bg-primary/10 dark:bg-primary/20 dark:text-primary-foreground dark:hover:bg-primary/20 shrink-0">
                            {option.count}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
        
        {/* 統計數據 - 重新組織 GPA 和標準差在同一側 */}
        {statistics.mean !== null && statistics.standardDeviation !== null && (
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-2">
            {/* 移動端：2x2 緊湊網格布局 */}
            <div className="grid grid-cols-2 gap-2 sm:hidden">
              {/* 位置 1: 平均 GPA */}
              <div className="flex flex-col items-center">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
                  {t('card.averageGPA')}
                </span>
                <span className="text-xl font-black text-transparent bg-gradient-to-r from-red-600 via-red-500 to-red-400 dark:from-red-500 dark:via-red-400 dark:to-red-300 bg-clip-text drop-shadow-sm">
                  {statistics.mean.toFixed(2)}
                </span>
              </div>
              
              {/* 位置 2: 學生評論數 */}
              <div className="flex flex-col items-center">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-0.5">
                  {context === 'course' ? t('pages.courseDetail.studentReviews') : t('instructors.studentReviews')}
                </span>
                <span className="text-xl font-bold text-primary">
                  {totalCount}
                </span>
              </div>
              
              {/* 位置 3: 標準差 */}
              <div className="flex flex-col items-center">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
                  {t('chart.standardDeviationLabel')}
                </span>
                <span className="text-lg font-bold text-muted-foreground">
                  {statistics.standardDeviation.toFixed(2)}
                </span>
              </div>
              
              {/* 位置 4: 空白 */}
              <div></div>
            </div>
            
            {/* 桌面端：原有布局 */}
            <div className="hidden sm:flex flex-col sm:flex-row gap-4 sm:gap-6">
              <div className="flex flex-col items-start">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
                  {t('card.averageGPA')}
                </span>
                <span className="text-2xl font-black text-transparent bg-gradient-to-r from-red-600 via-red-500 to-red-400 dark:from-red-500 dark:via-red-400 dark:to-red-300 bg-clip-text drop-shadow-sm">
                  {statistics.mean.toFixed(2)}
                </span>
              </div>
              
              <div className="flex flex-col items-start">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
                  {t('chart.standardDeviationLabel')}
                </span>
                <span className="text-lg font-bold text-muted-foreground">
                  {statistics.standardDeviation.toFixed(2)}
                </span>
              </div>
            </div>
            
            {/* 桌面端：學生評論數 */}
            <div className="hidden sm:flex flex-col items-center sm:items-end shrink-0">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-0.5">
                {context === 'course' ? t('pages.courseDetail.studentReviews') : t('instructors.studentReviews')}
              </span>
              <span className="text-2xl font-bold text-primary">
                {totalCount}
              </span>
            </div>
            

          </div>
        )}
      </div>
      
      {/* 圖表 */}
      <div className="relative w-full pt-12 sm:pt-16" style={{ height: `${responsiveHeight + 48}px` }}>
        {chartType === 'bar' ? (
          // 柱狀圖
          <div className="flex items-end justify-center gap-0.5 sm:gap-1 px-1" style={{ height: `${responsiveHeight}px` }}>
            {sortedGrades.map((grade, index) => {
              const count = completeDistribution[grade] || 0;
              const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0;
                              const barHeight = maxCount > 0 && count > 0 ? Math.max((count / maxCount) * (responsiveHeight - 20), minBarHeight) : 2; // Show minimal bar for 0 counts
              
              // Smart tooltip positioning based on bar position
              const isFirstBar = index === 0;
              const isLastBar = index === sortedGrades.length - 1;
              const isSecondBar = index === 1;
              const isSecondLastBar = index === sortedGrades.length - 2;
              
              // Determine tooltip positioning
              let tooltipStyle: React.CSSProperties;
              if (isFirstBar) {
                // Left-align for first bar
                tooltipStyle = {
                  top: barHeight > (responsiveHeight * 0.7) ? '-80px' : '-70px',
                  left: '0',
                  transform: 'translateX(0)'
                };
              } else if (isLastBar) {
                // Right-align for last bar
                tooltipStyle = {
                  top: barHeight > (responsiveHeight * 0.7) ? '-80px' : '-70px',
                  right: '0',
                  transform: 'translateX(0)'
                };
              } else if (isSecondBar) {
                // Slightly left-aligned for second bar
                tooltipStyle = {
                  top: barHeight > (responsiveHeight * 0.7) ? '-80px' : '-70px',
                  left: '25%',
                  transform: 'translateX(-25%)'
                };
              } else if (isSecondLastBar) {
                // Slightly right-aligned for second last bar
                tooltipStyle = {
                  top: barHeight > (responsiveHeight * 0.7) ? '-80px' : '-70px',
                  left: '75%',
                  transform: 'translateX(-75%)'
                };
              } else {
                // Center-align for middle bars
                tooltipStyle = {
                  top: barHeight > (responsiveHeight * 0.7) ? '-80px' : '-70px',
                  left: '50%',
                  transform: 'translateX(-50%)'
                };
              }
              
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
                  {/* 數值標籤 - 智能定位優化 */}
                  <div 
                    className="absolute text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 bg-white dark:bg-gray-800 px-2 py-1 rounded whitespace-nowrap shadow-lg border border-gray-200 dark:border-gray-600 pointer-events-none"
                    style={tooltipStyle}
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
        ) : (
          // 箱線圖（水平方向）
          <div className="flex flex-col items-center justify-center px-1" style={{ height: `${responsiveHeight}px` }}>
            {boxPlotStats ? (
              <div className="relative w-full">
                {/* 箱線圖主體 */}
                <div className="relative h-24 mb-4 group">
                  <svg viewBox="0 0 100 50" className="w-full h-full" preserveAspectRatio="none">
                    {/* 計算位置 (水平方向，使用全寬度) */}
                    {(() => {
                      // 使用數據的實際範圍來填滿整個寬度
                      const dataMin = Math.max(0, boxPlotStats.min);
                      const dataMax = Math.min(4.0, boxPlotStats.max);
                      const dataRange = dataMax - dataMin;
                      
                      // 如果數據範圍太小，則使用固定的0-4範圍
                      const useFullRange = dataRange < 2.0;
                      
                      const scaleX = useFullRange 
                        ? (value: number) => (value / 4.0) * 100
                        : (value: number) => ((value - dataMin) / dataRange) * 100;
                      
                      const minX = useFullRange ? scaleX(dataMin) : 0;
                      const q1X = useFullRange ? scaleX(Math.max(0, boxPlotStats.q1)) : scaleX(boxPlotStats.q1);
                      const medianX = useFullRange ? scaleX(Math.max(0, boxPlotStats.median)) : scaleX(boxPlotStats.median);
                      const q3X = useFullRange ? scaleX(Math.min(4.0, boxPlotStats.q3)) : scaleX(boxPlotStats.q3);
                      const maxX = useFullRange ? scaleX(dataMax) : 100;
                      
                      return (
                        <g>
                          {/* X軸線 - 完整寬度 */}
                          <line x1="0" y1="40" x2="100" y2="40" stroke="currentColor" strokeWidth="1" className="text-gray-300 dark:text-gray-600" />
                          
                          {/* X軸刻度線 */}
                          <line x1="0" y1="38" x2="0" y2="42" stroke="currentColor" strokeWidth="1" className="text-gray-300 dark:text-gray-600" />
                          <line x1="25" y1="38" x2="25" y2="42" stroke="currentColor" strokeWidth="1" className="text-gray-300 dark:text-gray-600" />
                          <line x1="50" y1="38" x2="50" y2="42" stroke="currentColor" strokeWidth="1" className="text-gray-300 dark:text-gray-600" />
                          <line x1="75" y1="38" x2="75" y2="42" stroke="currentColor" strokeWidth="1" className="text-gray-300 dark:text-gray-600" />
                          <line x1="100" y1="38" x2="100" y2="42" stroke="currentColor" strokeWidth="1" className="text-gray-300 dark:text-gray-600" />
                          
                          {/* 水平線 (whiskers) */}
                          <line x1={minX} y1="25" x2={q1X} y2="25" stroke="currentColor" strokeWidth="2" className="text-primary" />
                          <line x1={q3X} y1="25" x2={maxX} y2="25" stroke="currentColor" strokeWidth="2" className="text-primary" />
                          
                          {/* 最小值線 */}
                          <g>
                            <line x1={minX} y1="20" x2={minX} y2="30" stroke="currentColor" strokeWidth="2" className="text-primary" />
                          </g>
                          
                          {/* 最大值線 */}
                          <g>
                            <line x1={maxX} y1="20" x2={maxX} y2="30" stroke="currentColor" strokeWidth="2" className="text-primary" />
                          </g>
                          
                          {/* 箱子 (Q1到Q3) */}
                          <rect
                            x={q1X}
                            y="15"
                            width={q3X - q1X}
                            height="20"
                            fill="currentColor"
                            fillOpacity="0.2"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-primary"
                          />
                          
                          {/* Q1 線 */}
                          <line x1={q1X} y1="15" x2={q1X} y2="35" stroke="currentColor" strokeWidth="1" className="text-primary/50" />
                          
                          {/* 中位數線 */}
                          <line x1={medianX} y1="15" x2={medianX} y2="35" stroke="currentColor" strokeWidth="3" className="text-primary" />
                          
                          {/* Q3 線 */}
                          <line x1={q3X} y1="15" x2={q3X} y2="35" stroke="currentColor" strokeWidth="1" className="text-primary/50" />
                          
                          {/* 離群值 */}
                          {boxPlotStats.outliers.map((outlier, index) => {
                            const clampedOutlier = Math.max(0, Math.min(4.0, outlier));
                            const outlierX = useFullRange ? scaleX(clampedOutlier) : scaleX(outlier);
                            return (
                              <circle
                                key={index}
                                cx={outlierX}
                                cy="25"
                                r="3"
                                fill="currentColor"
                                stroke="currentColor"
                                strokeWidth="1"
                                className="text-red-500"
                              />
                            );
                          })}
                        </g>
                      );
                    })()}
                  </svg>
                  
                  {/* 自定義 hover tooltips */}
                  {(() => {
                    // 使用和SVG相同的縮放邏輯
                    const dataMin = Math.max(0, boxPlotStats.min);
                    const dataMax = Math.min(4.0, boxPlotStats.max);
                    const dataRange = dataMax - dataMin;
                    const useFullRange = dataRange < 2.0;
                    
                    const scaleX = useFullRange 
                      ? (value: number) => (value / 4.0) * 100
                      : (value: number) => ((value - dataMin) / dataRange) * 100;
                    
                    const minX = useFullRange ? scaleX(dataMin) : 0;
                    const q1X = useFullRange ? scaleX(Math.max(0, boxPlotStats.q1)) : scaleX(boxPlotStats.q1);
                    const medianX = useFullRange ? scaleX(Math.max(0, boxPlotStats.median)) : scaleX(boxPlotStats.median);
                    const q3X = useFullRange ? scaleX(Math.min(4.0, boxPlotStats.q3)) : scaleX(boxPlotStats.q3);
                    const maxX = useFullRange ? scaleX(dataMax) : 100;
                    
                    return (
                      <>
                        {/* 全圖通用 tooltip - 顯示統計資訊 */}
                        <div 
                          className="absolute text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 bg-white dark:bg-gray-800 px-2 py-1 rounded whitespace-nowrap shadow-lg border border-gray-200 dark:border-gray-600 pointer-events-none"
                          style={{ 
                            top: '-80px',
                            left: '50%',
                            transform: 'translateX(-50%)'
                          }}
                        >
                          <div>{t('chart.min')}: {boxPlotStats.min.toFixed(2)}</div>
                          <div>{t('chart.q1')}: {boxPlotStats.q1.toFixed(2)}</div>
                          <div>{t('chart.median')}: {boxPlotStats.median.toFixed(2)}</div>
                          <div>{t('chart.q3')}: {boxPlotStats.q3.toFixed(2)}</div>
                          <div>{t('chart.max')}: {boxPlotStats.max.toFixed(2)}</div>
                          {boxPlotStats.outliers.length > 0 && (
                            <div>{t('chart.outliers')}: {boxPlotStats.outliers.map(o => o.toFixed(2)).join(', ')}</div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
                
                {/* X軸標籤 (動態或固定 0-4.0 刻度) */}
                {(() => {
                  const dataMin = Math.max(0, boxPlotStats.min);
                  const dataMax = Math.min(4.0, boxPlotStats.max);
                  const dataRange = dataMax - dataMin;
                  const useFullRange = dataRange < 2.0;
                  
                  if (useFullRange) {
                    return (
                      <div className="flex justify-between text-xs text-muted-foreground w-full">
                        <span>0.0</span>
                        <span>1.0</span>
                        <span>2.0</span>
                        <span>3.0</span>
                        <span>4.0</span>
                      </div>
                    );
                  } else {
                    // 動態標籤：顯示實際數據範圍
                    const step = dataRange / 4;
                    return (
                      <div className="flex justify-between text-xs text-muted-foreground w-full">
                        <span>{dataMin.toFixed(1)}</span>
                        <span>{(dataMin + step).toFixed(1)}</span>
                        <span>{(dataMin + step * 2).toFixed(1)}</span>
                        <span>{(dataMin + step * 3).toFixed(1)}</span>
                        <span>{dataMax.toFixed(1)}</span>
                      </div>
                    );
                  }
                })()}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <span className="text-sm">{t('chart.noDataAvailable')}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default GradeDistributionChart; 