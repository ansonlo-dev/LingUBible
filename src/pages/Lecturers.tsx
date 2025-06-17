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
  XCircle
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
        setError('講師姓名未提供');
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
          setError('找不到該講師的信息');
        }
      } catch (err) {
        console.error('Error loading instructor data:', err);
        setError('載入講師資料時發生錯誤');
      } finally {
        setLoading(false);
      }
    };

    loadInstructorData();
  }, [instructorName]);

  const handleCourseClick = (courseCode: string) => {
    navigate(`/courses/${courseCode}`);
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">載入講師資料中...</p>
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
                返回講師列表
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
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        返回
      </Button>

      {/* 講師基本信息 */}
      {instructor && (
        <Card className="course-card overflow-hidden w-full max-w-full">
          <CardHeader className="overflow-hidden">
            <div className="flex items-center gap-3 overflow-hidden min-w-0">
              <Users className="h-8 w-8 text-primary shrink-0" />
              <div className="min-w-0 flex-1 overflow-hidden">
                <CardTitle className="text-2xl truncate">{instructor.name}</CardTitle>
                <p className="text-muted-foreground truncate">{instructor.type}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 overflow-hidden">
            <div className="flex items-center gap-2 overflow-hidden min-w-0">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm truncate flex-1 min-w-0">{instructor.email}</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="text-center min-w-0">
                <div className="text-2xl font-bold text-primary">{teachingCourses.length}</div>
                <div className="text-sm text-muted-foreground">教授課程</div>
              </div>
              <div className="text-center min-w-0">
                <div className="text-2xl font-bold text-primary">{reviews.length}</div>
                <div className="text-sm text-muted-foreground">學生評論</div>
              </div>
              <div className="text-center min-w-0">
                <div className="text-2xl font-bold text-primary">
                  {reviews.length > 0 
                    ? (reviews.reduce((sum, r) => sum + r.instructorDetail.teaching, 0) / reviews.length).toFixed(1)
                    : 'N/A'
                  }
                </div>
                <div className="text-sm text-muted-foreground">平均教學評分</div>
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
            <span className="truncate">教授課程 ({teachingCourses.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-hidden">
          {teachingCourses.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">暫無教學記錄</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teachingCourses.map((teaching, index) => (
                <Card 
                  key={index} 
                  className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden w-full max-w-full"
                  onClick={() => handleCourseClick(teaching.course.course_code)}
                >
                  <CardContent className="p-4 overflow-hidden">
                    <div className="space-y-2 overflow-hidden">
                      <div className="flex items-center justify-between gap-2 overflow-hidden min-w-0">
                        <h3 className="font-semibold text-primary truncate flex-1 min-w-0">
                          {teaching.course.course_code}
                        </h3>
                        <Badge variant="outline" className="shrink-0">
                          {teaching.sessionType}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium truncate">{teaching.course.course_title}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground overflow-hidden">
                        <div className="flex items-center gap-1 shrink-0">
                          <Calendar className="h-3 w-3" />
                          <span>{teaching.term.name}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 min-w-0">
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
            <span className="truncate">學生評論 ({reviews.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-hidden">
          {reviews.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">暫無學生評論</p>
          ) : (
            <div className="space-y-6">
              {reviews.map((reviewInfo, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4 overflow-hidden w-full max-w-full">
                  {/* 評論標題 */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 overflow-hidden">
                    <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                      <h4 className="font-semibold text-primary truncate flex-1 min-w-0">
                        {reviewInfo.course.course_code} - {reviewInfo.course.course_title}
                      </h4>
                      <Badge variant="outline" className="shrink-0">
                        {reviewInfo.instructorDetail.session_type}
                      </Badge>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
                      {/* 最終成績 - 右上角大顯示 */}
                      {reviewInfo.review.course_final_grade && (
                        <div className="flex flex-col items-center shrink-0">
                          <div className="text-xs text-muted-foreground mb-1">最終成績</div>
                          <Badge variant="default" className="text-lg font-bold px-3 py-1 bg-primary text-primary-foreground">
                            {reviewInfo.review.course_final_grade}
                          </Badge>
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground shrink-0">
                        {reviewInfo.term.name}
                      </div>
                    </div>
                  </div>

                  {/* 評分 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden">
                    <div className="space-y-2 min-w-0 overflow-hidden">
                      <div className="flex items-center justify-between min-w-0 overflow-hidden">
                        <span className="text-sm shrink-0">教學評分:</span>
                        <div className="shrink-0">
                          {renderRatingStars(reviewInfo.instructorDetail.teaching)}
                        </div>
                      </div>
                      {reviewInfo.instructorDetail.grading !== null && (
                        <div className="flex items-center justify-between min-w-0 overflow-hidden">
                          <span className="text-sm shrink-0">評分公平性:</span>
                          <div className="shrink-0">
                            {renderRatingStars(reviewInfo.instructorDetail.grading)}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 min-w-0 overflow-hidden">
                      <div className="flex items-center justify-between min-w-0 overflow-hidden">
                        <span className="text-sm shrink-0">課程評分:</span>
                        <div className="shrink-0">
                          {renderRatingStars(reviewInfo.review.course_usefulness)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 課程要求 */}
                  <div className="space-y-2 overflow-hidden">
                    <h5 className="text-sm font-medium">課程要求:</h5>
                    <div className="flex flex-wrap gap-2 overflow-hidden">
                      {renderBooleanBadge(reviewInfo.instructorDetail.has_midterm, "期中考", "無期中考")}
                      {renderBooleanBadge(reviewInfo.instructorDetail.has_quiz, "小測", "無小測")}
                      {renderBooleanBadge(reviewInfo.instructorDetail.has_group_project, "小組專案", "無小組專案")}
                      {renderBooleanBadge(reviewInfo.instructorDetail.has_individual_assignment, "個人作業", "無個人作業")}
                      {renderBooleanBadge(reviewInfo.instructorDetail.has_presentation, "報告", "無報告")}
                      {renderBooleanBadge(reviewInfo.instructorDetail.has_reading, "閱讀", "無閱讀")}
                      {renderBooleanBadge(reviewInfo.instructorDetail.has_attendance_requirement, "出席要求", "無出席要求")}
                    </div>
                  </div>

                  {/* 評論內容 */}
                  {reviewInfo.instructorDetail.comments && (
                    <div className="space-y-2 min-w-0 overflow-hidden">
                      <h5 className="text-sm font-medium">對講師的評價:</h5>
                      <p className="text-sm bg-muted/50 rounded-lg p-3 break-words overflow-hidden">
                        {reviewInfo.instructorDetail.comments}
                      </p>
                    </div>
                  )}

                  {/* 課程整體評論 */}
                  {reviewInfo.review.course_comments && (
                    <div className="space-y-2 min-w-0 overflow-hidden">
                      <h5 className="text-sm font-medium">課程整體評價:</h5>
                      <p className="text-sm bg-muted/30 rounded-lg p-3 break-words overflow-hidden">
                        {reviewInfo.review.course_comments}
                      </p>
                    </div>
                  )}

                  <Separator />
                  
                  {/* 評論者信息 */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground overflow-hidden">
                    <span className="truncate flex-1 min-w-0">
                      評論者: {reviewInfo.review.is_anon ? '匿名' : reviewInfo.review.username}
                    </span>
                    <span className="shrink-0 ml-2">
                      {formatDateTimeUTC8(reviewInfo.review.submitted_at)}
                    </span>
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