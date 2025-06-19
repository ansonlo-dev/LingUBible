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
  MessageSquare,
  GraduationCap,
  Award,
  FileText,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { StarRating } from '@/components/ui/star-rating';
import { CourseService } from '@/services/api/courseService';
import { 
  Instructor, 
  InstructorReviewFromDetails,
  InstructorDetail as InstructorDetailType
} from '@/services/api/courseService';
import { VotingButtons } from '@/components/ui/voting-buttons';
import { useAuth } from '@/contexts/AuthContext';
import { formatDateTimeUTC8 } from '@/utils/ui/dateUtils';
import { renderCommentMarkdown, hasMarkdownFormatting } from '@/utils/ui/markdownRenderer';

const InstructorDetail = () => {
  const { instructorName } = useParams<{ instructorName: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();

  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [reviews, setReviews] = useState<(InstructorReviewFromDetails & { upvotes: number; downvotes: number; userVote?: 'up' | 'down' | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['en', 'zh-TW', 'zh-CN']);

  useEffect(() => {
    const loadInstructorData = async () => {
      if (!instructorName) {
        setError(t('instructor.nameNotProvided'));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // 解碼 URL 參數
        const decodedName = decodeURIComponent(instructorName);

        // 第一階段：載入講師基本信息（最快）
        const instructorData = await CourseService.getInstructorByName(decodedName);

        if (!instructorData) {
          setError(t('instructor.notFound'));
          setLoading(false);
          return;
        }

        setInstructor(instructorData);
        setLoading(false); // 先顯示基本信息

        // 第二階段：背景載入評論數據（較慢）
        try {
          const reviewsData = await CourseService.getInstructorReviewsFromDetailsWithVotes(decodedName, user?.$id);
          setReviews(reviewsData);
        } catch (reviewError) {
          console.error('Error loading instructor reviews:', reviewError);
          // 評論載入失敗不影響基本頁面顯示
        }

      } catch (err) {
        console.error('Error loading instructor data:', err);
        setError(t('instructor.loadError'));
        setLoading(false);
      }
    };

    loadInstructorData();
  }, [instructorName, user?.$id, t]);

  // 當語言篩選改變時重新載入評論
  useEffect(() => {
    if (instructorName && instructor) {
      const loadReviews = async () => {
        try {
          const decodedName = decodeURIComponent(instructorName);
          // 獲取所有評論，然後在前端篩選
          const reviewsData = await CourseService.getInstructorReviewsFromDetailsWithVotes(decodedName, user?.$id);
          // 根據選中的語言篩選評論
          const filteredReviews = reviewsData.filter(reviewInfo => {
            const reviewLanguage = reviewInfo.review.review_language || 'en';
            return selectedLanguages.includes(reviewLanguage);
          });
          setReviews(filteredReviews);
        } catch (reviewError) {
          console.error('Error loading instructor reviews:', reviewError);
        }
      };
      
      loadReviews();
    }
  }, [selectedLanguages, instructorName, instructor, user?.$id]);

  const toggleLanguage = (language: string) => {
    setSelectedLanguages(prev => {
      if (prev.includes(language)) {
        // 如果已選中，則取消選擇（但至少要保留一個語言）
        if (prev.length > 1) {
          return prev.filter(lang => lang !== language);
        }
        return prev; // 不允許全部取消選擇
      } else {
        // 如果未選中，則添加
        return [...prev, language];
      }
    });
  };

  const handleCourseClick = (courseCode: string) => {
    navigate(`/courses/${courseCode}`);
  };

  const renderBooleanBadge = (value: boolean, trueText: string, falseText: string) => {
    return (
      <Badge variant={value ? "default" : "secondary"} className="text-xs">
        {value ? (
          <>
            <CheckCircle className="h-3 w-3 mr-1" />
            {trueText}
          </>
        ) : (
          <>
            <XCircle className="h-3 w-3 mr-1" />
            {falseText}
          </>
        )}
      </Badge>
    );
  };

  const getWorkloadText = (workload: number) => {
    const workloadTexts = [
      t('review.workload.veryLight'),
      t('review.workload.light'),
      t('review.workload.moderate'),
      t('review.workload.heavy'),
      t('review.workload.veryHeavy')
    ];
    return workloadTexts[workload - 1] || '';
  };

  const getDifficultyText = (difficulty: number) => {
    const difficultyTexts = [
      t('review.difficulty.veryEasy'),
      t('review.difficulty.easy'),
      t('review.difficulty.moderate'),
      t('review.difficulty.hard'),
      t('review.difficulty.veryHard')
    ];
    return difficultyTexts[difficulty - 1] || '';
  };

  const getUsefulnessText = (usefulness: number) => {
    const usefulnessTexts = [
      t('review.usefulness.notUseful'),
      t('review.usefulness.slightlyUseful'),
      t('review.usefulness.moderatelyUseful'),
      t('review.usefulness.veryUseful'),
      t('review.usefulness.extremelyUseful')
    ];
    return usefulnessTexts[usefulness - 1] || '';
  };

  // 計算平均評分
  const calculateAverageRating = () => {
    if (reviews.length === 0) return null;
    
    let totalTeaching = 0;
    let totalGrading = 0;
    let gradingCount = 0;
    
    reviews.forEach(reviewInfo => {
      reviewInfo.instructorDetails.forEach(detail => {
        totalTeaching += detail.teaching;
        if (detail.grading !== null) {
          totalGrading += detail.grading;
          gradingCount++;
        }
      });
    });
    
    return {
      teaching: totalTeaching / reviews.length,
      grading: gradingCount > 0 ? totalGrading / gradingCount : null
    };
  };

  const averageRatings = calculateAverageRating();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">{t('instructor.loadingData')}</p>
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
              <CardTitle className="text-xl">{t('instructor.loadFailed')}</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={() => navigate('/instructors')} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('instructor.backToList')}
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
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        {t('common.back')}
      </Button>

      {/* 講師基本信息 */}
      {instructor && (
        <Card className="course-card overflow-hidden">
          <CardHeader className="overflow-hidden">
            <div className="flex items-center gap-3 overflow-hidden">
              <Users className="h-8 w-8 text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <CardTitle className="text-2xl truncate">{instructor.name}</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 overflow-hidden">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">{instructor.name}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span className="truncate">{instructor.email}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="text-center min-w-0">
                <div className="text-2xl font-bold text-primary">{reviews.length}</div>
                <div className="text-sm text-muted-foreground">{t('instructor.reviews')}</div>
              </div>
              <div className="text-center min-w-0">
                <div className="text-2xl font-bold text-primary">
                  {averageRatings?.teaching ? averageRatings.teaching.toFixed(1) : 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">{t('instructor.avgTeaching')}</div>
              </div>
              <div className="text-center min-w-0">
                <div className="text-2xl font-bold text-primary">
                  {averageRatings?.grading ? averageRatings.grading.toFixed(1) : 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">{t('instructor.avgGrading')}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 學生評論 */}
      <Card className="course-card overflow-hidden">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 shrink-0" />
              <span className="truncate">{t('instructor.studentReviews')} ({reviews.length})</span>
            </CardTitle>
            
            {/* 語言篩選器 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {t('review.filterByLanguage')}:
              </span>
              <div className="flex flex-wrap gap-1">
                <Button
                  variant={selectedLanguages.includes('en') ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleLanguage('en')}
                  className="text-xs"
                >
                  {t('review.languageOptions.en')}
                </Button>
                <Button
                  variant={selectedLanguages.includes('zh-TW') ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleLanguage('zh-TW')}
                  className="text-xs"
                >
                  {t('review.languageOptions.zh-TW')}
                </Button>
                <Button
                  variant={selectedLanguages.includes('zh-CN') ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleLanguage('zh-CN')}
                  className="text-xs"
                >
                  {t('review.languageOptions.zh-CN')}
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-hidden">
          {reviews.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">{t('instructor.noReviews')}</p>
          ) : (
            <div className="space-y-6">
              {reviews.map((reviewInfo, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4 overflow-hidden">
                  {/* 課程信息標題 */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 overflow-hidden">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <h4 
                        className="font-semibold text-primary cursor-pointer hover:underline truncate"
                        onClick={() => handleCourseClick(reviewInfo.course.course_code)}
                      >
                        {reviewInfo.course.course_code} - {reviewInfo.course.course_title}
                      </h4>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
                      {/* 最終成績 - 右上角大顯示 */}
                      {reviewInfo.review.course_final_grade && (
                        <div className="flex flex-col items-center shrink-0">
                          <div className="text-xs text-muted-foreground mb-1">{t('review.finalGrade')}</div>
                          <Badge variant="default" className="text-lg font-bold px-3 py-1 bg-primary text-primary-foreground">
                            {reviewInfo.review.course_final_grade}
                          </Badge>
                        </div>
                      )}
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline">
                          {reviewInfo.term.name}
                        </Badge>
                        <div className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDateTimeUTC8(reviewInfo.review.submitted_at)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 課程整體評分 */}
                  <div className="bg-muted/30 rounded-lg p-3 space-y-2 overflow-hidden">
                    <h5 className="text-sm font-medium">{t('review.courseRatings')}:</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center justify-between min-w-0">
                        <span className="shrink-0">{t('review.workload')}:</span>
                        <div className="flex items-center gap-2 min-w-0">
                          <StarRating rating={reviewInfo.review.course_workload} size="sm" />
                          <span className="text-xs text-muted-foreground truncate">
                            {getWorkloadText(reviewInfo.review.course_workload)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between min-w-0">
                        <span className="shrink-0">{t('review.difficulty')}:</span>
                        <div className="flex items-center gap-2 min-w-0">
                          <StarRating rating={reviewInfo.review.course_difficulties} size="sm" />
                          <span className="text-xs text-muted-foreground truncate">
                            {getDifficultyText(reviewInfo.review.course_difficulties)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between min-w-0">
                        <span className="shrink-0">{t('review.usefulness')}:</span>
                        <div className="flex items-center gap-2 min-w-0">
                          <StarRating rating={reviewInfo.review.course_usefulness} size="sm" />
                          <span className="text-xs text-muted-foreground truncate">
                            {getUsefulnessText(reviewInfo.review.course_usefulness)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 講師評分和評論 */}
                  {reviewInfo.instructorDetails.map((instructorDetail, detailIndex) => (
                    <div key={detailIndex} className="bg-primary/5 rounded-lg p-3 space-y-3 overflow-hidden">
                      <div className="flex items-center justify-between gap-2 overflow-hidden">
                        <h5 className="text-sm font-medium truncate">{t('review.instructorEvaluation')}:</h5>
                        <Badge variant="outline" className="shrink-0">
                          {instructorDetail.session_type}
                        </Badge>
                      </div>
                      
                      {/* 講師評分 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center justify-between min-w-0">
                          <span className="shrink-0">{t('review.teachingScore')}:</span>
                          <StarRating rating={instructorDetail.teaching} size="sm" showValue />
                        </div>
                        {instructorDetail.grading !== null && (
                          <div className="flex items-center justify-between min-w-0">
                            <span className="shrink-0">{t('review.gradingScore')}:</span>
                            <StarRating rating={instructorDetail.grading} size="sm" showValue />
                          </div>
                        )}
                      </div>

                      {/* 課程要求 */}
                      <div className="space-y-2 overflow-hidden">
                        <h6 className="text-xs font-medium text-muted-foreground">{t('review.courseRequirements')}:</h6>
                        <div className="flex flex-wrap gap-1 overflow-hidden">
                          {renderBooleanBadge(instructorDetail.has_midterm, t('review.requirements.midterm'), t('review.requirements.noMidterm'))}
                          {renderBooleanBadge(instructorDetail.has_quiz, t('review.requirements.quiz'), t('review.requirements.noQuiz'))}
                          {renderBooleanBadge(instructorDetail.has_group_project, t('review.requirements.groupProject'), t('review.requirements.noGroupProject'))}
                          {renderBooleanBadge(instructorDetail.has_individual_assignment, t('review.requirements.individualAssignment'), t('review.requirements.noIndividualAssignment'))}
                          {renderBooleanBadge(instructorDetail.has_presentation, t('review.requirements.presentation'), t('review.requirements.noPresentation'))}
                          {renderBooleanBadge(instructorDetail.has_reading, t('review.requirements.reading'), t('review.requirements.noReading'))}
                          {renderBooleanBadge(instructorDetail.has_attendance_requirement, t('review.requirements.attendance'), t('review.requirements.noAttendance'))}
                        </div>
                      </div>

                      {/* 講師評論 */}
                      {instructorDetail.comments && (
                        <div className="space-y-2 min-w-0">
                          <h6 className="text-xs font-medium text-muted-foreground">{t('review.instructorComments')}:</h6>
                          <p className="text-sm bg-background/50 rounded p-2 break-words">
                            {instructorDetail.comments}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* 課程整體評論 */}
                  {reviewInfo.review.course_comments && (
                    <div className="space-y-2 min-w-0">
                      <h5 className="text-sm font-medium">{t('review.courseComments')}:</h5>
                      <div className="bg-muted/30 rounded-lg p-3 break-words">
                        {hasMarkdownFormatting(reviewInfo.review.course_comments) ? (
                          renderCommentMarkdown(reviewInfo.review.course_comments)
                        ) : (
                          <p className="text-sm">
                            {reviewInfo.review.course_comments}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <Separator />
                  
                  {/* 投票按鈕和評論者信息 */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <VotingButtons
                      reviewId={reviewInfo.review.$id}
                      upvotes={reviewInfo.upvotes}
                      downvotes={reviewInfo.downvotes}
                      userVote={reviewInfo.userVote}
                      size="sm"
                    />
                    <div className="text-xs text-muted-foreground">
                      <span>
                        {t('review.reviewerLabel')}: {reviewInfo.review.is_anon ? t('review.anonymousUser') : reviewInfo.review.username}
                      </span>
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

export default InstructorDetail; 