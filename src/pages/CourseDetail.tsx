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
  AlertCircle 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/hooks/useLanguage';
import { useCourseDetailOptimized } from '@/hooks/useCourseDetailOptimized';
import { CourseService, type Course, type CourseReviewInfo, type CourseTeachingInfo } from '@/services/api/courseService';
import { CourseReviewsList } from '@/components/features/reviews/CourseReviewsList';
import { getCourseTitle, translateDepartmentName } from '@/utils/textUtils';
import { FavoriteButton } from '@/components/ui/FavoriteButton';

const CourseDetail = () => {
  const { courseCode } = useParams<{ courseCode: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  
  // 使用優化的 hook
  const { data, loading, error, teachingInfoLoading, reviewsLoading } = useCourseDetailOptimized(
    courseCode || null,
    user?.$id
  );

  const [activeTeachingTab, setActiveTeachingTab] = useState<string>('lecture');
  const [selectedTermFilter, setSelectedTermFilter] = useState<string>('all');

  // 解構數據
  const { course, courseStats, teachingInfo, reviews: allReviews } = data;

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
      <Card className="course-card overflow-hidden">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-2xl font-bold mb-2 break-words">
                {course.course_title}
              </CardTitle>
              <p className="text-lg text-muted-foreground font-mono mb-3">
                {course.course_code}
              </p>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-sm">
                  <BookOpen className="h-3 w-3 mr-1" />
                                      {translateDepartmentName(course.department, t)}
                </Badge>
              </div>
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
        </CardHeader>
        
        {/* 課程統計信息 */}
        {courseStats.reviewCount > 0 && (
          <CardContent className="pt-0">
            <Separator className="mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-lg font-semibold">{courseStats.averageRating.toFixed(2).replace(/\.?0+$/, '')}</span>
                </div>
                <p className="text-sm text-muted-foreground">{t('pages.courseDetail.averageRating')}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <span className="text-lg font-semibold">{courseStats.reviewCount}</span>
                </div>
                <p className="text-sm text-muted-foreground">{t('pages.courseDetail.reviewCount')}</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* 教學記錄 */}
      <Card className="course-card overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 shrink-0" />
            <span>{t('pages.courseDetail.offerRecords')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-hidden">
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
        </CardContent>
      </Card>

      {/* 課程評論 */}
      <div id="student-reviews">
        <CourseReviewsList 
          reviews={allReviews} 
          allReviews={allReviews}
          loading={reviewsLoading}
        />
      </div>

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