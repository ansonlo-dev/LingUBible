import { useLanguage } from '@/hooks/useLanguage';
import { useState, useEffect } from 'react';
import { getCurrentTermCode, getTermDisplayName, isCurrentTerm } from '@/utils/dateUtils';
import { CourseService, type Term } from '@/services/api/courseService';
import { translateDepartmentName } from '@/utils/textUtils';
import {
  Filter,
  Search,
  X,
  Sparkles,
  Calendar,
  Hash,
  BookText,
  Building2,
  Library,
  Brain,
  Target,
  Clock,
  Users,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  MessageSquare,
  Grid3X3,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  GraduationCap,
  Star,
  Award,
  School,
  CheckCircle,
  Briefcase,
  FlaskConical,
  Languages,
  Calculator,
  Palette,
  Heart,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MultiSelectDropdown, SelectOption } from '@/components/ui/multi-select-dropdown';

export interface InstructorFilters {
  searchTerm: string;
  department: string[];
  teachingTerm: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  itemsPerPage: number;
  currentPage: number;
}

interface AdvancedInstructorFiltersProps {
  filters: InstructorFilters;
  onFiltersChange: (filters: InstructorFilters) => void;
  availableDepartments: string[];
  onClearAll: () => void;
  totalInstructors?: number;
  filteredInstructors?: number;
  currentPageStart?: number;
  currentPageEnd?: number;
  instructors?: any[]; // Add instructors data for count calculation
}

export function AdvancedInstructorFilters({
  filters,
  onFiltersChange,
  availableDepartments,
  onClearAll,
  totalInstructors = 0,
  filteredInstructors = 0,
  currentPageStart,
  currentPageEnd,
  instructors = []
}: AdvancedInstructorFiltersProps) {
  const { t, language } = useLanguage();
  const [availableTerms, setAvailableTerms] = useState<Term[]>([]);
  const [termsLoading, setTermsLoading] = useState(true);
  const [termInstructorsMap, setTermInstructorsMap] = useState<Map<string, Set<string>>>(new Map());

  // Load available terms
  useEffect(() => {
    const loadAvailableTerms = async () => {
      try {
        setTermsLoading(true);
        
        // 🚀 優化：使用預加載的教學記錄數據
        console.log('🚀 Loading instructor terms with preloaded teaching records...');
        
        // 並行加載學期和教學記錄數據
        const [terms, termInstructorsMap] = await Promise.all([
          CourseService.getAllTerms(),
          CourseService.getAllTermsInstructorsTeachingBatch()
        ]);
        
        setAvailableTerms(terms);
        setTermInstructorsMap(termInstructorsMap);
        
        console.log('✅ Instructor terms and teaching data loaded successfully');
      } catch (error) {
        console.error('Error loading instructor terms:', error);
      } finally {
        setTermsLoading(false);
      }
    };

    loadAvailableTerms();
  }, []);

  const updateFilters = (updates: Partial<InstructorFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const hasActiveFilters = () => {
    return (
      filters.searchTerm.trim() !== '' ||
      filters.department.length > 0 ||
      filters.teachingTerm.length > 0
    );
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.searchTerm.trim()) count++;
    if (filters.department.length > 0) count++;
    if (filters.teachingTerm.length > 0) count++;
    return count;
  };

  const getSortIcon = (field: string) => {
    if (filters.sortBy !== field) return <ArrowUpDown className="h-4 w-4" />;
    return filters.sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const getSortButtonVariant = (field: string) => {
    return filters.sortBy === field ? 'default' : 'ghost';
  };

  const handleSort = (field: string) => {
    if (filters.sortBy === field) {
      updateFilters({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' });
    } else {
      updateFilters({ sortBy: field, sortOrder: 'asc' });
    }
  };

  // Faculty/School grouping configuration
  // Helper function to translate faculty names
  const getFacultyTranslationKey = (faculty: string): string => {
    const facultyKeyMapping: { [key: string]: string } = {
      'Faculty of Arts': 'faculty.arts',
      'Faculty of Business': 'faculty.business',
      'Faculty of Social Sciences': 'faculty.socialSciences',
      'School of Interdisciplinary Studies': 'faculty.interdisciplinaryStudies',
      'School of Data Science': 'faculty.dataScience',
      'Other': 'common.other'
    };
    return facultyKeyMapping[faculty] || faculty;
  };

  const getFacultyGrouping = () => {
    return {
      'Faculty of Arts': {
        icon: Palette,
        departments: [
          'Chinese',
          'Cultural Studies',
          'Digital Arts and Creative Industries',
          'English',
          'History',
          'Philosophy',
          'Translation',
          'Centre for English and Additional Languages',
          'Chinese Language Education and Assessment Centre'
        ]
      },
      'Faculty of Business': {
        icon: Briefcase,
        departments: [
          'Accountancy',
          'Finance',
          'Management',
          'Marketing and International Business',
          'Operations and Risk Management'
        ]
      },
      'Faculty of Social Sciences': {
        icon: Users,
        departments: [
          'Psychology',
          'Economics',
          'Government and International Affairs',
          'Sociology and Social Policy'
        ]
      },
      'School of Interdisciplinary Studies': {
        icon: GraduationCap,
        departments: [
          'Office of the Core Curriculum',
          'Science Unit',
          'Wong Bing Lai Music and Performing Arts Unit'
        ]
      },
      'School of Data Science': {
        icon: Calculator,
        departments: [
          'LEO Dr David P. Chan Institute of Data Science'
        ]
      },
      'Other': {
        icon: School,
        departments: []
      }
    };
  };

  // Calculate counts for each filter option
  const getDepartmentCounts = () => {
    const counts: { [key: string]: number } = {};
    instructors.forEach(instructor => {
      if (instructor.department) {
        counts[instructor.department] = (counts[instructor.department] || 0) + 1;
      }
    });
    return counts;
  };

  // Group departments by faculty
  const getGroupedDepartments = () => {
    const facultyGrouping = getFacultyGrouping();
    const departmentCounts = getDepartmentCounts();
    const grouped: { [key: string]: { icon: any; departments: string[]; count: number } } = {};
    
    // Initialize grouped structure
    Object.entries(facultyGrouping).forEach(([faculty, config]) => {
      grouped[faculty] = {
        icon: config.icon,
        departments: [],
        count: 0
      };
    });

    // Group available departments
    availableDepartments.forEach(department => {
      let assigned = false;
      
      // Find which faculty this department belongs to
      Object.entries(facultyGrouping).forEach(([faculty, config]) => {
        if (config.departments.includes(department)) {
          grouped[faculty].departments.push(department);
          grouped[faculty].count += departmentCounts[department] || 0;
          assigned = true;
        }
      });
      
      // If not assigned to any faculty, put in "Other"
      if (!assigned) {
        grouped['Other'].departments.push(department);
        grouped['Other'].count += departmentCounts[department] || 0;
      }
    });

    // Remove empty faculties
    Object.keys(grouped).forEach(faculty => {
      if (grouped[faculty].departments.length === 0) {
        delete grouped[faculty];
      }
    });

    return grouped;
  };

  const getTermCounts = () => {
    const counts: { [key: string]: number } = {};
    
    availableTerms.forEach(term => {
      // Get the actual instructors teaching in this term
      const instructorsTeachingInTerm = termInstructorsMap.get(term.term_code) || new Set();
      
      // Count how many of the current filtered instructors are teaching in this term
      let count = 0;
      instructors.forEach(instructor => {
        if (instructorsTeachingInTerm.has(instructor.name)) {
          count++;
        }
      });
      
      counts[term.term_code] = count;
    });
    
    return counts;
  };

  // Helper function to determine if labels should be bold based on language
  const getLabelClassName = () => {
    return language === 'zh-TW' || language === 'zh-CN' 
      ? 'text-base font-bold text-muted-foreground flex items-center gap-2 shrink-0'
      : 'text-base font-medium text-muted-foreground flex items-center gap-2 shrink-0';
  };

  return (
    <div className="bg-gradient-to-r from-card to-card/50 rounded-xl p-6 flex flex-col gap-3">
      {/* 智能搜索行 */}
      <div className="flex items-center gap-4">
        <label className={getLabelClassName()}>
          <Sparkles className="h-4 w-4" />
          {t('search.smartSearch')}
        </label>
        <div className="relative group flex-1">
          <Input
            type="text"
            placeholder={t('search.instructorPlaceholder')}
            value={filters.searchTerm || ''}
            onChange={(e) => updateFilters({ searchTerm: e.target.value })}
            className="pr-12 h-8 text-sm placeholder:text-muted-foreground bg-background/80 hover:border-primary/30 focus:border-primary focus:ring-2 focus:ring-muted rounded-md transition-all duration-300"
          />
          {filters.searchTerm && (
            <button
              onClick={() => updateFilters({ searchTerm: '' })}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* 篩選器行 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 部門 */}
        <div className="flex items-center gap-3">
          <label className={getLabelClassName()}>
            <Building2 className="h-4 w-4" />
            {t('filter.department')}
          </label>
          <MultiSelectDropdown
            options={(() => {
              const groupedDepartments = getGroupedDepartments();
              const options: SelectOption[] = [];
              
              Object.entries(groupedDepartments).forEach(([faculty, data]) => {
                // Add faculty group header
                options.push({
                  value: `__faculty_${faculty}`,
                  label: t(getFacultyTranslationKey(faculty)),
                  count: data.count,
                  disabled: true
                });
                
                // Add departments under this faculty
                data.departments.forEach(department => {
                  options.push({
                    value: department,
                    label: `  ${translateDepartmentName(department, t)}`,
                    count: getDepartmentCounts()[department] || 0
                  });
                });
              });
              
              return options;
            })()}
            selectedValues={filters.department}
            onSelectionChange={(values) => updateFilters({ department: values })}
            placeholder={t('filter.allDepartments')}
            totalCount={totalInstructors}
            className="flex-1"
          />
        </div>

        {/* 授課學期 */}
        <div className="flex items-center gap-3">
          <label className={getLabelClassName()}>
            <Calendar className="h-4 w-4" />
            {t('filter.teachingTerm')}
          </label>
          <MultiSelectDropdown
            options={availableTerms.map(term => ({
              value: term.term_code,
              label: getTermDisplayName(term.term_code),
              count: getTermCounts()[term.term_code] || 0,
              status: isCurrentTerm(term.term_code) ? 'current' : 
                     new Date(term.end_date) < new Date() ? 'past' : 'future'
            }))}
            selectedValues={filters.teachingTerm}
            onSelectionChange={(values) => updateFilters({ teachingTerm: values })}
            placeholder={t('filter.allTerms')}
            totalCount={totalInstructors}
            className="flex-1"
          />
        </div>
      </div>

      {/* 排序行 */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <label className={getLabelClassName()}>
          <Hash className="h-4 w-4" />
          {t('sort.sortBy')}
        </label>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={getSortButtonVariant('name')}
            size="sm"
            onClick={() => handleSort('name')}
            className="flex items-center gap-2 h-9 px-3 text-sm rounded-lg transition-all duration-200"
          >
            <GraduationCap className="h-4 w-4" />
            {t('sort.instructorName')}
            {getSortIcon('name')}
          </Button>

          <Button
            variant={getSortButtonVariant('department')}
            size="sm"
            onClick={() => handleSort('department')}
            className="flex items-center gap-2 h-9 px-3 text-sm rounded-lg transition-all duration-200"
          >
            <Building2 className="h-4 w-4" />
            {t('sort.department')}
            {getSortIcon('department')}
          </Button>

          <Button
            variant={getSortButtonVariant('teaching')}
            size="sm"
            onClick={() => handleSort('teaching')}
            className="flex items-center gap-2 h-9 px-3 text-sm rounded-lg transition-all duration-200"
          >
            <School className="h-4 w-4" />
            {t('sort.teaching')}
            {getSortIcon('teaching')}
          </Button>

          <Button
            variant={getSortButtonVariant('grading')}
            size="sm"
            onClick={() => handleSort('grading')}
            className="flex items-center gap-2 h-9 px-3 text-sm rounded-lg transition-all duration-200"
          >
            <CheckCircle className="h-4 w-4" />
            {t('sort.grading')}
            {getSortIcon('grading')}
          </Button>

          <Button
            variant={getSortButtonVariant('reviews')}
            size="sm"
            onClick={() => handleSort('reviews')}
            className="flex items-center gap-2 h-9 px-3 text-sm rounded-lg transition-all duration-200"
          >
            <MessageSquare className="h-4 w-4" />
            {t('sort.reviews')}
            {getSortIcon('reviews')}
          </Button>

          <Button
            variant={getSortButtonVariant('averageGPA')}
            size="sm"
            onClick={() => handleSort('averageGPA')}
            className="flex items-center gap-2 h-9 px-3 text-sm rounded-lg transition-all duration-200"
          >
            <Award className="h-4 w-4" />
            {t('sort.averageGPA')}
            {getSortIcon('averageGPA')}
          </Button>
        </div>
      </div>

      {/* 每頁項目數和清除篩選器 */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className={getLabelClassName()}>
            <Grid3X3 className="h-4 w-4" />
            {t('pagination.instructorsPerPage')}
          </label>
          <div className="flex gap-2">
            {[6, 12, 24].map(count => (
              <Button
                key={count}
                variant={filters.itemsPerPage === count ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateFilters({ itemsPerPage: count })}
                className="h-9 px-3 text-sm rounded-lg transition-all duration-200"
              >
                {count}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* 統計信息 */}
          <div className="text-sm text-muted-foreground">
            {filteredInstructors !== totalInstructors ? (
              filteredInstructors > 0 && currentPageStart && currentPageEnd ? (
                <span>
                  {t('pagination.showingItems', {
                    start: currentPageStart,
                    end: currentPageEnd,
                    total: filteredInstructors
                  })} {t('pagination.filtered')}
                </span>
              ) : filteredInstructors === 0 ? (
                <span>
                  {t('pagination.noResults')}
                </span>
              ) : (
                <span>
                  {t('pagination.showingFiltered', {
                    filtered: filteredInstructors,
                    total: totalInstructors
                  })}
                </span>
              )
            ) : (
              <span>
                {t('pagination.totalInstructors', { total: totalInstructors })}
              </span>
            )}
          </div>

          {/* 清除篩選器按鈕 */}
          {hasActiveFilters() && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearAll}
              className="flex items-center gap-2 h-9 px-3 text-sm rounded-lg transition-all duration-200 hover:bg-destructive hover:text-destructive-foreground"
            >
              <X className="h-4 w-4" />
              {t('filter.clearAll')}
              <Badge variant="destructive" className="ml-1 text-xs">
                {getActiveFiltersCount()}
              </Badge>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 