import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageSquare, 
  Edit, 
  Trash2, 
  Loader2, 
  AlertCircle, 
  User, 
  FileText, 
  CheckCircle, 
  XCircle, 
  GraduationCap,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { StarRating } from '@/components/ui/star-rating';
import { ReviewAvatar } from '@/components/ui/review-avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CourseService } from '@/services/api/courseService';
import type { CourseReviewInfo, InstructorDetail, Instructor, Course } from '@/services/api/courseService';
import { hasMarkdownFormatting, renderCommentMarkdown } from '@/utils/ui/markdownRenderer';
import { useNavigate } from 'react-router-dom';
import { formatDateTimeUTC8 } from '@/utils/ui/dateUtils';
import { GradeBadge } from '@/components/ui/GradeBadge';
import { cn } from '@/lib/utils';
import { VotingButtons } from '@/components/ui/voting-buttons';
import { getInstructorName, getCourseTitle, getTeachingLanguageName } from '@/utils/textUtils';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MyReviewsFilters, MyReviewFilters } from '@/components/features/reviews/MyReviewsFilters';
import { Pagination } from '@/components/features/reviews/Pagination';
import { useInstructorDetailTeachingLanguages } from '@/hooks/useInstructorDetailTeachingLanguages';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { useIsMobile } from '@/hooks/use-mobile';


interface UserReviewInfo extends CourseReviewInfo {
  upvotes: number;
  downvotes: number;
  instructorData: Map<string, Instructor>;
  courseData?: Course;
}

interface ReviewInfoWithInstructors extends CourseReviewInfo {
  upvotes: number;
  downvotes: number;
  instructorMaps: Map<string, Instructor>;
}

// CourseTitle component for fetching and displaying course title
const CourseTitle = React.memo(({ courseCode }: { courseCode: string }) => {
  const { language, t } = useLanguage();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const courseData = await CourseService.getCourseByCode(courseCode);
        setCourse(courseData);
      } catch (error) {
        console.error('Error fetching course:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourse();
  }, [courseCode]);
  
  if (loading) {
    return (
      <div>
        <div className="text-sm text-muted-foreground font-normal">{t('common.loading')}</div>
      </div>
    );
  }
  
  if (!course) {
    return (
      <div>
        <div className="text-sm text-muted-foreground font-normal">{courseCode}</div>
      </div>
    );
  }
  
  const courseInfo = getCourseTitle(course, language);
  return (
    <div>
      <div className="text-sm text-muted-foreground font-normal">{courseInfo.primary}</div>
      {courseInfo.secondary && (
        <div className="text-sm text-muted-foreground font-normal mt-0.5">
          {courseInfo.secondary}
        </div>
      )}
    </div>
  );
});

CourseTitle.displayName = 'CourseTitle';

const MyReviews = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  console.log('📱 isMobile state:', isMobile);
  
  const [reviews, setReviews] = useState<UserReviewInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  // Mobile tap states for two-tap functionality
  const [mobileTapStates, setMobileTapStates] = useState<{[key: string]: boolean}>({});
  const [mobileTapCounts, setMobileTapCounts] = useState<{[key: string]: number}>({});
  const mobileTimeoutRefs = useRef<{[key: string]: NodeJS.Timeout | null}>({});

  // 篩選和排序狀態
  const [filters, setFilters] = useState<MyReviewFilters>({
    searchTerm: '',
    selectedSubjectAreas: [],
    selectedReviewLanguages: [],
    selectedTerms: [],
    selectedTeachingLanguages: [],
    selectedGrades: [],
    selectedSessionTypes: [],
    selectedServiceLearning: [],
    sortBy: 'postDate',
    sortOrder: 'desc',
    itemsPerPage: 2, // 只顯示2個評論（1行）
    currentPage: 1
  });

  // Teaching languages hook - collect all instructor details for teaching languages
  const allInstructorDetails = useMemo(() => {
    const details: InstructorDetail[] = [];
    reviews.forEach(reviewInfo => {
      details.push(...reviewInfo.instructorDetails);
    });
    return details;
  }, [reviews]);

  // Extract course code and term code for teaching languages hook
  const firstReview = reviews[0];
  const courseCode = firstReview?.review.course_code || '';
  const termCode = firstReview?.term.term_code || '';

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

  // Helper function for mobile two-tap functionality
  const handleMobileTwoTap = (key: string, action: () => void) => {
    console.log('🔍 handleMobileTwoTap called:', { key, isMobile });
    
    if (!isMobile) {
      // Desktop: apply filter immediately
      console.log('🖥️ Desktop mode: applying filter immediately');
      action();
      return;
    }

    // Mobile: require two taps
    const currentCount = mobileTapCounts[key] || 0;
    const newCount = currentCount + 1;
    
    console.log('📱 Mobile tap:', { key, currentCount, newCount, currentState: mobileTapStates[key] });
    
    // Clear existing timeout for this key
    if (mobileTimeoutRefs.current[key]) {
      clearTimeout(mobileTimeoutRefs.current[key]);
      console.log('⏰ Cleared existing timeout for key:', key);
    }
    
    setMobileTapCounts(prev => ({ ...prev, [key]: newCount }));

    if (newCount === 1) {
      // First tap: show tooltip
      console.log('👆 First tap: showing tooltip for key:', key);
      setMobileTapStates(prev => ({ ...prev, [key]: true }));
      mobileTimeoutRefs.current[key] = setTimeout(() => {
        console.log('⏰ Timeout reached for key:', key);
        setMobileTapCounts(prev => ({ ...prev, [key]: 0 }));
        setMobileTapStates(prev => ({ ...prev, [key]: false }));
      }, 3000);
    } else if (newCount === 2) {
      // Second tap: apply filter and hide tooltip
      console.log('👆👆 Second tap: applying filter for key:', key);
      action();
      setMobileTapCounts(prev => ({ ...prev, [key]: 0 }));
      setMobileTapStates(prev => ({ ...prev, [key]: false }));
      if (mobileTimeoutRefs.current[key]) {
        clearTimeout(mobileTimeoutRefs.current[key]);
      }
    }
  };

  // Debug: Log state changes
  useEffect(() => {
    console.log('📊 Mobile tap counts updated:', mobileTapCounts);
  }, [mobileTapCounts]);

  useEffect(() => {
    console.log('🔄 Mobile tap states updated:', mobileTapStates);
  }, [mobileTapStates]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(mobileTimeoutRefs.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  useEffect(() => {
    loadUserReviews();
  }, [user]);

  const loadUserReviews = async () => {

    try {
      setLoading(true);
      setError(null);
      
      // 獲取用戶評論
      const userReviews = await CourseService.getUserReviews(user.$id);
      
      // 為每個評論獲取講師信息和課程信息
      const reviewsWithInstructors = await Promise.all(
        userReviews.map(async (reviewInfo) => {
          const instructorData = new Map<string, Instructor>();
          
          // 從 instructor_details 中獲取所有講師名字
          const instructorNames = reviewInfo.instructorDetails.map(detail => detail.instructor_name);
          
          // 並行獲取所有講師的完整信息和課程信息
          const [courseData] = await Promise.all([
            // 獲取課程信息
            CourseService.getCourseByCode(reviewInfo.review.course_code),
            // 獲取講師信息
            ...([...new Set(instructorNames)].map(async (name) => {
              const instructor = await CourseService.getInstructorByName(name);
              if (instructor) {
                instructorData.set(name, instructor);
              }
            }))
          ]);
          
          return {
            ...reviewInfo,
            instructorData,
            courseData: courseData || undefined
          };
        })
      );
      
      setReviews(reviewsWithInstructors);
    } catch (err) {
      console.error('Error loading user reviews:', err);
      setError(t('myReviews.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleEditReview = (reviewId: string, courseCode: string) => {
    navigate(`/write-review/${courseCode}?edit=${reviewId}`);
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      setDeletingReviewId(reviewId);
      await CourseService.deleteReview(reviewId);
      
      // Remove from local state
      setReviews(prev => prev.filter(r => r.review.$id !== reviewId));
      
      toast({
        title: t('myReviews.deleteSuccess'),
        description: t('myReviews.deleteSuccessDescription'),
      });
    } catch (err) {
      console.error('Error deleting review:', err);
      toast({
        variant: "destructive",
        title: t('myReviews.deleteError'),
        description: t('myReviews.deleteErrorDescription'),
      });
    } finally {
      setDeletingReviewId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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
        className={`text-xs shrink-0 ${value ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 hover:!bg-green-100 dark:hover:!bg-green-900/20' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:!bg-gray-100 dark:hover:!bg-gray-800'}`}
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

  // 為篩選器生成數據計數
  const courseCounts = useMemo(() => {
    const counts: { [key: string]: { title: string; count: number } } = {};
    reviews.forEach(reviewInfo => {
      const courseCode = reviewInfo.review.course_code;
      if (!counts[courseCode]) {
        counts[courseCode] = { title: courseCode, count: 0 };
      }
      counts[courseCode].count++;
    });
    return counts;
  }, [reviews]);

  const termCounts = useMemo(() => {
    const counts: { [key: string]: { name: string; count: number } } = {};
    reviews.forEach(reviewInfo => {
      const termCode = reviewInfo.term.term_code;
      if (!counts[termCode]) {
        counts[termCode] = { name: reviewInfo.term.name, count: 0 };
      }
      counts[termCode].count++;
    });
    return counts;
  }, [reviews]);

  const reviewLanguageCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    reviews.forEach(reviewInfo => {
      const language = reviewInfo.review.review_language || 'en'; // Default to English if not set
      counts[language] = (counts[language] || 0) + 1;
    });
    return counts;
  }, [reviews]);

  const teachingLanguageCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    reviews.forEach(reviewInfo => {
      reviewInfo.instructorDetails.forEach(instructorDetail => {
        const teachingLanguage = getTeachingLanguageForInstructor(
          instructorDetail.instructor_name,
          instructorDetail.session_type
        );
        if (teachingLanguage) {
          counts[teachingLanguage] = (counts[teachingLanguage] || 0) + 1;
        }
      });
    });
    return counts;
  }, [reviews, getTeachingLanguageForInstructor]);

  const gradeCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    reviews.forEach(reviewInfo => {
      const grade = reviewInfo.review.course_final_grade === '-1' || !reviewInfo.review.course_final_grade ? 'N/A' : reviewInfo.review.course_final_grade;
      counts[grade] = (counts[grade] || 0) + 1;
    });
    return counts;
  }, [reviews]);

  // Calculate session type counts
  const sessionTypeCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    reviews.forEach(reviewInfo => {
      reviewInfo.instructorDetails.forEach(instructorDetail => {
        const sessionType = instructorDetail.session_type;
        counts[sessionType] = (counts[sessionType] || 0) + 1;
      });
    });
    return counts;
  }, [reviews]);

  // Calculate service learning counts
  const serviceLearningCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    reviews.forEach(reviewInfo => {
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
  }, [reviews]);

  // 篩選和排序評論
  const filteredAndSortedReviews = useMemo(() => {
    let filteredReviews = [...reviews];

    // 智能搜索篩選 - 包含課程名稱（所有語言）、講師姓名（所有語言）和課程代碼
    if (filters.searchTerm.trim()) {
      const searchTerm = filters.searchTerm.toLowerCase().trim();
      filteredReviews = filteredReviews.filter(reviewInfo => {
        // 搜索課程代碼
        const courseCodeMatch = reviewInfo.review.course_code.toLowerCase().includes(searchTerm);
        
        // 搜索課程名稱（英文和中文）
        let courseNameMatch = false;
        if (reviewInfo.courseData) {
          const englishTitle = reviewInfo.courseData.course_title?.toLowerCase() || '';
          const tcTitle = reviewInfo.courseData.course_title_tc?.toLowerCase() || '';
          const scTitle = reviewInfo.courseData.course_title_sc?.toLowerCase() || '';
          
          courseNameMatch = (
            englishTitle.includes(searchTerm) ||
            tcTitle.includes(searchTerm) ||
            scTitle.includes(searchTerm)
          );
        }
        
        // 搜索評論內容
        const commentsMatch = reviewInfo.review.course_comments?.toLowerCase().includes(searchTerm) || false;
        
        // 搜索講師姓名（包含所有語言）
        const instructorMatch = reviewInfo.instructorDetails.some(detail => {
          const instructor = reviewInfo.instructorData.get(detail.instructor_name);
          if (instructor) {
            const englishName = instructor.name?.toLowerCase() || '';
            const chineseName = instructor.name_tc?.toLowerCase() || '';
            const scName = instructor.name_sc?.toLowerCase() || '';
            // Simplified approach - just use the instructor name directly
            const displayNameStr = detail.instructor_name.toLowerCase();
            
            return (
              englishName.includes(searchTerm) ||
              chineseName.includes(searchTerm) ||
              scName.includes(searchTerm) ||
              displayNameStr.includes(searchTerm) ||
              detail.instructor_name.toLowerCase().includes(searchTerm)
            );
          }
          return detail.instructor_name.toLowerCase().includes(searchTerm);
        });
        
        return courseCodeMatch || courseNameMatch || commentsMatch || instructorMatch;
      });
    }

    // 學科領域篩選
    if (filters.selectedSubjectAreas.length > 0) {
      filteredReviews = filteredReviews.filter(reviewInfo => {
        const subjectArea = reviewInfo.review.course_code.split(/\d/)[0]; // Extract letters before numbers
        return filters.selectedSubjectAreas.includes(subjectArea);
      });
    }

    // 評論語言篩選
    if (filters.selectedReviewLanguages.length > 0) {
      filteredReviews = filteredReviews.filter(reviewInfo => 
        reviewInfo.review.review_language && 
        filters.selectedReviewLanguages.includes(reviewInfo.review.review_language)
      );
    }

    // 學期篩選
    if (filters.selectedTerms.length > 0) {
      filteredReviews = filteredReviews.filter(reviewInfo => 
        filters.selectedTerms.includes(reviewInfo.term.term_code)
      );
    }

    // 教學語言篩選
    if (filters.selectedTeachingLanguages.length > 0) {
      filteredReviews = filteredReviews.filter(reviewInfo => 
        reviewInfo.instructorDetails.some(detail => {
          const teachingLanguage = getTeachingLanguageForInstructor(
            detail.instructor_name,
            detail.session_type
          );
          return teachingLanguage && filters.selectedTeachingLanguages.includes(teachingLanguage);
        })
      );
    }

    // 成績篩選
    if (filters.selectedGrades.length > 0) {
      filteredReviews = filteredReviews.filter(reviewInfo => {
        const grade = reviewInfo.review.course_final_grade === '-1' || !reviewInfo.review.course_final_grade ? 'N/A' : reviewInfo.review.course_final_grade;
        return filters.selectedGrades.includes(grade);
      });
    }

    // 課堂類型篩選
    if (filters.selectedSessionTypes.length > 0) {
      filteredReviews = filteredReviews.filter(reviewInfo => 
        reviewInfo.instructorDetails.some(detail => 
          filters.selectedSessionTypes.includes(detail.session_type)
        )
      );
    }

    // 服務學習篩選
    if (filters.selectedServiceLearning.length > 0) {
      filteredReviews = filteredReviews.filter(reviewInfo => {
        return filters.selectedServiceLearning.some(selectedType => {
          if (selectedType === 'none') {
            // Check if no instructors have service learning
            return !reviewInfo.instructorDetails.some(detail => detail.has_service_learning);
          } else {
            // Check for specific service learning type (compulsory/optional)
            return reviewInfo.instructorDetails.some(detail => 
              detail.has_service_learning && detail.service_learning_type === selectedType
            );
          }
        });
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
        case 'courseCode':
          aValue = a.review.course_code;
          bValue = b.review.course_code;
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
  }, [reviews, filters]);

  // 分頁邏輯
  const paginatedReviews = useMemo(() => {
    const startIndex = (filters.currentPage - 1) * filters.itemsPerPage;
    const endIndex = startIndex + filters.itemsPerPage;
    return filteredAndSortedReviews.slice(startIndex, endIndex);
  }, [filteredAndSortedReviews, filters.currentPage, filters.itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedReviews.length / filters.itemsPerPage);

  const handleFiltersChange = (newFilters: MyReviewFilters) => {
    setFilters(newFilters);
  };

  const handleSessionTypeClick = (sessionType: string, key?: string) => {
    if (key) {
      handleMobileTwoTap(key, () => {
        setFilters(prev => ({
          ...prev,
          selectedSessionTypes: [sessionType],
          currentPage: 1
        }));
      });
    } else {
      setFilters(prev => ({
        ...prev,
        selectedSessionTypes: [sessionType],
        currentPage: 1
      }));
    }
  };

  const handleClearAllFilters = () => {
    setFilters({
      searchTerm: '',
      selectedSubjectAreas: [],
      selectedReviewLanguages: [],
      selectedTerms: [],
      selectedTeachingLanguages: [],
      selectedGrades: [],
      selectedSessionTypes: [],
      selectedServiceLearning: [],
      sortBy: 'postDate',
      sortOrder: 'desc',
      itemsPerPage: 2,
      currentPage: 1
    });
  };



  return (
    <div className="mx-auto px-4 lg:px-8 xl:px-16 py-8">
      {/* Header */}
      <div className="space-y-2 mb-6">
        <h1 className="text-3xl font-bold">{t('myReviews.title')}</h1>
        <p className="text-muted-foreground">{t('myReviews.subtitle')}</p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-lg p-12 bg-card border border-border dark:bg-[#202936] dark:border-[#2a3441]">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h3 className="text-lg font-medium">{t('common.error')}</h3>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={loadUserReviews} variant="outline">
              {t('common.retry')}
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      {!loading && !error && reviews.length > 0 && (
        <MyReviewsFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          courseCounts={courseCounts}
          termCounts={termCounts}
          reviewLanguageCounts={reviewLanguageCounts}
          teachingLanguageCounts={teachingLanguageCounts}
          gradeCounts={gradeCounts}
          sessionTypeCounts={sessionTypeCounts}
          serviceLearningCounts={serviceLearningCounts}
          totalReviews={reviews.length}
          filteredReviews={filteredAndSortedReviews.length}
          onClearAll={handleClearAllFilters}
        />
      )}

      {/* Reviews List */}
      {!loading && !error && (
        <>
          {reviews.length === 0 ? (
            <div className="rounded-lg p-12 bg-card border border-border dark:bg-[#202936] dark:border-[#2a3441]">
              <div className="text-center space-y-4">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto" />
                <h3 className="text-lg font-medium">{t('myReviews.noReviews')}</h3>
                <p className="text-muted-foreground">{t('myReviews.noReviewsDescription')}</p>
                <Button onClick={() => navigate('/courses')} className="mt-4 w-full sm:w-auto h-auto py-3 text-sm sm:text-base">
                  <span className="text-center leading-tight">{t('myReviews.browseCoursesToReview')}</span>
                </Button>
              </div>
            </div>
          ) : filteredAndSortedReviews.length === 0 ? (
            <div className="rounded-lg p-12 bg-card border border-border dark:bg-[#202936] dark:border-[#2a3441]">
              <div className="text-center space-y-4">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto" />
                <h3 className="text-lg font-medium">{t('common.noResults')}</h3>
                <p className="text-muted-foreground">{t('pages.courses.noResultsDesc')}</p>
                <Button onClick={handleClearAllFilters} variant="outline" className="mt-4">
                  {t('filter.clearAll')}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* 2 Column Grid Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {paginatedReviews.map((reviewInfo) => (
                <div key={reviewInfo.review.$id} className="rounded-lg p-3 space-y-2 overflow-hidden bg-card border border-border dark:bg-[#202936] dark:border-[#2a3441]">
                  {/* 評論基本信息 */}
                  <div className="flex items-start justify-between gap-3">
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
                      </div>
                      {/* 學期和語言徽章 - 手機版顯示在下方 */}
                      <div className="flex gap-2 md:hidden max-w-[calc(100%-3rem)]">
                        <ResponsiveTooltip
                          content={t('filter.clickToFilterByTerm', { term: reviewInfo.term.name })}
                          hasClickAction={true}
                          clickActionText={isMobile ? t('tooltip.clickAgainToFilter') : undefined}
                          open={isMobile ? mobileTapStates[`term-mobile-${reviewInfo.term.term_code}`] : undefined}
                          onOpenChange={isMobile ? (open) => {
                            if (!open) {
                              setMobileTapCounts(prev => ({ ...prev, [`term-mobile-${reviewInfo.term.term_code}`]: 0 }));
                              setMobileTapStates(prev => ({ ...prev, [`term-mobile-${reviewInfo.term.term_code}`]: false }));
                            }
                          } : undefined}
                        >
                          <button
                            className="px-2 py-1 text-xs rounded-md transition-colors border bg-background hover:bg-muted border-border hover:border-primary/50 w-fit cursor-help"
                            onClick={(e) => {
                              console.log('🏷️ Term badge clicked (mobile):', reviewInfo.term.term_code);
                              e.preventDefault();
                              e.stopPropagation();
                              handleMobileTwoTap(`term-mobile-${reviewInfo.term.term_code}`, () => {
                                console.log('🎯 Term filter action triggered:', reviewInfo.term.term_code);
                                // 設置學期篩選
                                handleFiltersChange({
                                  ...filters,
                                  selectedTerms: [reviewInfo.term.term_code],
                                  currentPage: 1
                                });
                              });
                            }}
                          >
                            <span className="truncate">{reviewInfo.term.name}</span>
                          </button>
                        </ResponsiveTooltip>
                        {/* 語言徽章 - 手機版顯示在學期旁邊，限制最大寬度避免重疊 */}
                        {reviewInfo.review.review_language && (
                          <ResponsiveTooltip
                            content={t('filter.clickToFilterByLanguage', { language: getLanguageDisplayName(reviewInfo.review.review_language || 'en') })}
                            hasClickAction={true}
                            clickActionText={isMobile ? t('tooltip.clickAgainToFilter') : undefined}
                            open={isMobile ? mobileTapStates[`lang-mobile-${reviewInfo.review.review_language || 'en'}`] : undefined}
                            onOpenChange={isMobile ? (open) => {
                              if (!open) {
                                setMobileTapCounts(prev => ({ ...prev, [`lang-mobile-${reviewInfo.review.review_language || 'en'}`]: 0 }));
                                setMobileTapStates(prev => ({ ...prev, [`lang-mobile-${reviewInfo.review.review_language || 'en'}`]: false }));
                              }
                            } : undefined}
                          >
                            <button
                              className="px-2 py-1 text-xs rounded-md transition-colors border bg-background hover:bg-muted border-border hover:border-primary/50 w-fit cursor-help"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleMobileTwoTap(`lang-mobile-${reviewInfo.review.review_language || 'en'}`, () => {
                                  // 設置評論語言篩選
                                  handleFiltersChange({
                                    ...filters,
                                    selectedReviewLanguages: [reviewInfo.review.review_language || 'en'],
                                    currentPage: 1
                                  });
                                });
                              }}
                            >
                              <span className="truncate">{getLanguageDisplayName(reviewInfo.review.review_language || 'en')}</span>
                            </button>
                          </ResponsiveTooltip>
                        )}
                      </div>
                      {/* 課程標題 - 顯示在學生姓名/匿名行下方 */}
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-lg">
                            <a
                              href={`/courses/${reviewInfo.review.course_code}?review_id=${reviewInfo.review.$id}`}
                              className="text-primary cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors px-2 py-1 rounded-md inline-block no-underline"
                              onClick={(e) => {
                                if (e.ctrlKey || e.metaKey || e.button === 1) {
                                  return;
                                }
                                e.preventDefault();
                                navigate(`/courses/${reviewInfo.review.course_code}?review_id=${reviewInfo.review.$id}`);
                              }}
                            >
                              <div className="font-bold">{reviewInfo.review.course_code}</div>
                              <CourseTitle courseCode={reviewInfo.review.course_code} />
                            </a>
                          </h4>
                        </div>
                      </div>
                    </div>
                    {/* 右上角：學期和語言徽章、最終成績和編輯按鈕 */}
                    <div className="flex items-start gap-3 shrink-0">
                      {/* 學期和語言徽章 - 桌面版顯示在成績圓圈左側 */}
                      <div className="hidden md:flex items-center gap-2 shrink-0">
                        <ResponsiveTooltip
                          content={t('filter.clickToFilterByTerm', { term: reviewInfo.term.name })}
                          hasClickAction={true}
                          clickActionText={isMobile ? t('tooltip.clickAgainToFilter') : undefined}
                          open={isMobile ? mobileTapStates[`term-desktop-${reviewInfo.term.term_code}`] : undefined}
                          onOpenChange={isMobile ? (open) => {
                            if (!open) {
                              setMobileTapCounts(prev => ({ ...prev, [`term-desktop-${reviewInfo.term.term_code}`]: 0 }));
                              setMobileTapStates(prev => ({ ...prev, [`term-desktop-${reviewInfo.term.term_code}`]: false }));
                            }
                          } : undefined}
                        >
                          <button
                            className="px-2 py-1 text-xs rounded-md transition-colors border bg-background hover:bg-muted border-border hover:border-primary/50 shrink-0 cursor-help"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleMobileTwoTap(`term-desktop-${reviewInfo.term.term_code}`, () => {
                                // 設置學期篩選
                                handleFiltersChange({
                                  ...filters,
                                  selectedTerms: [reviewInfo.term.term_code],
                                  currentPage: 1
                                });
                              });
                            }}
                          >
                            <span className="truncate">{reviewInfo.term.name}</span>
                          </button>
                        </ResponsiveTooltip>
                        {/* 語言徽章 - 桌面版顯示在學期旁邊 */}
                        {reviewInfo.review.review_language && (
                          <ResponsiveTooltip
                            content={t('filter.clickToFilterByLanguage', { language: getLanguageDisplayName(reviewInfo.review.review_language || 'en') })}
                            hasClickAction={true}
                            clickActionText={isMobile ? t('tooltip.clickAgainToFilter') : undefined}
                            open={isMobile ? mobileTapStates[`lang-desktop-${reviewInfo.review.review_language || 'en'}`] : undefined}
                            onOpenChange={isMobile ? (open) => {
                              if (!open) {
                                setMobileTapCounts(prev => ({ ...prev, [`lang-desktop-${reviewInfo.review.review_language || 'en'}`]: 0 }));
                                setMobileTapStates(prev => ({ ...prev, [`lang-desktop-${reviewInfo.review.review_language || 'en'}`]: false }));
                              }
                            } : undefined}
                          >
                            <button
                              className="px-2 py-1 text-xs rounded-md transition-colors border bg-background hover:bg-muted border-border hover:border-primary/50 shrink-0 cursor-help"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleMobileTwoTap(`lang-desktop-${reviewInfo.review.review_language || 'en'}`, () => {
                                  // 設置評論語言篩選
                                  handleFiltersChange({
                                    ...filters,
                                    selectedReviewLanguages: [reviewInfo.review.review_language || 'en'],
                                    currentPage: 1
                                  });
                                });
                              }}
                            >
                              <span className="truncate">{getLanguageDisplayName(reviewInfo.review.review_language || 'en')}</span>
                            </button>
                          </ResponsiveTooltip>
                        )}
                      </div>
                      {/* 最終成績 */}
                      {reviewInfo.review.course_final_grade && (
                        <div className="flex flex-col items-center">
                          <GradeBadge 
                            grade={reviewInfo.review.course_final_grade}
                            size="md"
                            showTooltip={true}
                            hasClickAction={true}
                            isPending={isMobile ? mobileTapStates[`grade-${reviewInfo.review.course_final_grade}`] : false}
                            mobileTooltipOpen={isMobile ? mobileTapStates[`grade-${reviewInfo.review.course_final_grade}`] : undefined}
                            onMobileTooltipChange={isMobile ? (open) => {
                              if (!open) {
                                // Reset tap count when tooltip is closed externally
                                setMobileTapCounts(prev => ({ ...prev, [`grade-${reviewInfo.review.course_final_grade}`]: 0 }));
                                setMobileTapStates(prev => ({ ...prev, [`grade-${reviewInfo.review.course_final_grade}`]: false }));
                              }
                            } : undefined}
                            onClick={() => {
                              console.log('🔵 Grade circle clicked:', reviewInfo.review.course_final_grade);
                              handleMobileTwoTap(`grade-${reviewInfo.review.course_final_grade}`, () => {
                                console.log('🎯 Grade filter action triggered:', reviewInfo.review.course_final_grade);
                                const normalizedGrade = reviewInfo.review.course_final_grade === '-1' ? 'N/A' : reviewInfo.review.course_final_grade;
                                handleFiltersChange({
                                  ...filters,
                                  selectedGrades: [normalizedGrade],
                                  currentPage: 1
                                });
                              });
                            }}
                          />
                        </div>
                      )}
                      {/* 操作按鈕 - 垂直排列，每個按鈕一行 */}
                      <div className="flex flex-col gap-2">
                        <div>
                          <ResponsiveTooltip content={t('common.edit')}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditReview(reviewInfo.review.$id, reviewInfo.review.course_code)}
                              className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary cursor-help"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </ResponsiveTooltip>
                        </div>
                        <div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <ResponsiveTooltip content={t('common.delete')}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={deletingReviewId === reviewInfo.review.$id}
                                  className="h-8 w-8 p-0 border-2 border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-600 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300 dark:hover:border-red-600 cursor-help"
                                >
                                {deletingReviewId === reviewInfo.review.$id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                                </Button>
                              </ResponsiveTooltip>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-white dark:bg-gray-900">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                  <AlertCircle className="h-5 w-5 text-destructive" />
                                  {t('myReviews.deleteConfirmTitle')}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t('myReviews.deleteConfirmDescription')}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteReview(reviewInfo.review.$id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {t('common.delete')}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
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
                        <div className="bg-muted/50 p-2 rounded-md break-words text-sm">
                          {hasMarkdownFormatting(reviewInfo.review.course_comments) ? (
                            <div className="text-sm">{renderCommentMarkdown(reviewInfo.review.course_comments)}</div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              {reviewInfo.review.course_comments}
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Service learning is now displayed per instructor in the instructor details section */}

                  {/* 講師評分 */}
                  {reviewInfo.instructorDetails.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-medium">{t('review.instructorEvaluation')}</h3>
                      <div className="space-y-3">
                        {reviewInfo.instructorDetails.map((instructorDetail, idx) => {
                          // 從 instructorData 中獲取真實的講師信息
                          const instructor = reviewInfo.instructorData.get(instructorDetail.instructor_name);
                          
                          // 獲取講師姓名信息用於分行顯示
                          const nameInfo = instructor ? getInstructorName(instructor, language) : null;

                          return (
                            <div key={idx} className="p-4 bg-gray-200 dark:bg-[rgb(26,35,50)] rounded-lg">
                                                              <div className="space-y-2 mb-3">
                                {/* Instructor name and badges container */}
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-4">
                                  <div className="font-semibold text-lg min-w-0 md:flex-1">
                                    <a
                                      href={`/instructors/${encodeURIComponent(instructorDetail.instructor_name)}?review_id=${reviewInfo.review.$id}`}
                                      className="text-primary cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors px-2 py-1 rounded-md inline-block no-underline"
                                      onClick={(e) => {
                                        if (e.ctrlKey || e.metaKey || e.button === 1) {
                                          return;
                                        }
                                        e.preventDefault();
                                        navigate(`/instructors/${encodeURIComponent(instructorDetail.instructor_name)}?review_id=${reviewInfo.review.$id}`);
                                      }}
                                    >
                                      {nameInfo ? (
                                        <div className="text-left">
                                          <div className="font-bold">{nameInfo.primary}</div>
                                          {nameInfo.secondary && (
                                            <div className="text-sm text-muted-foreground font-normal mt-0.5 text-left">
                                              {nameInfo.secondary}
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="font-bold text-left">{instructorDetail.instructor_name}</div>
                                      )}
                                    </a>
                                  </div>
                                  
                                  {/* Desktop/Tablet: Badges on the same line as instructor name (right side) */}
                                  <div className="hidden md:flex md:items-start md:gap-2 md:shrink-0">
                                    {/* 課堂類型徽章 */}
                                    <ResponsiveTooltip
                                      content={t('filter.clickToFilterBySessionType', { type: t(`sessionTypeBadge.${instructorDetail.session_type.toLowerCase()}`) })}
                                      hasClickAction={true}
                                      clickActionText={isMobile ? t('tooltip.clickAgainToFilter') : undefined}
                                      open={isMobile ? mobileTapStates[`session-desktop-${instructorDetail.instructor_name}-${instructorDetail.session_type}`] : undefined}
                                      onOpenChange={isMobile ? (open) => {
                                        if (!open) {
                                          setMobileTapCounts(prev => ({ ...prev, [`session-desktop-${instructorDetail.instructor_name}-${instructorDetail.session_type}`]: 0 }));
                                          setMobileTapStates(prev => ({ ...prev, [`session-desktop-${instructorDetail.instructor_name}-${instructorDetail.session_type}`]: false }));
                                        }
                                      } : undefined}
                                    >
                                      <span 
                                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs cursor-help transition-all duration-200 hover:scale-105 ${
                                          instructorDetail.session_type === 'Lecture' 
                                            ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50'
                                            : instructorDetail.session_type === 'Tutorial'
                                            ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/50'
                                            : ''
                                        }`}
                                        onClick={() => handleSessionTypeClick(instructorDetail.session_type, isMobile ? `session-desktop-${instructorDetail.instructor_name}-${instructorDetail.session_type}` : undefined)}
                                      >
                                        {t(`sessionTypeBadge.${instructorDetail.session_type.toLowerCase()}`)}
                                      </span>
                                    </ResponsiveTooltip>

                                    {/* 教學語言徽章 */}
                                    {(() => {
                                      const teachingLanguage = getTeachingLanguageForInstructor(
                                        instructorDetail.instructor_name,
                                        instructorDetail.session_type
                                      );
                                      if (teachingLanguage) {
                                        return (
                                          <ResponsiveTooltip
                                            content={t('filter.clickToFilterByTeachingLanguage', { language: getTeachingLanguageName(teachingLanguage, t) })}
                                            hasClickAction={true}
                                            clickActionText={isMobile ? t('tooltip.clickAgainToFilter') : undefined}
                                            open={isMobile ? mobileTapStates[`teaching-desktop-${instructorDetail.instructor_name}-${teachingLanguage}`] : undefined}
                                            onOpenChange={isMobile ? (open) => {
                                              if (!open) {
                                                setMobileTapCounts(prev => ({ ...prev, [`teaching-desktop-${instructorDetail.instructor_name}-${teachingLanguage}`]: 0 }));
                                                setMobileTapStates(prev => ({ ...prev, [`teaching-desktop-${instructorDetail.instructor_name}-${teachingLanguage}`]: false }));
                                              }
                                            } : undefined}
                                          >
                                            <span 
                                              className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800 cursor-help transition-all duration-200 hover:scale-105 hover:bg-orange-100 dark:hover:bg-orange-900/50"
                                              onClick={() => {
                                                handleMobileTwoTap(`teaching-desktop-${instructorDetail.instructor_name}-${teachingLanguage}`, () => {
                                                  // 設置教學語言篩選
                                                  const teachingLanguage = getTeachingLanguageForInstructor(
                                                    instructorDetail.instructor_name,
                                                    instructorDetail.session_type
                                                  );
                                                  if (teachingLanguage) {
                                                    handleFiltersChange({
                                                      ...filters,
                                                      selectedTeachingLanguages: [teachingLanguage],
                                                      currentPage: 1
                                                    });
                                                  }
                                                });
                                              }}
                                            >
                                              {getTeachingLanguageName(teachingLanguage, t)}
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
                                    content={t('filter.clickToFilterBySessionType', { type: t(`sessionTypeBadge.${instructorDetail.session_type.toLowerCase()}`) })}
                                    hasClickAction={true}
                                    clickActionText={isMobile ? t('tooltip.clickAgainToFilter') : undefined}
                                    open={isMobile ? mobileTapStates[`session-mobile-${instructorDetail.instructor_name}-${instructorDetail.session_type}`] : undefined}
                                    onOpenChange={isMobile ? (open) => {
                                      if (!open) {
                                        setMobileTapCounts(prev => ({ ...prev, [`session-mobile-${instructorDetail.instructor_name}-${instructorDetail.session_type}`]: 0 }));
                                        setMobileTapStates(prev => ({ ...prev, [`session-mobile-${instructorDetail.instructor_name}-${instructorDetail.session_type}`]: false }));
                                      }
                                    } : undefined}
                                  >
                                    <span 
                                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs cursor-help transition-all duration-200 hover:scale-105 ${
                                        instructorDetail.session_type === 'Lecture' 
                                          ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50'
                                          : instructorDetail.session_type === 'Tutorial'
                                          ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/50'
                                          : ''
                                      }`}
                                      onClick={() => handleSessionTypeClick(instructorDetail.session_type, isMobile ? `session-mobile-${instructorDetail.instructor_name}-${instructorDetail.session_type}` : undefined)}
                                    >
                                      {t(`sessionTypeBadge.${instructorDetail.session_type.toLowerCase()}`)}
                                    </span>
                                  </ResponsiveTooltip>

                                  {/* 教學語言徽章 */}
                                  {(() => {
                                    const teachingLanguage = getTeachingLanguageForInstructor(
                                      instructorDetail.instructor_name,
                                      instructorDetail.session_type
                                    );
                                    if (teachingLanguage) {
                                      return (
                                        <ResponsiveTooltip
                                          content={t('filter.clickToFilterByTeachingLanguage', { language: getTeachingLanguageName(teachingLanguage, t) })}
                                          hasClickAction={true}
                                          clickActionText={isMobile ? t('tooltip.clickAgainToFilter') : undefined}
                                          open={isMobile ? mobileTapStates[`teaching-mobile-${instructorDetail.instructor_name}-${teachingLanguage}`] : undefined}
                                          onOpenChange={isMobile ? (open) => {
                                            if (!open) {
                                              setMobileTapCounts(prev => ({ ...prev, [`teaching-mobile-${instructorDetail.instructor_name}-${teachingLanguage}`]: 0 }));
                                              setMobileTapStates(prev => ({ ...prev, [`teaching-mobile-${instructorDetail.instructor_name}-${teachingLanguage}`]: false }));
                                            }
                                          } : undefined}
                                        >
                                          <span 
                                            className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800 cursor-help transition-all duration-200 hover:scale-105 hover:bg-orange-100 dark:hover:bg-orange-900/50"
                                            onClick={() => {
                                              handleMobileTwoTap(`teaching-mobile-${instructorDetail.instructor_name}-${teachingLanguage}`, () => {
                                                // 設置教學語言篩選
                                                const teachingLanguage = getTeachingLanguageForInstructor(
                                                  instructorDetail.instructor_name,
                                                  instructorDetail.session_type
                                                );
                                                if (teachingLanguage) {
                                                  handleFiltersChange({
                                                    ...filters,
                                                    selectedTeachingLanguages: [teachingLanguage],
                                                    currentPage: 1
                                                  });
                                                }
                                              });
                                            }}
                                          >
                                            {getTeachingLanguageName(teachingLanguage, t)}
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
                                    <span className="font-medium text-sm sm:text-base">{t('review.teachingScore')}</span>
                                    <div className="flex items-center justify-center lg:ml-1">
                                      {instructorDetail.teaching === null ? (
                                        <span className="text-muted-foreground">
                                          {t('review.rating.notRated')}
                                        </span>
                                      ) : instructorDetail.teaching === -1 ? (
                                        <span className="text-muted-foreground">
                                          {t('review.notApplicable')}
                                        </span>
                                      ) : (
                                        <StarRating rating={instructorDetail.teaching} showValue size="sm" showTooltip ratingType="teaching" />
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                {instructorDetail.grading !== null && instructorDetail.grading !== -1 && (
                                  <div className="text-center">
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-center gap-1 mb-1 lg:mb-0">
                                      <span className="font-medium text-sm sm:text-base">{t('review.gradingScore')}</span>
                                      <div className="flex items-center justify-center lg:ml-1">
                                        <StarRating rating={instructorDetail.grading} showValue size="sm" showTooltip ratingType="grading" />
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
                                  {renderBooleanBadge(instructorDetail.has_attendance_requirement, t('review.requirements.attendance'))}
                                  {renderBooleanBadge(instructorDetail.has_quiz, t('review.requirements.quiz'))}
                                  {renderBooleanBadge(instructorDetail.has_midterm, t('review.requirements.midterm'))}
                                  {renderBooleanBadge(instructorDetail.has_final, t('review.requirements.final'))}
                                  {renderBooleanBadge(instructorDetail.has_individual_assignment, t('review.requirements.individualAssignment'))}
                                  {renderBooleanBadge(instructorDetail.has_group_project, t('review.requirements.groupProject'))}
                                  {renderBooleanBadge(instructorDetail.has_presentation, t('review.requirements.presentation'))}
                                  {renderBooleanBadge(instructorDetail.has_reading, t('review.requirements.reading'))}
                                </div>
                              </div>

                              {/* 講師評論 */}
                              {instructorDetail.comments && (
                                <div className="mb-6 text-sm text-muted-foreground">
                                  <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                                    <User className="h-4 w-4 shrink-0" />
                                    <span>{t('review.instructorComments')}</span>
                                  </h5>
                                  <div className="ml-4 text-sm">
                                    {hasMarkdownFormatting(instructorDetail.comments) ? 
                                      <div className="text-sm">{renderCommentMarkdown(instructorDetail.comments)}</div> : 
                                      instructorDetail.comments
                                    }
                                  </div>
                                </div>
                              )}

                              {/* 服務學習 - 講師級別 */}
                              {instructorDetail.has_service_learning && (
                                <div className="mb-6">
                                  <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                                    <GraduationCap className="h-4 w-4 shrink-0" />
                                    <span>{t('review.serviceLearning')}</span>
                                  </h5>
                                  <div className="ml-4 space-y-2">
                                    <ResponsiveTooltip
                                      content={t('filter.clickToFilterByServiceLearning', { type: instructorDetail.service_learning_type === 'compulsory' ? t('review.compulsory') : t('review.optional') })}
                                      hasClickAction={true}
                                      clickActionText={isMobile ? t('tooltip.clickAgainToFilter') : undefined}
                                      open={isMobile ? mobileTapStates[`service-${instructorDetail.instructor_name}-${instructorDetail.service_learning_type}`] : undefined}
                                      onOpenChange={isMobile ? (open) => {
                                        if (!open) {
                                          // Reset tap count when tooltip is closed externally
                                          setMobileTapCounts(prev => ({ ...prev, [`service-${instructorDetail.instructor_name}-${instructorDetail.service_learning_type}`]: 0 }));
                                          setMobileTapStates(prev => ({ ...prev, [`service-${instructorDetail.instructor_name}-${instructorDetail.service_learning_type}`]: false }));
                                        }
                                      } : undefined}
                                    >
                                      <span 
                                        className={cn(
                                          "inline-flex items-center px-1.5 py-0.5 rounded text-xs cursor-help transition-all duration-200 hover:scale-105",
                                          instructorDetail.service_learning_type === 'compulsory'
                                            ? "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40"
                                            : "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/40"
                                        )}
                                        onClick={() => {
                                          console.log('🎓 Service learning badge clicked:', instructorDetail.service_learning_type);
                                          handleMobileTwoTap(`service-${instructorDetail.instructor_name}-${instructorDetail.service_learning_type}`, () => {
                                            console.log('🎯 Service learning filter action triggered:', instructorDetail.service_learning_type);
                                            // 設置服務學習篩選
                                            const serviceType = instructorDetail.service_learning_type;
                                            handleFiltersChange({
                                              ...filters,
                                              selectedServiceLearning: [serviceType],
                                              currentPage: 1
                                            });
                                          });
                                        }}
                                      >
                                        {instructorDetail.service_learning_type === 'compulsory' 
                                          ? t('review.compulsory') 
                                          : t('review.optional')
                                        }
                                      </span>
                                    </ResponsiveTooltip>
                                    {instructorDetail.service_learning_description && (
                                      <div className="text-xs text-muted-foreground break-words">
                                        {hasMarkdownFormatting(instructorDetail.service_learning_description) ? 
                                          <div className="text-xs">{renderCommentMarkdown(instructorDetail.service_learning_description)}</div> : 
                                          instructorDetail.service_learning_description
                                        }
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 投票和時間信息 */}
                  <Separator />
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 overflow-hidden">
                    <div className="flex-shrink-0">
                      <VotingButtons
                        reviewId={reviewInfo.review.$id}
                        upvotes={reviewInfo.upvotes}
                        downvotes={reviewInfo.downvotes}
                        userVote={null}
                        size="sm"
                        disabled={true}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 min-w-0">
                      <ResponsiveTooltip content={t('review.timestampTooltip', { timezone: 'Hong Kong Time (UTC+8)' })}>
                        <span className="truncate cursor-help">
                          {formatDateTimeUTC8(reviewInfo.review.$createdAt)}
                        </span>
                      </ResponsiveTooltip>
                    </div>
                  </div>
                </div>
              ))}
              </div>

              {/* Pagination */}
              <Pagination
                currentPage={filters.currentPage}
                totalPages={totalPages}
                onPageChange={(page) => handleFiltersChange({ ...filters, currentPage: page })}
                itemsPerPage={filters.itemsPerPage}
                totalItems={filteredAndSortedReviews.length}
              />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default MyReviews;