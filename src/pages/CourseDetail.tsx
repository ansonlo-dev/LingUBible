import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  ArrowLeft,
  Users,
  Calendar,
  Mail,
  Globe,
  Star,
  MessageSquare,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CourseService, Course, CourseTeachingInfo, CourseReviewInfo } from '@/services/api/courseService';
import { useAuth } from '@/contexts/AuthContext';
import { CourseReviewsList } from '@/components/features/reviews/CourseReviewsList';

const CourseDetail = () => {
  const { courseCode } = useParams<{ courseCode: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [teachingInfo, setTeachingInfo] = useState<CourseTeachingInfo[]>([]);
  const [courseStats, setCourseStats] = useState({
    reviewCount: 0,
    averageRating: 0,
    studentCount: 0
  });
  const [reviews, setReviews] = useState<(CourseReviewInfo & { upvotes: number; downvotes: number; userVote?: 'up' | 'down' | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCourseData = async () => {
      if (!courseCode) {
        setError(t('pages.courseDetail.invalidCourseCode'));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // 並行獲取課程信息、教學記錄和統計信息
        const [courseData, teachingData, statsData] = await Promise.all([
          CourseService.getCourseByCode(courseCode),
          CourseService.getCourseTeachingInfo(courseCode),
          CourseService.getCourseStats(courseCode)
        ]);

        if (!courseData) {
          setError(t('pages.courseDetail.courseNotFound'));
          return;
        }

        setCourse(courseData);
        setTeachingInfo(teachingData);
        setCourseStats(statsData);

        // 獲取課程評論
        try {
          setReviewsLoading(true);
          const reviewsData = await CourseService.getCourseReviewsWithVotes(courseCode, user?.$id);
          setReviews(reviewsData);
        } catch (reviewError) {
          console.error('Error loading reviews:', reviewError);
          // 評論載入失敗不影響主要頁面顯示
        } finally {
          setReviewsLoading(false);
        }
      } catch (err) {
        console.error('Error loading course data:', err);
                  setError(t('pages.courseDetail.loadError'));
      } finally {
        setLoading(false);
      }
    };

    loadCourseData();
  }, [courseCode]);

  const getLanguageColor = (lang: string) => {
    switch (lang) {
      case 'E':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'C':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getLanguageText = (lang: string) => {
    switch (lang) {
      case 'E':
        return 'English';
      case 'C':
        return '中文';
      default:
        return lang;
    }
  };

  const handleInstructorClick = (instructorName: string) => {
    // 導航到講師詳情頁面
          navigate(`/instructors/${encodeURIComponent(instructorName)}`);
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
    <div className="container mx-auto px-4 py-6 space-y-6">
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
      <Card className="course-card">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-2xl font-bold mb-2">
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
                <Badge variant="outline" className={getLanguageColor(course.course_language)}>
                  <Globe className="h-3 w-3 mr-1" />
                  {getLanguageText(course.course_language)}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        
        {/* 課程統計信息 */}
        {(courseStats.reviewCount > 0 || courseStats.studentCount > 0) && (
          <CardContent className="pt-0">
            <Separator className="mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-lg font-semibold">{courseStats.studentCount}</span>
                </div>
                <p className="text-sm text-muted-foreground">{t('pages.courseDetail.studentCount')}</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* 教學記錄 */}
      <Card className="course-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
                          {t('pages.courseDetail.teachingRecords')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {teachingInfo.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t('pages.courseDetail.noTeachingRecords')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {teachingInfo.map((info, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline" className="text-sm">
                          {info.term.name}
                        </Badge>
                        <Badge variant="secondary" className="text-sm">
                          {info.sessionType}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
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
                    <div className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleInstructorClick(info.instructor.name)}
                        className="hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        {info.instructor.name}
                      </Button>
                      <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span className="text-xs">
                          {info.emailOverride || info.instructor.email}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {info.instructor.type}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
              </Card>

      {/* 課程評論 */}
      <CourseReviewsList reviews={reviews} loading={reviewsLoading} />

      {/* 操作按鈕 */}
      <div className="flex gap-4">
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