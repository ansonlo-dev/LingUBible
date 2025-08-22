import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelectDropdown, SelectOption } from '@/components/ui/multi-select-dropdown';
import { 
  ArrowLeft, 
  Star, 
  MessageSquare, 
  Calendar, 
  Mail, 
  Loader2, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Users,
  UserCheck,
  GraduationCap,
  Info,
  CalendarDays,
  BookOpen,
  BookText
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/hooks/useLanguage';
import { useCourseDetailOptimized } from '@/hooks/useCourseDetailOptimized';
import { useIsMobile } from '@/hooks/use-mobile';
import { CourseService, type Course, type CourseReviewInfo, type CourseTeachingInfo } from '@/services/api/courseService';
import { CourseReviewsList } from '@/components/features/reviews/CourseReviewsList';
import { getCourseTitle, translateDepartmentName, getTeachingLanguageName, extractInstructorNameForSorting, getFacultiesForMultiDepartment } from '@/utils/textUtils';
import { getCurrentTermName, getCurrentTermCode, isCurrentTerm } from '@/utils/dateUtils';
import { FavoriteButton } from '@/components/ui/FavoriteButton';
import { PersistentCollapsibleSection } from '@/components/ui/PersistentCollapsibleSection';
import GradeDistributionChart from '@/components/features/reviews/GradeDistributionChart';
import { calculateGradeDistributionFromReviews } from '@/utils/gradeUtils';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';

// Faculty mapping function - copied from Lecturers.tsx
const getFacultyByDepartment = (department: string): string => {
  // First try to extract raw department name if it's translated
  const rawDepartment = extractRawDepartmentName(department);
  
  const facultyMapping: { [key: string]: string } = {
    // mark update
    // Affiliated Units
    'LIFE': 'faculty.affiliatedUnits',
    // Faculty of Arts
    'AIGCS': 'faculty.arts',
    'CEAL': 'faculty.arts',
    'CFCI': 'faculty.arts',
    'CLEAC': 'faculty.arts',
    'CHI': 'faculty.arts',
    'CS': 'faculty.arts',
    'DACI': 'faculty.arts',
    'ENG': 'faculty.arts',
    'HIST': 'faculty.arts',
    'PHILO': 'faculty.arts',
    'TRAN': 'faculty.arts',
    // Faculty of Business
    'ACCT': 'faculty.business',
    'BUS': 'faculty.business',
    'FIN': 'faculty.business',
    'MGT': 'faculty.business',
    'MKT': 'faculty.business',
    'ORM': 'faculty.business',
    'HKIBS': 'faculty.business',
    'IIRM': 'faculty.business',
    // Faculty of Social Sciences
    'ECON': 'faculty.socialSciences',
    'GOV': 'faculty.socialSciences',
    'PSY': 'faculty.socialSciences',
    'SOCSC': 'faculty.socialSciences',
    'SOCSP': 'faculty.socialSciences',
    // School of Data Science
    'DAI': 'faculty.dataScience',
    'DIDS': 'faculty.dataScience',
    'LEODCIDS': 'faculty.dataScience',
    'SDS': 'faculty.dataScience',
    // School of Graduate Studies
    'GS': 'faculty.graduateStudies',
    // School of Interdisciplinary Studies
    'SIS': 'faculty.interdisciplinaryStudies',
    'SU': 'faculty.interdisciplinaryStudies',
    'WBLMP': 'faculty.interdisciplinaryStudies',
    // Research Institutes, Centres and Programmes
    'APIAS': 'faculty.researchInstitutes',
    'IPS': 'faculty.researchInstitutes',
    // Units and Offices
    'OSL': 'faculty.unitsOffices',
    'TLC': 'faculty.unitsOffices'
  };
  
  return facultyMapping[rawDepartment] || '';
};

// Helper function to extract raw department name from translated names
const extractRawDepartmentName = (department: string): string => {
  // If it's already a raw department name, return as is
  const rawDepartmentNames = [
    'Chinese', 'Cultural Studies', 'Digital Arts and Creative Industries', 'English', 
    'History', 'Philosophy', 'Translation', 'Centre for English and Additional Languages',
    'Chinese Language Education and Assessment Centre', 'Accountancy', 'Finance', 
    'Management', 'Marketing and International Business', 'Operations and Risk Management',
    'Psychology', 'Economics', 'Government and International Affairs', 
    'Sociology and Social Policy', 'Science Unit',
    'Wong Bing Lai Music and Performing Arts Unit', 'LEO Dr David P. Chan Institute of Data Science'
  ];
  
  if (rawDepartmentNames.includes(department)) {
    return department;
  }
  
  // Create mapping from translated names back to raw names
  const translatedToRawMapping: { [key: string]: string } = {
    // English translations
    'Department of Chinese': 'Chinese',
    'Department of Cultural Studies': 'Cultural Studies',
    'Department of Digital Arts and Creative Industries': 'Digital Arts and Creative Industries',
    'Department of English': 'English',
    'Department of History': 'History',
    'Department of Philosophy': 'Philosophy',
    'Department of Translation': 'Translation',
    'Centre for English and Additional Languages': 'Centre for English and Additional Languages',
    'Chinese Language Education and Assessment Centre': 'Chinese Language Education and Assessment Centre',
    'Department of Accountancy': 'Accountancy',
    'Department of Finance': 'Finance',
    'Department of Management': 'Management',
    'Department of Marketing and International Business': 'Marketing and International Business',
    'Department of Operations and Risk Management': 'Operations and Risk Management',
    'Department of Psychology': 'Psychology',
    'Department of Economics': 'Economics',
    'Department of Government and International Affairs': 'Government and International Affairs',
    'Department of Sociology and Social Policy': 'Sociology and Social Policy',
    'Science Unit': 'Science Unit',
    'Wong Bing Lai Music and Performing Arts Unit': 'Wong Bing Lai Music and Performing Arts Unit',
    'LEO Dr David P. Chan Institute of Data Science': 'LEO Dr David P. Chan Institute of Data Science',
    
    // Chinese Traditional translations
    '中文系': 'Chinese',
    '文化研究系': 'Cultural Studies',
    '數碼藝術及創意產業系': 'Digital Arts and Creative Industries',
    '英文系': 'English',
    '歷史系': 'History',
    '哲學系': 'Philosophy',
    '翻譯系': 'Translation',
    '英語及外語教學中心': 'Centre for English and Additional Languages',
    '中國語文教學與測試中心': 'Chinese Language Education and Assessment Centre',
    '會計學系': 'Accountancy',
    '金融學系': 'Finance',
    '管理學學系': 'Management',
    '市場及國際企業學系': 'Marketing and International Business',
    '運營與風險管理學系': 'Operations and Risk Management',
    '心理學系': 'Psychology',
    '經濟學系': 'Economics',
    '政府與國際事務學系': 'Government and International Affairs',
    '社會學及社會政策系': 'Sociology and Social Policy',
    '科學教研組': 'Science Unit',
    '黃炳禮音樂及演藝部': 'Wong Bing Lai Music and Performing Arts Unit',
    '嶺南教育機構陳斌博士數據科學研究所': 'LEO Dr David P. Chan Institute of Data Science',
    
    // Chinese Simplified translations (only unique ones)
    '数码艺术及创意产业系': 'Digital Arts and Creative Industries',
    '历史系': 'History',
    '哲学系': 'Philosophy',
    '翻译系': 'Translation',
    '英语及外语教学中心': 'Centre for English and Additional Languages',
    '中国语文教学与测试中心': 'Chinese Language Education and Assessment Centre',
    '会计学系': 'Accountancy',
    '金融学系': 'Finance',
    '管理学学系': 'Management',
    '市场及国际企业学系': 'Marketing and International Business',
    '运营与风险管理学系': 'Operations and Risk Management',
    '心理学系': 'Psychology',
    '经济学系': 'Economics',
    '政府与国际事务学系': 'Government and International Affairs',
    '社会学及社会政策系': 'Sociology and Social Policy',
    '科学教研组': 'Science Unit',
    '黄炳礼音乐及演艺部': 'Wong Bing Lai Music and Performing Arts Unit',
    '岭南教育机构陈斌博士数据科学研究所': 'LEO Dr David P. Chan Institute of Data Science'
  };
  
  return translatedToRawMapping[department] || department;
};

const CourseDetail = () => {
  const { courseCode } = useParams<{ courseCode: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const isMobile = useIsMobile();
  const [pendingTeachingLanguageFilter, setPendingTeachingLanguageFilter] = useState<string | null>(null);
  const [pendingTermFilter, setPendingTermFilter] = useState<string | null>(null);
  
  // Teaching language tooltip states for mobile
  const [teachingLanguageTooltipStates, setTeachingLanguageTooltipStates] = useState<{[key: string]: boolean}>({});
  const [teachingLanguageTapCounts, setTeachingLanguageTapCounts] = useState<{[key: string]: number}>({});
  const [termTooltipStates, setTermTooltipStates] = useState<{[key: string]: boolean}>({});
  const [termTapCounts, setTermTapCounts] = useState<{[key: string]: number}>({});
  
  // Refs for tooltip elements to handle click outside
  const tooltipRefs = useRef<{[key: string]: HTMLElement | null}>({});
  const timeoutRefs = useRef<{[key: string]: NodeJS.Timeout | null}>({});

  // Clear pending states when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setPendingTeachingLanguageFilter(null);
      setPendingTermFilter(null);
    };

    // Add a small delay to avoid clearing immediately when clicking the badge itself
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Clear pending states after timeout
  useEffect(() => {
    if (pendingTeachingLanguageFilter || pendingTermFilter) {
      const timer = setTimeout(() => {
        setPendingTeachingLanguageFilter(null);
        setPendingTermFilter(null);
      }, 3000); // Clear after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [pendingTeachingLanguageFilter, pendingTermFilter]);

  // Handle clicks outside tooltips to close them (same pattern as MyReviews.tsx)
  useEffect(() => {
    if (!isMobile) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement;
      
      // Get all currently active tooltip keys from both term and teaching language states
      const activeTermKeys = Object.keys(termTooltipStates).filter(key => termTooltipStates[key]).map(key => `term-${key}`);
      const activeLanguageKeys = Object.keys(teachingLanguageTooltipStates).filter(key => teachingLanguageTooltipStates[key]).map(key => `lang-${key}`);
      const allActiveKeys = [...activeTermKeys, ...activeLanguageKeys];
      
      if (allActiveKeys.length === 0) return;

      // Add a small delay to allow onClick handlers to process first
      // This prevents interference with the two-tap functionality
      setTimeout(() => {
        // Check if click is outside all active tooltips
        let clickedInsideAnyTooltip = false;
        
        for (const key of allActiveKeys) {
          const tooltipElement = tooltipRefs.current[key];
          if (tooltipElement && tooltipElement.contains(target)) {
            clickedInsideAnyTooltip = true;
            break;
          }
        }

        // If clicked outside all tooltips, close all active tooltips
        if (!clickedInsideAnyTooltip) {
          // Close term tooltips
          Object.keys(termTooltipStates).filter(key => termTooltipStates[key]).forEach(termKey => {
            const refKey = `term-${termKey}`;
            // Clear timeout
            if (timeoutRefs.current[refKey]) {
              clearTimeout(timeoutRefs.current[refKey]);
              timeoutRefs.current[refKey] = null;
            }
            
            // Reset states
            setTermTapCounts(prev => ({ ...prev, [termKey]: 0 }));
            setTermTooltipStates(prev => ({ ...prev, [termKey]: false }));
          });
          
          // Close teaching language tooltips
          Object.keys(teachingLanguageTooltipStates).filter(key => teachingLanguageTooltipStates[key]).forEach(langKey => {
            const refKey = `lang-${langKey}`;
            // Clear timeout
            if (timeoutRefs.current[refKey]) {
              clearTimeout(timeoutRefs.current[refKey]);
              timeoutRefs.current[refKey] = null;
            }
            
            // Reset states
            setTeachingLanguageTapCounts(prev => ({ ...prev, [langKey]: 0 }));
            setTeachingLanguageTooltipStates(prev => ({ ...prev, [langKey]: false }));
          });
        }
      }, 10); // Small delay to let onClick handlers process first
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMobile, termTooltipStates, teachingLanguageTooltipStates]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(timeoutRefs.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  // Helper function to generate responsive teaching language labels
  const getResponsiveTeachingLanguageLabel = (languageCode: string): string => {
    const languageName = getTeachingLanguageName(languageCode, t);
    // Always use dash separator for consistency with catalog pages
    return `${languageCode} - ${languageName}`;
  };

  // 根據評分獲取漸變背景色（0-5分，紅色到綠色）
  const getRatingGradientColor = (value: number) => {
    // 確保評分在0-5範圍內
    const clampedValue = Math.max(0, Math.min(5, value));
    
    // 將0-5的評分映射到0-1的範圍
    const ratio = clampedValue / 5;
    
    // 使用HSL色彩空間創建從紅色(0°)到綠色(120°)的漸變
    const hue = ratio * 120; // 0到120度
    const saturation = 95; // 提高飽和度到95%，讓顏色更鮮艷
    
    // 統一使用深色主題的亮度設定，確保白色文字可讀性
    const lightness = 30; // 統一使用30%亮度，讓顏色更深更突出
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  // 統計框組件 - 評分類型在框外，只有數字在框內
  const StatBox = ({ value, label, labelShort, hasValidData = true }: { 
    value: number | string, 
    label: string,
    labelShort?: string,
    hasValidData?: boolean
  }) => {
    const numericValue = typeof value === 'number' ? value : parseFloat(value.toString());
    const isValid = hasValidData && numericValue > 0;
    
    const backgroundColor = isValid 
      ? getRatingGradientColor(numericValue) 
      : '#4B5563'; // 統一使用深色灰色
    
    const displayValue = isValid ? numericValue.toFixed(2).replace(/\.?0+$/, '') : 'N/A';
    
    return (
      <div className="flex flex-col items-center min-w-0">
        <div className="text-xs sm:text-sm text-muted-foreground text-center leading-tight">
          <span className="hidden sm:inline">{label}</span>
          <span className="sm:hidden">{labelShort || label}</span>
        </div>
        <div 
          className="flex items-center justify-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-white font-bold text-xs sm:text-sm mt-1"
          style={{ backgroundColor }}
        >
          {displayValue}
        </div>
      </div>
    );
  };
  
  // Get current term info for offer badge
  const currentTermName = getCurrentTermName();
  const currentTermCode = getCurrentTermCode();
  
  // 使用優化的 hook
  const { data, loading, error, teachingInfoLoading, reviewsLoading } = useCourseDetailOptimized(
    courseCode || null,
    user?.$id,
    language,
    currentTermCode
  );

  // 篩選狀態
  const [selectedGradeChartFilter, setSelectedGradeChartFilter] = useState<string | string[]>('all');
  const [activeTeachingTab, setActiveTeachingTab] = useState<string>('lecture');
  const [externalGradeFilter, setExternalGradeFilter] = useState<string>('');
  const [selectedServiceLearningFilter, setSelectedServiceLearningFilter] = useState<string[]>([]);

  // Grade distribution chart filter state
  const [selectedTermFilter, setSelectedTermFilter] = useState<string | string[]>('all');
  const [selectedTeachingLanguageFilter, setSelectedTeachingLanguageFilter] = useState<string | string[]>('all');

  // 解構數據
  const { course, courseStats, teachingInfo, reviews: allReviews, allReviewsForChart, isOfferedInCurrentTerm, detailedStats } = data;

  // Generate filter options for grade distribution chart (instructors)
  const gradeChartFilterOptions = React.useMemo(() => {
    if (!allReviewsForChart || allReviewsForChart.length === 0) return [];

    // Count occurrences of each instructor-session combination
    const instructorSessionCounts = new Map<string, number>();
    const instructorSessionLabels = new Map<string, string>();

    allReviewsForChart.forEach(reviewInfo => {
      try {
        const instructorDetails = JSON.parse(reviewInfo.review.instructor_details);
        
        instructorDetails.forEach((detail: any) => {
          const key = `${detail.instructor_name}|${detail.session_type}`;
          const count = instructorSessionCounts.get(key) || 0;
          instructorSessionCounts.set(key, count + 1);
          
          // Store the formatted label
          const sessionTypeTranslated = detail.session_type === 'Lecture' ? t('sessionType.lecture') : t('sessionType.tutorial');
          const instructorDisplayName = detail.instructor_name === 'UNKNOWN' 
            ? (language === 'en' ? 'Unknown instructor' : '未知教師')
            : detail.instructor_name;
          instructorSessionLabels.set(key, `${instructorDisplayName} (${sessionTypeTranslated})`);
        });
      } catch (error) {
        console.warn('Failed to parse instructor details:', error);
      }
    });

    return Array.from(instructorSessionCounts.entries())
      .map(([key, count]) => ({
        value: key,
        label: instructorSessionLabels.get(key) || key,
        count,
        // Add sorting helpers
        instructorName: key.split('|')[0],
        sessionType: key.split('|')[1]
      }))
      .sort((a, b) => {
        // First sort by session type (Lecture before Tutorial)
        if (a.sessionType !== b.sessionType) {
          return a.sessionType === 'Lecture' ? -1 : 1;
        }
        
        // Within same session type, sort by instructor name alphabetically
        return a.instructorName.localeCompare(b.instructorName);
      })
      .map(({ value, label, count }) => ({ value, label, count })); // Remove extra sorting fields
  }, [allReviewsForChart, t]);

  // Filter reviews for grade distribution chart based on selected instructor(s)
  const filteredReviewsForChart = React.useMemo(() => {
    if (!allReviewsForChart || allReviewsForChart.length === 0) return [];
    
    // Handle both single and multiple selections
    const selectedValues = Array.isArray(selectedGradeChartFilter) ? selectedGradeChartFilter : [selectedGradeChartFilter];
    
    if (selectedValues.length === 0 || selectedValues.includes('all')) {
      return allReviewsForChart;
    }
    
    // Parse all selected instructor-session combinations
    const targetInstructorSessions = selectedValues.map(value => {
      const [targetInstructor, targetSessionType] = value.split('|');
      return { targetInstructor, targetSessionType };
    });
    
    return allReviewsForChart.filter(reviewInfo => {
      try {
        const instructorDetails = JSON.parse(reviewInfo.review.instructor_details);
        
        // Check if any of the instructor details match any of the selected combinations
        return instructorDetails.some((detail: any) => 
          targetInstructorSessions.some(({ targetInstructor, targetSessionType }) =>
            detail.instructor_name === targetInstructor && 
            detail.session_type === targetSessionType
          )
        );
      } catch (error) {
        console.warn('Failed to parse instructor details:', error);
        return false;
      }
    });
  }, [allReviewsForChart, selectedGradeChartFilter]);

  // 獲取所有可用的學期及其計數
  const availableTermsWithCounts = React.useMemo(() => {
    // Count teaching records per term
    const termCountMap = new Map<string, { term: any; count: number }>();
    
    teachingInfo.forEach(info => {
      const termCode = info.term.term_code;
      if (termCountMap.has(termCode)) {
        termCountMap.get(termCode)!.count++;
      } else {
        termCountMap.set(termCode, { term: info.term, count: 1 });
      }
    });
    
    // Convert to array and sort by term code (descending)
    return Array.from(termCountMap.values())
      .sort((a, b) => b.term.term_code.localeCompare(a.term.term_code));
  }, [teachingInfo]);

  // 獲取所有可用的教學語言及其計數
  const availableTeachingLanguagesWithCounts = React.useMemo(() => {
    // Count teaching records per teaching language
    const languageCountMap = new Map<string, { language: string; count: number }>();
    
    teachingInfo.forEach(info => {
      const languageCode = info.teachingLanguage;
      if (languageCountMap.has(languageCode)) {
        languageCountMap.get(languageCode)!.count++;
      } else {
        languageCountMap.set(languageCode, { language: languageCode, count: 1 });
      }
    });
    
    // Define the desired order: E, C, P, 1, 2, 3, 4, 5
    const teachingLanguageOrder = ['E', 'C', 'P', '1', '2', '3', '4', '5'];
    
    // Convert to array and sort by custom order
    return Array.from(languageCountMap.values())
      .sort((a, b) => {
        const aIndex = teachingLanguageOrder.indexOf(a.language);
        const bIndex = teachingLanguageOrder.indexOf(b.language);
        
        // If both languages are in the order list, sort by their position
        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex;
        }
        
        // If only one is in the order list, it comes first
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        
        // If neither is in the order list, sort alphabetically
        return a.language.localeCompare(b.language);
      });
  }, [teachingInfo]);

  // 根據選定的學期和教學語言篩選教學信息
  const filteredTeachingInfo = React.useMemo(() => {
    // Handle both single and multiple selections for terms
    const selectedTermValues = Array.isArray(selectedTermFilter) ? selectedTermFilter : [selectedTermFilter];
    // Handle both single and multiple selections for teaching languages
    const selectedLanguageValues = Array.isArray(selectedTeachingLanguageFilter) ? selectedTeachingLanguageFilter : [selectedTeachingLanguageFilter];
    
    let filtered = teachingInfo;
    
    // Filter by terms
    if (selectedTermValues.length > 0 && !selectedTermValues.includes('all')) {
      filtered = filtered.filter(info => selectedTermValues.includes(info.term.term_code));
    }
    
    // Filter by teaching languages
    if (selectedLanguageValues.length > 0 && !selectedLanguageValues.includes('all')) {
      filtered = filtered.filter(info => selectedLanguageValues.includes(info.teachingLanguage));
    }
    
    return filtered;
  }, [teachingInfo, selectedTermFilter, selectedTeachingLanguageFilter]);

  // 教學語言徽章點擊處理器
  const handleTeachingLanguageBadgeClick = (languageCode: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    if (isMobile) {
      // Mobile/tablet: require 2 taps to apply filter
      const currentTapCount = teachingLanguageTapCounts[languageCode] || 0;
      const newTapCount = currentTapCount + 1;
      
      // Clear existing timeout for this key
      const refKey = `lang-${languageCode}`;
      if (timeoutRefs.current[refKey]) {
        clearTimeout(timeoutRefs.current[refKey]);
      }
      
      setTeachingLanguageTapCounts(prev => ({
        ...prev,
        [languageCode]: newTapCount
      }));
      
      if (newTapCount === 1) {
        // First tap: show tooltip
        setTeachingLanguageTooltipStates(prev => ({
          ...prev,
          [languageCode]: true
        }));
        
        // Reset after 3 seconds
        timeoutRefs.current[refKey] = setTimeout(() => {
          setTeachingLanguageTapCounts(prev => ({
            ...prev,
            [languageCode]: 0
          }));
          setTeachingLanguageTooltipStates(prev => ({
            ...prev,
            [languageCode]: false
          }));
        }, 3000);
      } else if (newTapCount === 2) {
        // Second tap: apply filter and close tooltip
        applyTeachingLanguageFilter(languageCode);
        resetTeachingLanguageTooltipState(languageCode);
      }
    } else {
      // Desktop: 1 tap to apply filter
      applyTeachingLanguageFilter(languageCode);
    }
  };
  
  // Apply teaching language filter
  const applyTeachingLanguageFilter = (languageCode: string) => {
    const currentValues = Array.isArray(selectedTeachingLanguageFilter) ? selectedTeachingLanguageFilter : (selectedTeachingLanguageFilter === 'all' ? [] : [selectedTeachingLanguageFilter]);
    const isSelected = currentValues.includes(languageCode);
    
    if (isSelected) {
      // Remove from selection
      const newValues = currentValues.filter(v => v !== languageCode);
      setSelectedTeachingLanguageFilter(newValues.length === 0 ? 'all' : newValues);
    } else {
      // Add to selection
      setSelectedTeachingLanguageFilter([...currentValues, languageCode]);
    }
  };
  
  // Reset teaching language tooltip state
  const resetTeachingLanguageTooltipState = (languageCode: string) => {
    // Clear timeout
    const refKey = `lang-${languageCode}`;
    if (timeoutRefs.current[refKey]) {
      clearTimeout(timeoutRefs.current[refKey]);
      timeoutRefs.current[refKey] = null;
    }
    
    setTeachingLanguageTapCounts(prev => ({
      ...prev,
      [languageCode]: 0
    }));
    setTeachingLanguageTooltipStates(prev => ({
      ...prev,
      [languageCode]: false
    }));
  };

  const handleTermBadgeClick = (termCode: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    if (isMobile) {
      // Mobile/tablet: require 2 taps to apply filter
      const currentTapCount = termTapCounts[termCode] || 0;
      const newTapCount = currentTapCount + 1;
      
      // Clear existing timeout for this key
      const refKey = `term-${termCode}`;
      if (timeoutRefs.current[refKey]) {
        clearTimeout(timeoutRefs.current[refKey]);
      }
      
      setTermTapCounts(prev => ({
        ...prev,
        [termCode]: newTapCount
      }));
      
      if (newTapCount === 1) {
        // First tap: show tooltip
        setTermTooltipStates(prev => ({
          ...prev,
          [termCode]: true
        }));
        
        // Reset after 3 seconds
        timeoutRefs.current[refKey] = setTimeout(() => {
          setTermTapCounts(prev => ({
            ...prev,
            [termCode]: 0
          }));
          setTermTooltipStates(prev => ({
            ...prev,
            [termCode]: false
          }));
        }, 3000);
      } else if (newTapCount === 2) {
        // Second tap: apply filter and close tooltip
        applyTermFilter(termCode);
        resetTermTooltipState(termCode);
      }
    } else {
      // Desktop: 1 tap to apply filter
      applyTermFilter(termCode);
    }
  };
  
  // Apply term filter
  const applyTermFilter = (termCode: string) => {
    const currentValues = Array.isArray(selectedTermFilter) ? selectedTermFilter : (selectedTermFilter === 'all' ? [] : [selectedTermFilter]);
    const isSelected = currentValues.includes(termCode);
    
    if (isSelected) {
      // Remove from selection
      const newValues = currentValues.filter(v => v !== termCode);
      setSelectedTermFilter(newValues.length === 0 ? 'all' : newValues);
    } else {
      // Add to selection
      setSelectedTermFilter([...currentValues, termCode]);
    }
  };
  
  // Reset term tooltip state
  const resetTermTooltipState = (termCode: string) => {
    // Clear timeout
    const refKey = `term-${termCode}`;
    if (timeoutRefs.current[refKey]) {
      clearTimeout(timeoutRefs.current[refKey]);
      timeoutRefs.current[refKey] = null;
    }
    
    setTermTapCounts(prev => ({
      ...prev,
      [termCode]: 0
    }));
    setTermTooltipStates(prev => ({
      ...prev,
      [termCode]: false
    }));
  };

  // Service learning filter handler
  const handleServiceLearningToggle = (serviceType: string) => {
    setSelectedServiceLearningFilter(prev => {
      const isSelected = prev.includes(serviceType);
      if (isSelected) {
        // Remove from selection
        return prev.filter(type => type !== serviceType);
      } else {
        // Add to selection (replace existing selection for simplicity)
        return [serviceType];
      }
    });
  };

  const handleInstructorClick = (instructorName: string, event?: React.MouseEvent) => {
    // This function is now simplified since we're using <a> tags
    // The browser will handle navigation naturally
  };

  // Handle offer badge click to navigate to courses with current term filter
  const handleOfferedBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Navigate to courses catalog with current term filter applied
    const searchParams = new URLSearchParams();
    searchParams.set('offeredTerm', currentTermCode);
    
    navigate(`/courses?${searchParams.toString()}`);
  };

  // Handle scroll to specific review when review_id is in URL
  useEffect(() => {
    const reviewId = searchParams.get('review_id');
    if (reviewId && !reviewsLoading) {
      let hasScrolled = false;
      let attemptCount = 0;
      const maxAttempts = 3;
      
      const scrollToReview = () => {
        if (hasScrolled || attemptCount >= maxAttempts) return false;
        
        attemptCount++;
        const reviewElement = document.querySelector(`[data-review-id="${reviewId}"]`);
        if (reviewElement) {
          reviewElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          hasScrolled = true;
          return true;
        }
        return false;
      };
      
      // Try multiple times with increasing delays, but stop if successful
      const timeout1 = setTimeout(() => {
        if (!scrollToReview() && attemptCount < maxAttempts) {
          const timeout2 = setTimeout(() => {
            if (!scrollToReview() && attemptCount < maxAttempts) {
              setTimeout(() => scrollToReview(), 700);
            }
          }, 500);
        }
      }, 300);
      
      // Cleanup function to prevent memory leaks
      return () => {
        hasScrolled = true; // Prevent any pending scrolls
      };
    }
  }, [searchParams, reviewsLoading]);

  // Auto-switch to available tab when current tab has no records
  useEffect(() => {
    if (teachingInfo && teachingInfo.length > 0) {
      const lectureCount = teachingInfo.filter(info => info.sessionType === 'Lecture').length;
      const tutorialCount = teachingInfo.filter(info => info.sessionType === 'Tutorial').length;
      
      // If current active tab has no records, switch to available tab
      if (activeTeachingTab === 'lecture' && lectureCount === 0 && tutorialCount > 0) {
        setActiveTeachingTab('tutorial');
      } else if (activeTeachingTab === 'tutorial' && tutorialCount === 0 && lectureCount > 0) {
        setActiveTeachingTab('lecture');
      }
    }
  }, [teachingInfo, activeTeachingTab]);

  if (loading) {
    return (
      <div className="mx-auto px-4 lg:px-8 xl:px-16 py-6">
        <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">{t('pages.courseDetail.loadingCourseData')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="mx-auto px-4 lg:px-8 xl:px-16 py-6">
        <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertCircle className="h-16 w-16 text-destructive" />
              </div>
              <CardTitle className="text-xl">{t('pages.courseDetail.loadFailed')}</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                {error || t('pages.courseDetail.courseNotFound')}
              </p>
              <Button onClick={() => navigate('/courses')} className="h-auto py-3 text-sm font-medium w-full sm:w-auto sm:text-base">
                <span className="text-center leading-tight">{t('pages.courseDetail.backToCoursesCatalog')}</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto px-4 lg:px-8 xl:px-16 py-6 pb-20 overflow-hidden min-w-0">
      {/* Course Header - Always visible above tabs */}
      <div className="mb-6">
        <Card className="transparent-info-card">
          <CardContent className="p-6">
            {/* Course info section with buttons */}
            <div className="mb-4">
              {/* Desktop/Tablet: Course code and buttons in same row */}
              <div className="hidden md:flex md:items-center md:justify-between md:gap-4 mb-2">
                <CardTitle className="text-2xl font-mono flex items-center gap-2 min-w-0">
                  <BookText className="h-7 w-7 text-primary" />
                  {course.course_code}
                </CardTitle>
                {/* Action buttons - desktop/tablet only inline */}
                <div className="shrink-0 flex items-center gap-2">
                  <FavoriteButton
                    type="course"
                    itemId={course.course_code}
                    size="lg"
                    showText={true}
                    variant="outline"
                  />
                  <Button 
                    className="h-10 gradient-primary hover:opacity-90 text-white"
                    onClick={() => navigate(`/write-review/${course.course_code}`)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {t('review.writeReview')}
                  </Button>
                  <button 
                    onClick={() => navigate('/courses')}
                    className="h-10 px-3 text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="text-sm">{t('common.back')}</span>
                  </button>
                </div>
              </div>

              {/* Desktop/Tablet: Course titles */}
              <div className="hidden md:block mb-3">
                {/* 英文課程名稱 - 作為副標題 */}
                <p className="text-lg text-gray-600 dark:text-gray-400 mt-1 font-medium min-h-[1.5rem]">
                  {course.course_title}
                </p>
                {/* 中文課程名稱 - 作為次副標題（只在中文模式下顯示） */}
                {(language === 'zh-TW' || language === 'zh-CN') && (() => {
                  const chineseName = language === 'zh-TW' ? course.course_title_tc : course.course_title_sc;
                  return chineseName && (
                    <p className="text-base text-gray-500 dark:text-gray-500 mt-1 min-h-[1.25rem]">
                      {chineseName}
                    </p>
                  );
                })()}
              </div>

              {/* Mobile: Course code with back button on same row */}
              <div className="md:hidden mb-3">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <CardTitle className="text-2xl font-mono flex items-center gap-2 min-w-0">
                    <BookText className="h-7 w-7 text-primary" />
                    {course.course_code}
                  </CardTitle>
                  <button 
                    onClick={() => navigate('/courses')}
                    className="h-10 px-3 text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2 shrink-0"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="text-sm">{t('common.back')}</span>
                  </button>
                </div>

                {/* Course titles */}
                <div>
                  {/* 英文課程名稱 - 作為副標題 */}
                  <p className="text-lg text-gray-600 dark:text-gray-400 mt-1 font-medium min-h-[1.5rem]">
                    {course.course_title}
                  </p>
                  {/* 中文課程名稱 - 作為次副標題（只在中文模式下顯示） */}
                  {(language === 'zh-TW' || language === 'zh-CN') && (() => {
                    const chineseName = language === 'zh-TW' ? course.course_title_tc : course.course_title_sc;
                    return chineseName && (
                      <p className="text-base text-gray-500 dark:text-gray-500 mt-1 min-h-[1.25rem]">
                        {chineseName}
                      </p>
                    );
                  })()}
                </div>
              </div>
            </div>
            
            {/* Action buttons - mobile only, separate row (excluding back button) */}
            <div className="md:hidden flex flex-col gap-2 mb-4">
              <div className="flex flex-row gap-2">
                <div className="flex-1">
                  <FavoriteButton
                    type="course"
                    itemId={course.course_code}
                    size="lg"
                    showText={true}
                    variant="outline"
                    className="w-full"
                  />
                </div>
                <div className="flex-1">
                  <Button 
                    className="h-10 gradient-primary hover:opacity-90 text-white w-full"
                    onClick={() => navigate(`/write-review/${course.course_code}`)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {t('review.writeReview')}
                  </Button>
                </div>
              </div>
            </div>
            
            {/* 系所徽章 - 使用全寬度 */}
            {course.department && (
              <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mb-4 min-h-[2rem] overflow-hidden">
                {/* Faculty Badges - Support multi-department */}
                {getFacultiesForMultiDepartment(course.department).map((facultyKey, index) => (
                  <Badge 
                    key={facultyKey}
                    variant="outline"
                    className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 shrink-0 w-fit"
                  >
                    {t(facultyKey)}
                  </Badge>
                ))}
                {/* Department Badge */}
                <Badge 
                  variant="outline"
                  className="text-xs bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 shrink-0 w-fit"
                >
                  <span className="break-words hyphens-auto">
                    {translateDepartmentName(course.department, t)}
                  </span>
                </Badge>
                {/* Current Term Offering Badge */}
                {isOfferedInCurrentTerm !== null && (
                  <Badge 
                    variant={isOfferedInCurrentTerm ? "default" : "outline"}
                    className={`text-xs cursor-pointer transition-colors ${
                      isOfferedInCurrentTerm 
                        ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' 
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                    }`}
                    onClick={handleOfferedBadgeClick}
                  >
                    <div className="flex items-center gap-1">
                      {isOfferedInCurrentTerm ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      <span>
                        {isOfferedInCurrentTerm ? t('offered.yes') : t('offered.no')} ({currentTermName})
                      </span>
                    </div>
                  </Badge>
                )}
              </div>
            )}
            
            {/* 課程基本統計信息 - 響應式佈局 */}
            <div className="pt-4">
              {/* Mobile and Tablet Portrait: 統計在兩行 */}
              <div className="grid grid-cols-1 gap-3 lg:hidden">
                <div className="grid grid-cols-3 gap-2">
                  {/* 平均工作量 */}
                  <StatBox
                    value={detailedStats.averageWorkload}
                    label={t('pages.courseDetail.averageWorkload')}
                    labelShort={t('pages.courseDetail.averageWorkloadShort')}
                    hasValidData={detailedStats.averageWorkload > 0}
                  />
                  
                  {/* 平均難度 */}
                  <StatBox
                    value={detailedStats.averageDifficulty}
                    label={t('pages.courseDetail.averageDifficulty')}
                    labelShort={t('pages.courseDetail.averageDifficultyShort')}
                    hasValidData={detailedStats.averageDifficulty > 0}
                  />
                  
                  {/* 平均實用性 */}
                  <StatBox
                    value={detailedStats.averageUsefulness}
                    label={t('pages.courseDetail.averageUsefulness')}
                    labelShort={t('pages.courseDetail.averageUsefulnessShort')}
                    hasValidData={detailedStats.averageUsefulness > 0}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  {/* 授課教師數 */}
                  <div className="flex flex-col items-center min-w-0">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground text-center leading-tight">
                      <GraduationCap className="h-3 w-3" />
                      <span>{t('pages.courseDetail.taughtInstructors')}</span>
                    </div>
                    <span className="text-xl font-bold text-primary">
                      {(() => {
                        if (!teachingInfo || teachingInfo.length === 0) return 0;
                        const uniqueInstructors = new Set(teachingInfo.map(info => info.instructor.name));
                        return uniqueInstructors.size;
                      })()}
                    </span>
                  </div>
                  
                  {/* 評論數量 */}
                  <div className="flex flex-col items-center min-w-0">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground text-center leading-tight">
                      <MessageSquare className="h-3 w-3" />
                      <span>{t('pages.courseDetail.totalReviews')}</span>
                    </div>
                    <span className="text-xl font-bold text-primary">
                      {allReviews?.length || 0}
                    </span>
                  </div>
                  
                  {/* 學生數量 */}
                  <div className="flex flex-col items-center min-w-0">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground text-center leading-tight">
                      <UserCheck className="h-3 w-3" />
                      <span>{t('pages.courseDetail.totalStudents')}</span>
                    </div>
                    <span className="text-xl font-bold text-primary">
                      {(() => {
                        if (!allReviews || allReviews.length === 0) return 0;
                        const uniqueStudents = new Set(allReviews.map(review => review.review.user_id));
                        return uniqueStudents.size;
                      })()}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Desktop: 統一使用 6 列佈局 */}
              <div className="hidden lg:grid lg:grid-cols-6 gap-4">
                {/* 平均工作量 */}
                <StatBox
                  value={detailedStats.averageWorkload}
                  label={t('pages.courseDetail.averageWorkload')}
                  labelShort={t('pages.courseDetail.averageWorkloadShort')}
                  hasValidData={detailedStats.averageWorkload > 0}
                />
                
                {/* 平均難度 */}
                <StatBox
                  value={detailedStats.averageDifficulty}
                  label={t('pages.courseDetail.averageDifficulty')}
                  labelShort={t('pages.courseDetail.averageDifficultyShort')}
                  hasValidData={detailedStats.averageDifficulty > 0}
                />
                
                {/* 平均實用性 */}
                <StatBox
                  value={detailedStats.averageUsefulness}
                  label={t('pages.courseDetail.averageUsefulness')}
                  labelShort={t('pages.courseDetail.averageUsefulnessShort')}
                  hasValidData={detailedStats.averageUsefulness > 0}
                />
                
                {/* 授課教師數 */}
                <div className="flex flex-col items-center min-w-0">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground text-center">
                    <GraduationCap className="h-4 w-4" />
                    <span>{t('pages.courseDetail.taughtInstructors')}</span>
                  </div>
                  <span className="text-xl font-bold text-primary">
                    {(() => {
                      if (!teachingInfo || teachingInfo.length === 0) return 0;
                      const uniqueInstructors = new Set(teachingInfo.map(info => info.instructor.name));
                      return uniqueInstructors.size;
                    })()}
                  </span>
                </div>
                
                {/* 評論數量 */}
                <div className="flex flex-col items-center min-w-0">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground text-center">
                    <MessageSquare className="h-4 w-4" />
                    <span>{t('pages.courseDetail.totalReviews')}</span>
                  </div>
                  <span className="text-xl font-bold text-primary">
                    {allReviews?.length || 0}
                  </span>
                </div>
                
                {/* 學生數量 */}
                <div className="flex flex-col items-center min-w-0">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground text-center">
                    <UserCheck className="h-4 w-4" />
                    <span>{t('pages.courseDetail.totalStudents')}</span>
                  </div>
                  <span className="text-xl font-bold text-primary">
                    {(() => {
                      if (!allReviews || allReviews.length === 0) return 0;
                      const uniqueStudents = new Set(allReviews.map(review => review.review.user_id));
                      return uniqueStudents.size;
                    })()}
                  </span>
                </div>
              </div>
            </div>

          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="reviews" className="w-full">
        {/* Tab Navigation - Attached Design */}
        <div className="attached-tabs-container">
          <TabsList className="attached-tabs-list">
            <TabsTrigger 
              value="reviews" 
              className="attached-tab-trigger"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">{t('review.studentReviews')}</span>
              <span className="sm:hidden text-xs">{t('pages.courseDetail.reviewsShort')}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="teaching" 
              className="attached-tab-trigger"
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">{t('pages.courseDetail.offerRecords')}</span>
              <span className="sm:hidden text-xs">{t('common.teaching')}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="grades" 
              className="attached-tab-trigger"
            >
              <Info className="h-4 w-4" />
              <span className="hidden sm:inline">{t('chart.gradeDistribution')}</span>
              <span className="sm:hidden text-xs">{t('common.grades')}</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Student Reviews Tab */}
        <TabsContent value="reviews" className="attached-tab-content mt-0">
          <div id="student-reviews" className="p-6 space-y-4">
            <CourseReviewsList 
              reviews={allReviews || []}
              allReviews={allReviews || []}
              loading={reviewsLoading}
              externalGradeFilter={externalGradeFilter}
              course={course}
              hideHeader={true}
              onToggleServiceLearning={handleServiceLearningToggle}
            />
          </div>
        </TabsContent>

        {/* Teaching Records Tab */}
        <TabsContent value="teaching" className="attached-tab-content mt-0">
          <div className="p-6 space-y-4">
          {teachingInfoLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">{t('pages.courseDetail.loadingTeachingRecords')}</p>
            </div>
          ) : teachingInfo.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t('pages.courseDetail.noTeachingRecords')}</p>
            </div>
          ) : (
            <Tabs value={activeTeachingTab} onValueChange={setActiveTeachingTab} className="w-full">
              <div className="flex flex-col gap-4 mb-4">
                {/* Mobile: Tab switcher and filters in separate rows */}
                <div className="md:hidden">
                  <TabsList className="bg-muted/50 backdrop-blur-sm w-full mb-4">
                    {filteredTeachingInfo.filter(info => info.sessionType === 'Lecture').length > 0 && (
                      <TabsTrigger 
                        value="lecture" 
                        className="hover:shadow-md transition-[transform,box-shadow,scale] duration-200 data-[state=active]:shadow-lg hover:scale-105 flex-1"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{t('sessionType.lecture')}</span>
                          <div className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-semibold">
                            {filteredTeachingInfo.filter(info => info.sessionType === 'Lecture').length}
                          </div>
                        </div>
                      </TabsTrigger>
                    )}
                    {filteredTeachingInfo.filter(info => info.sessionType === 'Tutorial').length > 0 && (
                      <TabsTrigger 
                        value="tutorial" 
                        className="hover:shadow-md transition-[transform,box-shadow,scale] duration-200 data-[state=active]:shadow-lg hover:scale-105 flex-1"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{t('sessionType.tutorial')}</span>
                          <div className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-semibold">
                            {filteredTeachingInfo.filter(info => info.sessionType === 'Tutorial').length}
                          </div>
                        </div>
                      </TabsTrigger>
                    )}
                  </TabsList>

                  {/* Mobile filters - each filter in its own row */}
                  <div className="grid grid-cols-1 gap-2">
                    {/* 學期篩選 */}
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 shrink-0 w-24">
                        <CalendarDays className="h-4 w-4" />
                        {t('pages.courseDetail.filterByTerm')}
                      </label>
                      <MultiSelectDropdown
                        options={availableTermsWithCounts.map((termData): SelectOption => ({
                          value: termData.term.term_code,
                          label: termData.term.name,
                          count: termData.count,
                          status: isCurrentTerm(termData.term.term_code) ? 'current' : 
                                 new Date(termData.term.end_date) < new Date() ? 'past' : 'future'
                        }))}
                        selectedValues={(() => {
                          const values = Array.isArray(selectedTermFilter) ? selectedTermFilter : (selectedTermFilter ? [selectedTermFilter] : []);
                          // If 'all' is selected or no values, return empty array to show placeholder
                          if (values.length === 0 || values.includes('all')) {
                            return [];
                          }
                          return values;
                        })()}
                        onSelectionChange={(values: string[]) => {
                          if (values.length === 0) {
                            setSelectedTermFilter('all'); // When nothing selected, set to 'all'
                          } else {
                            setSelectedTermFilter(values);
                          }
                        }}
                        placeholder={t('common.all')}
                        className="flex-1 h-10 text-sm"
                        showCounts={true}
                        maxHeight="max-h-48"
                        totalCount={teachingInfo.length}
                      />
                    </div>

                    {/* 教學語言篩選 */}
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 shrink-0 w-24">
                        <BookText className="h-4 w-4" />
                        {t('pages.courseDetail.filterByTeachingLanguage')}
                      </label>
                      <MultiSelectDropdown
                        options={availableTeachingLanguagesWithCounts.map((languageData): SelectOption => ({
                          value: languageData.language,
                          label: getResponsiveTeachingLanguageLabel(languageData.language),
                          count: languageData.count,
                          isTeachingLanguage: true
                        }))}
                        selectedValues={(() => {
                          const values = Array.isArray(selectedTeachingLanguageFilter) ? selectedTeachingLanguageFilter : (selectedTeachingLanguageFilter === 'all' ? [] : [selectedTeachingLanguageFilter]);
                          // If 'all' is selected or no values, return empty array to show placeholder
                          if (values.length === 0 || values.includes('all')) {
                            return [];
                          }
                          return values;
                        })()}
                        onSelectionChange={(values: string[]) => {
                          if (values.length === 0) {
                            setSelectedTeachingLanguageFilter('all'); // When nothing selected, set to 'all'
                          } else {
                            setSelectedTeachingLanguageFilter(values);
                          }
                        }}
                        placeholder={t('common.all')}
                        className="flex-1 h-10 text-sm"
                        showCounts={true}
                        maxHeight="max-h-48"
                        totalCount={teachingInfo.length}
                      />
                    </div>
                  </div>
                </div>

                {/* Desktop: Tab switcher and filters in the same row */}
                <div className="hidden md:flex md:items-center md:justify-between md:gap-2">
                  <TabsList className="bg-muted/50 backdrop-blur-sm">
                    {filteredTeachingInfo.filter(info => info.sessionType === 'Lecture').length > 0 && (
                      <TabsTrigger 
                        value="lecture" 
                        className="hover:shadow-md transition-[transform,box-shadow,scale] duration-200 data-[state=active]:shadow-lg hover:scale-105"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{t('sessionType.lecture')}</span>
                          <div className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-semibold">
                            {filteredTeachingInfo.filter(info => info.sessionType === 'Lecture').length}
                          </div>
                        </div>
                      </TabsTrigger>
                    )}
                    {filteredTeachingInfo.filter(info => info.sessionType === 'Tutorial').length > 0 && (
                      <TabsTrigger 
                        value="tutorial" 
                        className="hover:shadow-md transition-[transform,box-shadow,scale] duration-200 data-[state=active]:shadow-lg hover:scale-105"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{t('sessionType.tutorial')}</span>
                          <div className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-semibold">
                            {filteredTeachingInfo.filter(info => info.sessionType === 'Tutorial').length}
                          </div>
                        </div>
                      </TabsTrigger>
                    )}
                  </TabsList>

                  {/* Desktop filters - inline with tab switcher */}
                  <div className="flex items-center gap-3">
                    {/* 學期篩選器 */}
                    <div className="flex items-center gap-2 shrink-0">
                      <label className="flex items-center gap-1 text-sm font-medium text-muted-foreground whitespace-nowrap">
                        <CalendarDays className="h-4 w-4" />
                        {t('pages.courseDetail.filterByTerm')}
                      </label>
                      <MultiSelectDropdown
                        options={availableTermsWithCounts.map((termData): SelectOption => ({
                          value: termData.term.term_code,
                          label: termData.term.name,
                          count: termData.count,
                          status: isCurrentTerm(termData.term.term_code) ? 'current' : 
                                 new Date(termData.term.end_date) < new Date() ? 'past' : 'future'
                        }))}
                        selectedValues={(() => {
                          const values = Array.isArray(selectedTermFilter) ? selectedTermFilter : (selectedTermFilter ? [selectedTermFilter] : []);
                          // If 'all' is selected or no values, return empty array to show placeholder
                          if (values.length === 0 || values.includes('all')) {
                            return [];
                          }
                          return values;
                        })()}
                        onSelectionChange={(values: string[]) => {
                          if (values.length === 0) {
                            setSelectedTermFilter('all'); // When nothing selected, set to 'all'
                          } else {
                            setSelectedTermFilter(values);
                          }
                        }}
                        placeholder={t('common.all')}
                        className="w-[100px] h-10 text-sm"
                        showCounts={true}
                        maxHeight="max-h-48"
                        totalCount={teachingInfo.length}
                      />
                    </div>
                    
                    {/* 教學語言篩選器 */}
                    <div className="flex items-center gap-2 shrink-0">
                      <label className="flex items-center gap-1 text-sm font-medium text-muted-foreground whitespace-nowrap">
                        <BookText className="h-4 w-4" />
                        {t('pages.courseDetail.filterByTeachingLanguage')}
                      </label>
                      <MultiSelectDropdown
                        options={availableTeachingLanguagesWithCounts.map((languageData): SelectOption => ({
                          value: languageData.language,
                          label: getResponsiveTeachingLanguageLabel(languageData.language),
                          count: languageData.count,
                          isTeachingLanguage: true
                        }))}
                        selectedValues={(() => {
                          const values = Array.isArray(selectedTeachingLanguageFilter) ? selectedTeachingLanguageFilter : (selectedTeachingLanguageFilter === 'all' ? [] : [selectedTeachingLanguageFilter]);
                          // If 'all' is selected or no values, return empty array to show placeholder
                          if (values.length === 0 || values.includes('all')) {
                            return [];
                          }
                          return values;
                        })()}
                        onSelectionChange={(values: string[]) => {
                          if (values.length === 0) {
                            setSelectedTeachingLanguageFilter('all'); // When nothing selected, set to 'all'
                          } else {
                            setSelectedTeachingLanguageFilter(values);
                          }
                        }}
                        placeholder={t('common.all')}
                        className="w-[100px] h-10 text-sm"
                        showCounts={true}
                        maxHeight="max-h-48"
                        totalCount={teachingInfo.length}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <TabsContent value="lecture" className="mt-0">
                {filteredTeachingInfo.filter(info => info.sessionType === 'Lecture').length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">{t('pages.courseDetail.noLectureRecords')}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Group by instructor and sort alphabetically */}
                    {Object.entries(
                      filteredTeachingInfo
                        .filter(info => info.sessionType === 'Lecture')
                        .reduce((acc, info) => {
                          const instructorName = info.instructor.name;
                          if (!acc[instructorName]) {
                            acc[instructorName] = {
                              instructor: info.instructor,
                              terms: []
                            };
                          }
                          acc[instructorName].terms.push(info.term);
                          return acc;
                        }, {} as Record<string, { instructor: any; terms: any[] }>)
                    )
                    .sort(([a], [b]) => {
                      const aNameForSort = extractInstructorNameForSorting(a);
                      const bNameForSort = extractInstructorNameForSorting(b);
                      return aNameForSort.localeCompare(bNameForSort);
                    }) // Sort by instructor name alphabetically, ignoring titles
                    .map(([instructorName, data]) => (
                      <div key={instructorName} className="p-3 rounded-lg space-y-3">
                        {/* First row: Instructor name */}
                        <div className="flex-shrink-0">
                          <a
                            href={`/instructors/${encodeURIComponent(instructorName)}`}
                            onClick={(e) => {
                              if (e.ctrlKey || e.metaKey || e.button === 1) {
                                return;
                              }
                              e.preventDefault();
                              navigate(`/instructors/${encodeURIComponent(instructorName)}`);
                            }}
                            className="font-medium text-sm hover:text-primary transition-colors"
                          >
                            <div className="flex flex-col">
                              <span>{instructorName}</span>
                              {(language === 'zh-TW' || language === 'zh-CN') && (
                                <span className="text-xs text-muted-foreground font-normal">
                                  {language === 'zh-TW' ? data.instructor.name_tc : data.instructor.name_sc}
                                </span>
                              )}
                            </div>
                          </a>
                        </div>
                        
                        {/* Second row: Terms and Teaching Languages Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          {data.terms
                            .sort((a, b) => b.term_code.localeCompare(a.term_code)) // Sort terms by code descending
                            .map((term, termIndex) => {
                              // Find the teaching language for this term and instructor
                              const teachingLanguage = filteredTeachingInfo.find(info => 
                                info.term.term_code === term.term_code && 
                                info.instructor.name === instructorName &&
                                info.sessionType === 'Lecture'
                              )?.teachingLanguage;
                              
                              return (
                                <div key={termIndex} className="flex items-center">
                                  {/* Combined term and teaching language badge */}
                                  {teachingLanguage ? (
                                    <div className="inline-flex rounded-md border border-border overflow-hidden transition-colors hover:border-primary/50">
                                      {/* Term part (left side) */}
                                      <ResponsiveTooltip
                                        ref={(el) => {
                                          if (el) tooltipRefs.current[`term-${term.term_code}`] = el;
                                        }}
                                        content={t('filter.clickToFilterByTerm', { term: term.name })}
                                        hasClickAction={true}
                                        clickActionText={t('tooltip.clickAgainToFilter')}
                                        open={isMobile ? termTooltipStates[term.term_code] || false : undefined}
                                        onOpenChange={isMobile ? (open) => setTermTooltipStates(prev => ({ ...prev, [term.term_code]: open })) : undefined}
                                        onReset={() => resetTermTooltipState(term.term_code)}
                                      >
                                        <button
                                          onClick={(e) => {
                                            handleTermBadgeClick(term.term_code, e);
                                          }}
                                          className={`px-2 py-1 text-xs transition-colors border-0 ${
                                            (() => {
                                              const currentValues = Array.isArray(selectedTermFilter) ? selectedTermFilter : (selectedTermFilter === 'all' ? [] : [selectedTermFilter]);
                                              return currentValues.includes(term.term_code)
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-background hover:bg-muted';
                                            })()
                                          }`}
                                        >
                                          {term.name}
                                        </button>
                                      </ResponsiveTooltip>
                                      
                                      {/* Separator */}
                                      <div className="w-px bg-border"></div>
                                      
                                      {/* Teaching language part (right side) */}
                                      <ResponsiveTooltip
                                        ref={(el) => {
                                          if (el) tooltipRefs.current[`lang-${teachingLanguage}`] = el;
                                        }}
                                        content={t('filter.clickToFilterByTeachingLanguage', { language: getTeachingLanguageName(teachingLanguage, t) })}
                                        hasClickAction={true}
                                        clickActionText={t('tooltip.clickAgainToFilter')}
                                        open={isMobile ? teachingLanguageTooltipStates[teachingLanguage] || false : undefined}
                                        onOpenChange={isMobile ? (open) => setTeachingLanguageTooltipStates(prev => ({ ...prev, [teachingLanguage]: open })) : undefined}
                                        onReset={() => resetTeachingLanguageTooltipState(teachingLanguage)}
                                      >
                                        <button
                                          onClick={(e) => {
                                            handleTeachingLanguageBadgeClick(teachingLanguage, e);
                                          }}
                                          className={`px-2 py-1 text-xs transition-colors border-0 font-mono ${
                                            (() => {
                                              const currentValues = Array.isArray(selectedTeachingLanguageFilter) ? selectedTeachingLanguageFilter : (selectedTeachingLanguageFilter === 'all' ? [] : [selectedTeachingLanguageFilter]);
                                              const isSelected = currentValues.includes(teachingLanguage);
                                              return isSelected
                                                ? 'bg-orange-500 text-orange-50 font-bold'
                                                : 'bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/10 dark:text-orange-400 dark:hover:bg-orange-900/20';
                                            })()
                                          }`}
                                        >
                                          {teachingLanguage}
                                        </button>
                                      </ResponsiveTooltip>
                                    </div>
                                  ) : (
                                    // Fallback to term-only badge if no teaching language
                                    <ResponsiveTooltip
                                      content={t('filter.clickToFilterByTerm', { term: term.name })}
                                      hasClickAction={true}
                                      clickActionText={t('tooltip.clickAgainToFilter')}
                                    >
                                      <button
                                        onClick={() => handleTermBadgeClick(term.term_code)}
                                        className={`px-2 py-1 text-xs rounded-md transition-colors border ${
                                          (() => {
                                            const currentValues = Array.isArray(selectedTermFilter) ? selectedTermFilter : (selectedTermFilter === 'all' ? [] : [selectedTermFilter]);
                                            return currentValues.includes(term.term_code)
                                              ? 'bg-primary text-primary-foreground border-primary'
                                              : 'bg-background hover:bg-muted border-border hover:border-primary/50';
                                          })()
                                        }`}
                                      >
                                        {term.name}
                                      </button>
                                    </ResponsiveTooltip>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="tutorial" className="mt-0">
                {filteredTeachingInfo.filter(info => info.sessionType === 'Tutorial').length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">{t('pages.courseDetail.noTutorialRecords')}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Group by instructor and sort alphabetically */}
                    {Object.entries(
                      filteredTeachingInfo
                        .filter(info => info.sessionType === 'Tutorial')
                        .reduce((acc, info) => {
                          const instructorName = info.instructor.name;
                          if (!acc[instructorName]) {
                            acc[instructorName] = {
                              instructor: info.instructor,
                              terms: []
                            };
                          }
                          acc[instructorName].terms.push(info.term);
                          return acc;
                        }, {} as Record<string, { instructor: any; terms: any[] }>)
                    )
                    .sort(([a], [b]) => {
                      const aNameForSort = extractInstructorNameForSorting(a);
                      const bNameForSort = extractInstructorNameForSorting(b);
                      return aNameForSort.localeCompare(bNameForSort);
                    }) // Sort by instructor name alphabetically, ignoring titles
                    .map(([instructorName, data]) => (
                      <div key={instructorName} className="p-3 rounded-lg space-y-3">
                        {/* First row: Instructor name */}
                        <div className="flex-shrink-0">
                          <a
                            href={`/instructors/${encodeURIComponent(instructorName)}`}
                            onClick={(e) => {
                              if (e.ctrlKey || e.metaKey || e.button === 1) {
                                return;
                              }
                              e.preventDefault();
                              navigate(`/instructors/${encodeURIComponent(instructorName)}`);
                            }}
                            className="font-medium text-sm hover:text-primary transition-colors"
                          >
                            <div className="flex flex-col">
                              <span>{instructorName}</span>
                              {(language === 'zh-TW' || language === 'zh-CN') && (
                                <span className="text-xs text-muted-foreground font-normal">
                                  {language === 'zh-TW' ? data.instructor.name_tc : data.instructor.name_sc}
                                </span>
                              )}
                            </div>
                          </a>
                        </div>
                        
                        {/* Second row: Terms and Teaching Languages Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          {data.terms
                            .sort((a, b) => b.term_code.localeCompare(a.term_code)) // Sort terms by code descending
                            .map((term, termIndex) => {
                              // Find the teaching language for this term and instructor
                              const teachingLanguage = filteredTeachingInfo.find(info => 
                                info.term.term_code === term.term_code && 
                                info.instructor.name === instructorName &&
                                info.sessionType === 'Tutorial'
                              )?.teachingLanguage;
                              
                              return (
                                <div key={termIndex} className="flex items-center">
                                  {/* Combined term and teaching language badge */}
                                  {teachingLanguage ? (
                                    <div className="inline-flex rounded-md border border-border overflow-hidden transition-colors hover:border-primary/50">
                                      {/* Term part (left side) */}
                                      <ResponsiveTooltip
                                        ref={(el) => {
                                          if (el) tooltipRefs.current[`term-${term.term_code}`] = el;
                                        }}
                                        content={t('filter.clickToFilterByTerm', { term: term.name })}
                                        hasClickAction={true}
                                        clickActionText={t('tooltip.clickAgainToFilter')}
                                        open={isMobile ? termTooltipStates[term.term_code] || false : undefined}
                                        onOpenChange={isMobile ? (open) => setTermTooltipStates(prev => ({ ...prev, [term.term_code]: open })) : undefined}
                                        onReset={() => resetTermTooltipState(term.term_code)}
                                      >
                                        <button
                                          onClick={(e) => {
                                            handleTermBadgeClick(term.term_code, e);
                                          }}
                                          className={`px-2 py-1 text-xs transition-colors border-0 ${
                                            (() => {
                                              const currentValues = Array.isArray(selectedTermFilter) ? selectedTermFilter : (selectedTermFilter === 'all' ? [] : [selectedTermFilter]);
                                              return currentValues.includes(term.term_code)
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-background hover:bg-muted';
                                            })()
                                          }`}
                                        >
                                          {term.name}
                                        </button>
                                      </ResponsiveTooltip>
                                      
                                      {/* Separator */}
                                      <div className="w-px bg-border"></div>
                                      
                                      {/* Teaching language part (right side) */}
                                      <ResponsiveTooltip
                                        ref={(el) => {
                                          if (el) tooltipRefs.current[`lang-${teachingLanguage}`] = el;
                                        }}
                                        content={t('filter.clickToFilterByTeachingLanguage', { language: getTeachingLanguageName(teachingLanguage, t) })}
                                        hasClickAction={true}
                                        clickActionText={t('tooltip.clickAgainToFilter')}
                                        open={isMobile ? teachingLanguageTooltipStates[teachingLanguage] || false : undefined}
                                        onOpenChange={isMobile ? (open) => setTeachingLanguageTooltipStates(prev => ({ ...prev, [teachingLanguage]: open })) : undefined}
                                        onReset={() => resetTeachingLanguageTooltipState(teachingLanguage)}
                                      >
                                        <button
                                          onClick={(e) => {
                                            handleTeachingLanguageBadgeClick(teachingLanguage, e);
                                          }}
                                          className={`px-2 py-1 text-xs transition-colors border-0 font-mono ${
                                            (() => {
                                              const currentValues = Array.isArray(selectedTeachingLanguageFilter) ? selectedTeachingLanguageFilter : (selectedTeachingLanguageFilter === 'all' ? [] : [selectedTeachingLanguageFilter]);
                                              const isSelected = currentValues.includes(teachingLanguage);
                                              return isSelected
                                                ? 'bg-orange-500 text-orange-50 font-bold'
                                                : 'bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/10 dark:text-orange-400 dark:hover:bg-orange-900/20';
                                            })()
                                          }`}
                                        >
                                          {teachingLanguage}
                                        </button>
                                      </ResponsiveTooltip>
                                    </div>
                                  ) : (
                                    // Fallback to term-only badge if no teaching language
                                    <ResponsiveTooltip
                                      ref={(el) => {
                                        if (el) tooltipRefs.current[`term-${term.term_code}`] = el;
                                      }}
                                      content={t('filter.clickToFilterByTerm', { term: term.name })}
                                      hasClickAction={true}
                                      clickActionText={t('tooltip.clickAgainToFilter')}
                                      open={isMobile ? termTooltipStates[term.term_code] || false : undefined}
                                      onOpenChange={isMobile ? (open) => setTermTooltipStates(prev => ({ ...prev, [term.term_code]: open })) : undefined}
                                      onReset={() => resetTermTooltipState(term.term_code)}
                                    >
                                      <button
                                        onClick={(e) => {
                                          handleTermBadgeClick(term.term_code, e);
                                        }}
                                        className={`px-2 py-1 text-xs rounded-md transition-colors border ${
                                          (() => {
                                            const currentValues = Array.isArray(selectedTermFilter) ? selectedTermFilter : (selectedTermFilter === 'all' ? [] : [selectedTermFilter]);
                                            return currentValues.includes(term.term_code)
                                              ? 'bg-primary text-primary-foreground border-primary'
                                              : 'bg-background hover:bg-muted border-border hover:border-primary/50';
                                          })()
                                        }`}
                                      >
                                        {term.name}
                                      </button>
                                    </ResponsiveTooltip>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
          </div>
        </TabsContent>

        {/* Grade Distribution Tab */}
        <TabsContent value="grades" className="attached-tab-content mt-0">
          <div className="p-0 space-y-4">
            {/* 成績分佈圖表 */}
            {!reviewsLoading && allReviewsForChart.length > 0 ? (
              <div>
                <GradeDistributionChart
                  gradeDistribution={calculateGradeDistributionFromReviews(filteredReviewsForChart.map(review => ({ course_final_grade: review.review.course_final_grade })))}
                  loading={reviewsLoading}
                  title={t('chart.gradeDistribution')}
                  height={120}
                  showPercentage={true}
                  className="bg-transparent border-transparent"
                  context="course"
                  filterOptions={gradeChartFilterOptions}
                  selectedFilter={selectedGradeChartFilter}
                  onFilterChange={setSelectedGradeChartFilter}
                  filterLabel={t('chart.filterByInstructor')}
                  rawReviewData={allReviewsForChart}
                  defaultExpanded={true}
                  hideHeader={true}
                  onBarClick={(grade) => {
                    // 設置成績篩選並滾動到學生評論區域
                    setExternalGradeFilter(grade);
                    
                    // 短暫延遲後滾動，讓篩選生效
                    setTimeout(() => {
                      const studentReviewsElement = document.getElementById('student-reviews');
                      if (studentReviewsElement) {
                        studentReviewsElement.scrollIntoView({ 
                          behavior: 'smooth', 
                          block: 'start' 
                        });
                      }
                    }, 100);
                  }}
                />
              </div>
            ) : (
              <div className="text-center py-12 space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 bg-muted/50 rounded-full">
                    <Info className="h-12 w-12 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-muted-foreground">{t('chart.noGradeData')}</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    {t('chart.noGradeDataDescription')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>


      </Tabs>
    </div>
  );
};

export default CourseDetail;