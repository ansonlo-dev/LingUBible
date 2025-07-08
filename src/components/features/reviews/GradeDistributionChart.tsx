import React from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import type { ECharts } from 'echarts';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/theme/useTheme';
import { 
  sortGradesDescending, 
  calculateGradeStatistics, 
  calculateBoxPlotStatistics,
  normalizeGrade, 
  getCompleteGradeDistribution,
  getGPA,
  BoxPlotStatistics,
  calculateGradeDistributionFromReviews
} from '@/utils/gradeUtils';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { MultiSelectDropdown, SelectOption } from '@/components/ui/multi-select-dropdown';
import { BarChart3, BoxSelect, BarChart, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';

// Chart type enum
type ChartType = 'bar' | 'stacked' | 'boxplot';

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
  /** 當前選中的篩選值 - 支援多選 */
  selectedFilter?: string | string[];
  /** 篩選變更回調函數 - 支援多選 */
  onFilterChange?: (value: string | string[]) => void;
  /** 篩選標籤（例如 "按課程篩選" 或 "按講師篩選"） */
  filterLabel?: string;
  /** 原始評論數據 - 用於計算真實的成績分佈 */
  rawReviewData?: Array<{ 
    review: { 
      course_final_grade?: string | null; 
      instructor_details: string; 
    }; 
  }>;
  /** 是否預設展開（可選，預設為 true） */
  defaultExpanded?: boolean;
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
  filterLabel,
  rawReviewData,
  defaultExpanded = false
}) => {
  const { t, language } = useLanguage();
  const { isDark } = useTheme();
  
  // Chart type state
  const [chartType, setChartType] = React.useState<ChartType>('bar');
  
  // Expand/collapse state
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
  
  // Remove the restriction that clears filters for stacked and box plot charts
  // This allows users to select specific items in dropdown for all chart types
  
  // Use responsive height with proper mobile optimization
  const [isMobile, setIsMobile] = React.useState(false);
  const [isPortrait, setIsPortrait] = React.useState(false);
  
  // Helper function to shorten English instructor names on mobile portrait
  const shortenInstructorName = (name: string): string => {
    // Only use shortform if English language, mobile, and portrait mode
    if (!isMobile || !isPortrait || language !== 'en' || !name) return name;
    
    // Check if name is in English format (contains English letters and possibly title)
    const englishRegex = /^(Mr\.|Ms\.|Mrs\.|Dr\.|Prof\.)\s+([A-Za-z\s]+)$/;
    const match = name.match(englishRegex);
    
    if (match) {
      const title = match[1]; // Mr., Ms., etc.
      const fullName = match[2].trim(); // Full name part
      
      // Split the name into parts
      const nameParts = fullName.split(/\s+/);
      
      if (nameParts.length >= 2) {
        // Take first letter of first name and first letter of last name
        const initials = nameParts.map(part => part.charAt(0).toUpperCase()).join('');
        return `${title} ${initials}`;
      }
    }
    
    return name; // Return original if not English format or cannot parse
  };
  
  // Debounced resize handler to prevent flickering
  React.useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;
    
    const checkMobile = () => {
      // Better mobile detection that accounts for landscape mode
      // Check for touch capability and smaller screen dimensions
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = Math.min(window.innerWidth, window.innerHeight) < 640;
      const newIsMobile = isTouchDevice && (window.innerWidth < 1024 || isSmallScreen);
      const newIsPortrait = window.innerHeight > window.innerWidth;
      
      setIsMobile(newIsMobile);
      setIsPortrait(newIsPortrait);
    };
    
    const debouncedCheckMobile = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(checkMobile, 300); // Wait 300ms after resize ends
    };
    
    // Initial check
    checkMobile();
    
    window.addEventListener('resize', debouncedCheckMobile);
    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', debouncedCheckMobile);
    };
  }, []);
  
  // Add passive event listeners support for mobile
  React.useEffect(() => {
    if (!isMobile) return;
    
    // Override addEventListener to make wheel/touch events passive
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    
    EventTarget.prototype.addEventListener = function(type: string, listener: any, options: any) {
      let modifiedOptions = options;
      
      // Make wheel, mousewheel, touchstart, and touchmove events passive by default
      if (['wheel', 'mousewheel', 'touchstart', 'touchmove'].includes(type)) {
        if (typeof options === 'object') {
          modifiedOptions = { ...options, passive: true };
        } else if (options === true || options === false) {
          modifiedOptions = { capture: options, passive: true };
        } else {
          modifiedOptions = { passive: true };
        }
      }
      
      return originalAddEventListener.call(this, type, listener, modifiedOptions);
    };
    
    // Cleanup
    return () => {
      EventTarget.prototype.addEventListener = originalAddEventListener;
    };
  }, [isMobile]);
  
  // Console warning suppression for ECharts passive event listener warnings
  React.useEffect(() => {
    if (!isMobile) return; // Only needed on mobile
    
    // Store original console methods
    const originalWarn = console.warn;
    const originalError = console.error;
    
    // Pattern for passive event listener warnings from ECharts
    const suppressedPatterns = [
      /passive event listener/i,
      /preventDefault.*passive/i,
      /Unable to preventDefault inside passive event listener/i,
      /non-passive event listener/i,
      /\[Violation\]/i,
      /touchmove/i,
      /mouseout/i,
      /mouseleave/i
    ];
    
    // Override console.warn for this component only
    console.warn = function(...args) {
      const message = args[0]?.toString() || '';
      const shouldSuppress = suppressedPatterns.some(pattern => pattern.test(message));
      
      if (!shouldSuppress) {
        originalWarn.apply(console, args);
      }
    };
    
    // Also suppress console.error for the same patterns
    console.error = function(...args) {
      const message = args[0]?.toString() || '';
      const shouldSuppress = suppressedPatterns.some(pattern => pattern.test(message));
      
      if (!shouldSuppress) {
        originalError.apply(console, args);
      }
    };
    
    // Cleanup on unmount
    return () => {
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, [isMobile]); // Only re-run if mobile state changes
  
  // Adjust height based on chart type and mobile status
  const getResponsiveHeight = () => {
    if (chartType === 'boxplot') {
      // For multiple box plots, we need more height
      return isMobile ? 300 : 350;
    }
    if (chartType === 'stacked') {
      // For stacked charts with multiple instructors, we need more height
      const instructorCount = filterOptions?.length || 1;
      return isMobile ? Math.max(250, instructorCount * 35) : Math.max(300, instructorCount * 35);
    }
    // For bar charts, use same height as stacked/box plot for consistency
    return isMobile ? 300 : 350;
  };
  
  const responsiveHeight = getResponsiveHeight();

  // Force chart refresh when necessary by incrementing key
  const [chartKey, setChartKey] = React.useState(0);
  
  // Track mounted state to prevent updates after unmount
  const isMountedRef = React.useRef(true);
  
  // Track if this is the initial mount
  const isInitialMount = React.useRef(true);
  
  // Consolidate chart re-render logic to prevent multiple renders
  const prevValues = React.useRef({ 
    isDark, 
    chartType, 
    selectedFilter: JSON.stringify(selectedFilter), 
    language 
  });
  
  React.useEffect(() => {
    // Skip the very first render to prevent initial flashing
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevValues.current = {
        isDark,
        chartType,
        selectedFilter: JSON.stringify(selectedFilter),
        language
      };
      return;
    }
    
    const currentValues = {
      isDark,
      chartType,
      selectedFilter: JSON.stringify(selectedFilter),
      language
    };
    
    const hasChanged = 
      prevValues.current.isDark !== currentValues.isDark ||
      prevValues.current.chartType !== currentValues.chartType ||
      prevValues.current.selectedFilter !== currentValues.selectedFilter ||
      prevValues.current.language !== currentValues.language;
      
    if (hasChanged) {
      prevValues.current = currentValues;
      // Use requestAnimationFrame to batch updates
      requestAnimationFrame(() => {
        if (isMountedRef.current) {
          setChartKey(prev => prev + 1);
        }
      });
    }
  }, [isDark, chartType, selectedFilter, language]);
  
  // Listen for theme change events
  React.useEffect(() => {
    const handleThemeChange = () => {
      // Use requestAnimationFrame instead of setTimeout for better performance
      requestAnimationFrame(() => {
        if (isMountedRef.current) {
          const root = document.documentElement;
          const newIsDark = root.classList.contains('dark');
          
          // Only update if theme actually changed
          if (prevValues.current.isDark !== newIsDark) {
            prevValues.current = { ...prevValues.current, isDark: newIsDark };
            setChartKey(prev => prev + 1);
          }
        }
      });
    };
    
    window.addEventListener('themechange', handleThemeChange);
    
    return () => {
      window.removeEventListener('themechange', handleThemeChange);
    };
  }, []);
  
  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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

  // Helper function to filter reviews by instructor and calculate real grade distribution
  const getGradeDistributionByInstructor = (instructorValue: string): Record<string, number> => {
    if (!rawReviewData || rawReviewData.length === 0) {
      return {};
    }
    
    // If 'all', return overall distribution
    if (instructorValue === 'all') {
      return calculateGradeDistributionFromReviews(rawReviewData.map(r => ({ course_final_grade: r.review.course_final_grade })));
    }
    
    // Check if this is instructor page data structure (InstructorReviewFromDetails)
    // vs course page data structure (CourseReviewInfo)
    const isInstructorPage = context === 'instructor';
    
    if (isInstructorPage) {
      // For instructor page: filter by course code and session type (instructorValue is courseCode|sessionType)
      const [targetCourse, targetSessionType] = instructorValue.split('|');
      
      const filteredReviews = rawReviewData.filter(reviewInfo => {
        // rawReviewData on instructor page has structure: { review, term, course, instructorDetails }
        const courseCode = (reviewInfo as any).course?.course_code;
        if (courseCode !== targetCourse) return false;
        
        // Also check that this instructor taught this session type for this review
        const instructorDetails = (reviewInfo as any).instructorDetails;
        if (!instructorDetails || !Array.isArray(instructorDetails)) return false;
        
        // Find the current instructor's detail (the instructor whose page we're on)
        // We need to get the instructor name from the page context
        const hasMatchingSessionType = instructorDetails.some((detail: any) => 
          detail.session_type === targetSessionType
        );
        
        return hasMatchingSessionType;
      });
      
      return calculateGradeDistributionFromReviews(filteredReviews.map(r => ({ course_final_grade: r.review.course_final_grade })));
    } else {
      // For course page: filter by instructor (instructorValue is instructor|sessionType)
      const [targetInstructor, targetSessionType] = instructorValue.split('|');
      
      // Filter reviews for specific instructor
      const filteredReviews = rawReviewData.filter(reviewInfo => {
        try {
          const instructorDetails = JSON.parse(reviewInfo.review.instructor_details);
          return instructorDetails.some((detail: any) => 
            detail.instructor_name === targetInstructor && 
            detail.session_type === targetSessionType
          );
        } catch (error) {
          console.warn('Failed to parse instructor details:', error);
          return false;
        }
      });
      
      return calculateGradeDistributionFromReviews(filteredReviews.map(r => ({ course_final_grade: r.review.course_final_grade })));
    }
  };

  // ECharts theme configuration with explicit color forcing
  const getChartTheme = () => {
    // Get the current theme state from DOM to ensure accuracy
    const currentIsDark = document.documentElement.classList.contains('dark');
    
    // Force explicit color values to ensure theme switching works
    const gridColor = currentIsDark ? '#374151' : '#f3f4f6';
    const axisLineColor = currentIsDark ? '#4b5563' : '#d1d5db';
    const axisLabelColor = currentIsDark ? '#ffffff' : '#000000';
    const textColor = currentIsDark ? '#ffffff' : '#000000';
    
    return {
      backgroundColor: 'transparent',
      textStyle: {
        color: textColor,
        fontSize: 12,
        fontFamily: 'ui-sans-serif, system-ui, sans-serif'
      },
      // Explicit theme colors that will force refresh
      color: [
        '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', 
        '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#10b981'
      ],
      grid: {
        borderColor: axisLineColor,
        backgroundColor: 'transparent'
      },
      categoryAxis: {
        axisLine: { 
          show: true,
          lineStyle: { 
            color: axisLineColor,
            width: 1
          } 
        },
        axisTick: { 
          show: true,
          lineStyle: { 
            color: axisLineColor,
            width: 1
          } 
        },
        axisLabel: { 
          show: true,
          color: axisLabelColor,
          fontSize: 12,
          fontWeight: 'bold',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif'
        },
        splitLine: { 
          show: true,
          lineStyle: { 
            color: gridColor,
            width: 1,
            type: 'solid'
          } 
        }
      },
      valueAxis: {
        axisLine: { 
          show: true,
          lineStyle: { 
            color: axisLineColor,
            width: 1
          } 
        },
        axisTick: { 
          show: true,
          lineStyle: { 
            color: axisLineColor,
            width: 1
          } 
        },
        axisLabel: { 
          show: true,
          color: axisLabelColor,
          fontSize: 12,
          fontWeight: 'bold',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif'
        },
        splitLine: { 
          show: true,
          lineStyle: { 
            color: gridColor,
            width: 1,
            type: 'solid'
          } 
        }
      }
    };
  };

  // Get grade colors matching the review card grade circles
  const getGradeCircleColors = () => {
    return {
      'A': '#10b981',  // Base green for A
      'A-': '#34d399', // Lighter green for A-
      'B+': '#1d4ed8', // Darker blue for B+
      'B': '#3b82f6',  // Base blue for B
      'B-': '#60a5fa', // Lighter blue for B-
      'C+': '#ca8a04', // Darker yellow for C+
      'C': '#eab308',  // Base yellow for C
      'C-': '#fbbf24', // Lighter yellow for C-
      'D+': '#ea580c', // Darker orange for D+
      'D': '#f97316',  // Base orange for D
      'D-': '#fb923c', // Lighter orange for D-
      'F': '#ef4444', // Red for F grades
      'N/A': '#6b7280' // Gray for N/A
    };
  };

  // Function to determine text color based on background color
  const getContrastColor = (hexColor: string): string => {
    // Remove # if present
    const color = hexColor.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    
    // Calculate relative luminance using WCAG formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return white for dark backgrounds, black for light backgrounds
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };

  // Helper function to get consistent ordering for all chart types
  const getConsistentFilterOrdering = () => {
    if (!filterOptions || filterOptions.length === 0) return [];
    
    return [...filterOptions]
      .filter(option => option.count >= 1)
      .sort((a, b) => {
        if (context === 'instructor') {
          // For instructor page: sort by course code alphabetically
          return a.value.localeCompare(b.value);
        } else {
          // For course page: sort by session type then instructor name
          const [instructorA, sessionA] = a.value.split('|');
          const [instructorB, sessionB] = b.value.split('|');
          
          // First sort by session type: lecture before tutorial
          if (sessionA !== sessionB) {
            if (sessionA.toLowerCase() === 'lecture') return -1;
            if (sessionB.toLowerCase() === 'lecture') return 1;
            if (sessionA.toLowerCase() === 'tutorial') return -1;
            if (sessionB.toLowerCase() === 'tutorial') return 1;
          }
          
          // Within same session type, sort by instructor name alphabetically
          return instructorA.localeCompare(instructorB);
        }
      });
  };

  // Type definition for box plot data item
  interface BoxPlotDataItem {
    name: string;
    stats: BoxPlotStatistics;
    count: number;
  }

  const getAllBoxPlotData = (): BoxPlotDataItem[] => {
    if (!filterOptions || filterOptions.length === 0 || !rawReviewData || rawReviewData.length === 0) {
      // If no filter options or raw data, return current box plot data as single item
      return [{
        name: t('common.all'),
        stats: boxPlotStats,
        count: totalCount
      }];
    }
    
    // Determine which options to process based on selectedFilter
    let optionsToProcess: FilterOption[] = [];
    
    // Handle both single and multiple selections
    const selectedValues = Array.isArray(selectedFilter) ? selectedFilter : (selectedFilter ? [selectedFilter] : []);
    
    if (selectedValues.length === 0 || selectedValues.includes('all')) {
      // Show all options with 'All' first, then use consistent ordering
      const allOption = {
        value: 'all',
        label: t('common.all'),
        count: totalCount
      };
      
      // Use consistent ordering function
      const sortedFilterOptions = getConsistentFilterOrdering();
      
      // Combine all option with sorted filter options
      optionsToProcess = [allOption, ...sortedFilterOptions];
    } else {
      // Only show the selected options
      optionsToProcess = selectedValues
        .map(value => filterOptions.find(opt => opt.value === value))
        .filter((option): option is FilterOption => option !== undefined);
      
      // Fallback to all if no valid options found
      if (optionsToProcess.length === 0) {
        optionsToProcess = [{
          value: 'all',
          label: t('common.all'),
          count: totalCount
        }];
      }
    }
    
    // Process each option with real data
    const allBoxPlotData: BoxPlotDataItem[] = optionsToProcess
      .map(option => {
        // Get real grade distribution for this instructor/course
        const realDistribution = getGradeDistributionByInstructor(option.value);
        
        // Calculate box plot statistics for this real distribution
        const stats = calculateBoxPlotStatistics(realDistribution);
        
        // Skip if no valid stats
        if (!stats) return null;
        
        // For instructor page, use course code only in label
        let displayLabel = option.label;
        if (context === 'instructor' && option.value !== 'all') {
          // Extract course code and session type from value like "BUS1001|Lecture"
          const [courseCode, sessionType] = option.value.split('|');
          
          // For box plot on instructor page, show course code with session type
          const translatedSessionType = sessionType === 'Lecture' 
            ? t('sessionType.lecture')
            : sessionType === 'Tutorial' 
              ? t('sessionType.tutorial')
              : sessionType;
          
          displayLabel = `${courseCode}\n(${translatedSessionType})`;
        } else if (context === 'course' && option.value !== 'all') {
          // For course page, format as "Instructor Name\n(Session Type)"
          const [instructorName, sessionType] = option.value.split('|');
          
          // Translate session type
          const translatedSessionType = sessionType?.toLowerCase() === 'lecture' 
            ? t('sessionType.lecture')
            : sessionType?.toLowerCase() === 'tutorial' 
              ? t('sessionType.tutorial')
              : sessionType;
          
          displayLabel = `${shortenInstructorName(instructorName)}\n(${translatedSessionType})`;
        }
        
        return {
          name: displayLabel.length > 35 ? displayLabel.substring(0, 32) + '...' : displayLabel,
          stats: stats,
          count: option.count
        };
      })
      .filter((item): item is BoxPlotDataItem => item !== null && item.stats !== null); // Remove items with null stats
    
    return allBoxPlotData;
  };

  // State to track tooltip visibility on mobile
  const chartRef = React.useRef<ReactECharts>(null);
  const isTooltipVisible = React.useRef(false);
  const tooltipShownParams = React.useRef<{ seriesIndex?: number; dataIndex?: number } | null>(null);
  const tooltipTimeout = React.useRef<NodeJS.Timeout | null>(null);
  
  // Persist tooltip on mobile after chart re-renders
  React.useEffect(() => {
    if (!isMobile || !chartRef.current || !tooltipShownParams.current) return;
    
    // Re-show tooltip after chart re-render
    const chartInstance = chartRef.current.getEchartsInstance();
    if (chartInstance && isTooltipVisible.current) {
      // Small delay to ensure chart is ready
      requestAnimationFrame(() => {
        chartInstance.dispatchAction({
          type: 'showTip',
          seriesIndex: tooltipShownParams.current?.seriesIndex,
          dataIndex: tooltipShownParams.current?.dataIndex
        });
      });
    }
  }, [chartKey, isMobile]); // Re-run when chart re-renders
  
  // Add click outside handler for mobile
  React.useEffect(() => {
    if (!isMobile) return;
    
    const handleDocumentClick = (event: MouseEvent | TouchEvent) => {
      // Clear any pending tooltip timeout
      if (tooltipTimeout.current) {
        clearTimeout(tooltipTimeout.current);
        tooltipTimeout.current = null;
      }
      
      if (!chartRef.current) return;
      
      const chartInstance = chartRef.current.getEchartsInstance();
      if (!chartInstance) return;
      
      const chartDom = chartInstance.getDom();
      if (!chartDom) return;
      
      // Check if click is on the chart or its tooltip
      const target = event.target as Node;
      const isChartClick = chartDom.contains(target);
      
      // Find tooltip DOM element - ECharts tooltip has a specific class
      const tooltipDoms = document.querySelectorAll('div[style*="position: absolute"][style*="z-index"]');
      let isTooltipClick = false;
      
      tooltipDoms.forEach(dom => {
        // Check if this is likely an ECharts tooltip by looking for specific attributes
        if (dom.innerHTML.includes('font-weight') && dom.contains(target)) {
          isTooltipClick = true;
        }
      });
      
      // If clicking outside chart and tooltip, hide tooltip
      if (!isChartClick && !isTooltipClick && isTooltipVisible.current) {
        // Add a small delay to ensure touch events are properly handled
        tooltipTimeout.current = setTimeout(() => {
          chartInstance.dispatchAction({
            type: 'hideTip'
          });
          isTooltipVisible.current = false;
          tooltipShownParams.current = null;
        }, 100);
      }
    };
    
    // Use both click and touch events for better mobile support
    const handleTouch = (event: TouchEvent) => {
      // Convert touch event to click coordinates
      const touch = event.touches[0] || event.changedTouches[0];
      if (touch) {
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: touch.clientX,
          clientY: touch.clientY
        });
        handleDocumentClick(clickEvent);
      }
    };
    
    // Use capture phase to handle events before chart
    document.addEventListener('click', handleDocumentClick, true);
    document.addEventListener('touchend', handleTouch, { passive: true, capture: true });
    
    return () => {
      document.removeEventListener('click', handleDocumentClick, true);
      document.removeEventListener('touchend', handleTouch, true);
      
      // Clear timeout on cleanup
      if (tooltipTimeout.current) {
        clearTimeout(tooltipTimeout.current);
        tooltipTimeout.current = null;
      }
    };
  }, [isMobile]);
  
  // Mobile-optimized ECharts configuration
  const getMobileOptimizedOptions = (baseOptions: any) => {
    if (!isMobile) return baseOptions;
    
    return {
      ...baseOptions,
      // Reduce animations on mobile but don't disable completely
      animation: false,
      animationDuration: 0,
      
      // Hide toolbox on mobile
      toolbox: {
        show: false
      },
      
      // Keep tooltips enabled but configure for mobile
      tooltip: {
        ...baseOptions.tooltip,
        trigger: baseOptions.tooltip?.trigger || 'item', // Preserve original trigger if set
        triggerOn: 'click', // Force click trigger on mobile  
        showDelay: 0, // Show immediately
        hideDelay: 86400000, // 24 hours (effectively never auto-hide)
        alwaysShowContent: false, // Let manual control work
        // Ensure tooltip stays visible when clicking bars
        confine: true, // Keep tooltip within chart bounds
        position: function(point: number[], params: any, dom: HTMLElement, rect: any, size: any) {
          // Position tooltip above the clicked bar to avoid overlap
          const x = Math.min(Math.max(size.contentSize[0] / 2, point[0]), size.viewSize[0] - size.contentSize[0] / 2);
          const y = Math.max(10, point[1] - size.contentSize[1] - 20); // Position above with space
          return [x - size.contentSize[0] / 2, y];
        },
        // Add enterable to prevent tooltip from hiding when touched
        enterable: true,
        // Prevent default touch behavior
        extraCssText: 'pointer-events: auto; z-index: 9999; -webkit-touch-callout: none; -webkit-user-select: none; user-select: none;',
        transitionDuration: 0 // No animation for instant response
      },
      
      // Disable zoom and brush tools that cause warnings
      dataZoom: [],
      brush: {
        toolbox: []
      }
    };
  };

  // Chart initialization options optimized for mobile
  const getEChartsOpts = () => {
    return {
      renderer: 'canvas' as const,
      devicePixelRatio: window.devicePixelRatio,
      // Use dirty rectangle rendering for better performance
      useDirtyRect: true,
      // Add passive event listeners to prevent console warnings
      useCoarsePointer: true,
      pointerSize: 40 // Larger touch target for mobile
    };
  };

  // Chart event configuration
  const getChartEvents = () => {
    const events: any = {};
    
    // Always enable click events for all chart types
    events.click = (params: any) => {
      // Handle mobile tooltip persistence
      if (isMobile && chartRef.current) {
        // Clear any pending hide timeout
        if (tooltipTimeout.current) {
          clearTimeout(tooltipTimeout.current);
          tooltipTimeout.current = null;
        }
        
        const chartInstance = chartRef.current.getEchartsInstance();
        if (chartInstance) {
          // If clicking the same item that's already showing tooltip, hide it
          if (isTooltipVisible.current && 
              tooltipShownParams.current?.seriesIndex === params.seriesIndex && 
              tooltipShownParams.current?.dataIndex === params.dataIndex) {
            chartInstance.dispatchAction({
              type: 'hideTip'
            });
            isTooltipVisible.current = false;
            tooltipShownParams.current = null;
          } else {
            // Show tooltip for the clicked item
            isTooltipVisible.current = true;
            tooltipShownParams.current = {
              seriesIndex: params.seriesIndex,
              dataIndex: params.dataIndex
            };
            
            // Force show tooltip
            chartInstance.dispatchAction({
              type: 'showTip',
              seriesIndex: params.seriesIndex,
              dataIndex: params.dataIndex
            });
          }
        }
      }
      
      // Call original click handler for grade filtering (only on desktop or when not showing tooltip)
      if (onBarClick && chartType === 'bar' && params.data && params.data.grade) {
        // On mobile, only trigger bar click if we're not showing a tooltip
        if (!isMobile || !isTooltipVisible.current) {
          onBarClick(params.data.grade);
        }
      }
    };
    
    // Prevent tooltip from auto-hiding on mobile
    if (isMobile) {
      events.globalout = (params: any) => {
        // Prevent the default globalout behavior which hides tooltip
        if (isTooltipVisible.current) {
          // Don't hide tooltip on globalout for mobile
          return false;
        }
      };
    }
    
    return events;
  };
  

  // Bar chart options
  const getBarChartOptions = () => {
    const gradeColors = getGradeCircleColors();
    const theme = getChartTheme();
    const currentIsDark = document.documentElement.classList.contains('dark');
    
    return {
      ...theme,
      // Completely disable toolbox
      toolbox: {
        show: false
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
          color: currentIsDark ? '#ffffff' : '#000000', // Fix axis label colors
          fontSize: isMobile ? 10 : 12,
          fontWeight: 'bold',
          rotate: isMobile ? 45 : 0,
          interval: 0
        },
        axisLine: {
          lineStyle: { color: currentIsDark ? '#4b5563' : '#d1d5db' }
        },
        axisTick: {
          lineStyle: { color: currentIsDark ? '#4b5563' : '#d1d5db' }
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: currentIsDark ? '#ffffff' : '#000000', // Fix axis label colors
          fontSize: isMobile ? 10 : 12,
          fontWeight: 'bold',
          formatter: (value: number) => {
            // Only show integer labels for student count
            return Number.isInteger(value) ? value.toString() : '';
          }
        },
        axisLine: {
          lineStyle: { color: currentIsDark ? '#4b5563' : '#d1d5db' }
        },
        axisTick: {
          lineStyle: { color: currentIsDark ? '#4b5563' : '#d1d5db' }
        },
        splitLine: {
          lineStyle: { 
            color: currentIsDark ? '#374151' : '#f3f4f6',
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
              color: gradeColors[grade as keyof typeof gradeColors] || gradeColors['N/A'],
              borderRadius: [4, 4, 0, 0]
            },
            emphasis: {
              itemStyle: {
                color: gradeColors[grade as keyof typeof gradeColors] || gradeColors['N/A'],
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
        trigger: isMobile ? 'item' : 'axis',
        triggerOn: isMobile ? 'click' : 'mousemove', // Click to show tooltip on mobile
        backgroundColor: currentIsDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderColor: currentIsDark ? '#4b5563' : '#d1d5db',
        borderWidth: 1,
        hideDelay: isMobile ? 86400000 : 100, // 24 hours on mobile (effectively never auto-hide)
        alwaysShowContent: false, // Let manual control work
        enterable: true, // Allow interaction
        transitionDuration: 0, // No animation
        confine: true, // Keep tooltip within chart bounds
        textStyle: {
          color: currentIsDark ? '#ffffff' : '#000000', // Fix tooltip text color
          fontSize: 12
        },
        formatter: (params: any) => {
          if (!params) return '';
          
          // Handle both array (axis trigger) and single object (item trigger)
          const data = Array.isArray(params) ? params[0] : params;
          if (!data) return '';
          
          const grade = data.name; // This is the grade (e.g., "A", "B+", etc.)
          const count = data.value; // This is the student count
          const percentage = totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : '0.0';
          
          // Use the getGPA function from gradeUtils for accurate grade points
          const gpaValue = getGPA(grade);
          const gradePoint = gpaValue !== null ? gpaValue.toFixed(2) : 'N/A';
          
          // Use proper translation for grade
          const gradeLabel = context === 'course' ? t('chart.grade') : t('chart.rating');
          
          // Aligned layout for bar chart tooltip
          return `
            <div style="font-weight: 500; margin-bottom: 4px;">${gradeLabel}: ${grade}</div>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="color: ${currentIsDark ? '#9ca3af' : '#6b7280'}; padding: 2px 0; padding-right: 16px;">
                  ${t('chart.studentCount', { count }).split(':')[0]}
                </td>
                <td style="color: ${currentIsDark ? '#ffffff' : '#000000'}; padding: 2px 0; text-align: right; font-weight: 500;">
                  ${count}
                </td>
              </tr>
              <tr>
                <td style="color: ${currentIsDark ? '#9ca3af' : '#6b7280'}; padding: 2px 0; padding-right: 16px;">
                  ${t('chart.percentage')}
                </td>
                <td style="color: ${currentIsDark ? '#ffffff' : '#000000'}; padding: 2px 0; text-align: right; font-weight: 500;">
                  ${percentage}%
                </td>
              </tr>
              <tr>
                <td style="color: ${currentIsDark ? '#9ca3af' : '#6b7280'}; padding: 2px 0; padding-right: 16px;">
                  ${t('chart.gradePoint')}
                </td>
                <td style="color: ${currentIsDark ? '#ffffff' : '#000000'}; padding: 2px 0; text-align: right; font-weight: 500;">
                  ${gradePoint}
                </td>
              </tr>
            </table>
          `;
        },
        axisPointer: {
          type: 'shadow',
          shadowStyle: {
            color: currentIsDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
          }
        }
      }
    };
  };

  // Box plot options
  const getBoxPlotOptions = () => {
    const gradeColors = getGradeCircleColors();
    const theme = getChartTheme();
    const outlierColor = gradeColors['F']; // Use red for outliers
    const currentIsDark = document.documentElement.classList.contains('dark');
    
    const boxPlotData = getAllBoxPlotData();
    
    // If no valid data, show a message
    if (!boxPlotData || boxPlotData.length === 0) {
      return {
        ...theme,
        title: {
          text: t('chart.noDataAvailable'),
          textStyle: {
            color: currentIsDark ? '#ffffff' : '#000000',
            fontSize: 14
          },
          left: 'center',
          top: 'middle'
        }
      };
    }
    
    return {
      ...theme,
      // Completely disable toolbox
      toolbox: {
        show: false
      },
      // Add horizontal zoom functionality for x-axis (GPA values) with proper constraints
      dataZoom: !isMobile ? [
        {
          type: 'inside',
          xAxisIndex: 0,
          start: 0,
          end: 100,
          filterMode: 'filter', // Use 'filter' instead of 'weakFilter' for better containment
          minValueSpan: 0.5, // Minimum zoom span of 0.5 GPA
          maxValueSpan: 4, // Maximum span is the full range
          zoomLock: false,
          moveOnMouseMove: true,
          preventDefaultMouseMove: true
        }
      ] : [],
      grid: {
        left: '8%', // Increased left margin to prevent overflow
        right: '6%', // Increased right margin for safety
        top: '5%', // Add top margin
        bottom: '8%', // Increased bottom margin
        containLabel: true,
        show: false // Hide grid border to prevent visual conflicts
      },
      xAxis: {
        type: 'value',
        min: 0,
        max: 4,
        boundaryGap: [0, 0], // Ensure no gap at boundaries
        axisLabel: {
          color: currentIsDark ? '#ffffff' : '#000000', // Fix axis label colors
          fontSize: isMobile ? 10 : 12,
          fontWeight: 'bold',
          formatter: (value: number) => value.toFixed(1),
          margin: 8 // Add margin to prevent label overflow
        },
        axisLine: {
          lineStyle: { 
            color: currentIsDark ? '#4b5563' : '#d1d5db',
            width: 1
          },
          onZero: false // Prevent axis line from moving during zoom
        },
        axisTick: {
          lineStyle: { 
            color: currentIsDark ? '#4b5563' : '#d1d5db',
            width: 1
          },
          alignWithLabel: true // Align ticks with labels
        },
        splitLine: {
          lineStyle: { 
            color: currentIsDark ? '#374151' : '#f3f4f6',
            width: 1,
            type: 'solid'
          }
        }
      },
      yAxis: {
        type: 'category',
        data: boxPlotData.map((item) => item.name),
        boundaryGap: true, // Add gap between categories and axis boundaries
        axisLabel: {
          color: currentIsDark ? '#ffffff' : '#000000', // Fix axis label colors
          fontSize: isMobile ? 9 : 11,
          fontWeight: 'bold',
          interval: 0,
          margin: 8, // Add margin to prevent label overflow
          overflow: 'truncate' // Truncate long labels instead of overflowing
        },
        axisLine: {
          lineStyle: { 
            color: currentIsDark ? '#4b5563' : '#d1d5db',
            width: 1
          }
        },
        axisTick: {
          lineStyle: { 
            color: currentIsDark ? '#4b5563' : '#d1d5db',
            width: 1
          },
          alignWithLabel: true
        },
        inverse: true // Show items from top to bottom in the order they appear
      },
      series: [
        {
          name: 'Box Plot',
          type: 'boxplot',
          data: boxPlotData.map((item) => {
            // Convert BoxPlotStatistics to array format [min, q1, median, q3, max]
            const stats = item.stats;
            if (!stats) return [0, 0, 0, 0, 0];
            // Ensure values are within the chart bounds
            return [
              Math.max(0, Math.min(4, stats.min || 0)),
              Math.max(0, Math.min(4, stats.q1 || 0)),
              Math.max(0, Math.min(4, stats.median || 0)),
              Math.max(0, Math.min(4, stats.q3 || 0)),
              Math.max(0, Math.min(4, stats.max || 0))
            ];
          }),
          itemStyle: {
            color: 'transparent',
            borderColor: outlierColor, // Change to red outline
            borderWidth: 2
          },
          emphasis: {
            itemStyle: {
              borderColor: outlierColor, // Red emphasis border
              borderWidth: 3,
              shadowBlur: 8,
              shadowColor: outlierColor // Red shadow
            }
          },
          boxWidth: ['7%', '50%'],
          clip: true // Ensure elements are clipped to chart area
        },
        // Add outliers as separate scatter series
        {
          name: 'Outliers',
          type: 'scatter',
          data: boxPlotData.flatMap((item, index) => {
            const stats = item.stats;
            if (!stats || !stats.outliers || stats.outliers.length === 0) return [];
            
            // For horizontal box plot: [value, categoryIndex]
            // Ensure outlier values are within chart bounds
            return stats.outliers
              .filter(outlier => outlier >= 0 && outlier <= 4) // Filter out invalid outliers
              .map(outlier => [Math.max(0, Math.min(4, outlier)), index]);
          }),
          itemStyle: {
            color: outlierColor,
            borderColor: outlierColor
          },
          symbolSize: 6,
          zlevel: 1,
          clip: true // Ensure outliers are clipped to chart area
        }
      ],
      tooltip: {
        trigger: 'item',
        triggerOn: isMobile ? 'click' : 'mousemove', // Click to show tooltip on mobile
        backgroundColor: currentIsDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderColor: currentIsDark ? '#4b5563' : '#d1d5db',
        borderWidth: 1,
        hideDelay: isMobile ? 86400000 : 100, // 24 hours on mobile (effectively never auto-hide)
        alwaysShowContent: false, // Let manual control work
        enterable: true, // Allow interaction
        transitionDuration: 0, // No animation
        confine: true, // Keep tooltip within chart bounds
        textStyle: {
          color: currentIsDark ? '#ffffff' : '#000000', // Fix tooltip text color
          fontSize: 12
        },
        formatter: (params: any) => {
          if (!params) return '';
          
          // Handle both array and single object params
          const paramData = Array.isArray(params) ? params[0] : params;
          if (!paramData || !paramData.data) return '';
          
          if (paramData.seriesName === 'Outliers') {
            const outlierValue = paramData.data[0]; // Now x is the value
            const categoryIndex = paramData.data[1]; // Now y is the category index
            const categoryName = boxPlotData[categoryIndex]?.name || '';
            
            return `
              <div style="font-weight: 500; margin-bottom: 4px;">${categoryName}</div>
              <div style="color: ${currentIsDark ? '#ffffff' : '#000000'}; line-height: 1.4;">
                ${t('chart.outliers')}: ${outlierValue.toFixed(2)}
              </div>
            `;
          }
          
          const data = paramData.data;
          const name = paramData.name;
          const [min, q1, median, q3, max] = data;
          
          // Find the corresponding item to get the count
          const item = boxPlotData.find(item => item.name === name);
          const count = item ? item.count : 0;
          
          // Create aligned layout with consistent spacing (without blue dots)
          const tooltipContent = `
            <div style="font-weight: 500; margin-bottom: 8px;">${name}</div>
            <div style="margin-bottom: 6px; font-weight: 500;">${t('chart.studentCount', { count })}</div>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="color: ${currentIsDark ? '#9ca3af' : '#6b7280'}; padding: 2px 0; padding-right: 16px;">
                  ${t('chart.minimum')}
                </td>
                <td style="color: ${currentIsDark ? '#ffffff' : '#000000'}; padding: 2px 0; text-align: right; font-weight: 500;">
                  ${min.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td style="color: ${currentIsDark ? '#9ca3af' : '#6b7280'}; padding: 2px 0; padding-right: 16px;">
                  ${t('chart.q1')}
                </td>
                <td style="color: ${currentIsDark ? '#ffffff' : '#000000'}; padding: 2px 0; text-align: right; font-weight: 500;">
                  ${q1.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td style="color: ${currentIsDark ? '#9ca3af' : '#6b7280'}; padding: 2px 0; padding-right: 16px;">
                  ${t('chart.median')}
                </td>
                <td style="color: ${currentIsDark ? '#ffffff' : '#000000'}; padding: 2px 0; text-align: right; font-weight: 500;">
                  ${median.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td style="color: ${currentIsDark ? '#9ca3af' : '#6b7280'}; padding: 2px 0; padding-right: 16px;">
                  ${t('chart.q3')}
                </td>
                <td style="color: ${currentIsDark ? '#ffffff' : '#000000'}; padding: 2px 0; text-align: right; font-weight: 500;">
                  ${q3.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td style="color: ${currentIsDark ? '#9ca3af' : '#6b7280'}; padding: 2px 0; padding-right: 16px;">
                  ${t('chart.maximum')}
                </td>
                <td style="color: ${currentIsDark ? '#ffffff' : '#000000'}; padding: 2px 0; text-align: right; font-weight: 500;">
                  ${max.toFixed(2)}
                </td>
              </tr>
            </table>
          `;
          
          return tooltipContent;
        }
      }
    };
  };

  // Stacked normalized chart options  
  const getStackedNormalizedOptions = () => {
    if (!filterOptions || filterOptions.length === 0 || !rawReviewData || rawReviewData.length === 0) {
      return getBarChartOptions(); // Fallback to bar chart if no filter options or data
    }
    const currentIsDark = document.documentElement.classList.contains('dark');

    // Determine which options to process based on selectedFilter
    let optionsToProcess: FilterOption[] = [];
    
    // Handle both single and multiple selections
    const selectedValues = Array.isArray(selectedFilter) ? selectedFilter : (selectedFilter ? [selectedFilter] : []);
    
    if (selectedValues.length === 0 || selectedValues.includes('all')) {
      // Show all options with 'All' first, then use consistent ordering
      const allOption = {
        value: 'all',
        label: t('common.all'),
        count: totalCount
      };
      
      // Use consistent ordering function
      const sortedFilterOptions = getConsistentFilterOrdering();
      
      // Combine all option with sorted filter options, limit to 10 for readability
      optionsToProcess = [allOption, ...sortedFilterOptions].slice(0, 10);
    } else {
      // Only show the selected options
      optionsToProcess = selectedValues
        .map(value => filterOptions.find(opt => opt.value === value))
        .filter((option): option is FilterOption => option !== undefined);
      
      // Fallback to all if no valid options found
      if (optionsToProcess.length === 0) {
        optionsToProcess = [{
          value: 'all',
          label: t('common.all'),
          count: totalCount
        }];
      }
    }

    const gradeColors = getGradeCircleColors();
    const theme = getChartTheme();
    
    // Process each option with real grade distributions
    const stackedData: Array<{ name: string; data: number[]; realCounts: number[]; total: number }> = optionsToProcess.map(option => {
      // Get real grade distribution for this instructor/course
      const realDistribution = getGradeDistributionByInstructor(option.value);
      
      // Calculate real counts and percentages for display
      const realCounts = sortedGrades.map(grade => realDistribution[grade] || 0);
      const total = realCounts.reduce((sum, count) => sum + count, 0);
      const percentages = realCounts.map(count => total > 0 ? (count / total) * 100 : 0);
      
      // For instructor page, use course code only in label
      let displayLabel = option.label;
      if (context === 'instructor' && option.value !== 'all') {
        // Extract course code and session type from value like "BUS1001|Lecture"
        const [courseCode, sessionType] = option.value.split('|');
        
        // For stacked chart on instructor page, show course code with session type
        const translatedSessionType = sessionType === 'Lecture' 
          ? t('sessionType.lecture')
          : sessionType === 'Tutorial' 
            ? t('sessionType.tutorial')
            : sessionType;
        
        displayLabel = `${courseCode}\n(${translatedSessionType})`;
      } else if (context === 'course' && option.value !== 'all') {
        // For course page, format as "Instructor Name\n(Session Type)"
        const [instructorName, sessionType] = option.value.split('|');
        
        // Translate session type
        const translatedSessionType = sessionType?.toLowerCase() === 'lecture' 
          ? t('sessionType.lecture')
          : sessionType?.toLowerCase() === 'tutorial' 
            ? t('sessionType.tutorial')
            : sessionType;
        
        displayLabel = `${shortenInstructorName(instructorName)}\n(${translatedSessionType})`;
      }
      
      return {
        name: displayLabel.length > 35 ? displayLabel.substring(0, 32) + '...' : displayLabel,
        data: percentages,
        realCounts: realCounts,
        total: total
      };
    });

    // Create series for each grade
    const series = sortedGrades.map((grade, gradeIndex) => ({
      name: grade,
      type: 'bar',
      stack: 'total',
      emphasis: {
        focus: 'self' // Highlight only the current segment, not the entire series
      },
      data: stackedData.map((item, itemIndex) => ({
        value: item.data[gradeIndex],
        realCount: item.realCounts[gradeIndex],
        total: item.total,
        itemIndex: itemIndex,
        gradeIndex: gradeIndex,
        grade: grade,
        category: item.name
      })),
      itemStyle: {
        color: gradeColors[grade as keyof typeof gradeColors] || gradeColors['N/A']
      },
      label: {
        show: !isMobile, // Hide text inside bars on mobile portrait mode
        position: 'inside',
        formatter: (params: any) => {
          const realCount = params.data.realCount || 0;
          const percentage = params.value || 0;
          
          // Only show label if there's meaningful data (at least 1 count and 5% of total)
          if (realCount >= 1 && percentage >= 5) {
            return `${realCount}\n(${percentage.toFixed(0)}%)`;
          }
          return '';
        },
        fontSize: 14,
        color: '#ffffff', // Always use white for better visibility on colored backgrounds
        fontWeight: 'bold'
      }
    }));

    return {
      ...theme,
      // Completely disable toolbox
      toolbox: {
        show: false
      },
      grid: {
        left: '5%', // Further reduced left padding
        right: '4%',
        bottom: isMobile ? '15%' : '12%', // Add more space for legend
        containLabel: true
      },
      xAxis: {
        type: 'value',
        max: 100,
        axisLabel: {
          color: currentIsDark ? '#ffffff' : '#000000', // Fix axis label colors
          fontSize: isMobile ? 10 : 12,
          fontWeight: 'bold',
          formatter: '{value}%'
        },
        axisLine: {
          lineStyle: { color: currentIsDark ? '#4b5563' : '#d1d5db' }
        },
        axisTick: {
          lineStyle: { color: currentIsDark ? '#4b5563' : '#d1d5db' }
        },
        splitLine: {
          lineStyle: { 
            color: currentIsDark ? '#374151' : '#f3f4f6',
            width: 1,
            type: 'solid'
          }
        }
      },
      yAxis: {
        type: 'category',
        data: stackedData.map(item => item.name),
        axisLabel: {
          color: currentIsDark ? '#ffffff' : '#000000', // Fix axis label colors
          fontSize: isMobile ? 9 : 11,
          fontWeight: 'bold',
          interval: 0, // Show all labels
          rotate: 0
        },
        axisLine: {
          lineStyle: { color: currentIsDark ? '#4b5563' : '#d1d5db' }
        },
        axisTick: {
          lineStyle: { color: currentIsDark ? '#4b5563' : '#d1d5db' }
        }
      },
      series: series,
      legend: {
        show: true,
        orient: 'horizontal',
        bottom: isMobile ? 5 : 8, // Adjust legend position to avoid overlap
        itemGap: isMobile ? 8 : 15,
        itemWidth: isMobile ? 12 : 18,
        itemHeight: isMobile ? 8 : 12,
        textStyle: {
          color: currentIsDark ? '#ffffff' : '#000000', // Fix legend text color
          fontSize: isMobile ? 10 : 12
        },
        data: sortedGrades.map(grade => ({
          name: grade,
          icon: 'rect'
        }))
      },
      tooltip: {
        trigger: 'axis',
        triggerOn: isMobile ? 'click' : 'mousemove', // Click to show tooltip on mobile
        axisPointer: {
          type: 'shadow'
        },
        backgroundColor: currentIsDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderColor: currentIsDark ? '#4b5563' : '#d1d5db',
        borderWidth: 1,
        hideDelay: isMobile ? 86400000 : 100, // 24 hours on mobile (effectively never auto-hide)
        alwaysShowContent: false, // Let manual control work
        enterable: true, // Allow interaction
        transitionDuration: 0, // No animation
        confine: true, // Keep tooltip within chart bounds
        textStyle: {
          color: currentIsDark ? '#ffffff' : '#000000', // Fix tooltip text color
          fontSize: 12
        },
        formatter: (params: any) => {
          if (!params) return '';
          
          // For stacked chart, we need array of params for all series
          if (!Array.isArray(params)) {
            // If single param, convert to array
            params = [params];
          }
          
          if (params.length === 0) return '';
          
          // Get the category name from the first parameter
          const categoryName = params[0].name || '';
          
          // Find the corresponding stackedData item to get total count
          const stackedItem = stackedData.find(item => item.name === categoryName);
          const totalCount = stackedItem ? stackedItem.total : 0;
          
          // Use proper translation for grade
          const gradeLabel = context === 'course' ? t('chart.grade') : t('chart.rating');
          
          let tooltip = `<div style="font-weight: 500; margin-bottom: 8px;">${categoryName}</div>`;
          tooltip += `<div style="margin-bottom: 6px; font-weight: 500;">${t('chart.studentCount', { count: totalCount })}</div>`;
          
          // Create table layout like box plot tooltip
          tooltip += `<table style="width: 100%; border-collapse: collapse;">`;
          
          // Show only grades that have data
          params.forEach((param: any) => {
            const percentage = param.value || 0;
            const realCount = param.data.realCount || 0;
            
            if (percentage > 0 && realCount > 0) {
              tooltip += `<tr>`;
              tooltip += `<td style="color: ${currentIsDark ? '#9ca3af' : '#6b7280'}; padding: 2px 0; padding-right: 16px;">`;
              tooltip += `<span style="display: inline-block; width: 10px; height: 10px; background-color: ${param.color}; border-radius: 2px; margin-right: 6px; vertical-align: middle;"></span>`;
              tooltip += `${param.seriesName}`;
              tooltip += `</td>`;
              tooltip += `<td style="color: ${currentIsDark ? '#ffffff' : '#000000'}; padding: 2px 0; text-align: right; font-weight: 500;">`;
              tooltip += `${realCount} (${percentage.toFixed(1)}%)`;
              tooltip += `</td>`;
              tooltip += `</tr>`;
            }
          });
          
          tooltip += `</table>`;
          
          return tooltip;
        }
      }
    };
  };

  // Chart click handler
  const handleChartClick = (params: any) => {
    // Handle bar chart clicks for grade filtering
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
    <div className={cn("space-y-0 bg-[rgb(243,244,246)] dark:bg-[rgb(36,36,40)] rounded-lg", className)}>
      {/* Header Toggle */}
      <div className="w-full bg-[rgb(243,244,246)] hover:bg-[rgb(243,244,246)] dark:bg-[rgb(36,36,40)] dark:hover:bg-[rgb(36,36,40)] transition-all duration-200 rounded-lg">
        <Button
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full justify-between h-12 px-4 bg-transparent hover:bg-transparent transition-all duration-200 rounded-lg group"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <TrendingUp className="h-5 w-5 text-primary group-hover:text-primary/80 transition-colors" />
            <span className="font-semibold text-base">{title || t('chart.gradeDistribution')}</span>
            {totalCount > 0 && (
              <Badge variant="secondary" className="h-6 px-2 text-sm bg-primary text-white font-medium shadow-sm inline-flex pointer-events-none min-w-[2rem] justify-center">
                {totalCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            )}
          </div>
        </Button>
      </div>

      {/* Chart Content */}
      {isExpanded && (
        <div className="relative p-4 rounded-xl bg-muted/20">
          <div className="mb-2 pt-3">
            <div className="flex flex-col gap-2 mb-2">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 sm:px-4">
                <div className="flex flex-col gap-2">
                  {/* 圖表類型切換按鈕 */}
              <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 w-full sm:w-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-7 px-1 sm:px-2 text-xs gap-1 flex-1 sm:flex-none min-w-0",
                    chartType === 'bar' 
                      ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100" 
                      : "bg-transparent hover:bg-white/50 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-400"
                  )}
                  onClick={() => setChartType('bar')}
                >
                  <BarChart3 className="h-3 w-3" />
                  <span className="truncate">{t('chart.barChart')}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-7 px-1 sm:px-2 text-xs gap-1 flex-1 sm:flex-none min-w-0",
                    chartType === 'stacked' 
                      ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100" 
                      : "bg-transparent hover:bg-white/50 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-400"
                  )}
                  onClick={() => setChartType('stacked')}
                >
                  <BarChart className="h-3 w-3" />
                  <span className="truncate">{t('chart.stackedNormalized')}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-7 px-1 sm:px-2 text-xs gap-1 flex-1 sm:flex-none min-w-0",
                    chartType === 'boxplot' 
                      ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100" 
                      : "bg-transparent hover:bg-white/50 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-400"
                  )}
                  onClick={() => setChartType('boxplot')}
                >
                  <BoxSelect className="h-3 w-3" />
                  <span className="truncate">{t('chart.boxPlot')}</span>
                </Button>
              </div>
            </div>
            
            {/* 篩選器下拉選單 - 支援多選 */}
            {filterOptions && filterOptions.length > 0 && onFilterChange && (
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto min-w-0">
                {filterLabel && (
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {(() => {
                      // Show plural form for multi-select chart types
                      if (chartType === 'stacked' || chartType === 'boxplot') {
                        // Add (s) for plural in English only
                        const isEnglish = !filterLabel.includes('課程') && !filterLabel.includes('教師') && 
                                        !filterLabel.includes('课程') && !filterLabel.includes('教师');
                        return isEnglish ? filterLabel + '(s)' : filterLabel;
                      }
                      return filterLabel;
                    })()}:
                  </span>
                )}
                {chartType === 'bar' ? (
                  // Single selection for bar chart
                  <Select 
                    value={Array.isArray(selectedFilter) ? selectedFilter[0] || 'all' : selectedFilter || 'all'} 
                    onValueChange={(value) => onFilterChange(value)}
                  >
                    <SelectTrigger className="w-full sm:max-w-[320px] md:max-w-[400px] h-8 min-w-0">
                      <SelectValue placeholder={t('common.all')}>
                        {(() => {
                          const currentValue = Array.isArray(selectedFilter) ? selectedFilter[0] || 'all' : selectedFilter || 'all';
                          if (currentValue === 'all') {
                            return t('common.all');
                          } else {
                            const option = filterOptions.find(opt => opt.value === currentValue);
                            return option ? option.label : currentValue;
                          }
                        })()}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-900 max-w-[90vw] sm:max-w-[400px]" position="popper" side="bottom" align="end" sideOffset={8}>
                      <SelectItem value="all" textValue={t('common.all')}>
                        <div className="flex items-center justify-between w-full min-w-0">
                          <span className="truncate flex-1 mr-2 min-w-0">{t('common.all')}</span>
                          <Badge variant="secondary" className="ml-auto text-xs bg-primary/10 text-primary hover:bg-primary/10 dark:bg-primary/20 dark:text-primary-foreground dark:hover:bg-primary/20 shrink-0">
                            {totalCount}
                          </Badge>
                        </div>
                      </SelectItem>
                      {filterOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value} textValue={option.label} className="pr-12">
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
                ) : (
                  // Multiple selection for stacked chart and box plot
                  <div className="relative w-full sm:w-auto min-w-0">
                    <MultiSelectDropdown
                      options={filterOptions.map((option): SelectOption => ({
                        value: option.value,
                        label: option.label,
                        count: option.count
                      }))}
                      selectedValues={Array.isArray(selectedFilter) ? selectedFilter : (selectedFilter ? [selectedFilter] : [])}
                      onSelectionChange={(values: string[]) => {
                        if (values.length === 0) {
                          onFilterChange([]);
                        } else {
                          onFilterChange(values);
                        }
                      }}
                      placeholder={t('common.all')}
                      className="w-full sm:max-w-[320px] md:max-w-[400px]"
                      showCounts={true}
                      maxHeight="max-h-48"
                      totalCount={totalCount}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* 統計數據 - 重新組織 GPA 和標準差在同一側，移除評論數避免重複 */}
        {statistics.mean !== null && statistics.standardDeviation !== null && (
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-2">
            {/* 移動端：單行布局 - 移除評論數，只顯示 GPA 和標準差 */}
            <div className="flex flex-row justify-center items-center gap-6 sm:hidden">
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
            </div>
            
            {/* 桌面端：原有布局 - 增加左右內邊距 */}
            <div className="hidden sm:flex flex-col sm:flex-row gap-4 sm:gap-6 sm:px-4">
              <div className="flex flex-col items-start">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
                  {t('sort.averageGPA')}
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
            
            {/* 桌面端：學生評論數 - 增加右內邊距 */}
            <div className="hidden sm:flex flex-col items-center sm:items-end shrink-0 sm:px-4">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-0.5">
                {t('review.studentReviews')}
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
          ref={chartRef}
          key={chartKey} // Force re-render when theme changes
          option={getMobileOptimizedOptions(
            chartType === 'bar' ? getBarChartOptions() : 
            chartType === 'stacked' ? getStackedNormalizedOptions() : 
            getBoxPlotOptions()
          )}
          style={{ height: `${responsiveHeight + 32}px`, width: '100%' }}
          opts={getEChartsOpts()}
          onEvents={getChartEvents()}
          notMerge={true}
          lazyUpdate={false}
          theme={isDark ? 'dark' : 'light'}
          onChartReady={(chartInstance: ECharts) => {
            // Additional mobile tooltip handling
            if (isMobile) {
              try {
                // Override internal mouse/touch event handlers to prevent tooltip auto-hide
                const zr = chartInstance.getZr();
                if (zr && (zr as any).handler) {
                  const handlers = (zr as any).handler._handlers;
                  
                  if (handlers) {
                    // Override handlers to prevent tooltip hiding
                    if (handlers.mouseout) {
                      handlers.mouseout = [];
                    }
                    if (handlers.globalout) {
                      handlers.globalout = [];
                    }
                    
                    // Intercept mousemove to prevent unwanted tooltip updates
                    if (handlers.mousemove && Array.isArray(handlers.mousemove)) {
                      handlers.mousemove = handlers.mousemove.filter((h: any) => {
                        return !h.name?.includes('tooltip');
                      });
                    }
                  }
                }
              } catch (error) {
                // Silently fail - chart will still work without custom mobile handling
              }
            }
          }}
        />
          </div>
        </div>
      )}
    </div>
  );
});

export default GradeDistributionChart; 