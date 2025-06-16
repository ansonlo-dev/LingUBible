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
  AlertCircle
} from 'lucide-react';
import { formatDateTimeUTC8 } from '@/utils/ui/dateUtils';

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

  const renderStars = (rating: number) => {
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
        <span className="ml-1 text-sm text-muted-foreground">({rating})</span>
      </div>
    );
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
    <div className="container mx-auto px-4 py-8">
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
        <div className="space-y-6">
          {reviews.map((reviewInfo) => (
            <Card key={reviewInfo.review.$id} className="course-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-start justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        {reviewInfo.review.course_code}
                      </CardTitle>
                      {/* 最終成績 - 右上角大顯示 */}
                      {reviewInfo.review.course_final_grade && (
                        <div className="flex flex-col items-center shrink-0 mr-4">
                          <div className="text-xs text-muted-foreground mb-1">{t('review.finalGrade')}</div>
                          <Badge variant="default" className="text-lg font-bold px-3 py-1 bg-primary text-primary-foreground">
                            {reviewInfo.review.course_final_grade}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {reviewInfo.term.name}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {reviewInfo.review.is_anon ? t('review.anonymous') : reviewInfo.review.username}
                      </div>
                      <span>{formatDateTimeUTC8(reviewInfo.review.$createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditReview(reviewInfo.review.$id, reviewInfo.review.course_code)}
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
              <CardContent className="space-y-4">
                {/* Course Ratings */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{t('review.workload')}</p>
                    {renderStars(reviewInfo.review.course_workload)}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{t('review.difficulty')}</p>
                    {renderStars(reviewInfo.review.course_difficulties)}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{t('review.usefulness')}</p>
                    {renderStars(reviewInfo.review.course_usefulness)}
                  </div>
                </div>

                <Separator />

                {/* Course Comments */}
                {reviewInfo.review.course_comments && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">{t('review.comments')}</p>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                      {reviewInfo.review.course_comments}
                    </p>
                  </div>
                )}

                {/* Service Learning */}
                {reviewInfo.review.has_service_learning && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{t('review.serviceLearning')}</Badge>
                    </div>
                    {reviewInfo.review.service_learning_description && (
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                        {reviewInfo.review.service_learning_description}
                      </p>
                    )}
                  </div>
                )}

                {/* Instructor Details */}
                {reviewInfo.instructorDetails && reviewInfo.instructorDetails.length > 0 && (
                  <div className="space-y-3">
                    <Separator />
                    <h4 className="text-sm font-medium">{t('review.instructorEvaluations')}</h4>
                    {reviewInfo.instructorDetails.map((instructor, index) => (
                      <div key={index} className="bg-muted p-3 rounded-md space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{instructor.instructor_name}</span>
                          <Badge variant="outline">{instructor.session_type}</Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="font-medium">{t('review.teachingScore')}: </span>
                            {renderStars(instructor.teaching)}
                          </div>
                          {instructor.grading && (
                            <div>
                              <span className="font-medium">{t('review.gradingScore')}: </span>
                              {renderStars(instructor.grading)}
                            </div>
                          )}
                        </div>
                        {instructor.comments && (
                          <p className="text-sm text-muted-foreground">
                            {instructor.comments}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Vote Stats */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{t('myReviews.upvotes')}: {reviewInfo.upvotes}</span>
                  <span>{t('myReviews.downvotes')}: {reviewInfo.downvotes}</span>
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