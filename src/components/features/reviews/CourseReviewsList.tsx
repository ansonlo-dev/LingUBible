import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/contexts/AuthContext';
import { useInstructorDetailTeachingLanguages } from '@/hooks/useInstructorDetailTeachingLanguages';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  ChevronDown, 
  ChevronUp, 
  User, 
  MessageSquare,
  GraduationCap,
  CheckCircle,
  XCircle,
  Loader2,
  FileText,
  BookOpen
} from 'lucide-react';
import { formatDateTimeUTC8 } from '@/utils/ui/dateUtils';
import { renderCommentMarkdown, hasMarkdownFormatting } from '@/utils/ui/markdownRenderer';
import { getInstructorName, getTeachingLanguageName, getCourseTitle } from '@/utils/textUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { StarRating } from '@/components/ui/star-rating';
import { VotingButtons } from '@/components/ui/voting-buttons';
import { ReviewAvatar } from '@/components/ui/review-avatar';
import { GradeBadge } from '@/components/ui/GradeBadge';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { CourseReviewInfo, InstructorDetail, CourseService, Instructor, Course } from '@/services/api/courseService';
import { CourseReviewsFilters, ReviewFilters } from './CourseReviewsFilters';
import { CourseRequirementsFilter, CourseRequirementsFilters } from './CourseRequirementsFilter';
import { Pagination } from '@/components/features/reviews/Pagination';
import { cn } from '@/lib/utils';

interface CourseReviewsListProps {
  reviews: (CourseReviewInfo & { upvotes: number; downvotes: number; userVote?: 'up' | 'down' | null })[];
  allReviews?: (CourseReviewInfo & { upvotes: number; downvotes: number; userVote?: 'up' | 'down' | null })[];
  loading?: boolean;
  selectedLanguages?: string[];
  onToggleLanguage?: (language: string) => void;
  onToggleServiceLearning?: (serviceType: string) => void; // Service learning filter handler
  t?: (key: string, params?: Record<string, any>) => any;
  hideHeader?: boolean; // New prop to hide the card header when wrapped in CollapsibleSection
  externalGradeFilter?: string; // External grade to filter by
  currentInstructorName?: string; // Current instructor name to disable hover effects for same instructor
  course?: Course; // Course information for no reviews message
}

interface ExpandedReviews {
  [reviewId: string]: boolean;
}

export const CourseReviewsList = ({ 
  reviews, 
  allReviews, 
  loading = false, 
  selectedLanguages = [], 
  onToggleLanguage,
  onToggleServiceLearning,
  t: tProp,
  hideHeader = false,
  externalGradeFilter,
  currentInstructorName,
  course
}: CourseReviewsListProps) => {

  const { t: tContext, language: siteLanguage } = useLanguage();
  const t = tProp || tContext;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [expandedReviews, setExpandedReviews] = useState<ExpandedReviews>({});
  const [instructorsMap, setInstructorsMap] = useState<Map<string, Instructor>>(new Map());
  const isMobile = useIsMobile();
  const [pendingGradeFilter, setPendingGradeFilter] = useState<string | null>(null);
  
  // Mobile tap states for tooltip and filter functionality (similar to MyReviews.tsx)
  const [mobileTapStates, setMobileTapStates] = useState<{[key: string]: boolean}>({});
  const [mobileTapCounts, setMobileTapCounts] = useState<{[key: string]: number}>({});
  const mobileTimeoutRefs = useRef<{[key: string]: NodeJS.Timeout | null}>({});
  const tooltipRefs = useRef<{[key: string]: HTMLElement | null}>({});
  
  // Clear pending states when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setPendingGradeFilter(null);
    };

    // Add a small delay to avoid clearing immediately when clicking the badge itself
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Clear pending states after timeout
  useEffect(() => {
    if (pendingGradeFilter) {
      const timer = setTimeout(() => {
        setPendingGradeFilter(null);
      }, 3000); // Clear after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [pendingGradeFilter]);

  // Handle clicks outside tooltips to close them (same pattern as MyReviews.tsx)
  useEffect(() => {
    if (!isMobile) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement;
      
      // Get all currently active tooltip keys
      const activeKeys = Object.keys(mobileTapStates).filter(key => mobileTapStates[key]);
      
      console.log('🖱️ CourseReviewsList handleClickOutside:', { 
        targetTagName: target.tagName,
        targetClassName: target.className,
        activeKeys,
        allStates: mobileTapStates,
        allCounts: mobileTapCounts
      });
      
      if (activeKeys.length === 0) {
        console.log('🚫 No active tooltips, returning');
        return;
      }

      // Add a small delay to allow onClick handlers to process first
      // This prevents interference with the two-tap functionality
      setTimeout(() => {
        console.log('⏰ Click outside timeout fired');
        // Check if click is outside all active tooltips
        let clickedInsideAnyTooltip = false;
        
        for (const key of activeKeys) {
          const tooltipElement = tooltipRefs.current[key];
          if (tooltipElement && tooltipElement.contains(target)) {
            clickedInsideAnyTooltip = true;
            console.log('✅ Clicked inside tooltip:', key);
            break;
          }
        }

        console.log('🎯 Click analysis:', { clickedInsideAnyTooltip, activeKeys });

        // If clicked outside all tooltips, close all active tooltips
        if (!clickedInsideAnyTooltip) {
          console.log('🔄 Resetting all active tooltips:', activeKeys);
          activeKeys.forEach(key => {
            // Reset states
            setMobileTapCounts(prev => {
              const updated = { ...prev, [key]: 0 };
              console.log('📊 Click outside - reset tap counts:', updated);
              return updated;
            });
            setMobileTapStates(prev => {
              const updated = { ...prev, [key]: false };
              console.log('🎯 Click outside - reset tap states:', updated);
              return updated;
            });
          });
        }
      }, 10); // Small delay to let onClick handlers process first
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMobile, mobileTapStates]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(mobileTimeoutRefs.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  // Handle mobile two-tap functionality (same pattern as MyReviews.tsx)
  const handleMobileTwoTap = (key: string, action: () => void) => {
    console.log('🔥 CourseReviewsList handleMobileTwoTap called:', { 
      key, 
      isMobile, 
      currentCount: mobileTapCounts[key] || 0,
      currentState: mobileTapStates[key] || false,
      allStates: mobileTapStates,
      allCounts: mobileTapCounts
    });
    
    if (!isMobile) {
      // Desktop: apply filter immediately
      console.log('🖥️ Desktop mode, applying action immediately');
      action();
      return;
    }

    // Mobile: require two taps
    const currentCount = mobileTapCounts[key] || 0;
    const newCount = currentCount + 1;
    
    console.log('📱 Mobile tap:', { key, currentCount, newCount });
    
    setMobileTapCounts(prev => {
      const updated = { ...prev, [key]: newCount };
      console.log('📊 Updated tap counts:', updated);
      return updated;
    });

    if (newCount === 1) {
      // First tap: show tooltip
      console.log('👆 First tap - showing tooltip');
      setMobileTapStates(prev => {
        const updated = { ...prev, [key]: true };
        console.log('🎯 Updated tap states:', updated);
        return updated;
      });
    } else if (newCount === 2) {
      // Second tap: apply filter and hide tooltip
      console.log('👆👆 Second tap - applying filter and hiding tooltip');
      action();
      setMobileTapCounts(prev => {
        const updated = { ...prev, [key]: 0 };
        console.log('📊 Reset tap counts:', updated);
        return updated;
      });
      setMobileTapStates(prev => {
        const updated = { ...prev, [key]: false };
        console.log('🎯 Reset tap states:', updated);
        return updated;
      });
    } else {
      console.log('⚠️ Unexpected tap count:', newCount);
    }
  };
  
  // Extract course code and term code for teaching languages hook
  const firstReview = allReviews?.[0];
  const courseCode = firstReview?.review.course_code || '';
  const termCode = firstReview?.term.term_code || '';
  
  // Collect all instructor details for teaching languages hook
  const allInstructorDetails = useMemo(() => {
    if (!allReviews) return [];
    const details: InstructorDetail[] = [];
    allReviews.forEach(reviewInfo => {
      details.push(...reviewInfo.instructorDetails);
    });
    return details;
  }, [allReviews]);

  // Use teaching languages hook
  const { 
    loading: teachingLanguagesLoading, 
    getTeachingLanguageForInstructor 
  } = useInstructorDetailTeachingLanguages({
    instructorDetails: allInstructorDetails,
    courseCode,
    termCode
  });
  

  
  // 篩選和排序狀態
  const [filters, setFilters] = useState<ReviewFilters>({
    selectedLanguages: [],
    selectedTerms: [],
    selectedInstructors: [],
    selectedSessionTypes: [],
    selectedTeachingLanguages: [],
    selectedGrades: [],
    selectedServiceLearning: [],
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

  // 獲取講師完整信息
  useEffect(() => {
    const fetchInstructorsInfo = async () => {
      if (!allReviews) return;
      
      const instructorNames = new Set<string>();
      allReviews.forEach(reviewInfo => {
        reviewInfo.instructorDetails.forEach(instructorDetail => {
          instructorNames.add(instructorDetail.instructor_name);
        });
      });

      const newInstructorsMap = new Map<string, Instructor>();
      
      // 並行獲取所有講師信息
      const promises = Array.from(instructorNames).map(async (name) => {
        try {
          const instructor = await CourseService.getInstructorByName(name);
          if (instructor) {
            newInstructorsMap.set(name, instructor);
          }
        } catch (error) {
          console.warn(`Failed to fetch instructor info for ${name}:`, error);
        }
      });

      await Promise.all(promises);
      setInstructorsMap(newInstructorsMap);
    };

    fetchInstructorsInfo();
  }, [allReviews]);

  // 計算各語言的評論數量
  const languageCounts = useMemo(() => {
    if (!allReviews) return {};
    const counts: { [key: string]: number } = {};
    allReviews.forEach(reviewInfo => {
      const reviewLanguage = reviewInfo.review.review_language || 'en';
      counts[reviewLanguage] = (counts[reviewLanguage] || 0) + 1;
    });
    return counts;
  }, [allReviews]);

  // 計算各學期的評論數量
  const termCounts = useMemo(() => {
    if (!allReviews) return {};
    const counts: { [key: string]: { name: string; count: number } } = {};
    allReviews.forEach(reviewInfo => {
      const termCode = reviewInfo.term.term_code;
      const termName = reviewInfo.term.name;
      if (!counts[termCode]) {
        counts[termCode] = { name: termName, count: 0 };
      }
      counts[termCode].count++;
    });
    return counts;
  }, [allReviews]);

  // 計算各講師的評論數量
  const instructorCounts = useMemo(() => {
    if (!allReviews) return {};
    const counts: { [key: string]: number } = {};
    allReviews.forEach(reviewInfo => {
      reviewInfo.instructorDetails.forEach(instructorDetail => {
        const instructorName = instructorDetail.instructor_name;
        counts[instructorName] = (counts[instructorName] || 0) + 1;
      });
    });
    return counts;
  }, [allReviews]);

  // 計算各課堂類型的評論數量
  const sessionTypeCounts = useMemo(() => {
    if (!allReviews) return {};
    const counts: { [key: string]: number } = {};
    allReviews.forEach(reviewInfo => {
      reviewInfo.instructorDetails.forEach(instructorDetail => {
        const sessionType = instructorDetail.session_type || 'Unknown';
        counts[sessionType] = (counts[sessionType] || 0) + 1;
      });
    });
    return counts;
  }, [allReviews]);

  // 計算各成績的評論數量
  const gradeCounts = useMemo(() => {
    if (!allReviews) return {};
    const counts: { [key: string]: number } = {};
    allReviews.forEach(reviewInfo => {
      const finalGrade = reviewInfo.review.course_final_grade;
      // Handle different grade representations
      const normalizedGrade = finalGrade === '-1' ? 'N/A' : finalGrade || 'N/A';
      counts[normalizedGrade] = (counts[normalizedGrade] || 0) + 1;
    });
    return counts;
  }, [allReviews]);

  // 計算各教學語言的評論數量
  const teachingLanguageCounts = useMemo(() => {
    if (!allReviews || teachingLanguagesLoading) return {};
    const counts: { [key: string]: number } = {};
    
    allReviews.forEach(reviewInfo => {
      const languages = new Set<string>();
      reviewInfo.instructorDetails.forEach(instructorDetail => {
        const teachingLanguage = getTeachingLanguageForInstructor(
          instructorDetail.instructor_name, 
          instructorDetail.session_type
        );
        if (teachingLanguage) {
          languages.add(teachingLanguage);
        }
      });
      
      // Count each unique teaching language for this review
      languages.forEach(lang => {
        counts[lang] = (counts[lang] || 0) + 1;
      });
    });
    
    return counts;
  }, [allReviews, teachingLanguagesLoading, getTeachingLanguageForInstructor]);

  // 計算各服務學習類型的評論數量
  const serviceLearningCounts = useMemo(() => {
    if (!allReviews) return {};
    const counts: { [key: string]: number } = {};
    
    allReviews.forEach(reviewInfo => {
      let hasServiceLearning = false;
      const serviceLearningTypes = new Set<string>();
      
      reviewInfo.instructorDetails.forEach(instructorDetail => {
        if (instructorDetail.has_service_learning) {
          hasServiceLearning = true;
          serviceLearningTypes.add(instructorDetail.service_learning_type);
        }
      });
      
      if (hasServiceLearning) {
        // Count each unique service learning type for this review
        serviceLearningTypes.forEach(type => {
          counts[type] = (counts[type] || 0) + 1;
        });
      } else {
        counts['none'] = (counts['none'] || 0) + 1;
      }
    });
    
    return counts;
  }, [allReviews]);

  // 篩選和排序評論
  const filteredAndSortedReviews = useMemo(() => {
    let filteredReviews = allReviews || [];

    // 課程要求篩選 (先執行，因為可能會大幅減少評論數量)
    filteredReviews = filteredReviews.filter(reviewInfo => {
      const { instructorDetails } = reviewInfo;
      
      // 檢查是否有任何講師詳情符合篩選條件
      return instructorDetails.some(detail => {
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
    });

    // 語言篩選
    if (filters.selectedLanguages.length > 0 && filters.selectedLanguages.length < Object.keys(languageCounts).length) {
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

    // 講師篩選
    if (filters.selectedInstructors.length > 0) {
      filteredReviews = filteredReviews.filter(reviewInfo => {
        return reviewInfo.instructorDetails.some(instructorDetail => 
          filters.selectedInstructors.includes(instructorDetail.instructor_name)
        );
      });
    }

    // 課堂類型篩選
    if (filters.selectedSessionTypes.length > 0) {
      filteredReviews = filteredReviews.filter(reviewInfo => {
        return reviewInfo.instructorDetails.some(instructorDetail => 
          filters.selectedSessionTypes.includes(instructorDetail.session_type || 'Unknown')
        );
      });
    }

    // 教學語言篩選
    if (filters.selectedTeachingLanguages.length > 0) {
      filteredReviews = filteredReviews.filter(reviewInfo => {
        return reviewInfo.instructorDetails.some(instructorDetail => {
          const teachingLanguage = getTeachingLanguageForInstructor(
            instructorDetail.instructor_name,
            instructorDetail.session_type
          );
          return teachingLanguage && filters.selectedTeachingLanguages.includes(teachingLanguage);
        });
      });
    }

    // 服務學習篩選
    if (filters.selectedServiceLearning.length > 0) {
      filteredReviews = filteredReviews.filter(reviewInfo => {
        // Check if any of the selected service learning types match
        return filters.selectedServiceLearning.some(selectedType => {
          if (selectedType === 'none') {
            // Check if no instructors have service learning
            return !reviewInfo.instructorDetails.some(instructorDetail => instructorDetail.has_service_learning);
          } else {
            // Check for specific service learning type (compulsory/optional)
            return reviewInfo.instructorDetails.some(instructorDetail => 
              instructorDetail.has_service_learning && instructorDetail.service_learning_type === selectedType
            );
          }
        });
      });
    }

    // 成績篩選
    if (filters.selectedGrades.length > 0) {
      // 使用內部成績篩選（來自篩選器）
      filteredReviews = filteredReviews.filter(reviewInfo => {
        const finalGrade = reviewInfo.review.course_final_grade;
        // Handle different grade representations
        const normalizedGrade = finalGrade === '-1' ? 'N/A' : finalGrade;
        return filters.selectedGrades.includes(normalizedGrade || 'N/A');
      });
    }

    // 排序
    filteredReviews.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (filters.sortBy) {
        case 'postDate':
          aValue = new Date(a.review.$createdAt).getTime();
          bValue = new Date(b.review.$createdAt).getTime();
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
        case 'upvotes':
          aValue = a.upvotes || 0;
          bValue = b.upvotes || 0;
          break;
        case 'downvotes':
          aValue = a.downvotes || 0;
          bValue = b.downvotes || 0;
          break;
        default:
          aValue = new Date(a.review.$createdAt).getTime();
          bValue = new Date(b.review.$createdAt).getTime();
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filteredReviews;
  }, [allReviews, filters, languageCounts, requirementsFilters, getTeachingLanguageForInstructor]);

  const totalReviews = allReviews?.length || 0;
  const filteredCount = filteredAndSortedReviews.length;

  // 分頁邏輯
  const paginatedReviews = useMemo(() => {
    const startIndex = (filters.currentPage - 1) * filters.itemsPerPage;
    const endIndex = startIndex + filters.itemsPerPage;
    return filteredAndSortedReviews.slice(startIndex, endIndex);
  }, [filteredAndSortedReviews, filters.currentPage, filters.itemsPerPage]);

  const totalPages = Math.ceil(filteredCount / filters.itemsPerPage);

  const handleFiltersChange = (newFilters: ReviewFilters) => {
    setFilters(newFilters);
  };

  // Apply external grade filter when it changes
  useEffect(() => {
    if (externalGradeFilter) {
      setFilters(prev => ({
        ...prev,
        selectedGrades: [externalGradeFilter],
        currentPage: 1
      }));
    }
  }, [externalGradeFilter]);

  const handleClearAllFilters = () => {
    setFilters({
      selectedLanguages: [],
      selectedTerms: [],
      selectedInstructors: [],
      selectedSessionTypes: [],
      selectedTeachingLanguages: [],
      selectedGrades: [],
      selectedServiceLearning: [],
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

  const toggleReviewExpansion = (reviewId: string) => {
    setExpandedReviews(prev => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));
  };



  const getLanguageCount = (language: string) => {
    return languageCounts[language] || 0;
  };

  const getLanguageDisplayName = (reviewLang: string) => {
    const languageMap: { [key: string]: string } = {
      'en': t('language.english'),
      'zh-TW': t('language.traditionalChinese'),
      'zh-CN': t('language.simplifiedChinese')
    };
    
    return languageMap[reviewLang] || reviewLang;
  };


  const renderRequirementBadge = (hasRequirement: boolean, label: string, filterKey: keyof CourseRequirementsFilters) => {
    const key = `requirement-${filterKey}-${hasRequirement ? 'has' : 'no'}`;
    return (
      <ResponsiveTooltip 
        content={t('filter.clickToFilterRequirement', { requirement: label })}
        hasClickAction={true}
        clickActionText={isMobile ? t('tooltip.clickAgainToFilter') : undefined}
        open={isMobile ? mobileTapStates[key] : undefined}
        onOpenChange={isMobile ? () => {
          // Tooltip state managed by handleMobileTwoTap
        } : undefined}
      >
        <Badge
          ref={(el) => {
            if (el) tooltipRefs.current[key] = el;
          }}
          variant={hasRequirement ? "default" : "secondary"}
          className={`text-xs shrink-0 cursor-pointer transition-all duration-200 ${hasRequirement ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleMobileTwoTap(key, () => {
              setRequirementsFilters(prev => ({
                ...prev,
                [filterKey]: hasRequirement ? 'has' : 'no'
              }));
            });
          }}
        >
          {hasRequirement ? (
            <CheckCircle className="h-3 w-3 mr-1 shrink-0" />
          ) : (
            <XCircle className="h-3 w-3 mr-1 shrink-0" />
          )}
          <span className="truncate">{label}</span>
        </Badge>
      </ResponsiveTooltip>
    );
  };

  const renderInstructorDetails = (instructorDetails: InstructorDetail[], reviewId: string) => {
    return (
      <div className="space-y-4">
        {instructorDetails.map((instructor, index) => (
          <div 
            key={index} 
            className="rounded-lg p-4 overflow-hidden bg-gray-200 dark:bg-[rgb(26_35_50)]"
          >
            <div className="space-y-2 mb-3">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-4">
                <h4 className="font-semibold text-lg flex items-center gap-2 min-w-0 md:flex-1">
                  {instructor.instructor_name !== currentInstructorName ? (
                  <a 
                    href={`/instructors/${encodeURIComponent(instructor.instructor_name)}?review_id=${reviewId}`}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/instructors/${encodeURIComponent(instructor.instructor_name)}?review_id=${reviewId}`);
                    }}
                      className="text-primary cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors px-2 py-1 rounded-md inline-block no-underline"
                  >
                    {(() => {
                      const fullInstructor = instructorsMap.get(instructor.instructor_name);
                      if (fullInstructor) {
                        const nameInfo = getInstructorName(fullInstructor, siteLanguage);
                        return (
                          <div>
                              <div className="font-bold">{nameInfo.primary}</div>
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
                            <div className="font-bold">{instructor.instructor_name}</div>
                        </div>
                      );
                    })()}
                  </a>
                  ) : (
                    <span>
                      {(() => {
                        const fullInstructor = instructorsMap.get(instructor.instructor_name);
                        if (fullInstructor) {
                          const nameInfo = getInstructorName(fullInstructor, siteLanguage);
                          return (
                            <div>
                              <div className="font-bold">{nameInfo.primary}</div>
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
                            <div className="font-bold">{instructor.instructor_name}</div>
                          </div>
                        );
                      })()}
                    </span>
                  )}
                </h4>
                
                {/* Desktop/Tablet: Badges on the same line as instructor name (right side) */}
                <div className="hidden md:flex md:items-start md:gap-2 md:shrink-0">
                  {/* 課堂類型徽章 */}
                  <ResponsiveTooltip
                    content={t('filter.clickToFilterBySessionType', { type: t(`sessionTypeBadge.${instructor.session_type.toLowerCase()}`) })}
                    hasClickAction={true}
                    clickActionText={isMobile ? t('tooltip.clickAgainToFilter') : undefined}
                    open={isMobile ? mobileTapStates[`session-${instructor.instructor_name}-${instructor.session_type}-desktop`] : undefined}
                    onOpenChange={isMobile ? (open) => setMobileTapStates(prev => ({ ...prev, [`session-${instructor.instructor_name}-${instructor.session_type}-desktop`]: open })) : undefined}
                  >
                    <span
                      ref={(el) => {
                        if (el) tooltipRefs.current[`session-${instructor.instructor_name}-${instructor.session_type}-desktop`] = el;
                      }} 
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs cursor-help transition-all duration-200 hover:scale-105 shrink-0 ${
                        instructor.session_type === 'Lecture' 
                          ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50'
                          : instructor.session_type === 'Tutorial'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/50'
                          : ''
                      }`}
                      onClick={() => {
                        handleMobileTwoTap(`session-${instructor.instructor_name}-${instructor.session_type}-desktop`, () => {
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
                        });
                      }}
                    >
                      {t(`sessionTypeBadge.${instructor.session_type.toLowerCase()}`)}
                    </span>
                  </ResponsiveTooltip>

                  {/* 教學語言徽章 */}
                  {(() => {
                    const teachingLanguage = getTeachingLanguageForInstructor(
                      instructor.instructor_name,
                      instructor.session_type
                    );
                    if (teachingLanguage) {
                      return (
                        <ResponsiveTooltip
                          content={t('filter.clickToFilterByTeachingLanguage', { language: getTeachingLanguageName(teachingLanguage, t) })}
                          hasClickAction={true}
                          clickActionText={isMobile ? t('tooltip.clickAgainToFilter') : undefined}
                          open={isMobile ? mobileTapStates[`teaching-lang-${instructor.instructor_name}-${teachingLanguage}-desktop`] : undefined}
                          onOpenChange={isMobile ? (open) => setMobileTapStates(prev => ({ ...prev, [`teaching-lang-${instructor.instructor_name}-${teachingLanguage}-desktop`]: open })) : undefined}
                        >
                          <span
                            ref={(el) => {
                              if (el) tooltipRefs.current[`teaching-lang-${instructor.instructor_name}-${teachingLanguage}-desktop`] = el;
                            }} 
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800 cursor-help transition-all duration-200 hover:scale-105 hover:bg-orange-100 dark:hover:bg-orange-900/50 max-w-full"
                            onClick={() => {
                              handleMobileTwoTap(`teaching-lang-${instructor.instructor_name}-${teachingLanguage}-desktop`, () => {
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
                              });
                            }}
                          >
                            <span className="truncate">{getTeachingLanguageName(teachingLanguage, t)}</span>
                          </span>
                        </ResponsiveTooltip>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
              
              {/* Mobile: Badges on separate lines below instructor name */}
              <div className="flex md:hidden flex-wrap items-center gap-2">
                {/* 課堂類型徽章 */}
                <ResponsiveTooltip
                  content={t('filter.clickToFilterBySessionType', { type: t(`sessionTypeBadge.${instructor.session_type.toLowerCase()}`) })}
                  hasClickAction={true}
                  clickActionText={isMobile ? t('tooltip.clickAgainToFilter') : undefined}
                  open={isMobile ? mobileTapStates[`session-${instructor.instructor_name}-${instructor.session_type}-mobile`] : undefined}
                  onOpenChange={isMobile ? (open) => setMobileTapStates(prev => ({ ...prev, [`session-${instructor.instructor_name}-${instructor.session_type}-mobile`]: open })) : undefined}
                >
                  <span
                    ref={(el) => {
                      if (el) tooltipRefs.current[`session-${instructor.instructor_name}-${instructor.session_type}-mobile`] = el;
                    }} 
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs cursor-help transition-all duration-200 hover:scale-105 shrink-0 ${
                      instructor.session_type === 'Lecture' 
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50'
                        : instructor.session_type === 'Tutorial'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/50'
                        : ''
                    }`}
                    onClick={() => {
                      handleMobileTwoTap(`session-${instructor.instructor_name}-${instructor.session_type}-mobile`, () => {
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
                      });
                    }}
                  >
                    {t(`sessionTypeBadge.${instructor.session_type.toLowerCase()}`)}
                  </span>
                </ResponsiveTooltip>

                {/* 教學語言徽章 */}
                {(() => {
                  const teachingLanguage = getTeachingLanguageForInstructor(
                    instructor.instructor_name,
                    instructor.session_type
                  );
                  if (teachingLanguage) {
                    return (
                      <ResponsiveTooltip
                        content={t('filter.clickToFilterByTeachingLanguage', { language: getTeachingLanguageName(teachingLanguage, t) })}
                        hasClickAction={true}
                        clickActionText={isMobile ? t('tooltip.clickAgainToFilter') : undefined}
                        open={isMobile ? mobileTapStates[`teaching-lang-${instructor.instructor_name}-${teachingLanguage}-mobile`] : undefined}
                        onOpenChange={isMobile ? (open) => setMobileTapStates(prev => ({ ...prev, [`teaching-lang-${instructor.instructor_name}-${teachingLanguage}-mobile`]: open })) : undefined}
                      >
                        <span
                          ref={(el) => {
                            if (el) tooltipRefs.current[`teaching-lang-${instructor.instructor_name}-${teachingLanguage}-mobile`] = el;
                          }} 
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800 cursor-help transition-all duration-200 hover:scale-105 hover:bg-orange-100 dark:hover:bg-orange-900/50 max-w-full"
                          onClick={() => {
                            handleMobileTwoTap(`teaching-lang-${instructor.instructor_name}-${teachingLanguage}-mobile`, () => {
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
                            });
                          }}
                        >
                          <span className="truncate">{getTeachingLanguageName(teachingLanguage, t)}</span>
                        </span>
                      </ResponsiveTooltip>
                    );
                  }
                  return null;
                })()}
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
            <div className="mb-6">
              <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4 shrink-0" />
                <span>{t('review.courseRequirements')}</span>
              </h5>
              <div className="ml-4 flex flex-wrap gap-2 overflow-hidden">
                {renderRequirementBadge(instructor.has_attendance_requirement, t('review.requirements.attendance'), 'attendance')}
                {renderRequirementBadge(instructor.has_quiz, t('review.requirements.quiz'), 'quiz')}
                {renderRequirementBadge(instructor.has_midterm, t('review.requirements.midterm'), 'midterm')}
                {renderRequirementBadge(instructor.has_final, t('review.requirements.final'), 'final')}
                {renderRequirementBadge(instructor.has_individual_assignment, t('review.requirements.individualAssignment'), 'individualAssignment')}
                {renderRequirementBadge(instructor.has_group_project, t('review.requirements.groupProject'), 'groupProject')}
                {renderRequirementBadge(instructor.has_presentation, t('review.requirements.presentation'), 'presentation')}
                {renderRequirementBadge(instructor.has_reading, t('review.requirements.reading'), 'reading')}
              </div>
            </div>

            {/* 講師評論 */}
            {instructor.comments && (
              <div className="min-w-0 mb-6">
                <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <User className="h-4 w-4 shrink-0" />
                  <span>{t('review.instructorComments')}</span>
                </h5>
                <div className="ml-4 break-words text-sm">
                  {hasMarkdownFormatting(instructor.comments) ? (
                    <div className="text-sm">{renderCommentMarkdown(instructor.comments)}</div>
                  ) : (
                    <p className="text-sm">
                      {instructor.comments}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 服務學習 */}
            {instructor.has_service_learning && (
              <div className="mb-6">
                <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 shrink-0" />
                  <span>{t('review.serviceLearning')}</span>
                </h5>
                <div className="ml-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <ResponsiveTooltip
                      content={t('filter.clickToFilterServiceLearning', { 
                        type: instructor.service_learning_type === 'compulsory' ? t('review.compulsory') : t('review.optional')
                      })}
                      hasClickAction={true}
                      clickActionText={isMobile ? t('tooltip.clickAgainToFilter') : undefined}
                      open={isMobile ? mobileTapStates[`service-learning-${instructor.instructor_name}-${instructor.service_learning_type}`] : undefined}
                      onOpenChange={isMobile ? (open) => setMobileTapStates(prev => ({ ...prev, [`service-learning-${instructor.instructor_name}-${instructor.service_learning_type}`]: open })) : undefined}
                    >
                      <span
                        ref={(el) => {
                          if (el) tooltipRefs.current[`service-learning-${instructor.instructor_name}-${instructor.service_learning_type}`] = el;
                        }} 
                        className={cn(
                          "inline-flex items-center px-1.5 py-0.5 rounded text-xs cursor-pointer transition-all duration-200 hover:scale-105",
                          instructor.service_learning_type === 'compulsory'
                            ? "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40"
                            : "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/40"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleMobileTwoTap(`service-learning-${instructor.instructor_name}-${instructor.service_learning_type}`, () => {
                            const newFilters = { ...filters };
                            const serviceType = instructor.service_learning_type;
                            
                            // 切換服務學習篩選器  
                            if (newFilters.selectedServiceLearning.includes(serviceType)) {
                              newFilters.selectedServiceLearning = newFilters.selectedServiceLearning.filter(type => type !== serviceType);
                            } else {
                              newFilters.selectedServiceLearning = [serviceType];
                            }
                            
                            // 重置頁面到第一頁
                            newFilters.currentPage = 1;
                            
                            handleFiltersChange(newFilters);
                          });
                        }}
                      >
                        {instructor.service_learning_type === 'compulsory' 
                          ? t('review.compulsory') 
                          : t('review.optional')
                        }
                      </span>
                    </ResponsiveTooltip>
                  </div>
                  {instructor.service_learning_description && (
                    <div className="text-xs break-words">
                      {hasMarkdownFormatting(instructor.service_learning_description) ? (
                        <div className="text-xs">{renderCommentMarkdown(instructor.service_learning_description)}</div>
                      ) : (
                        <p className="text-xs">
                          {instructor.service_learning_description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="course-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* 語言篩選器 - 載入時也顯示 */}
            {onToggleLanguage && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex flex-wrap gap-1">
                  <Button
                    variant={selectedLanguages.includes('en') ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onToggleLanguage('en')}
                    className="text-xs"
                    disabled={loading}
                  >
                    {t('review.languageOptions.en')} ({getLanguageCount('en')})
                  </Button>
                  <Button
                    variant={selectedLanguages.includes('zh-TW') ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onToggleLanguage('zh-TW')}
                    className="text-xs"
                    disabled={loading}
                  >
                    {t('review.languageOptions.zh-TW')} ({getLanguageCount('zh-TW')})
                  </Button>
                  <Button
                    variant={selectedLanguages.includes('zh-CN') ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onToggleLanguage('zh-CN')}
                    className="text-xs"
                    disabled={loading}
                  >
                    {t('review.languageOptions.zh-CN')} ({getLanguageCount('zh-CN')})
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">{t('review.loadingCourseReviews')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (totalReviews === 0) {
    if (hideHeader) {
      return (
        <div className="text-center py-12 space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-muted/50 rounded-full">
              <MessageSquare className="h-12 w-12 text-muted-foreground" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-muted-foreground">{t('review.noReviewsTitle')}</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {t('review.noReviewsDesc', { 
                courseName: course ? course.course_code : 'This course'
              })}
            </p>
          </div>
        </div>
      );
    }

    return (
      <Card className="course-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* 語言篩選器 - 無評論時也顯示 */}
            {onToggleLanguage && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex flex-wrap gap-1">
                  <Button
                    variant={selectedLanguages.includes('en') ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onToggleLanguage('en')}
                    className="text-xs"
                  >
                    {t('review.languageOptions.en')} (0)
                  </Button>
                  <Button
                    variant={selectedLanguages.includes('zh-TW') ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onToggleLanguage('zh-TW')}
                    className="text-xs"
                  >
                    {t('review.languageOptions.zh-TW')} (0)
                  </Button>
                  <Button
                    variant={selectedLanguages.includes('zh-CN') ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onToggleLanguage('zh-CN')}
                    className="text-xs"
                  >
                    {t('review.languageOptions.zh-CN')} (0)
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-muted/50 rounded-full">
                <MessageSquare className="h-12 w-12 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-muted-foreground">{t('review.noReviewsTitle')}</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {t('review.noReviewsDesc', { 
                  courseName: course ? course.course_code : 'This course'
                })}
              </p>
            </div>

          </div>
        </CardContent>
      </Card>
    );
  }

  if (hideHeader) {
    return (
      <div className="space-y-2">
        {/* 課程要求篩選器 */}
        <CourseRequirementsFilter
          filters={requirementsFilters}
          onFiltersChange={setRequirementsFilters}
        />
        
        {/* 篩選和排序組件 */}
        <CourseReviewsFilters
          filters={filters}
          languageCounts={languageCounts}
          termCounts={termCounts}
          instructorCounts={instructorCounts}
          sessionTypeCounts={sessionTypeCounts}
          teachingLanguageCounts={teachingLanguageCounts}
          gradeCounts={gradeCounts}
          serviceLearningCounts={serviceLearningCounts}
          totalReviews={totalReviews}
          filteredReviews={filteredCount}
          onFiltersChange={handleFiltersChange}
          onClearAll={handleClearAllFilters}
        />
        {filteredCount === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t('review.noReviewsMatchFilter')}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {t('review.adjustFilterToSeeReviews')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {paginatedReviews.map((reviewInfo) => {
              const { review, term, instructorDetails } = reviewInfo;
              const isExpanded = expandedReviews[review.$id];
              
              return (
                <div key={review.$id} data-review-id={review.$id} className="rounded-lg p-3 space-y-2 overflow-hidden bg-card border border-border dark:bg-[#202936] dark:border-[#2a3441]">
                {/* 評論基本信息 */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-2 min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <ReviewAvatar
                        isAnonymous={review.is_anon}
                        userId={review.user_id}
                        username={review.username}
                        reviewId={review.$id}
                        size="sm"
                        className="shrink-0"
                      />
                      <span className="font-medium truncate">
                        {review.is_anon ? t('review.anonymousUser') : review.username}
                      </span>
                    </div>
                    {/* 學期和語言徽章 - 手機版單獨行 */}
                    <div className="flex gap-2 mt-1 flex-wrap md:hidden max-w-[calc(100%-3rem)]">
                      <ResponsiveTooltip
                        content={t('filter.clickToFilterByTerm', { term: term.name })}
                        hasClickAction={true}
                        clickActionText={isMobile ? t('tooltip.clickAgainToFilter') : undefined}
                        open={isMobile ? mobileTapStates[`term-${term.term_code}-hideheader-1`] : undefined}
                        onOpenChange={isMobile ? (open) => setMobileTapStates(prev => ({ ...prev, [`term-${term.term_code}-hideheader-1`]: open })) : undefined}
                      >
                        <button
                          ref={(el) => {
                            if (el) tooltipRefs.current[`term-${term.term_code}-hideheader-1`] = el;
                          }}
                          className="px-2 py-1 text-xs rounded-md transition-colors border bg-background hover:bg-muted border-border hover:border-primary/50 w-fit cursor-help"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleMobileTwoTap(`term-${term.term_code}-hideheader-1`, () => {
                              setFilters(prev => ({
                                ...prev,
                                selectedTerms: [term.term_code],
                                currentPage: 1
                              }));
                            });
                          }}
                        >
                          <span className="truncate">{term.name}</span>
                        </button>
                      </ResponsiveTooltip>
                      {/* 語言徽章 - 手機版顯示在學期旁邊，限制最大寬度避免重疊 */}
                      {review.review_language && (
                        <ResponsiveTooltip
                          content={t('filter.clickToFilterByLanguage', { language: getLanguageDisplayName(review.review_language) })}
                          hasClickAction={true}
                          clickActionText={isMobile ? t('tooltip.clickAgainToFilter') : undefined}
                          open={isMobile ? mobileTapStates[`review-lang-${review.review_language}-hideheader-1`] : undefined}
                          onOpenChange={isMobile ? (open) => setMobileTapStates(prev => ({ ...prev, [`review-lang-${review.review_language}-hideheader-1`]: open })) : undefined}
                        >
                          <button
                            ref={(el) => {
                              if (el) tooltipRefs.current[`review-lang-${review.review_language}-hideheader-1`] = el;
                            }}
                            className="px-2 py-1 text-xs rounded-md transition-colors border bg-background hover:bg-muted border-border hover:border-primary/50 w-fit cursor-help"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleMobileTwoTap(`review-lang-${review.review_language}-hideheader-1`, () => {
                                setFilters(prev => ({
                                  ...prev,
                                  selectedLanguages: [review.review_language!],
                                  currentPage: 1
                                }));
                              });
                            }}
                          >
                            <span className="truncate">{getLanguageDisplayName(review.review_language)}</span>
                          </button>
                        </ResponsiveTooltip>
                      )}
                    </div>
                  </div>
                  {/* 右上角：學期和語言徽章、最終成績 */}
                  <div className="flex items-start gap-3 shrink-0">
                    {/* 學期和語言徽章 - 桌面版顯示在成績圓圈左側 */}
                    <div className="hidden md:flex items-center gap-2 shrink-0">
                      <ResponsiveTooltip
                        content={t('filter.clickToFilterByTerm', { term: term.name })}
                        hasClickAction={true}
                        clickActionText={isMobile ? t('tooltip.clickAgainToFilter') : undefined}
                        open={isMobile ? mobileTapStates[`term-${term.term_code}-hideheader-2`] : undefined}
                        onOpenChange={isMobile ? (open) => setMobileTapStates(prev => ({ ...prev, [`term-${term.term_code}-hideheader-2`]: open })) : undefined}
                      >
                        <button
                          ref={(el) => {
                            if (el) tooltipRefs.current[`term-${term.term_code}-hideheader-2`] = el;
                          }}
                          className="px-2 py-1 text-xs rounded-md transition-colors border bg-background hover:bg-muted border-border hover:border-primary/50 shrink-0 cursor-help"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleMobileTwoTap(`term-${term.term_code}-hideheader-2`, () => {
                              setFilters(prev => ({
                                ...prev,
                                selectedTerms: [term.term_code],
                                currentPage: 1
                              }));
                            });
                          }}
                        >
                          <span className="truncate">{term.name}</span>
                        </button>
                      </ResponsiveTooltip>
                      {/* 語言徽章 - 桌面版顯示在學期旁邊 */}
                      {review.review_language && (
                        <ResponsiveTooltip
                          content={t('filter.clickToFilterByLanguage', { language: getLanguageDisplayName(review.review_language) })}
                          hasClickAction={true}
                          clickActionText={isMobile ? t('tooltip.clickAgainToFilter') : undefined}
                          open={isMobile ? mobileTapStates[`review-lang-${review.review_language}-hideheader-2`] : undefined}
                          onOpenChange={isMobile ? (open) => setMobileTapStates(prev => ({ ...prev, [`review-lang-${review.review_language}-hideheader-2`]: open })) : undefined}
                        >
                          <button
                            ref={(el) => {
                              if (el) tooltipRefs.current[`review-lang-${review.review_language}-hideheader-2`] = el;
                            }}
                            className="px-2 py-1 text-xs rounded-md transition-colors border bg-background hover:bg-muted border-border hover:border-primary/50 shrink-0 cursor-help"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleMobileTwoTap(`review-lang-${review.review_language}-hideheader-2`, () => {
                                setFilters(prev => ({
                                  ...prev,
                                  selectedLanguages: [review.review_language!],
                                  currentPage: 1
                                }));
                              });
                            }}
                          >
                            <span className="truncate">{getLanguageDisplayName(review.review_language)}</span>
                          </button>
                        </ResponsiveTooltip>
                      )}
                    </div>
                    {/* 最終成績 */}
                    {review.course_final_grade && (
                      <div className="flex flex-col items-center">
                        <GradeBadge 
                          ref={(el) => {
                            if (el) tooltipRefs.current[`grade-${review.course_final_grade}`] = el;
                          }}
                          grade={review.course_final_grade}
                          size="md"
                          showTooltip={true}
                          hasClickAction={true}
                          isPending={isMobile ? mobileTapStates[`grade-${review.course_final_grade}`] : false}
                          mobileTooltipOpen={isMobile ? mobileTapStates[`grade-${review.course_final_grade}`] : undefined}
                          onMobileTooltipChange={isMobile ? () => {
                            // Tooltip state managed by timeout
                          } : undefined}
                          onClick={() => {
                            handleMobileTwoTap(`grade-${review.course_final_grade}`, () => {
                              const normalizedGrade = review.course_final_grade === '-1' ? 'N/A' : review.course_final_grade;
                              setFilters(prev => ({
                                ...prev,
                                selectedGrades: [normalizedGrade],
                                currentPage: 1
                              }));
                            });
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 課程評分 */}
                <div className="grid grid-cols-3 gap-1 text-xs">
                  <div className="text-center">
                    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-center gap-1 mb-1">
                      <span className="font-medium text-sm sm:text-base">{t('review.workload')}</span>
                      <div className="flex items-center justify-center">
                        {review.course_workload === null || review.course_workload === -1 ? (
                          <span className="text-muted-foreground">
                            {review.course_workload === -1 ? t('review.notApplicable') : t('review.rating.notRated')}
                          </span>
                        ) : (
                          <StarRating rating={review.course_workload} showValue size="sm" showTooltip ratingType="workload" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-center gap-1 mb-1">
                      <span className="font-medium text-sm sm:text-base">{t('review.difficulty')}</span>
                      <div className="flex items-center justify-center">
                        {review.course_difficulties === null || review.course_difficulties === -1 ? (
                          <span className="text-muted-foreground">
                            {review.course_difficulties === -1 ? t('review.notApplicable') : t('review.rating.notRated')}
                          </span>
                        ) : (
                          <StarRating rating={review.course_difficulties} showValue size="sm" showTooltip ratingType="difficulty" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-center gap-1 mb-1">
                      <span className="font-medium text-sm sm:text-base">{t('review.usefulness')}</span>
                      <div className="flex items-center justify-center">
                        {review.course_usefulness === null || review.course_usefulness === -1 ? (
                          <span className="text-muted-foreground">
                            {review.course_usefulness === -1 ? t('review.notApplicable') : t('review.rating.notRated')}
                          </span>
                        ) : (
                          <StarRating rating={review.course_usefulness} showValue size="sm" showTooltip ratingType="usefulness" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 課程評論 */}
                {review.course_comments && (
                  <>
                    <Separator />
                    <div className="min-w-0">
                      <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 shrink-0" />
                        <span>{t('review.courseComments')}</span>
                      </h5>
                      <div className="bg-muted/50 p-2 rounded-md break-words text-sm">
                        {hasMarkdownFormatting(review.course_comments) ? (
                          <div className="text-sm">{renderCommentMarkdown(review.course_comments)}</div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {review.course_comments}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Service learning is now displayed per instructor in the instructor details section */}

                {/* 講師評價展開/收起按鈕 */}
                {instructorDetails.length > 0 && (
                  <>
                    <Separator />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleReviewExpansion(review.$id)}
                      className="w-full justify-center"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-2" />
                          {t('review.hideInstructorDetails')}
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-2" />
                          {t('review.showInstructorDetails')} ({instructorDetails.length})
                        </>
                      )}
                    </Button>
                  </>
                )}

                {/* 講師詳細評價 */}
                {isExpanded && instructorDetails.length > 0 && (
                  <>
                    <Separator />
                    {renderInstructorDetails(instructorDetails, review.$id)}
                  </>
                )}

                {/* 投票按鈕 */}
                <Separator />
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 overflow-hidden">
                  <div className="flex-shrink-0">
                    <VotingButtons
                      reviewId={review.$id}
                      upvotes={reviewInfo.upvotes}
                      downvotes={reviewInfo.downvotes}
                      userVote={reviewInfo.userVote}
                      size="sm"
                    />
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 min-w-0">
                    <ResponsiveTooltip content={t('review.timestampTooltip', { timezone: 'Hong Kong Time (UTC+8)' })}>
                      <span className="truncate cursor-help">
                        {formatDateTimeUTC8(review.submitted_at)}
                      </span>
                    </ResponsiveTooltip>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}
        <Pagination
          currentPage={filters.currentPage}
          totalPages={totalPages}
          onPageChange={(page) => handleFiltersChange({ ...filters, currentPage: page })}
          itemsPerPage={filters.itemsPerPage}
          totalItems={filteredCount}
        />
      </div>
    );
  }

  return (
    <Card className="course-card">
      <CardHeader>
      </CardHeader>
      <CardContent className="space-y-2 overflow-hidden">
        {/* 課程要求篩選器 */}
        <CourseRequirementsFilter
          filters={requirementsFilters}
          onFiltersChange={setRequirementsFilters}
        />
        
        {/* 篩選和排序組件 */}
        <CourseReviewsFilters
          filters={filters}
          languageCounts={languageCounts}
          termCounts={termCounts}
          instructorCounts={instructorCounts}
          sessionTypeCounts={sessionTypeCounts}
          teachingLanguageCounts={teachingLanguageCounts}
          gradeCounts={gradeCounts}
          serviceLearningCounts={serviceLearningCounts}
          totalReviews={totalReviews}
          filteredReviews={filteredCount}
          onFiltersChange={handleFiltersChange}
          onClearAll={handleClearAllFilters}
        />
        {filteredCount === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t('review.noReviewsMatchFilter')}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {t('review.adjustFilterToSeeReviews')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {paginatedReviews.map((reviewInfo) => {
              const { review, term, instructorDetails } = reviewInfo;
              const isExpanded = expandedReviews[review.$id];
              
              return (
                <div key={review.$id} data-review-id={review.$id} className="rounded-lg p-3 space-y-2 overflow-hidden bg-card border border-border dark:bg-[#202936] dark:border-[#2a3441]">
                {/* 評論基本信息 */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-2 min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <ReviewAvatar
                        isAnonymous={review.is_anon}
                        userId={review.user_id}
                        username={review.username}
                        reviewId={review.$id}
                        size="sm"
                        className="shrink-0"
                      />
                      <span className="font-medium truncate">
                        {review.is_anon ? t('review.anonymousUser') : review.username}
                      </span>
                    </div>
                    {/* 學期和語言徽章 - 手機版單獨行 */}
                    <div className="flex gap-2 mt-1 flex-wrap md:hidden max-w-[calc(100%-3rem)]">
                      <ResponsiveTooltip
                        content={t('filter.clickToFilterByTerm', { term: term.name })}
                        hasClickAction={true}
                        clickActionText={isMobile ? t('tooltip.clickAgainToFilter') : undefined}
                        open={isMobile ? mobileTapStates[`term-${term.term_code}-card-1`] : undefined}
                        onOpenChange={isMobile ? (open) => setMobileTapStates(prev => ({ ...prev, [`term-${term.term_code}-card-1`]: open })) : undefined}
                      >
                        <button
                          ref={(el) => {
                            if (el) tooltipRefs.current[`term-${term.term_code}-card-1`] = el;
                          }}
                          className="px-2 py-1 text-xs rounded-md transition-colors border bg-background hover:bg-muted border-border hover:border-primary/50 w-fit cursor-help"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleMobileTwoTap(`term-${term.term_code}-card-1`, () => {
                              setFilters(prev => ({
                                ...prev,
                                selectedTerms: [term.term_code],
                                currentPage: 1
                              }));
                            });
                          }}
                        >
                          <span className="truncate">{term.name}</span>
                        </button>
                      </ResponsiveTooltip>
                      {/* 語言徽章 - 手機版顯示在學期旁邊，限制最大寬度避免重疊 */}
                      {review.review_language && (
                        <ResponsiveTooltip
                          content={t('filter.clickToFilterByLanguage', { language: getLanguageDisplayName(review.review_language) })}
                          hasClickAction={true}
                          clickActionText={isMobile ? t('tooltip.clickAgainToFilter') : undefined}
                          open={isMobile ? mobileTapStates[`review-lang-${review.review_language}-card-1`] : undefined}
                          onOpenChange={isMobile ? (open) => setMobileTapStates(prev => ({ ...prev, [`review-lang-${review.review_language}-card-1`]: open })) : undefined}
                        >
                          <button
                            ref={(el) => {
                              if (el) tooltipRefs.current[`review-lang-${review.review_language}-card-1`] = el;
                            }}
                            className="px-2 py-1 text-xs rounded-md transition-colors border bg-background hover:bg-muted border-border hover:border-primary/50 w-fit cursor-help"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleMobileTwoTap(`review-lang-${review.review_language}-card-1`, () => {
                                setFilters(prev => ({
                                  ...prev,
                                  selectedLanguages: [review.review_language!],
                                  currentPage: 1
                                }));
                              });
                            }}
                          >
                            <span className="truncate">{getLanguageDisplayName(review.review_language)}</span>
                          </button>
                        </ResponsiveTooltip>
                      )}
                    </div>
                  </div>
                  {/* 右上角：學期和語言徽章、最終成績 */}
                  <div className="flex items-start gap-3 shrink-0">
                    {/* 學期和語言徽章 - 桌面版顯示在成績圓圈左側 */}
                    <div className="hidden md:flex items-center gap-2 shrink-0">
                      <ResponsiveTooltip
                        content={t('filter.clickToFilterByTerm', { term: term.name })}
                        hasClickAction={true}
                        clickActionText={isMobile ? t('tooltip.clickAgainToFilter') : undefined}
                        open={isMobile ? mobileTapStates[`term-${term.term_code}-card-2`] : undefined}
                        onOpenChange={isMobile ? (open) => setMobileTapStates(prev => ({ ...prev, [`term-${term.term_code}-card-2`]: open })) : undefined}
                      >
                        <button
                          ref={(el) => {
                            if (el) tooltipRefs.current[`term-${term.term_code}-card-2`] = el;
                          }}
                          className="px-2 py-1 text-xs rounded-md transition-colors border bg-background hover:bg-muted border-border hover:border-primary/50 shrink-0 cursor-help"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleMobileTwoTap(`term-${term.term_code}-card-2`, () => {
                              setFilters(prev => ({
                                ...prev,
                                selectedTerms: [term.term_code],
                                currentPage: 1
                              }));
                            });
                          }}
                        >
                          <span className="truncate">{term.name}</span>
                        </button>
                      </ResponsiveTooltip>
                      {/* 語言徽章 - 桌面版顯示在學期旁邊 */}
                      {review.review_language && (
                        <ResponsiveTooltip
                          content={t('filter.clickToFilterByLanguage', { language: getLanguageDisplayName(review.review_language) })}
                          hasClickAction={true}
                          clickActionText={isMobile ? t('tooltip.clickAgainToFilter') : undefined}
                          open={isMobile ? mobileTapStates[`review-lang-${review.review_language}-card-2`] : undefined}
                          onOpenChange={isMobile ? (open) => setMobileTapStates(prev => ({ ...prev, [`review-lang-${review.review_language}-card-2`]: open })) : undefined}
                        >
                          <button
                            ref={(el) => {
                              if (el) tooltipRefs.current[`review-lang-${review.review_language}-card-2`] = el;
                            }}
                            className="px-2 py-1 text-xs rounded-md transition-colors border bg-background hover:bg-muted border-border hover:border-primary/50 shrink-0 cursor-help"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleMobileTwoTap(`review-lang-${review.review_language}-card-2`, () => {
                                setFilters(prev => ({
                                  ...prev,
                                  selectedLanguages: [review.review_language!],
                                  currentPage: 1
                                }));
                              });
                            }}
                          >
                            <span className="truncate">{getLanguageDisplayName(review.review_language)}</span>
                          </button>
                        </ResponsiveTooltip>
                      )}
                    </div>
                    {/* 最終成績 */}
                    {review.course_final_grade && (
                      <div className="flex flex-col items-center">
                        <GradeBadge 
                          ref={(el) => {
                            if (el) tooltipRefs.current[`grade-${review.course_final_grade}`] = el;
                          }}
                          grade={review.course_final_grade}
                          size="md"
                          showTooltip={true}
                          hasClickAction={true}
                          isPending={isMobile ? mobileTapStates[`grade-${review.course_final_grade}`] : false}
                          mobileTooltipOpen={isMobile ? mobileTapStates[`grade-${review.course_final_grade}`] : undefined}
                          onMobileTooltipChange={isMobile ? () => {
                            // Tooltip state managed by timeout
                          } : undefined}
                          onClick={() => {
                            handleMobileTwoTap(`grade-${review.course_final_grade}`, () => {
                              const normalizedGrade = review.course_final_grade === '-1' ? 'N/A' : review.course_final_grade;
                              setFilters(prev => ({
                                ...prev,
                                selectedGrades: [normalizedGrade],
                                currentPage: 1
                              }));
                            });
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 課程評分 */}
                <div className="grid grid-cols-3 gap-1 text-xs">
                  <div className="text-center">
                    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-center gap-1 mb-1">
                      <span className="font-medium text-sm sm:text-base">{t('review.workload')}</span>
                      <div className="flex items-center justify-center">
                        {review.course_workload === null || review.course_workload === -1 ? (
                          <span className="text-muted-foreground">
                            {review.course_workload === -1 ? t('review.notApplicable') : t('review.rating.notRated')}
                          </span>
                        ) : (
                          <StarRating rating={review.course_workload} showValue size="sm" showTooltip ratingType="workload" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-center gap-1 mb-1">
                      <span className="font-medium text-sm sm:text-base">{t('review.difficulty')}</span>
                      <div className="flex items-center justify-center">
                        {review.course_difficulties === null || review.course_difficulties === -1 ? (
                          <span className="text-muted-foreground">
                            {review.course_difficulties === -1 ? t('review.notApplicable') : t('review.rating.notRated')}
                          </span>
                        ) : (
                          <StarRating rating={review.course_difficulties} showValue size="sm" showTooltip ratingType="difficulty" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-center gap-1 mb-1">
                      <span className="font-medium text-sm sm:text-base">{t('review.usefulness')}</span>
                      <div className="flex items-center justify-center">
                        {review.course_usefulness === null || review.course_usefulness === -1 ? (
                          <span className="text-muted-foreground">
                            {review.course_usefulness === -1 ? t('review.notApplicable') : t('review.rating.notRated')}
                          </span>
                        ) : (
                          <StarRating rating={review.course_usefulness} showValue size="sm" showTooltip ratingType="usefulness" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 課程評論 */}
                {review.course_comments && (
                  <>
                    <Separator />
                    <div className="min-w-0">
                      <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 shrink-0" />
                        <span>{t('review.courseComments')}</span>
                      </h5>
                      <div className="bg-muted/50 p-2 rounded-md break-words text-sm">
                        {hasMarkdownFormatting(review.course_comments) ? (
                          <div className="text-sm">{renderCommentMarkdown(review.course_comments)}</div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {review.course_comments}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Service learning is now displayed per instructor in the instructor details section */}

                {/* 講師評價展開/收起按鈕 */}
                {instructorDetails.length > 0 && (
                  <>
                    <Separator />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleReviewExpansion(review.$id)}
                      className="w-full justify-center"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-2" />
                          {t('review.hideInstructorDetails')}
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-2" />
                          {t('review.showInstructorDetails')} ({instructorDetails.length})
                        </>
                      )}
                    </Button>
                  </>
                )}

                {/* 講師詳細評價 */}
                {isExpanded && instructorDetails.length > 0 && (
                  <>
                    <Separator />
                    {renderInstructorDetails(instructorDetails, review.$id)}
                  </>
                )}

                {/* 投票按鈕 */}
                <Separator />
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 overflow-hidden">
                  <div className="flex-shrink-0">
                    <VotingButtons
                      reviewId={review.$id}
                      upvotes={reviewInfo.upvotes}
                      downvotes={reviewInfo.downvotes}
                      userVote={reviewInfo.userVote}
                      size="sm"
                    />
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 min-w-0">
                    <ResponsiveTooltip content={t('review.timestampTooltip', { timezone: 'Hong Kong Time (UTC+8)' })}>
                      <span className="truncate cursor-help">
                        {formatDateTimeUTC8(review.submitted_at)}
                      </span>
                    </ResponsiveTooltip>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}
        <Pagination
          currentPage={filters.currentPage}
          totalPages={totalPages}
          onPageChange={(page) => handleFiltersChange({ ...filters, currentPage: page })}
          itemsPerPage={filters.itemsPerPage}
          totalItems={filteredCount}
        />
      </CardContent>
    </Card>
  );
}; 