import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ChevronDown, 
  ChevronUp, 
  User, 
  MessageSquare,
  BookOpen,
  Brain,
  Target,
  GraduationCap,
  CheckCircle,
  XCircle,
  Loader2,
  FileText
} from 'lucide-react';
import { formatDateTimeUTC8 } from '@/utils/ui/dateUtils';
import { renderCommentMarkdown, hasMarkdownFormatting } from '@/utils/ui/markdownRenderer';
import { getInstructorName } from '@/utils/textUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { StarRating } from '@/components/ui/star-rating';
import { VotingButtons } from '@/components/ui/voting-buttons';
import { ReviewAvatar } from '@/components/ui/review-avatar';
import { GradeBadge } from '@/components/ui/GradeBadge';
import { CourseReviewInfo, InstructorDetail, CourseService, Instructor } from '@/services/api/courseService';
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
  t: tProp 
}: CourseReviewsListProps) => {
  const { t: tContext, language } = useLanguage();
  const t = tProp || tContext;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [expandedReviews, setExpandedReviews] = useState<ExpandedReviews>({});
  const [instructorsMap, setInstructorsMap] = useState<Map<string, Instructor>>(new Map());
  

  
  // 篩選和排序狀態
  const [filters, setFilters] = useState<ReviewFilters>({
    selectedLanguages: [],
    selectedTerms: [],
    selectedInstructors: [],
    selectedSessionTypes: [],
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
          const gradeOrder = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];
          aValue = gradeOrder.indexOf(a.review.course_final_grade || '') !== -1 ? gradeOrder.indexOf(a.review.course_final_grade || '') : 999;
          bValue = gradeOrder.indexOf(b.review.course_final_grade || '') !== -1 ? gradeOrder.indexOf(b.review.course_final_grade || '') : 999;
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
  }, [allReviews, filters, languageCounts, requirementsFilters]);

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

  const handleClearAllFilters = () => {
    setFilters({
      selectedLanguages: [],
      selectedTerms: [],
      selectedInstructors: [],
      selectedSessionTypes: [],
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

  const toggleReviewExpansion = (reviewId: string) => {
    setExpandedReviews(prev => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));
  };

  const getWorkloadText = (workload: number | null) => {
    if (workload === null) return t('review.rating.notRated');
    if (workload === -1) return t('review.notApplicable');
    if (workload === 0) return t('review.workload.none');
    const workloadMap = {
      1: t('review.workload.veryLight'),
      2: t('review.workload.light'),
      3: t('review.workload.moderate'),
      4: t('review.workload.heavy'),
      5: t('review.workload.veryHeavy')
    };
    return workloadMap[Math.ceil(workload) as keyof typeof workloadMap] || workload.toString();
  };

  const getDifficultyText = (difficulty: number | null) => {
    if (difficulty === null) return t('review.rating.notRated');
    if (difficulty === -1) return t('review.notApplicable');
    if (difficulty === 0) return t('review.difficulty.none');
    const difficultyMap = {
      1: t('review.difficulty.veryEasy'),
      2: t('review.difficulty.easy'),
      3: t('review.difficulty.moderate'),
      4: t('review.difficulty.hard'),
      5: t('review.difficulty.veryHard')
    };
    return difficultyMap[Math.ceil(difficulty) as keyof typeof difficultyMap] || difficulty.toString();
  };

  const getUsefulnessText = (usefulness: number | null) => {
    if (usefulness === null) return t('review.rating.notRated');
    if (usefulness === -1) return t('review.notApplicable');
    if (usefulness === 0) return t('review.usefulness.none');
    const usefulnessMap = {
      1: t('review.usefulness.notUseful'),
      2: t('review.usefulness.slightlyUseful'),
      3: t('review.usefulness.moderatelyUseful'),
      4: t('review.usefulness.veryUseful'),
      5: t('review.usefulness.extremelyUseful')
    };
    return usefulnessMap[Math.ceil(usefulness) as keyof typeof usefulnessMap] || usefulness.toString();
  };

  const getLanguageCount = (language: string) => {
    return languageCounts[language] || 0;
  };

  const renderRequirementBadge = (hasRequirement: boolean, label: string) => {
    return (
      <Badge 
        variant={hasRequirement ? "default" : "secondary"}
        className={`text-xs shrink-0 ${hasRequirement ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/20' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
      >
        {hasRequirement ? (
          <CheckCircle className="h-3 w-3 mr-1 shrink-0" />
        ) : (
          <XCircle className="h-3 w-3 mr-1 shrink-0" />
        )}
        <span className="truncate">{label}</span>
      </Badge>
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
            <div className="flex items-start justify-between mb-3 gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-lg">
                  <a
                    href={`/instructors/${encodeURIComponent(instructor.instructor_name)}?review_id=${reviewId}`}
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
                      navigate(`/instructors/${encodeURIComponent(instructor.instructor_name)}?review_id=${reviewId}`);
                    }}
                  >
                    {(() => {
                      const fullInstructor = instructorsMap.get(instructor.instructor_name);
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
              </div>
              <div className="shrink-0 flex items-start pt-1">
                <Badge 
                  variant="secondary" 
                  className={`text-sm ${
                    instructor.session_type === 'Lecture' 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                      : instructor.session_type === 'Tutorial'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                      : ''
                  }`}
                >
                  {t(`sessionType.${instructor.session_type.toLowerCase()}`)}
                </Badge>
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
                {renderRequirementBadge(instructor.has_attendance_requirement, t('review.requirements.attendance'))}
                {renderRequirementBadge(instructor.has_quiz, t('review.requirements.quiz'))}
                {renderRequirementBadge(instructor.has_midterm, t('review.requirements.midterm'))}
                {renderRequirementBadge(instructor.has_final, t('review.requirements.final'))}
                {renderRequirementBadge(instructor.has_individual_assignment, t('review.requirements.individualAssignment'))}
                {renderRequirementBadge(instructor.has_group_project, t('review.requirements.groupProject'))}
                {renderRequirementBadge(instructor.has_presentation, t('review.requirements.presentation'))}
                {renderRequirementBadge(instructor.has_reading, t('review.requirements.reading'))}
              </div>
            </div>

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
    );
  };

  if (loading) {
    return (
      <Card className="course-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {t('review.courseReviews')}
            </CardTitle>
            
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
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {t('review.courseReviews')}
            </CardTitle>
            
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
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t('review.noReviews')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="course-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          {t('review.studentReviews')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 overflow-hidden">
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
                <div className="flex items-start justify-between gap-2">
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
                      {/* 學期徽章 - 桌面版顯示在用戶名旁邊 */}
                      <Badge 
                        variant="outline" 
                        className="text-xs shrink-0 hidden md:inline-flex cursor-pointer hover:bg-primary/10 hover:border-primary/50 transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // 設置學期篩選
                          setFilters(prev => ({
                            ...prev,
                            selectedTerms: [term.term_code],
                            currentPage: 1
                          }));
                        }}
                        title={t('filter.clickToFilterByTerm', { term: term.name })}
                      >
                        <span className="truncate">{term.name}</span>
                      </Badge>
                    </div>
                    {/* 學期徽章 - 手機版顯示在下方 */}
                    <Badge 
                      variant="outline" 
                      className="text-xs w-fit md:hidden cursor-pointer hover:bg-primary/10 hover:border-primary/50 transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // 設置學期篩選
                        setFilters(prev => ({
                          ...prev,
                          selectedTerms: [term.term_code],
                          currentPage: 1
                        }));
                      }}
                      title={t('filter.clickToFilterByTerm', { term: term.name })}
                    >
                      <span className="truncate">{term.name}</span>
                    </Badge>
                  </div>
                  {/* 最終成績 - 右上角大顯示 */}
                  {review.course_final_grade && (
                    <div className="flex flex-col items-center shrink-0">
                      <GradeBadge 
                        grade={review.course_final_grade}
                        size="md"
                        showTooltip={true}
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
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-center gap-1 mb-1 lg:mb-0">
                      <span className="font-medium text-sm sm:text-base">{t('review.difficulty')}</span>
                      <div className="flex items-center justify-center lg:ml-1">
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
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-center gap-1 mb-1 lg:mb-0">
                      <span className="font-medium text-sm sm:text-base">{t('review.usefulness')}</span>
                      <div className="flex items-center justify-center lg:ml-1">
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
                      <div className="bg-muted/50 p-2 rounded-md break-words">
                        {hasMarkdownFormatting(review.course_comments) ? (
                          renderCommentMarkdown(review.course_comments)
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {review.course_comments}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* 服務學習 */}
                {review.has_service_learning && (
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
                            (review.service_learning_type === 'compulsory' || 
                             review.service_learning_description?.startsWith('[COMPULSORY]'))
                              ? "border-red-300 text-red-700 bg-red-50 dark:border-red-700 dark:text-red-300 dark:bg-red-950/30"
                              : "border-green-300 text-green-700 bg-green-50 dark:border-green-700 dark:text-green-300 dark:bg-green-950/30"
                          )}
                        >
                          {/* 檢查是否為必修，否則顯示選修 */}
                          {(review.service_learning_type === 'compulsory' || 
                            review.service_learning_description?.startsWith('[COMPULSORY]'))
                            ? t('review.compulsory')
                            : t('review.optional')}
                        </Badge>
                      </div>
                      {review.service_learning_description && (
                        <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md border border-blue-200 dark:border-blue-800/30">
                          <p className="text-sm text-blue-900 dark:text-blue-100 break-words">
                            {/* 移除舊格式的前綴 */}
                            {review.service_learning_description
                              .replace(/^\[COMPULSORY\]\s*/, '')
                              .replace(/^\[OPTIONAL\]\s*/, '')}
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}

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