import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { CourseCard } from '@/components/features/reviews/CourseCard';
import { CourseCardSkeleton } from '@/components/features/reviews/CourseCardSkeleton';
import { CourseService } from '@/services/api/courseService';
import { CourseWithStats } from '@/services/api/courseService';
import { useDebounce } from '@/hooks/useDebounce';
import { Input } from '@/components/ui/input';
import { Search, BookOpen, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const Courses = () => {
  const { t } = useLanguage();
  const [courses, setCourses] = useState<CourseWithStats[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<CourseWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 使用防抖來優化搜尋性能
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // 載入課程數據
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const coursesData = await CourseService.getCoursesWithStats();
        setCourses(coursesData);
        setFilteredCourses(coursesData);
        
        // 批量預載入熱門課程（延遲執行，避免阻塞主要載入）
        setTimeout(() => {
          // Preload removed - no longer using cache
        }, 2000);
      } catch (err) {
        console.error('Error loading courses:', err);
        setError('Failed to load courses');
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  // 處理搜尋
  useEffect(() => {
    if (!debouncedSearchTerm.trim()) {
      setFilteredCourses(courses);
      return;
    }

    const filtered = courses.filter(course =>
      course.course_title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      course.course_code.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      course.course_department.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
    
    setFilteredCourses(filtered);
  }, [courses, debouncedSearchTerm]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* 頁面標題 */}
        <div className="text-center py-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">{t('courses.title')}</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('courses.subtitle')}
          </p>
        </div>

        {/* 搜尋欄骨架 */}
        <Card className="course-card">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('courses.searchPlaceholder')}
                disabled
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* 課程卡片骨架 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <CourseCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {t('pages.courses.title') || '所有課程'}
            </h1>
          </div>

          <div className="flex justify-center items-center min-h-[400px]">
            <Card className="max-w-md">
              <CardContent className="p-6 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">{t('pages.courses.loadFailed')}</h3>
                <p className="text-muted-foreground">
                  {t('pages.courses.loadFailedDesc')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* 頁面標題 */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {t('pages.courses.title') || '所有課程'}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('pages.courses.subtitle') || '瀏覽所有可用的課程，查看評論和評分'}
          </p>
        </div>

        {/* 搜尋區域 */}
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('search.placeholder') || '搜尋課程名稱或代碼...'}
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 h-12 text-base bg-white dark:bg-card border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        {/* 課程統計 */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {searchTerm ? (
              t('pages.courses.foundCount', { count: filteredCourses.length })
            ) : (
              t('pages.courses.totalCount', { count: courses.length })
            )}
          </p>
        </div>

        {/* 課程列表 */}
        {filteredCourses.length === 0 ? (
          <div className="flex justify-center items-center min-h-[300px]">
            <Card className="max-w-md">
              <CardContent className="p-6 text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">{t('pages.courses.noCoursesFound')}</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? t('pages.courses.tryOtherKeywords') : t('pages.courses.noCoursesAvailable')}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.$id}
                title={course.course_title}
                code={course.course_code}
                department={course.course_department}
                language={course.course_language}
                rating={course.averageRating}
                reviewCount={course.reviewCount}
                studentCount={course.studentCount}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses; 