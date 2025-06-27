import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageSquareText, 
  Edit, 
  Trash2, 
  Loader2, 
  AlertCircle, 
  User, 
  FileText, 
  CheckCircle, 
  XCircle, 
  GraduationCap,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { StarRating } from '@/components/ui/star-rating';
import { ReviewAvatar } from '@/components/ui/review-avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CourseService } from '@/services/api/courseService';
import type { CourseReviewInfo, InstructorDetail, Instructor } from '@/services/api/courseService';
import { hasMarkdownFormatting, renderCommentMarkdown } from '@/utils/ui/markdownRenderer';
import { useNavigate } from 'react-router-dom';
import { formatDateTimeUTC8 } from '@/utils/ui/dateUtils';
import { GradeBadge } from '@/components/ui/GradeBadge';
import { cn } from '@/lib/utils';
import { VotingButtons } from '@/components/ui/voting-buttons';
import { getInstructorName, getCourseTitle } from '@/utils/textUtils';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UserReviewInfo extends CourseReviewInfo {
  upvotes: number;
  downvotes: number;
  instructorData: Map<string, Instructor>;
}

interface ReviewInfoWithInstructors extends CourseReviewInfo {
  upvotes: number;
  downvotes: number;
  instructorMaps: Map<string, Instructor>;
}

const MyReviews = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [reviews, setReviews] = useState<UserReviewInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  useEffect(() => {
    loadUserReviews();
  }, [user]);

  const loadUserReviews = async () => {
    if (!user) {
      setError(t('myReviews.loginRequired'));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // 獲取用戶評論
      const userReviews = await CourseService.getUserReviews(user.$id);
      
      // 為每個評論獲取講師信息
      const reviewsWithInstructors = await Promise.all(
        userReviews.map(async (reviewInfo) => {
          const instructorData = new Map<string, Instructor>();
          
          // 從 instructor_details 中獲取所有講師名字
          const instructorNames = reviewInfo.instructorDetails.map(detail => detail.instructor_name);
          
          // 並行獲取所有講師的完整信息
          const instructorPromises = [...new Set(instructorNames)].map(async (name) => {
            const instructor = await CourseService.getInstructorByName(name);
            if (instructor) {
              instructorData.set(name, instructor);
            }
          });
          
          await Promise.all(instructorPromises);
          
          return {
            ...reviewInfo,
            instructorData
          };
        })
      );
      
      setReviews(reviewsWithInstructors);
    } catch (err) {
      console.error('Error loading user reviews:', err);
      setError(t('myReviews.loadError'));
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
      
      // Remove from local state
      setReviews(prev => prev.filter(r => r.review.$id !== reviewId));
      
      toast({
        title: t('myReviews.deleteSuccess'),
        description: t('myReviews.deleteSuccessDescription'),
      });
    } catch (err) {
      console.error('Error deleting review:', err);
      toast({
        variant: "destructive",
        title: t('myReviews.deleteError'),
        description: t('myReviews.deleteErrorDescription'),
      });
    } finally {
      setDeletingReviewId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg p-12 bg-card border border-border dark:bg-[#202936] dark:border-[#2a3441]">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-medium">{t('auth.loginRequired')}</h3>
            <p className="text-muted-foreground">{t('myReviews.loginDescription')}</p>
            <Button onClick={() => navigate('/login')} className="mt-4">
              {t('auth.login')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="space-y-2 mb-6">
        <h1 className="text-3xl font-bold">{t('myReviews.title')}</h1>
        <p className="text-muted-foreground">{t('myReviews.subtitle')}</p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-lg p-12 bg-card border border-border dark:bg-[#202936] dark:border-[#2a3441]">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h3 className="text-lg font-medium">{t('common.error')}</h3>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={loadUserReviews} variant="outline">
              {t('common.retry')}
            </Button>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {!loading && !error && (
        <>
          {reviews.length === 0 ? (
            <div className="rounded-lg p-12 bg-card border border-border dark:bg-[#202936] dark:border-[#2a3441]">
              <div className="text-center space-y-4">
                <MessageSquareText className="h-12 w-12 text-muted-foreground mx-auto" />
                <h3 className="text-lg font-medium">{t('myReviews.noReviews')}</h3>
                <p className="text-muted-foreground">{t('myReviews.noReviewsDescription')}</p>
                <Button onClick={() => navigate('/courses')} className="mt-4">
                  {t('myReviews.browseCoursesToReview')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-1 gap-6">
              {reviews.map((reviewInfo) => (
                <div key={reviewInfo.review.$id} className="rounded-lg p-4 space-y-3 overflow-hidden bg-card border border-border dark:bg-[#202936] dark:border-[#2a3441]">
                  {/* 評論基本信息 */}
                  <div className="flex items-start justify-between gap-3">
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
                        <Badge 
                          variant="outline" 
                          className="text-xs shrink-0 hidden md:inline-flex"
                        >
                          <span className="truncate">{reviewInfo.term.name}</span>
                        </Badge>
                      </div>
                      {/* 學期徽章 - 手機版顯示在下方 */}
                      <Badge 
                        variant="outline" 
                        className="text-xs w-fit md:hidden"
                      >
                        <span className="truncate">{reviewInfo.term.name}</span>
                      </Badge>
                      {/* 課程標題 - 顯示在學生姓名/匿名行下方 */}
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-lg">
                            <a
                              href={`/courses/${reviewInfo.review.course_code}`}
                              className="text-primary cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors px-2 py-1 rounded-md inline-block no-underline"
                              onClick={(e) => {
                                if (e.ctrlKey || e.metaKey || e.button === 1) {
                                  return;
                                }
                                e.preventDefault();
                                navigate(`/courses/${reviewInfo.review.course_code}`);
                              }}
                            >
                              <div className="font-bold">{reviewInfo.review.course_code}</div>
                            </a>
                          </h4>
                        </div>
                      </div>
                    </div>
                    {/* 右上角：最終成績和編輯按鈕 */}
                    <div className="flex items-start gap-3 shrink-0">
                      {/* 最終成績 */}
                      {reviewInfo.review.course_final_grade && (
                        <div className="flex flex-col items-center">
                          <GradeBadge 
                            grade={reviewInfo.review.course_final_grade}
                            size="md"
                            showTooltip={true}
                          />
                        </div>
                      )}
                      {/* 操作按鈕 - 垂直排列，每個按鈕一行 */}
                      <div className="flex flex-col gap-2">
                        <div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditReview(reviewInfo.review.$id, reviewInfo.review.course_code)}
                            className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                            title={t('common.edit')}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                        <div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={deletingReviewId === reviewInfo.review.$id}
                                className="h-8 w-8 p-0 border-2 border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-600 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300 dark:hover:border-red-600"
                                title={t('common.delete')}
                              >
                                {deletingReviewId === reviewInfo.review.$id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-white dark:bg-gray-900">
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
                    </div>
                  </div>

                  {/* 課程評分 */}
                  <div className="grid grid-cols-3 gap-1 text-xs">
                    <div className="text-center">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-center gap-1 mb-1 lg:mb-0">
                        <span className="font-medium text-sm sm:text-base">{t('review.workload')}</span>
                        <div className="flex items-center justify-center lg:ml-1">
                          {reviewInfo.review.course_workload === null || reviewInfo.review.course_workload === -1 ? (
                            <span className="text-muted-foreground">
                              {reviewInfo.review.course_workload === -1 ? t('review.notApplicable') : t('review.rating.notRated')}
                            </span>
                          ) : (
                            <StarRating rating={reviewInfo.review.course_workload} showValue size="sm" showTooltip ratingType="workload" />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-center gap-1 mb-1 lg:mb-0">
                        <span className="font-medium text-sm sm:text-base">{t('review.difficulty')}</span>
                        <div className="flex items-center justify-center lg:ml-1">
                          {reviewInfo.review.course_difficulties === null || reviewInfo.review.course_difficulties === -1 ? (
                            <span className="text-muted-foreground">
                              {reviewInfo.review.course_difficulties === -1 ? t('review.notApplicable') : t('review.rating.notRated')}
                            </span>
                          ) : (
                            <StarRating rating={reviewInfo.review.course_difficulties} showValue size="sm" showTooltip ratingType="difficulty" />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-center gap-1 mb-1 lg:mb-0">
                        <span className="font-medium text-sm sm:text-base">{t('review.usefulness')}</span>
                        <div className="flex items-center justify-center lg:ml-1">
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
                  </div>

                  {/* 課程評論 */}
                  {reviewInfo.review.course_comments && (
                    <>
                      <Separator />
                      <div className="min-w-0">
                        <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <MessageSquareText className="h-4 w-4 shrink-0" />
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

                  {/* 講師評分 */}
                  {reviewInfo.instructorDetails.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-medium">{t('review.instructorEvaluation')}</h3>
                      <div className="space-y-3">
                        {reviewInfo.instructorDetails.map((instructorDetail, idx) => {
                          // 從 instructorData 中獲取真實的講師信息
                          const instructor = reviewInfo.instructorData.get(instructorDetail.instructor_name);
                          
                          // 如果有講師信息，使用 getInstructorName 獲取正確的名字顯示
                          let displayName = instructorDetail.instructor_name;
                          if (instructor) {
                            const nameInfo = getInstructorName(instructor, language);
                            displayName = nameInfo.secondary ? 
                              `${nameInfo.primary} (${nameInfo.secondary})` : 
                              nameInfo.primary;
                          }

                          return (
                            <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="font-medium cursor-pointer hover:text-primary transition-colors"
                                     onClick={() => navigate(`/instructors/${encodeURIComponent(instructorDetail.instructor_name)}`)}
                                >
                                  {displayName}
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {instructorDetail.session_type}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex flex-col items-center">
                                  <div className="text-xs text-muted-foreground mb-1">{t('review.teaching')}</div>
                                  <StarRating rating={instructorDetail.teaching} size="sm" />
                                </div>
                                {instructorDetail.grading !== null && (
                                  <div className="flex flex-col items-center">
                                    <div className="text-xs text-muted-foreground mb-1">{t('review.grading')}</div>
                                    <StarRating rating={instructorDetail.grading} size="sm" />
                                  </div>
                                )}
                              </div>
                              {instructorDetail.comments && (
                                <div className="mt-2 text-sm text-muted-foreground">
                                  {hasMarkdownFormatting(instructorDetail.comments) ? 
                                    renderCommentMarkdown(instructorDetail.comments) : 
                                    instructorDetail.comments
                                  }
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 投票和時間信息 */}
                  <Separator />
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 overflow-hidden">
                    <div className="flex-shrink-0">
                      <VotingButtons
                        reviewId={reviewInfo.review.$id}
                        upvotes={reviewInfo.upvotes}
                        downvotes={reviewInfo.downvotes}
                        userVote={null}
                        size="sm"
                        disabled={true}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 min-w-0">
                      <span 
                        className="truncate cursor-help" 
                        title={t('review.timestampTooltip', { timezone: 'Hong Kong Time (UTC+8)' })}
                      >
                        {formatDateTimeUTC8(reviewInfo.review.$createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyReviews;