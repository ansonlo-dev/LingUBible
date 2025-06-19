import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ChevronDown, 
  ChevronUp, 
  User, 
  Calendar,
  MessageSquare,
  BookOpen,
  Brain,
  Target,
  GraduationCap,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { formatDateTimeUTC8 } from '@/utils/ui/dateUtils';
import { renderCommentMarkdown, hasMarkdownFormatting } from '@/utils/ui/markdownRenderer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { StarRating } from '@/components/ui/star-rating';
import { VotingButtons } from '@/components/ui/voting-buttons';
import { CourseReviewInfo, InstructorDetail } from '@/services/api/courseService';

interface CourseReviewsListProps {
  reviews: (CourseReviewInfo & { upvotes: number; downvotes: number; userVote?: 'up' | 'down' | null })[];
  allReviews?: (CourseReviewInfo & { upvotes: number; downvotes: number; userVote?: 'up' | 'down' | null })[];
  loading?: boolean;
  selectedLanguages?: string[];
  onToggleLanguage?: (language: string) => void;
  t?: (key: string, params?: Record<string, any>) => any;
}

interface ExpandedReviews {
  [reviewId: string]: boolean;
}

export const CourseReviewsList = ({ 
  reviews, 
  allReviews, 
  loading = false, 
  selectedLanguages = [], 
  onToggleLanguage,
  t: tProp 
}: CourseReviewsListProps) => {
  const { t: tContext } = useLanguage();
  const t = tProp || tContext;
  const { user } = useAuth();
  const [expandedReviews, setExpandedReviews] = useState<ExpandedReviews>({});

  // 計算各語言的評論數量
  const getLanguageCount = (language: string) => {
    if (!allReviews) return 0;
    return allReviews.filter(reviewInfo => {
      const reviewLanguage = reviewInfo.review.review_language || 'en';
      return reviewLanguage === language;
    }).length;
  };

  const totalReviews = allReviews?.length || 0;
  const filteredCount = reviews.length;

  const toggleReviewExpansion = (reviewId: string) => {
    setExpandedReviews(prev => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));
  };

  const getWorkloadText = (workload: number) => {
    const workloadMap = {
      1: t('review.workload.veryLight'),
      2: t('review.workload.light'),
      3: t('review.workload.moderate'),
      4: t('review.workload.heavy'),
      5: t('review.workload.veryHeavy')
    };
    return workloadMap[workload as keyof typeof workloadMap] || workload.toString();
  };

  const getDifficultyText = (difficulty: number) => {
    const difficultyMap = {
      1: t('review.difficulty.veryEasy'),
      2: t('review.difficulty.easy'),
      3: t('review.difficulty.moderate'),
      4: t('review.difficulty.hard'),
      5: t('review.difficulty.veryHard')
    };
    return difficultyMap[difficulty as keyof typeof difficultyMap] || difficulty.toString();
  };

  const getUsefulnessText = (usefulness: number) => {
    const usefulnessMap = {
      1: t('review.usefulness.notUseful'),
      2: t('review.usefulness.slightlyUseful'),
      3: t('review.usefulness.moderatelyUseful'),
      4: t('review.usefulness.veryUseful'),
      5: t('review.usefulness.extremelyUseful')
    };
    return usefulnessMap[usefulness as keyof typeof usefulnessMap] || usefulness.toString();
  };

  const renderRequirementBadge = (hasRequirement: boolean, label: string) => {
    return (
      <Badge 
        variant={hasRequirement ? "default" : "secondary"}
        className={`text-xs shrink-0 ${hasRequirement ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}
      >
        {hasRequirement ? (
          <CheckCircle className="h-3 w-3 mr-1 shrink-0" />
        ) : (
          <XCircle className="h-3 w-3 mr-1 shrink-0" />
        )}
        <span className="truncate">{label}</span>
      </Badge>
    );
  };

  const renderInstructorDetails = (instructorDetails: InstructorDetail[]) => {
    return (
      <div className="space-y-4">
        {instructorDetails.map((instructor, index) => (
          <div key={index} className="border rounded-lg p-4 bg-muted/30 overflow-hidden">
            <div className="flex items-start justify-between mb-3 gap-2">
              <h4 className="font-semibold text-lg truncate flex-1 min-w-0">{instructor.instructor_name}</h4>
              <Badge variant="outline" className="text-sm shrink-0">
                {instructor.session_type}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <GraduationCap className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm font-medium">{t('review.teachingScore')}</span>
                </div>
                <StarRating rating={instructor.teaching} showValue />
              </div>
              
              {instructor.grading !== null && (
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm font-medium">{t('review.gradingFairness')}</span>
                  </div>
                  <StarRating rating={instructor.grading} showValue />
                </div>
              )}
            </div>

            {/* 課程要求 */}
            <div className="mb-4">
              <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>{t('review.courseRequirements')}</span>
              </h5>
              <div className="flex flex-wrap gap-2 overflow-hidden">
                {renderRequirementBadge(instructor.has_midterm, t('review.requirements.midterm'))}
                {renderRequirementBadge(instructor.has_quiz, t('review.requirements.quiz'))}
                {renderRequirementBadge(instructor.has_group_project, t('review.requirements.groupProject'))}
                {renderRequirementBadge(instructor.has_individual_assignment, t('review.requirements.individualAssignment'))}
                {renderRequirementBadge(instructor.has_presentation, t('review.requirements.presentation'))}
                {renderRequirementBadge(instructor.has_reading, t('review.requirements.reading'))}
                {renderRequirementBadge(instructor.has_attendance_requirement, t('review.requirements.attendance'))}
              </div>
            </div>

            {/* 教學評論 */}
            {instructor.comments && (
              <div className="min-w-0">
                <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  <span>{t('review.teachingComments')}</span>
                </h5>
                <div className="bg-background/50 p-3 rounded-md break-words">
                  {hasMarkdownFormatting(instructor.comments) ? (
                    renderCommentMarkdown(instructor.comments)
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {instructor.comments}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="course-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {t('review.courseReviews')}
            </CardTitle>
            
            {/* 語言篩選器 - 載入時也顯示 */}
            {onToggleLanguage && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {t('review.filterByLanguage')}:
                </span>
                <div className="flex flex-wrap gap-1">
                  <Button
                    variant={selectedLanguages.includes('en') ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onToggleLanguage('en')}
                    className="text-xs"
                    disabled={loading}
                  >
                    {t('review.languageOptions.en')} ({getLanguageCount('en')})
                  </Button>
                  <Button
                    variant={selectedLanguages.includes('zh-TW') ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onToggleLanguage('zh-TW')}
                    className="text-xs"
                    disabled={loading}
                  >
                    {t('review.languageOptions.zh-TW')} ({getLanguageCount('zh-TW')})
                  </Button>
                  <Button
                    variant={selectedLanguages.includes('zh-CN') ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onToggleLanguage('zh-CN')}
                    className="text-xs"
                    disabled={loading}
                  >
                    {t('review.languageOptions.zh-CN')} ({getLanguageCount('zh-CN')})
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t('common.loading')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (totalReviews === 0) {
    return (
      <Card className="course-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {t('review.courseReviews')} (0)
            </CardTitle>
            
            {/* 語言篩選器 - 無評論時也顯示 */}
            {onToggleLanguage && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {t('review.filterByLanguage')}:
                </span>
                <div className="flex flex-wrap gap-1">
                  <Button
                    variant={selectedLanguages.includes('en') ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onToggleLanguage('en')}
                    className="text-xs"
                  >
                    {t('review.languageOptions.en')} (0)
                  </Button>
                  <Button
                    variant={selectedLanguages.includes('zh-TW') ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onToggleLanguage('zh-TW')}
                    className="text-xs"
                  >
                    {t('review.languageOptions.zh-TW')} (0)
                  </Button>
                  <Button
                    variant={selectedLanguages.includes('zh-CN') ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onToggleLanguage('zh-CN')}
                    className="text-xs"
                  >
                    {t('review.languageOptions.zh-CN')} (0)
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t('review.noReviews')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="course-card">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {filteredCount === totalReviews 
              ? `${t('review.courseReviews')} (${totalReviews})`
              : `${t('review.courseReviews')} (${filteredCount}/${totalReviews})`
            }
          </CardTitle>
          
          {/* 語言篩選器 */}
          {onToggleLanguage && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {t('review.filterByLanguage')}:
              </span>
              <div className="flex flex-wrap gap-1">
                <Button
                  variant={selectedLanguages.includes('en') ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onToggleLanguage('en')}
                  className="text-xs"
                >
                  {t('review.languageOptions.en')} ({getLanguageCount('en')})
                </Button>
                <Button
                  variant={selectedLanguages.includes('zh-TW') ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onToggleLanguage('zh-TW')}
                  className="text-xs"
                >
                  {t('review.languageOptions.zh-TW')} ({getLanguageCount('zh-TW')})
                </Button>
                <Button
                  variant={selectedLanguages.includes('zh-CN') ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onToggleLanguage('zh-CN')}
                  className="text-xs"
                >
                  {t('review.languageOptions.zh-CN')} ({getLanguageCount('zh-CN')})
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6 overflow-hidden">
        {filteredCount === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t('review.noReviewsMatchFilter')}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {t('review.adjustFilterToSeeReviews')}
            </p>
          </div>
        ) : (
          reviews.map((reviewInfo) => {
            const { review, term, instructorDetails } = reviewInfo;
            const isExpanded = expandedReviews[review.$id];
            
            return (
              <div key={review.$id} className="border rounded-lg p-4 space-y-4 overflow-hidden">
                {/* 評論基本信息 */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="font-medium truncate">
                        {review.is_anon ? t('review.anonymousUser') : review.username}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      <Calendar className="h-3 w-3 mr-1 shrink-0" />
                      <span className="truncate">{term.name}</span>
                    </Badge>
                  </div>
                  {/* 最終成績 - 右上角大顯示 */}
                  {review.course_final_grade && (
                    <div className="flex flex-col items-center shrink-0">
                      <div className="text-xs text-muted-foreground mb-1">{t('review.finalGrade')}</div>
                      <Badge variant="default" className="text-lg font-bold px-3 py-1 bg-primary text-primary-foreground">
                        {review.course_final_grade}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* 課程評分 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{t('review.workload')}</span>
                    </div>
                    <StarRating rating={review.course_workload} showValue />
                    <p className="text-xs text-muted-foreground mt-1">
                      {getWorkloadText(review.course_workload)}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Brain className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{t('review.difficulty')}</span>
                    </div>
                    <StarRating rating={review.course_difficulties} showValue />
                    <p className="text-xs text-muted-foreground mt-1">
                      {getDifficultyText(review.course_difficulties)}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{t('review.usefulness')}</span>
                    </div>
                    <StarRating rating={review.course_usefulness} showValue />
                    <p className="text-xs text-muted-foreground mt-1">
                      {getUsefulnessText(review.course_usefulness)}
                    </p>
                  </div>
                </div>

                {/* 課程評論 */}
                {review.course_comments && (
                  <>
                    <Separator />
                    <div className="min-w-0">
                      <h5 className="text-sm font-medium mb-2">{t('review.courseComments')}</h5>
                      <div className="bg-muted/50 p-3 rounded-md break-words">
                        {hasMarkdownFormatting(review.course_comments) ? (
                          renderCommentMarkdown(review.course_comments)
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {review.course_comments}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* 服務學習 */}
                {review.has_service_learning && (
                  <>
                    <Separator />
                    <div>
                      <Badge variant="default" className="mb-2">
                        {t('review.serviceLearning')}
                      </Badge>
                      {review.service_learning_description && (
                        <p className="text-sm text-muted-foreground break-words">
                          {review.service_learning_description}
                        </p>
                      )}
                    </div>
                  </>
                )}

                {/* 講師評價展開/收起按鈕 */}
                {instructorDetails.length > 0 && (
                  <>
                    <Separator />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleReviewExpansion(review.$id)}
                      className="w-full justify-center"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-2" />
                          {t('review.hideInstructorDetails')}
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-2" />
                          {t('review.showInstructorDetails')} ({instructorDetails.length})
                        </>
                      )}
                    </Button>
                  </>
                )}

                {/* 講師詳細評價 */}
                {isExpanded && instructorDetails.length > 0 && (
                  <>
                    <Separator />
                    {renderInstructorDetails(instructorDetails)}
                  </>
                )}

                {/* 投票按鈕 */}
                <Separator />
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 overflow-hidden">
                  <div className="flex-shrink-0">
                    <VotingButtons
                      reviewId={review.$id}
                      upvotes={reviewInfo.upvotes}
                      downvotes={reviewInfo.downvotes}
                      userVote={reviewInfo.userVote}
                      size="sm"
                    />
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 min-w-0">
                    <Calendar className="h-3 w-3 shrink-0" />
                    <span className="truncate">{formatDateTimeUTC8(review.submitted_at)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}; 