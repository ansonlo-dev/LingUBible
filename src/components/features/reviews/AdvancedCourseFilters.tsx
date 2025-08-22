import { useLanguage } from '@/hooks/useLanguage';
import { getCurrentTermCode, getTermDisplayName, isCurrentTerm } from '@/utils/dateUtils';
import { CourseService, Term } from '@/services/api/courseService';
import { processPluralTranslation, getCourseTeachingLanguages } from '@/utils/textUtils';
import { useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  X,
  BookOpen,
  Globe,
  Calendar,
  Hash,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronDown,
  Grid3X3,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MultiSelectDropdown, SelectOption } from '@/components/ui/multi-select-dropdown';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Helper function to get faculty by department name
const getFacultyByDepartment = (department: string): string => {
  const facultyMapping: { [key: string]: string } = {
    // mark update
    // Affiliated Units
    'LIFE': 'faculty.affiliatedUnits',
    // Faculty of Arts
    'AIGCS': 'faculty.arts',
    'CEAL': 'faculty.arts',
    'CFCI': 'faculty.arts',
    'CLEAC': 'faculty.arts',
    'CHI': 'faculty.arts',
    'CS': 'faculty.arts',
    'DACI': 'faculty.arts',
    'ENG': 'faculty.arts',
    'HIST': 'faculty.arts',
    'PHILO': 'faculty.arts',
    'TRAN': 'faculty.arts',
    // Faculty of Business
    'ACCT': 'faculty.business',
    'BUS': 'faculty.business',
    'FIN': 'faculty.business',
    'MGT': 'faculty.business',
    'MKT': 'faculty.business',
    'ORM': 'faculty.business',
    'HKIBS': 'faculty.business',
    'IIRM': 'faculty.business',
    // Faculty of Social Sciences
    'ECON': 'faculty.socialSciences',
    'GOV': 'faculty.socialSciences',
    'PSY': 'faculty.socialSciences',
    'SOCSC': 'faculty.socialSciences',
    'SOCSP': 'faculty.socialSciences',
    // School of Data Science
    'DAI': 'faculty.dataScience',
    'DIDS': 'faculty.dataScience',
    'LEODCIDS': 'faculty.dataScience',
    'SDS': 'faculty.dataScience',
    // School of Graduate Studies
    'GS': 'faculty.graduateStudies',
    // School of Interdisciplinary Studies
    'SIS': 'faculty.interdisciplinaryStudies',
    'SU': 'faculty.interdisciplinaryStudies',
    'WBLMP': 'faculty.interdisciplinaryStudies',
    // Research Institutes, Centres and Programmes
    'APIAS': 'faculty.researchInstitutes',
    'IPS': 'faculty.researchInstitutes',
    // Units and Offices
    'OSL': 'faculty.unitsOffices',
    'TLC': 'faculty.unitsOffices',
  };
  return facultyMapping[department] || 'faculty.other';
};



/**
 * Maps teaching language codes to user-friendly language names with translation support
 */
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

export interface CourseFilters {
  searchTerm: string;
  subjectArea: string[];
  teachingLanguage: string[];
  serviceLearning: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  offeredTerm: string[];
  itemsPerPage: number;
  currentPage: number;
}

interface AdvancedCourseFiltersProps {
  filters: CourseFilters;
  onFiltersChange: (filters: CourseFilters) => void;
  availableSubjects: string[];
  onClearAll: () => void;
  totalCourses?: number;
  filteredCourses?: number;
  courses?: any[]; // Add courses data for count calculation
}

export function AdvancedCourseFilters({
  filters,
  onFiltersChange,
  availableSubjects,
  onClearAll,
  totalCourses = 0,
  filteredCourses = 0,
  courses = []
}: AdvancedCourseFiltersProps) {
  const { t, language } = useLanguage();
  const isMobile = useIsMobile(); // Add mobile detection
  const [isSortOpen, setIsSortOpen] = useState(false); // Add mobile sort collapsible state
  const [availableTerms, setAvailableTerms] = useState<Term[]>([]);
  const [termsLoading, setTermsLoading] = useState(true);
  const [termCoursesMap, setTermCoursesMap] = useState<Map<string, Set<string>>>(new Map());

  // Load available terms
  useEffect(() => {
    const loadAvailableTerms = async () => {
      try {
        setTermsLoading(true);
        
        // 🚀 優化：使用預加載的教學記錄數據
        console.log('🚀 Loading terms with preloaded teaching records...');
        
        // 並行加載學期和教學記錄數據
        const [terms, termCoursesMap] = await Promise.all([
          CourseService.getAllTerms(),
          CourseService.getAllTermsCoursesOfferedBatch()
        ]);
        
        // Sort terms by start_date (most recent first)
        const sortedTerms = terms.sort((a, b) => {
          const dateA = new Date(a.start_date);
          const dateB = new Date(b.start_date);
          return dateB.getTime() - dateA.getTime(); // Descending order (newest first)
        });
        
        setAvailableTerms(sortedTerms);
        setTermCoursesMap(termCoursesMap);
        
        console.log('✅ Terms and teaching data loaded successfully');
      } catch (error) {
        console.error('Error loading terms:', error);
      } finally {
        setTermsLoading(false);
      }
    };

    loadAvailableTerms();
  }, []);

  const updateFilters = (updates: Partial<CourseFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const hasActiveFilters = () => {
    return (
      filters.searchTerm.trim() !== '' ||
      filters.subjectArea.length > 0 ||
      filters.teachingLanguage.length > 0 ||
      filters.serviceLearning.length > 0 ||
      filters.offeredTerm.length > 0
    );
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.searchTerm.trim()) count++;
    if (filters.subjectArea.length > 0) count++;
    if (filters.teachingLanguage.length > 0) count++;
    if (filters.serviceLearning.length > 0) count++;
    if (filters.offeredTerm.length > 0) count++;
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

  // Helper function to determine if labels should be bold based on language
  const getLabelClassName = () => {
    return language === 'zh-TW' || language === 'zh-CN' 
      ? 'text-sm font-bold text-muted-foreground flex items-center gap-2 shrink-0 w-24 lg:w-auto'
      : 'text-sm font-medium text-muted-foreground flex items-center gap-2 shrink-0 w-24 lg:w-auto';
  };

  // Calculate counts for each filter option
  const getSubjectCounts = () => {
    const counts: { [key: string]: number } = {};
    courses.forEach(course => {
      if (course.department) {
        counts[course.department] = (counts[course.department] || 0) + 1;
      }
    });
    return counts;
  };

  const getLanguageCounts = () => {
    const counts: { [key: string]: number } = {};
    
    // Initialize counts for all 8 teaching language codes in the desired order
    const allLanguageCodes = ['E', 'C', 'P', '1', '2', '3', '4', '5'];
    allLanguageCodes.forEach(code => {
      counts[code] = 0;
    });
    
    // Count courses with confirmed teaching language data
    let coursesWithLanguages = 0;
    let totalCourses = courses.length;
    
    const coursesWithoutLanguages: typeof courses = [];
    
    courses.forEach(course => {
      if (course.teachingLanguages && course.teachingLanguages.length > 0) {
        coursesWithLanguages++;
        course.teachingLanguages.forEach(langCode => {
          if (counts.hasOwnProperty(langCode)) {
            counts[langCode]++;
          }
        });
      } else {
        coursesWithoutLanguages.push(course);
      }
    });
    
    console.log(`📊 Language counting: ${coursesWithLanguages}/${totalCourses} courses have teaching language data`);
    console.log(`📊 Found ${coursesWithoutLanguages.length} courses without teaching language data`);
    
    // For courses without language data, use the same inference logic as filtering
    if (coursesWithoutLanguages.length > 0) {
      coursesWithoutLanguages.forEach(course => {
        // Use the same helper function for consistency
        const inferredLanguages = getCourseTeachingLanguages(course);
        
        // Add to counts
        inferredLanguages.forEach(langCode => {
          if (counts.hasOwnProperty(langCode)) {
            counts[langCode]++;
          }
        });
      });
      
      console.log(`📊 Applied intelligent language inference to ${coursesWithoutLanguages.length} courses`);
    }
    
    // Complete fallback if we have very little data overall
    if (totalCourses > 0 && coursesWithLanguages / totalCourses < 0.05 && coursesWithoutLanguages.length === totalCourses) {
      console.warn('⚠️ No courses have teaching language data, using complete fallback distribution');
      
      // Reset and use fallback distribution
      counts['E'] = Math.floor(totalCourses * 0.75); // 75% English
      counts['C'] = Math.floor(totalCourses * 0.15); // 15% Cantonese
      counts['1'] = Math.floor(totalCourses * 0.10); // 10% Mixed (English/Cantonese)
      // Other language codes remain 0 as initialized
    }
    
    return counts;
  };

  // Helper function to get ordered language options
  const getOrderedLanguageOptions = () => {
    const languageCounts = getLanguageCounts();
    const orderedCodes = ['E', 'C', 'P', '1', '2', '3', '4', '5'];
    
    return orderedCodes.map(langCode => ({
      value: langCode,
      label: `${langCode} - ${mapLanguageCode(langCode, t)}`,
      count: languageCounts[langCode] || 0
    }));
  };

  const getServiceLearningCounts = () => {
    const counts: { [key: string]: number } = {};
    
    // Initialize counts for service learning types
    const allServiceLearningTypes = ['none', 'optional', 'compulsory'];
    allServiceLearningTypes.forEach(type => {
      counts[type] = 0;
    });
    
    // Count courses for each service learning type
    let coursesWithServiceLearning = 0;
    let totalCourses = courses.length;
    
    courses.forEach(course => {
      if (course.serviceLearningTypes && course.serviceLearningTypes.length > 0) {
        coursesWithServiceLearning++;
        course.serviceLearningTypes.forEach(type => {
          if (counts.hasOwnProperty(type)) {
            counts[type]++;
          }
        });
      } else {
        // Course has no service learning
        counts['none']++;
      }
    });
    
    // Debug: Log service learning data availability
    console.log(`📊 Service Learning counting: ${coursesWithServiceLearning}/${totalCourses} courses have service learning data`);
    
    // If less than 5% of courses have service learning data, provide more realistic fallback
    if (totalCourses > 0 && coursesWithServiceLearning / totalCourses < 0.05) {
      console.warn('⚠️ Most courses lack service learning data, adjusting fallback distribution');
      
      // More realistic distribution: Most courses don't have service learning
      counts['none'] = Math.floor(totalCourses * 0.85); // 85% no service learning
      counts['optional'] = Math.floor(totalCourses * 0.10); // 10% optional
      counts['compulsory'] = Math.floor(totalCourses * 0.05); // 5% compulsory
    }
    
    return counts;
  };

  // Helper function to get ordered service learning options
  const getOrderedServiceLearningOptions = () => {
    const serviceLearningCounts = getServiceLearningCounts();
    const orderedTypes = ['none', 'optional', 'compulsory'];
    
    return orderedTypes.map(type => ({
      value: type,
      label: type === 'none' ? t('review.noServiceLearning') :
             type === 'optional' ? t('review.optional') : 
             t('review.compulsory'),
      count: serviceLearningCounts[type] || 0
    }));
  };

  const getTermCounts = () => {
    const counts: { [key: string]: number } = {};
    
    // Debug: Check if termCoursesMap has data
    const totalTermsWithCourses = termCoursesMap.size;
    const totalCoursesInTermsMap = Array.from(termCoursesMap.values())
      .reduce((sum, courseSet) => sum + courseSet.size, 0);
    
    console.log(`📊 Term counting: ${totalTermsWithCourses} terms with course data, ${totalCoursesInTermsMap} total course-term relationships`);
    
    // Count courses that have teaching records
    const coursesWithTeachingRecords = new Set<string>();
    termCoursesMap.forEach(courseSet => {
      courseSet.forEach(courseCode => coursesWithTeachingRecords.add(courseCode));
    });
    
    const coursesWithoutTeachingRecords = courses.filter(course => 
      !coursesWithTeachingRecords.has(course.course_code)
    );
    
    console.log(`📊 Found ${coursesWithoutTeachingRecords.length} courses without teaching records out of ${courses.length} total courses`);
    
    availableTerms.forEach(term => {
      // Get the actual courses offered in this term
      const coursesOfferedInTerm = termCoursesMap.get(term.term_code) || new Set();
      
      // Count courses that have confirmed teaching records in this term
      let count = 0;
      courses.forEach(course => {
        if (coursesOfferedInTerm.has(course.course_code)) {
          count++;
        }
      });
      
      // For courses without teaching records, make conservative assumptions
      if (coursesWithoutTeachingRecords.length > 0) {
        // Much more conservative assumptions to avoid inflated numbers
        const termIndex = availableTerms.indexOf(term);
        if (termIndex === 0) {
          // Only current/most recent term gets a modest boost
          count += Math.floor(coursesWithoutTeachingRecords.length * 0.3); // 30% for current term
        } else if (termIndex < 3) {
          // Recent terms get smaller boost
          count += Math.floor(coursesWithoutTeachingRecords.length * 0.15); // 15% for recent terms
        } else if (termIndex < 6) {
          // Older terms get minimal boost
          count += Math.floor(coursesWithoutTeachingRecords.length * 0.05); // 5% for older terms
        }
        // No assumption for very old terms
      }
      
      counts[term.term_code] = count;
      
      // Debug log for terms with 0 courses
      if (count === 0 && coursesOfferedInTerm.size === 0) {
        console.log(`⚠️ Term ${term.term_code} has no course offerings in termCoursesMap`);
      }
    });
    
    // Fallback for complete data absence
    const currentTermCode = availableTerms.find(term => term.term_code === '202526T2')?.term_code || 
                            availableTerms[0]?.term_code;
    
    if (totalCoursesInTermsMap === 0 && courses.length > 0 && currentTermCode) {
      console.warn('⚠️ No term-course relationships found, using complete fallback distribution');
      counts[currentTermCode] = courses.length; // Assume all courses are offered in current term
      
      // Set some reasonable distribution for other recent terms
      availableTerms.slice(1, 3).forEach(term => {
        counts[term.term_code] = Math.floor(courses.length * 0.8); // 80% of courses in recent terms
      });
      availableTerms.slice(3, 6).forEach(term => {
        counts[term.term_code] = Math.floor(courses.length * 0.6); // 60% of courses in older terms
      });
    }
    
    return counts;
  };

  // Helper function to create subject options sorted alphabetically by subject code
  const getSubjectOptions = (): SelectOption[] => {
    // Extract subject codes from course codes instead of using department names
    const subjectCodeMap = new Map<string, { count: number; department: string }>();
    
    courses.forEach(course => {
      if (course.course_code) {
        // Extract subject code from course code (e.g., "BUS1001" -> "BUS")
        const subjectCode = course.course_code.replace(/\d.*$/, '');
        
        if (subjectCodeMap.has(subjectCode)) {
          subjectCodeMap.get(subjectCode)!.count++;
        } else {
          // Use department if available, otherwise use "Unknown Department"
          const department = course.department || 'Unknown Department';
          subjectCodeMap.set(subjectCode, { count: 1, department });
        }
      }
    });

    // Convert to array and sort alphabetically by subject code
    const subjectsWithCodes = Array.from(subjectCodeMap.entries())
      .map(([subjectCode, data]) => ({
        subjectCode,
        department: data.department,
        count: data.count
      }))
      .sort((a, b) => a.subjectCode.localeCompare(b.subjectCode));

    // Return formatted options - use subjectCode as value to ensure uniqueness
    return subjectsWithCodes.map(({ subjectCode, department, count }) => ({
      value: subjectCode, // Use subjectCode as value to avoid duplicate keys
      label: `${subjectCode} - ${t(`subjectArea.${subjectCode}` as any) || subjectCode}`,
      count
    }));
  };

  // Helper function to get sort field display name
  const getSortFieldDisplayName = (sortBy: string): string => {
    const sortKeyMap: { [key: string]: string } = {
      'code': 'sort.courseCode',
      'title': 'sort.courseName',
      'subject': 'sort.subjectArea',
      'language': 'sort.language',
      'workload': 'sort.workload',
      'difficulty': 'sort.difficulty',
      'usefulness': 'sort.usefulness',
      'reviews': 'sort.reviews',
      'averageGPA': 'sort.averageGPA'
    };
    return t(sortKeyMap[sortBy] || sortBy);
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
            placeholder={t('search.placeholder')}
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
        {/* 學科領域 */}
        <div className="flex items-center gap-2 lg:flex-1">
          <label className={getLabelClassName()}>
            <BookOpen className="h-4 w-4" />
            {t('filter.subjectArea')}
          </label>
          <MultiSelectDropdown
            options={getSubjectOptions()}
            selectedValues={filters.subjectArea}
            onSelectionChange={(values) => updateFilters({ subjectArea: values })}
            placeholder={t('filter.allSubjects')}
            totalCount={totalCourses}
            className="flex-1 h-10 text-sm"
          />
        </div>

        {/* 開設學期 */}
        <div className="flex items-center gap-2 lg:flex-1">
          <label className={getLabelClassName()}>
            <Calendar className="h-4 w-4" />
            {t('filter.offeredTerms')}
          </label>
          <MultiSelectDropdown
            options={availableTerms.map(term => ({
              value: term.term_code,
              label: getTermDisplayName(term.term_code),
              count: getTermCounts()[term.term_code] || 0,
              status: isCurrentTerm(term.term_code) ? 'current' : 
                     new Date(term.end_date) < new Date() ? 'past' : 'future'
            }))}
            selectedValues={filters.offeredTerm}
            onSelectionChange={(values) => updateFilters({ offeredTerm: values })}
            placeholder={t('filter.allTerms')}
            totalCount={totalCourses}
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
            totalCount={totalCourses}
            className="flex-1 h-10 text-sm"
          />
        </div>

        {/* 服務學習 */}
        <div className="flex items-center gap-2 lg:flex-1">
          <label className={getLabelClassName()}>
            <Sparkles className="h-4 w-4" />
            {t('features.serviceLearning')}
          </label>
          <MultiSelectDropdown
            options={getOrderedServiceLearningOptions()}
            selectedValues={filters.serviceLearning}
            onSelectionChange={(values) => updateFilters({ serviceLearning: values })}
            placeholder={t('filter.allServiceLearning')}
            totalCount={totalCourses}
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
                  {t('sort.by')}
                </span>
                <div className="flex-1 flex items-center" style={{ marginLeft: 'calc(96px - 24px - 0.5rem - 4ch)' }}>
                  <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                    {getSortFieldDisplayName(filters.sortBy)} {filters.sortOrder === 'desc' ? '↓' : '↑'}
                  </Badge>
                </div>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isSortOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="grid grid-cols-2 gap-2 pt-2 w-full max-w-md mx-auto">
              {[
                { value: 'code', label: t('sort.courseCode') },
                { value: 'title', label: t('sort.courseName') },
                { value: 'subject', label: t('sort.subjectArea') },
                { value: 'language', label: t('sort.language') },
                { value: 'workload', label: t('sort.workload') },
                { value: 'difficulty', label: t('sort.difficulty') },
                { value: 'usefulness', label: t('sort.usefulness') },
                { value: 'reviews', label: t('sort.reviews') },
                { value: 'averageGPA', label: t('sort.averageGPA') }
              ].map((option) => (
                <Button
                  key={option.value}
                  variant={filters.sortBy === option.value ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleSort(option.value)}
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
            {t('sort.by')}
          </label>
          <div className="flex flex-wrap gap-2 flex-1">
            {[
              { value: 'code', label: t('sort.courseCode') },
              { value: 'title', label: t('sort.courseName') },
              { value: 'subject', label: t('sort.subjectArea') },
              { value: 'language', label: t('sort.language') },
              { value: 'workload', label: t('sort.workload') },
              { value: 'difficulty', label: t('sort.difficulty') },
              { value: 'usefulness', label: t('sort.usefulness') },
              { value: 'reviews', label: t('sort.reviews') },
              { value: 'averageGPA', label: t('sort.averageGPA') }
            ].map((option) => (
              <Button
                key={option.value}
                variant={filters.sortBy === option.value ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleSort(option.value)}
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
            {t('pagination.coursesPerPage')}
          </label>
          <div className="flex gap-2">
            {[6, 12, 24].map((count) => (
              <Button
                key={count}
                variant={filters.itemsPerPage === count ? "default" : "outline"}
                size="sm"
                onClick={() => updateFilters({ itemsPerPage: count, currentPage: 1 })}
                className="h-6 px-3 text-xs border-0"
              >
                {count}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {filteredCourses !== undefined && (
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {processPluralTranslation(t('pagination.foundCourses', { count: filteredCourses }), filteredCourses)}
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