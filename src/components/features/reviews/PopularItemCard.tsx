import { useState, useRef, useEffect } from 'react';
import { Star, MessageSquare, BookOpen, Mail, CheckCircle, XCircle, GraduationCap, Scale, Brain, Target, Loader2, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { StarRating } from '@/components/ui/star-rating';
import { getCourseTitle, getInstructorName, translateDepartmentName, getTeachingLanguageName } from '@/utils/textUtils';
import { getCurrentTermName, getCurrentTermCode } from '@/utils/dateUtils';
import { useTheme } from '@/hooks/theme/useTheme';
import { FavoriteButton } from '@/components/ui/FavoriteButton';
import { formatGPA } from '@/utils/gradeUtils';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { useIsMobile } from '@/hooks/use-mobile';

interface PopularCourseCardProps {
  type: 'course';
  title: string;
  titleTc?: string;
  titleSc?: string;
  code: string;
  department: string;
  teachingLanguages?: string[]; // Array of teaching language codes in chronological order
  currentTermTeachingLanguage?: string | null; // Current term's teaching language for bolding
  serviceLearningTypes?: ('compulsory' | 'optional')[]; // Array of service learning types
  currentTermServiceLearning?: ('compulsory' | 'optional') | null; // Current term's service learning type
  rating: number;
  reviewCount: number;
  isOfferedInCurrentTerm?: boolean;
  // Add detailed stats as props
  averageWorkload?: number;
  averageDifficulty?: number;
  averageUsefulness?: number;
  averageGPA?: number;
  isLoading?: boolean; // Add loading state for course cards
  // 新增：收藏狀態相關props
  isFavorited?: boolean;
  onFavoriteToggle?: (newState: boolean) => void;
  // 新增：教學語言點擊回調
  onTeachingLanguageClick?: (languages: string[]) => void;
  // 新增：服務學習點擊回調
  onServiceLearningClick?: (types: ('compulsory' | 'optional')[]) => void;
  // 控制是否啟用雙擊模式（目錄頁面使用，主頁不使用）
  enableTwoTapMode?: boolean;
}

interface PopularInstructorCardProps {
  type: 'instructor';
  name: string;
  nameTc?: string;
  nameSc?: string;
  department: string;
  reviewCount: number;
  teachingScore: number;
  gradingFairness: number;
  averageGPA?: number;
  isTeachingInCurrentTerm?: boolean;
  isLoading?: boolean; // Add loading state for instructor cards
  teachingLanguages?: string[]; // Array of teaching language codes in chronological order
  currentTermTeachingLanguage?: string | null; // Current term's teaching language for bolding
  // 新增：收藏狀態相關props
  isFavorited?: boolean;
  onFavoriteToggle?: (newState: boolean) => void;
  // 新增：教學語言點擊回調
  onTeachingLanguageClick?: (languages: string[]) => void;
  // 控制是否啟用雙擊模式（目錄頁面使用，主頁不使用）
  enableTwoTapMode?: boolean;
}

type PopularItemCardProps = PopularCourseCardProps | PopularInstructorCardProps;



export const PopularItemCard = (props: PopularItemCardProps) => {
  const navigate = useNavigate();
  const { t, language: currentLanguage } = useLanguage();
  const currentTermName = getCurrentTermName();
  const { isDark } = useTheme();
  const isMobile = useIsMobile();
  
  // Tap count states for different click behaviors on mobile vs desktop
  const [teachingLanguageTapCount, setTeachingLanguageTapCount] = useState(0);
  const [serviceLearningTapCount, setServiceLearningTapCount] = useState(0);
  const [departmentTapCount, setDepartmentTapCount] = useState(0);
  const [teachingBadgeTapCount, setTeachingBadgeTapCount] = useState(0);
  // Tooltip open states for mobile
  const [teachingLanguageTooltipOpen, setTeachingLanguageTooltipOpen] = useState(false);
  const [serviceLearningTooltipOpen, setServiceLearningTooltipOpen] = useState(false);
  const [departmentTooltipOpen, setDepartmentTooltipOpen] = useState(false);
  const [teachingBadgeTooltipOpen, setTeachingBadgeTooltipOpen] = useState(false);
  const teachingLanguageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const serviceLearningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const departmentTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const teachingBadgeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (teachingLanguageTimeoutRef.current) {
        clearTimeout(teachingLanguageTimeoutRef.current);
      }
      if (serviceLearningTimeoutRef.current) {
        clearTimeout(serviceLearningTimeoutRef.current);
      }
      if (departmentTimeoutRef.current) {
        clearTimeout(departmentTimeoutRef.current);
      }
      if (teachingBadgeTimeoutRef.current) {
        clearTimeout(teachingBadgeTimeoutRef.current);
      }
    };
  }, []);
  
  // 獲取多語言標題（僅對課程類型）
  const titleInfo = props.type === 'course' 
    ? getCourseTitle(
        { 
          course_title: props.title, 
          course_title_tc: props.titleTc, 
          course_title_sc: props.titleSc 
        }, 
        currentLanguage
      )
    : null;

  // 獲取多語言講師姓名（僅對講師類型）
  const instructorNameInfo = props.type === 'instructor' 
    ? getInstructorName(
        { 
          name: props.name, 
          name_tc: props.nameTc, 
          name_sc: props.nameSc 
        }, 
        currentLanguage
      )
    : null;

  const handleClick = (e?: React.MouseEvent) => {
    // For link navigation, we don't need to handle this manually anymore
    // The browser will handle it naturally through the <a> tag
  };

  const handleOfferedBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    e.preventDefault(); // Prevent link navigation
    
    // Navigate to courses catalog with current term filter applied
    const currentTerm = getCurrentTermCode();
    const searchParams = new URLSearchParams();
    searchParams.set('offeredTerm', currentTerm);
    
    navigate(`/courses?${searchParams.toString()}`);
  };

  const handleTeachingBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    e.preventDefault(); // Prevent link navigation
    
    if (isMobile && props.enableTwoTapMode) {
      // Mobile/tablet with two-tap mode enabled: require 2 taps to navigate (catalog pages)
      const newTapCount = teachingBadgeTapCount + 1;
      setTeachingBadgeTapCount(newTapCount);
      
      if (teachingBadgeTimeoutRef.current) {
        clearTimeout(teachingBadgeTimeoutRef.current);
      }
      
      if (newTapCount === 1) {
        // First tap: show tooltip
        setTeachingBadgeTooltipOpen(true);
        teachingBadgeTimeoutRef.current = setTimeout(() => {
          setTeachingBadgeTapCount(0);
          setTeachingBadgeTooltipOpen(false);
        }, 3000);
      } else if (newTapCount === 2) {
        // Second tap: navigate
        const currentTerm = getCurrentTermCode();
        const searchParams = new URLSearchParams();
        searchParams.set('teachingTerm', currentTerm);
        navigate(`/instructors?${searchParams.toString()}`);
        setTeachingBadgeTapCount(0);
        setTeachingBadgeTooltipOpen(false);
      }
    } else {
      // Desktop or mobile without two-tap mode: 1 tap to navigate immediately (main page)
      const currentTerm = getCurrentTermCode();
      const searchParams = new URLSearchParams();
      searchParams.set('teachingTerm', currentTerm);
      navigate(`/instructors?${searchParams.toString()}`);
    }
  };

  const handleDepartmentBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    e.preventDefault(); // Prevent link navigation
    
    if (isMobile && props.enableTwoTapMode) {
      // Mobile/tablet with two-tap mode enabled: require 2 taps to navigate (catalog pages)
      const newTapCount = departmentTapCount + 1;
      setDepartmentTapCount(newTapCount);
      
      if (departmentTimeoutRef.current) {
        clearTimeout(departmentTimeoutRef.current);
      }
      
      if (newTapCount === 1) {
        // First tap: show tooltip
        setDepartmentTooltipOpen(true);
        departmentTimeoutRef.current = setTimeout(() => {
          setDepartmentTapCount(0);
          setDepartmentTooltipOpen(false);
        }, 3000);
      } else if (newTapCount === 2) {
        // Second tap: navigate
        const searchParams = new URLSearchParams();
        const rawDepartmentName = extractRawDepartmentName(props.department);
        
        if (props.type === 'course') {
          // For course cards, navigate to courses catalog with subject area filter
          searchParams.set('subjectArea', rawDepartmentName);
          navigate(`/courses?${searchParams.toString()}`);
        } else {
          // For instructor cards, navigate to instructors catalog with department filter
          searchParams.set('department', rawDepartmentName);
          navigate(`/instructors?${searchParams.toString()}`);
        }
        setDepartmentTapCount(0);
        setDepartmentTooltipOpen(false);
      }
    } else {
      // Desktop or mobile without two-tap mode: 1 tap to navigate immediately (main page)
      const searchParams = new URLSearchParams();
      const rawDepartmentName = extractRawDepartmentName(props.department);
      
      if (props.type === 'course') {
        // For course cards, navigate to courses catalog with subject area filter
        searchParams.set('subjectArea', rawDepartmentName);
        navigate(`/courses?${searchParams.toString()}`);
      } else {
        // For instructor cards, navigate to instructors catalog with department filter
        searchParams.set('department', rawDepartmentName);
        navigate(`/instructors?${searchParams.toString()}`);
      }
    }
  };

  const handleTeachingLanguageClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    e.preventDefault(); // Prevent link navigation
    
    if (isMobile && props.enableTwoTapMode) {
      // Mobile/tablet with two-tap mode enabled: require 2 taps to apply filter (catalog pages)
      const newTapCount = teachingLanguageTapCount + 1;
      setTeachingLanguageTapCount(newTapCount);
      
      if (teachingLanguageTimeoutRef.current) {
        clearTimeout(teachingLanguageTimeoutRef.current);
      }
      
      if (newTapCount === 1) {
        // First tap: show tooltip
        setTeachingLanguageTooltipOpen(true);
        teachingLanguageTimeoutRef.current = setTimeout(() => {
          setTeachingLanguageTapCount(0);
          setTeachingLanguageTooltipOpen(false);
        }, 3000);
      } else if (newTapCount === 2) {
        // Second tap: apply filter and close tooltip
        if (props.onTeachingLanguageClick && props.teachingLanguages) {
          props.onTeachingLanguageClick(props.teachingLanguages);
        }
        setTeachingLanguageTapCount(0);
        setTeachingLanguageTooltipOpen(false);
      }
    } else {
      // Desktop or mobile without two-tap mode: 1 tap to apply filter immediately (main page)
      if (props.onTeachingLanguageClick && props.teachingLanguages) {
        props.onTeachingLanguageClick(props.teachingLanguages);
      }
    }
  };

  const handleServiceLearningClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    e.preventDefault(); // Prevent link navigation
    
    if (isMobile && props.enableTwoTapMode) {
      // Mobile/tablet with two-tap mode enabled: require 2 taps to apply filter (catalog pages)
      const newTapCount = serviceLearningTapCount + 1;
      setServiceLearningTapCount(newTapCount);
      
      if (serviceLearningTimeoutRef.current) {
        clearTimeout(serviceLearningTimeoutRef.current);
      }
      
      if (newTapCount === 1) {
        // First tap: show tooltip
        setServiceLearningTooltipOpen(true);
        serviceLearningTimeoutRef.current = setTimeout(() => {
          setServiceLearningTapCount(0);
          setServiceLearningTooltipOpen(false);
        }, 3000);
      } else if (newTapCount === 2) {
        // Second tap: apply filter and close tooltip
        if (props.onServiceLearningClick && props.serviceLearningTypes) {
          props.onServiceLearningClick(props.serviceLearningTypes);
        }
        setServiceLearningTapCount(0);
        setServiceLearningTooltipOpen(false);
      }
    } else {
      // Desktop or mobile without two-tap mode: 1 tap to apply filter immediately (main page)
      if (props.onServiceLearningClick && props.serviceLearningTypes) {
        props.onServiceLearningClick(props.serviceLearningTypes);
      }
    }
  };

  // Reset functions for when tooltip is closed externally
  const resetTeachingLanguageState = () => {
    setTeachingLanguageTapCount(0);
    setTeachingLanguageTooltipOpen(false);
    if (teachingLanguageTimeoutRef.current) {
      clearTimeout(teachingLanguageTimeoutRef.current);
      teachingLanguageTimeoutRef.current = null;
    }
  };

  const resetServiceLearningState = () => {
    setServiceLearningTapCount(0);
    setServiceLearningTooltipOpen(false);
    if (serviceLearningTimeoutRef.current) {
      clearTimeout(serviceLearningTimeoutRef.current);
      serviceLearningTimeoutRef.current = null;
    }
  };

  const resetDepartmentState = () => {
    setDepartmentTapCount(0);
    setDepartmentTooltipOpen(false);
    if (departmentTimeoutRef.current) {
      clearTimeout(departmentTimeoutRef.current);
      departmentTimeoutRef.current = null;
    }
  };

  const resetTeachingBadgeState = () => {
    setTeachingBadgeTapCount(0);
    setTeachingBadgeTooltipOpen(false);
    if (teachingBadgeTimeoutRef.current) {
      clearTimeout(teachingBadgeTimeoutRef.current);
      teachingBadgeTimeoutRef.current = null;
    }
  };

  // Get faculty by department name
  const getFacultyByDepartment = (department: string): string => {
    // First try to extract raw department name if it's translated
    const rawDepartment = extractRawDepartmentName(department);
    
    const facultyMapping: { [key: string]: string } = {
      // Faculty of Arts
      'Chinese': 'faculty.arts',
      'Cultural Studies': 'faculty.arts',
      'Digital Arts and Creative Industries': 'faculty.arts',
      'English': 'faculty.arts',
      'History': 'faculty.arts',
      'Philosophy': 'faculty.arts',
      'Translation': 'faculty.arts',
      'Centre for English and Additional Languages': 'faculty.arts',
      'Chinese Language Education and Assessment Centre': 'faculty.arts',
      
      // Faculty of Business
      'Accountancy': 'faculty.business',
      'Finance': 'faculty.business',
      'Management': 'faculty.business',
      'Marketing and International Business': 'faculty.business',
      'Operations and Risk Management': 'faculty.business',
      
      // Faculty of Social Sciences
      'Economics': 'faculty.socialSciences',
      'Government and International Affairs': 'faculty.socialSciences',
      'Psychology': 'faculty.socialSciences',
      'Sociology and Social Policy': 'faculty.socialSciences',
      
      // School of Data Science
      'LEO Dr David P. Chan Institute of Data Science': 'faculty.dataScience',
      
      // School of Interdisciplinary Studies
      'Science Unit': 'faculty.interdisciplinaryStudies',
      'Wong Bing Lai Music and Performing Arts Unit': 'faculty.interdisciplinaryStudies'
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

  // 課程統計從 props 獲取，不再使用個別的 hook
  const courseStatsLoading = props.type === 'course' ? (props.isLoading || false) : false;

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
  const StatBox = ({ icon: Icon, value, label }: { 
    icon: any, 
    value: number, 
    label: string
  }) => {
    const hasValidData = value > 0;
    
    const backgroundColor = hasValidData 
      ? getRatingGradientColor(value) 
      : '#4B5563'; // 統一使用深色灰色
    
    const displayValue = hasValidData ? value.toFixed(1).replace(/\.?0+$/, '') : t('common.na');
    
    // 獲取詳細的懸停說明
    const getTooltipText = () => {
      if (label === t('card.workload')) {
        return t('card.workload.tooltip');
      } else if (label === t('card.difficulty')) {
        return t('card.difficulty.tooltip');
      } else if (label === t('card.usefulness')) {
        return t('card.usefulness.tooltip');
      } else if (label === t('card.teaching')) {
        return t('card.teaching.tooltip');
      } else if (label === t('card.grading')) {
        return t('card.grading.tooltip');
      }
      return `${label}: ${displayValue}/5`;
    };

    // Handle navigation on click
    const handleStatBoxClick = (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent card click
      e.preventDefault(); // Prevent link navigation
      
      if (props.type === 'course') {
        navigate(`/courses/${props.code}`);
      } else {
        navigate(`/instructors/${encodeURIComponent(props.name)}`);
      }
    };
    
    return (
      <div className="flex flex-col items-center gap-1 flex-1">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide text-center">{label}</span>
        <ResponsiveTooltip 
          content={getTooltipText()}
          hasClickAction={true}
          clickActionText=""
          showCloseButton={true}
        >
          <div 
            className="flex items-center justify-center px-3 py-1.5 rounded-lg hover:scale-105 transition-transform cursor-pointer"
            style={{ backgroundColor, width: '90%' }}
            onClick={handleStatBoxClick}
          >
            <span className="font-bold text-lg text-white drop-shadow-sm">{displayValue}</span>
          </div>
        </ResponsiveTooltip>
      </div>
    );
  };

  // 載入中的統計框 - 匹配新樣式
  const StatBoxLoading = ({ label }: { label: string }) => {
    const backgroundColor = '#4B5563'; // 統一使用深色灰色
    
    return (
      <div className="flex flex-col items-center gap-1 flex-1">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide text-center">{label}</span>
        <div 
          className="flex items-center justify-center px-3 py-1.5 rounded-lg animate-pulse"
          style={{ backgroundColor, width: '90%' }}
        >
          <span className="font-bold text-lg text-white drop-shadow-sm">--</span>
        </div>
      </div>
    );
  };

  // Average GPA Display Component - Eye-catching without background
  const AverageGPADisplay = ({ gpa, isLoading = false }: { gpa?: number; isLoading?: boolean }) => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center mt-3">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
            {t('card.averageGPA')}
          </span>
          <div className="animate-pulse">
            <span className="text-2xl font-black text-gray-400">-.-</span>
          </div>
        </div>
      );
    }

    if (!gpa || gpa <= 0) {
      return (
        <div className="flex flex-col items-center mt-3">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
            {t('card.averageGPA')}
          </span>
          <span className="text-2xl font-black text-gray-400">{t('common.na')}</span>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center mt-3">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
          {t('card.averageGPA')}
        </span>
        <span className="text-3xl font-black text-transparent bg-gradient-to-r from-red-600 via-red-500 to-red-400 dark:from-red-500 dark:via-red-400 dark:to-red-300 bg-clip-text drop-shadow-sm">
          {formatGPA(gpa)}
        </span>
      </div>
    );
  };

  if (props.type === 'course') {
    const courseUrl = `/courses/${props.code}`;
    
    return (
      <a 
        href={courseUrl}
        className="block no-underline"
        onClick={(e) => {
          // Only prevent default if it's a special click (Ctrl, Cmd, middle-click)
          // Let normal clicks use the default link behavior
          if (e.ctrlKey || e.metaKey || e.button === 1) {
            // Let browser handle these naturally
            return;
          }
          // For normal clicks, prevent default and use React Router
          e.preventDefault();
          navigate(courseUrl);
        }}
      >
        <Card 
          className="course-card group cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] relative"
        >
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors duration-200 line-clamp-2 font-mono">
                  {props.code}
                </CardTitle>
                <div className="mt-1">
                  <p className="text-sm text-gray-600 dark:text-muted-foreground">{titleInfo?.primary}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {titleInfo?.secondary || ''}
                  </p>
                  {/* Faculty, Department and Teaching Language Badges */}
                  <div className="flex items-start text-sm text-gray-600 dark:text-muted-foreground mt-2">
                    <div className={`${currentLanguage === 'en' ? 'flex flex-col items-start gap-1.5' : 'flex flex-wrap items-center gap-1 sm:gap-1.5'} min-w-0 w-full`} style={{ minHeight: '2rem' }} data-badge-container>
                      {/* Faculty Badge */}
                      {getFacultyByDepartment(props.department) && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 shrink-0">
                          {t(getFacultyByDepartment(props.department))}
                        </span>
                      )}
                      {/* Department Badge */}
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 shrink-0 max-w-full">
                        <span className="break-words hyphens-auto">
                          {translateDepartmentName(props.department, t)}
                        </span>
                      </span>
                      {/* Teaching Language and Service Learning Badges Row */}
                      {(props.teachingLanguages?.length || props.serviceLearningTypes?.length) && (
                        <div className="flex items-center gap-1 sm:gap-1.5">
                          {/* Teaching Language Badge */}
                          {props.teachingLanguages && props.teachingLanguages.length > 0 && (
                            <ResponsiveTooltip 
                              content={props.teachingLanguages.map(code => 
                                `${code}: ${getTeachingLanguageName(code, t)}${code === props.currentTermTeachingLanguage ? ` (${t('teaching.current')})` : ''}`
                              ).join('\n')}
                              hasClickAction={true}
                              clickActionText={
                                (isMobile && props.enableTwoTapMode) ? t('tooltip.clickAgainToFilter') : undefined
                              }
                              showCloseButton={true}
                              onReset={props.enableTwoTapMode ? resetTeachingLanguageState : undefined}
                              open={(isMobile && props.enableTwoTapMode) ? teachingLanguageTooltipOpen : undefined}
                              onOpenChange={(isMobile && props.enableTwoTapMode) ? setTeachingLanguageTooltipOpen : undefined}
                            >
                              <span 
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800 shrink-0 cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/40 hover:scale-105 transition-all duration-200"
                                onClick={handleTeachingLanguageClick}
                              >
                                <div className="flex items-center gap-1">
                                  {props.teachingLanguages.map((code, index) => (
                                    <span 
                                      key={code}
                                      className={`${
                                        index > 0 ? 'border-l border-orange-300 dark:border-orange-700 pl-1' : ''
                                      }`}
                                    >
                                      <span className={code === props.currentTermTeachingLanguage ? 'underline' : ''}>
                                        {code}
                                      </span>
                                    </span>
                                  ))}
                                </div>
                              </span>
                            </ResponsiveTooltip>
                          )}
                          {/* Service Learning Badge */}
                          {props.serviceLearningTypes && props.serviceLearningTypes.length > 0 && (
                            <ResponsiveTooltip 
                              content={`${t('features.serviceLearning')}: ${[...props.serviceLearningTypes].sort((a, b) => {
                                // SO (optional) always comes before SC (compulsory)
                                if (a === 'optional' && b === 'compulsory') return -1;
                                if (a === 'compulsory' && b === 'optional') return 1;
                                return 0;
                              }).map(type => 
                                `${type === 'compulsory' ? t('review.compulsory') : t('review.optional')}${type === props.currentTermServiceLearning ? ` (${t('teaching.current')})` : ''}`
                              ).join(', ')}`}
                              hasClickAction={true}
                              clickActionText={
                                (isMobile && props.enableTwoTapMode) ? t('tooltip.clickAgainToFilter') : undefined
                              }
                              showCloseButton={true}
                              onReset={props.enableTwoTapMode ? resetServiceLearningState : undefined}
                              open={(isMobile && props.enableTwoTapMode) ? serviceLearningTooltipOpen : undefined}
                              onOpenChange={(isMobile && props.enableTwoTapMode) ? setServiceLearningTooltipOpen : undefined}
                            >
                              <span 
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800 shrink-0 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/40 hover:scale-105 transition-all duration-200"
                                onClick={handleServiceLearningClick}
                              >
                                <div className="flex items-center gap-1">
                                  {[...props.serviceLearningTypes].sort((a, b) => {
                                    // SO (optional) always comes before SC (compulsory)
                                    if (a === 'optional' && b === 'compulsory') return -1;
                                    if (a === 'compulsory' && b === 'optional') return 1;
                                    return 0;
                                  }).map((type, index) => (
                                    <span 
                                      key={type}
                                      className={`${
                                        index > 0 ? 'border-l border-purple-300 dark:border-purple-700 pl-1' : ''
                                      }`}
                                    >
                                      <span className={type === props.currentTermServiceLearning ? 'underline' : ''}>
                                        {type === 'compulsory' ? 'SC' : 'SO'}
                                      </span>
                                    </span>
                                  ))}
                                </div>
                              </span>
                            </ResponsiveTooltip>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 開設狀態徽章和平均GPA */}
              <div className="flex flex-col items-end">
                <ResponsiveTooltip content={props.isOfferedInCurrentTerm ? t('offered.tooltip.clickable').replace('{term}', currentTermName) : t('offered.tooltip.no').replace('{term}', currentTermName)}>
                  <Badge 
                    variant={props.isOfferedInCurrentTerm ? "default" : "secondary"}
                    className={`text-xs font-medium flex-shrink-0 transition-all duration-200 ${
                      props.isOfferedInCurrentTerm 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 cursor-help hover:bg-green-200 dark:hover:bg-green-900/40 hover:scale-105' 
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 cursor-help'
                    }`}
                    onClick={props.isOfferedInCurrentTerm ? handleOfferedBadgeClick : undefined}
                  >
                    {props.isOfferedInCurrentTerm ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {t('offered.yes')}
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        {t('offered.no')}
                      </>
                    )}
                  </Badge>
                </ResponsiveTooltip>
                
                {/* Average GPA below offered badge */}
                <AverageGPADisplay gpa={props.averageGPA} isLoading={courseStatsLoading} />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              
              {/* 3個水平統計框 - 移到評論數量下方 */}
              <div className="flex gap-2 mt-2 w-full">
                {courseStatsLoading ? (
                  <>
                    <StatBoxLoading 
                      label={t('card.workload')}
                    />
                    <StatBoxLoading 
                      label={t('card.difficulty')}
                    />
                    <StatBoxLoading 
                      label={t('card.usefulness')}
                    />
                  </>
                ) : (
                  <>
                    <StatBox
                      icon={Scale}
                      value={props.averageWorkload || 0}
                      label={t('card.workload')}
                    />
                    <StatBox
                      icon={Brain}
                      value={props.averageDifficulty || 0}
                      label={t('card.difficulty')}
                    />
                    <StatBox
                      icon={Target}
                      value={props.averageUsefulness || 0}
                      label={t('card.usefulness')}
                    />
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            {/* 底部區域：評論數量在左側，收藏按鈕在右側 */}
            <div className="flex items-center justify-between">
              {/* 評論數量 - 圖標和數字在同一行 */}
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                <span>
                  {props.reviewCount} {props.reviewCount === 1 ? t('card.review') : t('card.reviews')}
                </span>
              </div>
              
              {/* 收藏按鈕 - 右下角 */}
                              <FavoriteButton 
                  type="course" 
                  itemId={props.code}
                  size="sm"
                  variant="ghost"
                  externalIsFavorited={props.isFavorited}
                  onToggle={props.onFavoriteToggle}
                />
            </div>
          </CardContent>
        </Card>
      </a>
    );
  }

  // 講師卡片 - 使用與課程卡片相同的佈局結構
  const instructorUrl = `/instructors/${encodeURIComponent(props.name)}`;
  
  return (
    <a 
      href={instructorUrl}
      className="block no-underline"
      onClick={(e) => {
        // Only prevent default if it's a special click (Ctrl, Cmd, middle-click)
        // Let normal clicks use the default link behavior
        if (e.ctrlKey || e.metaKey || e.button === 1) {
          // Let browser handle these naturally
          return;
        }
        // For normal clicks, prevent default and use React Router
        e.preventDefault();
        navigate(instructorUrl);
      }}
    >
      <Card 
        className="course-card group cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] relative"
      >
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors duration-200 line-clamp-2">
                {props.name}
              </CardTitle>
              <div className="mt-1">
                {/* 在中文模式下顯示中文名稱 - 只在有中文名稱時顯示 */}
                {((currentLanguage === 'zh-TW' && props.nameTc) || (currentLanguage === 'zh-CN' && props.nameSc)) && (
                  <div className="mb-1">
                    {currentLanguage === 'zh-TW' && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        {props.nameTc}
                      </p>
                    )}
                    {currentLanguage === 'zh-CN' && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        {props.nameSc}
                      </p>
                    )}
                  </div>
                )}
                <div className="flex items-start text-sm text-gray-600 dark:text-muted-foreground">
                  <div className={`${currentLanguage === 'en' ? 'flex flex-col items-start gap-1.5' : 'flex flex-wrap items-center gap-1 sm:gap-1.5'} min-w-0 w-full`} style={{ minHeight: '2rem' }} data-badge-container>
                    {/* Faculty Badge */}
                    {getFacultyByDepartment(props.department) && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 shrink-0">
                        {t(getFacultyByDepartment(props.department))}
                      </span>
                    )}
                    {/* Department Badge */}
                    <ResponsiveTooltip 
                      content={t('filter.clickToFilterDepartment')}
                      hasClickAction={true}
                      clickActionText={(props.enableTwoTapMode) ? t('tooltip.clickAgainToFilter') : undefined}
                      showCloseButton={true}
                      onReset={props.enableTwoTapMode ? resetDepartmentState : undefined}
                      open={(isMobile && props.enableTwoTapMode) ? departmentTooltipOpen : undefined}
                      onOpenChange={(isMobile && props.enableTwoTapMode) ? setDepartmentTooltipOpen : undefined}
                    >
                      <span 
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 cursor-pointer transition-all duration-200 hover:scale-105 hover:bg-gray-200 dark:hover:bg-gray-700 shrink-0 max-w-full"
                        onClick={handleDepartmentBadgeClick}
                      >
                        <span className="break-words hyphens-auto">
                          {translateDepartmentName(props.department, t)}
                        </span>
                      </span>
                    </ResponsiveTooltip>
                    {/* Teaching Language Badge */}
                    {props.teachingLanguages && props.teachingLanguages.length > 0 && (
                      <ResponsiveTooltip 
                        content={props.teachingLanguages.map(code => `${code}: ${getTeachingLanguageName(code, t)}`).join('\n')}
                        hasClickAction={true}
                        clickActionText={
                          (isMobile && props.enableTwoTapMode) ? t('tooltip.clickAgainToFilter') : undefined
                        }
                        showCloseButton={true}
                        onReset={props.enableTwoTapMode ? resetTeachingLanguageState : undefined}
                        open={(isMobile && props.enableTwoTapMode) ? teachingLanguageTooltipOpen : undefined}
                        onOpenChange={(isMobile && props.enableTwoTapMode) ? setTeachingLanguageTooltipOpen : undefined}
                      >
                        <span 
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800 shrink-0 cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/40 hover:scale-105 transition-all duration-200"
                          onClick={handleTeachingLanguageClick}
                        >
                          <div className="flex items-center gap-1">
                            {props.teachingLanguages.map((code, index) => (
                              <span 
                                key={code}
                                className={`${
                                  index > 0 ? 'border-l border-orange-300 dark:border-orange-700 pl-1' : ''
                                }`}
                              >
                                <span className={code === props.currentTermTeachingLanguage ? 'underline' : ''}>
                                  {code}
                                </span>
                              </span>
                            ))}
                          </div>
                        </span>
                      </ResponsiveTooltip>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* 教學狀態徽章和平均GPA */}
            <div className="flex flex-col items-end">
              <ResponsiveTooltip 
                content={props.isTeachingInCurrentTerm ? t('teaching.tooltip.clickable').replace('{term}', currentTermName) : t('teaching.tooltip.no').replace('{term}', currentTermName)}
                hasClickAction={props.isTeachingInCurrentTerm}
                clickActionText={props.enableTwoTapMode ? t('tooltip.clickAgainToFilter') : undefined}
                showCloseButton={true}
                onReset={props.enableTwoTapMode ? resetTeachingBadgeState : undefined}
                open={(isMobile && props.enableTwoTapMode) ? teachingBadgeTooltipOpen : undefined}
                onOpenChange={(isMobile && props.enableTwoTapMode) ? setTeachingBadgeTooltipOpen : undefined}
              >
                <Badge 
                  variant={props.isTeachingInCurrentTerm ? "default" : "secondary"}
                  className={`text-xs font-medium flex-shrink-0 transition-all duration-200 ${
                    props.isTeachingInCurrentTerm 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 cursor-help hover:bg-green-200 dark:hover:bg-green-900/40 hover:scale-105' 
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 cursor-help'
                  }`}
                  onClick={props.isTeachingInCurrentTerm ? handleTeachingBadgeClick : undefined}
                >
                  {props.isTeachingInCurrentTerm ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {t('teaching.yes')}
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      {t('teaching.no')}
                    </>
                  )}
                </Badge>
              </ResponsiveTooltip>
              
              {/* Average GPA below teaching badge */}
              <AverageGPADisplay gpa={props.averageGPA} isLoading={props.isLoading} />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            {/* 2個水平統計框 - 與課程卡片相同的格式 */}
            <div className="flex gap-2 mt-2 w-full">
              {props.isLoading ? (
                <>
                  <StatBoxLoading 
                    label={t('card.teaching')}
                  />
                  <StatBoxLoading 
                    label={t('card.grading')}
                  />
                </>
              ) : (
                <>
                  <StatBox
                    icon={Award}
                    value={props.teachingScore}
                    label={t('card.teaching')}
                  />
                  <StatBox
                    icon={Scale}
                    value={props.gradingFairness}
                    label={t('card.grading')}
                  />
                </>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {/* 底部區域：評論數量在左側，收藏按鈕在右側 */}
          <div className="flex items-center justify-between">
            {/* 評論數量 - 圖標和數字在同一行 */}
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
              <span>
                {props.reviewCount} {props.reviewCount === 1 ? t('card.review') : t('card.reviews')}
              </span>
            </div>
            
            {/* 收藏按鈕 - 右下角 */}
                          <FavoriteButton 
                type="instructor" 
                itemId={props.name}
                size="sm"
                variant="ghost"
                externalIsFavorited={props.isFavorited}
                onToggle={props.onFavoriteToggle}
              />
          </div>
        </CardContent>
      </Card>
    </a>
  );
}; 