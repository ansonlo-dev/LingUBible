import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LecturerCard } from '@/components/features/reviews/LecturerCard';
import { ReviewCard } from '@/components/features/reviews/ReviewCard';
import { 
  BookOpen, 
  Star, 
  Users, 
  GraduationCap, 
  ArrowLeft,
  Filter,
  SortAsc
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CourseService } from '@/services/api/courseService';
import type { CourseWithLecturers, CourseReview, LecturerWithStats } from '@/types/course';

const CourseDetail = () => {
  const { courseCode } = useParams<{ courseCode: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [selectedLecturer, setSelectedLecturer] = useState<string>('all');
  const [sortBy, setSortBy] = useState('rating');
  const [courseData, setCourseData] = useState<CourseWithLecturers | null>(null);
  const [reviews, setReviews] = useState<CourseReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 載入課程數據
  useEffect(() => {
    const loadCourseData = async () => {
      if (!courseCode) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // 獲取課程詳細信息（包含講師）
        const course = await CourseService.getCourseWithLecturers(courseCode);
        if (!course) {
          setError('課程不存在');
          return;
        }
        
        setCourseData(course);
        
        // 獲取課程評價
        const courseReviews = await CourseService.getCourseReviews(course.$id);
        setReviews(courseReviews);
        
      } catch (error) {
        console.error('Error loading course data:', error);
        setError('載入課程數據時發生錯誤');
      } finally {
        setLoading(false);
      }
    };

    loadCourseData();
  }, [courseCode]);

  // 過濾評論
  const filteredReviews = selectedLecturer === 'all' 
    ? reviews 
    : reviews.filter(review => review.lecturerId === selectedLecturer);

  // 排序評論
  const sortedReviews = [...filteredReviews].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.overallRating - a.overallRating;
      case 'date':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'likes':
        return b.likes - a.likes;
      default:
        return 0;
    }
  });

  const getOfferedColor = (offered: 'Yes' | 'No') => {
    if (offered === 'Yes') {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    } else {
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    }
  };

  const getOfferedText = (offered: 'Yes' | 'No') => {
    return offered === 'Yes' ? t('offered.yes') : t('offered.no');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !courseData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {error || '課程不存在'}
            </h3>
            <Button onClick={() => navigate('/courses')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回課程列表
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 返回按鈕 */}
        <Button 
          onClick={() => navigate('/courses')} 
          variant="ghost" 
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>

        {/* 課程標題區域 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {courseData.title}
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-300">
                    {courseData.code}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3 mb-6">
                <Badge variant="secondary" className="px-3 py-1">
                  {courseData.department}
                </Badge>
                <Badge className={getOfferedColor(courseData.offered || 'Yes')}>
                  {getOfferedText(courseData.offered || 'Yes')}
                </Badge>
                <Badge variant="outline" className="px-3 py-1">
                  {courseData.credits} 學分
                </Badge>
              </div>

              {courseData.description && (
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {courseData.description}
                </p>
              )}

              {courseData.prerequisites && courseData.prerequisites.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    先修課程：
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {courseData.prerequisites.map((prereq, index) => (
                      <Badge key={index} variant="outline">
                        {prereq}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 統計數據 */}
            <div className="lg:w-80">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">課程統計</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      <span className="font-medium">平均評分</span>
                    </div>
                    <span className="text-lg font-bold">
                      {courseData.averageRating > 0 ? courseData.averageRating.toFixed(1) : 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-500" />
                      <span className="font-medium">評價數量</span>
                    </div>
                    <span className="text-lg font-bold">{courseData.totalReviews}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-green-500" />
                      <span className="font-medium">學生人數</span>
                    </div>
                    <span className="text-lg font-bold">{courseData.totalStudents}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* 主要內容區域 */}
        <Tabs defaultValue="lecturers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50 backdrop-blur-sm">
            <TabsTrigger 
              value="lecturers" 
              className="hover:scale-105 hover:shadow-md transition-[transform,box-shadow] duration-200 data-[state=active]:shadow-lg"
            >
              講師 ({courseData.lecturers.length})
            </TabsTrigger>
            <TabsTrigger 
              value="reviews" 
              className="hover:scale-105 hover:shadow-md transition-[transform,box-shadow] duration-200 data-[state=active]:shadow-lg"
            >
              評價 ({reviews.length})
            </TabsTrigger>
          </TabsList>

          {/* 講師標籤頁 */}
          <TabsContent value="lecturers" className="space-y-6">
            {courseData.lecturers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  暫無講師信息
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  此課程暫時沒有講師信息
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courseData.lecturers.map((lecturer: LecturerWithStats) => (
                  <LecturerCard
                    key={lecturer.$id}
                    lecturer={lecturer}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* 評價標籤頁 */}
          <TabsContent value="reviews" className="space-y-6">
            {/* 過濾和排序控制 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 講師過濾器 */}
                <Select value={selectedLecturer} onValueChange={setSelectedLecturer}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="選擇講師" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有講師</SelectItem>
                    {courseData.lecturers.map((lecturer) => (
                      <SelectItem key={lecturer.$id} value={lecturer.$id}>
                        {lecturer.title} {lecturer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* 排序選擇器 */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SortAsc className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="排序方式" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">按評分排序</SelectItem>
                    <SelectItem value="date">按時間排序</SelectItem>
                    <SelectItem value="likes">按讚數排序</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 評價列表 */}
            {sortedReviews.length === 0 ? (
              <div className="text-center py-12">
                <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  暫無評價
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {selectedLecturer === 'all' ? '此課程暫時沒有評價' : '此講師暫時沒有評價'}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {sortedReviews.map((review) => {
                  const lecturer = courseData.lecturers.find(l => l.$id === review.lecturerId);
                  return (
                                         <ReviewCard
                       key={review.$id}
                       reviewId={review.$id}
                       courseCode={courseData.code}
                       courseName={courseData.title}
                       rating={review.overallRating}
                       difficulty={review.difficulty}
                       content={review.content}
                       pros={review.pros || []}
                       cons={review.cons || []}
                       semester={review.semester}
                       likes={review.likes}
                       dislikes={review.dislikes}
                       replies={0} // 暫時設為0，後續可以添加回覆功能
                       createdAt={review.createdAt}
                       showAnonymousAvatar={true}
                     />
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CourseDetail; 