import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  ArrowLeft,
  Mail,
  BookOpen,
  Calendar,
  Loader2,
  AlertCircle,
  MessageSquare,
  GraduationCap,
  Award,
  FileText,
  CheckCircle,
  XCircle,
  Brain,
  Target,
  User,
  ChevronDown,
  Clock,
  Building,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelectDropdown, SelectOption } from '@/components/ui/multi-select-dropdown';
import { Pagination } from '@/components/features/reviews/Pagination';
import { InstructorReviewsFilters, InstructorReviewFilters } from '@/components/features/reviews/InstructorReviewsFilters';
import { CourseRequirementsFilter, CourseRequirementsFilters } from '@/components/features/reviews/CourseRequirementsFilter';
import { 
  Instructor, 
  InstructorTeachingCourse, 
  InstructorReviewInfo,
  InstructorReviewFromDetails,
  InstructorDetail
} from '@/services/api/courseService';
import { CourseService } from '@/services/api/courseService';
import { useInstructorDetailOptimized } from '@/hooks/useInstructorDetailOptimized';
import { useInstructorDetailTeachingLanguages } from '@/hooks/useInstructorDetailTeachingLanguages';
import { formatDateTimeUTC8 } from '@/utils/ui/dateUtils';
import { getCurrentTermCode, getCurrentTermName } from '@/utils/dateUtils';
import { renderCommentMarkdown, hasMarkdownFormatting } from '@/utils/ui/markdownRenderer';
import { ReviewAvatar } from '@/components/ui/review-avatar';
import { getInstructorName, getCourseTitle, translateDepartmentName, getTeachingLanguageName } from '@/utils/textUtils';
import { StarRating } from '@/components/ui/star-rating';
import { VotingButtons } from '@/components/ui/voting-buttons';
import { cn } from '@/lib/utils';
import { GradeBadge } from '@/components/ui/GradeBadge';
import { FavoriteButton } from '@/components/ui/FavoriteButton';
import { PersistentCollapsibleSection } from '@/components/ui/PersistentCollapsibleSection';
import GradeDistributionChart from '@/components/features/reviews/GradeDistributionChart';
import { calculateGradeDistributionFromReviews } from '@/utils/gradeUtils';

// Faculty mapping function - copied from PopularItemCard
const getFacultyByDepartment = (department: string): string => {
  // First try to extract raw department name if it's translated
  const rawDepartment = extractRawDepartmentName(department);
  
  const facultyMapping: { [key: string]: string } = {
    // Faculty of Arts
    'Chinese': 'faculty.arts',
    'Cultural Studies': 'faculty.arts',
    'Digital Arts and Creative Industries': 'faculty.arts',
    'English': 'faculty.arts',
    'History': 'faculty.arts',
    'Philosophy': 'faculty.arts',
    'Translation': 'faculty.arts',
    'Centre for English and Additional Languages': 'faculty.arts',
    'Chinese Language Education and Assessment Centre': 'faculty.arts',
    
    // Faculty of Business
    'Accountancy': 'faculty.business',
    'Finance': 'faculty.business',
    'Management': 'faculty.business',
    'Marketing and International Business': 'faculty.business',
    'Operations and Risk Management': 'faculty.business',
    
    // Faculty of Social Sciences
    'Economics': 'faculty.socialSciences',
    'Government and International Affairs': 'faculty.socialSciences',
    'Psychology': 'faculty.socialSciences',
    'Sociology and Social Policy': 'faculty.socialSciences',
    
    // School of Data Science
    'LEO Dr David P. Chan Institute of Data Science': 'faculty.dataScience',
    
    // School of Interdisciplinary Studies
    'Science Unit': 'faculty.interdisciplinaryStudies',
    'Wong Bing Lai Music and Performing Arts Unit': 'faculty.interdisciplinaryStudies'
  };
  
  return facultyMapping[rawDepartment] || '';
};

// Helper function to extract raw department name from translated names
const extractRawDepartmentName = (department: string): string => {
  // If it's already a raw department name, return as is
  const rawDepartmentNames = [
    'Chinese', 'Cultural Studies', 'Digital Arts and Creative Industries', 'English', 
    'History', 'Philosophy', 'Translation', 'Centre for English and Additional Languages',
    'Chinese Language Education and Assessment Centre', 'Accountancy', 'Finance', 
    'Management', 'Marketing and International Business', 'Operations and Risk Management',
    'Psychology', 'Economics', 'Government and International Affairs', 
    'Sociology and Social Policy', 'Science Unit',
    'Wong Bing Lai Music and Performing Arts Unit', 'LEO Dr David P. Chan Institute of Data Science'
  ];
  
  if (rawDepartmentNames.includes(department)) {
    return department;
  }
  
  // Create mapping from translated names back to raw names
  const translatedToRawMapping: { [key: string]: string } = {
    // English translations
    'Department of Chinese': 'Chinese',
    'Department of Cultural Studies': 'Cultural Studies',
    'Department of Digital Arts and Creative Industries': 'Digital Arts and Creative Industries',
    'Department of English': 'English',
    'Department of History': 'History',
    'Department of Philosophy': 'Philosophy',
    'Department of Translation': 'Translation',
    'Centre for English and Additional Languages': 'Centre for English and Additional Languages',
    'Chinese Language Education and Assessment Centre': 'Chinese Language Education and Assessment Centre',
    'Department of Accountancy': 'Accountancy',
    'Department of Finance': 'Finance',
    'Department of Management': 'Management',
    'Department of Marketing and International Business': 'Marketing and International Business',
    'Department of Operations and Risk Management': 'Operations and Risk Management',
    'Department of Psychology': 'Psychology',
    'Department of Economics': 'Economics',
    'Department of Government and International Affairs': 'Government and International Affairs',
    'Department of Sociology and Social Policy': 'Sociology and Social Policy',
    'Science Unit': 'Science Unit',
    'Wong Bing Lai Music and Performing Arts Unit': 'Wong Bing Lai Music and Performing Arts Unit',
    'LEO Dr David P. Chan Institute of Data Science': 'LEO Dr David P. Chan Institute of Data Science',
    
    // Chinese Traditional translations
    '中文系': 'Chinese',
    '文化研究系': 'Cultural Studies',
    '數碼藝術及創意產業系': 'Digital Arts and Creative Industries',
    '英文系': 'English',
    '歷史系': 'History',
    '哲學系': 'Philosophy',
    '翻譯系': 'Translation',
    '英語及外語教學中心': 'Centre for English and Additional Languages',
    '中國語文教學與測試中心': 'Chinese Language Education and Assessment Centre',
    '會計學系': 'Accountancy',
    '金融學系': 'Finance',
    '管理學學系': 'Management',
    '市場及國際企業學系': 'Marketing and International Business',
    '運營與風險管理學系': 'Operations and Risk Management',
    '心理學系': 'Psychology',
    '經濟學系': 'Economics',
    '政府與國際事務學系': 'Government and International Affairs',
    '社會學及社會政策系': 'Sociology and Social Policy',
    '科學教研組': 'Science Unit',
    '黃炳禮音樂及演藝部': 'Wong Bing Lai Music and Performing Arts Unit',
    '嶺南教育機構陳斌博士數據科學研究所': 'LEO Dr David P. Chan Institute of Data Science',
    
    // Chinese Simplified translations (only unique ones)
    '数码艺术及创意产业系': 'Digital Arts and Creative Industries',
    '历史系': 'History',
    '哲学系': 'Philosophy',
    '翻译系': 'Translation',
    '英语及外语教学中心': 'Centre for English and Additional Languages',
    '中国语文教学与测试中心': 'Chinese Language Education and Assessment Centre',
    '会计学系': 'Accountancy',
    '金融学系': 'Finance',
    '管理学学系': 'Management',
    '市场及国际企业学系': 'Marketing and International Business',
    '运营与风险管理学系': 'Operations and Risk Management',
    '心理学系': 'Psychology',
    '经济学系': 'Economics',
    '政府与国际事务学系': 'Government and International Affairs',
    '社会学及社会政策系': 'Sociology and Social Policy',
    '科学教研组': 'Science Unit',
    '黄炳礼音乐及演艺部': 'Wong Bing Lai Music and Performing Arts Unit',
    '岭南教育机构陈斌博士数据科学研究所': 'LEO Dr David P. Chan Institute of Data Science'
  };
  
  return translatedToRawMapping[department] || department;
};

const Lecturers = () => {
  const { instructorName } = useParams<{ instructorName: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, language } = useLanguage();
  
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [instructorLoading, setInstructorLoading] = useState(true);
  const [instructorError, setInstructorError] = useState<string | null>(null);
  
  // 展開其他講師評論的狀態管理
  const [expandedOtherInstructors, setExpandedOtherInstructors] = useState<{[reviewId: string]: boolean}>({});
  
  // 其他講師信息緩存
  const [otherInstructorsMap, setOtherInstructorsMap] = useState<Map<string, Instructor>>(new Map());

  // 篩選和排序狀態
  const [filters, setFilters] = useState<InstructorReviewFilters>({
    selectedLanguages: [],
    selectedTerms: [],
    selectedCourses: [],
    selectedSessionTypes: [],
    selectedTeachingLanguages: [],
    selectedGrades: [],
    sortBy: 'postDate',
    sortOrder: 'desc',
    itemsPerPage: 6,
    currentPage: 1
  });

  // 課程要求篩選狀態
  const [requirementsFilters, setRequirementsFilters] = useState<CourseRequirementsFilters>({
    attendance: 'all',
    quiz: 'all',
    midterm: 'all',
    final: 'all',
    individualAssignment: 'all',
    groupProject: 'all',
    presentation: 'all',
    reading: 'all'
  });

  // 外部成績篩選狀態
  const [externalGradeFilter, setExternalGradeFilter] = useState<string>('');

  // Teaching tab and filter states
  const [activeTeachingTab, setActiveTeachingTab] = useState<string>('lecture');
  const [selectedTermFilter, setSelectedTermFilter] = useState<string | string[]>('all');
  const [selectedTeachingLanguageFilter, setSelectedTeachingLanguageFilter] = useState<string | string[]>('all');

  // Grade distribution chart filter state
  const [selectedGradeChartFilter, setSelectedGradeChartFilter] = useState<string | string[]>('all');

  // 解碼 URL 參數
  const decodedName = instructorName ? decodeURIComponent(instructorName) : null;

  // 使用優化的 hook 來載入教學課程和評論數據
  const { 
    data: { teachingCourses, reviews }, 
    loading: detailLoading,
    teachingCoursesLoading,
    reviewsLoading,
    error: detailError 
  } = useInstructorDetailOptimized(decodedName);

  // 整體載入狀態
  // 整體載入狀態
  const loading = instructorLoading || detailLoading;
  const error = instructorError || detailError;

  // Derived state variables
  const allReviews = reviews; // For consistency with CourseDetail
  const currentTermName = getCurrentTermName();
  const currentTermCode = getCurrentTermCode();
  
  // Calculate if instructor is teaching in current term
  const isTeachingInCurrentTerm = useMemo(() => {
    if (!teachingCourses || teachingCourses.length === 0) return false;
    return teachingCourses.some(tc => tc.term.term_code === currentTermCode);
  }, [teachingCourses, currentTermCode]);

  // Calculate unique courses taught
  const uniqueCourses = useMemo(() => {
    if (!teachingCourses || teachingCourses.length === 0) return [];
    const coursesMap = new Map();
    teachingCourses.forEach(tc => {
      if (!coursesMap.has(tc.course.course_code)) {
        coursesMap.set(tc.course.course_code, tc.course);
      }
    });
    return Array.from(coursesMap.values());
  }, [teachingCourses]);

  // Calculate detailed statistics
  const detailedStats = useMemo(() => {
    if (!reviews || reviews.length === 0) {
      return {
        averageTeachingQuality: 0,
        averageGradingSatisfaction: 0
      };
    }

    // Extract ratings for the current instructor
    const teachingRatings: number[] = [];
    const gradingRatings: number[] = [];

    reviews.forEach(reviewInfo => {
      const instructorDetail = reviewInfo.instructorDetails.find(
        detail => detail.instructor_name === decodedName
      );
      
      if (instructorDetail) {
        if (instructorDetail.teaching !== null && instructorDetail.teaching !== undefined && instructorDetail.teaching !== -1) {
          teachingRatings.push(instructorDetail.teaching);
        }
        if (instructorDetail.grading !== null && instructorDetail.grading !== undefined && instructorDetail.grading !== -1) {
          gradingRatings.push(instructorDetail.grading);
        }
      }
    });

    return {
      averageTeachingQuality: teachingRatings.length > 0 
        ? teachingRatings.reduce((sum, rating) => sum + rating, 0) / teachingRatings.length
        : 0,
      averageGradingSatisfaction: gradingRatings.length > 0
        ? gradingRatings.reduce((sum, rating) => sum + rating, 0) / gradingRatings.length
        : 0
    };
  }, [reviews, decodedName]);

  // Teaching badge click handler
  const handleTeachingBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Navigate to instructors list with current term filter applied
    const searchParams = new URLSearchParams();
    searchParams.set('teachingTerm', currentTermCode);
    
    navigate(`/instructors?${searchParams.toString()}`);
  };

  // Collect all instructor details for teaching languages hook
  const allInstructorDetails = useMemo(() => {
    if (!reviews) return [];
    const details: InstructorDetail[] = [];
    reviews.forEach(reviewInfo => {
      details.push(...reviewInfo.instructorDetails);
    });
    return details;
  }, [reviews]);

  // State for teaching languages in teaching records section
  const [teachingRecordsLanguages, setTeachingRecordsLanguages] = useState<Map<string, string>>(new Map());
  const [teachingRecordsLanguagesLoading, setTeachingRecordsLanguagesLoading] = useState(false);
  
  // Load teaching languages for teaching records
  useEffect(() => {
    const loadTeachingRecordsLanguages = async () => {
      if (!teachingCourses.length || !decodedName) return;
      
      setTeachingRecordsLanguagesLoading(true);
      try {
        // Create instructor detail params for each teaching record
        const instructorDetailParams = teachingCourses.map(teaching => ({
          courseCode: teaching.course.course_code,
          termCode: teaching.term.term_code,
          instructorName: decodedName,
          sessionType: teaching.sessionType
        }));
        
        // Batch load teaching languages
        const teachingLanguagesMap = await CourseService.getBatchInstructorDetailTeachingLanguages(instructorDetailParams);
        setTeachingRecordsLanguages(teachingLanguagesMap);
      } catch (error) {
        console.error('Error loading teaching records languages:', error);
        setTeachingRecordsLanguages(new Map());
      } finally {
        setTeachingRecordsLanguagesLoading(false);
      }
    };
    
    loadTeachingRecordsLanguages();
  }, [teachingCourses, decodedName]);
  
  // Helper function to get teaching language for teaching records
  const getTeachingLanguageForTeachingRecord = (courseCode: string, termCode: string, sessionType: string): string | null => {
    if (!decodedName) return null;
    const key = `${courseCode}|${termCode}|${decodedName}|${sessionType}`;
    return teachingRecordsLanguages.get(key) || null;
  };
  
  // Use teaching languages hook for reviews section (keep existing logic)
  const firstReview = reviews?.[0];
  const courseCode = firstReview?.course?.course_code || '';
  const termCode = firstReview?.term?.term_code || '';
  
  const { 
    teachingLanguages, 
    loading: teachingLanguagesLoading, 
    getTeachingLanguageForInstructor 
  } = useInstructorDetailTeachingLanguages({
    instructorDetails: allInstructorDetails,
    courseCode,
    termCode
  });

  // Generate filter options for grade distribution chart (courses with session types)
  const gradeChartFilterOptions = React.useMemo(() => {
    if (!reviews || reviews.length === 0) return [];
    
    // Count occurrences of each course-session combination for the current instructor
    const courseSessionMap = new Map<string, { title: string; sessionType: string; count: number }>();
    
    reviews.forEach(reviewInfo => {
      if (reviewInfo.course?.course_code) {
        const courseCode = reviewInfo.course.course_code;
        const courseTitle = reviewInfo.course.course_title || reviewInfo.course.course_code;
        
        // Find the session type for the current instructor in this review
        const instructorDetail = reviewInfo.instructorDetails.find(detail => 
          detail.instructor_name === decodedName
        );
        
        if (instructorDetail && instructorDetail.session_type) {
          const key = `${courseCode}|${instructorDetail.session_type}`;
          
          if (courseSessionMap.has(key)) {
            courseSessionMap.get(key)!.count++;
          } else {
            courseSessionMap.set(key, { 
              title: courseTitle, 
              sessionType: instructorDetail.session_type,
              count: 1 
            });
          }
        }
      }
    });
    
    return Array.from(courseSessionMap.entries())
      .map(([key, data]) => {
        const [courseCode, sessionType] = key.split('|');
        const sessionTypeTranslated = sessionType === 'Lecture' ? t('sessionType.lecture') : t('sessionType.tutorial');
        return {
          value: key,
          label: `${courseCode} - ${data.title} (${sessionTypeTranslated})`,
          count: data.count,
          // Add sorting helpers
          courseCode,
          sessionType
        };
      })
      .sort((a, b) => {
        // First sort by session type (Lecture before Tutorial)
        if (a.sessionType !== b.sessionType) {
          return a.sessionType === 'Lecture' ? -1 : 1;
        }
        
        // Within same session type, sort by course code alphabetically
        return a.courseCode.localeCompare(b.courseCode);
      })
      .map(({ value, label, count }) => ({ value, label, count })); // Remove extra sorting fields
  }, [reviews, decodedName, t]);

  // Filter reviews for grade distribution chart based on selected course-session combination(s)
  const filteredReviewsForChart = React.useMemo(() => {
    if (!reviews || reviews.length === 0) return [];
    
    // Handle both single and multiple selections
    const selectedValues = Array.isArray(selectedGradeChartFilter) ? selectedGradeChartFilter : [selectedGradeChartFilter];
    
    if (selectedValues.length === 0 || selectedValues.includes('all')) {
      return reviews;
    }
    
    // Parse all selected course-session combinations
    const targetCourseSessions = selectedValues.map(value => {
      const [targetCourse, targetSessionType] = value.split('|');
      return { targetCourse, targetSessionType };
    });
    
    return reviews.filter(reviewInfo => {
      if (!reviewInfo.course?.course_code) return false;
      
      // Find the instructor detail for the current instructor
      const instructorDetail = reviewInfo.instructorDetails.find(detail => 
        detail.instructor_name === decodedName
      );
      
      if (!instructorDetail || !instructorDetail.session_type) return false;
      
      // Check if this review matches any of the selected course-session combinations
      return targetCourseSessions.some(({ targetCourse, targetSessionType }) =>
        reviewInfo.course.course_code === targetCourse && 
        instructorDetail.session_type === targetSessionType
      );
    });
  }, [reviews, selectedGradeChartFilter, decodedName]);

  // 獲取所有可用的學期
  const availableTerms = React.useMemo(() => {
    const terms = teachingCourses.map(teaching => teaching.term);
    const uniqueTerms = terms.filter((term, index, self) => 
      self.findIndex(t => t.term_code === term.term_code) === index
    );
    return uniqueTerms.sort((a, b) => b.term_code.localeCompare(a.term_code));
  }, [teachingCourses]);

  // 根據選定的學期和教學語言篩選教學課程
  const filteredTeachingCourses = React.useMemo(() => {
    let filtered = teachingCourses;
    
    // Handle term filtering
    const selectedTermValues = Array.isArray(selectedTermFilter) ? selectedTermFilter : [selectedTermFilter];
    if (selectedTermValues.length > 0 && !selectedTermValues.includes('all')) {
      filtered = filtered.filter(teaching => selectedTermValues.includes(teaching.term.term_code));
    }
    
    // Handle teaching language filtering
    const selectedLanguageValues = Array.isArray(selectedTeachingLanguageFilter) ? selectedTeachingLanguageFilter : [selectedTeachingLanguageFilter];
    if (selectedLanguageValues.length > 0 && !selectedLanguageValues.includes('all')) {
      filtered = filtered.filter(teaching => {
        const teachingLanguage = getTeachingLanguageForTeachingRecord(
          teaching.course.course_code,
          teaching.term.term_code,
          teaching.sessionType
        );
        return teachingLanguage && selectedLanguageValues.includes(teachingLanguage);
      });
    }
    
    return filtered;
  }, [teachingCourses, selectedTermFilter, selectedTeachingLanguageFilter, getTeachingLanguageForInstructor, decodedName]);

  useEffect(() => {
    const loadInstructorBasicData = async () => {
      if (!decodedName) {
        setInstructorError(t('instructors.nameNotProvided'));
        setInstructorLoading(false);
        return;
      }
      
      try {
        setInstructorLoading(true);
        setInstructorError(null);
        
        const startTime = Date.now();
        
        // 只載入講師基本信息
        const instructorData = await CourseService.getInstructorByName(decodedName);
        
        const loadTime = Date.now() - startTime;
        console.log(`Instructor basic data loaded in ${loadTime}ms for:`, decodedName);
        
        if (!instructorData) {
          setInstructorError(t('instructors.notFound'));
          return;
        }
        
        setInstructor(instructorData);
      } catch (err) {
        console.error('Error loading instructor basic data:', err);
        setInstructorError(t('instructors.loadError'));
      } finally {
        setInstructorLoading(false);
      }
    };

    loadInstructorBasicData();
  }, [decodedName, t]);

  // 獲取其他講師的完整信息
  useEffect(() => {
    const fetchOtherInstructorsInfo = async () => {
      if (!reviews || !decodedName) return;
      
      const otherInstructorNames = new Set<string>();
      reviews.forEach(reviewInfo => {
        reviewInfo.instructorDetails.forEach(instructorDetail => {
          if (instructorDetail.instructor_name !== decodedName) {
            otherInstructorNames.add(instructorDetail.instructor_name);
          }
        });
      });

      const newOtherInstructorsMap = new Map<string, Instructor>();
      
      // 並行獲取所有其他講師信息
      const promises = Array.from(otherInstructorNames).map(async (name) => {
        try {
          const instructor = await CourseService.getInstructorByName(name);
          if (instructor) {
            newOtherInstructorsMap.set(name, instructor);
          }
        } catch (error) {
          console.warn(`Failed to fetch instructor info for ${name}:`, error);
        }
      });

      await Promise.all(promises);
      setOtherInstructorsMap(newOtherInstructorsMap);
    };

    fetchOtherInstructorsInfo();
  }, [reviews, decodedName]);

  // Handle scroll to specific review when review_id is in URL
  useEffect(() => {
    const reviewId = searchParams.get('review_id');
    if (reviewId && !loading) {
      let hasScrolled = false;
      let attemptCount = 0;
      const maxAttempts = 3;
      
      const scrollToReview = () => {
        if (hasScrolled || attemptCount >= maxAttempts) return false;
        
        attemptCount++;
        const reviewElement = document.querySelector(`[data-review-id="${reviewId}"]`);
        if (reviewElement) {
          reviewElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          hasScrolled = true;
          return true;
        }
        return false;
      };
      
      // Try multiple times with increasing delays, but stop if successful
      const timeout1 = setTimeout(() => {
        if (!scrollToReview() && attemptCount < maxAttempts) {
          const timeout2 = setTimeout(() => {
            if (!scrollToReview() && attemptCount < maxAttempts) {
              setTimeout(() => scrollToReview(), 700);
            }
          }, 500);
        }
      }, 300);
      
      // Cleanup function to prevent memory leaks
      return () => {
        hasScrolled = true; // Prevent any pending scrolls
      };
    }
  }, [searchParams, loading]);

  const handleCourseClick = (courseCode: string, event?: React.MouseEvent) => {
    // This function is now simplified since we're using <a> tags
    // The browser will handle navigation naturally
  };

  const handleTeachingLanguageBadgeClick = (languageCode: string) => {
    const currentValues = Array.isArray(selectedTeachingLanguageFilter) ? selectedTeachingLanguageFilter : (selectedTeachingLanguageFilter === 'all' ? [] : [selectedTeachingLanguageFilter]);
    const isSelected = currentValues.includes(languageCode);
    
    if (isSelected) {
      // Remove from selection
      const newValues = currentValues.filter(v => v !== languageCode);
      setSelectedTeachingLanguageFilter(newValues.length === 0 ? 'all' : newValues);
    } else {
      // Add to selection
      setSelectedTeachingLanguageFilter([...currentValues, languageCode]);
    }
  };



  const getLanguageDisplayName = (language: string) => {
    const languageMap: { [key: string]: string } = {
      'en': t('language.english'),
      'zh-TW': t('language.traditionalChinese'),
      'zh-CN': t('language.simplifiedChinese')
    };
    return languageMap[language] || language;
  };

  const renderBooleanBadge = (value: boolean, label: string) => {
    return (
      <Badge 
        variant={value ? "default" : "secondary"}
        className={`text-xs shrink-0 ${value ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/20' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
      >
        {value ? (
          <CheckCircle className="h-3 w-3 mr-1 shrink-0" />
        ) : (
          <XCircle className="h-3 w-3 mr-1 shrink-0" />
        )}
        <span className="truncate">{label}</span>
      </Badge>
    );
  };

  const toggleOtherInstructors = (reviewId: string) => {
    setExpandedOtherInstructors(prev => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));
  };

  // 計算篩選器統計數據
  const getFilterCounts = () => {
    if (!reviews) return {
      languageCounts: {},
      termCounts: {},
      courseCounts: {},
      sessionTypeCounts: {},
      teachingLanguageCounts: {},
      gradeCounts: {}
    };

    const languageCounts: { [key: string]: number } = {};
    const termCounts: { [key: string]: { name: string; count: number } } = {};
    const courseCounts: { [key: string]: { title: string; count: number } } = {};
    const sessionTypeCounts: { [key: string]: number } = {};
    const teachingLanguageCounts: { [key: string]: number } = {};
    const gradeCounts: { [key: string]: number } = {};

    reviews.forEach(reviewInfo => {
      // 語言計數
      const reviewLanguage = reviewInfo.review.review_language || 'en';
      languageCounts[reviewLanguage] = (languageCounts[reviewLanguage] || 0) + 1;

      // 學期計數
      const termCode = reviewInfo.term.term_code;
      const termName = reviewInfo.term.name;
      if (!termCounts[termCode]) {
        termCounts[termCode] = { name: termName, count: 0 };
      }
      termCounts[termCode].count++;

      // 課程計數
      const courseCode = reviewInfo.course.course_code;
      const courseTitle = reviewInfo.course.course_title || '';
      if (!courseCounts[courseCode]) {
        courseCounts[courseCode] = { title: courseTitle, count: 0 };
      }
      courseCounts[courseCode].count++;

      // 課堂類型計數和教學語言計數 - 僅計算當前講師的
      const currentInstructorDetail = reviewInfo.instructorDetails.find(detail => detail.instructor_name === decodedName);
      if (currentInstructorDetail) {
        const sessionType = currentInstructorDetail.session_type;
        sessionTypeCounts[sessionType] = (sessionTypeCounts[sessionType] || 0) + 1;

        // 教學語言計數
        const teachingLanguage = getTeachingLanguageForInstructor(
          currentInstructorDetail.instructor_name,
          currentInstructorDetail.session_type
        );
        if (teachingLanguage) {
          teachingLanguageCounts[teachingLanguage] = (teachingLanguageCounts[teachingLanguage] || 0) + 1;
        }
      }

      // 成績計數
      const grade = reviewInfo.review.course_final_grade;
      if (grade) {
        const normalizedGrade = grade === '-1' ? 'N/A' : grade;
        gradeCounts[normalizedGrade] = (gradeCounts[normalizedGrade] || 0) + 1;
      }
    });

    return {
      languageCounts,
      termCounts,
      courseCounts,
      sessionTypeCounts,
      teachingLanguageCounts,
      gradeCounts
    };
  };

  // 篩選評論
  const getFilteredReviews = () => {
    if (!reviews) return [];

    let filteredReviews = reviews.filter(reviewInfo => {
      // 課程要求篩選
      const currentInstructorDetail = reviewInfo.instructorDetails.find(detail => detail.instructor_name === decodedName);
      if (!currentInstructorDetail) return false;

      const checks = [
        requirementsFilters.attendance === 'all' || (requirementsFilters.attendance === 'has' && currentInstructorDetail.has_attendance_requirement) || (requirementsFilters.attendance === 'no' && !currentInstructorDetail.has_attendance_requirement),
        requirementsFilters.quiz === 'all' || (requirementsFilters.quiz === 'has' && currentInstructorDetail.has_quiz) || (requirementsFilters.quiz === 'no' && !currentInstructorDetail.has_quiz),
        requirementsFilters.midterm === 'all' || (requirementsFilters.midterm === 'has' && currentInstructorDetail.has_midterm) || (requirementsFilters.midterm === 'no' && !currentInstructorDetail.has_midterm),
        requirementsFilters.final === 'all' || (requirementsFilters.final === 'has' && currentInstructorDetail.has_final) || (requirementsFilters.final === 'no' && !currentInstructorDetail.has_final),
        requirementsFilters.individualAssignment === 'all' || (requirementsFilters.individualAssignment === 'has' && currentInstructorDetail.has_individual_assignment) || (requirementsFilters.individualAssignment === 'no' && !currentInstructorDetail.has_individual_assignment),
        requirementsFilters.groupProject === 'all' || (requirementsFilters.groupProject === 'has' && currentInstructorDetail.has_group_project) || (requirementsFilters.groupProject === 'no' && !currentInstructorDetail.has_group_project),
        requirementsFilters.presentation === 'all' || (requirementsFilters.presentation === 'has' && currentInstructorDetail.has_presentation) || (requirementsFilters.presentation === 'no' && !currentInstructorDetail.has_presentation),
        requirementsFilters.reading === 'all' || (requirementsFilters.reading === 'has' && currentInstructorDetail.has_reading) || (requirementsFilters.reading === 'no' && !currentInstructorDetail.has_reading)
      ];
      
      return checks.every(check => check);
    });

    // 語言篩選
    if (filters.selectedLanguages.length > 0) {
      filteredReviews = filteredReviews.filter(reviewInfo => {
        const reviewLanguage = reviewInfo.review.review_language || 'en';
        return filters.selectedLanguages.includes(reviewLanguage);
      });
    }

    // 學期篩選
    if (filters.selectedTerms.length > 0) {
      filteredReviews = filteredReviews.filter(reviewInfo => {
        return filters.selectedTerms.includes(reviewInfo.term.term_code);
      });
    }

    // 課程篩選
    if (filters.selectedCourses.length > 0) {
      filteredReviews = filteredReviews.filter(reviewInfo => {
        return filters.selectedCourses.includes(reviewInfo.course.course_code);
      });
    }

    // 課堂類型篩選
    if (filters.selectedSessionTypes.length > 0) {
      filteredReviews = filteredReviews.filter(reviewInfo => {
        const currentInstructorDetail = reviewInfo.instructorDetails.find(detail => detail.instructor_name === decodedName);
        return currentInstructorDetail && filters.selectedSessionTypes.includes(currentInstructorDetail.session_type);
      });
    }

    // 教學語言篩選
    if (filters.selectedTeachingLanguages.length > 0) {
      filteredReviews = filteredReviews.filter(reviewInfo => {
        const currentInstructorDetail = reviewInfo.instructorDetails.find(detail => detail.instructor_name === decodedName);
        if (!currentInstructorDetail) return false;
        
        const teachingLanguage = getTeachingLanguageForInstructor(
          currentInstructorDetail.instructor_name,
          currentInstructorDetail.session_type
        );
        return teachingLanguage && filters.selectedTeachingLanguages.includes(teachingLanguage);
      });
    }

    // 成績篩選
    if (filters.selectedGrades.length > 0) {
      filteredReviews = filteredReviews.filter(reviewInfo => {
        const grade = reviewInfo.review.course_final_grade;
        const normalizedGrade = grade === '-1' ? 'N/A' : grade;
        return filters.selectedGrades.includes(normalizedGrade);
      });
    }

    // 外部成績篩選（來自圖表點擊）
    if (externalGradeFilter) {
      filteredReviews = filteredReviews.filter(reviewInfo => {
        const grade = reviewInfo.review.course_final_grade;
        const normalizedGrade = grade === '-1' ? 'N/A' : grade;
        return normalizedGrade === externalGradeFilter;
      });
    }

    return filteredReviews;
  };

  // 排序評論
  const getSortedReviews = (filteredReviews: (InstructorReviewFromDetails & { upvotes: number; downvotes: number; userVote?: 'up' | 'down' | null })[]) => {
    return [...filteredReviews].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (filters.sortBy) {
        case 'postDate':
          aValue = new Date(a.review.submitted_at || a.review.$createdAt);
          bValue = new Date(b.review.submitted_at || b.review.$createdAt);
          break;
        case 'workload':
          aValue = a.review.course_workload || 0;
          bValue = b.review.course_workload || 0;
          break;
        case 'difficulty':
          aValue = a.review.course_difficulties || 0;
          bValue = b.review.course_difficulties || 0;
          break;
        case 'usefulness':
          aValue = a.review.course_usefulness || 0;
          bValue = b.review.course_usefulness || 0;
          break;
        case 'grade':
          // 成績按字母順序排序，A+ > A > A- > B+ 等
          const gradeOrder = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];
          // Handle N/A grades as worse than F (assign higher value than F's index)
          const getGradeValue = (grade: string) => {
            if (!grade || grade === '-1' || grade === 'N/A') return gradeOrder.length; // N/A worse than F
            const index = gradeOrder.indexOf(grade);
            return index !== -1 ? index : gradeOrder.length + 1; // Unknown grades worse than N/A
          };
          aValue = getGradeValue(a.review.course_final_grade || '');
          bValue = getGradeValue(b.review.course_final_grade || '');
          break;
        case 'teaching':
          // 取當前講師的教學評分
          const aTeaching = a.instructorDetails.find(d => d.instructor_name === decodedName)?.teaching || 0;
          const bTeaching = b.instructorDetails.find(d => d.instructor_name === decodedName)?.teaching || 0;
          aValue = aTeaching;
          bValue = bTeaching;
          break;
        case 'grading':
          // 取當前講師的評分滿意度
          const aGrading = a.instructorDetails.find(d => d.instructor_name === decodedName)?.grading || 0;
          const bGrading = b.instructorDetails.find(d => d.instructor_name === decodedName)?.grading || 0;
          aValue = aGrading;
          bValue = bGrading;
          break;
        case 'upvotes':
          aValue = a.upvotes || 0;
          bValue = b.upvotes || 0;
          break;
        case 'downvotes':
          aValue = a.downvotes || 0;
          bValue = b.downvotes || 0;
          break;
        default:
          aValue = new Date(a.review.submitted_at || a.review.$createdAt);
          bValue = new Date(b.review.submitted_at || b.review.$createdAt);
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  };

  // 分頁邏輯
  const getPaginatedReviews = (sortedReviews: (InstructorReviewFromDetails & { upvotes: number; downvotes: number; userVote?: 'up' | 'down' | null })[]) => {
    const startIndex = (filters.currentPage - 1) * filters.itemsPerPage;
    const endIndex = startIndex + filters.itemsPerPage;
    return sortedReviews.slice(startIndex, endIndex);
  };

  // 獲取最終顯示的評論
  const filteredReviews = getFilteredReviews();
  const sortedReviews = getSortedReviews(filteredReviews);
  const paginatedReviews = getPaginatedReviews(sortedReviews);
  const totalPages = Math.ceil(filteredReviews.length / filters.itemsPerPage);

  // 獲取篩選器統計數據
  const { languageCounts, termCounts, courseCounts, sessionTypeCounts, teachingLanguageCounts, gradeCounts } = getFilterCounts();

  // 處理篩選器變更
  const handleFiltersChange = (newFilters: InstructorReviewFilters) => {
    setFilters(newFilters);
  };

  // 清除所有篩選器
  const handleClearAllFilters = () => {
    setFilters({
      selectedLanguages: [],
      selectedTerms: [],
      selectedCourses: [],
      selectedSessionTypes: [],
      selectedTeachingLanguages: [],
      selectedGrades: [],
      sortBy: 'postDate',
      sortOrder: 'desc',
      itemsPerPage: 6,
      currentPage: 1
    });
    
    // 同時清空課程要求篩選
    setRequirementsFilters({
      attendance: 'all',
      quiz: 'all',
      midterm: 'all',
      final: 'all',
      individualAssignment: 'all',
      groupProject: 'all',
      presentation: 'all',
      reading: 'all'
    });
  };

  // 處理分頁變更
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, currentPage: page }));
    // 滾動到頁面頂部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">{t('instructors.loading')}</p>
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
                {t('instructors.backToList')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 overflow-hidden">
      {/* Instructor Header - Always visible above tabs */}
      <div className="mb-6">
        {instructor && (
          <Card className="course-card">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <GraduationCap className="h-8 w-8 text-primary shrink-0" />
                    <div className="min-w-0">
                      <CardTitle className="text-2xl truncate">{instructor.name}</CardTitle>
                      {/* 中文講師名稱 - 作為副標題（只在中文模式下顯示） */}
                      {(language === 'zh-TW' || language === 'zh-CN') && (() => {
                        const chineseName = language === 'zh-TW' ? instructor.name_tc : instructor.name_sc;
                        return chineseName && (
                          <p className="text-base text-gray-500 dark:text-gray-500 mt-1 min-h-[1.25rem]">
                            {chineseName}
                          </p>
                        );
                      })()}
                    </div>
                  </div>
                  
                  {/* 系所徽章 */}
                  <div className="flex flex-wrap items-center gap-1 sm:gap-1.5" style={{ minHeight: '2rem' }}>
                    {/* Faculty Badge */}
                    {(() => {
                      const faculty = getFacultyByDepartment(instructor.department);
                      return faculty && (
                        <Badge 
                          variant="outline"
                          className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 shrink-0 w-fit"
                        >
                          {t(faculty)}
                        </Badge>
                      );
                    })()}
                    {/* Department Badge */}
                    <Badge 
                      variant="outline"
                      className="text-xs bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 shrink-0 w-fit max-w-full"
                    >
                      <span className="break-words hyphens-auto">
                        {language === 'en' ? `Department of ${translateDepartmentName(instructor.department, t)}` : translateDepartmentName(instructor.department, t)}
                      </span>
                    </Badge>
                    {/* Current Term Teaching Badge */}
                    {isTeachingInCurrentTerm !== null && (
                      <Badge 
                        variant={isTeachingInCurrentTerm ? "default" : "outline"}
                        className={`text-xs cursor-pointer transition-colors ${
                          isTeachingInCurrentTerm 
                            ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' 
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                        }`}
                        onClick={handleTeachingBadgeClick}
                      >
                        <div className="flex items-center gap-1">
                          {isTeachingInCurrentTerm ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          <span>
                            {isTeachingInCurrentTerm ? t('offered.yes') : t('offered.no')} ({currentTermName})
                          </span>
                        </div>
                      </Badge>
                    )}
                  </div>
                  
                  {/* 電子郵件 */}
                  {instructor.email && (
                    <div className="flex items-center gap-2 mt-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={`mailto:${instructor.email}`} 
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        {instructor.email}
                      </a>
                    </div>
                  )}
                </div>
                <div className="shrink-0 -mt-2 sm:mt-0">
                  <FavoriteButton
                    type="instructor"
                    itemId={instructor.name}
                    size="lg"
                    showText={true}
                    variant="outline"
                  />
                </div>
              </div>
              
              {/* 講師基本統計信息 - 響應式佈局 */}
              <div className="pt-4 border-t">
                {/* Mobile: 統計在兩行 */}
                <div className="grid grid-cols-1 gap-4 sm:hidden">
                  <div className="grid grid-cols-2 gap-4">
                    {/* 平均教學質素 */}
                    <div className="text-center min-w-0">
                      <div className="text-lg font-bold text-primary">
                        {detailedStats.averageTeachingQuality > 0 ? (
                          detailedStats.averageTeachingQuality.toFixed(2)
                        ) : (
                          'N/A'
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{t('instructors.averageTeaching')}</div>
                    </div>
                    
                    {/* 評分滿意度 */}
                    <div className="text-center min-w-0">
                      <div className="text-lg font-bold text-primary">
                        {detailedStats.averageGradingSatisfaction > 0 ? (
                          detailedStats.averageGradingSatisfaction.toFixed(2)
                        ) : (
                          'N/A'
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{t('instructors.averageGrading')}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* 評論數量 */}
                    <div className="text-center min-w-0">
                      <div className="text-lg font-bold text-primary">
                        {allReviews?.length || 0}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {t('instructors.reviews')}
                      </div>
                    </div>
                    
                    {/* 教授課程數 */}
                    <div className="text-center min-w-0">
                      <div className="text-lg font-bold text-primary">
                        {uniqueCourses.length || 0}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {t('instructors.courses')}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Desktop: 統一使用 4 列佈局 */}
                <div className="hidden sm:grid sm:grid-cols-4 gap-4">
                  {/* 平均教學質素 */}
                  <div className="text-center min-w-0">
                    <div className="text-xl font-bold text-primary">
                      {detailedStats.averageTeachingQuality > 0 ? (
                        detailedStats.averageTeachingQuality.toFixed(2)
                      ) : (
                        'N/A'
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">{t('instructors.averageTeaching')}</div>
                  </div>
                  
                  {/* 評分滿意度 */}
                  <div className="text-center min-w-0">
                    <div className="text-xl font-bold text-primary">
                      {detailedStats.averageGradingSatisfaction > 0 ? (
                        detailedStats.averageGradingSatisfaction.toFixed(2)
                      ) : (
                        'N/A'
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">{t('instructors.averageGrading')}</div>
                  </div>
                  
                  {/* 評論數量 */}
                  <div className="text-center min-w-0">
                    <div className="text-xl font-bold text-primary">
                      {allReviews?.length || 0}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      {t('instructors.reviews')}
                    </div>
                  </div>
                  
                  {/* 教授課程數 */}
                  <div className="text-center min-w-0">
                    <div className="text-xl font-bold text-primary">
                      {uniqueCourses.length || 0}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {t('instructors.courses')}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Tabs defaultValue="reviews" className="w-full">
        {/* Tab Navigation */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b mb-6 -mx-4 px-4 pb-4">
          <TabsList className="bg-muted/30 p-1 rounded-lg border shadow-sm w-full md:w-auto">
            <TabsTrigger 
              value="reviews" 
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm hover:bg-muted/50"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">{t('review.studentReviews')}</span>
              <span className="sm:hidden">{t('common.reviews')}</span>
              {allReviews && allReviews.length > 0 && (
                <div className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs font-semibold">
                  {allReviews.length}
                </div>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="courses" 
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm hover:bg-muted/50"
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">{t('instructors.teachingCourses')}</span>
              <span className="sm:hidden">{t('common.courses')}</span>
              {isTeachingInCurrentTerm && (
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="grades" 
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm hover:bg-muted/50"
            >
              <Info className="h-4 w-4" />
              <span className="hidden sm:inline">{t('chart.gradeDistribution')}</span>
              <span className="sm:hidden">{t('common.grades')}</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Instructor Info Tab */}
        <TabsContent value="info" className="mt-0">
          {instructor && (
            <Card className="course-card">
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* 詳細統計說明 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {reviewsLoading ? (
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        ) : reviews.length > 0 ? (
                          (() => {
                            const validRatings = reviews
                              .map(r => r.instructorDetails.find(detail => detail.instructor_name === decodedName)?.teaching)
                              .filter(rating => rating !== null && rating !== undefined && rating !== -1);
                            return validRatings.length > 0 
                              ? (validRatings.reduce((sum, rating) => sum + rating!, 0) / validRatings.length).toFixed(2).replace(/\.?0+$/, '')
                              : 'N/A';
                          })()
                        ) : (
                          'N/A'
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">{t('instructors.averageTeachingQuality')}</div>
                      {!reviewsLoading && reviews.length === 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {t('instructors.noRatingData')}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {reviewsLoading ? (
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        ) : reviews.length > 0 ? (
                          (() => {
                            const validRatings = reviews
                              .map(r => r.instructorDetails.find(detail => detail.instructor_name === decodedName)?.grading)
                              .filter(rating => rating !== null && rating !== undefined && rating !== -1);
                            return validRatings.length > 0 
                              ? (validRatings.reduce((sum, rating) => sum + rating!, 0) / validRatings.length).toFixed(2).replace(/\.?0+$/, '')
                              : 'N/A';
                          })()
                        ) : (
                          'N/A'
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">{t('instructors.averageGradingSatisfaction')}</div>
                      {!reviewsLoading && reviews.length === 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {t('instructors.noRatingData')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 成績分佈圖表 */}
                  {!reviewsLoading && reviews.length > 0 && (
                    <div>
                      <GradeDistributionChart
                        gradeDistribution={calculateGradeDistributionFromReviews(filteredReviewsForChart.map(review => ({ course_final_grade: review.review.course_final_grade })))}
                        loading={reviewsLoading}
                        title={t('chart.gradeDistribution')}
                        height={120}
                        showPercentage={true}
                        className="bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800"
                        context="instructor"
                        filterOptions={gradeChartFilterOptions}
                        selectedFilter={selectedGradeChartFilter}
                        onFilterChange={setSelectedGradeChartFilter}
                        filterLabel={t('chart.filterByCourse')}
                        rawReviewData={filteredReviewsForChart}
                        defaultExpanded={true}
                        onBarClick={(grade) => {
                          // 設置成績篩選並滾動到學生評論區域
                          setExternalGradeFilter(grade);
                          setFilters(prev => ({
                            ...prev,
                            selectedGrades: [grade],
                            currentPage: 1
                          }));
                          
                          // 短暫延遲後滾動，讓篩選生效
                          setTimeout(() => {
                            const studentReviewsElement = document.getElementById('instructor-student-reviews');
                            if (studentReviewsElement) {
                              studentReviewsElement.scrollIntoView({ 
                                behavior: 'smooth', 
                                block: 'start' 
                              });
                            }
                          }, 100);
                        }}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Teaching Courses Tab */}
        <TabsContent value="courses" className="mt-0">
          <Card className="course-card">
            <CardContent className="p-6">
          {teachingCoursesLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">{t('instructors.loadingCourses')}</p>
            </div>
          ) : teachingCourses.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t('instructors.noTeachingTitle')}</p>
            </div>
          ) : (
            <Tabs value={activeTeachingTab} onValueChange={setActiveTeachingTab} className="w-full">
              {/* Mobile: Tabs and filters in separate rows */}
              <div className="flex flex-col gap-4 mb-4 md:hidden">
                {/* Tab switcher row */}
                <TabsList className="bg-muted/50 backdrop-blur-sm w-full">
                  <TabsTrigger 
                    value="lecture" 
                    className="hover:shadow-md transition-[transform,box-shadow] duration-200 data-[state=active]:shadow-lg flex-1"
                  >
                    <div className="flex items-center gap-2">
                      <span>{t('sessionType.lecture')}</span>
                      <div className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-semibold">
                        {filteredTeachingCourses.filter(teaching => teaching.sessionType === 'Lecture').length}
                      </div>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="tutorial" 
                    className="hover:shadow-md transition-[transform,box-shadow] duration-200 data-[state=active]:shadow-lg flex-1"
                  >
                    <div className="flex items-center gap-2">
                      <span>{t('sessionType.tutorial')}</span>
                      <div className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-semibold">
                        {filteredTeachingCourses.filter(teaching => teaching.sessionType === 'Tutorial').length}
                      </div>
                    </div>
                  </TabsTrigger>
                </TabsList>

                {/* Filters row */}
                <div className="grid grid-cols-1 gap-2">
                  {/* Term filter */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 shrink-0 w-24">
                      <Calendar className="h-4 w-4" />
                      {t('pages.courseDetail.filterByTerm')}
                    </label>
                    <MultiSelectDropdown
                      options={availableTerms.map((term): SelectOption => ({
                        value: term.term_code,
                        label: term.name,
                        count: teachingCourses?.filter(tc => tc.term.term_code === term.term_code).length || 0
                      }))}
                      selectedValues={(() => {
                        const values = Array.isArray(selectedTermFilter) ? selectedTermFilter : (selectedTermFilter ? [selectedTermFilter] : []);
                        if (values.length === 0 || values.includes('all')) {
                          return [];
                        }
                        return values;
                      })()}
                      onSelectionChange={(values: string[]) => {
                        if (values.length === 0) {
                          setSelectedTermFilter('all');
                        } else {
                          setSelectedTermFilter(values);
                        }
                      }}
                      placeholder={t('common.all')}
                      className="flex-1 h-10 text-sm"
                      showCounts={true}
                      maxHeight="max-h-48"
                      totalCount={teachingCourses?.length || 0}
                    />
                  </div>

                  {/* Teaching language filter */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 shrink-0 w-24">
                      <BookOpen className="h-4 w-4" />
                      {t('pages.courseDetail.filterByTeachingLanguage')}
                    </label>
                    <MultiSelectDropdown
                      options={(() => {
                        const languageCounts = new Map<string, number>();
                        teachingCourses.forEach(teaching => {
                          const teachingLanguage = getTeachingLanguageForTeachingRecord(
                            teaching.course.course_code,
                            teaching.term.term_code,
                            teaching.sessionType
                          );
                          if (teachingLanguage) {
                            languageCounts.set(teachingLanguage, (languageCounts.get(teachingLanguage) || 0) + 1);
                          }
                        });
                        
                        // Define the desired order: E, C, P, 1, 2, 3, 4, 5
                        const teachingLanguageOrder = ['E', 'C', 'P', '1', '2', '3', '4', '5'];
                        
                        return Array.from(languageCounts.entries())
                          .sort(([a], [b]) => {
                            const aIndex = teachingLanguageOrder.indexOf(a);
                            const bIndex = teachingLanguageOrder.indexOf(b);
                            
                            // If both languages are in the order list, sort by their position
                            if (aIndex !== -1 && bIndex !== -1) {
                              return aIndex - bIndex;
                            }
                            
                            // If only one is in the order list, it comes first
                            if (aIndex !== -1) return -1;
                            if (bIndex !== -1) return 1;
                            
                            // If neither is in the order list, sort alphabetically
                            return a.localeCompare(b);
                          })
                          .map(([language, count]): SelectOption => ({
                            value: language,
                            label: `${language} - ${getTeachingLanguageName(language, t)}`,
                            count
                          }));
                      })()}
                      selectedValues={(() => {
                        const values = Array.isArray(selectedTeachingLanguageFilter) ? selectedTeachingLanguageFilter : (selectedTeachingLanguageFilter === 'all' ? [] : [selectedTeachingLanguageFilter]);
                        if (values.length === 0 || values.includes('all')) {
                          return [];
                        }
                        return values;
                      })()}
                      onSelectionChange={(values: string[]) => {
                        if (values.length === 0) {
                          setSelectedTeachingLanguageFilter('all');
                        } else {
                          setSelectedTeachingLanguageFilter(values);
                        }
                      }}
                      placeholder={t('common.all')}
                      className="flex-1 h-10 text-sm"
                      showCounts={true}
                      maxHeight="max-h-48"
                      totalCount={teachingCourses?.length || 0}
                    />
                  </div>
                </div>
              </div>

              {/* Desktop: Tab switcher and filters in the same row */}
              <div className="hidden md:flex md:items-center md:justify-between md:gap-4 mb-4">
                <TabsList className="bg-muted/50 backdrop-blur-sm">
                  <TabsTrigger 
                    value="lecture" 
                    className="hover:shadow-md transition-[transform,box-shadow] duration-200 data-[state=active]:shadow-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span>{t('sessionType.lecture')}</span>
                      <div className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-semibold">
                        {filteredTeachingCourses.filter(teaching => teaching.sessionType === 'Lecture').length}
                      </div>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="tutorial" 
                    className="hover:shadow-md transition-[transform,box-shadow] duration-200 data-[state=active]:shadow-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span>{t('sessionType.tutorial')}</span>
                      <div className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-semibold">
                        {filteredTeachingCourses.filter(teaching => teaching.sessionType === 'Tutorial').length}
                      </div>
                    </div>
                  </TabsTrigger>
                </TabsList>

                {/* Desktop filters - inline with tab switcher */}
                <div className="flex items-center gap-4 ml-auto">
                  {/* Term filter */}
                  <div className="flex items-center gap-2 shrink-0">
                    <label className="flex items-center gap-1 text-sm font-medium text-muted-foreground whitespace-nowrap">
                      <Calendar className="h-4 w-4" />
                      {t('pages.courseDetail.filterByTerm')}
                    </label>
                    <MultiSelectDropdown
                      options={availableTerms.map((term): SelectOption => ({
                        value: term.term_code,
                        label: term.name,
                        count: teachingCourses?.filter(tc => tc.term.term_code === term.term_code).length || 0
                      }))}
                      selectedValues={(() => {
                        const values = Array.isArray(selectedTermFilter) ? selectedTermFilter : (selectedTermFilter ? [selectedTermFilter] : []);
                        if (values.length === 0 || values.includes('all')) {
                          return [];
                        }
                        return values;
                      })()}
                      onSelectionChange={(values: string[]) => {
                        if (values.length === 0) {
                          setSelectedTermFilter('all');
                        } else {
                          setSelectedTermFilter(values);
                        }
                      }}
                      placeholder={t('common.all')}
                      className="w-[180px] h-10 text-sm"
                      showCounts={true}
                      maxHeight="max-h-48"
                      totalCount={teachingCourses?.length || 0}
                    />
                  </div>
                  
                  {/* Teaching language filter */}
                  <div className="flex items-center gap-2 shrink-0">
                    <label className="flex items-center gap-1 text-sm font-medium text-muted-foreground whitespace-nowrap">
                      <BookOpen className="h-4 w-4" />
                      {t('pages.courseDetail.filterByTeachingLanguage')}
                    </label>
                    <MultiSelectDropdown
                      options={(() => {
                        const languageCounts = new Map<string, number>();
                        teachingCourses.forEach(teaching => {
                          const teachingLanguage = getTeachingLanguageForTeachingRecord(
                            teaching.course.course_code,
                            teaching.term.term_code,
                            teaching.sessionType
                          );
                          if (teachingLanguage) {
                            languageCounts.set(teachingLanguage, (languageCounts.get(teachingLanguage) || 0) + 1);
                          }
                        });
                        
                        // Define the desired order: E, C, P, 1, 2, 3, 4, 5
                        const teachingLanguageOrder = ['E', 'C', 'P', '1', '2', '3', '4', '5'];
                        
                        return Array.from(languageCounts.entries())
                          .sort(([a], [b]) => {
                            const aIndex = teachingLanguageOrder.indexOf(a);
                            const bIndex = teachingLanguageOrder.indexOf(b);
                            
                            // If both languages are in the order list, sort by their position
                            if (aIndex !== -1 && bIndex !== -1) {
                              return aIndex - bIndex;
                            }
                            
                            // If only one is in the order list, it comes first
                            if (aIndex !== -1) return -1;
                            if (bIndex !== -1) return 1;
                            
                            // If neither is in the order list, sort alphabetically
                            return a.localeCompare(b);
                          })
                          .map(([language, count]): SelectOption => ({
                            value: language,
                            label: `${language} - ${getTeachingLanguageName(language, t)}`,
                            count
                          }));
                      })()}
                      selectedValues={(() => {
                        const values = Array.isArray(selectedTeachingLanguageFilter) ? selectedTeachingLanguageFilter : (selectedTeachingLanguageFilter === 'all' ? [] : [selectedTeachingLanguageFilter]);
                        if (values.length === 0 || values.includes('all')) {
                          return [];
                        }
                        return values;
                      })()}
                      onSelectionChange={(values: string[]) => {
                        if (values.length === 0) {
                          setSelectedTeachingLanguageFilter('all');
                        } else {
                          setSelectedTeachingLanguageFilter(values);
                        }
                      }}
                      placeholder={t('common.all')}
                      className="w-[180px] h-10 text-sm"
                      showCounts={true}
                      maxHeight="max-h-48"
                      totalCount={teachingCourses?.length || 0}
                    />
                  </div>
                </div>
              </div>

              <TabsContent value="lecture" className="mt-0">
                {filteredTeachingCourses.filter(teaching => teaching.sessionType === 'Lecture').length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">{t('instructors.noLectureRecords')}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Group by course and sort alphabetically */}
                    {Object.entries(
                      filteredTeachingCourses
                        .filter(teaching => teaching.sessionType === 'Lecture')
                        .reduce((acc, teaching) => {
                          const courseCode = teaching.course.course_code;
                          if (!acc[courseCode]) {
                            acc[courseCode] = {
                              course: teaching.course,
                              terms: []
                            };
                          }
                          acc[courseCode].terms.push(teaching.term);
                          return acc;
                        }, {} as Record<string, { course: any; terms: any[] }>)
                    )
                    .sort(([a], [b]) => a.localeCompare(b)) // Sort by course code alphabetically
                    .map(([courseCode, data]) => (
                      <div key={courseCode} className="flex items-center justify-between p-3 rounded-lg ">
                        {/* Left side: Course info */}
                        <div className="flex-shrink-0">
                          <a
                            href={`/courses/${encodeURIComponent(courseCode)}`}
                            onClick={(e) => {
                              if (e.ctrlKey || e.metaKey || e.button === 1) {
                                return;
                              }
                              e.preventDefault();
                              navigate(`/courses/${encodeURIComponent(courseCode)}`);
                            }}
                            className="font-medium text-sm hover:text-primary transition-colors"
                          >
                            <div className="flex flex-col">
                              {/* 課程代碼 - 作為主標題 */}
                              <span className="font-mono font-semibold">{courseCode}</span>
                              {/* 英文課程名稱 - 作為副標題 */}
                              <span className="text-sm text-muted-foreground font-normal">{data.course.course_title}</span>
                              {/* 中文課程名稱 - 作為次副標題（只在中文模式下顯示） */}
                              {(language === 'zh-TW' || language === 'zh-CN') && (() => {
                                const chineseName = language === 'zh-TW' ? data.course.course_title_tc : data.course.course_title_sc;
                                return chineseName && (
                                  <span className="text-xs text-muted-foreground font-normal">
                                    {chineseName}
                                  </span>
                                );
                              })()}
                            </div>
                          </a>
                        </div>
                        
                        {/* Right side: Combined Term and Teaching Language Badges */}
                        <div className="flex items-center gap-2 flex-wrap justify-end">
                          {data.terms
                            .sort((a, b) => b.term_code.localeCompare(a.term_code)) // Sort terms by code descending
                            .map((term, termIndex) => {
                              // Find the teaching language for this specific term, course, and instructor
                              const teachingLanguage = getTeachingLanguageForTeachingRecord(
                                courseCode,
                                term.term_code,
                                'Lecture'
                              );
                              
                              return (
                                <div key={termIndex} className="flex items-center">
                                  {/* Combined term and teaching language badge */}
                                  {teachingLanguage ? (
                                    <div className="inline-flex rounded-md border border-border overflow-hidden transition-colors hover:border-primary/50">
                                      {/* Term part (left side) */}
                                      <button
                                        onClick={() => {
                                          const currentValues = Array.isArray(selectedTermFilter) ? selectedTermFilter : (selectedTermFilter === 'all' ? [] : [selectedTermFilter]);
                                          const isSelected = currentValues.includes(term.term_code);
                                          
                                          if (isSelected) {
                                            // Remove from selection
                                            const newValues = currentValues.filter(v => v !== term.term_code);
                                            setSelectedTermFilter(newValues.length === 0 ? 'all' : newValues);
                                          } else {
                                            // Add to selection
                                            setSelectedTermFilter([...currentValues, term.term_code]);
                                          }
                                        }}
                                        className={`px-2 py-1 text-xs transition-colors ${
                                          (() => {
                                            const currentValues = Array.isArray(selectedTermFilter) ? selectedTermFilter : (selectedTermFilter === 'all' ? [] : [selectedTermFilter]);
                                            return currentValues.includes(term.term_code)
                                              ? 'bg-primary text-primary-foreground'
                                              : 'bg-background hover:bg-muted';
                                          })()
                                        }`}
                                        title={`Filter by term: ${term.name}`}
                                      >
                                        {term.name}
                                      </button>
                                      
                                      {/* Divider */}
                                      <div className="w-px bg-border"></div>
                                      
                                      {/* Teaching language part (right side) */}
                                      <button
                                        onClick={() => handleTeachingLanguageBadgeClick(teachingLanguage)}
                                        className={`px-2 py-1 text-xs transition-colors ${
                                          (() => {
                                            const currentLanguageValues = Array.isArray(selectedTeachingLanguageFilter) ? selectedTeachingLanguageFilter : (selectedTeachingLanguageFilter === 'all' ? [] : [selectedTeachingLanguageFilter]);
                                            const isLanguageSelected = currentLanguageValues.includes(teachingLanguage);
                                            return isLanguageSelected
                                              ? 'bg-orange-500 text-orange-50 font-bold'
                                              : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/50';
                                          })()
                                        }`}
                                        title={`${t('filter.clickToFilterByTeachingLanguage', { language: getTeachingLanguageName(teachingLanguage, t) || teachingLanguage })}`}
                                      >
                                        {teachingLanguage}
                                      </button>
                                    </div>
                                  ) : (
                                    // Fallback to term-only badge if no teaching language
                                    <button
                                      onClick={() => {
                                        const currentValues = Array.isArray(selectedTermFilter) ? selectedTermFilter : (selectedTermFilter === 'all' ? [] : [selectedTermFilter]);
                                        const isSelected = currentValues.includes(term.term_code);
                                        
                                        if (isSelected) {
                                          // Remove from selection
                                          const newValues = currentValues.filter(v => v !== term.term_code);
                                          setSelectedTermFilter(newValues.length === 0 ? 'all' : newValues);
                                        } else {
                                          // Add to selection
                                          setSelectedTermFilter([...currentValues, term.term_code]);
                                        }
                                      }}
                                      className={`px-2 py-1 text-xs rounded-md transition-colors border ${
                                        (() => {
                                          const currentValues = Array.isArray(selectedTermFilter) ? selectedTermFilter : (selectedTermFilter === 'all' ? [] : [selectedTermFilter]);
                                          return currentValues.includes(term.term_code)
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-background hover:bg-muted border-border hover:border-primary/50';
                                        })()
                                      }`}
                                    >
                                      {term.name}
                                    </button>
                                  )}
                                </div>
                              );
                            })
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="tutorial" className="mt-0">
                {filteredTeachingCourses.filter(teaching => teaching.sessionType === 'Tutorial').length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">{t('instructors.noTutorialRecords')}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Group by course and sort alphabetically */}
                    {Object.entries(
                      filteredTeachingCourses
                        .filter(teaching => teaching.sessionType === 'Tutorial')
                        .reduce((acc, teaching) => {
                          const courseCode = teaching.course.course_code;
                          if (!acc[courseCode]) {
                            acc[courseCode] = {
                              course: teaching.course,
                              terms: []
                            };
                          }
                          acc[courseCode].terms.push(teaching.term);
                          return acc;
                        }, {} as Record<string, { course: any; terms: any[] }>)
                    )
                    .sort(([a], [b]) => a.localeCompare(b)) // Sort by course code alphabetically
                    .map(([courseCode, data]) => (
                      <div key={courseCode} className="flex items-center justify-between p-3 rounded-lg ">
                        {/* Left side: Course info */}
                        <div className="flex-shrink-0">
                          <a
                            href={`/courses/${encodeURIComponent(courseCode)}`}
                            onClick={(e) => {
                              if (e.ctrlKey || e.metaKey || e.button === 1) {
                                return;
                              }
                              e.preventDefault();
                              navigate(`/courses/${encodeURIComponent(courseCode)}`);
                            }}
                            className="font-medium text-sm hover:text-primary transition-colors"
                          >
                            <div className="flex flex-col">
                              {/* 課程代碼 - 作為主標題 */}
                              <span className="font-mono font-semibold">{courseCode}</span>
                              {/* 英文課程名稱 - 作為副標題 */}
                              <span className="text-sm text-muted-foreground font-normal">{data.course.course_title}</span>
                              {/* 中文課程名稱 - 作為次副標題（只在中文模式下顯示） */}
                              {(language === 'zh-TW' || language === 'zh-CN') && (() => {
                                const chineseName = language === 'zh-TW' ? data.course.course_title_tc : data.course.course_title_sc;
                                return chineseName && (
                                  <span className="text-xs text-muted-foreground font-normal">
                                    {chineseName}
                                  </span>
                                );
                              })()}
                            </div>
                          </a>
                        </div>
                        
                        {/* Right side: Combined Term and Teaching Language Badges */}
                        <div className="flex items-center gap-2 flex-wrap justify-end">
                          {data.terms
                            .sort((a, b) => b.term_code.localeCompare(a.term_code)) // Sort terms by code descending
                            .map((term, termIndex) => {
                              // Find the teaching language for this specific term, course, and instructor
                              const teachingLanguage = getTeachingLanguageForTeachingRecord(
                                courseCode,
                                term.term_code,
                                'Tutorial'
                              );
                              
                              return (
                                <div key={termIndex} className="flex items-center">
                                  {/* Combined term and teaching language badge */}
                                  {teachingLanguage ? (
                                    <div className="inline-flex rounded-md border border-border overflow-hidden transition-colors hover:border-primary/50">
                                      {/* Term part (left side) */}
                                      <button
                                        onClick={() => {
                                          const currentValues = Array.isArray(selectedTermFilter) ? selectedTermFilter : (selectedTermFilter === 'all' ? [] : [selectedTermFilter]);
                                          const isSelected = currentValues.includes(term.term_code);
                                          
                                          if (isSelected) {
                                            // Remove from selection
                                            const newValues = currentValues.filter(v => v !== term.term_code);
                                            setSelectedTermFilter(newValues.length === 0 ? 'all' : newValues);
                                          } else {
                                            // Add to selection
                                            setSelectedTermFilter([...currentValues, term.term_code]);
                                          }
                                        }}
                                        className={`px-2 py-1 text-xs transition-colors ${
                                          (() => {
                                            const currentValues = Array.isArray(selectedTermFilter) ? selectedTermFilter : (selectedTermFilter === 'all' ? [] : [selectedTermFilter]);
                                            return currentValues.includes(term.term_code)
                                              ? 'bg-primary text-primary-foreground'
                                              : 'bg-background hover:bg-muted';
                                          })()
                                        }`}
                                        title={`Filter by term: ${term.name}`}
                                      >
                                        {term.name}
                                      </button>
                                      
                                      {/* Divider */}
                                      <div className="w-px bg-border"></div>
                                      
                                      {/* Teaching language part (right side) */}
                                      <button
                                        onClick={() => handleTeachingLanguageBadgeClick(teachingLanguage)}
                                        className={`px-2 py-1 text-xs transition-colors ${
                                          (() => {
                                            const currentLanguageValues = Array.isArray(selectedTeachingLanguageFilter) ? selectedTeachingLanguageFilter : (selectedTeachingLanguageFilter === 'all' ? [] : [selectedTeachingLanguageFilter]);
                                            const isLanguageSelected = currentLanguageValues.includes(teachingLanguage);
                                            return isLanguageSelected
                                              ? 'bg-orange-500 text-orange-50 font-bold'
                                              : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/50';
                                          })()
                                        }`}
                                        title={`${t('filter.clickToFilterByTeachingLanguage', { language: getTeachingLanguageName(teachingLanguage, t) || teachingLanguage })}`}
                                      >
                                        {teachingLanguage}
                                      </button>
                                    </div>
                                  ) : (
                                    // Fallback to term-only badge if no teaching language
                                    <button
                                      onClick={() => {
                                        const currentValues = Array.isArray(selectedTermFilter) ? selectedTermFilter : (selectedTermFilter === 'all' ? [] : [selectedTermFilter]);
                                        const isSelected = currentValues.includes(term.term_code);
                                        
                                        if (isSelected) {
                                          // Remove from selection
                                          const newValues = currentValues.filter(v => v !== term.term_code);
                                          setSelectedTermFilter(newValues.length === 0 ? 'all' : newValues);
                                        } else {
                                          // Add to selection
                                          setSelectedTermFilter([...currentValues, term.term_code]);
                                        }
                                      }}
                                      className={`px-2 py-1 text-xs rounded-md transition-colors border ${
                                        (() => {
                                          const currentValues = Array.isArray(selectedTermFilter) ? selectedTermFilter : (selectedTermFilter === 'all' ? [] : [selectedTermFilter]);
                                          return currentValues.includes(term.term_code)
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-background hover:bg-muted border-border hover:border-primary/50';
                                        })()
                                      }`}
                                    >
                                      {term.name}
                                    </button>
                                  )}
                                </div>
                              );
                            })
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Student Reviews Tab */}
        <TabsContent value="reviews" className="mt-0">
                    <div id="instructor-student-reviews">
            <Card className="course-card">
              <CardContent className="p-6 space-y-4">
          {/* 篩選器 - 只有當有評論且不在載入狀態時才顯示 */}
          {reviews && reviews.length > 0 && !reviewsLoading && (
            <>
              {/* 課程要求篩選器 */}
              <CourseRequirementsFilter
                filters={requirementsFilters}
                onFiltersChange={setRequirementsFilters}
              />
              
              <InstructorReviewsFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              languageCounts={languageCounts}
              termCounts={termCounts}
              courseCounts={courseCounts}
              sessionTypeCounts={sessionTypeCounts}
              teachingLanguageCounts={teachingLanguageCounts}
              gradeCounts={gradeCounts}
              totalReviews={reviews.length}
              filteredReviews={filteredReviews.length}
              onClearAll={handleClearAllFilters}
            />
            </>
          )}
          
          {reviewsLoading ? (
            <div className="text-center py-12 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">{t('instructors.loadingReviews')}</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-muted/50 rounded-full">
                  <MessageSquare className="h-12 w-12 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-muted-foreground">{t('instructors.noReviewsTitle')}</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {t('instructors.noReviewsDesc', { name: instructor?.name || '' })}
                </p>
              </div>
              <div className="pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/courses')}
                  className="gap-2 h-12 text-base font-medium"
                >
                  <BookOpen className="h-4 w-4" />
                  {t('instructors.browseCoursesToReview')}
                </Button>
              </div>
            </div>
          ) : paginatedReviews.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-muted/50 rounded-full">
                  <MessageSquare className="h-12 w-12 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-muted-foreground">沒有符合篩選條件的評論</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  請嘗試調整篩選條件
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {paginatedReviews.map((reviewInfo, index) => (
                <div key={index} data-review-id={reviewInfo.review.$id} className="rounded-lg p-4 space-y-4 overflow-hidden bg-card border border-border dark:bg-[#202936] dark:border-[#2a3441]">
                  {/* 評論基本信息 */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-2 min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <ReviewAvatar
                          isAnonymous={reviewInfo.review.is_anon}
                          userId={reviewInfo.review.user_id}
                          username={reviewInfo.review.username}
                          reviewId={reviewInfo.review.$id}
                          size="sm"
                          className="shrink-0"
                        />
                        <span className="font-medium truncate">
                          {reviewInfo.review.is_anon ? t('review.anonymousUser') : reviewInfo.review.username}
                        </span>
                        {/* 學期徽章 - 桌面版顯示在用戶名旁邊 */}
                        <button
                          className="px-2 py-1 text-xs rounded-md transition-colors border bg-background hover:bg-muted border-border hover:border-primary/50 shrink-0 hidden md:inline-flex cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // 設置學期篩選
                            handleFiltersChange({
                              ...filters,
                              selectedTerms: [reviewInfo.term.term_code],
                              currentPage: 1
                            });
                          }}
                          title={t('filter.clickToFilterByTerm', { term: reviewInfo.term.name })}
                        >
                          <span className="truncate">{reviewInfo.term.name}</span>
                        </button>
                        {/* 語言徽章 - 桌面版顯示在學期徽章旁邊 */}
                        <button
                          className="px-2 py-1 text-xs rounded-md transition-colors border bg-background hover:bg-muted border-border hover:border-primary/50 shrink-0 hidden md:inline-flex cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // 設置語言篩選
                            const reviewLanguage = reviewInfo.review.review_language || 'en';
                            handleFiltersChange({
                              ...filters,
                              selectedLanguages: [reviewLanguage],
                              currentPage: 1
                            });
                          }}
                          title={t('filter.clickToFilterByLanguage', { language: getLanguageDisplayName(reviewInfo.review.review_language || 'en') })}
                        >
                          <span className="truncate">{getLanguageDisplayName(reviewInfo.review.review_language || 'en')}</span>
                        </button>
                      </div>
                                             {/* 學期和語言徽章 - 手機版顯示在下方 */}
                       <div className="flex gap-2 md:hidden">
                         <button
                           className="px-2 py-1 text-xs rounded-md transition-colors border bg-background hover:bg-muted border-border hover:border-primary/50 w-fit cursor-pointer"
                           onClick={(e) => {
                             e.preventDefault();
                             e.stopPropagation();
                             // 設置學期篩選
                             handleFiltersChange({
                               ...filters,
                               selectedTerms: [reviewInfo.term.term_code],
                               currentPage: 1
                             });
                           }}
                           title={t('filter.clickToFilterByTerm', { term: reviewInfo.term.name })}
                         >
                           <span className="truncate">{reviewInfo.term.name}</span>
                         </button>
                         <button
                           className="px-2 py-1 text-xs rounded-md transition-colors border bg-background hover:bg-muted border-border hover:border-primary/50 w-fit cursor-pointer"
                           onClick={(e) => {
                             e.preventDefault();
                             e.stopPropagation();
                             // 設置語言篩選
                             const reviewLanguage = reviewInfo.review.review_language || 'en';
                             handleFiltersChange({
                               ...filters,
                               selectedLanguages: [reviewLanguage],
                               currentPage: 1
                             });
                           }}
                           title={t('filter.clickToFilterByLanguage', { language: getLanguageDisplayName(reviewInfo.review.review_language || 'en') })}
                         >
                           <span className="truncate">{getLanguageDisplayName(reviewInfo.review.review_language || 'en')}</span>
                         </button>
                       </div>
                      {/* 課程標題 - 顯示在學生姓名/匿名行下方 */}
                      <div className="space-y-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-lg">
                            <a
                              href={`/courses/${reviewInfo.course.course_code}?review_id=${reviewInfo.review.$id}`}
                              className="text-primary cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors px-2 py-1 rounded-md inline-block no-underline"
                              onClick={(e) => {
                                // Only prevent default if it's a special click (Ctrl, Cmd, middle-click)
                                // Let normal clicks use the default link behavior
                                if (e.ctrlKey || e.metaKey || e.button === 1) {
                                  // Let browser handle these naturally
                                  return;
                                }
                                // For normal clicks, prevent default and use React Router
                                e.preventDefault();
                                navigate(`/courses/${reviewInfo.course.course_code}?review_id=${reviewInfo.review.$id}`);
                              }}
                            >
                              {(() => {
                                const courseInfo = getCourseTitle(reviewInfo.course, language);
                                return (
                                  <div>
                                    <div className="font-bold">{reviewInfo.course.course_code}</div>
                                    <div className="font-medium">{courseInfo.primary}</div>
                                    {courseInfo.secondary && (
                                      <div className="text-sm text-muted-foreground font-normal mt-0.5">
                                        {courseInfo.secondary}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </a>
                          </h4>
                        </div>
                      </div>
                    </div>
                    {/* 最終成績 - 右上角大顯示 */}
                    {reviewInfo.review.course_final_grade && (
                      <div className="flex flex-col items-center shrink-0">
                        <GradeBadge 
                          grade={reviewInfo.review.course_final_grade}
                          size="md"
                          showTooltip={true}
                          onClick={() => {
                            const normalizedGrade = reviewInfo.review.course_final_grade === '-1' ? 'N/A' : reviewInfo.review.course_final_grade;
                            setFilters(prev => ({
                              ...prev,
                              selectedGrades: [normalizedGrade],
                              currentPage: 1
                            }));
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* 課程評分 */}
                  <div className="grid grid-cols-3 gap-1 text-xs">
                    <div className="text-center">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-center gap-1 mb-1 lg:mb-0">
                        <span className="font-medium text-sm sm:text-base">{t('review.workload')}</span>
                        <div className="flex items-center justify-center lg:ml-1">
                          {reviewInfo.review.course_workload === null || reviewInfo.review.course_workload === -1 ? (
                            <span className="text-muted-foreground">
                              {reviewInfo.review.course_workload === -1 ? t('review.notApplicable') : t('review.rating.notRated')}
                            </span>
                          ) : (
                            <StarRating rating={reviewInfo.review.course_workload} showValue size="sm" showTooltip ratingType="workload" />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-center gap-1 mb-1 lg:mb-0">
                        <span className="font-medium text-sm sm:text-base">{t('review.difficulty')}</span>
                        <div className="flex items-center justify-center lg:ml-1">
                          {reviewInfo.review.course_difficulties === null || reviewInfo.review.course_difficulties === -1 ? (
                            <span className="text-muted-foreground">
                              {reviewInfo.review.course_difficulties === -1 ? t('review.notApplicable') : t('review.rating.notRated')}
                            </span>
                          ) : (
                            <StarRating rating={reviewInfo.review.course_difficulties} showValue size="sm" showTooltip ratingType="difficulty" />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-center gap-1 mb-1 lg:mb-0">
                        <span className="font-medium text-sm sm:text-base">{t('review.usefulness')}</span>
                        <div className="flex items-center justify-center lg:ml-1">
                          {reviewInfo.review.course_usefulness === null || reviewInfo.review.course_usefulness === -1 ? (
                            <span className="text-muted-foreground">
                              {reviewInfo.review.course_usefulness === -1 ? t('review.notApplicable') : t('review.rating.notRated')}
                            </span>
                          ) : (
                            <StarRating rating={reviewInfo.review.course_usefulness} showValue size="sm" showTooltip ratingType="usefulness" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 課程評論 */}
                  {reviewInfo.review.course_comments && (
                    <>
                      <Separator />
                      <div className="min-w-0">
                        <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 shrink-0" />
                          <span>{t('review.courseComments')}</span>
                        </h5>
                        <div className="bg-muted/50 p-2 rounded-md break-words text-xs">
                          {hasMarkdownFormatting(reviewInfo.review.course_comments) ? (
                            <div className="text-xs">{renderCommentMarkdown(reviewInfo.review.course_comments)}</div>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              {reviewInfo.review.course_comments}
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* 服務學習 */}
                  {reviewInfo.review.has_service_learning && (
                    <>
                      <Separator />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md border border-blue-400 dark:from-blue-600 dark:to-blue-700 dark:border-blue-500 flex items-center gap-1">
                            <GraduationCap className="h-3 w-3" />
                            {t('review.serviceLearning')}
                          </Badge>
                          {/* 顯示服務學習類型 */}
                          <span 
                            className={cn(
                              "inline-flex items-center px-1.5 py-0.5 rounded text-xs",
                              // 檢查是否為必修：明確標記為 compulsory 或舊格式的 [COMPULSORY] 前綴
                              (reviewInfo.review.service_learning_type === 'compulsory' || 
                               reviewInfo.review.service_learning_description?.startsWith('[COMPULSORY]'))
                                ? "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
                                : "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
                            )}
                          >
                            {/* 檢查是否為必修，否則顯示選修 */}
                            {(reviewInfo.review.service_learning_type === 'compulsory' || 
                              reviewInfo.review.service_learning_description?.startsWith('[COMPULSORY]'))
                              ? t('review.compulsory')
                              : t('review.optional')}
                          </span>
                        </div>
                        {reviewInfo.review.service_learning_description && (
                          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md border border-blue-200 dark:border-blue-800/30">
                            <p className="text-sm text-blue-900 dark:text-blue-100 break-words">
                              {/* 移除舊格式的前綴 */}
                              {reviewInfo.review.service_learning_description
                                .replace(/^\[COMPULSORY\]\s*/, '')
                                .replace(/^\[OPTIONAL\]\s*/, '')}
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* 講師評價 - 只顯示當前講師，其他講師顯示展開按鈕 */}
                  {(() => {
                    const currentInstructorDetail = reviewInfo.instructorDetails.find(detail => detail.instructor_name === decodedName);
                    const otherInstructorDetails = reviewInfo.instructorDetails.filter(detail => detail.instructor_name !== decodedName);
                    
                    return (
                      <>
                        {currentInstructorDetail && (
                          <>
                            <Separator />
                            <div className="rounded-lg p-4 overflow-hidden bg-[#e8e9ea] dark:bg-[#1a2332]">
                              <div className="space-y-2 mb-3">
                                {/* Instructor name and badges container */}
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-4">
                                  <h4 className="font-semibold text-lg min-w-0 md:flex-1">
                                    <span>
                                      {(() => {
                                        const fullInstructor = otherInstructorsMap.get(currentInstructorDetail.instructor_name);
                                        if (fullInstructor) {
                                          const nameInfo = getInstructorName(fullInstructor, language);
                                          return (
                                            <div>
                                              <div>{nameInfo.primary}</div>
                                              {nameInfo.secondary && (
                                                <div className="text-sm text-muted-foreground font-normal mt-0.5">
                                                  {nameInfo.secondary}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        }
                                        return (
                                          <div>
                                            <div>{currentInstructorDetail.instructor_name}</div>
                                          </div>
                                        );
                                      })()}
                                    </span>
                                  </h4>
                                  
                                  {/* Desktop/Tablet: Badges on the same line as instructor name (right side) */}
                                  <div className="hidden md:flex md:items-start md:gap-2 md:shrink-0">
                                    {/* 教學語言徽章 */}
                                    {(() => {
                                      const teachingLanguage = getTeachingLanguageForInstructor(
                                        currentInstructorDetail.instructor_name,
                                        currentInstructorDetail.session_type
                                      );
                                      if (teachingLanguage) {
                                        return (
                                          <span 
                                            className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800 cursor-pointer transition-all duration-200 hover:scale-105 hover:bg-orange-100 dark:hover:bg-orange-900/50 max-w-full truncate"
                                            onClick={() => {
                                              const newFilters = { ...filters };
                                              
                                              // 切換教學語言篩選器
                                              if (newFilters.selectedTeachingLanguages.includes(teachingLanguage)) {
                                                newFilters.selectedTeachingLanguages = newFilters.selectedTeachingLanguages.filter(lang => lang !== teachingLanguage);
                                              } else {
                                                newFilters.selectedTeachingLanguages = [teachingLanguage];
                                              }
                                              
                                              // 重置頁面到第一頁
                                              newFilters.currentPage = 1;
                                              
                                              handleFiltersChange(newFilters);
                                            }}
                                            title={t('filter.clickToFilterByTeachingLanguage', { language: getTeachingLanguageName(teachingLanguage, t) })}
                                          >
                                            <span className="truncate">{getTeachingLanguageName(teachingLanguage, t)}</span>
                                          </span>
                                        );
                                      }
                                      return null;
                                    })()}
                                    
                                    {/* 課堂類型徽章 */}
                                    <span 
                                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs cursor-pointer transition-all duration-200 hover:scale-105 shrink-0 ${
                                        currentInstructorDetail.session_type === 'Lecture' 
                                          ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50'
                                          : currentInstructorDetail.session_type === 'Tutorial'
                                          ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/50'
                                          : ''
                                      }`}
                                      onClick={() => {
                                        const newFilters = { ...filters };
                                        const sessionType = currentInstructorDetail.session_type;
                                        
                                        // 切換篩選器
                                        if (newFilters.selectedSessionTypes.includes(sessionType)) {
                                          newFilters.selectedSessionTypes = newFilters.selectedSessionTypes.filter(type => type !== sessionType);
                                        } else {
                                          newFilters.selectedSessionTypes = [sessionType];
                                        }
                                        
                                        // 重置頁面到第一頁
                                        newFilters.currentPage = 1;
                                        
                                        handleFiltersChange(newFilters);
                                      }}
                                    >
                                      {t(`sessionTypeBadge.${currentInstructorDetail.session_type.toLowerCase()}`)}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Mobile: Badges on separate lines below instructor name */}
                                <div className="flex md:hidden flex-wrap items-center gap-2">
                                  {/* 教學語言徽章 */}
                                  {(() => {
                                    const teachingLanguage = getTeachingLanguageForInstructor(
                                      currentInstructorDetail.instructor_name,
                                      currentInstructorDetail.session_type
                                    );
                                    if (teachingLanguage) {
                                      return (
                                        <span 
                                          className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800 cursor-pointer transition-all duration-200 hover:scale-105 hover:bg-orange-100 dark:hover:bg-orange-900/50 max-w-full truncate"
                                          onClick={() => {
                                            const newFilters = { ...filters };
                                            
                                            // 切換教學語言篩選器
                                            if (newFilters.selectedTeachingLanguages.includes(teachingLanguage)) {
                                              newFilters.selectedTeachingLanguages = newFilters.selectedTeachingLanguages.filter(lang => lang !== teachingLanguage);
                                            } else {
                                              newFilters.selectedTeachingLanguages = [teachingLanguage];
                                            }
                                            
                                            // 重置頁面到第一頁
                                            newFilters.currentPage = 1;
                                            
                                            handleFiltersChange(newFilters);
                                          }}
                                          title={t('filter.clickToFilterByTeachingLanguage', { language: getTeachingLanguageName(teachingLanguage, t) })}
                                        >
                                          <span className="truncate">{getTeachingLanguageName(teachingLanguage, t)}</span>
                                        </span>
                                      );
                                    }
                                    return null;
                                  })()}
                                  
                                  {/* 課堂類型徽章 */}
                                  <span 
                                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs cursor-pointer transition-all duration-200 hover:scale-105 shrink-0 ${
                                      currentInstructorDetail.session_type === 'Lecture' 
                                        ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50'
                                        : currentInstructorDetail.session_type === 'Tutorial'
                                        ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/50'
                                        : ''
                                    }`}
                                    onClick={() => {
                                      const newFilters = { ...filters };
                                      const sessionType = currentInstructorDetail.session_type;
                                      
                                      // 切換篩選器
                                      if (newFilters.selectedSessionTypes.includes(sessionType)) {
                                        newFilters.selectedSessionTypes = newFilters.selectedSessionTypes.filter(type => type !== sessionType);
                                      } else {
                                        newFilters.selectedSessionTypes = [sessionType];
                                      }
                                      
                                      // 重置頁面到第一頁
                                      newFilters.currentPage = 1;
                                      
                                      handleFiltersChange(newFilters);
                                    }}
                                  >
                                    {t(`sessionTypeBadge.${currentInstructorDetail.session_type.toLowerCase()}`)}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                                <div className="text-center">
                                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-center gap-1 mb-1 lg:mb-0">
                                    <span className="font-medium text-sm sm:text-base">{t('card.teaching')}</span>
                                    <div className="flex items-center justify-center lg:ml-1">
                                      {currentInstructorDetail.teaching === null ? (
                                        <span className="text-muted-foreground">
                                          {t('review.rating.notRated')}
                                        </span>
                                      ) : currentInstructorDetail.teaching === -1 ? (
                                        <span className="text-muted-foreground">
                                          {t('review.notApplicable')}
                                        </span>
                                      ) : (
                                        <StarRating rating={currentInstructorDetail.teaching} showValue size="sm" showTooltip ratingType="teaching" />
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                {currentInstructorDetail.grading !== null && currentInstructorDetail.grading !== -1 && (
                                  <div className="text-center">
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-center gap-1 mb-1 lg:mb-0">
                                      <span className="font-medium text-sm sm:text-base">{t('card.grading')}</span>
                                      <div className="flex items-center justify-center lg:ml-1">
                                        <StarRating rating={currentInstructorDetail.grading} showValue size="sm" showTooltip ratingType="grading" />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* 課程要求 */}
                              <div className="mb-4">
                                <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                                  <FileText className="h-4 w-4 shrink-0" />
                                  <span>{t('review.courseRequirements')}</span>
                                </h5>
                                <div className="flex flex-wrap gap-2 overflow-hidden">
                                  {renderBooleanBadge(currentInstructorDetail.has_attendance_requirement, t('review.requirements.attendance'))}
                                  {renderBooleanBadge(currentInstructorDetail.has_quiz, t('review.requirements.quiz'))}
                                  {renderBooleanBadge(currentInstructorDetail.has_midterm, t('review.requirements.midterm'))}
                                  {renderBooleanBadge(currentInstructorDetail.has_final, t('review.requirements.final'))}
                                  {renderBooleanBadge(currentInstructorDetail.has_individual_assignment, t('review.requirements.individualAssignment'))}
                                  {renderBooleanBadge(currentInstructorDetail.has_group_project, t('review.requirements.groupProject'))}
                                  {renderBooleanBadge(currentInstructorDetail.has_presentation, t('review.requirements.presentation'))}
                                  {renderBooleanBadge(currentInstructorDetail.has_reading, t('review.requirements.reading'))}
                                </div>
                              </div>

                              {/* 服務學習 */}
                              {currentInstructorDetail.has_service_learning && (
                                <div className="mb-4">
                                  <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                                    <GraduationCap className="h-4 w-4 shrink-0" />
                                    <span>{t('review.serviceLearning')}</span>
                                  </h5>
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <span 
                                        className={cn(
                                          "inline-flex items-center px-1.5 py-0.5 rounded text-xs",
                                          currentInstructorDetail.service_learning_type === 'compulsory'
                                            ? "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
                                            : "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
                                        )}
                                      >
                                        {currentInstructorDetail.service_learning_type === 'compulsory' 
                                          ? t('review.compulsory') 
                                          : t('review.optional')
                                        }
                                      </span>
                                    </div>
                                    {currentInstructorDetail.service_learning_description && (
                                      <div className="text-sm break-words">
                                        <p className="text-sm">
                                          {currentInstructorDetail.service_learning_description}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* 講師評論 */}
                              {currentInstructorDetail.comments && (
                                <div className="min-w-0">
                                  <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                                    <User className="h-4 w-4 shrink-0" />
                                    <span>{t('review.instructorComments')}</span>
                                  </h5>
                                  <div className="break-words">
                                    {hasMarkdownFormatting(currentInstructorDetail.comments) ? (
                                      renderCommentMarkdown(currentInstructorDetail.comments)
                                    ) : (
                                      <p className="text-sm">
                                        {currentInstructorDetail.comments}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                        
                        {/* 其他講師展開按鈕和內容 */}
                        {otherInstructorDetails.length > 0 && (
                          <>
                            <Separator />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleOtherInstructors(reviewInfo.review.$id)}
                              className="w-full justify-center"
                            >
                              <ChevronDown className={`h-4 w-4 mr-2 transition-transform ${expandedOtherInstructors[reviewInfo.review.$id] ? 'rotate-180' : ''}`} />
                              {expandedOtherInstructors[reviewInfo.review.$id] 
                                ? t('review.hideOtherInstructors') 
                                : t('review.showOtherInstructors')} ({otherInstructorDetails.length})
                            </Button>
                            
                            {/* 其他講師的詳細信息 */}
                            {expandedOtherInstructors[reviewInfo.review.$id] && (
                              <div className="space-y-4 mt-4">
                                {otherInstructorDetails.map((instructor, index) => (
                                  <div key={index} className="rounded-lg p-4 overflow-hidden bg-[#e8e9ea] dark:bg-[#1a2332]">
                                    <div className="space-y-2 mb-3">
                                      {/* Instructor name and badges container */}
                                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-4">
                                        <h4 className="font-semibold text-lg cursor-pointer hover:text-primary transition-colors min-w-0 md:flex-1">
                                          <a
                                            href={`/instructors/${encodeURIComponent(instructor.instructor_name)}`}
                                            className="hover:underline"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              navigate(`/instructors/${encodeURIComponent(instructor.instructor_name)}`);
                                            }}
                                          >
                                            {(() => {
                                              const fullInstructor = otherInstructorsMap.get(instructor.instructor_name);
                                              if (fullInstructor) {
                                                const nameInfo = getInstructorName(fullInstructor, language);
                                                return (
                                                  <div>
                                                    <div>{nameInfo.primary}</div>
                                                    {nameInfo.secondary && (
                                                      <div className="text-sm text-muted-foreground font-normal mt-0.5">
                                                        {nameInfo.secondary}
                                                      </div>
                                                    )}
                                                  </div>
                                                );
                                              }
                                              return (
                                                <div>
                                                  <div>{instructor.instructor_name}</div>
                                                </div>
                                              );
                                            })()}
                                          </a>
                                        </h4>
                                        
                                        {/* Desktop/Tablet: Badges on the same line as instructor name (right side) */}
                                        <div className="hidden md:flex md:items-start md:gap-2 md:shrink-0">
                                          {/* 教學語言徽章 */}
                                          {(() => {
                                            const teachingLanguage = getTeachingLanguageForInstructor(
                                              instructor.instructor_name,
                                              instructor.session_type
                                            );
                                            if (teachingLanguage) {
                                              return (
                                                <span 
                                                  className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800 cursor-pointer transition-all duration-200 hover:scale-105 hover:bg-orange-100 dark:hover:bg-orange-900/50 max-w-full truncate"
                                                  onClick={() => {
                                                    const newFilters = { ...filters };
                                                    const language = teachingLanguage;
                                                    
                                                    // 切換篩選器
                                                    if (newFilters.selectedTeachingLanguages.includes(language)) {
                                                      newFilters.selectedTeachingLanguages = newFilters.selectedTeachingLanguages.filter(lang => lang !== language);
                                                    } else {
                                                      newFilters.selectedTeachingLanguages = [language];
                                                    }
                                                    
                                                    // 重置頁面到第一頁
                                                    newFilters.currentPage = 1;
                                                    
                                                    handleFiltersChange(newFilters);
                                                  }}
                                                  title={getTeachingLanguageName(teachingLanguage, t)}
                                                >
                                                  {getTeachingLanguageName(teachingLanguage, t)}
                                                </span>
                                              );
                                            }
                                            return null;
                                          })()}
                                          
                                          {/* 課堂類型徽章 */}
                                          <span 
                                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs cursor-pointer transition-all duration-200 hover:scale-105 shrink-0 ${
                                              instructor.session_type === 'Lecture' 
                                                ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50'
                                                : instructor.session_type === 'Tutorial'
                                                ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/50'
                                                : ''
                                            }`}
                                            onClick={() => {
                                              const newFilters = { ...filters };
                                              const sessionType = instructor.session_type;
                                              
                                              // 切換篩選器
                                              if (newFilters.selectedSessionTypes.includes(sessionType)) {
                                                newFilters.selectedSessionTypes = newFilters.selectedSessionTypes.filter(type => type !== sessionType);
                                              } else {
                                                newFilters.selectedSessionTypes = [sessionType];
                                              }
                                              
                                              // 重置頁面到第一頁
                                              newFilters.currentPage = 1;
                                              
                                              handleFiltersChange(newFilters);
                                            }}
                                          >
                                            {t(`sessionTypeBadge.${instructor.session_type.toLowerCase()}`)}
                                          </span>
                                        </div>
                                      </div>
                                      
                                      {/* Mobile: Badges on separate lines below instructor name */}
                                      <div className="flex md:hidden flex-wrap items-center gap-2">
                                        {/* 教學語言徽章 */}
                                        {(() => {
                                          const teachingLanguage = getTeachingLanguageForInstructor(
                                            instructor.instructor_name,
                                            instructor.session_type
                                          );
                                          if (teachingLanguage) {
                                            return (
                                              <span 
                                                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800 cursor-pointer transition-all duration-200 hover:scale-105 hover:bg-orange-100 dark:hover:bg-orange-900/50 max-w-full truncate"
                                                onClick={() => {
                                                  const newFilters = { ...filters };
                                                  const language = teachingLanguage;
                                                  
                                                  // 切換篩選器
                                                  if (newFilters.selectedTeachingLanguages.includes(language)) {
                                                    newFilters.selectedTeachingLanguages = newFilters.selectedTeachingLanguages.filter(lang => lang !== language);
                                                  } else {
                                                    newFilters.selectedTeachingLanguages = [language];
                                                  }
                                                  
                                                  // 重置頁面到第一頁
                                                  newFilters.currentPage = 1;
                                                  
                                                  handleFiltersChange(newFilters);
                                                }}
                                                title={getTeachingLanguageName(teachingLanguage, t)}
                                              >
                                                {getTeachingLanguageName(teachingLanguage, t)}
                                              </span>
                                            );
                                          }
                                          return null;
                                        })()}
                                        
                                        {/* 課堂類型徽章 */}
                                        <span 
                                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs cursor-pointer transition-all duration-200 hover:scale-105 shrink-0 ${
                                            instructor.session_type === 'Lecture' 
                                              ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50'
                                              : instructor.session_type === 'Tutorial'
                                              ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/50'
                                              : ''
                                          }`}
                                          onClick={() => {
                                            const newFilters = { ...filters };
                                            const sessionType = instructor.session_type;
                                            
                                            // 切換篩選器
                                            if (newFilters.selectedSessionTypes.includes(sessionType)) {
                                              newFilters.selectedSessionTypes = newFilters.selectedSessionTypes.filter(type => type !== sessionType);
                                            } else {
                                              newFilters.selectedSessionTypes = [sessionType];
                                            }
                                            
                                            // 重置頁面到第一頁
                                            newFilters.currentPage = 1;
                                            
                                            handleFiltersChange(newFilters);
                                          }}
                                        >
                                          {t(`sessionTypeBadge.${instructor.session_type.toLowerCase()}`)}
                                        </span>
                                      </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                                      <div className="text-center">
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-center gap-1 mb-1 lg:mb-0">
                                          <span className="font-medium text-sm sm:text-base">{t('card.teaching')}</span>
                                          <div className="flex items-center justify-center lg:ml-1">
                                            {instructor.teaching === null ? (
                                              <span className="text-muted-foreground">
                                                {t('review.rating.notRated')}
                                              </span>
                                            ) : instructor.teaching === -1 ? (
                                              <span className="text-muted-foreground">
                                                {t('review.notApplicable')}
                                              </span>
                                            ) : (
                                              <StarRating rating={instructor.teaching} showValue size="sm" showTooltip ratingType="teaching" />
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {instructor.grading !== null && instructor.grading !== -1 && (
                                        <div className="text-center">
                                          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-center gap-1 mb-1 lg:mb-0">
                                            <span className="font-medium text-sm sm:text-base">{t('card.grading')}</span>
                                            <div className="flex items-center justify-center lg:ml-1">
                                              <StarRating rating={instructor.grading} showValue size="sm" showTooltip ratingType="grading" />
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {/* 課程要求 */}
                                    <div className="mb-4">
                                      <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                                        <FileText className="h-4 w-4 shrink-0" />
                                        <span>{t('review.courseRequirements')}</span>
                                      </h5>
                                      <div className="flex flex-wrap gap-2 overflow-hidden">
                                        {renderBooleanBadge(instructor.has_attendance_requirement, t('review.requirements.attendance'))}
                                        {renderBooleanBadge(instructor.has_quiz, t('review.requirements.quiz'))}
                                        {renderBooleanBadge(instructor.has_midterm, t('review.requirements.midterm'))}
                                        {renderBooleanBadge(instructor.has_final, t('review.requirements.final'))}
                                        {renderBooleanBadge(instructor.has_individual_assignment, t('review.requirements.individualAssignment'))}
                                        {renderBooleanBadge(instructor.has_group_project, t('review.requirements.groupProject'))}
                                        {renderBooleanBadge(instructor.has_presentation, t('review.requirements.presentation'))}
                                        {renderBooleanBadge(instructor.has_reading, t('review.requirements.reading'))}
                                      </div>
                                    </div>

                                    {/* 服務學習 */}
                                    {instructor.has_service_learning && (
                                      <div className="mb-4">
                                        <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                                          <GraduationCap className="h-4 w-4 shrink-0" />
                                          <span>{t('review.serviceLearning')}</span>
                                        </h5>
                                        <div className="space-y-2">
                                          <div className="flex items-center gap-2">
                                            <span 
                                              className={cn(
                                                "inline-flex items-center px-1.5 py-0.5 rounded text-xs",
                                                instructor.service_learning_type === 'compulsory'
                                                  ? "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
                                                  : "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
                                              )}
                                            >
                                              {instructor.service_learning_type === 'compulsory' 
                                                ? t('review.compulsory') 
                                                : t('review.optional')
                                              }
                                            </span>
                                          </div>
                                          {instructor.service_learning_description && (
                                            <div className="text-sm break-words">
                                              <p className="text-sm">
                                                {instructor.service_learning_description}
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* 講師評論 */}
                                    {instructor.comments && (
                                      <div className="min-w-0">
                                        <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                                          <User className="h-4 w-4 shrink-0" />
                                          <span>{t('review.instructorComments')}</span>
                                        </h5>
                                        <div className="break-words">
                                          {hasMarkdownFormatting(instructor.comments) ? (
                                            renderCommentMarkdown(instructor.comments)
                                          ) : (
                                            <p className="text-sm">
                                              {instructor.comments}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </>
                    );
                  })()}

                  {/* 投票按鈕和時間 */}
                  <Separator />
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 overflow-hidden">
                    <div className="flex-shrink-0">
                      <VotingButtons
                        reviewId={reviewInfo.review.$id}
                        upvotes={reviewInfo.upvotes}
                        downvotes={reviewInfo.downvotes}
                        userVote={reviewInfo.userVote}
                        size="sm"
                      />
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 min-w-0">
                      <span 
                        className="truncate cursor-help" 
                        title={t('review.timestampTooltip', { timezone: 'Hong Kong Time (UTC+8)' })}
                      >
                        {formatDateTimeUTC8(reviewInfo.review.submitted_at)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              </div>

              {/* 分頁 */}
              {totalPages > 1 && (
                <div className="mt-8">
                  <Pagination
                    currentPage={filters.currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    itemsPerPage={filters.itemsPerPage}
                    totalItems={filteredReviews.length}
                  />
                </div>
              )}
            </div>
          )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        {/* Grade Distribution Tab */}
        <TabsContent value="grades" className="mt-0">
          <Card className="course-card">
            <CardContent className="p-6">
              {/* 成績分佈圖表 */}
              {!reviewsLoading && filteredReviewsForChart.length > 0 ? (
                <div>
                  <GradeDistributionChart
                    gradeDistribution={calculateGradeDistributionFromReviews(filteredReviewsForChart.map(reviewInfo => ({ course_final_grade: reviewInfo.review.course_final_grade })))}
                    loading={reviewsLoading}
                    title={t('chart.gradeDistribution')}
                    height={120}
                    showPercentage={true}
                    className="bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800"
                    context="instructor"
                    filterOptions={gradeChartFilterOptions}
                    selectedFilter={selectedGradeChartFilter}
                    onFilterChange={setSelectedGradeChartFilter}
                    filterLabel={t('chart.filterByCourse')}
                    rawReviewData={filteredReviewsForChart}
                    hideHeader={true}
                    onBarClick={(grade) => {
                      // 設置成績篩選並滾動到學生評論區域
                      setExternalGradeFilter(grade);
                      
                      // 短暫延遲後滾動，讓篩選生效
                      setTimeout(() => {
                        const studentReviewsElement = document.getElementById('instructor-student-reviews');
                        if (studentReviewsElement) {
                          studentReviewsElement.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'start' 
                          });
                        }
                      }, 100);
                    }}
                  />
                </div>
              ) : (
                <div className="text-center py-12 space-y-4">
                  <div className="flex justify-center">
                    <div className="p-4 bg-muted/50 rounded-full">
                      <Info className="h-12 w-12 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium text-muted-foreground">{t('chart.noGradeData')}</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      {t('chart.noGradeDataDescription')}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>

      {/* 操作按鈕 */}
      <div className="flex gap-3 pb-8 md:pb-0">
        <Button 
          variant="outline" 
          className="flex-1 h-12 text-base font-medium hover:bg-primary/10 hover:text-primary"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('instructors.back')}
        </Button>
      </div>
    </div>
  );
};

export default Lecturers;