import { Star, MessageSquare, BookOpen, Mail, CheckCircle, XCircle, GraduationCap, Clock, Zap, TrendingUp, Loader2, Award, Scale } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { StarRating } from '@/components/ui/star-rating';
import { useCourseDetailedStats } from '@/hooks/useCourseDetailedStats';

interface PopularCourseCardProps {
  type: 'course';
  title: string;
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
  email: string;
  reviewCount: number;
  teachingScore: number;
  gradingFairness: number;
}

type PopularItemCardProps = PopularCourseCardProps | PopularInstructorCardProps;

export const PopularItemCard = (props: PopularItemCardProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

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

  // 統計框組件 - 更小的版本用於標題旁邊
  const StatBox = ({ icon: Icon, value, label, color }: { 
    icon: any, 
    value: number, 
    label: string, 
    color: string 
  }) => (
    <div className={`flex flex-col items-center px-1.5 py-1.5 bg-gradient-to-br ${color} rounded-md border text-xs`}>
      <Icon className="h-3 w-3 mb-0.5" />
      <span className="font-bold text-xs">{value > 0 ? value.toFixed(1) : 'N/A'}</span>
      <span className="text-xs font-medium leading-tight">{label}</span>
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

  // 講師統計框組件 - 用於講師卡片右側
  const InstructorStatBox = ({ icon: Icon, value, label, color }: { 
    icon: any, 
    value: number, 
    label: string, 
    color: string 
  }) => (
    <div className={`flex flex-col items-center px-1.5 py-1.5 bg-gradient-to-br ${color} rounded-md border text-xs`}>
      <Icon className="h-3 w-3 mb-0.5" />
      <span className="font-bold text-xs">{value > 0 ? value.toFixed(1) : 'N/A'}</span>
      <span className="text-xs font-medium leading-tight">{label}</span>
    </div>
  );

  if (props.type === 'course') {
    return (
      <Card 
        className="course-card group cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] overflow-hidden relative"
        onClick={handleClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors duration-200 line-clamp-2 mb-1">
                {props.title}
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-muted-foreground font-mono">{props.code}</p>
              {/* Review count display */}
              <div className="flex items-center gap-1 mt-1">
                <MessageSquare className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {props.reviewCount} {props.reviewCount === 1 ? t('card.review') : t('card.reviews')}
                </span>
              </div>
            </div>
            
            {/* 3個水平統計框 - 移到右側 */}
            <div className="flex gap-1.5 shrink-0">
              {isLoading ? (
                <>
                  <StatBoxLoading color="from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800/30 text-blue-600 dark:text-blue-400" />
                  <StatBoxLoading color="from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800/30 text-amber-600 dark:text-amber-400" />
                  <StatBoxLoading color="from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800/30 text-green-600 dark:text-green-400" />
                </>
              ) : (
                <>
                  <StatBox
                    icon={Clock}
                    value={stats?.averageWorkload || 0}
                    label={t('card.workload')}
                    color="from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800/30 text-blue-600 dark:text-blue-400"
                  />
                  <StatBox
                    icon={Zap}
                    value={stats?.averageDifficulty || 0}
                    label={t('card.difficulty')}
                    color="from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800/30 text-amber-600 dark:text-amber-400"
                  />
                  <StatBox
                    icon={TrendingUp}
                    value={stats?.averageUsefulness || 0}
                    label={t('card.usefulness')}
                    color="from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800/30 text-green-600 dark:text-green-400"
                  />
                </>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {/* 底部區域：開設狀態徽章和學系標籤 */}
          <div className="flex items-center justify-between">
            {/* 左側：開設狀態徽章 */}
            <Badge 
              variant={props.isOfferedInCurrentTerm ? "default" : "secondary"}
              className={`text-xs font-medium ${
                props.isOfferedInCurrentTerm 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}
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

            {/* 右側：學系標籤 */}
            <Badge variant="secondary" className="text-xs bg-gray-600 text-white dark:bg-gray-700 dark:text-gray-200">
              <BookOpen className="h-3 w-3 mr-1 text-white dark:text-gray-200" />
              {props.department}
            </Badge>
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
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors duration-200 line-clamp-2 mb-1">
              {props.name}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-muted-foreground">
              <Mail className="h-3 w-3 shrink-0 text-blue-500" />
              <span className="truncate">{props.email}</span>
            </div>
            {/* Review count display */}
            <div className="flex items-center gap-1 mt-1">
              <MessageSquare className="h-3 w-3 text-gray-500 dark:text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {props.reviewCount} {props.reviewCount === 1 ? t('card.review') : t('card.reviews')}
              </span>
            </div>
          </div>
          
          {/* 2個水平統計框 - 教學評分和評分公平性 */}
          <div className="flex gap-1.5 shrink-0">
            <InstructorStatBox
              icon={Award}
              value={props.teachingScore}
              label={t('card.teaching')}
              color="from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800/30 text-purple-600 dark:text-purple-400"
            />
            <InstructorStatBox
              icon={Scale}
              value={props.gradingFairness}
              label={t('card.grading')}
              color="from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border-indigo-200 dark:border-indigo-800/30 text-indigo-600 dark:text-indigo-400"
            />
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}; 