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
import { CachedCourseService } from '@/services/cache/cachedCourseService';
import { 
  Instructor, 
  InstructorReviewFromDetails,
  InstructorDetail as InstructorDetailType
} from '@/services/api/courseService';
import { VotingButtons } from '@/components/ui/voting-buttons';
import { useAuth } from '@/contexts/AuthContext';
import { formatDateTimeUTC8 } from '@/utils/ui/dateUtils';

const InstructorDetail = () => {
  const { instructorName } = useParams<{ instructorName: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();

  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [reviews, setReviews] = useState<(InstructorReviewFromDetails & { upvotes: number; downvotes: number; userVote?: 'up' | 'down' | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        // 並行獲取講師信息和評論
        const [instructorData, reviewsData] = await Promise.all([
          CachedCourseService.getInstructorByName(decodedName),
          CachedCourseService.getInstructorReviewsFromDetailsWithVotes(decodedName, user?.$id)
        ]);

        setInstructor(instructorData);
        setReviews(reviewsData);

        if (!instructorData) {
          setError(t('instructor.notFound'));
        }
      } catch (err) {
        console.error('Error loading instructor data:', err);
        setError(t('instructor.loadError'));
      } finally {
        setLoading(false);
      }
    };

    loadInstructorData();
  }, [instructorName, user?.$id]);

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
    <div className="container mx-auto px-4 py-6 space-y-6">
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
        <Card className="course-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-2xl">{instructor.name}</CardTitle>
                <p className="text-muted-foreground">{instructor.type}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{instructor.email}</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{reviews.length}</div>
                <div className="text-sm text-muted-foreground">{t('instructor.reviews')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {averageRatings?.teaching ? averageRatings.teaching.toFixed(1) : 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">{t('instructor.avgTeaching')}</div>
              </div>
              <div className="text-center">
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
      <Card className="course-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {t('instructor.studentReviews')} ({reviews.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">{t('instructor.noReviews')}</p>
          ) : (
            <div className="space-y-6">
              {reviews.map((reviewInfo, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  {/* 課程信息標題 */}
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <h4 
                        className="font-semibold text-primary cursor-pointer hover:underline"
                        onClick={() => handleCourseClick(reviewInfo.course.course_code)}
                      >
                        {reviewInfo.course.course_code} - {reviewInfo.course.course_title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-4">
                      {/* 最終成績 - 右上角大顯示 */}
                      {reviewInfo.review.course_final_grade && (
                        <div className="flex flex-col items-center shrink-0">
                          <div className="text-xs text-muted-foreground mb-1">{t('review.finalGrade')}</div>
                          <Badge variant="default" className="text-lg font-bold px-3 py-1 bg-primary text-primary-foreground">
                            {reviewInfo.review.course_final_grade}
                          </Badge>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {reviewInfo.term.name}
                        </Badge>
                        <div className="text-sm text-muted-foreground">
                          {formatDateTimeUTC8(reviewInfo.review.submitted_at)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 課程整體評分 */}
                  <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                    <h5 className="text-sm font-medium">{t('review.courseRatings')}:</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span>{t('review.workload')}:</span>
                        <div className="flex items-center gap-2">
                          <StarRating rating={reviewInfo.review.course_workload} size="sm" />
                          <span className="text-xs text-muted-foreground">
                            {getWorkloadText(reviewInfo.review.course_workload)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{t('review.difficulty')}:</span>
                        <div className="flex items-center gap-2">
                          <StarRating rating={reviewInfo.review.course_difficulties} size="sm" />
                          <span className="text-xs text-muted-foreground">
                            {getDifficultyText(reviewInfo.review.course_difficulties)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{t('review.usefulness')}:</span>
                        <div className="flex items-center gap-2">
                          <StarRating rating={reviewInfo.review.course_usefulness} size="sm" />
                          <span className="text-xs text-muted-foreground">
                            {getUsefulnessText(reviewInfo.review.course_usefulness)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 講師評分和評論 */}
                  {reviewInfo.instructorDetails.map((instructorDetail, detailIndex) => (
                    <div key={detailIndex} className="bg-primary/5 rounded-lg p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="text-sm font-medium">{t('review.instructorEvaluation')}:</h5>
                        <Badge variant="outline">
                          {instructorDetail.session_type}
                        </Badge>
                      </div>
                      
                      {/* 講師評分 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center justify-between">
                          <span>{t('review.teachingScore')}:</span>
                          <StarRating rating={instructorDetail.teaching} size="sm" showValue />
                        </div>
                        {instructorDetail.grading !== null && (
                          <div className="flex items-center justify-between">
                            <span>{t('review.gradingScore')}:</span>
                            <StarRating rating={instructorDetail.grading} size="sm" showValue />
                          </div>
                        )}
                      </div>

                      {/* 課程要求 */}
                      <div className="space-y-2">
                        <h6 className="text-xs font-medium text-muted-foreground">{t('review.courseRequirements')}:</h6>
                        <div className="flex flex-wrap gap-1">
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
                        <div className="space-y-2">
                          <h6 className="text-xs font-medium text-muted-foreground">{t('review.instructorComments')}:</h6>
                          <p className="text-sm bg-background/50 rounded p-2">
                            {instructorDetail.comments}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* 課程整體評論 */}
                  {reviewInfo.review.course_comments && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">{t('review.courseComments')}:</h5>
                      <p className="text-sm bg-muted/30 rounded-lg p-3">
                        {reviewInfo.review.course_comments}
                      </p>
                    </div>
                  )}

                  <Separator />
                  
                  {/* 投票按鈕和評論者信息 */}
                  <div className="flex items-center justify-between">
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