import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { useState, useEffect } from 'react';
import { 
  Users, 
  ArrowLeft,
  Mail,
  BookOpen,
  Calendar,
  Loader2,
  AlertCircle,
  MessageSquare,
  GraduationCap,
  Award,
  FileText,
  CheckCircle,
  XCircle,
  Brain,
  Target,
  User,
  ChevronDown,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Pagination } from '@/components/features/reviews/Pagination';
import { InstructorReviewsFilters, InstructorReviewFilters } from '@/components/features/reviews/InstructorReviewsFilters';
import { CourseRequirementsFilter, CourseRequirementsFilters } from '@/components/features/reviews/CourseRequirementsFilter';
import { 
  Instructor, 
  InstructorTeachingCourse, 
  InstructorReviewInfo,
  InstructorReviewFromDetails
} from '@/services/api/courseService';
import { CourseService } from '@/services/api/courseService';
import { useInstructorDetailOptimized } from '@/hooks/useInstructorDetailOptimized';
import { formatDateTimeUTC8 } from '@/utils/ui/dateUtils';
import { renderCommentMarkdown, hasMarkdownFormatting } from '@/utils/ui/markdownRenderer';
import { ReviewAvatar } from '@/components/ui/review-avatar';
import { getInstructorName, getCourseTitle } from '@/utils/textUtils';
import { StarRating } from '@/components/ui/star-rating';
import { VotingButtons } from '@/components/ui/voting-buttons';
import { cn } from '@/lib/utils';
import { GradeBadge } from '@/components/ui/GradeBadge';

const Lecturers = () => {
  const { instructorName } = useParams<{ instructorName: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, language } = useLanguage();
  
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [instructorLoading, setInstructorLoading] = useState(true);
  const [instructorError, setInstructorError] = useState<string | null>(null);
  
  // 展開其他講師評論的狀態管理
  const [expandedOtherInstructors, setExpandedOtherInstructors] = useState<{[reviewId: string]: boolean}>({});
  
  // 其他講師信息緩存
  const [otherInstructorsMap, setOtherInstructorsMap] = useState<Map<string, Instructor>>(new Map());

  // 篩選和排序狀態
  const [filters, setFilters] = useState<InstructorReviewFilters>({
    selectedLanguages: [],
    selectedTerms: [],
    selectedCourses: [],
    selectedSessionTypes: [],
    sortBy: 'postDate',
    sortOrder: 'desc',
    itemsPerPage: 12,
    currentPage: 1
  });

  // 課程要求篩選狀態
  const [requirementsFilters, setRequirementsFilters] = useState<CourseRequirementsFilters>({
    midterm: 'all',
    quiz: 'all',
    groupProject: 'all',
    individualAssignment: 'all',
    presentation: 'all',
    reading: 'all',
    attendance: 'all'
  });

  // 解碼 URL 參數
  const decodedName = instructorName ? decodeURIComponent(instructorName) : null;

  // 使用優化的 hook 來載入教學課程和評論數據
  const { 
    data: { teachingCourses, reviews }, 
    loading: detailLoading,
    teachingCoursesLoading,
    reviewsLoading,
    error: detailError 
  } = useInstructorDetailOptimized(decodedName);



  // 整體載入狀態
  const loading = instructorLoading || detailLoading;
  const error = instructorError || detailError;

  useEffect(() => {
    const loadInstructorBasicData = async () => {
      if (!decodedName) {
        setInstructorError(t('instructors.nameNotProvided'));
        setInstructorLoading(false);
        return;
      }
      
      try {
        setInstructorLoading(true);
        setInstructorError(null);
        
        const startTime = Date.now();
        
        // 只載入講師基本信息
        const instructorData = await CourseService.getInstructorByName(decodedName);
        
        const loadTime = Date.now() - startTime;
        console.log(`Instructor basic data loaded in ${loadTime}ms for:`, decodedName);
        
        if (!instructorData) {
          setInstructorError(t('instructors.notFound'));
          return;
        }
        
        setInstructor(instructorData);
      } catch (err) {
        console.error('Error loading instructor basic data:', err);
        setInstructorError(t('instructors.loadError'));
      } finally {
        setInstructorLoading(false);
      }
    };

    loadInstructorBasicData();
  }, [decodedName, t]);

  // 獲取其他講師的完整信息
  useEffect(() => {
    const fetchOtherInstructorsInfo = async () => {
      if (!reviews || !decodedName) return;
      
      const otherInstructorNames = new Set<string>();
      reviews.forEach(reviewInfo => {
        reviewInfo.instructorDetails.forEach(instructorDetail => {
          if (instructorDetail.instructor_name !== decodedName) {
            otherInstructorNames.add(instructorDetail.instructor_name);
          }
        });
      });

      const newOtherInstructorsMap = new Map<string, Instructor>();
      
      // 並行獲取所有其他講師信息
      const promises = Array.from(otherInstructorNames).map(async (name) => {
        try {
          const instructor = await CourseService.getInstructorByName(name);
          if (instructor) {
            newOtherInstructorsMap.set(name, instructor);
          }
        } catch (error) {
          console.warn(`Failed to fetch instructor info for ${name}:`, error);
        }
      });

      await Promise.all(promises);
      setOtherInstructorsMap(newOtherInstructorsMap);
    };

    fetchOtherInstructorsInfo();
  }, [reviews, decodedName]);

  // Handle scroll to specific review when review_id is in URL
  useEffect(() => {
    const reviewId = searchParams.get('review_id');
    if (reviewId && !loading) {
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
  }, [searchParams, loading]);

  const handleCourseClick = (courseCode: string, event?: React.MouseEvent) => {
    // This function is now simplified since we're using <a> tags
    // The browser will handle navigation naturally
  };

  const renderBooleanBadge = (value: boolean, label: string) => {
    return (
      <Badge 
        variant={value ? "default" : "secondary"}
        className={`text-xs shrink-0 ${value ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/20' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
      >
        {value ? (
          <CheckCircle className="h-3 w-3 mr-1 shrink-0" />
        ) : (
          <XCircle className="h-3 w-3 mr-1 shrink-0" />
        )}
        <span className="truncate">{label}</span>
      </Badge>
    );
  };

  const toggleOtherInstructors = (reviewId: string) => {
    setExpandedOtherInstructors(prev => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));
  };

  // 計算篩選器統計數據
  const getFilterCounts = () => {
    if (!reviews || reviews.length === 0) {
      return {
        languageCounts: {},
        termCounts: {},
        courseCounts: {},
        sessionTypeCounts: {}
      };
    }

    const languageCounts: { [key: string]: number } = {};
    const termCounts: { [key: string]: { name: string; count: number } } = {};
    const courseCounts: { [key: string]: { title: string; count: number } } = {};
    const sessionTypeCounts: { [key: string]: number } = {};

    reviews.forEach(reviewInfo => {
      // 語言統計
      const language = reviewInfo.review.review_language || 'en';
      languageCounts[language] = (languageCounts[language] || 0) + 1;

      // 學期統計
      if (reviewInfo.term?.term_code) {
        const termCode = reviewInfo.term.term_code;
        if (!termCounts[termCode]) {
          termCounts[termCode] = { name: reviewInfo.term.name || termCode, count: 0 };
        }
        termCounts[termCode].count++;
      }

      // 課程統計
      if (reviewInfo.course?.course_code) {
        const courseCode = reviewInfo.course.course_code;
        if (!courseCounts[courseCode]) {
          courseCounts[courseCode] = { title: reviewInfo.course.course_title || courseCode, count: 0 };
        }
        courseCounts[courseCode].count++;
      }

      // 課堂類型統計（從講師詳情中獲取）
      reviewInfo.instructorDetails.forEach(detail => {
        if (detail.session_type) {
          sessionTypeCounts[detail.session_type] = (sessionTypeCounts[detail.session_type] || 0) + 1;
        }
      });
    });

    return { languageCounts, termCounts, courseCounts, sessionTypeCounts };
  };

  // 篩選評論
  const getFilteredReviews = () => {
    if (!reviews || reviews.length === 0) return [];

    return reviews.filter(reviewInfo => {
      // 課程要求篩選 (先執行，因為可能會大幅減少評論數量)
      const hasMatchingRequirements = reviewInfo.instructorDetails.some(detail => {
        const checks = [
          requirementsFilters.midterm === 'all' || (requirementsFilters.midterm === 'has' && detail.has_midterm) || (requirementsFilters.midterm === 'no' && !detail.has_midterm),
          requirementsFilters.quiz === 'all' || (requirementsFilters.quiz === 'has' && detail.has_quiz) || (requirementsFilters.quiz === 'no' && !detail.has_quiz),
          requirementsFilters.groupProject === 'all' || (requirementsFilters.groupProject === 'has' && detail.has_group_project) || (requirementsFilters.groupProject === 'no' && !detail.has_group_project),
          requirementsFilters.individualAssignment === 'all' || (requirementsFilters.individualAssignment === 'has' && detail.has_individual_assignment) || (requirementsFilters.individualAssignment === 'no' && !detail.has_individual_assignment),
          requirementsFilters.presentation === 'all' || (requirementsFilters.presentation === 'has' && detail.has_presentation) || (requirementsFilters.presentation === 'no' && !detail.has_presentation),
          requirementsFilters.reading === 'all' || (requirementsFilters.reading === 'has' && detail.has_reading) || (requirementsFilters.reading === 'no' && !detail.has_reading),
          requirementsFilters.attendance === 'all' || (requirementsFilters.attendance === 'has' && detail.has_attendance_requirement) || (requirementsFilters.attendance === 'no' && !detail.has_attendance_requirement)
        ];
        
        // 所有條件都必須滿足 (AND logic)
        return checks.every(check => check);
      });
      
      if (!hasMatchingRequirements) return false;

      // 語言篩選
      if (filters.selectedLanguages.length > 0) {
        const reviewLanguage = reviewInfo.review.review_language || 'en';
        if (!filters.selectedLanguages.includes(reviewLanguage)) return false;
      }

      // 學期篩選
      if (filters.selectedTerms.length > 0) {
        if (!reviewInfo.term?.term_code || !filters.selectedTerms.includes(reviewInfo.term.term_code)) {
          return false;
        }
      }

      // 課程篩選
      if (filters.selectedCourses.length > 0) {
        if (!reviewInfo.course?.course_code || !filters.selectedCourses.includes(reviewInfo.course.course_code)) {
          return false;
        }
      }

      // 課堂類型篩選
      if (filters.selectedSessionTypes.length > 0) {
        const hasMatchingSessionType = reviewInfo.instructorDetails.some(detail => 
          detail.session_type && filters.selectedSessionTypes.includes(detail.session_type)
        );
        if (!hasMatchingSessionType) return false;
      }

      return true;
    });
  };

  // 排序評論
  const getSortedReviews = (filteredReviews: (InstructorReviewFromDetails & { upvotes: number; downvotes: number; userVote?: 'up' | 'down' | null })[]) => {
    return [...filteredReviews].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (filters.sortBy) {
        case 'postDate':
          aValue = new Date(a.review.submitted_at || a.review.$createdAt);
          bValue = new Date(b.review.submitted_at || b.review.$createdAt);
          break;
        case 'workload':
          aValue = a.review.course_workload || 0;
          bValue = b.review.course_workload || 0;
          break;
        case 'difficulty':
          aValue = a.review.course_difficulties || 0;
          bValue = b.review.course_difficulties || 0;
          break;
        case 'usefulness':
          aValue = a.review.course_usefulness || 0;
          bValue = b.review.course_usefulness || 0;
          break;
        case 'grade':
          aValue = a.review.course_final_grade || 0;
          bValue = b.review.course_final_grade || 0;
          break;
        case 'teaching':
          // 取當前講師的教學評分
          const aTeaching = a.instructorDetails.find(d => d.instructor_name === decodedName)?.teaching || 0;
          const bTeaching = b.instructorDetails.find(d => d.instructor_name === decodedName)?.teaching || 0;
          aValue = aTeaching;
          bValue = bTeaching;
          break;
        case 'grading':
          // 取當前講師的評分滿意度
          const aGrading = a.instructorDetails.find(d => d.instructor_name === decodedName)?.grading || 0;
          const bGrading = b.instructorDetails.find(d => d.instructor_name === decodedName)?.grading || 0;
          aValue = aGrading;
          bValue = bGrading;
          break;
        case 'upvotes':
          aValue = a.upvotes || 0;
          bValue = b.upvotes || 0;
          break;
        case 'downvotes':
          aValue = a.downvotes || 0;
          bValue = b.downvotes || 0;
          break;
        default:
          aValue = new Date(a.review.submitted_at || a.review.$createdAt);
          bValue = new Date(b.review.submitted_at || b.review.$createdAt);
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  };

  // 分頁邏輯
  const getPaginatedReviews = (sortedReviews: (InstructorReviewFromDetails & { upvotes: number; downvotes: number; userVote?: 'up' | 'down' | null })[]) => {
    const startIndex = (filters.currentPage - 1) * filters.itemsPerPage;
    const endIndex = startIndex + filters.itemsPerPage;
    return sortedReviews.slice(startIndex, endIndex);
  };

  // 獲取最終顯示的評論
  const filteredReviews = getFilteredReviews();
  const sortedReviews = getSortedReviews(filteredReviews);
  const paginatedReviews = getPaginatedReviews(sortedReviews);
  const totalPages = Math.ceil(filteredReviews.length / filters.itemsPerPage);

  // 獲取篩選器統計數據
  const { languageCounts, termCounts, courseCounts, sessionTypeCounts } = getFilterCounts();

  // 處理篩選器變更
  const handleFiltersChange = (newFilters: InstructorReviewFilters) => {
    setFilters(newFilters);
  };

  // 清除所有篩選器
  const handleClearAllFilters = () => {
    setFilters({
      selectedLanguages: [],
      selectedTerms: [],
      selectedCourses: [],
      selectedSessionTypes: [],
      sortBy: 'postDate',
      sortOrder: 'desc',
      itemsPerPage: 12,
      currentPage: 1
    });
    
    // 同時清空課程要求篩選
    setRequirementsFilters({
      midterm: 'all',
      quiz: 'all',
      groupProject: 'all',
      individualAssignment: 'all',
      presentation: 'all',
      reading: 'all',
      attendance: 'all'
    });
  };

  // 處理分頁變更
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, currentPage: page }));
    // 滾動到頁面頂部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">{t('instructors.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <CardTitle className="text-xl">載入失敗</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={() => navigate('/instructors')} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('instructors.backToList')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 overflow-hidden">
      {/* 返回按鈕 */}
      <Button 
        onClick={() => navigate(-1)} 
        variant="ghost" 
        className="mb-4 h-12 sm:h-auto px-6 sm:px-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        {t('instructors.back')}
      </Button>

      {/* 講師基本信息 */}
      {instructor && (
        <Card className="course-card overflow-hidden">
          <CardHeader className="overflow-hidden">
            <div className="flex items-center gap-3 overflow-hidden min-w-0">
              <Users className="h-8 w-8 text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <CardTitle className="text-2xl truncate">{instructor.name}</CardTitle>
                {/* 在中文模式下顯示中文名稱 - 保留空間以維持卡片高度一致 */}
                {language === 'zh-TW' && (
                  <p className="text-xl text-gray-600 dark:text-gray-400 mt-1 font-medium min-h-[1.75rem]">
                    {instructor.name_tc || ''}
                  </p>
                )}
                {language === 'zh-CN' && (
                  <p className="text-xl text-gray-600 dark:text-gray-400 mt-1 font-medium min-h-[1.75rem]">
                    {instructor.name_sc || ''}
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 overflow-hidden">
            <div className="flex items-center gap-2 overflow-hidden min-w-0">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <a 
                href={`mailto:${instructor.email}`}
                className="text-sm truncate flex-1 min-w-0 hover:underline hover:text-primary transition-colors block"
              >
                {instructor.email}
              </a>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="text-center min-w-0">
                <div className="text-2xl font-bold text-primary">
                  {teachingCoursesLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  ) : (
                    teachingCourses.length
                  )}
                </div>
                <div className="text-sm text-muted-foreground">{t('instructors.coursesTeaching')}</div>
              </div>
              <div className="text-center min-w-0">
                <div className="text-2xl font-bold text-primary">
                  {reviewsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  ) : (
                    reviews.length
                  )}
                </div>
                <div className="text-sm text-muted-foreground">{t('instructors.studentReviews')}</div>
              </div>
              <div className="text-center min-w-0">
                <div className="text-2xl font-bold text-primary">
                  {reviewsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  ) : reviews.length > 0 ? (
                    (() => {
                      const validRatings = reviews
                        .map(r => r.instructorDetails.find(detail => detail.instructor_name === decodedName)?.teaching)
                        .filter(rating => rating !== null && rating !== undefined && rating !== -1);
                      return validRatings.length > 0 
                        ? (validRatings.reduce((sum, rating) => sum + rating!, 0) / validRatings.length).toFixed(2).replace(/\.?0+$/, '')
                        : 'N/A';
                    })()
                  ) : (
                    'N/A'
                  )}
                </div>
                <div className="text-sm text-muted-foreground">{t('instructors.averageTeachingRating')}</div>
                {!reviewsLoading && reviews.length === 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {t('instructors.noRatingData')}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 教授課程 */}
      <Card className="course-card overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 overflow-hidden min-w-0">
            <BookOpen className="h-5 w-5 shrink-0" />
            <span className="truncate">{t('instructors.coursesTeaching')} ({teachingCourses.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-hidden">
          {teachingCoursesLoading ? (
            <div className="text-center py-12 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">{t('instructors.loadingCourses')}</p>
            </div>
          ) : teachingCourses.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-muted/50 rounded-full">
                  <BookOpen className="h-12 w-12 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-muted-foreground">{t('instructors.noTeachingTitle')}</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {t('instructors.noTeachingDesc', { name: instructor?.name || '' })}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teachingCourses.map((teaching, index) => {
                const courseUrl = `/courses/${teaching.course.course_code}`;
                return (
                  <a
                    key={index}
                    href={courseUrl}
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
                    className="block no-underline"
                  >
                    <Card 
                      className="cursor-pointer hover:shadow-lg hover:shadow-primary/20 hover:border-primary/50 transition-all duration-200 group relative overflow-hidden"
                    >
                      
                      <CardContent className="p-4 overflow-hidden">
                        <div className="space-y-2 overflow-hidden">
                          <div className="flex items-center justify-between gap-2 overflow-hidden min-w-0">
                            <h3 className="font-semibold text-primary group-hover:text-primary/80 transition-colors truncate flex-1 min-w-0">
                              {teaching.course.course_code}
                            </h3>
                            <Badge 
                              variant="secondary" 
                              className={`shrink-0 transition-transform ${
                                teaching.sessionType === 'Lecture' 
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                  : teaching.sessionType === 'Tutorial'
                                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                                  : ''
                              }`}
                            >
                              {t(`sessionType.${teaching.sessionType.toLowerCase()}`)}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium truncate group-hover:text-foreground/80 transition-colors">{teaching.course.course_title}</p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground overflow-hidden">
                            <div className="flex items-center gap-1 shrink-0 group-hover:text-muted-foreground/80 transition-colors">
                              <Calendar className="h-3 w-3" />
                              <span>{teaching.term.name}</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0 min-w-0 group-hover:text-muted-foreground/80 transition-colors">
                              <GraduationCap className="h-3 w-3" />
                              <span className="truncate">{teaching.course.department}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 學生評論 */}
      <Card className="course-card overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 overflow-hidden min-w-0">
            <MessageSquare className="h-5 w-5 shrink-0" />
            <span className="truncate">{t('instructors.studentReviews')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-hidden space-y-4">
          {/* 篩選器 - 只有當有評論且不在載入狀態時才顯示 */}
          {reviews && reviews.length > 0 && !reviewsLoading && (
            <>
              {/* 課程要求篩選器 */}
              <CourseRequirementsFilter
                filters={requirementsFilters}
                onFiltersChange={setRequirementsFilters}
              />
              
              <InstructorReviewsFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              languageCounts={languageCounts}
              termCounts={termCounts}
              courseCounts={courseCounts}
              sessionTypeCounts={sessionTypeCounts}
              totalReviews={reviews.length}
              filteredReviews={filteredReviews.length}
              onClearAll={handleClearAllFilters}
            />
            </>
          )}
          
          {reviewsLoading ? (
            <div className="text-center py-12 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">{t('instructors.loadingReviews')}</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-muted/50 rounded-full">
                  <MessageSquare className="h-12 w-12 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-muted-foreground">{t('instructors.noReviewsTitle')}</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {t('instructors.noReviewsDesc', { name: instructor?.name || '' })}
                </p>
              </div>
              <div className="pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/courses')}
                  className="gap-2 h-12 text-base font-medium"
                >
                  <BookOpen className="h-4 w-4" />
                  {t('instructors.browseCoursesToReview')}
                </Button>
              </div>
            </div>
          ) : paginatedReviews.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-muted/50 rounded-full">
                  <MessageSquare className="h-12 w-12 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-muted-foreground">沒有符合篩選條件的評論</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  請嘗試調整篩選條件
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {paginatedReviews.map((reviewInfo, index) => (
                <div key={index} data-review-id={reviewInfo.review.$id} className="rounded-lg p-4 space-y-4 overflow-hidden bg-card border border-border dark:bg-[#202936] dark:border-[#2a3441]">
                  {/* 評論基本信息 */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-2 min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <ReviewAvatar
                          isAnonymous={reviewInfo.review.is_anon}
                          userId={reviewInfo.review.user_id}
                          username={reviewInfo.review.username}
                          reviewId={reviewInfo.review.$id}
                          size="sm"
                          className="shrink-0"
                        />
                        <span className="font-medium truncate">
                          {reviewInfo.review.is_anon ? t('review.anonymousUser') : reviewInfo.review.username}
                        </span>
                        {/* 學期徽章 - 桌面版顯示在用戶名旁邊 */}
                        <Badge variant="outline" className="text-xs shrink-0 hidden md:inline-flex border-gray-400 dark:border-gray-600">
                          <span className="truncate">{reviewInfo.term.name}</span>
                        </Badge>
                      </div>
                      {/* 學期徽章 - 手機版顯示在下方 */}
                      <Badge variant="outline" className="text-xs w-fit md:hidden border-gray-400 dark:border-gray-600">
                        <span className="truncate">{reviewInfo.term.name}</span>
                      </Badge>
                      {/* 課程標題 - 顯示在學生姓名/匿名行下方 */}
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-lg">
                            <a
                              href={`/courses/${reviewInfo.course.course_code}?review_id=${reviewInfo.review.$id}`}
                              className="text-primary cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors px-2 py-1 rounded-md inline-block no-underline"
                              onClick={(e) => {
                                // Only prevent default if it's a special click (Ctrl, Cmd, middle-click)
                                // Let normal clicks use the default link behavior
                                if (e.ctrlKey || e.metaKey || e.button === 1) {
                                  // Let browser handle these naturally
                                  return;
                                }
                                // For normal clicks, prevent default and use React Router
                                e.preventDefault();
                                navigate(`/courses/${reviewInfo.course.course_code}?review_id=${reviewInfo.review.$id}`);
                              }}
                            >
                              {(() => {
                                const courseInfo = getCourseTitle(reviewInfo.course, language);
                                return (
                                  <div>
                                    <div className="font-bold">{reviewInfo.course.course_code}</div>
                                    <div className="font-medium">{courseInfo.primary}</div>
                                    {courseInfo.secondary && (
                                      <div className="text-sm text-muted-foreground font-normal mt-0.5">
                                        {courseInfo.secondary}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </a>
                          </h4>
                        </div>
                        {(() => {
                          const currentInstructorDetail = reviewInfo.instructorDetails.find(detail => detail.instructor_name === decodedName);
                          return currentInstructorDetail ? (
                            <Badge 
                              variant="secondary" 
                              className={`text-sm shrink-0 ${
                                currentInstructorDetail.session_type === 'Lecture' 
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                  : currentInstructorDetail.session_type === 'Tutorial'
                                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                                  : ''
                              }`}
                            >
                              {t(`sessionType.${currentInstructorDetail.session_type.toLowerCase()}`)}
                            </Badge>
                          ) : null;
                        })()}
                      </div>
                    </div>
                    {/* 最終成績 - 右上角大顯示 */}
                    {reviewInfo.review.course_final_grade && (
                      <div className="flex flex-col items-center shrink-0">
                        <GradeBadge 
                          grade={reviewInfo.review.course_final_grade}
                          size="md"
                          showTooltip={true}
                        />
                      </div>
                    )}
                  </div>

                  {/* 課程評分 */}
                  <div className="grid grid-cols-3 gap-1 text-xs">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <span className="font-medium text-sm sm:text-base">{t('review.workload')}</span>
                      </div>
                      <div className="flex items-center justify-center">
                        {reviewInfo.review.course_workload === null || reviewInfo.review.course_workload === -1 ? (
                          <span className="text-muted-foreground">
                            {reviewInfo.review.course_workload === -1 ? t('review.notApplicable') : t('review.rating.notRated')}
                          </span>
                        ) : (
                          <StarRating rating={reviewInfo.review.course_workload} showValue size="sm" showTooltip ratingType="workload" />
                        )}
                      </div>
                    </div>
                    
                                         <div className="text-center">
                       <div className="flex items-center justify-center gap-1 mb-1">
                         <span className="font-medium text-sm sm:text-base">{t('review.difficulty')}</span>
                       </div>
                       <div className="flex items-center justify-center">
                         {reviewInfo.review.course_difficulties === null || reviewInfo.review.course_difficulties === -1 ? (
                           <span className="text-muted-foreground">
                             {reviewInfo.review.course_difficulties === -1 ? t('review.notApplicable') : t('review.rating.notRated')}
                           </span>
                         ) : (
                           <StarRating rating={reviewInfo.review.course_difficulties} showValue size="sm" showTooltip ratingType="difficulty" />
                         )}
                       </div>
                     </div>
                    
                                         <div className="text-center">
                       <div className="flex items-center justify-center gap-1 mb-1">
                         <span className="font-medium text-sm sm:text-base">{t('review.usefulness')}</span>
                       </div>
                       <div className="flex items-center justify-center">
                         {reviewInfo.review.course_usefulness === null || reviewInfo.review.course_usefulness === -1 ? (
                           <span className="text-muted-foreground">
                             {reviewInfo.review.course_usefulness === -1 ? t('review.notApplicable') : t('review.rating.notRated')}
                           </span>
                         ) : (
                           <StarRating rating={reviewInfo.review.course_usefulness} showValue size="sm" showTooltip ratingType="usefulness" />
                         )}
                       </div>
                     </div>
                  </div>

                  {/* 課程評論 */}
                  {reviewInfo.review.course_comments && (
                    <>
                      <Separator />
                      <div className="min-w-0">
                        <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 shrink-0" />
                          <span>{t('review.courseComments')}</span>
                        </h5>
                        <div className="bg-muted/50 p-2 rounded-md break-words">
                          {hasMarkdownFormatting(reviewInfo.review.course_comments) ? (
                            renderCommentMarkdown(reviewInfo.review.course_comments)
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              {reviewInfo.review.course_comments}
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* 服務學習 */}
                  {reviewInfo.review.has_service_learning && (
                    <>
                      <Separator />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md border border-blue-400 dark:from-blue-600 dark:to-blue-700 dark:border-blue-500 flex items-center gap-1">
                            <GraduationCap className="h-3 w-3" />
                            {t('review.serviceLearning')}
                          </Badge>
                          {/* 顯示服務學習類型 */}
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs",
                              // 檢查是否為必修：明確標記為 compulsory 或舊格式的 [COMPULSORY] 前綴
                              (reviewInfo.review.service_learning_type === 'compulsory' || 
                               reviewInfo.review.service_learning_description?.startsWith('[COMPULSORY]'))
                                ? "border-red-300 text-red-700 bg-red-50 dark:border-red-700 dark:text-red-300 dark:bg-red-950/30"
                                : "border-green-300 text-green-700 bg-green-50 dark:border-green-700 dark:text-green-300 dark:bg-green-950/30"
                            )}
                          >
                            {/* 檢查是否為必修，否則顯示選修 */}
                            {(reviewInfo.review.service_learning_type === 'compulsory' || 
                              reviewInfo.review.service_learning_description?.startsWith('[COMPULSORY]'))
                              ? t('review.compulsory')
                              : t('review.optional')}
                          </Badge>
                        </div>
                        {reviewInfo.review.service_learning_description && (
                          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md border border-blue-200 dark:border-blue-800/30">
                            <p className="text-sm text-blue-900 dark:text-blue-100 break-words">
                              {/* 移除舊格式的前綴 */}
                              {reviewInfo.review.service_learning_description
                                .replace(/^\[COMPULSORY\]\s*/, '')
                                .replace(/^\[OPTIONAL\]\s*/, '')}
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* 講師評價 - 只顯示當前講師，其他講師顯示展開按鈕 */}
                  {(() => {
                    const currentInstructorDetail = reviewInfo.instructorDetails.find(detail => detail.instructor_name === decodedName);
                    const otherInstructorDetails = reviewInfo.instructorDetails.filter(detail => detail.instructor_name !== decodedName);
                    
                    return (
                      <>
                        {currentInstructorDetail && (
                          <>
                            <Separator />
                            <div className="rounded-lg p-4 overflow-hidden bg-[#e8e9ea] dark:bg-[#1a2332]">
                              <div className="flex items-start justify-between mb-3 gap-2">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-lg">
                                    {(() => {
                                      if (instructor) {
                                        const nameInfo = getInstructorName(instructor, language);
                                        return (
                                          <div>
                                            <div>{nameInfo.primary}</div>
                                            {nameInfo.secondary && (
                                              <div className="text-sm text-muted-foreground font-normal mt-0.5">
                                                {nameInfo.secondary}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      }
                                      return currentInstructorDetail.instructor_name;
                                    })()}
                                  </h4>
                                </div>
                                <Badge 
                                  variant="secondary" 
                                  className={`text-sm shrink-0 ${
                                    currentInstructorDetail.session_type === 'Lecture' 
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                      : currentInstructorDetail.session_type === 'Tutorial'
                                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                                      : ''
                                  }`}
                                >
                                  {t(`sessionType.${currentInstructorDetail.session_type.toLowerCase()}`)}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                                <div className="text-center">
                                  <div className="flex items-center justify-center gap-1 mb-1">
                                    <span className="font-medium text-sm sm:text-base">{t('card.teaching')}</span>
                                  </div>
                                  <div className="flex items-center justify-center">
                                    {currentInstructorDetail.teaching === null ? (
                                      <span className="text-muted-foreground">
                                        {t('review.rating.notRated')}
                                      </span>
                                    ) : currentInstructorDetail.teaching === -1 ? (
                                      <span className="text-muted-foreground">
                                        {t('review.notApplicable')}
                                      </span>
                                    ) : (
                                      <StarRating rating={currentInstructorDetail.teaching} showValue size="sm" showTooltip ratingType="teaching" />
                                    )}
                                  </div>
                                </div>
                                
                                {currentInstructorDetail.grading !== null && currentInstructorDetail.grading !== -1 && (
                                  <div className="text-center">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                      <span className="font-medium text-sm sm:text-base">{t('card.grading')}</span>
                                    </div>
                                    <div className="flex items-center justify-center">
                                      <StarRating rating={currentInstructorDetail.grading} showValue size="sm" showTooltip ratingType="grading" />
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* 課程要求 */}
                              <div className="mb-4">
                                <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                                  <FileText className="h-4 w-4 shrink-0" />
                                  <span>{t('review.courseRequirements')}</span>
                                </h5>
                                <div className="flex flex-wrap gap-2 overflow-hidden">
                                  {renderBooleanBadge(currentInstructorDetail.has_midterm, t('review.requirements.midterm'))}
                                  {renderBooleanBadge(currentInstructorDetail.has_quiz, t('review.requirements.quiz'))}
                                  {renderBooleanBadge(currentInstructorDetail.has_group_project, t('review.requirements.groupProject'))}
                                  {renderBooleanBadge(currentInstructorDetail.has_individual_assignment, t('review.requirements.individualAssignment'))}
                                  {renderBooleanBadge(currentInstructorDetail.has_presentation, t('review.requirements.presentation'))}
                                  {renderBooleanBadge(currentInstructorDetail.has_reading, t('review.requirements.reading'))}
                                  {renderBooleanBadge(currentInstructorDetail.has_attendance_requirement, t('review.requirements.attendance'))}
                                </div>
                              </div>

                              {/* 講師評論 */}
                              {currentInstructorDetail.comments && (
                                <div className="min-w-0">
                                  <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                                    <User className="h-4 w-4 shrink-0" />
                                    <span>{t('review.instructorComments')}</span>
                                  </h5>
                                  <div className="break-words" style={{ backgroundColor: 'rgb(26 35 50 / 0%)' }}>
                                    <p className="text-sm">
                                      {currentInstructorDetail.comments}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                        
                        {/* 其他講師展開按鈕和內容 */}
                        {otherInstructorDetails.length > 0 && (
                          <>
                            <Separator />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleOtherInstructors(reviewInfo.review.$id)}
                              className="w-full justify-center"
                            >
                              <ChevronDown className={`h-4 w-4 mr-2 transition-transform ${expandedOtherInstructors[reviewInfo.review.$id] ? 'rotate-180' : ''}`} />
                              {expandedOtherInstructors[reviewInfo.review.$id] 
                                ? t('review.hideOtherInstructors') 
                                : t('review.showOtherInstructors')} ({otherInstructorDetails.length})
                            </Button>
                            
                            {/* 其他講師的詳細信息 */}
                            {expandedOtherInstructors[reviewInfo.review.$id] && (
                              <div className="space-y-4 mt-4">
                                {otherInstructorDetails.map((instructor, index) => (
                                  <div key={index} className="rounded-lg p-4 overflow-hidden bg-[#e8e9ea] dark:bg-[#1a2332]">
                                    <div className="flex items-start justify-between mb-3 gap-2">
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-lg">
                                          <a
                                            href={`/instructors/${encodeURIComponent(instructor.instructor_name)}?review_id=${reviewInfo.review.$id}`}
                                            className="text-primary cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors px-2 py-1 rounded-md inline-block no-underline"
                                            onClick={(e) => {
                                              // Only prevent default if it's a special click (Ctrl, Cmd, middle-click)
                                              // Let normal clicks use the default link behavior
                                              if (e.ctrlKey || e.metaKey || e.button === 1) {
                                                // Let browser handle these naturally
                                                return;
                                              }
                                              // For normal clicks, prevent default and use React Router
                                              e.preventDefault();
                                              navigate(`/instructors/${encodeURIComponent(instructor.instructor_name)}?review_id=${reviewInfo.review.$id}`);
                                            }}
                                          >
                                            {(() => {
                                              const fullInstructor = otherInstructorsMap.get(instructor.instructor_name);
                                              if (fullInstructor) {
                                                const nameInfo = getInstructorName(fullInstructor, language);
                                                return (
                                                  <div>
                                                    <div>{nameInfo.primary}</div>
                                                    {nameInfo.secondary && (
                                                      <div className="text-sm text-muted-foreground font-normal mt-0.5">
                                                        {nameInfo.secondary}
                                                      </div>
                                                    )}
                                                  </div>
                                                );
                                              }
                                              return instructor.instructor_name;
                                            })()}
                                          </a>
                                        </h4>
                                      </div>
                                      <Badge 
                                        variant="secondary" 
                                        className={`text-sm shrink-0 ${
                                          instructor.session_type === 'Lecture' 
                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                            : instructor.session_type === 'Tutorial'
                                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                                            : ''
                                        }`}
                                      >
                                        {t(`sessionType.${instructor.session_type.toLowerCase()}`)}
                                      </Badge>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                                      <div className="text-center">
                                        <div className="flex items-center justify-center gap-1 mb-1">
                                          <span className="font-medium text-sm sm:text-base">{t('card.teaching')}</span>
                                        </div>
                                        <div className="flex items-center justify-center">
                                          {instructor.teaching === null ? (
                                            <span className="text-muted-foreground">
                                              {t('review.rating.notRated')}
                                            </span>
                                          ) : instructor.teaching === -1 ? (
                                            <span className="text-muted-foreground">
                                              {t('review.notApplicable')}
                                            </span>
                                          ) : (
                                            <StarRating rating={instructor.teaching} showValue size="sm" showTooltip ratingType="teaching" />
                                          )}
                                        </div>
                                      </div>
                                      
                                      {instructor.grading !== null && instructor.grading !== -1 && (
                                        <div className="text-center">
                                          <div className="flex items-center justify-center gap-1 mb-1">
                                            <span className="font-medium text-sm sm:text-base">{t('card.grading')}</span>
                                          </div>
                                          <div className="flex items-center justify-center">
                                            <StarRating rating={instructor.grading} showValue size="sm" showTooltip ratingType="grading" />
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {/* 課程要求 */}
                                    <div className="mb-4">
                                      <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                                        <FileText className="h-4 w-4 shrink-0" />
                                        <span>{t('review.courseRequirements')}</span>
                                      </h5>
                                      <div className="flex flex-wrap gap-2 overflow-hidden">
                                        {renderBooleanBadge(instructor.has_midterm, t('review.requirements.midterm'))}
                                        {renderBooleanBadge(instructor.has_quiz, t('review.requirements.quiz'))}
                                        {renderBooleanBadge(instructor.has_group_project, t('review.requirements.groupProject'))}
                                        {renderBooleanBadge(instructor.has_individual_assignment, t('review.requirements.individualAssignment'))}
                                        {renderBooleanBadge(instructor.has_presentation, t('review.requirements.presentation'))}
                                        {renderBooleanBadge(instructor.has_reading, t('review.requirements.reading'))}
                                        {renderBooleanBadge(instructor.has_attendance_requirement, t('review.requirements.attendance'))}
                                      </div>
                                    </div>

                                    {/* 講師評論 */}
                                    {instructor.comments && (
                                      <div className="min-w-0">
                                        <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                                          <User className="h-4 w-4 shrink-0" />
                                          <span>{t('review.instructorComments')}</span>
                                        </h5>
                                        <div className="break-words" style={{ backgroundColor: 'rgb(26 35 50 / 0%)' }}>
                                          <p className="text-sm">
                                            {instructor.comments}
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </>
                    );
                  })()}

                  {/* 投票按鈕和時間 */}
                  <Separator />
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 overflow-hidden">
                    <div className="flex-shrink-0">
                      <VotingButtons
                        reviewId={reviewInfo.review.$id}
                        upvotes={reviewInfo.upvotes}
                        downvotes={reviewInfo.downvotes}
                        userVote={reviewInfo.userVote}
                        size="sm"
                      />
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 min-w-0">
                      <span 
                        className="truncate cursor-help" 
                        title={t('review.timestampTooltip', { timezone: 'Hong Kong Time (UTC+8)' })}
                      >
                        {formatDateTimeUTC8(reviewInfo.review.submitted_at)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              </div>

              {/* 分頁 */}
              {totalPages > 1 && (
                <div className="mt-8">
                  <Pagination
                    currentPage={filters.currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    itemsPerPage={filters.itemsPerPage}
                    totalItems={filteredReviews.length}
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Lecturers;