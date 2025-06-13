import { useState, useEffect, useMemo } from 'react';
import { CourseCard } from "@/components/features/reviews/CourseCard";
import { useLanguage } from '@/contexts/LanguageContext';
import { AdvancedCourseFilters, CourseFilters } from '@/components/features/reviews/AdvancedCourseFilters';
import { BookOpen, Filter, Search, SortAsc, Hash, BookText, Tag, Building2, Library, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CourseService } from '@/services/api/courseService';
import { SUBJECT_AREAS, SUBJECT_CODES, extractSubjectCode, getSubjectAreaName } from '@/utils/constants/subjectAreas';
import type { UGCourse } from '@/types/course';
import { databases } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Courses = () => {
  const { t, language } = useLanguage();
  const [courses, setCourses] = useState<UGCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 篩選狀態
  const [filters, setFilters] = useState<CourseFilters>({
    searchTerm: '',
    subjectArea: 'all',
    sortBy: 'code',
    offered: 'all',
    quickFilters: {
      noExam: false,
      easyGrading: false,
      lightWorkload: false,
      englishTaught: false,
      hasGroupProject: false,
      noAttendance: false
    }
  });

  // 載入課程資料
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await databases.listDocuments(
          'lingubible',
          'ug_courses',
          [
            Query.equal('isActive', true),
            Query.limit(100)
          ]
        );

        setCourses(response.documents as unknown as UGCourse[]);
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError(t('error.loadingCourses'));
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // 獲取可用的學科領域
  const availableSubjects = useMemo(() => {
    const subjects = new Set<string>();
    courses.forEach(course => {
      if (course.code) {
        // 提取課程代碼的學科部分（例如：CDS1001 -> CDS）
        const match = course.code.match(/^([A-Z]+)/);
        if (match) {
          subjects.add(match[1]);
        }
      }
    });
    return Array.from(subjects).sort();
  }, [courses]);

  // 篩選和排序課程
  const filteredAndSortedCourses = useMemo(() => {
    let filtered = [...courses];

    // 搜尋篩選
    if (filters.searchTerm.trim()) {
      const searchTerm = filters.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(course => 
        course.code?.toLowerCase().includes(searchTerm) ||
        course.title?.toLowerCase().includes(searchTerm) ||
        course.department?.toLowerCase().includes(searchTerm)
      );
    }

    // 學科領域篩選
    if (filters.subjectArea !== 'all') {
      filtered = filtered.filter(course => 
        course.code?.startsWith(filters.subjectArea)
      );
    }

    // 開設狀態篩選
    if (filters.offered !== 'all') {
      filtered = filtered.filter(course => course.offered === filters.offered);
    }

    // 快速篩選（這裡是示例邏輯，實際需要根據課程資料結構調整）
    if (filters.quickFilters.englishTaught) {
      // 假設英語授課的課程代碼包含特定模式或有特定標記
      filtered = filtered.filter(course => 
        course.title?.includes('English') || 
        course.description?.includes('English')
      );
    }

    // 排序
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'code':
          return (a.code || '').localeCompare(b.code || '');
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'subject':
          const aSubject = a.code?.match(/^([A-Z]+)/)?.[1] || '';
          const bSubject = b.code?.match(/^([A-Z]+)/)?.[1] || '';
          return aSubject.localeCompare(bSubject);
        case 'department':
          return (a.department || '').localeCompare(b.department || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [courses, filters]);

  // 清除所有篩選
  const handleClearAllFilters = () => {
    setFilters({
      searchTerm: '',
      subjectArea: 'all',
      sortBy: 'code',
      offered: 'all',
      quickFilters: {
        noExam: false,
        easyGrading: false,
        lightWorkload: false,
        englishTaught: false,
        hasGroupProject: false,
        noAttendance: false
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <p className="text-lg text-muted-foreground">{t('loading.courses')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
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
            {t('pages.courses.subtitle')}
          </p>
        </div>

        {/* 進階篩選組件 */}
        <AdvancedCourseFilters
          filters={filters}
          onFiltersChange={setFilters}
          availableSubjects={availableSubjects}
          onClearAll={handleClearAllFilters}
        />

        {/* 結果統計 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <BookOpen className="h-5 w-5" />
            <span>
              {t('pages.courses.showingResults', { 
                count: filteredAndSortedCourses.length, 
                total: courses.length 
              })}
            </span>
          </div>
        </div>

        {/* 課程卡片網格 */}
        {filteredAndSortedCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedCourses.map((course) => (
              <CourseCard
                key={course.$id}
                title={course.title}
                code={course.code}
                rating={4.2} // 示例評分，實際需要從評價資料計算
                reviewCount={15} // 示例評價數，實際需要從評價資料計算
                studentCount={120} // 示例學生數，實際需要從註冊資料計算
                department={course.department}
                offered={course.offered || 'Yes'}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 space-y-4">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/50" />
            <h3 className="text-xl font-semibold text-muted-foreground">
              {t('pages.courses.noResults')}
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {t('pages.courses.noResultsDesc')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses; 