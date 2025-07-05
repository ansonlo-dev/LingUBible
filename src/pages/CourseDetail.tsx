import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Star, 
  MessageSquare, 
  BookOpen, 
  Calendar, 
  Mail, 
  Loader2, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Users,
  Info
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/hooks/useLanguage';
import { useCourseDetailOptimized } from '@/hooks/useCourseDetailOptimized';
import { CourseService, type Course, type CourseReviewInfo, type CourseTeachingInfo } from '@/services/api/courseService';
import { CourseReviewsList } from '@/components/features/reviews/CourseReviewsList';
import { getCourseTitle, translateDepartmentName } from '@/utils/textUtils';
import { getCurrentTermName, getCurrentTermCode } from '@/utils/dateUtils';
import { FavoriteButton } from '@/components/ui/FavoriteButton';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import GradeDistributionChart from '@/components/features/reviews/GradeDistributionChart';
import { calculateGradeDistributionFromReviews } from '@/utils/gradeUtils';

// Faculty mapping function - copied from Lecturers.tsx
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

const CourseDetail = () => {
  const { courseCode } = useParams<{ courseCode: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  
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
  const [selectedTermFilter, setSelectedTermFilter] = useState<string>('all');
  const [activeTeachingTab, setActiveTeachingTab] = useState<string>('lecture');
  const [externalGradeFilter, setExternalGradeFilter] = useState<string>('');

  // Grade distribution chart filter state
  const [selectedGradeChartFilter, setSelectedGradeChartFilter] = useState<string>('all');

  // 解構數據
  const { course, courseStats, teachingInfo, reviews: allReviews, allReviewsForChart, isOfferedInCurrentTerm, detailedStats } = data;

  // Generate filter options for grade distribution chart (instructors)
  const gradeChartFilterOptions = React.useMemo(() => {
    if (!allReviewsForChart || allReviewsForChart.length === 0) return [];
    
    const instructorMap = new Map<string, { name: string; sessionType: string; count: number }>();
    allReviewsForChart.forEach(reviewInfo => {
      // Get instructor names from instructor_details JSON
      try {
        const instructorDetails = JSON.parse(reviewInfo.review.instructor_details);
        instructorDetails.forEach((detail: any) => {
          if (detail.instructor_name && detail.session_type) {
            const key = `${detail.instructor_name}|${detail.session_type}`;
            if (instructorMap.has(key)) {
              instructorMap.get(key)!.count++;
            } else {
              instructorMap.set(key, {
                name: detail.instructor_name,
                sessionType: detail.session_type,
                count: 1
              });
            }
          }
        });
      } catch (error) {
        console.warn('Failed to parse instructor details:', error);
      }
    });
    
    return Array.from(instructorMap.entries())
      .map(([key, data]) => ({
        value: key,
        label: `${data.name} (${t(`sessionType.${data.sessionType.toLowerCase()}`)})`,
        count: data.count,
        sessionType: data.sessionType,
        instructorName: data.name
      }))
      .sort((a, b) => {
        // First sort by session type: lecture before tutorial
        if (a.sessionType !== b.sessionType) {
          // Lecture comes before Tutorial
          if (a.sessionType.toLowerCase() === 'lecture') return -1;
          if (b.sessionType.toLowerCase() === 'lecture') return 1;
          if (a.sessionType.toLowerCase() === 'tutorial') return -1;
          if (b.sessionType.toLowerCase() === 'tutorial') return 1;
        }
        
        // Within same session type, sort by instructor name alphabetically
        return a.instructorName.localeCompare(b.instructorName);
      })
      .map(({ value, label, count }) => ({ value, label, count })); // Remove extra sorting fields
  }, [allReviewsForChart, t]);

  // Filter reviews for grade distribution chart based on selected instructor
  const filteredReviewsForChart = React.useMemo(() => {
    if (!allReviewsForChart || allReviewsForChart.length === 0) return [];
    
    if (selectedGradeChartFilter === 'all') {
      return allReviewsForChart;
    }
    
    const [targetInstructor, targetSessionType] = selectedGradeChartFilter.split('|');
    
    return allReviewsForChart.filter(reviewInfo => {
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
  }, [allReviewsForChart, selectedGradeChartFilter]);

  // 獲取所有可用的學期
  const availableTerms = React.useMemo(() => {
    const terms = teachingInfo.map(info => info.term);
    const uniqueTerms = terms.filter((term, index, self) => 
      self.findIndex(t => t.term_code === term.term_code) === index
    );
    return uniqueTerms.sort((a, b) => b.term_code.localeCompare(a.term_code));
  }, [teachingInfo]);

  // 根據選定的學期篩選教學信息
  const filteredTeachingInfo = React.useMemo(() => {
    if (selectedTermFilter === 'all') {
      return teachingInfo;
    }
    return teachingInfo.filter(info => info.term.term_code === selectedTermFilter);
  }, [teachingInfo, selectedTermFilter]);

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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center items-center min-h-[400px]">
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
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center items-center min-h-[400px]">
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
              <Button onClick={() => navigate('/courses')} className="h-12 text-base font-medium">
                {t('pages.courseDetail.backToCourseList')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 pb-20 overflow-hidden">
      {/* 課程基本信息 */}
      <CollapsibleSection
        className="course-card"
        title={t('pages.courseDetail.courseInfo')}
        icon={<Info className="h-5 w-5" />}
        defaultExpanded={true}
        expandedHint={t('common.clickToCollapse') || 'Click to collapse'}
        collapsedHint={t('common.clickToExpand') || 'Click to expand'}
      >
        <div className="space-y-4 overflow-hidden">
          <div className="flex items-center gap-3 overflow-hidden min-w-0">
            <BookOpen className="h-8 w-8 text-primary shrink-0" />
            <div className="min-w-0 flex-1">
              {/* 課程代碼 - 作為主標題，減小字體 */}
              <CardTitle className="text-xl truncate font-mono">{course.course_code}</CardTitle>
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
              {/* 系所徽章 - 匹配講師頁面的樣式 */}
              {course.department && (
                <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mt-2" style={{ minHeight: '2rem' }}>
                  {/* Faculty Badge */}
                  {(() => {
                    const faculty = getFacultyByDepartment(course.department);
                    return faculty && (
                      <Badge 
                        variant="outline"
                        className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 shrink-0 w-fit"
                      >
                        {t(faculty)}
                      </Badge>
                    );
                  })()}
                  {/* Department Badge */}
                  <Badge 
                    variant="outline"
                    className="text-xs bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 shrink-0 w-fit max-w-full"
                  >
                    <span className="break-words hyphens-auto">
                      {language === 'en' ? `Department of ${translateDepartmentName(course.department, t)}` : translateDepartmentName(course.department, t)}
                    </span>
                  </Badge>
                </div>
              )}
            </div>
            <div className="shrink-0">
              <FavoriteButton
                type="course"
                itemId={course.course_code}
                size="lg"
                showText={true}
                variant="outline"
              />
            </div>
          </div>
          
          {/* 課程統計信息 - 響應式佈局 */}
          <div className="pt-4">
            {/* Mobile: 三個評分在一行 */}
            <div className="grid grid-cols-1 gap-4 sm:hidden">
              {/* 三個評分在一行 */}
              <div className="grid grid-cols-3 gap-2">
                {/* 平均工作量 */}
                <div className="text-center min-w-0">
                  <div className="text-xl font-bold text-primary">
                    {detailedStats.averageWorkload > 0 ? (
                      detailedStats.averageWorkload.toFixed(2)
                    ) : (
                      'N/A'
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{t('pages.courseDetail.averageWorkloadShort')}</div>
                  {detailedStats.averageWorkload === 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {t('pages.courseDetail.noRatingData')}
                    </div>
                  )}
                </div>
                
                {/* 平均難度 */}
                <div className="text-center min-w-0">
                  <div className="text-xl font-bold text-primary">
                    {detailedStats.averageDifficulty > 0 ? (
                      detailedStats.averageDifficulty.toFixed(2)
                    ) : (
                      'N/A'
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{t('pages.courseDetail.averageDifficultyShort')}</div>
                  {detailedStats.averageDifficulty === 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {t('pages.courseDetail.noRatingData')}
                    </div>
                  )}
                </div>
                
                {/* 平均實用性 */}
                <div className="text-center min-w-0">
                  <div className="text-xl font-bold text-primary">
                    {detailedStats.averageUsefulness > 0 ? (
                      detailedStats.averageUsefulness.toFixed(2)
                    ) : (
                      'N/A'
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{t('pages.courseDetail.averageUsefulnessShort')}</div>
                  {detailedStats.averageUsefulness === 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {t('pages.courseDetail.noRatingData')}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Tablet and Desktop: 統一使用 3 列佈局 */}
            <div className="hidden sm:grid sm:grid-cols-3 gap-4">
              {/* 平均工作量 */}
              <div className="text-center min-w-0">
                <div className="text-2xl font-bold text-primary">
                  {detailedStats.averageWorkload > 0 ? (
                    detailedStats.averageWorkload.toFixed(2)
                  ) : (
                    'N/A'
                  )}
                </div>
                <div className="text-sm text-muted-foreground">{t('pages.courseDetail.averageWorkload')}</div>
                {detailedStats.averageWorkload === 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {t('pages.courseDetail.noRatingData')}
                  </div>
                )}
              </div>
              
              {/* 平均難度 */}
              <div className="text-center min-w-0">
                <div className="text-2xl font-bold text-primary">
                  {detailedStats.averageDifficulty > 0 ? (
                    detailedStats.averageDifficulty.toFixed(2)
                  ) : (
                    'N/A'
                  )}
                </div>
                <div className="text-sm text-muted-foreground">{t('pages.courseDetail.averageDifficulty')}</div>
                {detailedStats.averageDifficulty === 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {t('pages.courseDetail.noRatingData')}
                  </div>
                )}
              </div>
              
              {/* 平均實用性 */}
              <div className="text-center min-w-0">
                <div className="text-2xl font-bold text-primary">
                  {detailedStats.averageUsefulness > 0 ? (
                    detailedStats.averageUsefulness.toFixed(2)
                  ) : (
                    'N/A'
                  )}
                </div>
                <div className="text-sm text-muted-foreground">{t('pages.courseDetail.averageUsefulness')}</div>
                {detailedStats.averageUsefulness === 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {t('pages.courseDetail.noRatingData')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 成績分佈圖表 */}
          {!reviewsLoading && allReviewsForChart.length > 0 && (
            <div className="pt-4">
              <GradeDistributionChart
                gradeDistribution={calculateGradeDistributionFromReviews(filteredReviewsForChart.map(review => ({ course_final_grade: review.review.course_final_grade })))}
                loading={reviewsLoading}
                title={t('chart.gradeDistribution')}
                height={120}
                showPercentage={true}
                className="bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800"
                context="course"
                filterOptions={gradeChartFilterOptions}
                selectedFilter={selectedGradeChartFilter}
                onFilterChange={setSelectedGradeChartFilter}
                filterLabel={t('chart.filterByInstructor')}
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
          )}
        </div>
      </CollapsibleSection>

      {/* 教學記錄 */}
      <CollapsibleSection
        className="course-card"
        title={t('pages.courseDetail.offerRecords')}
        icon={<Calendar className="h-5 w-5" />}
        badge={
          teachingInfoLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Badge 
              variant={isOfferedInCurrentTerm ? "default" : "secondary"}
              className={`text-xs font-medium transition-all duration-200 cursor-help ${
                isOfferedInCurrentTerm 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/40 hover:scale-105' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}
              title={isOfferedInCurrentTerm ? t('offered.tooltip.clickable').replace('{term}', currentTermName) : t('offered.tooltip.no').replace('{term}', currentTermName)}
              onClick={isOfferedInCurrentTerm ? handleOfferedBadgeClick : undefined}
            >
              {isOfferedInCurrentTerm ? (
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
          )
        }
        defaultExpanded={true}
        expandedHint={t('common.clickToCollapse') || 'Click to collapse'}
        collapsedHint={t('common.clickToExpand') || 'Click to expand'}
      >
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <TabsList className="bg-muted/50 backdrop-blur-sm w-full sm:w-auto">
                  <TabsTrigger 
                    value="lecture" 
                    className="hover:shadow-md transition-[transform,box-shadow] duration-200 data-[state=active]:shadow-lg flex-1 sm:flex-none"
                  >
                    {t('sessionType.lecture')} ({filteredTeachingInfo.filter(info => info.sessionType === 'Lecture').length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="tutorial" 
                    className="hover:shadow-md transition-[transform,box-shadow] duration-200 data-[state=active]:shadow-lg flex-1 sm:flex-none"
                  >
                    {t('sessionType.tutorial')} ({filteredTeachingInfo.filter(info => info.sessionType === 'Tutorial').length})
                  </TabsTrigger>
                </TabsList>

                {/* 學期篩選器 - 移到右側 */}
                <div className="flex items-center gap-2 sm:ml-auto">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">{t('pages.courseDetail.filterByTerm')}:</span>
                  <Select value={selectedTermFilter} onValueChange={setSelectedTermFilter}>
                    <SelectTrigger className="w-[180px] h-8">
                      <SelectValue placeholder={t('common.all')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('common.all')}</SelectItem>
                      {availableTerms.map((term) => (
                        <SelectItem key={term.term_code} value={term.term_code}>
                          {term.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    .sort(([a], [b]) => a.localeCompare(b)) // Sort by instructor name alphabetically
                    .map(([instructorName, data]) => (
                      <div key={instructorName} className="flex items-center justify-between p-3 rounded-lg ">
                        {/* Left side: Instructor name */}
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
                        
                        {/* Right side: Terms */}
                        <div className="flex items-center gap-2 flex-wrap justify-end">
                          {data.terms
                            .sort((a, b) => b.term_code.localeCompare(a.term_code)) // Sort terms by code descending
                            .map((term, termIndex) => (
                            <button
                              key={termIndex}
                              onClick={() => {
                                // 如果已經選中該學期，則取消篩選（設為 'all'）
                                if (selectedTermFilter === term.term_code) {
                                  setSelectedTermFilter('all');
                                } else {
                                  setSelectedTermFilter(term.term_code);
                                }
                              }}
                              className={`px-2 py-1 text-xs rounded-md transition-colors border ${
                                selectedTermFilter === term.term_code
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'bg-background hover:bg-muted border-border hover:border-primary/50'
                              }`}
                            >
                              {term.name}
                            </button>
                          ))}
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
                    .sort(([a], [b]) => a.localeCompare(b)) // Sort by instructor name alphabetically
                    .map(([instructorName, data]) => (
                      <div key={instructorName} className="flex items-center justify-between p-3 rounded-lg ">
                        {/* Left side: Instructor name */}
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
                        
                        {/* Right side: Terms */}
                        <div className="flex items-center gap-2 flex-wrap justify-end">
                          {data.terms
                            .sort((a, b) => b.term_code.localeCompare(a.term_code)) // Sort terms by code descending
                            .map((term, termIndex) => (
                            <button
                              key={termIndex}
                              onClick={() => {
                                // 如果已經選中該學期，則取消篩選（設為 'all'）
                                if (selectedTermFilter === term.term_code) {
                                  setSelectedTermFilter('all');
                                } else {
                                  setSelectedTermFilter(term.term_code);
                                }
                              }}
                              className={`px-2 py-1 text-xs rounded-md transition-colors border ${
                                selectedTermFilter === term.term_code
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'bg-background hover:bg-muted border-border hover:border-primary/50'
                              }`}
                            >
                              {term.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
      </CollapsibleSection>

      {/* 課程評論 */}
      <CollapsibleSection
        className="course-card"
        title={t('review.studentReviews')}
        icon={<MessageSquare className="h-5 w-5" />}
        defaultExpanded={true}
        expandedHint={t('common.clickToCollapse') || 'Click to collapse'}
        collapsedHint={t('common.clickToExpand') || 'Click to expand'}
        contentClassName="space-y-4"
      >
        <div id="student-reviews">
          {reviewsLoading ? (
            <div className="text-center py-12 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">{t('review.loadingCourseReviews')}</p>
            </div>
                     ) : allReviews.length === 0 ? (
             <div className="text-center py-12 space-y-4">
               <div className="flex justify-center">
                 <div className="p-4 bg-muted/50 rounded-full">
                   <MessageSquare className="h-12 w-12 text-muted-foreground" />
                 </div>
               </div>
               <div className="space-y-2">
                 <h3 className="text-lg font-medium text-muted-foreground">{t('course.noReviewsTitle')}</h3>
                 <p className="text-sm text-muted-foreground max-w-md mx-auto">
                   {t('course.noReviewsDescription', { courseName: course ? `${course.course_code} ${getCourseTitle(course, language).primary}` : '' })}
                 </p>
               </div>
             </div>
          ) : (
                      <CourseReviewsList 
            reviews={allReviews} 
            allReviews={allReviews}
            loading={reviewsLoading}
            hideHeader={true}
            externalGradeFilter={externalGradeFilter}
          />
          )}
        </div>
      </CollapsibleSection>

      {/* 操作按鈕 */}
      <div className="flex gap-3 pb-8 md:pb-0">
        <Button 
          className="flex-1 h-12 text-base font-medium gradient-primary hover:opacity-90 text-white"
          onClick={() => navigate(`/write-review/${course.course_code}`)}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          {t('review.writeReview')}
        </Button>
        <Button 
          variant="outline" 
          className="flex-1 h-12 text-base font-medium hover:bg-primary/10 hover:text-primary"
          onClick={() => navigate('/courses')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
      </div>
    </div>
  );
};

export default CourseDetail; 