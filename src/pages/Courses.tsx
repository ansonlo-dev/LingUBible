import { useState, useEffect } from 'react';
import { CourseCard } from "@/components/features/reviews/CourseCard";
import { useLanguage } from '@/contexts/LanguageContext';
import { BookOpen, Filter, Search, SortAsc } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Courses = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [filterDepartment, setFilterDepartment] = useState('all');

  // Mock data - 擴展的課程列表
  const allCourses = [
    {
      title: t('course.introCS'),
      code: "CS101",
      lecturer: "Dr. Sarah Johnson",
      rating: 4.5,
      reviewCount: 24,
      studentCount: 156,
      department: t('department.computerScience'),
      difficulty: t('difficulty.medium')
    },
    {
      title: t('course.advancedMath'),
      code: "MATH301",
      lecturer: "Prof. Michael Chen",
      rating: 4.2,
      reviewCount: 18,
      studentCount: 89,
      department: t('department.mathematics'),
      difficulty: t('difficulty.hard')
    },
    {
      title: t('course.englishLit'),
      code: "ENG201",
      lecturer: "Dr. Emily Davis",
      rating: 4.8,
      reviewCount: 32,
      studentCount: 203,
      department: t('department.english'),
      difficulty: t('difficulty.easy')
    },
    {
      title: "Data Structures",
      code: "CS201",
      lecturer: "Prof. Alex Wong",
      rating: 4.3,
      reviewCount: 28,
      studentCount: 142,
      department: t('department.computerScience'),
      difficulty: t('difficulty.medium')
    },
    {
      title: "Calculus II",
      code: "MATH201",
      lecturer: "Dr. Lisa Zhang",
      rating: 4.0,
      reviewCount: 35,
      studentCount: 178,
      department: t('department.mathematics'),
      difficulty: t('difficulty.hard')
    },
    {
      title: "Creative Writing",
      code: "ENG301",
      lecturer: "Prof. James Miller",
      rating: 4.6,
      reviewCount: 22,
      studentCount: 95,
      department: t('department.english'),
      difficulty: t('difficulty.easy')
    },
    {
      title: "Database Systems",
      code: "CS301",
      lecturer: "Dr. Maria Garcia",
      rating: 4.4,
      reviewCount: 31,
      studentCount: 167,
      department: t('department.computerScience'),
      difficulty: t('difficulty.medium')
    },
    {
      title: "Statistics",
      code: "MATH401",
      lecturer: "Prof. David Kim",
      rating: 4.1,
      reviewCount: 26,
      studentCount: 134,
      department: t('department.mathematics'),
      difficulty: t('difficulty.medium')
    },
    {
      title: "Modern Poetry",
      code: "ENG401",
      lecturer: "Dr. Sophie Brown",
      rating: 4.7,
      reviewCount: 19,
      studentCount: 87,
      department: t('department.english'),
      difficulty: t('difficulty.easy')
    }
  ];

  // 過濾和排序課程
  const filteredAndSortedCourses = allCourses
    .filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.lecturer.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment = filterDepartment === 'all' || course.department === filterDepartment;
      return matchesSearch && matchesDepartment;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'reviews':
          return b.reviewCount - a.reviewCount;
        case 'students':
          return b.studentCount - a.studentCount;
        case 'code':
          return a.code.localeCompare(b.code);
        default:
          return 0;
      }
    });

  const departments = [
    { value: 'all', label: t('filter.allDepartments') },
    { value: t('department.computerScience'), label: t('department.computerScience') },
    { value: t('department.mathematics'), label: t('department.mathematics') },
    { value: t('department.english'), label: t('department.english') }
  ];

  const sortOptions = [
    { value: 'rating', label: t('sort.byRating') },
    { value: 'reviews', label: t('sort.byReviews') },
    { value: 'students', label: t('sort.byStudents') },
    { value: 'code', label: t('sort.byCourseCode') }
  ];

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* 頁面標題 */}
      <div className="text-center py-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <BookOpen className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">{t('pages.courses.title')}</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {t('pages.courses.subtitle')}
        </p>
      </div>

      {/* 搜索和過濾器 */}
      <div className="bg-card rounded-lg p-6 shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('search.coursesPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* 部門過濾器 */}
          <Select value={filterDepartment} onValueChange={setFilterDepartment}>
            <SelectTrigger>
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder={t('filter.selectDepartment')} />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept.value} value={dept.value}>
                  {dept.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 排序選項 */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SortAsc className="h-4 w-4 mr-2" />
              <SelectValue placeholder={t('sort.selectSort')} />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 結果統計 */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          {t('pages.courses.showingResults', { 
            count: filteredAndSortedCourses.length,
            total: allCourses.length 
          })}
        </p>
      </div>

      {/* 課程列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedCourses.map((course, index) => (
          <div key={course.code} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
            <CourseCard {...course} />
          </div>
        ))}
      </div>

      {/* 無結果提示 */}
      {filteredAndSortedCourses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">{t('pages.courses.noResults')}</h3>
          <p className="text-muted-foreground mb-4">{t('pages.courses.noResultsDesc')}</p>
          <Button 
            variant="outline" 
            onClick={() => {
              setSearchTerm('');
              setFilterDepartment('all');
              setSortBy('rating');
            }}
          >
            {t('pages.courses.clearFilters')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default Courses; 