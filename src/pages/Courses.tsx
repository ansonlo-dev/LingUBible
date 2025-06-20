import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { CourseCard } from '@/components/features/reviews/CourseCard';
import { CourseCardSkeleton } from '@/components/features/reviews/CourseCardSkeleton';
import { useDebounce } from '@/hooks/useDebounce';
import { useCoursesWithStats } from '@/hooks/useCoursesWithStats';
import { Input } from '@/components/ui/input';
import { Search, BookOpen, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const Courses = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  
  // 使用防抖來優化搜尋性能
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  // 使用優化的 hook 來管理課程數據
  const { 
    courses, 
    filteredCourses, 
    loading, 
    statsLoading, 
    error 
  } = useCoursesWithStats({ 
    enableProgressiveLoading: true, 
    searchTerm: debouncedSearchTerm 
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // 頂部區域組件，確保翻譯正確載入
  const HeaderSection = () => (
    <div className="text-center space-y-4">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
        {t('pages.courses.title')}
      </h1>
      <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
        {t('pages.courses.subtitle')}
      </p>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-8 space-y-8">
          {/* 頁面標題 - 使用正確的翻譯鍵值 */}
          <HeaderSection />

          {/* 搜尋區域骨架 */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('search.placeholder')}
                disabled
                className="pl-10 h-12 text-base bg-white dark:bg-card border-gray-300 dark:border-gray-600"
              />
            </div>
          </div>

          {/* 載入指示器 */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('common.loading')}
            </div>
          </div>

          {/* 課程卡片骨架 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {Array.from({ length: 8 }).map((_, index) => (
              <CourseCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-8 space-y-8">
          {/* 頁面標題 */}
          <HeaderSection />

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
        <HeaderSection />

        {/* 搜尋區域 */}
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('search.placeholder')}
              value={searchTerm || ''}
              onChange={handleSearchChange}
              className="pl-10 h-12 text-base bg-white dark:bg-card border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        {/* 載入狀態指示器 */}
        {statsLoading && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('common.loadingStats')}
            </div>
          </div>
        )}

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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.$id}
                title={course.course_title}
                code={course.course_code}
                department={course.course_department}
                language={course.course_language}
                rating={course.averageRating}
                reviewCount={course.reviewCount}
                isOfferedInCurrentTerm={course.isOfferedInCurrentTerm}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses; 