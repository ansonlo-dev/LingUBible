import { Star, MessageSquare, BookOpen, Mail, CheckCircle, XCircle, GraduationCap, Scale, Brain, Target, Loader2, Award, Building } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { StarRating } from '@/components/ui/star-rating';
import { useCourseDetailedStats } from '@/hooks/useCourseDetailedStats';
import { getCourseTitle, getInstructorName, translateDepartmentName } from '@/utils/textUtils';
import { getCurrentTermName } from '@/utils/dateUtils';

interface PopularCourseCardProps {
  type: 'course';
  title: string;
  titleTc?: string;
  titleSc?: string;
  code: string;
  department: string;
  language: string;
  rating: number;
  reviewCount: number;
  isOfferedInCurrentTerm?: boolean;
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
  isTeachingInCurrentTerm?: boolean;
}

type PopularItemCardProps = PopularCourseCardProps | PopularInstructorCardProps;

export const PopularItemCard = (props: PopularItemCardProps) => {
  const navigate = useNavigate();
  const { t, language: currentLanguage } = useLanguage();
  const currentTermName = getCurrentTermName();
  
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

  const handleClick = () => {
    if (props.type === 'course') {
      navigate(`/courses/${props.code}`);
    } else {
      navigate(`/instructors/${encodeURIComponent(props.name)}`);
    }
  };

  // 課程統計 hook（只在課程類型時使用）
  const { stats, isLoading } = props.type === 'course' 
    ? useCourseDetailedStats(props.code)
    : { stats: null, isLoading: false };

  // 根據評分獲取漸變背景色（0-5分，紅色到綠色）
  const getRatingGradientColor = (value: number, isDarkMode: boolean = false) => {
    // 確保評分在0-5範圍內
    const clampedValue = Math.max(0, Math.min(5, value));
    
    // 將0-5的評分映射到0-1的範圍
    const ratio = clampedValue / 5;
    
    // 使用HSL色彩空間創建從紅色(0°)到綠色(120°)的漸變
    const hue = ratio * 120; // 0到120度
    const saturation = 95; // 提高飽和度到95%，讓顏色更鮮艷
    
    // 調整亮度確保文字可讀性，深色模式使用更深的顏色
    const lightness = isDarkMode ? 30 : 45; // 深色模式30%，淺色模式45%，讓顏色更深更突出
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  // 統計框組件 - 評分類型在框外，只有數字在框內
  const StatBox = ({ icon: Icon, value, label }: { 
    icon: any, 
    value: number, 
    label: string
  }) => {
    const hasValidData = value > 0;
    
    // 檢測深色模式
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    const backgroundColor = hasValidData 
      ? getRatingGradientColor(value, isDarkMode) 
      : (isDarkMode ? '#4B5563' : '#9CA3AF'); // 深色模式用更深的灰色
    
    const displayValue = hasValidData ? value.toFixed(1) : 'N/A';
    
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
    
    return (
      <div className="flex flex-col items-center gap-1 flex-1">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide text-center">{label}</span>
        <div 
          className="flex items-center justify-center px-3 py-1.5 rounded-lg hover:scale-105 transition-transform cursor-help"
          style={{ backgroundColor, width: '90%' }}
          title={getTooltipText()}
        >
          <span className={`font-bold text-base ${isDarkMode ? 'text-white' : 'text-black'} drop-shadow-sm`}>{displayValue}</span>
        </div>
      </div>
    );
  };

  // 載入中的統計框 - 匹配新樣式
  const StatBoxLoading = ({ label }: { label: string }) => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    const backgroundColor = isDarkMode ? '#4B5563' : '#9CA3AF';
    
    return (
      <div className="flex flex-col items-center gap-1 flex-1">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide text-center">{label}</span>
        <div 
          className="flex items-center justify-center px-3 py-1.5 rounded-lg animate-pulse"
          style={{ backgroundColor, width: '90%' }}
        >
          <span className={`font-bold text-base ${isDarkMode ? 'text-white' : 'text-black'} drop-shadow-sm`}>--</span>
        </div>
      </div>
    );
  };



  if (props.type === 'course') {
    return (
      <Card 
        className="course-card group cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] overflow-hidden relative"
        onClick={handleClick}
      >
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors duration-200 line-clamp-2 font-mono">
                {props.code}
              </CardTitle>
              <div className="mt-1">
                <p className="text-sm text-gray-600 dark:text-muted-foreground">{titleInfo?.primary}</p>
                {titleInfo?.secondary && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{titleInfo.secondary}</p>
                )}
              </div>
            </div>
            
            {/* 開設狀態徽章 - 移到右上角 */}
            <Badge 
              variant={props.isOfferedInCurrentTerm ? "default" : "secondary"}
              className={`text-xs font-medium ml-2 flex-shrink-0 cursor-help ${
                props.isOfferedInCurrentTerm 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}
              title={props.isOfferedInCurrentTerm ? t('offered.tooltip.yes').replace('{term}', currentTermName) : t('offered.tooltip.no').replace('{term}', currentTermName)}
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
          </div>
          
          <div className="flex-1 min-w-0">
            
            {/* 3個水平統計框 - 移到評論數量下方 */}
            <div className="flex gap-2 mt-2 w-full">
              {isLoading ? (
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
                    value={stats?.averageWorkload || 0}
                    label={t('card.workload')}
                  />
                  <StatBox
                    icon={Brain}
                    value={stats?.averageDifficulty || 0}
                    label={t('card.difficulty')}
                  />
                  <StatBox
                    icon={Target}
                    value={stats?.averageUsefulness || 0}
                    label={t('card.usefulness')}
                  />
                </>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {/* 底部區域：評論數量在左側 */}
          <div className="flex items-center justify-start">
            {/* 評論數量 */}
            <div className="flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {props.reviewCount} {props.reviewCount === 1 ? t('card.review') : t('card.reviews')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 講師卡片 - 使用與課程卡片相同的佈局結構
  return (
    <Card 
      className="course-card group cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] overflow-hidden relative"
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors duration-200 line-clamp-2">
              {props.name}
            </CardTitle>
            <div className="mt-1">
              {/* 在中文模式下顯示中文名稱 */}
              {currentLanguage === 'zh-TW' && props.nameTc && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium">{props.nameTc}</p>
              )}
              {currentLanguage === 'zh-CN' && props.nameSc && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium">{props.nameSc}</p>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-muted-foreground">
                <Building className="h-3 w-3 shrink-0 text-blue-500" />
                <span className="truncate">{translateDepartmentName(props.department, t)}</span>
              </div>
            </div>
          </div>
          
          {/* 教學狀態徽章 - 移到右上角，類似課程的開設狀態徽章 */}
          <Badge 
            variant={props.isTeachingInCurrentTerm ? "default" : "secondary"}
            className={`text-xs font-medium ml-2 flex-shrink-0 cursor-help ${
              props.isTeachingInCurrentTerm 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            }`}
            title={props.isTeachingInCurrentTerm ? t('teaching.tooltip.yes').replace('{term}', currentTermName) : t('teaching.tooltip.no').replace('{term}', currentTermName)}
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
        </div>
        
        <div className="flex-1 min-w-0">
          {/* 2個水平統計框 - 與課程卡片相同的格式 */}
          <div className="flex gap-2 mt-2 w-full">
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
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* 底部區域：評論數量 */}
        <div className="flex items-center justify-start">
          {/* 評論數量 */}
          <div className="flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {props.reviewCount} {props.reviewCount === 1 ? t('card.review') : t('card.reviews')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 