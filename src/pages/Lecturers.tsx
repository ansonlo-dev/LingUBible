import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import React, { useState, useEffect } from 'react';
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
  Building
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination } from '@/components/features/reviews/Pagination';
import { InstructorReviewsFilters, InstructorReviewFilters } from '@/components/features/reviews/InstructorReviewsFilters';
import { CourseRequirementsFilter, CourseRequirementsFilters } from '@/components/features/reviews/CourseRequirementsFilter';
import { 
  Instructor, 
  InstructorTeachingCourse, 
  InstructorReviewInfo,
  InstructorReviewFromDetails
} from '@/services/api/courseService';
import { CourseService } from '@/services/api/courseService';
import { useInstructorDetailOptimized } from '@/hooks/useInstructorDetailOptimized';
import { formatDateTimeUTC8 } from '@/utils/ui/dateUtils';
import { renderCommentMarkdown, hasMarkdownFormatting } from '@/utils/ui/markdownRenderer';
import { ReviewAvatar } from '@/components/ui/review-avatar';
import { getInstructorName, getCourseTitle, translateDepartmentName } from '@/utils/textUtils';
import { StarRating } from '@/components/ui/star-rating';
import { VotingButtons } from '@/components/ui/voting-buttons';
import { cn } from '@/lib/utils';
import { GradeBadge } from '@/components/ui/GradeBadge';
import { FavoriteButton } from '@/components/ui/FavoriteButton';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
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
    selectedGrades: [],
    sortBy: 'postDate',
    sortOrder: 'desc',
    itemsPerPage: 12,
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
  const [selectedTermFilter, setSelectedTermFilter] = useState<string>('all');

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
  const loading = instructorLoading || detailLoading;
  const error = instructorError || detailError;

  // Generate filter options for grade distribution chart (courses)
  const gradeChartFilterOptions = React.useMemo(() => {
    if (!reviews || reviews.length === 0) return [];
    
    const courseMap = new Map<string, { title: string; count: number }>();
    reviews.forEach(reviewInfo => {
      if (reviewInfo.course?.course_code) {
        const courseCode = reviewInfo.course.course_code;
        const courseTitle = reviewInfo.course.course_title || reviewInfo.course.course_code;
        
        if (courseMap.has(courseCode)) {
          courseMap.get(courseCode)!.count++;
        } else {
          courseMap.set(courseCode, { title: courseTitle, count: 1 });
        }
      }
    });
    
    return Array.from(courseMap.entries())
      .map(([code, data]) => ({
        value: code,
        label: `${code} - ${data.title}`,
        count: data.count
      }))
      .sort((a, b) => a.value.localeCompare(b.value));
  }, [reviews]);

  // Filter reviews for grade distribution chart based on selected course(s)
  const filteredReviewsForChart = React.useMemo(() => {
    if (!reviews || reviews.length === 0) return [];
    
    // Handle both single and multiple selections
    const selectedValues = Array.isArray(selectedGradeChartFilter) ? selectedGradeChartFilter : [selectedGradeChartFilter];
    
    if (selectedValues.length === 0 || selectedValues.includes('all')) {
      return reviews;
    }
    
    return reviews.filter(reviewInfo => 
      reviewInfo.course?.course_code && selectedValues.includes(reviewInfo.course.course_code)
    );
  }, [reviews, selectedGradeChartFilter]);

  // 獲取所有可用的學期
  const availableTerms = React.useMemo(() => {
    const terms = teachingCourses.map(teaching => teaching.term);
    const uniqueTerms = terms.filter((term, index, self) => 
      self.findIndex(t => t.term_code === term.term_code) === index
    );
    return uniqueTerms.sort((a, b) => b.term_code.localeCompare(a.term_code));
  }, [teachingCourses]);

  // 根據選定的學期篩選教學課程
  const filteredTeachingCourses = React.useMemo(() => {
    if (selectedTermFilter === 'all') {
      return teachingCourses;
    }
    return teachingCourses.filter(teaching => teaching.term.term_code === selectedTermFilter);
  }, [teachingCourses, selectedTermFilter]);

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
    if (!reviews || reviews.length === 0) {
      return {
        languageCounts: {},
        termCounts: {},
        courseCounts: {},
        sessionTypeCounts: {},
        gradeCounts: {}
      };
    }

    const languageCounts: { [key: string]: number } = {};
    const termCounts: { [key: string]: { name: string; count: number } } = {};
    const courseCounts: { [key: string]: { title: string; count: number } } = {};
    const sessionTypeCounts: { [key: string]: number } = {};
    const gradeCounts: { [key: string]: number } = {};

    reviews.forEach(reviewInfo => {
      // 語言統計
      const language = reviewInfo.review.review_language || 'en';
      languageCounts[language] = (languageCounts[language] || 0) + 1;

      // 學期統計
      if (reviewInfo.term?.term_code) {
        const termCode = reviewInfo.term.term_code;
        if (!termCounts[termCode]) {
          termCounts[termCode] = { name: reviewInfo.term.name || termCode, count: 0 };
        }
        termCounts[termCode].count++;
      }

      // 課程統計
      if (reviewInfo.course?.course_code) {
        const courseCode = reviewInfo.course.course_code;
        if (!courseCounts[courseCode]) {
          courseCounts[courseCode] = { title: reviewInfo.course.course_title || courseCode, count: 0 };
        }
        courseCounts[courseCode].count++;
      }

      // 課堂類型統計（從講師詳情中獲取）
      reviewInfo.instructorDetails.forEach(detail => {
        if (detail.session_type) {
          sessionTypeCounts[detail.session_type] = (sessionTypeCounts[detail.session_type] || 0) + 1;
        }
      });

      // 成績統計
      const finalGrade = reviewInfo.review.course_final_grade;
      const normalizedGrade = finalGrade === '-1' ? 'N/A' : finalGrade;
      if (normalizedGrade) {
        gradeCounts[normalizedGrade] = (gradeCounts[normalizedGrade] || 0) + 1;
      }
    });

    return { languageCounts, termCounts, courseCounts, sessionTypeCounts, gradeCounts };
  };

  // 篩選評論
  const getFilteredReviews = () => {
    if (!reviews || reviews.length === 0) return [];

    return reviews.filter(reviewInfo => {
      // 課程要求篩選 (先執行，因為可能會大幅減少評論數量)
      const hasMatchingRequirements = reviewInfo.instructorDetails.some(detail => {
        const checks = [
          requirementsFilters.attendance === 'all' || (requirementsFilters.attendance === 'has' && detail.has_attendance_requirement) || (requirementsFilters.attendance === 'no' && !detail.has_attendance_requirement),
          requirementsFilters.quiz === 'all' || (requirementsFilters.quiz === 'has' && detail.has_quiz) || (requirementsFilters.quiz === 'no' && !detail.has_quiz),
          requirementsFilters.midterm === 'all' || (requirementsFilters.midterm === 'has' && detail.has_midterm) || (requirementsFilters.midterm === 'no' && !detail.has_midterm),
          requirementsFilters.final === 'all' || (requirementsFilters.final === 'has' && detail.has_final) || (requirementsFilters.final === 'no' && !detail.has_final),
          requirementsFilters.individualAssignment === 'all' || (requirementsFilters.individualAssignment === 'has' && detail.has_individual_assignment) || (requirementsFilters.individualAssignment === 'no' && !detail.has_individual_assignment),
          requirementsFilters.groupProject === 'all' || (requirementsFilters.groupProject === 'has' && detail.has_group_project) || (requirementsFilters.groupProject === 'no' && !detail.has_group_project),
          requirementsFilters.presentation === 'all' || (requirementsFilters.presentation === 'has' && detail.has_presentation) || (requirementsFilters.presentation === 'no' && !detail.has_presentation),
          requirementsFilters.reading === 'all' || (requirementsFilters.reading === 'has' && detail.has_reading) || (requirementsFilters.reading === 'no' && !detail.has_reading)
        ];
        
        // 所有條件都必須滿足 (AND logic)
        return checks.every(check => check);
      });
      
      if (!hasMatchingRequirements) return false;

      // 語言篩選
      if (filters.selectedLanguages.length > 0) {
        const reviewLanguage = reviewInfo.review.review_language || 'en';
        if (!filters.selectedLanguages.includes(reviewLanguage)) return false;
      }

      // 學期篩選
      if (filters.selectedTerms.length > 0) {
        if (!reviewInfo.term?.term_code || !filters.selectedTerms.includes(reviewInfo.term.term_code)) {
          return false;
        }
      }

      // 課程篩選
      if (filters.selectedCourses.length > 0) {
        if (!reviewInfo.course?.course_code || !filters.selectedCourses.includes(reviewInfo.course.course_code)) {
          return false;
        }
      }

      // 課堂類型篩選
      if (filters.selectedSessionTypes.length > 0) {
        const hasMatchingSessionType = reviewInfo.instructorDetails.some(detail => 
          detail.session_type && filters.selectedSessionTypes.includes(detail.session_type)
        );
        if (!hasMatchingSessionType) return false;
      }

      // 成績篩選
      if (filters.selectedGrades.length > 0) {
        const finalGrade = reviewInfo.review.course_final_grade;
        const normalizedGrade = finalGrade === '-1' ? 'N/A' : finalGrade;
        if (!normalizedGrade || !filters.selectedGrades.includes(normalizedGrade)) {
          return false;
        }
      }

      return true;
    });
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
  const { languageCounts, termCounts, courseCounts, sessionTypeCounts, gradeCounts } = getFilterCounts();

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
      selectedGrades: [],
      sortBy: 'postDate',
      sortOrder: 'desc',
      itemsPerPage: 12,
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
    <div className="container mx-auto px-4 py-6 space-y-6 overflow-hidden">

      {/* 講師基本信息 */}
      {instructor && (
        <CollapsibleSection
          className="course-card"
          title={t('pages.instructors.instructorInfo')}
          icon={<User className="h-5 w-5" />}
          defaultExpanded={true}
          expandedHint={t('common.clickToCollapse') || 'Click to collapse'}
          collapsedHint={t('common.clickToExpand') || 'Click to expand'}
        >
          <div className="space-y-4 overflow-hidden">
            <div className="flex items-center gap-3 overflow-hidden min-w-0">
              <GraduationCap className="h-8 w-8 text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-bold truncate">{instructor.name}</h3>
                {/* 在中文模式下顯示中文名稱 - 保留空間以維持卡片高度一致 */}
                {language === 'zh-TW' && (
                  <p className="text-lg text-gray-600 dark:text-gray-400 mt-1 font-medium min-h-[1.5rem]">
                    {instructor.name_tc || ''}
                  </p>
                )}
                {language === 'zh-CN' && (
                  <p className="text-lg text-gray-600 dark:text-gray-400 mt-1 font-medium min-h-[1.5rem]">
                    {instructor.name_sc || ''}
                  </p>
                )}
                {/* Faculty and Department Badges - matching PopularItemCard styling */}
                {instructor.department && (
                  <div className={`${language === 'en' ? 'flex flex-col items-start gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-1.5' : 'flex flex-wrap items-center gap-1 sm:gap-1.5'} mt-2`} style={{ minHeight: '2rem' }}>
                    {/* Faculty Badge */}
                    {getFacultyByDepartment(instructor.department) && (
                      <Badge 
                        variant="outline"
                        className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 shrink-0 w-fit"
                      >
                        {t(getFacultyByDepartment(instructor.department))}
                      </Badge>
                    )}
                    {/* Department Badge */}
                    <Badge 
                      variant="outline"
                      className="text-xs bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 shrink-0 w-fit max-w-full"
                    >
                      <span className="break-words hyphens-auto">
                        {language === 'en' ? `Department of ${translateDepartmentName(instructor.department, t)}` : translateDepartmentName(instructor.department, t)}
                      </span>
                    </Badge>
                  </div>
                )}
              </div>
              <div className="shrink-0">
                <FavoriteButton
                  type="instructor"
                  itemId={instructor.name}
                  size="lg"
                  showText={true}
                  variant="outline"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2 overflow-hidden min-w-0">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <a 
                href={`mailto:${instructor.email}`}
                className="text-sm truncate flex-1 min-w-0 hover:underline hover:text-primary transition-colors block"
              >
                {instructor.email}
              </a>
            </div>
            
            <div className="pt-4">
              {/* Mobile: 兩個評分在一行 */}
              <div className="grid grid-cols-1 gap-4 sm:hidden">
                {/* 兩個評分在一行 */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Average Teaching Quality Rating */}
                  <div className="text-center min-w-0">
                    <div className="text-xl font-bold text-primary">
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
                    <div className="text-xs text-muted-foreground">{t('instructors.averageTeachingQualityShort')}</div>
                    {!reviewsLoading && reviews.length === 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {t('instructors.noRatingData')}
                      </div>
                    )}
                  </div>
                  
                  {/* Average Grading Satisfaction Rating */}
                  <div className="text-center min-w-0">
                    <div className="text-xl font-bold text-primary">
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
                    <div className="text-xs text-muted-foreground">{t('instructors.averageGradingSatisfactionShort')}</div>
                    {!reviewsLoading && reviews.length === 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {t('instructors.noRatingData')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Tablet and Desktop: 原來的 1x2 佈局 */}
              <div className="hidden sm:grid sm:grid-cols-1 md:grid-cols-2 gap-4">
                {/* Average Teaching Quality Rating */}
                <div className="text-center min-w-0">
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
                
                {/* Average Grading Satisfaction Rating */}
                <div className="text-center min-w-0">
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
            </div>

            {/* 成績分佈圖表 */}
            {!reviewsLoading && reviews.length > 0 && (
              <div className="pt-4">
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
        </CollapsibleSection>
      )}

      {/* 教授課程 */}
      <CollapsibleSection
        className="course-card"
        title={t('instructors.coursesTeaching')}
        icon={<BookOpen className="h-5 w-5" />}
        badge={
          teachingCoursesLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Badge 
              variant={teachingCourses.length > 0 ? "default" : "secondary"}
              className={`text-xs font-medium transition-all duration-200 cursor-help ${
                teachingCourses.length > 0 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/40 hover:scale-105 border-green-200 dark:border-green-800' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-800'
              }`}
            >
              {teachingCourses.length > 0 ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {t('instructors.teaching')}
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 mr-1" />
                  {t('instructors.notTeaching')}
                </>
              )}
            </Badge>
          )
        }
        defaultExpanded={true}
        expandedHint={t('common.clickToCollapse') || 'Click to collapse'}
        collapsedHint={t('common.clickToExpand') || 'Click to expand'}
      >
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <TabsList className="bg-muted/50 backdrop-blur-sm w-full sm:w-auto">
                  <TabsTrigger 
                    value="lecture" 
                    className="hover:shadow-md transition-[transform,box-shadow] duration-200 data-[state=active]:shadow-lg flex-1 sm:flex-none"
                  >
                    {t('sessionType.lecture')} ({filteredTeachingCourses.filter(teaching => teaching.sessionType === 'Lecture').length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="tutorial" 
                    className="hover:shadow-md transition-[transform,box-shadow] duration-200 data-[state=active]:shadow-lg flex-1 sm:flex-none"
                  >
                    {t('sessionType.tutorial')} ({filteredTeachingCourses.filter(teaching => teaching.sessionType === 'Tutorial').length})
                  </TabsTrigger>
                </TabsList>

                {/* 學期篩選器 - 移到右側 */}
                <div className="flex items-center gap-2 sm:ml-auto">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">{t('pages.courseDetail.filterByTerm')}:</span>
                  <Select value={selectedTermFilter} onValueChange={setSelectedTermFilter}>
                    <SelectTrigger className="w-[180px] h-8">
                      <SelectValue placeholder={t('common.all')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('common.all')}</SelectItem>
                      {availableTerms.map((term) => (
                        <SelectItem key={term.term_code} value={term.term_code}>
                          {term.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                        
                        {/* Right side: Terms */}
                        <div className="flex items-center gap-2 flex-wrap justify-end">
                          {data.terms
                            .sort((a, b) => b.term_code.localeCompare(a.term_code)) // Sort terms by code descending
                            .map((term, termIndex) => (
                            <button
                              key={termIndex}
                              onClick={() => {
                                // 如果已經選中該學期，則取消篩選（設為 'all'）
                                if (selectedTermFilter === term.term_code) {
                                  setSelectedTermFilter('all');
                                } else {
                                  setSelectedTermFilter(term.term_code);
                                }
                              }}
                              className={`px-2 py-1 text-xs rounded-md transition-colors border ${
                                selectedTermFilter === term.term_code
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'bg-background hover:bg-muted border-border hover:border-primary/50'
                              }`}
                            >
                              {term.name}
                            </button>
                          ))}
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
                        
                        {/* Right side: Terms */}
                        <div className="flex items-center gap-2 flex-wrap justify-end">
                          {data.terms
                            .sort((a, b) => b.term_code.localeCompare(a.term_code)) // Sort terms by code descending
                            .map((term, termIndex) => (
                            <button
                              key={termIndex}
                              onClick={() => {
                                // 如果已經選中該學期，則取消篩選（設為 'all'）
                                if (selectedTermFilter === term.term_code) {
                                  setSelectedTermFilter('all');
                                } else {
                                  setSelectedTermFilter(term.term_code);
                                }
                              }}
                              className={`px-2 py-1 text-xs rounded-md transition-colors border ${
                                selectedTermFilter === term.term_code
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'bg-background hover:bg-muted border-border hover:border-primary/50'
                              }`}
                            >
                              {term.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
      </CollapsibleSection>

      {/* 學生評論 */}
      <div id="instructor-student-reviews">
        <CollapsibleSection
          className="course-card"
          title={t('instructors.studentReviews')}
          icon={<MessageSquare className="h-5 w-5" />}
          defaultExpanded={true}
          expandedHint={t('common.clickToCollapse') || 'Click to collapse'}
          collapsedHint={t('common.clickToExpand') || 'Click to expand'}
          contentClassName="space-y-4"
        >
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
                      <div className="flex items-start gap-2">
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
                        {(() => {
                          const currentInstructorDetail = reviewInfo.instructorDetails.find(detail => detail.instructor_name === decodedName);
                          return currentInstructorDetail ? (
                            <Badge 
                              variant="secondary" 
                              className={`text-sm shrink-0 cursor-pointer transition-all duration-200 hover:scale-105 ${
                                currentInstructorDetail.session_type === 'Lecture' 
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                                  : currentInstructorDetail.session_type === 'Tutorial'
                                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-200 dark:hover:bg-purple-900/50'
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
                              {t(`sessionType.${currentInstructorDetail.session_type.toLowerCase()}`)}
                            </Badge>
                          ) : null;
                        })()}
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
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs",
                              // 檢查是否為必修：明確標記為 compulsory 或舊格式的 [COMPULSORY] 前綴
                              (reviewInfo.review.service_learning_type === 'compulsory' || 
                               reviewInfo.review.service_learning_description?.startsWith('[COMPULSORY]'))
                                ? "border-red-300 text-red-700 bg-red-50 dark:border-red-700 dark:text-red-300 dark:bg-red-950/30"
                                : "border-green-300 text-green-700 bg-green-50 dark:border-green-700 dark:text-green-300 dark:bg-green-950/30"
                            )}
                          >
                            {/* 檢查是否為必修，否則顯示選修 */}
                            {(reviewInfo.review.service_learning_type === 'compulsory' || 
                              reviewInfo.review.service_learning_description?.startsWith('[COMPULSORY]'))
                              ? t('review.compulsory')
                              : t('review.optional')}
                          </Badge>
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
                              <div className="flex items-start justify-between mb-3 gap-2">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-lg">
                                    {(() => {
                                      if (instructor) {
                                        const nameInfo = getInstructorName(instructor, language);
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
                                      return currentInstructorDetail.instructor_name;
                                    })()}
                                  </h4>
                                </div>
                                <Badge 
                                  variant="secondary" 
                                  className={`text-sm shrink-0 cursor-pointer transition-all duration-200 hover:scale-105 ${
                                    currentInstructorDetail.session_type === 'Lecture' 
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                                      : currentInstructorDetail.session_type === 'Tutorial'
                                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-200 dark:hover:bg-purple-900/50'
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
                                  {t(`sessionType.${currentInstructorDetail.session_type.toLowerCase()}`)}
                                </Badge>
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
                                      <Badge 
                                        variant="outline" 
                                        className={cn(
                                          "text-xs",
                                          currentInstructorDetail.service_learning_type === 'compulsory'
                                            ? "border-red-300 text-red-700 bg-red-50 dark:border-red-700 dark:text-red-400 dark:bg-red-950/50"
                                            : "border-green-300 text-green-700 bg-green-50 dark:border-green-700 dark:text-green-400 dark:bg-green-950/50"
                                        )}
                                      >
                                        {currentInstructorDetail.service_learning_type === 'compulsory' 
                                          ? t('review.compulsory') 
                                          : t('review.optional')
                                        }
                                      </Badge>
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
                                    <div className="flex items-start justify-between mb-3 gap-2">
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-lg">
                                          <a
                                            href={`/instructors/${encodeURIComponent(instructor.instructor_name)}?review_id=${reviewInfo.review.$id}`}
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
                                              navigate(`/instructors/${encodeURIComponent(instructor.instructor_name)}?review_id=${reviewInfo.review.$id}`);
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
                                              return instructor.instructor_name;
                                            })()}
                                          </a>
                                        </h4>
                                      </div>
                                      <Badge 
                                        variant="secondary" 
                                        className={`text-sm shrink-0 cursor-pointer transition-all duration-200 hover:scale-105 ${
                                          instructor.session_type === 'Lecture' 
                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                                            : instructor.session_type === 'Tutorial'
                                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-200 dark:hover:bg-purple-900/50'
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
                                        {t(`sessionType.${instructor.session_type.toLowerCase()}`)}
                                      </Badge>
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
                                            <Badge 
                                              variant="outline" 
                                              className={cn(
                                                "text-xs",
                                                instructor.service_learning_type === 'compulsory'
                                                  ? "border-red-300 text-red-700 bg-red-50 dark:border-red-700 dark:text-red-400 dark:bg-red-950/50"
                                                  : "border-green-300 text-green-700 bg-green-50 dark:border-green-700 dark:text-green-400 dark:bg-green-950/50"
                                              )}
                                            >
                                              {instructor.service_learning_type === 'compulsory' 
                                                ? t('review.compulsory') 
                                                : t('review.optional')
                                              }
                                            </Badge>
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
      </CollapsibleSection>
      </div>

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