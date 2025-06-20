import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';
import { 
  Users, 
  ArrowLeft,
  Mail,
  BookOpen,
  Calendar,
  Loader2,
  AlertCircle,
  Star,
  MessageSquare,
  GraduationCap,
  Award,
  FileText,
  CheckCircle,
  XCircle,
  Brain,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Instructor, 
  InstructorTeachingCourse, 
  InstructorReviewInfo 
} from '@/services/api/courseService';
import { CourseService } from '@/services/api/courseService';
import { formatDateTimeUTC8 } from '@/utils/ui/dateUtils';
import { renderCommentMarkdown, hasMarkdownFormatting } from '@/utils/ui/markdownRenderer';
import { ReviewAvatar } from '@/components/ui/review-avatar';

const Lecturers = () => {
  const { instructorName } = useParams<{ instructorName: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [teachingCourses, setTeachingCourses] = useState<InstructorTeachingCourse[]>([]);
  const [reviews, setReviews] = useState<InstructorReviewInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInstructorData = async () => {
      if (!instructorName) {
        setError(t('instructors.nameNotProvided'));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // 解碼 URL 參數
        const decodedName = decodeURIComponent(instructorName);
        
        const startTime = Date.now();

        // 並行獲取講師信息、教學課程和評論
        const [instructorData, coursesData, reviewsData] = await Promise.all([
                  CourseService.getInstructorByName(decodedName),
        CourseService.getInstructorTeachingCourses(decodedName),
        CourseService.getInstructorReviews(decodedName)
        ]);
        
        const loadTime = Date.now() - startTime;
        console.log(`Instructor data loaded in ${loadTime}ms for:`, decodedName);

        setInstructor(instructorData);
        setTeachingCourses(coursesData);
        setReviews(reviewsData);

        if (!instructorData) {
          setError(t('instructors.notFound'));
        }
      } catch (err) {
        console.error('Error loading instructor data:', err);
        setError(t('instructors.loadError'));
      } finally {
        setLoading(false);
      }
    };

    loadInstructorData();
  }, [instructorName]);

  const handleCourseClick = (courseCode: string, event?: React.MouseEvent) => {
    if (event?.ctrlKey || event?.metaKey || event?.button === 1) {
      // Ctrl+Click 或 Cmd+Click 或中鍵點擊，在新頁面打開
      window.open(`/courses/${courseCode}`, '_blank');
    } else {
      // 普通點擊，在當前頁面導航
      navigate(`/courses/${courseCode}`);
    }
  };

  const renderRatingStars = (rating: number | null) => {
    if (rating === null) return <span className="text-muted-foreground">N/A</span>;
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm font-medium">{rating}</span>
      </div>
    );
  };

  const renderBooleanBadge = (value: boolean, label: string) => {
    return (
      <Badge 
        variant={value ? "default" : "secondary"}
        className={`text-xs shrink-0 ${value ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
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
    <div className="container mx-auto px-4 py-6 space-y-6 overflow-hidden w-full max-w-full">
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
        <Card className="course-card overflow-hidden w-full max-w-full">
          <CardHeader className="overflow-hidden">
            <div className="flex items-center gap-3 overflow-hidden min-w-0">
              <Users className="h-8 w-8 text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <CardTitle className="text-2xl truncate">{instructor.name}</CardTitle>
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
                <div className="text-2xl font-bold text-primary">{teachingCourses.length}</div>
                <div className="text-sm text-muted-foreground">{t('instructors.coursesTeaching')}</div>
              </div>
              <div className="text-center min-w-0">
                <div className="text-2xl font-bold text-primary">{reviews.length}</div>
                <div className="text-sm text-muted-foreground">{t('instructors.studentReviews')}</div>
              </div>
              <div className="text-center min-w-0">
                <div className="text-2xl font-bold text-primary">
                  {reviews.length > 0 
                    ? (reviews.reduce((sum, r) => sum + r.instructorDetail.teaching, 0) / reviews.length).toFixed(2)
                    : 'N/A'
                  }
                </div>
                <div className="text-sm text-muted-foreground">{t('instructors.averageTeachingRating')}</div>
                {reviews.length === 0 && (
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
      <Card className="course-card overflow-hidden w-full max-w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 overflow-hidden min-w-0">
            <BookOpen className="h-5 w-5 shrink-0" />
            <span className="truncate">{t('instructors.coursesTeaching')} ({teachingCourses.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-hidden">
          {teachingCourses.length === 0 ? (
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
              {teachingCourses.map((teaching, index) => (
                <Card 
                  key={index} 
                  className="cursor-pointer hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.02] hover:border-primary/50 transition-all duration-200 group relative overflow-hidden w-full max-w-full"
                  onClick={(e) => handleCourseClick(teaching.course.course_code, e)}
                  onMouseDown={(e) => {
                    if (e.button === 1) {
                      e.preventDefault();
                      handleCourseClick(teaching.course.course_code, e);
                    }
                  }}
                  onAuxClick={(e) => {
                    if (e.button === 1) {
                      e.preventDefault();
                      handleCourseClick(teaching.course.course_code, e);
                    }
                  }}
                  role="link"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCourseClick(teaching.course.course_code);
                    }
                  }}
                  title={`${t('button.clickToView')} | ${t('button.ctrlClickNewTab')}`}
                >

                  
                  <CardContent className="p-4 overflow-hidden">
                    <div className="space-y-2 overflow-hidden">
                      <div className="flex items-center justify-between gap-2 overflow-hidden min-w-0">
                        <h3 className="font-semibold text-primary group-hover:text-primary/80 transition-colors truncate flex-1 min-w-0">
                          {teaching.course.course_code}
                        </h3>
                        <Badge 
                          variant="secondary" 
                          className={`shrink-0 group-hover:scale-105 transition-transform ${
                            teaching.sessionType === 'Lecture' 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                              : teaching.sessionType === 'Tutorial'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                              : ''
                          }`}
                        >
                          {teaching.sessionType}
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
                          <span className="truncate">{teaching.course.course_department}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 學生評論 */}
      <Card className="course-card overflow-hidden w-full max-w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 overflow-hidden min-w-0">
            <MessageSquare className="h-5 w-5 shrink-0" />
            <span className="truncate">{t('instructors.studentReviews')} ({reviews.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-hidden">
          {reviews.length === 0 ? (
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
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {reviews.map((reviewInfo, index) => (
                <div key={index} className="border-gray-400 dark:border-gray-400 border rounded-lg p-3 space-y-2 overflow-hidden">
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
                        <Badge variant="outline" className="text-xs shrink-0 hidden md:inline-flex">
                          <span className="truncate">{reviewInfo.term.name}</span>
                        </Badge>
                      </div>
                      {/* 學期徽章 - 手機版顯示在下方 */}
                      <Badge variant="outline" className="text-xs w-fit md:hidden">
                        <span className="truncate">{reviewInfo.term.name}</span>
                      </Badge>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-primary truncate">
                          {reviewInfo.course.course_code} - {reviewInfo.course.course_title}
                        </h4>
                        <Badge 
                          variant="secondary" 
                          className={`text-sm shrink-0 ${
                            reviewInfo.instructorDetail.session_type === 'Lecture' 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                              : reviewInfo.instructorDetail.session_type === 'Tutorial'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                              : ''
                          }`}
                        >
                          {reviewInfo.instructorDetail.session_type}
                        </Badge>
                      </div>
                    </div>
                    {/* 最終成績 - 右上角大顯示 */}
                    {reviewInfo.review.course_final_grade && (
                      <div className="flex flex-col items-center shrink-0">
                        <Badge variant="default" className="text-lg font-bold px-3 py-1 bg-primary text-primary-foreground">
                          {reviewInfo.review.course_final_grade}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* 課程評分 */}
                  <div className="grid grid-cols-3 gap-1 text-xs">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <BookOpen className="h-3 w-3 text-primary" />
                        <span className="font-medium text-sm sm:text-base">{t('review.workload')}</span>
                      </div>
                      {reviewInfo.review.course_workload === null || reviewInfo.review.course_workload === -1 ? (
                        <span className="text-muted-foreground">
                          {reviewInfo.review.course_workload === -1 ? t('review.notApplicable') : t('review.rating.notRated')}
                        </span>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3 w-3 ${
                                star <= reviewInfo.review.course_workload 
                                  ? 'fill-yellow-400 text-yellow-400' 
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="ml-1 text-xs font-medium">{reviewInfo.review.course_workload}</span>
                        </div>
                      )}
                    </div>
                    
                                         <div className="text-center">
                       <div className="flex items-center justify-center gap-1 mb-1">
                         <Brain className="h-3 w-3 text-primary" />
                         <span className="font-medium text-sm sm:text-base">{t('review.difficulty')}</span>
                       </div>
                      {reviewInfo.review.course_difficulties === null || reviewInfo.review.course_difficulties === -1 ? (
                        <span className="text-muted-foreground">
                          {reviewInfo.review.course_difficulties === -1 ? t('review.notApplicable') : t('review.rating.notRated')}
                        </span>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3 w-3 ${
                                star <= reviewInfo.review.course_difficulties 
                                  ? 'fill-yellow-400 text-yellow-400' 
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="ml-1 text-xs font-medium">{reviewInfo.review.course_difficulties}</span>
                        </div>
                      )}
                    </div>
                    
                                         <div className="text-center">
                       <div className="flex items-center justify-center gap-1 mb-1">
                         <Target className="h-3 w-3 text-primary" />
                         <span className="font-medium text-sm sm:text-base">{t('review.usefulness')}</span>
                       </div>
                      {reviewInfo.review.course_usefulness === null || reviewInfo.review.course_usefulness === -1 ? (
                        <span className="text-muted-foreground">
                          {reviewInfo.review.course_usefulness === -1 ? t('review.notApplicable') : t('review.rating.notRated')}
                        </span>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3 w-3 ${
                                star <= reviewInfo.review.course_usefulness 
                                  ? 'fill-yellow-400 text-yellow-400' 
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="ml-1 text-xs font-medium">{reviewInfo.review.course_usefulness}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 課程評論 */}
                  {reviewInfo.review.course_comments && (
                    <>
                      <Separator />
                      <div className="min-w-0">
                        <h5 className="text-sm font-medium mb-2">{t('review.courseComments')}</h5>
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
                      <div>
                        <Badge variant="default" className="mb-2">
                          {t('review.serviceLearning')}
                        </Badge>
                        {reviewInfo.review.service_learning_description && (
                          <p className="text-sm text-muted-foreground break-words">
                            {reviewInfo.review.service_learning_description}
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  {/* 講師詳細評價 */}
                  {reviewInfo.instructorDetail && (
                    <>
                      <Separator />
                      <div className="rounded-lg p-2 space-y-2 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/30 dark:to-indigo-950/30 overflow-hidden">
                        <div className="flex items-center justify-between gap-2 overflow-hidden">
                          <h5 className="text-sm font-medium truncate">{t('review.instructorEvaluation')}:</h5>
                        </div>
                        
                        {/* 講師評分 */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <GraduationCap className="h-3 w-3 text-primary" />
                              <span className="font-medium text-sm sm:text-base">{t('card.teaching')}</span>
                            </div>
                            {reviewInfo.instructorDetail.teaching === null ? (
                              <span className="text-muted-foreground">{t('review.rating.notRated')}</span>
                            ) : reviewInfo.instructorDetail.teaching === -1 ? (
                              <span className="text-muted-foreground">{t('review.notApplicable')}</span>
                            ) : (
                              <div className="flex items-center justify-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-3 w-3 ${
                                      star <= reviewInfo.instructorDetail.teaching 
                                        ? 'fill-yellow-400 text-yellow-400' 
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                                <span className="ml-1 text-xs font-medium">{reviewInfo.instructorDetail.teaching}</span>
                              </div>
                            )}
                          </div>
                          {reviewInfo.instructorDetail.grading !== null && reviewInfo.instructorDetail.grading !== -1 && (
                                                         <div className="text-center">
                               <div className="flex items-center justify-center gap-1 mb-1">
                                 <Target className="h-3 w-3 text-primary" />
                                 <span className="font-medium text-sm sm:text-base">{t('card.grading')}</span>
                               </div>
                              <div className="flex items-center justify-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-3 w-3 ${
                                      star <= reviewInfo.instructorDetail.grading 
                                        ? 'fill-yellow-400 text-yellow-400' 
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                                <span className="ml-1 text-xs font-medium">{reviewInfo.instructorDetail.grading}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 課程要求 */}
                        <div className="space-y-2 overflow-hidden">
                          <h6 className="text-xs font-medium text-muted-foreground">{t('review.courseRequirements')}:</h6>
                          <div className="flex flex-wrap gap-1 overflow-hidden">
                                            {renderBooleanBadge(reviewInfo.instructorDetail.has_midterm, t('review.requirements.midterm'))}
                {renderBooleanBadge(reviewInfo.instructorDetail.has_quiz, t('review.requirements.quiz'))}
                {renderBooleanBadge(reviewInfo.instructorDetail.has_group_project, t('review.requirements.groupProject'))}
                {renderBooleanBadge(reviewInfo.instructorDetail.has_individual_assignment, t('review.requirements.individualAssignment'))}
                {renderBooleanBadge(reviewInfo.instructorDetail.has_presentation, t('review.requirements.presentation'))}
                {renderBooleanBadge(reviewInfo.instructorDetail.has_reading, t('review.requirements.reading'))}
                {renderBooleanBadge(reviewInfo.instructorDetail.has_attendance_requirement, t('review.requirements.attendance'))}
                          </div>
                        </div>

                        {/* 講師評論 */}
                        {reviewInfo.instructorDetail.comments && (
                          <div className="space-y-1 overflow-hidden">
                            <h6 className="text-xs font-medium text-muted-foreground">{t('review.instructorComments')}:</h6>
                            <div className="bg-white/60 dark:bg-black/20 p-2 rounded-md break-words">
                              {hasMarkdownFormatting(reviewInfo.instructorDetail.comments) ? (
                                renderCommentMarkdown(reviewInfo.instructorDetail.comments)
                              ) : (
                                <p className="text-xs text-muted-foreground">
                                  {reviewInfo.instructorDetail.comments}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* 投票按鈕和時間 */}
                  <Separator />
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 overflow-hidden">
                    <div className="flex-shrink-0">
                      {/* 這裡可以添加投票按鈕，如果需要的話 */}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 min-w-0">
                      <Calendar className="h-3 w-3 shrink-0" />
                      <span className="truncate">{formatDateTimeUTC8(reviewInfo.review.submitted_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Lecturers;