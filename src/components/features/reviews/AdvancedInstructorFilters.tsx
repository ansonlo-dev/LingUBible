import { useLanguage } from '@/hooks/useLanguage';
import { useState, useEffect, useMemo } from 'react';
import { getCurrentTermCode, getTermDisplayName, isCurrentTerm } from '@/utils/dateUtils';
import { CourseService, type Term } from '@/services/api/courseService';
import { translateDepartmentName, processPluralTranslation, getTeachingLanguageName } from '@/utils/textUtils';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Filter,
  Search,
  X,
  Sparkles,
  Calendar,
  Hash,
  BookOpen,
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
  Globe,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Grid3X3,
  BookText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MultiSelectDropdown, SelectOption } from '@/components/ui/multi-select-dropdown';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export interface InstructorFilters {
  searchTerm: string;
  department: string[];
  teachingTerm: string[];
  teachingLanguage: string[];
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
  const isMobile = useIsMobile(); // Add mobile detection
  const [isSortOpen, setIsSortOpen] = useState(false); // Add mobile sort collapsible state
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

  // Teaching language mapping function
  const mapLanguageCode = (langCode: string, t: any): string => {
    const translationKeys: { [key: string]: string } = {
      'E': 'teachingLanguage.english',
      'C': 'teachingLanguage.cantonese', 
      'P': 'teachingLanguage.putonghua',
      '1': 'teachingLanguage.englishCantonese',
      '2': 'teachingLanguage.englishPutonghua', 
      '3': 'teachingLanguage.cantonesePutonghua',
      '4': 'teachingLanguage.englishCantonesePutonghua',
      '5': 'teachingLanguage.others'
    };
    return translationKeys[langCode] ? t(translationKeys[langCode]) : langCode;
  };

  const hasActiveFilters = () => {
    return (
      filters.searchTerm.trim() !== '' ||
      filters.department.length > 0 ||
      filters.teachingTerm.length > 0 ||
      filters.teachingLanguage.length > 0
    );
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.searchTerm.trim()) count++;
    if (filters.department.length > 0) count++;
    if (filters.teachingTerm.length > 0) count++;
    if (filters.teachingLanguage.length > 0) count++;
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
      // mark update
      'Affiliated Units': 'faculty.affiliatedUnits',
      'Faculty of Arts': 'faculty.arts',
      'Faculty of Business': 'faculty.business',
      'Faculty of Social Sciences': 'faculty.socialSciences',
      'School of Data Science': 'faculty.dataScience',
      'School of Graduate Studies': 'faculty.graduateStudies',
      'School of Interdisciplinary Studies': 'faculty.interdisciplinaryStudies',
      'Research Institutes, Centres and Programmes': 'faculty.researchInstitutes',
      'Units and Offices': 'faculty.unitsOffices',
      'Other': 'common.other'
    };
    return facultyKeyMapping[faculty] || faculty;
  };

  const getFacultyGrouping = () => {
    return {
      // mark update
      'Affiliated Units': {
        icon: School,
        departments: [
          'LIFE'
        ]
      },
      'Faculty of Arts': {
        icon: Palette,
        departments: [
          'AIGCS',
          'CEAL',
          'CFCI',
          'CLEAC',
          'CHI',
          'CS',
          'DACI',
          'ENG',
          'HIST',
          'PHILO',
          'TRAN'
        ]
      },
      'Faculty of Business': {
        icon: Briefcase,
        departments: [
          'ACCT',
          'BUS',
          'FIN',
          'MGT',
          'MKT',
          'ORM',
          'HKIBS',
          'IIRM'
        ]
      },
      'Faculty of Social Sciences': {
        icon: Users,
        departments: [
          'ECON',
          'GOV',
          'PSY',
          'SOCSC',
          'SOCSP'
        ]
      },
      'School of Data Science': {
        icon: Calculator,
        departments: [
          'DAI',
          'DIDS',
          'LEODCIDS',
          'SDS'
        ]
      },
      'School of Graduate Studies': {
        icon: GraduationCap,
        departments: [
          'GS'
        ]
      },
      'School of Interdisciplinary Studies': {
        icon: GraduationCap,
        departments: [
          'SIS',
          'SU',
          'WBLMP'
        ]
      },
      'Research Institutes, Centres and Programmes': {
        icon: School,
        departments: [
          'APIAS',
          'IPS'
        ]
      },
      'Units and Offices': {
        icon: School,
        departments: [
          'OSL',
          'TLC'
        ]
      },
      'Other': {
        icon: School,
        departments: []
      }
    };
  };

  // Calculate counts for each filter option - memoized
  const departmentCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    instructors.forEach(instructor => {
      if (instructor.department) {
        counts[instructor.department] = (counts[instructor.department] || 0) + 1;
      }
    });

    return counts;
  }, [instructors]);

  // Group departments by faculty
  const getGroupedDepartments = () => {
    const facultyGrouping = getFacultyGrouping();
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

  const termCounts = useMemo(() => {
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
  }, [instructors, availableTerms, termInstructorsMap]);

  // Calculate language counts for instructors
  const languageCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    
    // Initialize counts for all 8 teaching language codes in the desired order
    const allLanguageCodes = ['E', 'C', 'P', '1', '2', '3', '4', '5'];
    allLanguageCodes.forEach(code => {
      counts[code] = 0;
    });
    
    // Count instructors for each teaching language code
    instructors.forEach(instructor => {
      if (instructor.teachingLanguages && instructor.teachingLanguages.length > 0) {
        instructor.teachingLanguages.forEach(langCode => {
          if (counts.hasOwnProperty(langCode)) {
            counts[langCode]++;
          }
        });
      }
    });
    
    return counts;
  }, [instructors]);

  // Helper function to get ordered language options
  const getOrderedLanguageOptions = () => {
    const orderedCodes = ['E', 'C', 'P', '1', '2', '3', '4', '5'];
    
    return orderedCodes.map(langCode => ({
      value: langCode,
      label: `${langCode} - ${mapLanguageCode(langCode, t)}`,
      count: languageCounts[langCode] || 0
    }));
  };

  // Helper function to determine if labels should be bold based on language
  const getLabelClassName = () => {
    return language === 'zh-TW' || language === 'zh-CN' 
      ? 'text-sm font-bold text-muted-foreground flex items-center gap-2 shrink-0 w-24 lg:w-auto'
      : 'text-sm font-medium text-muted-foreground flex items-center gap-2 shrink-0 w-24 lg:w-auto';
  };

  // Helper function to get sort field display name
  const getSortFieldDisplayName = (sortBy: string): string => {
    const sortKeyMap: { [key: string]: string } = {
      'name': 'sort.instructorName',
      'department': 'sort.department',
      'teaching': 'sort.teaching',
      'grading': 'sort.grading',
      'reviews': 'sort.reviews',
      'averageGPA': 'sort.averageGPA'
    };
    return t(sortKeyMap[sortBy] || sortBy);
  };

  const sortOptions = [
    { value: 'name', label: t('sort.instructorName') },
    { value: 'department', label: t('sort.department') },
    { value: 'teaching', label: t('sort.teaching') },
    { value: 'grading', label: t('sort.grading') },
    { value: 'reviews', label: t('sort.reviews') },
    { value: 'averageGPA', label: t('sort.averageGPA') }
  ];

  const getSortButtonText = (field: string) => {
    const option = sortOptions.find(opt => opt.value === field);
    if (!option) return field;
    return option.label;
  };

  const handleSortChange = (field: string) => {
    if (filters.sortBy === field) {
      updateFilters({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' });
    } else {
      updateFilters({ sortBy: field, sortOrder: 'asc' });
    }
  };

  const onPageSizeChange = (size: number) => {
    updateFilters({ itemsPerPage: size });
  };

  return (
    <div className="bg-gradient-to-r from-card to-card/50 rounded-xl p-4 max-sm:py-0 flex flex-col gap-2">
      {/* 智能搜索行 */}
      <div className="flex items-center gap-2">
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
            className="pr-10 h-8 text-sm placeholder:text-muted-foreground bg-background/80 hover:border-primary/30 focus:border-primary focus:ring-2 focus:ring-muted rounded-md transition-all duration-300"
          />
          {filters.searchTerm && (
            <button
              onClick={() => updateFilters({ searchTerm: '' })}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        
      </div>

      {/* 篩選器行 */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-2">
        {/* 部門 */}
        <div className="flex items-center gap-2 lg:flex-1">
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
                    count: departmentCounts[department] || 0
                  });
                });
              });
              
              return options;
            })()}
            selectedValues={filters.department}
            onSelectionChange={(values) => updateFilters({ department: values })}
            placeholder={t('filter.allDepartments')}
            totalCount={totalInstructors}
            className="flex-1 h-10 text-sm"
          />
        </div>

        {/* 授課學期 */}
        <div className="flex items-center gap-2 lg:flex-1">
          <label className={getLabelClassName()}>
            <Calendar className="h-4 w-4" />
            {t('filter.teachingTerm')}
          </label>
          <MultiSelectDropdown
            options={availableTerms.map(term => ({
              value: term.term_code,
              label: getTermDisplayName(term.term_code),
              count: termCounts[term.term_code] || 0,
              status: isCurrentTerm(term.term_code) ? 'current' : 
                     new Date(term.end_date) < new Date() ? 'past' : 'future'
            }))}
            selectedValues={filters.teachingTerm}
            onSelectionChange={(values) => updateFilters({ teachingTerm: values })}
            placeholder={t('filter.allTerms')}
            totalCount={totalInstructors}
            className="flex-1 h-10 text-sm"
          />
        </div>

        {/* 授課語言 */}
        <div className="flex items-center gap-2 lg:flex-1">
          <label className={getLabelClassName()}>
            <Globe className="h-4 w-4" />
            {t('filter.teachingLanguage')}
          </label>
          <MultiSelectDropdown
            options={getOrderedLanguageOptions()}
            selectedValues={filters.teachingLanguage}
            onSelectionChange={(values) => updateFilters({ teachingLanguage: values })}
            placeholder={t('filter.allLanguages')}
            totalCount={totalInstructors}
            className="flex-1 h-10 text-sm"
          />
        </div>
      </div>

      {/* 排序行 - Mobile-aware version */}
      {isMobile ? (
        /* Mobile: Collapsible sort section */
        <Collapsible open={isSortOpen} onOpenChange={setIsSortOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center justify-between w-full h-10 rounded-lg transition-all duration-200 border-0 px-0"
            >
              <div className="flex items-center gap-2 w-full">
                <Hash className="h-4 w-4" />
                <span className={`${language === 'zh-TW' || language === 'zh-CN' ? 'text-sm font-bold' : 'text-sm font-medium'} text-muted-foreground`}>
                  {t('sort.sortBy')}
                </span>
                <div className="flex-1 flex items-center" style={{ marginLeft: 'calc(96px - 24px - 0.5rem - 4ch)' }}>
                  <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                    {getSortButtonText(filters.sortBy)} {filters.sortOrder === 'desc' ? '↓' : '↑'}
                  </Badge>
                </div>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isSortOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="grid grid-cols-2 gap-2 pt-2 w-full max-w-md mx-auto">
              {sortOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={filters.sortBy === option.value ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleSortChange(option.value)}
                  className="h-6 px-3 text-xs w-full"
                >
                  {option.label}
                  {getSortIcon(option.value)}
                </Button>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      ) : (
        /* Desktop: Always visible sort buttons in rows */
        <div className="flex items-center gap-2">
          <label className={getLabelClassName()}>
            <Hash className="h-4 w-4" />
            {t('sort.sortBy')}
          </label>
          <div className="flex flex-wrap gap-2 flex-1">
            {sortOptions.map((option) => (
              <Button
                key={option.value}
                variant={filters.sortBy === option.value ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleSortChange(option.value)}
                className="h-6 px-3 text-xs"
              >
                {option.label}
                {getSortIcon(option.value)}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* 分頁行 */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <label className={getLabelClassName()}>
            <Grid3X3 className="h-4 w-4" />
            {t('pagination.instructorsPerPage')}
          </label>
          <div className="flex gap-2">
            {[6, 12, 24].map((size) => (
              <Button
                key={size}
                variant={filters.itemsPerPage === size ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageSizeChange(size)}
                className="h-6 px-3 text-xs border-0"
              >
                {size}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {filteredInstructors !== undefined && (
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {processPluralTranslation(t('pagination.foundInstructors', { count: filteredInstructors }), filteredInstructors)}
            </span>
          )}
          {hasActiveFilters() && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearAll}
              className="h-6 px-3 text-xs bg-white dark:bg-transparent hover:bg-red-500 dark:hover:bg-red-500 border-black dark:border-white hover:border-red-500 dark:hover:border-red-500 text-black dark:text-white hover:text-white transition-all duration-200 whitespace-nowrap flex items-center gap-2"
            >
              <X className="h-3 w-3" />
              <span>{t('filter.clearAll')}</span>
              <span className="bg-red-500 hover:bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium transition-colors duration-200">
                {getActiveFiltersCount()}
              </span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 