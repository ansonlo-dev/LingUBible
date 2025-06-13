import { useState, useEffect } from 'react';
import { LecturerCard } from "@/components/features/reviews/LecturerCard";
import { useLanguage } from '@/contexts/LanguageContext';
import { Users, Search, Building2, SortAsc, Star, MessageCircle, BookOpen, User, Filter, Sparkles, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CourseService } from '@/services/api/courseService';
import { DEPARTMENTS, DEPARTMENT_KEYS, getDepartmentName } from '@/utils/constants/subjectAreas';
import type { LecturerWithStats } from '@/types/course';

const Lecturers = () => {
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [lecturers, setLecturers] = useState<LecturerWithStats[]>([]);
  const [filteredLecturers, setFilteredLecturers] = useState<LecturerWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  // 載入講師數據
  useEffect(() => {
    const loadLecturers = async () => {
      try {
        setLoading(true);
        const lecturerData = await CourseService.getAllLecturers();
        setLecturers(lecturerData);
        setFilteredLecturers(lecturerData);
      } catch (error) {
        console.error('Error loading lecturers:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLecturers();
  }, []);

  // 搜索功能
  useEffect(() => {
    const performSearch = async () => {
      let filtered = [...lecturers];

      // 按部門過濾
      if (filterDepartment !== 'all') {
        filtered = filtered.filter(lecturer => lecturer.department === filterDepartment);
      }

      // 按搜索詞過濾
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(lecturer => {
          const departmentName = getDepartmentName(lecturer.department, language as 'en' | 'zh-TW' | 'zh-CN');
          return (
            lecturer.name.toLowerCase().includes(searchLower) ||
            lecturer.department.toLowerCase().includes(searchLower) ||
            departmentName.toLowerCase().includes(searchLower) ||
            (lecturer.specialties && lecturer.specialties.some(specialty => 
              specialty.toLowerCase().includes(searchLower)
            ))
          );
        });
      }

      setFilteredLecturers(filtered);
    };

    performSearch();
  }, [searchTerm, filterDepartment, lecturers, language]);

  // 排序講師
  const filteredAndSortedLecturers = [...filteredLecturers]
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'reviews':
          return b.reviewCount - a.reviewCount;
        case 'courses':
          return b.courseCount - a.courseCount;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  const departments = [
    { value: 'all', label: t('filter.allDepartments') },
    ...DEPARTMENT_KEYS.map(dept => ({
      value: dept,
      label: getDepartmentName(dept, language as 'en' | 'zh-TW' | 'zh-CN')
    }))
  ];

  const sortOptions = [
    { value: 'rating', label: t('sort.byRating') },
    { value: 'reviews', label: t('sort.byReviews') },
    { value: 'courses', label: t('course.courses') },
    { value: 'name', label: t('sort.byName') }
  ];



  return (
    <div className="container mx-auto px-4 py-6 space-y-4">
      {/* 頁面標題 */}
      <div className="text-center py-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Users className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">{t('pages.lecturers.title')}</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {t('pages.lecturers.subtitle')}
        </p>
      </div>

      {/* 搜索和過濾器 */}
      <div className="bg-gradient-to-r from-card to-card/50 rounded-xl p-6">
        {/* 搜索和篩選控制項 */}
        <div className="space-y-4">
          {/* 搜索框、篩選器和排序器 - 桌面版同一行 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* 搜索框 */}
            <div className="space-y-2">
              <label className="text-base font-medium text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                {t('search.smartSearch')}
              </label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-muted/20 via-muted/10 to-muted/20 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary/70 group-hover:text-primary transition-colors duration-200" />
                  <Input
                    placeholder={t('search.lecturersPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 pr-12 h-[48px] text-base bg-background/80 hover:border-primary/30 focus:border-primary focus:ring-2 focus:ring-muted rounded-lg transition-all duration-300 shadow-sm hover:shadow-md focus:shadow-lg"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            {/* 部門過濾器 */}
            <div className="space-y-2">
              <label className="text-base font-medium text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {t('filter.department')}
              </label>
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger className="bg-background hover:border-primary/30 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 shadow-sm hover:shadow-md h-[48px] rounded-lg">
                  <SelectValue placeholder={t('filter.selectDepartment')} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-black border shadow-xl backdrop-blur-none">
                  {departments.map((dept) => (
                    <SelectItem key={dept.value} value={dept.value}>
                      <span className="flex items-center gap-2">
                        {dept.value === 'all' ? (
                          <Building2 className="h-4 w-4 text-primary" />
                        ) : (
                          <Building2 className="h-4 w-4 text-primary/70" />
                        )}
                        {dept.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 排序選項 */}
            <div className="space-y-2">
              <label className="text-base font-medium text-muted-foreground flex items-center gap-2">
                <SortAsc className="h-4 w-4" />
                {t('sort.by')}
              </label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-background hover:border-primary/30 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 shadow-sm hover:shadow-md h-[48px] rounded-lg">
                  <SelectValue placeholder={t('sort.selectSort')} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-black border shadow-xl backdrop-blur-none">
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className="flex items-center gap-2">
                        {option.value === 'rating' && <Star className="h-4 w-4 text-primary/70" />}
                        {option.value === 'reviews' && <MessageCircle className="h-4 w-4 text-primary/70" />}
                        {option.value === 'courses' && <BookOpen className="h-4 w-4 text-primary/70" />}
                        {option.value === 'name' && <User className="h-4 w-4 text-primary/70" />}
                        {option.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* 結果統計 */}
      <div className="flex items-center justify-between bg-muted/30 rounded-lg px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground">
              {t('pages.lecturers.showingResults', { 
                count: filteredAndSortedLecturers.length,
                total: lecturers.length 
              })}
            </p>
          </div>
          {(searchTerm || filterDepartment !== 'all') && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>•</span>
              <span>{t('filter.applied')}</span>
            </div>
          )}
        </div>
        {(searchTerm || filterDepartment !== 'all') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterDepartment('all');
            }}
            className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
          >
            {t('filter.clear')}
          </button>
        )}
      </div>

      {/* 講師列表 */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-muted rounded-lg h-64"></div>
            </div>
          ))}
        </div>
      ) : filteredAndSortedLecturers.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">{t('pages.lecturers.noResults')}</h3>
          <p className="text-muted-foreground">
            {t('pages.lecturers.noResultsDesc')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedLecturers.map((lecturer) => (
            <LecturerCard
              key={lecturer.$id}
              lecturer={lecturer}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Lecturers;