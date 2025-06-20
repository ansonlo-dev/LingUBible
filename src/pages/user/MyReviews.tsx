import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { CourseService, type Review, type CourseReviewInfo } from '@/services/api/courseService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageSquareText, 
  Edit, 
  Trash2, 
  Calendar, 
  BookOpen, 
  Star, 
  User,
  Loader2,
  AlertCircle,
  Brain,
  Target,
  GraduationCap
} from 'lucide-react';
import { formatDateTimeUTC8 } from '@/utils/ui/dateUtils';
import { renderCommentMarkdown, hasMarkdownFormatting } from '@/utils/ui/markdownRenderer';
import { ReviewAvatar } from '@/components/ui/review-avatar';
import { StarRating } from '@/components/ui/star-rating';

interface UserReviewInfo extends CourseReviewInfo {
  upvotes: number;
  downvotes: number;
}

const MyReviews = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [reviews, setReviews] = useState<UserReviewInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    loadUserReviews();
  }, [user, navigate]);

  const loadUserReviews = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userReviews = await CourseService.getUserReviews(user.$id);
      setReviews(userReviews);
    } catch (error) {
      console.error('Error loading user reviews:', error);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('myReviews.loadError')
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditReview = (reviewId: string, courseCode: string) => {
    navigate(`/write-review/${courseCode}?edit=${reviewId}`);
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      setDeletingReviewId(reviewId);
      await CourseService.deleteReview(reviewId);
      
      // Remove the deleted review from the list
      setReviews(prev => prev.filter(review => review.review.$id !== reviewId));
      
      toast({
        title: t('common.success'),
        description: t('myReviews.deleteSuccess')
      });
    } catch (error) {
      console.error('Error deleting review:', error);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('myReviews.deleteError')
      });
    } finally {
      setDeletingReviewId(null);
    }
  };



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">{t('myReviews.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 overflow-hidden">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquareText className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">{t('sidebar.myReviews')}</h1>
        </div>
        <p className="text-muted-foreground">
          {t('myReviews.description')}
        </p>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <MessageSquareText className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-medium">{t('myReviews.noReviews')}</h3>
              <p className="text-muted-foreground">{t('myReviews.noReviewsDescription')}</p>
              <Button onClick={() => navigate('/courses')} className="mt-4">
                {t('myReviews.browseCoursesToReview')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {reviews.map((reviewInfo) => (
            <Card key={reviewInfo.review.$id} className="course-card overflow-hidden">
              <CardHeader className="pb-3">
                <div className="space-y-3 overflow-hidden">
                  {/* 課程標題 */}
                  <CardTitle className="flex items-center gap-2 min-w-0">
                    <BookOpen className="h-5 w-5 shrink-0" />
                    <span className="truncate">{reviewInfo.review.course_code}</span>
                  </CardTitle>
                  
                  {/* 用戶信息和最終成績 */}
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
                      </div>
                      <Badge variant="outline" className="text-xs w-fit">
                        <span className="truncate">{reviewInfo.term.name}</span>
                      </Badge>
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
                  
                  {/* 操作按鈕 */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditReview(reviewInfo.review.$id, reviewInfo.review.course_code)}
                      className="flex-1 sm:flex-none"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      {t('common.edit')}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={deletingReviewId === reviewInfo.review.$id}
                          className="flex-1 sm:flex-none"
                        >
                          {deletingReviewId === reviewInfo.review.$id ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-1" />
                          )}
                          {t('common.delete')}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-destructive" />
                            {t('myReviews.deleteConfirmTitle')}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('myReviews.deleteConfirmDescription')}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteReview(reviewInfo.review.$id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {t('common.delete')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 overflow-hidden">
                {/* Course Ratings */}
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
                      <StarRating rating={reviewInfo.review.course_workload} showValue size="sm" />
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
                      <StarRating rating={reviewInfo.review.course_difficulties} showValue size="sm" />
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
                      <StarRating rating={reviewInfo.review.course_usefulness} showValue size="sm" />
                    )}
                  </div>
                </div>

                <Separator />

                {/* Course Comments */}
                {reviewInfo.review.course_comments && (
                  <div className="space-y-2 min-w-0">
                    <p className="text-sm font-medium">{t('review.comments')}</p>
                    <div className="bg-muted p-2 rounded-md break-words">
                      {hasMarkdownFormatting(reviewInfo.review.course_comments) ? (
                        renderCommentMarkdown(reviewInfo.review.course_comments)
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {reviewInfo.review.course_comments}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Service Learning */}
                {reviewInfo.review.has_service_learning && (
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{t('review.serviceLearning')}</Badge>
                    </div>
                    {reviewInfo.review.service_learning_description && (
                      <div className="bg-muted p-2 rounded-md break-words">
                        {hasMarkdownFormatting(reviewInfo.review.service_learning_description) ? (
                          renderCommentMarkdown(reviewInfo.review.service_learning_description)
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {reviewInfo.review.service_learning_description}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Instructor Details */}
                {reviewInfo.instructorDetails && reviewInfo.instructorDetails.length > 0 && (
                  <div className="space-y-2 min-w-0">
                    <Separator />
                    <h4 className="text-sm font-medium">{t('review.instructorEvaluation')}</h4>
                    {reviewInfo.instructorDetails.map((instructor, index) => (
                      <div key={index} className="p-2 rounded-md space-y-1 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/30 dark:to-indigo-950/30 overflow-hidden">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span 
                            className="font-medium truncate text-primary cursor-pointer hover:underline"
                            onClick={() => navigate(`/instructors/${encodeURIComponent(instructor.instructor_name)}`)}
                          >
                            {instructor.instructor_name}
                          </span>
                          <Badge 
                            variant="secondary" 
                            className={`shrink-0 ${
                              instructor.session_type === 'Lecture' 
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                : instructor.session_type === 'Tutorial'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                                : ''
                            }`}
                          >
                            {instructor.session_type}
                          </Badge>
                        </div>
                        {/* 教學評分 - 緊湊的2列佈局 */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <GraduationCap className="h-3 w-3 text-primary" />
                              <span className="font-medium text-sm sm:text-base">{t('card.teaching')}</span>
                            </div>
                            {instructor.teaching === null || instructor.teaching === -1 ? (
                              <span className="text-muted-foreground">
                                {instructor.teaching === -1 ? t('review.notApplicable') : t('review.rating.notRated')}
                              </span>
                            ) : (
                              <StarRating rating={instructor.teaching} showValue size="sm" />
                            )}
                          </div>
                          
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Target className="h-3 w-3 text-primary" />
                              <span className="font-medium text-sm sm:text-base">{t('card.grading')}</span>
                            </div>
                            {instructor.grading === null || instructor.grading === -1 ? (
                              <span className="text-muted-foreground">
                                {instructor.grading === -1 ? t('review.notApplicable') : t('review.rating.notRated')}
                              </span>
                            ) : (
                              <StarRating rating={instructor.grading} showValue size="sm" />
                            )}
                          </div>
                        </div>
                        {instructor.comments && (
                          <div className="break-words">
                            {hasMarkdownFormatting(instructor.comments) ? (
                              renderCommentMarkdown(instructor.comments)
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                {instructor.comments}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Vote Stats */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="shrink-0">{t('myReviews.upvotes')}: {reviewInfo.upvotes}</span>
                  <span className="shrink-0">{t('myReviews.downvotes')}: {reviewInfo.downvotes}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyReviews; 