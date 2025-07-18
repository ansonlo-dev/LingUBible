import { useState, useMemo, useEffect } from 'react';
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
  const [pendingTeachingLanguageFilter, setPendingTeachingLanguageFilter] = useState<string | null>(null);
  const [pendingSessionTypeFilter, setPendingSessionTypeFilter] = useState<string | null>(null);
  const [pendingTermFilter, setPendingTermFilter] = useState<string | null>(null);
  const [pendingLanguageFilter, setPendingLanguageFilter] = useState<string | null>(null);
  
  // Clear pending states when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setPendingGradeFilter(null);
      setPendingTeachingLanguageFilter(null);
      setPendingSessionTypeFilter(null);
      setPendingTermFilter(null);
      setPendingLanguageFilter(null);
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
    if (pendingGradeFilter || pendingTeachingLanguageFilter || pendingSessionTypeFilter || pendingTermFilter || pendingLanguageFilter) {
      const timer = setTimeout(() => {
        setPendingGradeFilter(null);
        setPendingTeachingLanguageFilter(null);
        setPendingSessionTypeFilter(null);
        setPendingTermFilter(null);
        setPendingLanguageFilter(null);
      }, 3000); // Clear after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [pendingGradeFilter, pendingTeachingLanguageFilter, pendingSessionTypeFilter, pendingTermFilter, pendingLanguageFilter]);
  
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
    teachingLanguages, 
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
    return (
      <ResponsiveTooltip 
        content={t('filter.clickToFilterRequirement', { requirement: label })}
        hasClickAction={true}
        clickActionText={t('tooltip.clickAgainToFilter')}
      >
        <Badge
          variant={hasRequirement ? "default" : "secondary"}
          className={`text-xs shrink-0 cursor-pointer transition-all duration-200 ${hasRequirement ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/40 hover:scale-105' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isMobile) {
              const filterValue = hasRequirement ? 'has' : 'no';
              const pendingKey = `${filterKey}-${filterValue}`;
              const currentPending = `${filterKey}-${requirementsFilters[filterKey]}`;
              
              if (pendingKey !== currentPending) {
                // First tap - set pending state
                setRequirementsFilters(prev => ({
                  ...prev,
                  [filterKey]: filterValue
                }));
                return;
              } else {
                // Second tap - apply filter and clear pending
                setRequirementsFilters(prev => ({
                  ...prev,
                  [filterKey]: filterValue
                }));
                return;
              }
            }
            // Desktop: apply filter immediately
            setRequirementsFilters(prev => ({
              ...prev,
              [filterKey]: hasRequirement ? 'has' : 'no'
            }));
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
                    href={`/instructors/${encodeURIComponent(instructor.instructor_name)}`}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/instructors/${encodeURIComponent(instructor.instructor_name)}`);
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
                    clickActionText={t('tooltip.clickAgainToFilter')}
                    onFirstTap={() => {
                      console.log('🎯 Session Type Badge (Desktop): First tap - setting pending filter');
                      setPendingSessionTypeFilter(instructor.session_type);
                    }}
                    onSecondTap={() => {
                      console.log('🎯 Session Type Badge (Desktop): Second tap - applying filter');
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
                    <span 
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs cursor-pointer transition-all duration-200 hover:scale-105 shrink-0 ${
                        instructor.session_type === 'Lecture' 
                          ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50'
                          : instructor.session_type === 'Tutorial'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/50'
                          : ''
                      }`}
                      onClick={() => {
                        if (!isMobile) {
                          // Desktop: apply filter immediately
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
                        }
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
                          clickActionText={t('tooltip.clickAgainToFilter')}
                          onFirstTap={() => {
                            console.log('🎯 Teaching Language Badge (Desktop): First tap - setting pending filter');
                            setPendingTeachingLanguageFilter(teachingLanguage);
                          }}
                          onSecondTap={() => {
                            console.log('🎯 Teaching Language Badge (Desktop): Second tap - applying filter');
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
                        >
                          <span 
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800 cursor-pointer transition-all duration-200 hover:scale-105 hover:bg-orange-100 dark:hover:bg-orange-900/50 max-w-full"
                            onClick={() => {
                              if (!isMobile) {
                                // Desktop: apply filter immediately
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
                              }
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
                  clickActionText={t('tooltip.clickAgainToFilter')}
                  onFirstTap={() => {
                    console.log('🎯 Session Type Badge (Mobile): First tap - setting pending filter');
                    setPendingSessionTypeFilter(instructor.session_type);
                  }}
                  onSecondTap={() => {
                    console.log('🎯 Session Type Badge (Mobile): Second tap - applying filter');
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
                  <span 
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs cursor-pointer transition-all duration-200 hover:scale-105 shrink-0 ${
                      instructor.session_type === 'Lecture' 
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50'
                        : instructor.session_type === 'Tutorial'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/50'
                        : ''
                    }`}
                    onClick={() => {
                      if (!isMobile) {
                        // Desktop: apply filter immediately
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
                      }
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
                        clickActionText={t('tooltip.clickAgainToFilter')}
                        onFirstTap={() => {
                          console.log('🎯 Teaching Language Badge (Mobile): First tap - setting pending filter');
                          setPendingTeachingLanguageFilter(teachingLanguage);
                        }}
                        onSecondTap={() => {
                          console.log('🎯 Teaching Language Badge (Mobile): Second tap - applying filter');
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
                      >
                        <span 
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800 cursor-pointer transition-all duration-200 hover:scale-105 hover:bg-orange-100 dark:hover:bg-orange-900/50 max-w-full"
                          onClick={() => {
                            if (!isMobile) {
                              // Desktop: apply filter immediately
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
                            }
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
                        clickActionText={t('tooltip.clickAgainToFilter')}
                        onFirstTap={() => {
                          console.log('📅 Term Badge (hideHeader): First tap - setting pending filter');
                          setPendingTermFilter(term.term_code);
                        }}
                        onSecondTap={() => {
                          console.log('✅ Term Badge (hideHeader): Second tap - applying filter');
                          setPendingTermFilter(null);
                          setFilters(prev => ({
                            ...prev,
                            selectedTerms: [term.term_code],
                            currentPage: 1
                          }));
                        }}
                      >
                        <button
                          className="px-2 py-1 text-xs rounded-md transition-colors border bg-background hover:bg-muted border-border hover:border-primary/50 w-fit cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!isMobile) {
                              // Desktop: apply filter immediately
                              setFilters(prev => ({
                                ...prev,
                                selectedTerms: [term.term_code],
                                currentPage: 1
                              }));
                            }
                          }}
                          title={t('filter.clickToFilterByTerm', { term: term.name })}
                        >
                          <span className="truncate">{term.name}</span>
                        </button>
                      </ResponsiveTooltip>
                      {/* 語言徽章 - 手機版顯示在學期旁邊，限制最大寬度避免重疊 */}
                      {review.review_language && (
                        <ResponsiveTooltip
                          content={t('filter.clickToFilterByLanguage', { language: getLanguageDisplayName(review.review_language) })}
                          hasClickAction={true}
                          clickActionText={t('tooltip.clickAgainToFilter')}
                          onFirstTap={() => {
                            console.log('🌐 Review Language Badge (hideHeader): First tap - setting pending filter');
                            setPendingLanguageFilter(review.review_language!);
                          }}
                          onSecondTap={() => {
                            console.log('✅ Review Language Badge (hideHeader): Second tap - applying filter');
                            setPendingLanguageFilter(null);
                            setFilters(prev => ({
                              ...prev,
                              selectedLanguages: [review.review_language!],
                              currentPage: 1
                            }));
                          }}
                        >
                          <button
                            className="px-2 py-1 text-xs rounded-md transition-colors border bg-background hover:bg-muted border-border hover:border-primary/50 w-fit cursor-pointer max-w-[120px]"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!isMobile) {
                                // Desktop: apply filter immediately
                                setFilters(prev => ({
                                  ...prev,
                                  selectedLanguages: [review.review_language!],
                                  currentPage: 1
                                }));
                              }
                            }}
                            title={t('filter.clickToFilterByLanguage', { language: getLanguageDisplayName(review.review_language) })}
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
                        clickActionText={t('tooltip.clickAgainToFilter')}
                        onFirstTap={() => {
                          console.log('📅 Term Badge (hideHeader): First tap - setting pending filter');
                          setPendingTermFilter(term.term_code);
                        }}
                        onSecondTap={() => {
                          console.log('✅ Term Badge (hideHeader): Second tap - applying filter');
                          setPendingTermFilter(null);
                          setFilters(prev => ({
                            ...prev,
                            selectedTerms: [term.term_code],
                            currentPage: 1
                          }));
                        }}
                      >
                        <button
                          className="px-2 py-1 text-xs rounded-md transition-colors border bg-background hover:bg-muted border-border hover:border-primary/50 shrink-0 cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!isMobile) {
                              // Desktop: apply filter immediately
                              setFilters(prev => ({
                                ...prev,
                                selectedTerms: [term.term_code],
                                currentPage: 1
                              }));
                            }
                          }}
                          title={t('filter.clickToFilterByTerm', { term: term.name })}
                        >
                          <span className="truncate">{term.name}</span>
                        </button>
                      </ResponsiveTooltip>
                      {/* 語言徽章 - 桌面版顯示在學期旁邊 */}
                      {review.review_language && (
                        <ResponsiveTooltip
                          content={t('filter.clickToFilterByLanguage', { language: getLanguageDisplayName(review.review_language) })}
                          hasClickAction={true}
                          clickActionText={t('tooltip.clickAgainToFilter')}
                          onFirstTap={() => {
                            console.log('🌐 Review Language Badge (hideHeader): First tap - setting pending filter');
                            setPendingLanguageFilter(review.review_language!);
                          }}
                          onSecondTap={() => {
                            console.log('✅ Review Language Badge (hideHeader): Second tap - applying filter');
                            setPendingLanguageFilter(null);
                            setFilters(prev => ({
                              ...prev,
                              selectedLanguages: [review.review_language!],
                              currentPage: 1
                            }));
                          }}
                        >
                          <button
                            className="px-2 py-1 text-xs rounded-md transition-colors border bg-background hover:bg-muted border-border hover:border-primary/50 shrink-0 cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!isMobile) {
                                // Desktop: apply filter immediately
                                setFilters(prev => ({
                                  ...prev,
                                  selectedLanguages: [review.review_language!],
                                  currentPage: 1
                                }));
                              }
                            }}
                            title={t('filter.clickToFilterByLanguage', { language: getLanguageDisplayName(review.review_language) })}
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
                          grade={review.course_final_grade}
                          size="md"
                          showTooltip={true}
                          hasClickAction={true}
                          isPending={pendingGradeFilter === (review.course_final_grade === "-1" ? "N/A" : review.course_final_grade)}
                          onFirstTap={() => {
                            const normalizedGrade = review.course_final_grade === '-1' ? 'N/A' : review.course_final_grade;
                            console.log('🔄 CourseReviewsList.tsx: First tap - setting pending filter');
                            setPendingGradeFilter(normalizedGrade);
                          }}
                          onSecondTap={() => {
                            console.log('✅ CourseReviewsList.tsx: Second tap - clearing pending filter');
                            setPendingGradeFilter(null);
                          }}
                          onClick={() => {
                            const normalizedGrade = review.course_final_grade === '-1' ? 'N/A' : review.course_final_grade;
                            console.log('🚀 CourseReviewsList.tsx: Applying grade filter');
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
                    <span 
                      className="truncate cursor-help" 
                      title={t('review.timestampTooltip', { timezone: 'Hong Kong Time (UTC+8)' })}
                    >
                      {formatDateTimeUTC8(review.submitted_at)}
                    </span>
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
                        clickActionText={t('tooltip.clickAgainToFilter')}
                        onFirstTap={() => {
                          console.log('📅 Term Badge (Card): First tap - setting pending filter');
                          setPendingTermFilter(term.term_code);
                        }}
                        onSecondTap={() => {
                          console.log('✅ Term Badge (Card): Second tap - applying filter');
                          setPendingTermFilter(null);
                          setFilters(prev => ({
                            ...prev,
                            selectedTerms: [term.term_code],
                            currentPage: 1
                          }));
                        }}
                      >
                        <button
                          className="px-2 py-1 text-xs rounded-md transition-colors border bg-background hover:bg-muted border-border hover:border-primary/50 w-fit cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!isMobile) {
                              // Desktop: apply filter immediately
                              setFilters(prev => ({
                                ...prev,
                                selectedTerms: [term.term_code],
                                currentPage: 1
                              }));
                            }
                          }}
                          title={t('filter.clickToFilterByTerm', { term: term.name })}
                        >
                          <span className="truncate">{term.name}</span>
                        </button>
                      </ResponsiveTooltip>
                      {/* 語言徽章 - 手機版顯示在學期旁邊，限制最大寬度避免重疊 */}
                      {review.review_language && (
                        <ResponsiveTooltip
                          content={t('filter.clickToFilterByLanguage', { language: getLanguageDisplayName(review.review_language) })}
                          hasClickAction={true}
                          clickActionText={t('tooltip.clickAgainToFilter')}
                          onFirstTap={() => {
                            console.log('🌐 Review Language Badge (Card): First tap - setting pending filter');
                            setPendingLanguageFilter(review.review_language!);
                          }}
                          onSecondTap={() => {
                            console.log('✅ Review Language Badge (Card): Second tap - applying filter');
                            setPendingLanguageFilter(null);
                            setFilters(prev => ({
                              ...prev,
                              selectedLanguages: [review.review_language!],
                              currentPage: 1
                            }));
                          }}
                        >
                          <button
                            className="px-2 py-1 text-xs rounded-md transition-colors border bg-background hover:bg-muted border-border hover:border-primary/50 w-fit cursor-pointer max-w-[120px]"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!isMobile) {
                                // Desktop: apply filter immediately
                                setFilters(prev => ({
                                  ...prev,
                                  selectedLanguages: [review.review_language!],
                                  currentPage: 1
                                }));
                              }
                            }}
                            title={t('filter.clickToFilterByLanguage', { language: getLanguageDisplayName(review.review_language) })}
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
                        clickActionText={t('tooltip.clickAgainToFilter')}
                        onFirstTap={() => {
                          console.log('📅 Term Badge (Card): First tap - setting pending filter');
                          setPendingTermFilter(term.term_code);
                        }}
                        onSecondTap={() => {
                          console.log('✅ Term Badge (Card): Second tap - applying filter');
                          setPendingTermFilter(null);
                          setFilters(prev => ({
                            ...prev,
                            selectedTerms: [term.term_code],
                            currentPage: 1
                          }));
                        }}
                      >
                        <button
                          className="px-2 py-1 text-xs rounded-md transition-colors border bg-background hover:bg-muted border-border hover:border-primary/50 shrink-0 cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!isMobile) {
                              // Desktop: apply filter immediately
                              setFilters(prev => ({
                                ...prev,
                                selectedTerms: [term.term_code],
                                currentPage: 1
                              }));
                            }
                          }}
                          title={t('filter.clickToFilterByTerm', { term: term.name })}
                        >
                          <span className="truncate">{term.name}</span>
                        </button>
                      </ResponsiveTooltip>
                      {/* 語言徽章 - 桌面版顯示在學期旁邊 */}
                      {review.review_language && (
                        <ResponsiveTooltip
                          content={t('filter.clickToFilterByLanguage', { language: getLanguageDisplayName(review.review_language) })}
                          hasClickAction={true}
                          clickActionText={t('tooltip.clickAgainToFilter')}
                          onFirstTap={() => {
                            console.log('🌐 Review Language Badge (Card): First tap - setting pending filter');
                            setPendingLanguageFilter(review.review_language!);
                          }}
                          onSecondTap={() => {
                            console.log('✅ Review Language Badge (Card): Second tap - applying filter');
                            setPendingLanguageFilter(null);
                            setFilters(prev => ({
                              ...prev,
                              selectedLanguages: [review.review_language!],
                              currentPage: 1
                            }));
                          }}
                        >
                          <button
                            className="px-2 py-1 text-xs rounded-md transition-colors border bg-background hover:bg-muted border-border hover:border-primary/50 shrink-0 cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!isMobile) {
                                // Desktop: apply filter immediately
                                setFilters(prev => ({
                                  ...prev,
                                  selectedLanguages: [review.review_language!],
                                  currentPage: 1
                                }));
                              }
                            }}
                            title={t('filter.clickToFilterByLanguage', { language: getLanguageDisplayName(review.review_language) })}
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
                          grade={review.course_final_grade}
                          size="md"
                          showTooltip={true}
                          hasClickAction={true}
                          isPending={pendingGradeFilter === (review.course_final_grade === "-1" ? "N/A" : review.course_final_grade)}
                          onClick={() => {
                            const normalizedGrade = review.course_final_grade === '-1' ? 'N/A' : review.course_final_grade;
                            if (isMobile) {
                              if (pendingGradeFilter !== normalizedGrade) {
                                setPendingGradeFilter(normalizedGrade);
                                return;
                              } else {
                                setPendingGradeFilter(null);
                                setFilters(prev => ({
                                  ...prev,
                                  selectedGrades: [normalizedGrade],
                                  currentPage: 1
                                }));
                                return;
                              }
                            }
                            // Desktop: apply filter immediately
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
                    <span 
                      className="truncate cursor-help" 
                      title={t('review.timestampTooltip', { timezone: 'Hong Kong Time (UTC+8)' })}
                    >
                      {formatDateTimeUTC8(review.submitted_at)}
                    </span>
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