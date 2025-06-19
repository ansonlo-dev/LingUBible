import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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
import { useLanguage } from '@/contexts/LanguageContext';
import { CourseService, type Course, type CourseReviewInfo, type CourseTeachingInfo } from '@/services/api/courseService';
import { CourseReviewsList } from '@/components/features/reviews/CourseReviewsList';

const CourseDetail = () => {
  const { courseCode } = useParams<{ courseCode: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [allReviews, setAllReviews] = useState<(CourseReviewInfo & { upvotes: number; downvotes: number; userVote?: 'up' | 'down' | null })[]>([]);
  const [courseStats, setCourseStats] = useState({
    averageRating: 0,
    reviewCount: 0
  });
  const [teachingInfo, setTeachingInfo] = useState<CourseTeachingInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['en', 'zh-TW', 'zh-CN']);

  // 前端篩選評論
  const filteredReviews = allReviews.filter(reviewInfo => {
    const reviewLanguage = reviewInfo.review.review_language || 'en';
    return selectedLanguages.includes(reviewLanguage);
  });

  useEffect(() => {
    if (!courseCode) {
      setError(t('pages.courseDetail.courseNotFound'));
      setLoading(false);
      return;
    }

    const loadCourseData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 並行載入課程基本信息、統計信息和教學信息
        const [courseData, statsData, teachingData] = await Promise.all([
          CourseService.getCourseByCode(courseCode),
          CourseService.getCourseStats(courseCode),
          CourseService.getCourseTeachingInfo(courseCode)
        ]);

        if (!courseData) {
          setError(t('pages.courseDetail.courseNotFound'));
          return;
        }

        setCourse(courseData);
        setCourseStats({
          averageRating: statsData.averageRating,
          reviewCount: statsData.reviewCount
        });
        setTeachingInfo(teachingData);

        setLoading(false);

        // 背景載入所有評論（一次性獲取所有語言的評論）
        try {
          setReviewsLoading(true);
          const reviewsData = await CourseService.getCourseReviewsWithVotes(courseCode, user?.$id);
          setAllReviews(reviewsData);
        } catch (reviewError) {
          console.error('Failed to load reviews:', reviewError);
          // 評論載入失敗不影響主要內容顯示
        } finally {
          setReviewsLoading(false);
        }

      } catch (error) {
        console.error('Failed to load course data:', error);
        setError(t('pages.courseDetail.loadError'));
        setLoading(false);
      }
    };

    loadCourseData();
  }, [courseCode, user?.$id, t]);

  const handleInstructorClick = (instructorName: string) => {
    // 導航到講師詳情頁面
    navigate(`/instructors/${encodeURIComponent(instructorName)}`);
  };

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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 hover:bg-muted/50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
        
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
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 hover:bg-muted/50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
        
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
              <Button onClick={() => navigate('/courses')}>
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
      {/* 返回按鈕 */}
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-4 hover:bg-muted/50 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        {t('common.back')}
      </Button>

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
                  {course.course_department}
                </Badge>
              </div>
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
                  <span className="text-lg font-semibold">{courseStats.averageRating.toFixed(1)}</span>
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
            <span>{t('pages.courseDetail.teachingRecords')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-hidden">
          {teachingInfo.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t('pages.courseDetail.noTeachingRecords')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {teachingInfo.map((info, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors overflow-hidden">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <Badge variant="outline" className="text-sm shrink-0">
                          {info.term.name}
                        </Badge>
                        <Badge variant="secondary" className="text-sm shrink-0">
                          {info.sessionType}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground break-words">
                          {t('pages.courseDetail.termCode')}: {info.term.term_code}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t('pages.courseDetail.startDate')}: {new Date(info.term.start_date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t('pages.courseDetail.endDate')}: {new Date(info.term.end_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleInstructorClick(info.instructor.name)}
                        className="hover:bg-primary/10 hover:text-primary transition-colors max-w-full"
                      >
                        <Mail className="h-4 w-4 mr-2 shrink-0" />
                        <span className="truncate">{info.instructor.name}</span>
                      </Button>
                      <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3 shrink-0" />
                        <span className="text-xs truncate">
                          {info.emailOverride || info.instructor.email}
                        </span>
                      </div>

                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 課程評論 */}
      <CourseReviewsList 
        reviews={filteredReviews} 
        allReviews={allReviews}
        loading={reviewsLoading}
        selectedLanguages={selectedLanguages}
        onToggleLanguage={toggleLanguage}
      />

      {/* 操作按鈕 */}
      <div className="flex flex-col sm:flex-row gap-4 pb-8 md:pb-0">
        <Button 
          size="lg" 
          className="flex-1 gradient-primary hover:opacity-90 text-white"
          onClick={() => navigate(`/write-review/${course.course_code}`)}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          {t('review.writeReview')}
        </Button>
        <Button 
          size="lg" 
          variant="outline" 
          className="flex-1"
          onClick={() => navigate('/courses')}
        >
          {t('common.back')}
        </Button>
      </div>
    </div>
  );
};

export default CourseDetail; 