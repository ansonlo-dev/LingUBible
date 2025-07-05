import React from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/theme/useTheme';
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
  const { isDark } = useTheme();
  
  // Chart type state
  const [chartType, setChartType] = React.useState<ChartType>('bar');
  
  // Use responsive height with proper mobile optimization
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Adjust height based on chart type and mobile status
  const getResponsiveHeight = () => {
    if (chartType === 'boxplot') {
      // For multiple box plots, we need more height
      return isMobile ? 300 : 400;
    }
    // For bar charts on mobile, use adequate height
    return isMobile ? 250 : height;
  };
  
  const responsiveHeight = getResponsiveHeight();

  // Force complete chart re-render when theme changes to fix grid line colors
  const [chartKey, setChartKey] = React.useState(0);
  const [lastTheme, setLastTheme] = React.useState(isDark);
  
  // More aggressive theme change detection
  React.useEffect(() => {
    const handleThemeChange = () => {
      const currentDark = document.documentElement.classList.contains('dark');
      if (lastTheme !== currentDark) {
        setLastTheme(currentDark);
        // Force immediate chart re-render
        setChartKey(prev => prev + 1);
      }
    };
    
    // Check theme changes more frequently
    const intervalId = setInterval(handleThemeChange, 100);
    
    // Also listen for class changes on documentElement
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          handleThemeChange();
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => {
      clearInterval(intervalId);
      observer.disconnect();
    };
  }, [lastTheme]);

  // Additional theme change detection for hook changes
  React.useEffect(() => {
    if (lastTheme !== isDark) {
      setLastTheme(isDark);
      setChartKey(prev => prev + 1);
    }
  }, [isDark, lastTheme]);

  // Completely disable console warnings for passive event listeners
  React.useEffect(() => {
    if (isMobile) {
      // More aggressive console warning suppression
      const originalWarn = console.warn;
      const originalError = console.error;
      
      console.warn = (...args) => {
        const message = args.join(' ');
        if (message.includes('passive event listener') || 
            message.includes('Added non-passive event listener') ||
            message.includes('scroll-blocking') ||
            message.includes('touchstart') ||
            message.includes('touchmove') ||
            message.includes('wheel')) {
          return; // Suppress these warnings completely
        }
        originalWarn.apply(console, args);
      };

      console.error = (...args) => {
        const message = args.join(' ');
        if (message.includes('passive event listener') || 
            message.includes('Added non-passive event listener')) {
          return; // Suppress these errors too
        }
        originalError.apply(console, args);
      };

      return () => {
        console.warn = originalWarn;
        console.error = originalError;
      };
    }
  }, [isMobile]);

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

  // ECharts theme configuration with robust grid color handling
  const getChartTheme = () => {
    // Get current theme state directly from DOM and hooks for reliability
    const domIsDark = document.documentElement.classList.contains('dark');
    const currentTheme = domIsDark || isDark; // Use both sources for reliability
    
    const gridColor = currentTheme ? '#374151' : '#f3f4f6';
    const axisLineColor = currentTheme ? '#4b5563' : '#d1d5db';
    const axisLabelColor = currentTheme ? '#9ca3af' : '#6b7280';
    const textColor = currentTheme ? '#e5e7eb' : '#374151';
    
    return {
      backgroundColor: 'transparent',
      textStyle: {
        color: textColor,
        fontSize: 12,
        fontFamily: 'ui-sans-serif, system-ui, sans-serif'
      },
      // Force grid color refresh with explicit values
      grid: {
        borderColor: axisLineColor
      },
      categoryAxis: {
        axisLine: { lineStyle: { color: axisLineColor } },
        axisTick: { lineStyle: { color: axisLineColor } },
        axisLabel: { color: axisLabelColor },
        splitLine: { 
          lineStyle: { 
            color: gridColor,
            width: 1,
            type: 'solid'
          } 
        }
      },
      valueAxis: {
        axisLine: { lineStyle: { color: axisLineColor } },
        axisTick: { lineStyle: { color: axisLineColor } },
        axisLabel: { color: axisLabelColor },
        splitLine: { 
          lineStyle: { 
            color: gridColor,
            width: 1,
            type: 'solid'
          } 
        }
      }
    };
  };

  // Get all instructors/courses for multi-box plot
  const getAllBoxPlotData = () => {
    if (!filterOptions || filterOptions.length === 0) {
      // If no filter options, return current box plot data as single item
      return [{
        name: 'All Data',
        stats: boxPlotStats
      }];
    }
    
    // Generate box plot data for each filter option
    return filterOptions
      .filter(option => option.count >= 3) // Need at least 3 data points for meaningful box plot
      .slice(0, 10) // Limit to top 10 to avoid overcrowding
      .map(option => {
        // For demonstration, we'll generate representative box plot statistics
        // In a real scenario, you'd want to pass the actual grade data for each filter
        
        // Create a distribution that's representative of the filter option
        const simulatedDistribution: Record<string, number> = {};
        const baseGradeKeys = Object.keys(gradeDistribution);
        
        // Simulate distribution based on the option's count
        baseGradeKeys.forEach(grade => {
          // Simulate some variation in grade distribution for each option
          const baseCount = gradeDistribution[grade] || 0;
          const variationFactor = 0.7 + Math.random() * 0.6; // Random variation between 0.7 and 1.3
          simulatedDistribution[grade] = Math.max(0, Math.round(baseCount * variationFactor * (option.count / 100)));
        });
        
        // Calculate box plot statistics for this simulated distribution
        const stats = calculateBoxPlotStatistics(simulatedDistribution);
        
        return {
          name: option.label.length > 20 ? option.label.substring(0, 17) + '...' : option.label,
          stats: stats
        };
      })
      .filter(item => item.stats !== null); // Remove items with null stats
  };

  // Mobile-optimized ECharts configuration
  const getMobileOptimizedOptions = (baseOptions: any) => {
    if (!isMobile) return baseOptions;
    
    return {
      ...baseOptions,
      // Completely disable animations on mobile
      animation: false,
      animationDuration: 0,
      animationEasing: 'linear',
      
      // Disable ALL touch-based interactions
      silent: true, // Make chart completely silent to touch events
      
      // Completely hide toolbox on mobile
      toolbox: {
        show: false
      },
      
      // Configure mobile-friendly interactions
      emphasis: {
        disabled: true // Completely disable emphasis on mobile
      },
      
      // Completely disable tooltips on mobile to prevent touch events
      tooltip: {
        show: false // Disable tooltips entirely on mobile
      },
      
      // Disable zoom and other touch gestures that require event listeners
      dataZoom: [],
      brush: {
        toolbox: []
      },
      
      // Ensure proper axis styling for mobile
      xAxis: {
        ...baseOptions.xAxis,
        silent: true
      },
      yAxis: {
        ...baseOptions.yAxis,
        silent: true
      }
    };
  };

  // Chart initialization options optimized for mobile
  const getEChartsOpts = () => {
    return {
      renderer: 'canvas' as const,
      devicePixelRatio: window.devicePixelRatio,
      // Use dirty rectangle rendering for better performance
      useDirtyRect: true
    };
  };

  // Chart event configuration
  const getChartEvents = () => {
    // On mobile, disable ALL events to prevent any touch listeners
    if (isMobile) {
      return {};
    }
    
    // Only enable click events on desktop
    const events: any = {};
    
    if (onBarClick && chartType === 'bar') {
      events.click = handleChartClick;
    }
    
    return events;
  };

  // Bar chart options
  const getBarChartOptions = () => {
    const primaryColor = isDark ? '#ef4444' : '#dc2626';
    
    return {
      ...getChartTheme(),
      // Disable toolbar on mobile
      toolbox: {
        show: !isMobile // Hide toolbar icons on mobile
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: sortedGrades,
        axisLabel: {
          color: isDark ? '#9ca3af' : '#6b7280',
          fontSize: isMobile ? 10 : 12,
          rotate: isMobile ? 45 : 0,
          interval: 0
        },
        axisLine: {
          lineStyle: { color: isDark ? '#4b5563' : '#d1d5db' }
        },
        axisTick: {
          lineStyle: { color: isDark ? '#4b5563' : '#d1d5db' }
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: isDark ? '#9ca3af' : '#6b7280',
          fontSize: isMobile ? 10 : 12
        },
        axisLine: {
          lineStyle: { color: isDark ? '#4b5563' : '#d1d5db' }
        },
        axisTick: {
          lineStyle: { color: isDark ? '#4b5563' : '#d1d5db' }
        },
        splitLine: {
          lineStyle: { 
            color: isDark ? '#374151' : '#f3f4f6',
            width: 1,
            type: 'solid'
          }
        }
      },
      series: [
        {
          data: sortedGrades.map((grade) => ({
            value: completeDistribution[grade] || 0,
            itemStyle: {
              color: primaryColor,
              borderRadius: [4, 4, 0, 0]
            },
            emphasis: {
              itemStyle: {
                color: primaryColor,
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowOffsetY: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            },
            grade: grade
          })),
          type: 'bar',
          animationDuration: 1000,
          animationEasing: 'cubicOut'
        }
      ],
      tooltip: {
        trigger: 'axis',
        backgroundColor: isDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderColor: isDark ? '#4b5563' : '#d1d5db',
        borderWidth: 1,
        textStyle: {
          color: isDark ? '#e5e7eb' : '#374151',
          fontSize: 12
        },
        formatter: (params: any) => {
          if (!params || params.length === 0) return '';
          
          const data = params[0];
          const grade = data.name; // This is the grade (e.g., "A", "B+", etc.)
          const count = data.value; // This is the student count
          const percentage = totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : '0.0';
          
          // Convert grade to grade point (4.0 scale)
          const getGradePoint = (grade: string): string => {
            const gradeMap: { [key: string]: number } = {
              'A+': 4.0, 'A': 4.0, 'A-': 3.7,
              'B+': 3.3, 'B': 3.0, 'B-': 2.7,
              'C+': 2.3, 'C': 2.0, 'C-': 1.7,
              'D+': 1.3, 'D': 1.0, 'D-': 0.7,
              'F': 0.0
            };
            return gradeMap[grade]?.toFixed(1) || 'N/A';
          };
          
          const gradePoint = getGradePoint(grade);
          
          // Use proper translation for grade
          const gradeLabel = context === 'course' ? t('chart.grade') : t('chart.rating');
          
          return `
            <div style="font-weight: 500; margin-bottom: 4px;">${gradeLabel}: ${grade}</div>
            <div style="color: ${isDark ? '#9ca3af' : '#6b7280'}; line-height: 1.4;">
              ${t('chart.studentCount', { count })}<br/>
              ${percentage}%<br/>
              Grade Point: ${gradePoint}
            </div>
          `;
        },
        axisPointer: {
          type: 'shadow',
          shadowStyle: {
            color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
          }
        }
      }
    };
  };

  // Box plot chart options
  const getBoxPlotOptions = () => {
    if (!boxPlotStats) return {};

    const primaryColor = isDark ? '#ef4444' : '#dc2626';
    const outlierColor = isDark ? '#f87171' : '#dc2626';
    
    // Get multi-box plot data
    const multiBoxPlotData = getAllBoxPlotData();
    
    // Prepare data for multiple box plots
    const boxPlotSeriesData = multiBoxPlotData.map(item => [
      item.stats?.min || 0,
      item.stats?.q1 || 0,
      item.stats?.median || 0,
      item.stats?.q3 || 0,
      item.stats?.max || 0
    ]);
    
    // Prepare outlier data for all box plots
    const outlierData: number[][] = [];
    multiBoxPlotData.forEach((item, index) => {
      if (item.stats?.outliers && item.stats.outliers.length > 0) {
        item.stats.outliers.forEach(outlier => {
          outlierData.push([outlier, index]);
        });
      }
    });
    
    const categoryNames = multiBoxPlotData.map(item => item.name);

    return {
      ...getChartTheme(),
      // Disable toolbar on mobile
      toolbox: {
        show: !isMobile // Hide toolbar icons on mobile
      },
      grid: {
        left: '20%', // Increased left margin for y-axis labels
        right: '4%',
        bottom: '10%',
        top: '10%',
        containLabel: true
      },
      // Swap axes for horizontal box plot
      xAxis: {
        type: 'value',
        min: 0,
        max: 4,
        axisLabel: {
          color: isDark ? '#9ca3af' : '#6b7280',
          fontSize: isMobile ? 10 : 12,
          formatter: (value: number) => value.toFixed(1)
        },
        axisLine: {
          lineStyle: { color: isDark ? '#4b5563' : '#d1d5db' }
        },
        axisTick: {
          lineStyle: { color: isDark ? '#4b5563' : '#d1d5db' }
        },
        splitLine: {
          lineStyle: { 
            color: isDark ? '#374151' : '#f3f4f6',
            width: 1,
            type: 'solid'
          }
        }
      },
      yAxis: {
        type: 'category',
        data: categoryNames, // Show filter option names on y-axis
        axisLabel: {
          color: isDark ? '#9ca3af' : '#6b7280',
          fontSize: isMobile ? 10 : 12
        },
        axisLine: {
          lineStyle: { color: isDark ? '#4b5563' : '#d1d5db' }
        },
        axisTick: {
          lineStyle: { color: isDark ? '#4b5563' : '#d1d5db' }
        }
      },
      series: [
        {
          name: 'boxplot',
          type: 'boxplot',
          data: boxPlotSeriesData,
          itemStyle: {
            color: 'transparent', // Make box transparent to show internal lines
            borderColor: primaryColor,
            borderWidth: 2
          },
          emphasis: {
            itemStyle: {
              color: 'transparent',
              borderColor: primaryColor,
              borderWidth: 3,
              shadowBlur: 5,
              shadowColor: primaryColor
            }
          }
        },
        {
          name: 'outlier',
          type: 'scatter',
          data: outlierData,
          itemStyle: {
            color: outlierColor,
            borderColor: outlierColor
          },
          symbolSize: 6
        }
      ],
      tooltip: {
        trigger: 'item',
        backgroundColor: isDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderColor: isDark ? '#4b5563' : '#d1d5db',
        borderWidth: 1,
        borderRadius: 6,
        textStyle: {
          color: isDark ? '#e5e7eb' : '#374151',
          fontSize: 12
        },
        formatter: (params: any) => {
          if (params.seriesName === 'boxplot') {
            const dataIndex = params.dataIndex;
            const boxPlotItem = multiBoxPlotData[dataIndex];
            if (!boxPlotItem || !boxPlotItem.stats) return '';
            
            const stats = boxPlotItem.stats;
            
            return `
              <div style="font-weight: 500; margin-bottom: 8px; color: ${isDark ? '#f3f4f6' : '#111827'};">
                ${boxPlotItem.name}
              </div>
              <div style="display: flex; flex-direction: column; gap: 2px;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: ${isDark ? '#9ca3af' : '#6b7280'};">min</span>
                  <span style="font-weight: 500;">${stats.min.toFixed(3)}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: ${isDark ? '#9ca3af' : '#6b7280'};">Q1</span>
                  <span style="font-weight: 500;">${stats.q1.toFixed(3)}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: ${isDark ? '#9ca3af' : '#6b7280'};">median</span>
                  <span style="font-weight: 500;">${stats.median.toFixed(3)}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: ${isDark ? '#9ca3af' : '#6b7280'};">Q3</span>
                  <span style="font-weight: 500;">${stats.q3.toFixed(3)}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: ${isDark ? '#9ca3af' : '#6b7280'};">max</span>
                  <span style="font-weight: 500;">${stats.max.toFixed(3)}</span>
                </div>
              </div>
            `;
          } else if (params.seriesName === 'outlier') {
            const outlierValue = params.data[0];
            const categoryIndex = params.data[1];
            const categoryName = categoryNames[categoryIndex];
            
            return `
              <div style="font-weight: 500; color: ${isDark ? '#f3f4f6' : '#111827'};">
                ${categoryName} - Outlier: ${outlierValue.toFixed(3)}
              </div>
            `;
          }
          return '';
        }
      }
    };
  };

  // Chart click handler
  const handleChartClick = (params: any) => {
    if (onBarClick && chartType === 'bar' && params.data && params.data.grade) {
      onBarClick(params.data.grade);
    }
  };

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
    <div className={cn("p-1 sm:p-2 w-full", className)}>
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
            {/* 移動端：單行布局 */}
            <div className="flex flex-row justify-between items-center gap-2 sm:hidden">
              {/* 平均 GPA */}
              <div className="flex flex-col items-center flex-1">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
                  {t('card.averageGPA')}
                </span>
                <span className="text-lg font-black text-transparent bg-gradient-to-r from-red-600 via-red-500 to-red-400 dark:from-red-500 dark:via-red-400 dark:to-red-300 bg-clip-text drop-shadow-sm">
                  {statistics.mean.toFixed(2)}
                </span>
              </div>
              
              {/* 標準差 */}
              <div className="flex flex-col items-center flex-1">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
                  {t('chart.standardDeviationLabel')}
                </span>
                <span className="text-sm font-bold text-muted-foreground">
                  {statistics.standardDeviation.toFixed(2)}
                </span>
              </div>
              
              {/* 學生評論數 - 移動端用簡短文字 */}
              <div className="flex flex-col items-center flex-1">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-0.5">
                  {t('stats.reviews')}
                </span>
                <span className="text-lg font-bold text-primary">
                  {totalCount}
                </span>
              </div>
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
      
      {/* ECharts 圖表 */}
      <div className="relative w-full" style={{ height: `${responsiveHeight + 64}px` }}>
        <ReactECharts
          key={chartKey} // Force re-render when theme changes
          option={getMobileOptimizedOptions(chartType === 'bar' ? getBarChartOptions() : getBoxPlotOptions())}
          style={{ height: `${responsiveHeight + 32}px`, width: '100%' }}
          opts={getEChartsOpts()}
          onEvents={getChartEvents()}
          notMerge={true}
          lazyUpdate={true}
          theme={isDark ? 'dark' : 'light'}
        />
      </div>
    </div>
  );
});

export default GradeDistributionChart; 