import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/contexts/AuthContext';
import { isReviewRetryFailGrade } from '@/utils/gradeUtils';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useToast } from '@/hooks/use-toast';
import { 
  BookOpen, 
  BookText,
  User, 
  Star, 
  MessageSquare, 
  Eye, 
  ArrowLeft, 
  Loader2, 
  AlertCircle, 
  AlertTriangle,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Users,
  GraduationCap,
  FileText,
  MessageCircle,
  Award,
  Target,
  Sparkles,
  CheckCircle2,
  CheckCircle,
  XCircle,
  X,
  Send,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Smile,
  Frown,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CourseService, Course, Term, Review, TeachingRecord, InstructorDetail, Instructor } from '@/services/api/courseService';
import { GradeBadge } from '@/components/ui/GradeBadge';
import { HybridMarkdownEditor } from '@/components/ui/hybrid-markdown-editor';
import { renderCommentMarkdown, hasMarkdownFormatting } from '@/utils/ui/markdownRenderer';
import { validateWordCount } from '@/utils/textUtils';
import { formatDateTimeUTC8 } from '@/utils/ui/dateUtils';
import { getTermStatus } from '@/utils/dateUtils';
import { ReviewAvatar } from '@/components/ui/review-avatar';
import { StarRating as UIStarRating } from '@/components/ui/star-rating';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { useInstructorDetailTeachingLanguages } from '@/hooks/useInstructorDetailTeachingLanguages';
import { getTeachingLanguageName, extractInstructorNameForSorting, getInstructorName } from '@/utils/textUtils';
import { splitInstructorNames, instructorNameMatches } from '@/utils/instructorNameUtils';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { ProgressBarForm } from '@/components/ui/progress-bar-form';
import { VotingButtons } from '@/components/ui/voting-buttons';

interface ReviewSubmissionFormProps {
  preselectedCourseCode?: string;
  editReviewId?: string;
}

interface InstructorEvaluation {
  instructorName: string;
  sessionType: string;
  teachingScore: number | null;
  gradingScore: number | null;
  comments: string;
  hasMidterm: boolean;
  hasFinal: boolean;
  hasQuiz: boolean;
  hasGroupProject: boolean;
  hasIndividualAssignment: boolean;
  hasPresentation: boolean;
  hasReading: boolean;
  hasAttendanceRequirement: boolean;
  // Service learning fields for each instructor
  hasServiceLearning: boolean;
  serviceLearningType: 'compulsory' | 'optional';
  serviceLearningDescription: string;
}

// 新增 StarRating 組件
interface FormStarRatingProps {
  rating: number | null;
  onRatingChange: (rating: number | null) => void;
  label: string;
  type?: 'workload' | 'difficulty' | 'usefulness' | 'teaching' | 'grading';
  t: (key: string) => string;
  required?: boolean;
}

const FormStarRating: React.FC<FormStarRatingProps> = ({ rating, onRatingChange, label, type = 'teaching', t, required = false }) => {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const pendingRatingRef = useRef<number | null>(null);

  const getRatingFromTouchX = (clientX: number): number => {
    if (!containerRef.current) return 1;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width - 0.1));
    const starWidth = rect.width / 5;
    const starIndex = Math.floor(x / starWidth);
    const posInStar = (x - starIndex * starWidth) / starWidth;
    return posInStar < 0.4 ? starIndex + 0.5 : starIndex + 1;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isNotApplicable) return;
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    pendingRatingRef.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || isNotApplicable) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartXRef.current);
    const dy = Math.abs(touch.clientY - touchStartYRef.current);
    if (dx < 5 && dy < 5) return;
    // If vertical scroll intent detected before any horizontal drag, abort
    if (!hasDraggedRef.current && dy > dx) {
      isDraggingRef.current = false;
      setHoveredRating(null);
      return;
    }
    hasDraggedRef.current = true;
    const newRating = getRatingFromTouchX(touch.clientX);
    pendingRatingRef.current = newRating;
    setHoveredRating(newRating);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    if (hasDraggedRef.current && pendingRatingRef.current !== null) {
      onRatingChange(pendingRatingRef.current);
      // Prevent the synthesized click so onClick handlers don't fire again
      e.preventDefault();
    }
    setHoveredRating(null);
    hasDraggedRef.current = false;
    pendingRatingRef.current = null;
  };

  const getDescription = (value: number) => {
    if (value === 0) {
      switch (type) {
        case 'workload':
          return t('review.workload.none');
        case 'difficulty':
          return t('review.difficulty.none');
        case 'usefulness':
          return t('review.usefulness.none');
        case 'teaching':
        case 'grading':
        default:
          return t('review.rating.0');
      }
    }
    
    switch (type) {
      case 'workload':
        return t(`review.workload.${['', 'veryLight', 'light', 'moderate', 'heavy', 'veryHeavy'][Math.ceil(value)]}`);
      case 'difficulty':
        return t(`review.difficulty.${['', 'veryEasy', 'easy', 'moderate', 'hard', 'veryHard'][Math.ceil(value)]}`);
      case 'usefulness':
        return t(`review.usefulness.${['', 'notUseful', 'slightlyUseful', 'moderatelyUseful', 'veryUseful', 'extremelyUseful'][Math.ceil(value)]}`);
      case 'teaching':
      case 'grading':
      default:
        return t(`review.rating.${Math.ceil(value)}`);
    }
  };

  const displayRating = hoveredRating !== null ? hoveredRating : (rating ?? 0);
  const isNotApplicable = rating === -1;
  // "Not rated" only when there's no committed rating AND no live hover preview.
  // On hover (desktop), we show the description for the value under the cursor
  // even before the user clicks. Mobile has no hover, so this is unaffected.
  const isNotRated = rating === null && hoveredRating === null;

  const renderStarRow = () => (
    <div
      ref={containerRef}
      className={cn(
        "flex items-center gap-1 flex-shrink-0",
        isNotApplicable && "opacity-40 pointer-events-none"
      )}
      onMouseLeave={() => setHoveredRating(null)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'pan-y' }}
    >
      {[1, 2, 3, 4, 5].map((starValue) => {
        const fullFilled = starValue <= displayRating && !isNotApplicable;
        const halfFilled = !fullFilled && starValue - 0.5 <= displayRating && !isNotApplicable;
        const isLast = starValue === 5;

        const halfValue = starValue - 0.5;
        const selectHalf = () => onRatingChange(rating === halfValue ? null : halfValue);
        const selectFull = () => onRatingChange(rating === starValue ? null : starValue);

        return (
          <div
            key={starValue}
            className={cn("group relative h-6 w-6", isLast && "mr-4")}
          >
            {/* Visual star only — never receives pointer events. The hit zones
                below decide the value, so clipPath (which also clips hit-testing)
                can't hijack clicks. */}
            <Star
              className={cn(
                "h-6 w-6 transition-transform pointer-events-none",
                !isNotApplicable && "group-hover:scale-110",
                fullFilled
                  ? 'fill-yellow-400 text-yellow-400'
                  : halfFilled
                  ? 'text-yellow-400'
                  : 'text-gray-400 dark:text-gray-400'
              )}
              style={{
                fill: fullFilled
                  ? 'currentColor'
                  : halfFilled
                  ? 'url(#half-fill)'
                  : 'none',
                stroke: fullFilled ? 'var(--star-stroke, #000000)' : 'currentColor',
                // Empty stars need a fixed outline width so they stay visible in
                // dark mode (where --star-stroke-width is 0px, meant only for the
                // filled star's outline).
                strokeWidth: (fullFilled || halfFilled) ? 'var(--star-stroke-width, 1px)' : '1.5px'
              }}
            />

            {/* Two side-by-side hit zones. Left 40% → half value, right 60% →
                whole value, so a natural tap on the star body gives an integer
                while half-steps stay reachable at the left edge. These are real
                non-overlapping flex children, so the split is exact on both
                desktop (hover) and mobile (tap). */}
            <div className="absolute inset-0 flex">
              <button
                type="button"
                aria-label={`${halfValue}`}
                onClick={selectHalf}
                onMouseEnter={() => setHoveredRating(halfValue)}
                className="h-full basis-2/5 focus:outline-none outline-none border-none p-0 cursor-pointer"
                style={{ outline: 'none', border: 'none', boxShadow: 'none', background: 'transparent' }}
                disabled={isNotApplicable}
              />
              <button
                type="button"
                aria-label={`${starValue}`}
                onClick={selectFull}
                onMouseEnter={() => setHoveredRating(starValue)}
                className="h-full basis-3/5 focus:outline-none outline-none border-none p-0 cursor-pointer"
                style={{ outline: 'none', border: 'none', boxShadow: 'none', background: 'transparent' }}
                disabled={isNotApplicable}
              />
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-1">
      {/* Desktop: Label, N/A, Stars, and Description on same line */}
      <div className="hidden md:flex md:items-center md:gap-4">
        <Label className="text-sm font-bold min-w-[120px] flex-shrink-0">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
        
        {/* N/A Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "text-xs px-2 py-1 h-6 border transition-colors flex-shrink-0",
            rating === -1 
              ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90" 
              : "border-border hover:bg-accent hover:text-accent-foreground"
          )}
          onClick={() => onRatingChange(rating === -1 ? null : -1)}
        >
          {t('review.notApplicable')}
        </Button>
        
        {/* Star Rating with Hover Effects */}
        {renderStarRow()}

        {/* Description on same line for desktop */}
        <div className="flex-1 min-w-0">
          <span className="text-sm text-muted-foreground">
            {isNotRated ? t('review.rating.notRated') : 
             isNotApplicable ? '' : 
             `${displayRating}/5 - ${getDescription(displayRating)}`}
          </span>
        </div>
      </div>

      {/* Mobile: Traditional stacked layout */}
      <div className="md:hidden space-y-2">
        <Label className="text-sm font-bold">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
        <div className="flex items-center gap-2">
          {/* N/A Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "text-xs px-2 py-1 h-6 border transition-colors",
              rating === -1 
                ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90" 
                : "border-border hover:bg-accent hover:text-accent-foreground"
            )}
            onClick={() => onRatingChange(rating === -1 ? null : -1)}
          >
            {t('review.notApplicable')}
          </Button>
          
          {/* Star Rating with Hover Effects */}
          {renderStarRow()}
        </div>

        {/* Mobile: Description on new line */}
        <div className="text-sm text-muted-foreground">
          {isNotRated ? t('review.rating.notRated') : 
           isNotApplicable ? '' : 
           `${displayRating}/5 - ${getDescription(displayRating)}`}
        </div>
      </div>
      
      {/* SVG Definition for half-fill gradient */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="half-fill" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="transparent" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

const ReviewSubmissionForm = ({ preselectedCourseCode, editReviewId }: ReviewSubmissionFormProps) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // State variables
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [termsLoading, setTermsLoading] = useState(false);
  const [instructorsLoading, setInstructorsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingEditData, setLoadingEditData] = useState(false);

  // Data states
  const [courses, setCourses] = useState<Course[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [availableInstructors, setAvailableInstructors] = useState<TeachingRecord[]>([]);
  const [instructorsMap, setInstructorsMap] = useState<Map<string, Instructor>>(new Map());
  const [instructorCourses, setInstructorCourses] = useState<Course[]>([]);
  
  // Performance optimization: Cache teaching records to avoid redundant API calls
  const [teachingRecordsCache, setTeachingRecordsCache] = useState<Map<string, TeachingRecord[]>>(new Map());
  const [termsCache, setTermsCache] = useState<Map<string, Term>>(new Map());
  const [instructorsCache, setInstructorsCache] = useState<Map<string, Instructor>>(new Map());
  const [instructorTeachingRecordsCache, setInstructorTeachingRecordsCache] = useState<Map<string, TeachingRecord[]>>(new Map());
  const [coursesCache, setCoursesCache] = useState<Map<string, Course>>(new Map());

  // Form states
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [selectedInstructors, setSelectedInstructors] = useState<string[]>([]);
  const [preSelectedInstructor, setPreSelectedInstructor] = useState<string>('');
  const [originPage, setOriginPage] = useState<string>('');
  
  // Course evaluation - Use null to represent "not yet rated" state
  const [workload, setWorkload] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<number | null>(null);
  const [usefulness, setUsefulness] = useState<number | null>(null);
  const [grade, setGrade] = useState<string>('');
  const [courseComments, setCourseComments] = useState<string>('');

  const [isAnonymous, setIsAnonymous] = useState<boolean>(true);
  const [reviewLanguage, setReviewLanguage] = useState<string>('en'); // Default to English
  
  // Preview timestamp state
  const [previewTimestamp, setPreviewTimestamp] = useState<string>('');

  // Instructor evaluations
  const [instructorEvaluations, setInstructorEvaluations] = useState<InstructorEvaluation[]>([]);

  // Edit mode states
  const [isEditMode, setIsEditMode] = useState<boolean>(!!editReviewId);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [isPopulatingEditData, setIsPopulatingEditData] = useState<boolean>(false);

  // Review eligibility states
  const [reviewEligibility, setReviewEligibility] = useState<{
    canSubmit: boolean;
    reason?: string;
    existingReviews: Review[];
  } | null>(null);
  const [checkingEligibility, setCheckingEligibility] = useState<boolean>(false);

  // Common phrases UI states
  const [coursePhrasesExpanded, setCoursePhrasesExpanded] = useState<boolean>(false);
  const [teachingPhrasesExpanded, setTeachingPhrasesExpanded] = useState<{[key: number]: boolean}>({});
  const [courseActiveTab, setCourseActiveTab] = useState<string>('content');
  const [teachingActiveTabs, setTeachingActiveTabs] = useState<{[key: number]: string}>({});
  
  // Instructor selection tab state
  const [activeInstructorTab, setActiveInstructorTab] = useState<string>('Lecture');
  
  // Progress bar form state
  const [currentStep, setCurrentStep] = useState<number>(0);

  // Step validation functions
  const validateCourseSelectionStep = () => {
    // Basic validation: course and term must be selected
    if (!selectedCourse || !selectedTerm) {
      return false;
    }
    
    // For new reviews, also check if user can submit reviews
    if (!isEditMode && reviewEligibility && !reviewEligibility.canSubmit) {
      return false;
    }
    
    // Check instructor selection based on available instructor types
    const lectureInstructors = availableInstructors.filter(record => record.session_type === 'Lecture');
    const tutorialInstructors = availableInstructors.filter(record => record.session_type === 'Tutorial');
    
    const hasLectureInstructors = lectureInstructors.length > 0;
    const hasTutorialInstructors = tutorialInstructors.length > 0;
    
    const selectedLectureInstructors = selectedInstructors.filter(key => key.endsWith('|Lecture'));
    const selectedTutorialInstructors = selectedInstructors.filter(key => key.endsWith('|Tutorial'));

    // 共同授課的場次會有多位講課/導修導師（teaching_records 合併列在資料層已展開成個別講師），
    // 使用者可自行複選任意位，但每種可選的場次類型至少要選一位。
    // If both lecture and tutorial instructors are available, user must select at least one from each
    if (hasLectureInstructors && hasTutorialInstructors) {
      return selectedLectureInstructors.length > 0 && selectedTutorialInstructors.length > 0;
    }

    // If only lecture instructors are available, user must select at least one lecture instructor
    if (hasLectureInstructors && !hasTutorialInstructors) {
      return selectedLectureInstructors.length > 0;
    }
    
    // If only tutorial instructors are available, user must select at least one tutorial instructor
    if (!hasLectureInstructors && hasTutorialInstructors) {
      return selectedTutorialInstructors.length > 0;
    }
    
    // If no instructors are available, validation fails
    return false;
  };

  const validateCourseReviewStep = () => {
    return workload !== null && 
           difficulty !== null && 
           usefulness !== null && 
           grade.trim() !== '' && 
           courseComments.trim() !== '';
  };

  const validateInstructorEvaluationsStep = () => {
    return instructorEvaluations.every(evaluation => 
      evaluation.teachingScore !== null && 
      evaluation.gradingScore !== null && 
      evaluation.comments.trim() !== '' &&
      (!evaluation.hasServiceLearning || 
       (evaluation.serviceLearningType !== 'compulsory' || 
        evaluation.serviceLearningDescription.trim() !== ''))
    );
  };
  
  const validateSingleInstructorEvaluation = (index: number) => {
    const evaluation = instructorEvaluations[index];
    if (!evaluation) return false;
    
    // Check if at least one course requirement is selected
    const hasAtLeastOneRequirement = 
      evaluation.hasMidterm || evaluation.hasFinal || evaluation.hasQuiz || 
      evaluation.hasGroupProject || evaluation.hasIndividualAssignment || 
      evaluation.hasPresentation || evaluation.hasReading || evaluation.hasAttendanceRequirement;
    
    return evaluation.teachingScore !== null && 
      evaluation.gradingScore !== null && 
      evaluation.comments.trim() !== '' &&
      hasAtLeastOneRequirement &&
      (!evaluation.hasServiceLearning || 
       (evaluation.serviceLearningType !== 'compulsory' || 
        evaluation.serviceLearningDescription.trim() !== ''));
  };

  const validateSubmissionStep = () => {
    return true; // Submission step is always valid
  };




  // Filter courses based on pre-selected instructor
  const filteredCourses = useMemo(() => {
    if (!preSelectedInstructor) {
      return courses;
    }
    
    // If instructor is pre-selected, only show courses taught by that instructor
    // This will be populated when we load instructor's teaching records
    return instructorCourses.length > 0 ? instructorCourses : courses;
  }, [courses, preSelectedInstructor, instructorCourses]);

  // Memoize available session types to prevent unnecessary re-renders
  const availableSessionTypes = useMemo(() => {
    return [...new Set(availableInstructors.map(instructor => instructor.session_type))];
  }, [availableInstructors]);

  // Memoize filtered instructors for current course and term
  const filteredInstructors = useMemo(() => {
    if (!selectedCourse || !selectedTerm) return [];
    
    return availableInstructors.filter(instructor => 
      // 🐛 FIX: Case-insensitive comparison for course codes
      instructor.course_code.toLowerCase() === selectedCourse.toLowerCase() && instructor.term_code === selectedTerm
    );
  }, [availableInstructors, selectedCourse, selectedTerm]);

  // Memoize instructors by session type for better performance
  const instructorsBySessionType = useMemo(() => {
    return filteredInstructors.reduce((acc, instructor) => {
      if (!acc[instructor.session_type]) {
        acc[instructor.session_type] = [];
      }
      acc[instructor.session_type].push(instructor);
      return acc;
    }, {} as Record<string, TeachingRecord[]>);
  }, [filteredInstructors]);

  // Build params for preview teaching languages hook (selected instructors at current course+term)
  const allInstructorParams = useMemo(() => {
    if (!selectedCourse || !selectedTerm) return [];
    return instructorEvaluations.map(instructorEval => ({
      courseCode: selectedCourse,
      termCode: selectedTerm,
      instructorName: instructorEval.instructorName,
      sessionType: instructorEval.sessionType
    }));
  }, [instructorEvaluations, selectedCourse, selectedTerm]);

  // Build params for available instructors teaching languages hook
  // 合併講師（"A / B"）拆成個別講師查詢，對應已展開的 teaching_records 快取
  const allAvailableInstructorParams = useMemo(() => {
    if (!selectedCourse || !selectedTerm) return [];
    return availableInstructors.flatMap(instructor =>
      splitInstructorNames(instructor.instructor_name).map(name => ({
        courseCode: selectedCourse,
        termCode: selectedTerm,
        instructorName: name,
        sessionType: instructor.session_type
      }))
    );
  }, [availableInstructors, selectedCourse, selectedTerm]);

  // Use teaching languages hook for preview (selected instructors)
  const {
    loading: teachingLanguagesLoading,
    getTeachingLanguageForInstructor: getPreviewTeachingLanguageForInstructor
  } = useInstructorDetailTeachingLanguages({
    params: allInstructorParams
  });

  // Use teaching languages hook for all available instructors (for selection UI)
  const {
    loading: availableTeachingLanguagesLoading,
    getTeachingLanguageForInstructor: getAvailableTeachingLanguageForInstructor
  } = useInstructorDetailTeachingLanguages({
    params: allAvailableInstructorParams
  });

  // Performance optimization: Cached teaching records getter
  const getCachedTeachingRecords = useCallback(async (courseCode: string): Promise<TeachingRecord[]> => {
    if (teachingRecordsCache.has(courseCode)) {
      return teachingRecordsCache.get(courseCode)!;
    }
    
    // 寫評價頁以「場次」為單位：使用原始（未展開）教學記錄，讓 A、B、A/B 各為獨立選項
    const records = await CourseService.getCourseTeachingRecordsRaw(courseCode);
    setTeachingRecordsCache(prev => new Map(prev.set(courseCode, records)));
    return records;
  }, [teachingRecordsCache]);

  // Performance optimization: Batch load terms
  const batchLoadTerms = useCallback(async (termCodes: string[]): Promise<Map<string, Term>> => {
    const uncachedTerms = termCodes.filter(code => !termsCache.has(code));
    
    if (uncachedTerms.length === 0) {
      return new Map(termCodes.map(code => [code, termsCache.get(code)!]));
    }

    // Single batched IN query instead of one request per term
    let fetchedTerms: Term[] = [];
    try {
      fetchedTerms = await CourseService.getTermsByCodes(uncachedTerms);
    } catch (error) {
      console.error('Error batch loading terms:', error);
    }
    const fetchedMap = new Map(fetchedTerms.map(term => [term.term_code, term]));

    // Update cache with newly loaded terms
    setTermsCache(prev => {
      const newCache = new Map(prev);
      fetchedMap.forEach((term, code) => newCache.set(code, term));
      return newCache;
    });

    // Return all requested terms (cached + newly loaded)
    return new Map(
      termCodes
        .map(code => [code, termsCache.get(code) || fetchedMap.get(code)] as [string, Term | undefined])
        .filter(([, term]) => term !== null && term !== undefined) as [string, Term][]
    );
  }, [termsCache]);

  // Performance optimization: Batch load instructors with caching
  const batchLoadInstructors = useCallback(async (instructorNames: string[]): Promise<Map<string, Instructor>> => {
    const uncachedInstructors = instructorNames.filter(name => !instructorsCache.has(name));
    
    if (uncachedInstructors.length === 0) {
      return new Map(instructorNames.map(name => [name, instructorsCache.get(name)!]));
    }

    // Single batched IN query instead of one request per instructor
    let fetchedInstructors: Instructor[] = [];
    try {
      fetchedInstructors = await CourseService.getInstructorsByNames(uncachedInstructors);
    } catch (error) {
      console.warn('Failed to batch fetch instructor info:', error);
    }
    const fetchedMap = new Map(fetchedInstructors.map(instructor => [instructor.name, instructor]));

    // Update cache with newly loaded instructors
    setInstructorsCache(prev => {
      const newCache = new Map(prev);
      fetchedMap.forEach((instructor, name) => newCache.set(name, instructor));
      return newCache;
    });

    // Return all requested instructors (cached + newly loaded)
    return new Map(
      instructorNames
        .map(name => [name, instructorsCache.get(name) || fetchedMap.get(name)] as [string, Instructor | undefined])
        .filter(([, instructor]) => instructor !== null && instructor !== undefined) as [string, Instructor][]
    );
  }, [instructorsCache]);

  // Performance optimization: Cache instructor teaching records
  const getCachedInstructorTeachingRecords = useCallback(async (instructorName: string): Promise<TeachingRecord[]> => {
    if (instructorTeachingRecordsCache.has(instructorName)) {
      return instructorTeachingRecordsCache.get(instructorName)!;
    }
    
    const records = await CourseService.getInstructorTeachingRecords(instructorName);
    setInstructorTeachingRecordsCache(prev => new Map(prev.set(instructorName, records)));
    return records;
  }, [instructorTeachingRecordsCache]);

  // Performance optimization: Batch load courses with caching
  const batchLoadCourses = useCallback(async (courseCodes: string[]): Promise<Map<string, Course>> => {
    const uncachedCourses = courseCodes.filter(code => !coursesCache.has(code));
    
    if (uncachedCourses.length === 0) {
      return new Map(courseCodes.map(code => [code, coursesCache.get(code)!]));
    }

    // Single batched IN query instead of one request per course
    let fetchedCourses: Course[] = [];
    try {
      fetchedCourses = await CourseService.getCoursesByCodes(uncachedCourses);
    } catch (error) {
      console.error('Error batch loading courses:', error);
    }
    const fetchedMap = new Map(fetchedCourses.map(course => [course.course_code, course]));

    // Update cache with newly loaded courses
    setCoursesCache(prev => {
      const newCache = new Map(prev);
      fetchedMap.forEach((course, code) => newCache.set(code, course));
      return newCache;
    });

    // Return all requested courses (cached + newly loaded)
    return new Map(
      courseCodes
        .map(code => [code, coursesCache.get(code) || fetchedMap.get(code)] as [string, Course | undefined])
        .filter(([, course]) => course !== null && course !== undefined) as [string, Course][]
    );
  }, [coursesCache]);



  // Common phrases for comments
  const getCommonPhrases = (type: 'course' | 'teaching') => {
    if (type === 'course') {
      return {
        content: {
          positive: [
            t('review.phrases.course.content.positive.1'),
            t('review.phrases.course.content.positive.2'),
            t('review.phrases.course.content.positive.3'),
            t('review.phrases.course.content.positive.4'),
            t('review.phrases.course.content.positive.5'),
          ],
          negative: [
            t('review.phrases.course.content.negative.1'),
            t('review.phrases.course.content.negative.2'),
            t('review.phrases.course.content.negative.3'),
            t('review.phrases.course.content.negative.4'),
            t('review.phrases.course.content.negative.5'),
          ]
        },
        workload: {
          positive: [
            t('review.phrases.course.workload.positive.1'),
            t('review.phrases.course.workload.positive.2'),
            t('review.phrases.course.workload.positive.3'),
            t('review.phrases.course.workload.positive.4'),
            t('review.phrases.course.workload.positive.5'),
          ],
          negative: [
            t('review.phrases.course.workload.negative.1'),
            t('review.phrases.course.workload.negative.2'),
            t('review.phrases.course.workload.negative.3'),
            t('review.phrases.course.workload.negative.4'),
            t('review.phrases.course.workload.negative.5'),
          ]
        },
        assessment: {
          positive: [
            t('review.phrases.course.assessment.positive.1'),
            t('review.phrases.course.assessment.positive.2'),
            t('review.phrases.course.assessment.positive.3'),
            t('review.phrases.course.assessment.positive.4'),
            t('review.phrases.course.assessment.positive.5'),
          ],
          negative: [
            t('review.phrases.course.assessment.negative.1'),
            t('review.phrases.course.assessment.negative.2'),
            t('review.phrases.course.assessment.negative.3'),
            t('review.phrases.course.assessment.negative.4'),
            t('review.phrases.course.assessment.negative.5'),
          ]
        },
        overall: {
          positive: [
            t('review.phrases.course.overall.positive.1'),
            t('review.phrases.course.overall.positive.2'),
            t('review.phrases.course.overall.positive.3'),
            t('review.phrases.course.overall.positive.4'),
            t('review.phrases.course.overall.positive.5'),
          ],
          negative: [
            t('review.phrases.course.overall.negative.1'),
            t('review.phrases.course.overall.negative.2'),
            t('review.phrases.course.overall.negative.3'),
            t('review.phrases.course.overall.negative.4'),
            t('review.phrases.course.overall.negative.5'),
          ]
        }
      };
    } else {
      return {
        style: {
          positive: [
            t('review.phrases.teaching.style.positive.1'),
            t('review.phrases.teaching.style.positive.2'),
            t('review.phrases.teaching.style.positive.3'),
            t('review.phrases.teaching.style.positive.4'),
            t('review.phrases.teaching.style.positive.5'),
          ],
          negative: [
            t('review.phrases.teaching.style.negative.1'),
            t('review.phrases.teaching.style.negative.2'),
            t('review.phrases.teaching.style.negative.3'),
            t('review.phrases.teaching.style.negative.4'),
            t('review.phrases.teaching.style.negative.5'),
          ]
        },
        support: {
          positive: [
            t('review.phrases.teaching.support.positive.1'),
            t('review.phrases.teaching.support.positive.2'),
            t('review.phrases.teaching.support.positive.3'),
            t('review.phrases.teaching.support.positive.4'),
            t('review.phrases.teaching.support.positive.5'),
          ],
          negative: [
            t('review.phrases.teaching.support.negative.1'),
            t('review.phrases.teaching.support.negative.2'),
            t('review.phrases.teaching.support.negative.3'),
            t('review.phrases.teaching.support.negative.4'),
            t('review.phrases.teaching.support.negative.5'),
          ]
        },
        organization: {
          positive: [
            t('review.phrases.teaching.organization.positive.1'),
            t('review.phrases.teaching.organization.positive.2'),
            t('review.phrases.teaching.organization.positive.3'),
            t('review.phrases.teaching.organization.positive.4'),
            t('review.phrases.teaching.organization.positive.5'),
          ],
          negative: [
            t('review.phrases.teaching.organization.negative.1'),
            t('review.phrases.teaching.organization.negative.2'),
            t('review.phrases.teaching.organization.negative.3'),
            t('review.phrases.teaching.organization.negative.4'),
            t('review.phrases.teaching.organization.negative.5'),
          ]
        },
        communication: {
          positive: [
            t('review.phrases.teaching.communication.positive.1'),
            t('review.phrases.teaching.communication.positive.2'),
            t('review.phrases.teaching.communication.positive.3'),
            t('review.phrases.teaching.communication.positive.4'),
            t('review.phrases.teaching.communication.positive.5'),
          ],
          negative: [
            t('review.phrases.teaching.communication.negative.1'),
            t('review.phrases.teaching.communication.negative.2'),
            t('review.phrases.teaching.communication.negative.3'),
            t('review.phrases.teaching.communication.negative.4'),
            t('review.phrases.teaching.communication.negative.5'),
          ]
        }
      };
    }
  };

  // Helper function to determine if a phrase is positive or negative based on common phrases
  const getPhraseSentiment = (phrase: string, type: 'course' | 'teaching'): 'positive' | 'negative' | 'neutral' => {
    const phrases = getCommonPhrases(type);
    const categories = type === 'course' 
      ? ['content', 'workload', 'assessment', 'overall']
      : ['style', 'support', 'organization', 'communication'];
    
    for (const category of categories) {
      const categoryPhrases = (phrases as any)[category];
      if (categoryPhrases?.positive?.includes(phrase)) return 'positive';
      if (categoryPhrases?.negative?.includes(phrase)) return 'negative';
    }
    return 'neutral';
  };

  // Helper function to get phrase category
  const getPhraseCategory = (phrase: string, type: 'course' | 'teaching'): string | null => {
    const phrases = getCommonPhrases(type);
    const categories = type === 'course' 
      ? ['content', 'workload', 'assessment', 'overall']
      : ['style', 'support', 'organization', 'communication'];
    
    for (const category of categories) {
      const categoryPhrases = (phrases as any)[category];
      if (categoryPhrases?.positive?.includes(phrase) || categoryPhrases?.negative?.includes(phrase)) {
        return category;
      }
    }
    return null;
  };

  // Helper function to organize comment with phrases grouped by sentiment and category
  const organizeCommentWithPhrase = (currentComment: string, newPhrase: string, type: 'course' | 'teaching', isRemoving: boolean = false): string => {
    const sentiment = getPhraseSentiment(newPhrase, type);
    const category = getPhraseCategory(newPhrase, type);
    
    // Parse existing comment to extract sections
    const sections = {
      positive: {} as Record<string, string[]>, // category -> phrases
      negative: {} as Record<string, string[]>, // category -> phrases
      neutral: [] as string[]
    };
    
    if (currentComment.trim()) {
      const lines = currentComment.split('\n').filter(line => line.trim());
      let currentSection: 'positive' | 'negative' | 'neutral' = 'neutral';
      let currentCategory: string | null = null;
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Check for section headers
        if (trimmedLine.startsWith('✓') || trimmedLine.includes('Positive:') || trimmedLine.includes('優點:') || trimmedLine.includes('正面:')) {
          currentSection = 'positive';
          continue;
        } else if (trimmedLine.startsWith('✗') || trimmedLine.includes('Negative:') || trimmedLine.includes('缺點:') || trimmedLine.includes('負面:')) {
          currentSection = 'negative';
          continue;
        }
        
        // Check for category headers (bold text or specific patterns)
        const categoryPatterns = type === 'course' 
          ? ['Content:', 'Workload:', 'Assessment:', 'Overall:', '內容:', '工作量:', '評估:', '整體:']
          : ['Style:', 'Support:', 'Organization:', 'Communication:', '風格:', '支援:', '組織:', '溝通:'];
        
        const foundCategory = categoryPatterns.find(pattern => trimmedLine.includes(pattern));
        if (foundCategory) {
          currentCategory = foundCategory.replace(':', '').toLowerCase();
          continue;
        }
        
        // Check for bullet points
        if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) {
          const content = trimmedLine.replace(/^[•-]\s*/, '');
          
          // Skip this phrase if we're removing it
          if (isRemoving && content === newPhrase) {
            continue;
          }
          
          if (currentSection !== 'neutral' && currentCategory) {
            if (!sections[currentSection][currentCategory]) {
              sections[currentSection][currentCategory] = [];
            }
            sections[currentSection][currentCategory].push(content);
          } else if (currentSection !== 'neutral') {
            // Add to 'general' category if no specific category
            if (!sections[currentSection]['general']) {
              sections[currentSection]['general'] = [];
            }
            sections[currentSection]['general'].push(content);
          } else {
            sections.neutral.push(content);
          }
        } else if (trimmedLine && currentSection === 'neutral') {
          // Skip this phrase if we're removing it
          if (isRemoving && trimmedLine === newPhrase) {
            continue;
          }
          sections.neutral.push(trimmedLine);
        }
      }
    }
    
    // Add new phrase to appropriate section and category (only if not removing)
    if (!isRemoving) {
      if (sentiment !== 'neutral' && category) {
        if (!sections[sentiment][category]) {
          sections[sentiment][category] = [];
        }
        sections[sentiment][category].push(newPhrase);
      } else {
        sections.neutral.push(newPhrase);
      }
    }
    
    // Build organized comment
    const parts = [];
    
    // Helper function to get category display name
    const getCategoryDisplayName = (cat: string, type: 'course' | 'teaching'): string => {
      const categoryMap = type === 'course' 
        ? {
            content: t('review.autoGenerated.categories.content'),
            workload: t('review.autoGenerated.categories.workload'),
            assessment: t('review.autoGenerated.categories.assessment'),
            overall: t('review.autoGenerated.categories.overall'),
            general: t('review.autoGenerated.categories.general')
          }
        : {
            style: t('review.autoGenerated.categories.style'),
            support: t('review.autoGenerated.categories.support'),
            organization: t('review.autoGenerated.categories.organization'),
            communication: t('review.autoGenerated.categories.communication'),
            general: t('review.autoGenerated.categories.general')
          };
      return categoryMap[cat as keyof typeof categoryMap] || cat;
    };
    
    // Build positive section
    if (Object.keys(sections.positive).length > 0) {
      const positiveParts = [`✓ **${t('review.autoGenerated.positiveAspects')}:**`];
      Object.entries(sections.positive).forEach(([cat, phrases]) => {
        if (phrases.length > 0) {
          positiveParts.push(`**${getCategoryDisplayName(cat, type)}:**`);
          phrases.forEach(phrase => {
            positiveParts.push(`• ${phrase}`);
          });
        }
      });
      parts.push(positiveParts.join('\n'));
    }
    
    // Build negative section
    if (Object.keys(sections.negative).length > 0) {
      const negativeParts = [`✗ **${t('review.autoGenerated.negativeAspects')}:**`];
      Object.entries(sections.negative).forEach(([cat, phrases]) => {
        if (phrases.length > 0) {
          negativeParts.push(`**${getCategoryDisplayName(cat, type)}:**`);
          phrases.forEach(phrase => {
            negativeParts.push(`• ${phrase}`);
          });
        }
      });
      parts.push(negativeParts.join('\n'));
    }
    
    // Add neutral content
    if (sections.neutral.length > 0) {
      parts.push(sections.neutral.join('\n'));
    }
    
    return parts.join('\n\n');
  };

  const updateInstructorEvaluation = (index: number, field: keyof InstructorEvaluation, value: any) => {
    setInstructorEvaluations(prev => 
      prev.map((evaluation, i) => 
        i === index ? { ...evaluation, [field]: value } : evaluation
      )
    );
  };

  const addPhraseToComment = (phrase: string, type: 'course' | 'teaching', instructorIndex?: number) => {
    // Check if phrase is already selected
    const isSelected = isPhraseSelected(phrase, type, instructorIndex);
    
    if (type === 'course') {
      const currentComment = courseComments;
      const newComment = organizeCommentWithPhrase(currentComment, phrase, type, isSelected);
      setCourseComments(newComment);
    } else if (type === 'teaching' && instructorIndex !== undefined) {
      const currentComment = instructorEvaluations[instructorIndex]?.comments || '';
      const newComment = organizeCommentWithPhrase(currentComment, phrase, type, isSelected);
      updateInstructorEvaluation(instructorIndex, 'comments', newComment);
    }
  };

  // Check if a phrase is already selected in the comment
  const isPhraseSelected = (phrase: string, type: 'course' | 'teaching', instructorIndex?: number): boolean => {
    const currentComment = type === 'course' 
      ? courseComments 
      : instructorEvaluations[instructorIndex || 0]?.comments || '';
    
    // Check if the phrase exists in the current comment
    return currentComment.includes(phrase);
  };

  const renderCommonPhrases = (type: 'course' | 'teaching', instructorIndex?: number) => {
    const phrases = getCommonPhrases(type);
    const categories = type === 'course' 
      ? [
          { key: 'content', label: t('review.phrases.category.content') },
          { key: 'workload', label: t('review.phrases.category.workload') },
          { key: 'assessment', label: t('review.phrases.category.assessment') },
          { key: 'overall', label: t('review.phrases.category.overall') }
        ]
      : [
          { key: 'style', label: t('review.phrases.category.style') },
          { key: 'support', label: t('review.phrases.category.support') },
          { key: 'organization', label: t('review.phrases.category.organization') },
          { key: 'communication', label: t('review.phrases.category.communication') }
        ];

    const isExpanded = type === 'course' 
      ? coursePhrasesExpanded 
      : teachingPhrasesExpanded[instructorIndex || 0] || false;
    
    const activeTab = type === 'course' 
      ? courseActiveTab 
      : teachingActiveTabs[instructorIndex || 0] || 'style';

    const toggleExpanded = () => {
      if (type === 'course') {
        setCoursePhrasesExpanded(!coursePhrasesExpanded);
      } else {
        setTeachingPhrasesExpanded(prev => ({
          ...prev,
          [instructorIndex || 0]: !isExpanded
        }));
      }
    };

    const setActiveTab = (tabKey: string) => {
      if (type === 'course') {
        setCourseActiveTab(tabKey);
      } else {
        setTeachingActiveTabs(prev => ({
          ...prev,
          [instructorIndex || 0]: tabKey
        }));
      }
    };

    const currentCategory = categories.find(cat => cat.key === activeTab) || categories[0];
    const currentPhrases = (phrases as any)[currentCategory.key];
    
    return (
      <div className="space-y-3 bg-muted/20 dark:bg-muted/10 rounded-lg">
        {/* Header with expand/collapse button */}
        <div 
          className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30 dark:hover:bg-muted/20 transition-colors rounded-lg"
          onClick={toggleExpanded}
        >
          <Label className="text-sm font-medium cursor-pointer">{t('review.commonPhrases')}</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
          >
            {isExpanded ? (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </Button>
        </div>

        {/* Expandable content */}
        {isExpanded && (
          <div className="px-3 pb-3 space-y-3">
            {/* Tab switcher */}
            <div className="flex flex-wrap gap-1 p-1 bg-muted/40 dark:bg-muted/20 rounded-lg">
              {categories.map((category) => (
                <Button
                  key={category.key}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={`text-xs h-7 px-3 border-b-2 rounded-none ${
                    activeTab === category.key 
                      ? 'border-red-500 bg-transparent' 
                      : 'border-transparent hover:bg-muted/60'
                  }`}
                  onClick={() => setActiveTab(category.key)}
                >
                  {category.label}
                </Button>
              ))}
            </div>

            {/* Phrases content - two columns with gap on mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {/* Positive phrases - Left side */}
              <div className="space-y-2">
                <Label className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                  <Smile className="h-5 w-5" />
                  {t('review.positivePhrases')}
                </Label>
                <div className="space-y-1">
                  {currentPhrases.positive.map((phrase: string, index: number) => {
                    const isSelected = isPhraseSelected(phrase, type, instructorIndex);
                    return (
                      <Button
                        key={`${currentCategory.key}-positive-${index}`}
                        type="button"
                        variant="outline"
                        size="sm"
                        className={cn(
                          "w-full text-left justify-start text-xs h-auto py-1.5 px-2.5 whitespace-normal transition-all",
                          isSelected 
                            ? "bg-green-100 text-green-700 border-green-300 hover:bg-green-200 hover:border-green-400 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700 dark:hover:bg-green-900/40" 
                            : "text-green-700 border-green-400 hover:bg-green-50 hover:text-green-700 hover:border-green-500 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/20 dark:hover:border-green-700"
                        )}
                        onClick={() => addPhraseToComment(phrase, type, instructorIndex)}
                      >
                        <span className="flex items-center gap-1.5">
                          {isSelected && <CheckCircle className="h-3 w-3 shrink-0" />}
                          {phrase}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Negative phrases - Right side */}
              <div className="space-y-2">
                <Label className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                  <Frown className="h-5 w-5" />
                  {t('review.negativePhrases')}
                </Label>
                <div className="space-y-1">
                  {currentPhrases.negative.map((phrase: string, index: number) => {
                    const isSelected = isPhraseSelected(phrase, type, instructorIndex);
                    return (
                      <Button
                        key={`${currentCategory.key}-negative-${index}`}
                        type="button"
                        variant="outline"
                        size="sm"
                        className={cn(
                          "w-full text-left justify-start text-xs h-auto py-1.5 px-2.5 whitespace-normal transition-all",
                          isSelected 
                            ? "bg-red-100 text-red-700 border-red-300 hover:bg-red-200 hover:border-red-400 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700 dark:hover:bg-red-900/40" 
                            : "text-red-600 border-red-200 hover:bg-red-50 hover:text-red-600 hover:border-red-300 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20 dark:hover:border-red-700"
                        )}
                        onClick={() => addPhraseToComment(phrase, type, instructorIndex)}
                      >
                        <span className="flex items-center gap-1.5">
                          {isSelected && <CheckCircle className="h-3 w-3 shrink-0" />}
                          {phrase}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Check if user is logged in
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <CardTitle>{t('review.loginRequired')}</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              {t('review.loginRequired')}
            </p>
            <div className="flex flex-col gap-3">
                          <Button onClick={() => {
              const courseCode = preselectedCourseCode || selectedCourse;
              navigate('/login', { 
                state: { 
                  from: location,
                  redirectTo: courseCode ? `/write-review/${courseCode}` : '/write-review',
                  context: 'writeReview'
                } 
              });
            }} className="w-full">
              {t('review.loginToWrite')}
            </Button>
              <Button variant="outline" onClick={() => {
                const courseCode = preselectedCourseCode || selectedCourse;
                if (courseCode) {
                  // If we have a specific course, go back to its detail page
                  navigate(`/courses/${courseCode}`);
                } else {
                  // Otherwise, go to courses catalog
                  navigate('/courses');
                }
              }} className="w-full">
                {(() => {
                  const courseCode = preselectedCourseCode || selectedCourse;
                  if (courseCode) {
                    return t('review.backToCourse', { courseCode });
                  } else {
                    return t('review.backToCourses');
                  }
                })()}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Populate form with review data for editing
  const populateFormWithReviewData = (reviewData: Review) => {
    setIsPopulatingEditData(true);
    
    // Set course and basic info
    setSelectedCourse(reviewData.course_code);
    setSelectedTerm(reviewData.term_code);
    
    // Set course evaluation
    setWorkload(reviewData.course_workload || 0);
    setDifficulty(reviewData.course_difficulties || 0);
    setUsefulness(reviewData.course_usefulness || 0);
    setGrade(reviewData.course_final_grade || '');
    setCourseComments(reviewData.course_comments || '');
    // Service learning is now handled per instructor, not at course level
    setIsAnonymous(reviewData.is_anon || false);
    setReviewLanguage(reviewData.review_language || 'en'); // Set review language from data or default to English
    
    // Store the instructor data for later use when instructors are loaded
    const instructorDataRef = { current: null as InstructorDetail[] | null };
    
    // Parse and set instructor evaluations if available
    if (reviewData.instructor_details) {
      try {
        const instructorDetails = JSON.parse(reviewData.instructor_details) as InstructorDetail[];
        instructorDataRef.current = instructorDetails;
        
        const evaluations: InstructorEvaluation[] = instructorDetails.map(detail => ({
          instructorName: detail.instructor_name,
          sessionType: detail.session_type,
          teachingScore: detail.teaching || 0,
          gradingScore: detail.grading || 0,
          comments: detail.comments || '',
          hasMidterm: detail.has_midterm || false,
          hasFinal: detail.has_final || false,
          hasQuiz: detail.has_quiz || false,
          hasGroupProject: detail.has_group_project || false,
          hasIndividualAssignment: detail.has_individual_assignment || false,
          hasPresentation: detail.has_presentation || false,
          hasReading: detail.has_reading || false,
          hasAttendanceRequirement: detail.has_attendance_requirement || false,
          // Provide defaults for service learning fields that may not exist in old data
          hasServiceLearning: detail.has_service_learning ?? false,
          serviceLearningType: detail.service_learning_type ?? 'compulsory',
          serviceLearningDescription: detail.service_learning_description ?? '',
        }));
        setInstructorEvaluations(evaluations);
        
        // Extract instructor keys for selection (format: instructorName|sessionType)
        const instructorKeys = instructorDetails.map(detail => `${detail.instructor_name}|${detail.session_type}`);
        setSelectedInstructors(instructorKeys);
      } catch (error) {
        console.error('Failed to parse instructor details:', error);
      }
    }
    
    // Don't turn off the flag automatically - let the instructor loading useEffect handle it
  };

  // Load review data for editing
  useEffect(() => {
    const loadEditData = async () => {
      if (!editReviewId || editingReview) return; // Prevent reloading if already loaded
      
      try {
        setLoadingEditData(true);
        const reviewData = await CourseService.getReviewById(editReviewId);
        if (reviewData) {
          setEditingReview(reviewData);
          populateFormWithReviewData(reviewData);
        } else {
          toast({
            title: t('myReviews.loadError'),
            description: 'Review not found',
            variant: 'destructive',
          });
          navigate('/my-reviews');
        }
      } catch (error) {
        console.error('Failed to load review for editing:', error);
        toast({
          title: t('myReviews.loadError'),
          description: 'Failed to load review data for editing',
          variant: 'destructive',
        });
        navigate('/my-reviews');
      } finally {
        setLoadingEditData(false);
      }
    };

    loadEditData();
  }, [editReviewId]); // Remove dependencies that could cause re-execution

  // Load courses on component mount
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setCoursesLoading(true);
        // 改用帶持久化快取的課程目錄（欄位為 getAllCourses 的超集、同樣依課程代碼排序），
        // 避免每次打開寫評價頁都重新讀取整批課程列
        const coursesData = await CourseService.getCoursesWithStats();
        setCourses(coursesData);
        
        // If preselected course code is provided, set it
        if (preselectedCourseCode) {
          // 🐛 FIX: Case-insensitive comparison for course codes
          const course = coursesData.find(c => c.course_code.toLowerCase() === preselectedCourseCode.toLowerCase());
          if (course) {
            setSelectedCourse(course.course_code);
          }
        }
      } catch (error) {
        console.error('Error loading courses:', error);
        toast({
          title: t('common.error'),
          description: t('review.loadingCourses'),
          variant: 'destructive',
        });
      } finally {
        setCoursesLoading(false);
      }
    };

    loadCourses();
  }, [preselectedCourseCode, t, toast]);

  // Handle instructor pre-selection from location state
  useEffect(() => {
    const locationState = location.state as { 
      preSelectedInstructor?: string; 
      originPage?: string; 
    } | null;
    
    if (locationState?.preSelectedInstructor && locationState?.originPage === 'instructor') {
      // Store the pre-selected instructor and origin page for later use when courses are loaded
      setPreSelectedInstructor(locationState.preSelectedInstructor);
      setOriginPage(locationState.originPage);
    }
  }, [location.state]);

  // Load instructor's courses when pre-selected instructor is set
  useEffect(() => {
    const loadInstructorCourses = async () => {
      if (!preSelectedInstructor) {
        setInstructorCourses([]);
        return;
      }

      try {
        const teachingRecords = await getCachedInstructorTeachingRecords(preSelectedInstructor);
        const uniqueCourseCodes = [...new Set(teachingRecords.map(record => record.course_code))];
        
        // Load full course details for each unique course code using batch loading
        const coursesMap = await batchLoadCourses(uniqueCourseCodes);
        const validCourses = Array.from(coursesMap.values());
        
        setInstructorCourses(validCourses);
      } catch (error) {
        console.error('Error loading instructor courses:', error);
        setInstructorCourses([]);
      }
    };

    loadInstructorCourses();
  }, [preSelectedInstructor, getCachedInstructorTeachingRecords, batchLoadCourses]);

  // Load terms when course is selected
  useEffect(() => {
    const loadTerms = async () => {
      if (!selectedCourse) {
        setTerms([]);
        if (!isPopulatingEditData) {
          setSelectedTerm(''); // Clear selected term when no course
          setSelectedInstructors([]); // Clear selected instructors when no course
        }
        return;
      }

      try {
        setTermsLoading(true);
        // Use cached teaching records to avoid redundant API calls
        const teachingRecords = await getCachedTeachingRecords(selectedCourse);
        const termCodes = [...new Set(teachingRecords.map(record => record.term_code))];
        
        // Batch load terms using cache
        const termsMap = await batchLoadTerms(termCodes);
        
        // 只允許評價過去的學期：排除當前及未來學期
        const validTerms = Array.from(termsMap.values()).filter(
          term => getTermStatus(term.term_code) === 'past'
        );
        const sortedTerms = validTerms.sort((a, b) => b.term_code.localeCompare(a.term_code));
        setTerms(sortedTerms);
        
        // Clear selected term and instructors when course changes (but not during edit data population)
        // Also don't clear if we're in edit mode and already have selections
        if (!isPopulatingEditData && (!editReviewId || (!selectedTerm && selectedInstructors.length === 0))) {
          // Auto-select term if there's only one option available
          if (sortedTerms.length === 1) {
            setSelectedTerm(sortedTerms[0].term_code);
          } else {
            setSelectedTerm('');
          }
          setSelectedInstructors([]);
        }
      } catch (error) {
        console.error('Error loading terms:', error);
        toast({
          title: t('common.error'),
          description: t('review.loadingTerms'),
          variant: 'destructive',
        });
      } finally {
        setTermsLoading(false);
      }
    };

    loadTerms();
  }, [selectedCourse, t, toast, isPopulatingEditData]);

  // Clear instructors when term changes
  useEffect(() => {
    if (!isPopulatingEditData && (!editReviewId || selectedInstructors.length === 0)) {
      setSelectedInstructors([]);
      setInstructorEvaluations([]); // Also clear instructor evaluations
    }
  }, [selectedTerm, isPopulatingEditData, editReviewId]);

  // Load instructors when course and term are selected
  useEffect(() => {
    const loadInstructors = async () => {
      if (!selectedCourse || !selectedTerm) {
        setAvailableInstructors([]);
        if (!isPopulatingEditData) {
          setSelectedInstructors([]); // Clear selected instructors when no course/term
          setInstructorEvaluations([]); // Also clear instructor evaluations
        }
        return;
      }

      try {
        setInstructorsLoading(true);
        // Use cached teaching records to avoid redundant API calls
        const teachingRecords = await getCachedTeachingRecords(selectedCourse);
        const filteredRecords = teachingRecords.filter(record => record.term_code === selectedTerm);
        setAvailableInstructors(filteredRecords);
        
        // Remove any selected instructors that are not available for this course/term combination
        // But preserve selected instructors during edit data population
        if (!isPopulatingEditData) {
          // 把已選的 key 對應到「原始教學記錄（場次）」的 key：
          // - 完全相符（含合併列 "A/B"）→ 保留
          // - 個別講師（如編輯舊評價時的 "A"）→ 映射到包含該講師的合併列 "A/B"
          // 無對應者則移除；最後去重，維持「每個 session_type 一個場次」。
          setSelectedInstructors(prev => {
            const remapped = prev.map(instructorKey => {
              const [name, session] = instructorKey.split('|');
              const exact = filteredRecords.find(r => r.instructor_name === name && r.session_type === session);
              if (exact) return instructorKey;
              const covering = filteredRecords.find(r => r.session_type === session && instructorNameMatches(r.instructor_name, name));
              return covering ? `${covering.instructor_name}|${covering.session_type}` : null;
            }).filter((k): k is string => k !== null);
            return Array.from(new Set(remapped));
          });
          
          // Auto-select pre-selected instructor if available
          if (preSelectedInstructor) {
            // 合併講師（"A / B"）以成員包含比對；每個 session_type 只挑一個選項，
            // 優先精確命中單獨開課的列，否則退而取含該講師的合併列。
            const matchingRecords = filteredRecords.filter(record =>
              instructorNameMatches(record.instructor_name, preSelectedInstructor)
            );
            if (matchingRecords.length > 0) {
              const keyBySession = new Map<string, string>();
              for (const record of matchingRecords) {
                const key = `${record.instructor_name}|${record.session_type}`;
                const isExact = record.instructor_name === preSelectedInstructor;
                if (!keyBySession.has(record.session_type) || isExact) {
                  keyBySession.set(record.session_type, key);
                }
              }
              const preSelectedKeys = Array.from(keyBySession.values());
              setSelectedInstructors(prev => {
                // 維持「每個 session_type 僅一個選項」：先移除這些 session_type 既有的選擇
                const sessionTypesToReplace = new Set(Array.from(keyBySession.keys()).map(s => `|${s}`));
                const kept = prev.filter(key => !Array.from(sessionTypesToReplace).some(suffix => key.endsWith(suffix)));
                return [...new Set([...kept, ...preSelectedKeys])];
              });
            }
          } else {
            // Auto-select instructor if there's only one available and no pre-selection
            if (filteredRecords.length === 1) {
              const autoSelectKey = `${filteredRecords[0].instructor_name}|${filteredRecords[0].session_type}`;
              setSelectedInstructors([autoSelectKey]);
            }
          }
        } else {
          // In edit mode, validate that instructors are available
          // Don't turn off the flag here - let it be handled after evaluations are set
        }
      } catch (error) {
        console.error('Error loading instructors:', error);
        toast({
          title: t('common.error'),
          description: t('review.loadingInstructors'),
          variant: 'destructive',
        });
      } finally {
        setInstructorsLoading(false);
      }
    };

    loadInstructors();
  }, [selectedCourse, selectedTerm, t, toast, isPopulatingEditData]);

  // Update instructor evaluations when selected instructors change
  useEffect(() => {
    // Don't update evaluations during edit data population to preserve existing data
    if (isPopulatingEditData) return;
    
    // Don't override evaluations if we already have evaluations for the selected instructors
    // This prevents overriding edit data that was already loaded
    const hasExistingEvaluations = selectedInstructors.length > 0 && 
      selectedInstructors.every(instructorKey => {
        const [instructorName, sessionType] = instructorKey.split('|');
        return instructorEvaluations.some(
          evaluation => evaluation.instructorName === instructorName && evaluation.sessionType === sessionType
        );
      });
    
    if (hasExistingEvaluations && editReviewId) {
      console.log('🔒 Preserving existing evaluations for edit mode');
      return;
    }
    
    // 合併講師選項（"A / B"）在評分階段拆成個別講師，各自獨立評分／留言並分別存成一筆 instructor_detail。
    const newEvaluations: InstructorEvaluation[] = selectedInstructors.flatMap(instructorKey => {
      const [rawName, sessionType] = instructorKey.split('|');
      return splitInstructorNames(rawName).map(instructorName => {
      const existing = instructorEvaluations.find(
        evaluation => evaluation.instructorName === instructorName && evaluation.sessionType === sessionType
      );

      return existing || {
        instructorName,
        sessionType,
        teachingScore: null,
        gradingScore: null,
        comments: '',
        hasMidterm: false,
        hasFinal: false,
        hasQuiz: false,
        hasGroupProject: false,
        hasIndividualAssignment: false,
        hasPresentation: false,
        hasReading: false,
        hasAttendanceRequirement: false,
        hasServiceLearning: false,
        serviceLearningType: 'compulsory',
        serviceLearningDescription: '',
      };
      });
    });

    // Only update if the evaluations have actually changed
    const hasChanges = newEvaluations.length !== instructorEvaluations.length ||
      newEvaluations.some((newEval, index) => {
        const oldEval = instructorEvaluations[index];
        return !oldEval || 
          newEval.instructorName !== oldEval.instructorName ||
          newEval.sessionType !== oldEval.sessionType;
      });
    
    if (hasChanges) {
      setInstructorEvaluations(newEvaluations);
    }
  }, [selectedInstructors, isPopulatingEditData, editReviewId]);

  // Turn off edit mode flag after instructor evaluations are properly set
  useEffect(() => {
    if (isPopulatingEditData && selectedInstructors.length > 0 && instructorEvaluations.length > 0) {
      // Ensure all selected instructors have corresponding evaluations
      const allInstructorsHaveEvaluations = selectedInstructors.every(instructorKey => {
        const [instructorName, sessionType] = instructorKey.split('|');
        return instructorEvaluations.some(
          evaluation => evaluation.instructorName === instructorName && evaluation.sessionType === sessionType
        );
      });
      
      if (allInstructorsHaveEvaluations) {
        setTimeout(() => {
          setIsPopulatingEditData(false);
        }, 100);
      }
    }
  }, [isPopulatingEditData, selectedInstructors, instructorEvaluations]);

  // Track when user enters preview step to set timestamp
  useEffect(() => {
    const steps = (() => {
      // This is a simplified check - we need to determine if current step is preview
      // The preview step is typically the last step
      const totalPossibleSteps = 3 + selectedInstructors.length + 1; // base + instructors + settings + preview
      if (currentStep === totalPossibleSteps) {
        // User entered preview step
        if (!previewTimestamp) {
          setPreviewTimestamp(new Date().toISOString());
        }
      }
    })();
  }, [currentStep, selectedInstructors.length, previewTimestamp]);

  // Dynamically set the default tab based on available instructor types
  useEffect(() => {
    if (availableInstructors.length > 0) {
      const lectureInstructors = availableInstructors.filter(record => record.session_type === 'Lecture');
      const tutorialInstructors = availableInstructors.filter(record => record.session_type === 'Tutorial');
      
      const hasLectureInstructors = lectureInstructors.length > 0;
      const hasTutorialInstructors = tutorialInstructors.length > 0;
      
      // Set appropriate default tab based on availability
      if (hasLectureInstructors && !hasTutorialInstructors) {
        setActiveInstructorTab('Lecture');
      } else if (!hasLectureInstructors && hasTutorialInstructors) {
        setActiveInstructorTab('Tutorial');
      } else if (hasLectureInstructors && hasTutorialInstructors) {
        // Both available, keep current tab if valid, otherwise default to Lecture
        if (activeInstructorTab !== 'Lecture' && activeInstructorTab !== 'Tutorial') {
          setActiveInstructorTab('Lecture');
        }
      }
    }
  }, [availableInstructors, activeInstructorTab]);

  // Auto-fill service learning data after edit mode population is complete
  useEffect(() => {
    // Only run this effect for edit mode after initial data population is complete
    if (!editReviewId || isPopulatingEditData || !selectedCourse || !selectedTerm || 
        selectedInstructors.length === 0 || instructorEvaluations.length === 0 || 
        availableInstructors.length === 0) {
      return;
    }

    console.log('🔄 Running service learning autofill for edit mode...');

    // Update instructor evaluations with current service learning data from teaching records
    const updatedEvaluations = instructorEvaluations.map(evaluation => {
      const teachingRecord = availableInstructors.find(
        record => instructorNameMatches(record.instructor_name, evaluation.instructorName) &&
                 record.session_type === evaluation.sessionType
      );
      
      if (teachingRecord?.service_learning) {
        // Always update to match current teaching records (even in edit mode)
        // But preserve the existing service learning description in edit mode
        return {
          ...evaluation,
          hasServiceLearning: true,
          serviceLearningType: teachingRecord.service_learning as 'compulsory' | 'optional',
          serviceLearningDescription: evaluation.serviceLearningDescription // Explicitly preserve existing description
        };
      } else {
        // No service learning for this instructor according to current teaching records
        // In edit mode, preserve existing service learning data if user had entered it
        // (teaching records might have changed since the review was written)
        if (evaluation.hasServiceLearning && evaluation.serviceLearningDescription) {
          // Keep existing service learning data from the review
          return {
            ...evaluation,
            hasServiceLearning: true, // Keep it enabled if user had data
            serviceLearningType: evaluation.serviceLearningType // Keep existing type
            // serviceLearningDescription is preserved by spread operator
          };
        } else {
          // No existing service learning data, so disable it
          return {
            ...evaluation,
            hasServiceLearning: false,
            serviceLearningType: 'compulsory' as const,
            serviceLearningDescription: '' // Clear description if no service learning
          };
        }
      }
    });

    // Check if there are any changes needed
    const hasChanges = updatedEvaluations.some((updatedEval, index) => {
      const currentEval = instructorEvaluations[index];
      return (
        updatedEval.hasServiceLearning !== currentEval.hasServiceLearning ||
        updatedEval.serviceLearningType !== currentEval.serviceLearningType ||
        (updatedEval.serviceLearningDescription !== currentEval.serviceLearningDescription)
      );
    });

    if (hasChanges) {
      console.log('✅ Updating service learning autofill data for edit mode');
      setInstructorEvaluations(updatedEvaluations);
    } else {
      console.log('ℹ️ No service learning updates needed for edit mode');
    }
  }, [editReviewId, isPopulatingEditData, selectedCourse, selectedTerm, selectedInstructors, availableInstructors, instructorEvaluations]);

  // Auto-set service learning status for each instructor based on teaching records
  useEffect(() => {
    // Don't update during edit data population to preserve existing data
    if (isPopulatingEditData) return;
    
    // Skip this autofill entirely for edit mode - let the edit-specific useEffect handle it
    if (editReviewId) return;
    
    if (!selectedCourse || !selectedTerm || selectedInstructors.length === 0 || instructorEvaluations.length === 0) {
      return;
    }

    // Update instructor evaluations with service learning data from teaching records
    const updatedEvaluations = instructorEvaluations.map(evaluation => {
      const teachingRecord = availableInstructors.find(
        record => instructorNameMatches(record.instructor_name, evaluation.instructorName) &&
                 record.session_type === evaluation.sessionType
      );
      
      if (teachingRecord?.service_learning) {
        // Only update if not already set correctly (to avoid overriding edit data)
        if (!evaluation.hasServiceLearning || evaluation.serviceLearningType !== teachingRecord.service_learning) {
          return {
            ...evaluation,
            hasServiceLearning: true,
            serviceLearningType: teachingRecord.service_learning as 'compulsory' | 'optional'
          };
        }
      } else {
        // No service learning for this instructor
        if (evaluation.hasServiceLearning) {
          return {
            ...evaluation,
            hasServiceLearning: false,
            serviceLearningType: 'compulsory' as const,
            serviceLearningDescription: ''
          };
        }
      }
      
      return evaluation; // No changes needed
    });

    // Only update if there are actual changes
    const hasChanges = updatedEvaluations.some((updatedEval, index) => {
      const currentEval = instructorEvaluations[index];
      return updatedEval !== currentEval;
    });

    if (hasChanges) {
      setInstructorEvaluations(updatedEvaluations);
    }
  }, [selectedInstructors, availableInstructors, selectedCourse, selectedTerm, isPopulatingEditData, instructorEvaluations]);

  // Check review eligibility when course changes (only for new reviews, not edits)
  useEffect(() => {
    const checkReviewEligibility = async () => {
      // Skip eligibility check for edit mode
      if (isEditMode || !user?.$id || !selectedCourse) {
        setReviewEligibility(null);
        return;
      }

      setCheckingEligibility(true);
      try {
        const eligibility = await CourseService.canUserSubmitReview(user.$id, selectedCourse, selectedTerm);
        setReviewEligibility(eligibility);
      } catch (error) {
        console.error('Error checking review eligibility:', error);
        // Default to allowing submission if check fails
        setReviewEligibility({
          canSubmit: true,
          existingReviews: []
        });
      } finally {
        setCheckingEligibility(false);
      }
    };

    checkReviewEligibility();
  }, [selectedCourse, user?.$id, isEditMode]);

  // Load instructor information for preview display
  useEffect(() => {
    const fetchInstructorsInfo = async () => {
      // 合併講師（"A / B"）需載入每位個別講師檔案以正確在地化顯示；
      // 同時載入可選清單（availableInstructors）的講師，讓未選取的選項也能在地化。
      const rawNames = [
        ...instructorEvaluations.map(evaluation => evaluation.instructorName),
        ...availableInstructors.map(record => record.instructor_name),
      ];
      const instructorNames = Array.from(new Set(
        rawNames.flatMap(name => splitInstructorNames(name))
      ));
      if (instructorNames.length === 0) return;

      try {
        // Use batch loading for better performance
        const instructorsMap = await batchLoadInstructors(instructorNames);
        setInstructorsMap(instructorsMap);
      } catch (error) {
        console.warn('Failed to batch load instructors:', error);
      }
    };

    fetchInstructorsInfo();
  }, [instructorEvaluations, availableInstructors, batchLoadInstructors]);

  // 顯示（可能為合併格式的）講師姓名：把 "A / B" 拆成個別講師、各自在地化後以 " / " 串接。
  // 單一講師時行為與原本一致。找不到檔案時以原字串顯示。
  const renderCombinedInstructorName = useCallback((
    rawName: string,
    opts?: { primaryClassName?: string; secondaryClassName?: string; wrapperClassName?: string }
  ) => {
    const parts = splitInstructorNames(rawName);
    const primaries: string[] = [];
    const secondaries: string[] = [];
    for (const part of parts) {
      const fullInstructor = instructorsMap.get(part);
      if (fullInstructor) {
        const nameInfo = getInstructorName(fullInstructor, language);
        primaries.push(nameInfo.primary);
        if (nameInfo.secondary) secondaries.push(nameInfo.secondary);
      } else {
        primaries.push(part);
      }
    }
    return (
      <div className={opts?.wrapperClassName}>
        <div className={opts?.primaryClassName}>{primaries.join(' / ')}</div>
        {secondaries.length > 0 && (
          <div className={opts?.secondaryClassName ?? 'text-sm text-muted-foreground'}>
            {secondaries.join(' / ')}
          </div>
        )}
      </div>
    );
  }, [instructorsMap, language]);

  const handleInstructorToggle = useCallback((instructorKey: string) => {
    const [instructorName, sessionType] = instructorKey.split('|');
    const sessionSuffix = `|${sessionType}`;
    // 是否為「從講師頁進入時鎖定的預選講師」所屬選項（合併列以成員包含比對）
    const isPreSelectedKey = (key: string) =>
      originPage === 'instructor' && !!preSelectedInstructor &&
      instructorNameMatches(key.split('|')[0], preSelectedInstructor);

    setSelectedInstructors(prev => {
      if (prev.includes(instructorKey)) {
        // 預選講師所屬選項不可取消
        if (isPreSelectedKey(instructorKey)) {
          toast({
            title: t('common.error'),
            description: t('review.cannotDeselectPreSelectedInstructor', { instructor: preSelectedInstructor }),
            variant: 'destructive',
          });
          return prev; // Don't allow deselection
        }
        // Removing instructor
        return prev.filter(key => key !== instructorKey);
      } else {
        // 每個 session_type 只能選一個選項（場次）：A、B、A/B 為三個獨立選項，僅能擇一。
        // 選新的會取代同類型的舊選擇（單選行為）。
        const sameTypeSelected = prev.filter(key => key.endsWith(sessionSuffix));
        // 若同類型已選的是被鎖定的預選講師選項，不可切換掉
        if (sameTypeSelected.some(isPreSelectedKey)) {
          toast({
            title: t('common.error'),
            description: t('review.cannotDeselectPreSelectedInstructor', { instructor: preSelectedInstructor }),
            variant: 'destructive',
          });
          return prev;
        }
        return [...prev.filter(key => !key.endsWith(sessionSuffix)), instructorKey];
      }
    });
  }, [originPage, preSelectedInstructor, toast, t]);

  const validateForm = useCallback(async (): Promise<boolean> => {
    // 檢查基本選擇
    if (!selectedCourse || !selectedTerm || selectedInstructors.length === 0) {
      toast({
        title: t('common.error'),
        description: t('review.fillAllFields'),
        variant: 'destructive',
      });
      return false;
    }

    // 檢查從講師頁面進入時預選講師必須被選中（合併列以成員包含比對）
    if (originPage === 'instructor' && preSelectedInstructor) {
      const preSelectedInstructorIncluded = selectedInstructors.some(instructorKey =>
        instructorNameMatches(instructorKey.split('|')[0], preSelectedInstructor)
      );
      if (!preSelectedInstructorIncluded) {
        toast({
          title: t('common.error'),
          description: t('review.preSelectedInstructorRequired', { instructor: preSelectedInstructor }),
          variant: 'destructive',
        });
        return false;
      }
    }

    // Check review eligibility (only for new reviews, not edits)
    if (!isEditMode && reviewEligibility && !reviewEligibility.canSubmit) {
      let errorMessage = t('review.submitLimitReached');
      
      switch (reviewEligibility.reason) {
        case 'review.termLimitExceeded':
          errorMessage = t('review.termLimitExceeded');
          break;
        case 'review.limitExceeded':
          errorMessage = t('review.limitExceeded');
          break;
        case 'review.limitReachedWithPass':
          errorMessage = t('review.limitReachedWithPass');
          break;
        default:
          errorMessage = t('review.submitLimitReached');
      }
      
      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    }

    // 檢查課程評分（null 表示未選擇，0 表示0星，-1 表示 N/A，都需要選擇）
    if (workload === null || difficulty === null || usefulness === null) {
      toast({
        title: t('common.error'),
        description: t('review.fillAllFields'),
        variant: 'destructive',
      });
      return false;
    }

    // 檢查成績
    if (!grade.trim()) {
      toast({
        title: t('common.error'),
        description: t('review.fillAllFields'),
        variant: 'destructive',
      });
      return false;
    }

    // 檢查課程評論（現在必填）
    if (!courseComments.trim()) {
      toast({
        title: t('common.error'),
        description: t('review.fillAllFields'),
        variant: 'destructive',
      });
      return false;
    }

    // 檢查課程評論字數
    const courseCommentsValidation = validateWordCount(courseComments, 5, 1000);
    if (!courseCommentsValidation.isValid) {
      toast({
        title: t('common.error'),
        description: t('review.wordCount.courseCommentsRequired'),
        variant: 'destructive',
      });
      return false;
    }

    // 檢查講師評分（null 表示未選擇，0 表示0星，-1 表示 N/A，都需要選擇）
    for (const evaluation of instructorEvaluations) {
      if (evaluation.teachingScore === null) {
        toast({
          title: t('common.error'),
          description: t('review.fillAllFields'),
          variant: 'destructive',
        });
        return false;
      }
      
      // 檢查評分滿意度（現在必填）
      if (evaluation.gradingScore === null) {
        toast({
          title: t('common.error'),
          description: t('review.fillAllFields'),
          variant: 'destructive',
        });
        return false;
      }
      
      // 檢查課程要求（至少需要選擇一個）
      const hasAnyRequirement = evaluation.hasMidterm || evaluation.hasFinal || evaluation.hasQuiz || 
        evaluation.hasGroupProject || evaluation.hasIndividualAssignment || evaluation.hasPresentation || 
        evaluation.hasReading || evaluation.hasAttendanceRequirement;
      
      if (!hasAnyRequirement) {
        toast({
          title: t('common.error'),
          description: t('review.courseRequirementsRequired'),
          variant: 'destructive',
        });
        return false;
      }
      
      // 檢查講師評論（現在必填）
      if (!evaluation.comments.trim()) {
        toast({
          title: t('common.error'),
          description: t('review.fillAllFields'),
          variant: 'destructive',
        });
        return false;
      }

      // 檢查講師評論字數
      const instructorCommentsValidation = validateWordCount(evaluation.comments, 5, 1000);
      if (!instructorCommentsValidation.isValid) {
        toast({
          title: t('common.error'),
          description: t('review.wordCount.instructorCommentsRequired'),
          variant: 'destructive',
        });
        return false;
      }
    }

    // 檢查每個講師的服務學習描述
    for (const evaluation of instructorEvaluations) {
      if (evaluation.hasServiceLearning) {
        // 必修服務學習必須填寫描述
        if (evaluation.serviceLearningType === 'compulsory' && !evaluation.serviceLearningDescription.trim()) {
          toast({
            title: t('common.error'),
            description: t('review.fillAllFields'),
            variant: 'destructive',
          });
          return false;
        }
        
        // 如果有填寫服務學習描述，檢查字數
        if (evaluation.serviceLearningDescription.trim()) {
          const minWords = evaluation.serviceLearningType === 'compulsory' ? 5 : 0;
          const serviceLearningValidation = validateWordCount(evaluation.serviceLearningDescription, minWords, 1000);
          if (!serviceLearningValidation.isValid) {
            toast({
              title: t('common.error'),
              description: evaluation.serviceLearningType === 'compulsory' 
                ? t('review.wordCount.serviceLearningRequired')
                : t('review.wordCount.serviceLearningOptional'),
              variant: 'destructive',
            });
            return false;
          }
        }
      }
    }

    // Validate that selected instructors actually taught the course in the selected term
    try {
      // Use cached teaching records to avoid redundant API calls
      const teachingRecords = await getCachedTeachingRecords(selectedCourse);
      const validRecords = teachingRecords.filter(record => record.term_code === selectedTerm);
      
      for (const instructorKey of selectedInstructors) {
        const [instructorName, sessionType] = instructorKey.split('|');
        const isValidInstructor = validRecords.some(record => 
          record.instructor_name === instructorName && record.session_type === sessionType
        );
        
        if (!isValidInstructor) {
          toast({
            title: t('common.error'),
            description: t('review.invalidInstructorSelection', { 
              instructor: instructorName, 
              session: sessionType,
              term: selectedTerm 
            }),
            variant: 'destructive',
          });
          return false;
        }
      }
    } catch (error) {
      console.error('Error validating instructor selection:', error);
      toast({
        title: t('common.error'),
        description: t('review.validationError'),
        variant: 'destructive',
      });
      return false;
    }

    return true;
  }, [selectedCourse, selectedTerm, selectedInstructors, availableInstructors, originPage, preSelectedInstructor, isEditMode, reviewEligibility, workload, difficulty, usefulness, grade, courseComments, instructorEvaluations, toast, t]);

  const handleSubmit = useCallback(async () => {
    console.log('🚀 handleSubmit called');
    
    if (!(await validateForm())) {
      console.log('❌ Form validation failed');
      return;
    }
    
    console.log('✅ Form validation passed');

    try {
      setSubmitting(true);

      const instructorDetails: InstructorDetail[] = instructorEvaluations.map(evaluation => ({
        instructor_name: evaluation.instructorName,
        session_type: evaluation.sessionType,
        grading: evaluation.gradingScore === null ? null : evaluation.gradingScore,
        teaching: evaluation.teachingScore,
        has_midterm: evaluation.hasMidterm,
        has_final: evaluation.hasFinal,
        has_quiz: evaluation.hasQuiz,
        has_group_project: evaluation.hasGroupProject,
        has_individual_assignment: evaluation.hasIndividualAssignment,
        has_presentation: evaluation.hasPresentation,
        has_reading: evaluation.hasReading,
        has_attendance_requirement: evaluation.hasAttendanceRequirement,
        has_service_learning: evaluation.hasServiceLearning,
        service_learning_type: evaluation.serviceLearningType,
        service_learning_description: evaluation.serviceLearningDescription,
        comments: evaluation.comments,
      }));

      const reviewData = {
        user_id: user.$id,
        is_anon: isAnonymous,
        username: user.name || 'Anonymous',
        course_code: selectedCourse,
        term_code: selectedTerm,
        course_workload: workload,
        course_difficulties: difficulty,
        course_usefulness: usefulness,
        course_final_grade: grade,
        course_comments: courseComments,
        submitted_at: new Date().toISOString(),
        instructor_details: JSON.stringify(instructorDetails),
        review_language: reviewLanguage,
      };

      console.log('📋 Review data prepared:', reviewData);

      if (isEditMode && editReviewId) {
        console.log('✏️ Updating existing review...');
        
        // Validation: Prevent editing first review grade from F to non-F when user has 2 reviews
        if (editingReview && user?.$id) {
          const originalGrade = editingReview.course_final_grade;
          const newGrade = reviewData.course_final_grade;
          
          // Check if we're changing from a fail grade (which is what unlocked
          // the 2nd review) to a non-fail grade. Uses the shared rule so it
          // stays in sync with CourseService.canUserSubmitReview.
          if (isReviewRetryFailGrade(originalGrade) && newGrade && !isReviewRetryFailGrade(newGrade)) {
            try {
              // Get all user's reviews for this course to check if they have 2 reviews
              const allUserReviews = await CourseService.canUserSubmitReview(user.$id, selectedCourse, selectedTerm);
              
              if (allUserReviews.existingReviews.length >= 2) {
                // Sort reviews by creation date to identify the first review
                const sortedReviews = allUserReviews.existingReviews.sort((a, b) => 
                  new Date(a.$createdAt).getTime() - new Date(b.$createdAt).getTime()
                );
                
                // Check if the review being edited is the first review
                const isFirstReview = sortedReviews[0].$id === editReviewId;
                
                if (isFirstReview) {
                  // Prevent the edit and show error
                  toast({
                    title: t('review.cannotEditGradeTitle'),
                    description: t('review.cannotEditGradeMessage'),
                    variant: 'destructive',
                  });
                  return; // Exit the function without updating
                }
              }
            } catch (error) {
              console.error('Error checking review eligibility for edit validation:', error);
              // If there's an error checking, allow the edit to proceed
            }
          }
        }
        
        // Update existing review
        await CourseService.updateReview(editReviewId, reviewData);
        toast({
          title: t('common.success'),
          description: t('review.updateSuccess'),
        });
        // Navigate back to my reviews page
        navigate('/my-reviews');
      } else {
        console.log('📝 Creating new review...');
        // Create new review
        const result = await CourseService.createReview(reviewData);
        console.log('✅ Review created successfully:', result);
        toast({
          title: t('common.success'),
          description: t('review.submitSuccess'),
        });
        // Navigate back to course detail page
        navigate(`/courses/${selectedCourse}`);
      }
      return true;
    } catch (error) {
      console.error('❌ Error submitting review:', error);
      toast({
        title: t('common.error'),
        description: t('review.submitError'),
        variant: 'destructive',
      });
      return false;
    } finally {
      console.log('🏁 Setting submitting to false');
      setSubmitting(false);
    }
  }, [validateForm, user, isAnonymous, selectedCourse, selectedTerm, workload, difficulty, usefulness, grade, courseComments, instructorEvaluations, reviewLanguage, isEditMode, editReviewId, toast, t, navigate]);

  const [showMainExitConfirm, setShowMainExitConfirm] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Handle exit for main review form
  const handleMainExit = () => {
    setShowMainExitConfirm(true);
  };

  // Handle submit confirmation
  const handleSubmitClick = () => {
    setShowSubmitConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      const success = await handleSubmit();
      setShowSubmitConfirm(false);
      // Only show celebration effect after a genuinely successful submission
      if (success) {
        setShowCelebration(true);
        // Hide celebration after 2.5 seconds
        setTimeout(() => {
          setShowCelebration(false);
        }, 2500);
      }
    } catch (error) {
      // If submission fails, just close the dialog
      setShowSubmitConfirm(false);
    }
  };

  const handleConfirmMainExit = () => {
    // When editing an existing review, always return to the My Reviews page
    if (isEditMode) {
      navigate('/my-reviews');
      return;
    }
    // Navigate to origin page based on originPage state
    if (originPage === 'instructor' && preSelectedInstructor) {
      // Go back to instructor page
      navigate(`/instructors/${encodeURIComponent(preSelectedInstructor)}`);
    } else if (selectedCourse) {
      // Go back to course page
      navigate(`/courses/${selectedCourse}`);
    } else {
      // Fallback to courses list
      navigate('/courses');
    }
  };


  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold flex-1">
            {isEditMode ? t('review.editTitle') : t('review.title')}
          </h1>
          
          {/* Exit button */}
          <Button
            variant="outline"
            onClick={handleMainExit}
            className="shrink-0 hover:bg-primary/10 hover:text-primary flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            <span className="hidden md:inline">{t('review.exit')}</span>
          </Button>
        </div>
        
        <p className="text-muted-foreground">
          {isEditMode ? t('review.editSubtitle') : t('review.subtitle')}
        </p>
      </div>

      {/* Progress Bar Form */}
      <ProgressBarForm
        steps={(() => {
          const baseSteps = [
            {
              id: 'course-selection',
              title: t('review.courseInfo'),
              icon: <BookText className="h-5 w-5" />,
              isValid: validateCourseSelectionStep,
              content: (
              <div className="space-y-3">
                {/* Course Selection - Desktop: inline, Mobile: stacked */}
                <div className="space-y-2 md:space-y-0">
                  <div className="md:flex md:items-center md:gap-4">
                    <Label htmlFor="course" className="md:min-w-[120px] md:flex-shrink-0 font-bold">
                      {t('review.selectCourse')} <span className="text-red-500">*</span>
                    </Label>
                    <Select 
                      value={selectedCourse} 
                      onValueChange={setSelectedCourse} 
                      disabled={coursesLoading || !!preselectedCourseCode}
                    >
                      <SelectTrigger className="md:flex-1">
                        <SelectValue placeholder={coursesLoading ? t('review.loadingCourses') : t('review.selectCoursePlaceholder')}><div className="w-full overflow-hidden"><div className="truncate">{selectedCourse ? courses?.find(c => c.course_code.toLowerCase() === selectedCourse.toLowerCase())?.course_code + " - " + courses?.find(c => c.course_code.toLowerCase() === selectedCourse.toLowerCase())?.course_title : (coursesLoading ? t("review.loadingCourses") : t("review.selectCoursePlaceholder"))}</div></div></SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {(filteredCourses || []).map((course) => (
                          <SelectItem key={course.$id} value={course.course_code}>
                            <span className="font-medium">{course.course_code} - {course.course_title}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Term Selection - Desktop: inline, Mobile: stacked */}
                <div className="space-y-2 md:space-y-0">
                  <div className="md:flex md:items-center md:gap-4">
                    <Label htmlFor="term" className="md:min-w-[120px] md:flex-shrink-0 font-bold">
                      {t('review.selectTerm')} <span className="text-red-500">*</span>
                    </Label>
                    <Select value={selectedTerm} onValueChange={setSelectedTerm} disabled={!selectedCourse || termsLoading}>
                      <SelectTrigger className="md:flex-1">
                        <SelectValue placeholder={termsLoading ? t('review.loadingTerms') : t('review.selectTermPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {(terms || []).map((term) => (
                          <SelectItem key={term.$id} value={term.term_code}>
                            <span className="font-medium">{term.name || term.term_code}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Instructor Selection - Desktop: inline, Mobile: stacked */}
                <div className="space-y-2 md:space-y-0">
                  <div className="md:flex md:items-start md:gap-4">
                    <Label className="md:min-w-[120px] md:flex-shrink-0 md:pt-2 font-bold">
                      {t('review.selectInstructor')} <span className="text-red-500">*</span>
                    </Label>
                    <div className="md:flex-1">
                      {(!selectedCourse || !selectedTerm) ? (
                        <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-md">
                          {t('review.selectCourseAndTermFirst')}
                        </div>
                      ) : instructorsLoading ? (
                        <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-md">
                          {t('review.loadingInstructors')}
                        </div>
                      ) : availableInstructors.length === 0 ? (
                        <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-md">
                          {t('review.noInstructorsFound')}
                        </div>
                      ) : (() => {
                        const lectureInstructors = (availableInstructors || []).filter(record => record.session_type === 'Lecture');
                        const tutorialInstructors = (availableInstructors || []).filter(record => record.session_type === 'Tutorial');
                        const hasLectureInstructors = lectureInstructors.length > 0;
                        const hasTutorialInstructors = tutorialInstructors.length > 0;
                        
                        // Helper function to render instructor list
                        const renderInstructorList = (instructors: TeachingRecord[]) => {
                          return (
                            <div className="space-y-2">
                              {instructors.map((record, index) => {
                                const instructorKey = `${record.instructor_name}|${record.session_type}`;
                                const isSelected = selectedInstructors.includes(instructorKey);
                                // 從講師頁面進入時的預選講師不可取消；其餘皆可自由複選
                                const isLocked = originPage === 'instructor' && preSelectedInstructor &&
                                                 instructorKey.startsWith(preSelectedInstructor + '|') && isSelected;

                                return (
                                  <label
                                    key={index}
                                    className={cn(
                                      "flex items-center space-x-3 p-3 rounded-md transition-colors",
                                      isLocked ? "cursor-default" : "cursor-pointer",
                                      isSelected
                                        ? "bg-primary/10 border-primary/20"
                                        : "hover:bg-accent"
                                    )}
                                  >
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={() => handleInstructorToggle(instructorKey)}
                                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                      disabled={isLocked}
                                    />
                                    <div className="flex-1">
                                      <div className="font-medium">
                                        {renderCombinedInstructorName(record.instructor_name)}
                                      </div>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          );
                        };
                        
                        // If both types have instructors, show tabs
                        if (hasLectureInstructors && hasTutorialInstructors) {
                          return (
                            <div className="border border-black dark:border-border rounded-md px-3 py-2">
                              <Tabs value={activeInstructorTab} onValueChange={setActiveInstructorTab}>
                                <TabsList className="grid w-full grid-cols-2">
                                  <TabsTrigger value="Lecture">
                                    {t('review.lectureInstructors')}
                                  </TabsTrigger>
                                  <TabsTrigger value="Tutorial">
                                    {t('review.tutorialInstructors')}
                                  </TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="Lecture" className="space-y-2 mt-2">
                                  {renderInstructorList(lectureInstructors)}
                                </TabsContent>
                                
                                <TabsContent value="Tutorial" className="space-y-2 mt-2">
                                  {renderInstructorList(tutorialInstructors)}
                                </TabsContent>
                              </Tabs>
                            </div>
                          );
                        }
                        
                        // If only one type has instructors, show without tabs
                        if (hasLectureInstructors || hasTutorialInstructors) {
                          const instructorsToShow = hasLectureInstructors ? lectureInstructors : tutorialInstructors;
                          const sectionTitle = hasLectureInstructors ? t('review.lectureInstructors') : t('review.tutorialInstructors');
                          
                          return (
                            <div className="border border-black dark:border-border rounded-md px-3 py-2">
                              <div className="mb-2">
                                <h4 className="text-sm font-medium text-muted-foreground">{sectionTitle}</h4>
                              </div>
                              {renderInstructorList(instructorsToShow)}
                            </div>
                          );
                        }
                        
                        return null;
                      })()}
                    </div>
                  </div>
                </div>

                {/* Review Eligibility Warning */}
                {!isEditMode && reviewEligibility && !reviewEligibility.canSubmit && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg space-y-3">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-destructive">
                          {reviewEligibility.reason === 'review.termLimitExceeded' ? t('review.termLimitExceeded') :
                           reviewEligibility.reason === 'review.limitExceeded' ? t('review.limitExceeded') : 
                           reviewEligibility.reason === 'review.limitReachedWithPass' ? t('review.limitReachedWithPass') : 
                           t('review.submitLimitReached')}
                        </p>
                      </div>
                    </div>
                    
                    {/* Past Reviews */}
                    {reviewEligibility.existingReviews.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-destructive/80">{t('review.yourPastReviews')}:</p>
                        <div className="flex flex-wrap gap-2">
                          {reviewEligibility.existingReviews.map((review) => (
                            <button
                              key={review.$id}
                              onClick={() => navigate(`/courses/${selectedCourse}?review_id=${review.$id}`)}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-background/80 border border-destructive/30 rounded-md text-sm hover:bg-background hover:border-destructive/50 transition-colors"
                            >
                              <div className="flex-shrink-0">
                                <GradeBadge 
                                  grade={review.course_final_grade || 'N/A'} 
                                  size="sm" 
                                  showTooltip={false}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {formatDateTimeUTC8(review.$createdAt)}
                              </span>
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          },
          {
            id: 'course-review',
            title: t('review.courseReview'),
            icon: <Star className="h-5 w-5" />,
            isValid: validateCourseReviewStep,
            content: (
              <div className="space-y-4">
                {/* Course Information */}
                {selectedCourse && (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-lg">
                        <div className="font-bold text-primary">{selectedCourse}</div>
                        <div className="text-sm text-primary font-normal">
                          {courses?.find(c => c.course_code.toLowerCase() === selectedCourse.toLowerCase())?.course_title}
                        </div>
                        {(language === 'zh-TW' || language === 'zh-CN') && (() => {
                          // 🐛 FIX: Case-insensitive comparison for course codes
                          const selectedCourseData = courses?.find(c => c.course_code.toLowerCase() === selectedCourse.toLowerCase());
                          const chineseName = language === 'zh-TW' ? selectedCourseData?.course_title_tc : selectedCourseData?.course_title_sc;
                          return chineseName && (
                            <div className="text-sm text-primary font-normal mt-0.5">
                              {chineseName}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    
                    {/* Badges on the right */}
                    <div className="flex items-center gap-3 shrink-0">
                      {/* Grade Badge */}
                      {grade && grade !== '-1' && (
                        <div className="flex items-center">
                          <GradeBadge 
                            grade={grade}
                            size="md"
                            showTooltip={true}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Workload Rating */}
                <div className="space-y-1">
                  <FormStarRating rating={workload} onRatingChange={setWorkload} label={t('review.workload')} type="workload" t={t} required />
                </div>

                {/* Difficulty Rating */}
                <div className="space-y-1">
                  <FormStarRating rating={difficulty} onRatingChange={setDifficulty} label={t('review.difficulty')} type="difficulty" t={t} required />
                </div>

                {/* Usefulness Rating */}
                <div className="space-y-1">
                  <FormStarRating rating={usefulness} onRatingChange={setUsefulness} label={t('review.usefulness')} type="usefulness" t={t} required />
                </div>

                {/* Grade */}
                <div className="space-y-2 md:space-y-0">
                  <div className="md:flex md:items-center md:gap-4">
                    <Label htmlFor="grade" className="md:min-w-[120px] md:flex-shrink-0 font-bold">
                      {t('review.grade')} <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex items-center gap-2 md:flex-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setGrade(grade === '-1' ? '' : '-1')}
                        className={cn(
                          "text-xs px-2 py-1 h-6 border transition-colors flex-shrink-0",
                          grade === '-1'
                            ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                            : "border-border hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        {t('review.gradeNotApplicableOrPreferNotToSay')}
                      </Button>
                      <Select value={grade === '-1' ? '' : grade} onValueChange={setGrade} disabled={grade === '-1'}>
                        <SelectTrigger className={cn("w-[180px]", grade === '-1' && "opacity-50 cursor-not-allowed")}>
                          <SelectValue placeholder={t('review.gradePlaceholder')} />
                        </SelectTrigger>
                        <SelectContent className="min-w-[120px]">
                          <SelectItem value="A"><span className="font-mono font-semibold">A{'\u00A0'}</span> (4.00)</SelectItem>
                          <SelectItem value="A-"><span className="font-mono font-semibold">A-</span> (3.67)</SelectItem>
                          <SelectItem value="B+"><span className="font-mono font-semibold">B+</span> (3.33)</SelectItem>
                          <SelectItem value="B"><span className="font-mono font-semibold">B{'\u00A0'}</span> (3.00)</SelectItem>
                          <SelectItem value="B-"><span className="font-mono font-semibold">B-</span> (2.67)</SelectItem>
                          <SelectItem value="C+"><span className="font-mono font-semibold">C+</span> (2.33)</SelectItem>
                          <SelectItem value="C"><span className="font-mono font-semibold">C{'\u00A0'}</span> (2.00)</SelectItem>
                          <SelectItem value="C-"><span className="font-mono font-semibold">C-</span> (1.67)</SelectItem>
                          <SelectItem value="D+"><span className="font-mono font-semibold">D+</span> (1.33)</SelectItem>
                          <SelectItem value="D"><span className="font-mono font-semibold">D{'\u00A0'}</span> (1.00)</SelectItem>
                          <SelectItem value="F"><span className="font-mono font-semibold">F{'\u00A0'}</span> (0.00)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Course Comments */}
                <div className="space-y-3">
                  <Label htmlFor="courseComments" className="font-bold">
                    {t('review.comments')} <span className="text-red-500">*</span>
                  </Label>
                  {renderCommonPhrases('course')}
                  <HybridMarkdownEditor
                    t={t}
                    id="courseComments"
                    value={courseComments}
                    onChange={setCourseComments}
                    placeholder={t('review.commentsPlaceholder')}
                    rows={4}
                    minWords={5}
                    maxWords={1000}
                  />
                </div>
              </div>
            )
          }
          ];
          
          // Statically add lecture and tutorial steps if teaching records exist
          const instructorSteps = [];
          
          // Check if there are lecture teaching records
          const hasLectureRecords = availableInstructors.some(record => record.session_type === 'Lecture');
          const hasTutorialRecords = availableInstructors.some(record => record.session_type === 'Tutorial');
          
          // Add lecture step if lecture records exist
          if (hasLectureRecords) {
            instructorSteps.push({
              id: 'lecture-review',
              title: t('review.lectureReview'),
              icon: <GraduationCap className="h-5 w-5" />,
              isValid: () => {
                // 以個別講師評分為準（合併講師已於評分階段拆開）
                const lectureIdxs = instructorEvaluations
                  .map((evaluation, idx) => ({ evaluation, idx }))
                  .filter(({ evaluation }) => evaluation.sessionType === 'Lecture');
                return lectureIdxs.length > 0 && lectureIdxs.every(({ idx }) => validateSingleInstructorEvaluation(idx));
              },
              content: (
                <div className="space-y-6">
                  {instructorEvaluations
                    .map((evaluation, idx) => {
                      if (evaluation.sessionType !== 'Lecture') return null;

                      return (
                        <div key={idx} className="space-y-4">
                          <div className="mb-4">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                              <div className="text-md font-semibold text-red-500 flex-1 min-w-0">
                                {renderCombinedInstructorName(evaluation.instructorName, { secondaryClassName: 'text-sm text-muted-foreground font-normal mt-0.5' })}
                              </div>
                              
                              {/* Badges on the right for desktop, below name for mobile */}
                              <div className="flex items-center gap-2 shrink-0 md:self-start">
                                {/* Session Type Badge */}
                                <span 
                                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'}`}
                                >
                                  {t('sessionTypeBadge.lecture')}
                                </span>
                                {/* Teaching Language Badge */}
                                {(() => {
                                  const teachingLanguage = getAvailableTeachingLanguageForInstructor(
                                    selectedCourse,
                                    selectedTerm,
                                    evaluation.instructorName,
                                    evaluation.sessionType
                                  );
                                  if (teachingLanguage) {
                                    return (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800">
                                        {getTeachingLanguageName(teachingLanguage, t)}
                                      </span>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <div className="space-y-1">
                              <FormStarRating rating={evaluation.teachingScore} onRatingChange={(rating) => updateInstructorEvaluation(idx, 'teachingScore', rating)} label={t('review.teachingScore')} type="teaching" t={t} required />
                            </div>

                            <div className="space-y-1">
                              <FormStarRating rating={evaluation.gradingScore} onRatingChange={(rating) => updateInstructorEvaluation(idx, 'gradingScore', rating)} label={t('review.gradingScore')} type="grading" t={t} required />
                            </div>

                            <div className="space-y-3">
                              <Label className="font-bold">{t('review.courseRequirements')} <span className="text-red-500">*</span></Label>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {[
                                  { key: 'hasAttendanceRequirement', label: t('review.hasAttendanceRequirement') },
                                  { key: 'hasQuiz', label: t('review.hasQuiz') },
                                  { key: 'hasMidterm', label: t('review.hasMidterm') },
                                  { key: 'hasFinal', label: t('review.hasFinal') },
                                  { key: 'hasIndividualAssignment', label: t('review.hasIndividualAssignment') },
                                  { key: 'hasGroupProject', label: t('review.hasGroupProject') },
                                  { key: 'hasPresentation', label: t('review.hasPresentation') },
                                  { key: 'hasReading', label: t('review.hasReading') },
                                ].map(({ key, label }) => (
                                  <div key={key} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`${idx}-${key}`}
                                      checked={evaluation[key as keyof InstructorEvaluation] as boolean}
                                      onCheckedChange={(checked) => updateInstructorEvaluation(idx, key as keyof InstructorEvaluation, checked)}
                                    />
                                    <Label htmlFor={`${idx}-${key}`} className="text-sm">{label}</Label>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-3">
                              <Label className="font-bold">{t('review.serviceLearningSectionTitle')}</Label>
                              <div className="space-y-2">
                                {evaluation.hasServiceLearning ? (
                                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800/30">
                                    <div className="flex items-center gap-2">
                                      <Award className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                        {t('review.hasServiceLearning')}
                                      </span>
                                      <Badge 
                                        variant={evaluation.serviceLearningType === 'compulsory' ? "destructive" : "default"}
                                        className={`text-xs ${
                                          evaluation.serviceLearningType === 'compulsory' 
                                            ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' 
                                            : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                        }`}
                                      >
                                        {evaluation.serviceLearningType === 'compulsory' ? t('review.serviceLearningCompulsory') : t('review.serviceLearningOptional')}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                      {t('review.serviceLearningAutoFilled')}
                                    </p>
                                  </div>
                                ) : (
                                  <div className="p-3 bg-gray-50 dark:bg-gray-900/20 rounded-md border border-gray-200 dark:border-gray-800/30">
                                    <div className="flex items-center gap-2">
                                      <X className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                      <span className="text-sm text-gray-700 dark:text-gray-300">
                                        {t('review.noServiceLearning')}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {evaluation.hasServiceLearning && (
                                <div className="space-y-2">
                                  <Label htmlFor={`serviceLearningDescription-${idx}`}>
                                    {t('review.serviceLearningDescription')}
                                    {evaluation.serviceLearningType === 'compulsory' && (
                                      <span className="text-destructive ml-1">*</span>
                                    )}
                                  </Label>
                                  <HybridMarkdownEditor
                                    t={t}
                                    id={`serviceLearningDescription-${idx}`}
                                    value={evaluation.serviceLearningDescription}
                                    onChange={(value) => updateInstructorEvaluation(idx, 'serviceLearningDescription', value)}
                                    placeholder={
                                      evaluation.serviceLearningType === 'optional' 
                                        ? t('review.serviceLearningOptionalPlaceholder')
                                        : t('review.serviceLearningPlaceholder')
                                    }
                                    rows={3}
                                    minWords={evaluation.serviceLearningType === 'compulsory' ? 5 : 0}
                                    maxWords={1000}
                                  />
                                </div>
                              )}
                            </div>

                            <div className="space-y-3">
                              <Label htmlFor={`teachingComments-${idx}`} className="font-bold">
                                {t('review.teachingComments')} <span className="text-red-500">*</span>
                              </Label>
                              {renderCommonPhrases('teaching', idx)}
                              <HybridMarkdownEditor
                                t={t}
                                id={`teachingComments-${idx}`}
                                value={evaluation.comments}
                                onChange={(value) => updateInstructorEvaluation(idx, 'comments', value)}
                                placeholder={t('review.teachingCommentsPlaceholder')}
                                rows={3}
                                minWords={5}
                                maxWords={1000}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })
                    .filter(Boolean)
                  }
                </div>
              )
            });
          }
          
          // Add tutorial step if tutorial records exist
          if (hasTutorialRecords) {
            instructorSteps.push({
              id: 'tutorial-review',
              title: t('review.tutorialReview'),
              icon: <Users className="h-5 w-5" />,
              isValid: () => {
                // 以個別講師評分為準（合併講師已於評分階段拆開）
                const tutorialIdxs = instructorEvaluations
                  .map((evaluation, idx) => ({ evaluation, idx }))
                  .filter(({ evaluation }) => evaluation.sessionType === 'Tutorial');
                return tutorialIdxs.length > 0 && tutorialIdxs.every(({ idx }) => validateSingleInstructorEvaluation(idx));
              },
              content: (
                <div className="space-y-6">
                  {instructorEvaluations
                    .map((evaluation, idx) => {
                      if (evaluation.sessionType !== 'Tutorial') return null;

                      return (
                        <div key={idx} className="space-y-4">
                          <div className="mb-4">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                            <div className="text-md font-semibold text-red-500 flex-1 min-w-0">
                              {renderCombinedInstructorName(evaluation.instructorName, { secondaryClassName: 'text-sm text-muted-foreground font-normal mt-0.5' })}
                            </div>
                            
                            {/* Badges on the right for desktop, below name for mobile */}
                            <div className="flex items-center gap-2 shrink-0 md:self-start">
                              {/* Session Type Badge */}
                              <span 
                                className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800'}`}
                              >
                                {t('sessionTypeBadge.tutorial')}
                              </span>
                              {/* Teaching Language Badge */}
                              {(() => {
                                const teachingLanguage = getAvailableTeachingLanguageForInstructor(
                                  selectedCourse,
                                  selectedTerm,
                                  evaluation.instructorName,
                                  evaluation.sessionType
                                );
                                if (teachingLanguage) {
                                  return (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800">
                                      {getTeachingLanguageName(teachingLanguage, t)}
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </div>
                        </div>
                          
                          <div className="space-y-4">
                            <div className="space-y-1">
                              <FormStarRating rating={evaluation.teachingScore} onRatingChange={(rating) => updateInstructorEvaluation(idx, 'teachingScore', rating)} label={t('review.teachingScore')} type="teaching" t={t} required />
                            </div>

                            <div className="space-y-1">
                              <FormStarRating rating={evaluation.gradingScore} onRatingChange={(rating) => updateInstructorEvaluation(idx, 'gradingScore', rating)} label={t('review.gradingScore')} type="grading" t={t} required />
                            </div>

                            <div className="space-y-3">
                              <Label className="font-bold">{t('review.courseRequirements')} <span className="text-red-500">*</span></Label>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {[
                                  { key: 'hasAttendanceRequirement', label: t('review.hasAttendanceRequirement') },
                                  { key: 'hasQuiz', label: t('review.hasQuiz') },
                                  { key: 'hasMidterm', label: t('review.hasMidterm') },
                                  { key: 'hasFinal', label: t('review.hasFinal') },
                                  { key: 'hasIndividualAssignment', label: t('review.hasIndividualAssignment') },
                                  { key: 'hasGroupProject', label: t('review.hasGroupProject') },
                                  { key: 'hasPresentation', label: t('review.hasPresentation') },
                                  { key: 'hasReading', label: t('review.hasReading') },
                                ].map(({ key, label }) => (
                                  <div key={key} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`${idx}-${key}`}
                                      checked={evaluation[key as keyof InstructorEvaluation] as boolean}
                                      onCheckedChange={(checked) => updateInstructorEvaluation(idx, key as keyof InstructorEvaluation, checked)}
                                    />
                                    <Label htmlFor={`${idx}-${key}`} className="text-sm">{label}</Label>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-3">
                              <Label className="font-bold">{t('review.serviceLearningSectionTitle')}</Label>
                              <div className="space-y-2">
                                {evaluation.hasServiceLearning ? (
                                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800/30">
                                    <div className="flex items-center gap-2">
                                      <Award className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                        {t('review.hasServiceLearning')}
                                      </span>
                                      <Badge 
                                        variant={evaluation.serviceLearningType === 'compulsory' ? "destructive" : "default"}
                                        className={`text-xs ${
                                          evaluation.serviceLearningType === 'compulsory' 
                                            ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' 
                                            : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                        }`}
                                      >
                                        {evaluation.serviceLearningType === 'compulsory' ? t('review.serviceLearningCompulsory') : t('review.serviceLearningOptional')}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                      {t('review.serviceLearningAutoFilled')}
                                    </p>
                                  </div>
                                ) : (
                                  <div className="p-3 bg-gray-50 dark:bg-gray-900/20 rounded-md border border-gray-200 dark:border-gray-800/30">
                                    <div className="flex items-center gap-2">
                                      <X className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                      <span className="text-sm text-gray-700 dark:text-gray-300">
                                        {t('review.noServiceLearning')}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {evaluation.hasServiceLearning && (
                                <div className="space-y-2">
                                  <Label htmlFor={`serviceLearningDescription-${idx}`}>
                                    {t('review.serviceLearningDescription')}
                                    {evaluation.serviceLearningType === 'compulsory' && (
                                      <span className="text-destructive ml-1">*</span>
                                    )}
                                  </Label>
                                  <HybridMarkdownEditor
                                    t={t}
                                    id={`serviceLearningDescription-${idx}`}
                                    value={evaluation.serviceLearningDescription}
                                    onChange={(value) => updateInstructorEvaluation(idx, 'serviceLearningDescription', value)}
                                    placeholder={
                                      evaluation.serviceLearningType === 'optional' 
                                        ? t('review.serviceLearningOptionalPlaceholder')
                                        : t('review.serviceLearningPlaceholder')
                                    }
                                    rows={3}
                                    minWords={evaluation.serviceLearningType === 'compulsory' ? 5 : 0}
                                    maxWords={1000}
                                  />
                                </div>
                              )}
                            </div>

                            <div className="space-y-3">
                              <Label htmlFor={`teachingComments-${idx}`} className="font-bold">
                                {t('review.teachingComments')} <span className="text-red-500">*</span>
                              </Label>
                              {renderCommonPhrases('teaching', idx)}
                              <HybridMarkdownEditor
                                t={t}
                                id={`teachingComments-${idx}`}
                                value={evaluation.comments}
                                onChange={(value) => updateInstructorEvaluation(idx, 'comments', value)}
                                placeholder={t('review.teachingCommentsPlaceholder')}
                                rows={3}
                                minWords={5}
                                maxWords={1000}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })
                    .filter(Boolean)
                  }
                </div>
              )
            });
          }
          
          // Keep the old dynamic logic as a fallback for any remaining instructor evaluations
          // 以個別講師評分為準（合併講師已於評分階段拆開）
          const remainingInstructorSteps = instructorEvaluations.map((evaluation, idx) => {
            const sessionType = evaluation.sessionType;

            // Skip if already handled by static steps
            if (sessionType === 'Lecture' || sessionType === 'Tutorial') {
              return null;
            }
            
            return {
              id: `instructor-${idx}`,
              title: `${sessionType} ${t('review.review')}`,
              icon: <GraduationCap className="h-5 w-5" />,
              isValid: () => validateSingleInstructorEvaluation(idx),
              content: (
              <div className="space-y-4">
                {evaluation && (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="text-lg font-semibold">{evaluation.instructorName}</h3>
                      <Badge variant="outline">
                        {evaluation.sessionType === 'Tutorial' ? t('review.tutorial') : 
                         evaluation.sessionType === 'Lecture' ? t('review.lecture') : 
                         evaluation.sessionType}
                      </Badge>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground md:hidden">{t('review.teachingScoreDescription')}</p>
                        <FormStarRating rating={evaluation.teachingScore} onRatingChange={(rating) => updateInstructorEvaluation(idx, 'teachingScore', rating)} label={t('review.teachingScore')} type="teaching" t={t} required />
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground md:hidden">{t('review.gradingScoreDescription')}</p>
                        <FormStarRating rating={evaluation.gradingScore} onRatingChange={(rating) => updateInstructorEvaluation(idx, 'gradingScore', rating)} label={t('review.gradingScore')} type="grading" t={t} required />
                      </div>

                      <div className="space-y-3">
                        <Label>{t('review.courseRequirements')} <span className="text-red-500">*</span></Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {[
                            { key: 'hasAttendanceRequirement', label: t('review.hasAttendanceRequirement') },
                            { key: 'hasQuiz', label: t('review.hasQuiz') },
                            { key: 'hasMidterm', label: t('review.hasMidterm') },
                            { key: 'hasFinal', label: t('review.hasFinal') },
                            { key: 'hasIndividualAssignment', label: t('review.hasIndividualAssignment') },
                            { key: 'hasGroupProject', label: t('review.hasGroupProject') },
                            { key: 'hasPresentation', label: t('review.hasPresentation') },
                            { key: 'hasReading', label: t('review.hasReading') },
                          ].map(({ key, label }) => (
                            <div key={key} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${idx}-${key}`}
                                checked={evaluation[key as keyof InstructorEvaluation] as boolean}
                                onCheckedChange={(checked) => updateInstructorEvaluation(idx, key as keyof InstructorEvaluation, checked)}
                              />
                              <Label htmlFor={`${idx}-${key}`} className="text-sm">{label}</Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label>{t('review.serviceLearningSectionTitle')}</Label>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm font-bold min-w-[120px] flex-shrink-0">
                              {t('review.hasServiceLearning')}
                            </Label>
                            <div className="flex items-center gap-2">
                              {evaluation.hasServiceLearning ? (
                                <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">
                                  {t('review.yes')}
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-gray-500 hover:bg-gray-600 text-white">
                                  {t('review.no')}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground ml-2">
                                ({t('review.serviceLearning.autoFilled')})
                              </span>
                            </div>
                          </div>
                          
                          {evaluation.hasServiceLearning && (
                            <div className="flex items-center gap-2">
                              <Label className="text-sm font-bold min-w-[120px] flex-shrink-0">
                                {t('review.serviceLearningType')}
                              </Label>
                              <div className="flex items-center gap-2">
                                {evaluation.serviceLearningType === 'optional' ? (
                                  <Badge variant="outline" className="border-blue-500 text-blue-600 dark:text-blue-400">
                                    {t('review.serviceLearningOptional')}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="border-orange-500 text-orange-600 dark:text-orange-400">
                                    {t('review.serviceLearningCompulsory')}
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground ml-2">
                                  ({t('review.serviceLearning.autoFilled')})
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {evaluation.hasServiceLearning && (
                          <div className="space-y-2">
                            <Label htmlFor={`serviceLearningDescription-${idx}`}>
                              {t('review.serviceLearningDescription')}
                              {evaluation.serviceLearningType === 'compulsory' && (
                                <span className="text-destructive ml-1">*</span>
                              )}
                            </Label>
                            <HybridMarkdownEditor
                              t={t}
                              id={`serviceLearningDescription-${idx}`}
                              value={evaluation.serviceLearningDescription}
                              onChange={(value) => updateInstructorEvaluation(idx, 'serviceLearningDescription', value)}
                              placeholder={
                                evaluation.serviceLearningType === 'optional' 
                                  ? t('review.serviceLearningOptionalPlaceholder')
                                  : t('review.serviceLearningPlaceholder')
                              }
                              rows={3}
                              minWords={evaluation.serviceLearningType === 'compulsory' ? 5 : 0}
                              maxWords={1000}
                            />
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor={`teachingComments-${idx}`}>
                          {t('review.teachingComments')} <span className="text-red-500">*</span>
                        </Label>
                        {renderCommonPhrases('teaching', idx)}
                        <HybridMarkdownEditor
                          t={t}
                          id={`teachingComments-${idx}`}
                          value={evaluation.comments}
                          onChange={(value) => updateInstructorEvaluation(idx, 'comments', value)}
                          placeholder={t('review.teachingCommentsPlaceholder')}
                          rows={3}
                          minWords={5}
                          maxWords={1000}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )
            };
          });
          
          // Add final submission step
          const settingsStep = {
            id: 'settings',
            title: t('review.settings'),
            icon: <Send className="h-5 w-5" />,
            isValid: validateSubmissionStep,
            content: (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="space-y-3">
                  <Label htmlFor="reviewLanguage" className="font-bold">{t('review.language')}</Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'en', label: t('review.languageOptions.en') },
                      { value: 'zh-TW', label: t('review.languageOptions.zh-TW') },
                      { value: 'zh-CN', label: t('review.languageOptions.zh-CN') }
                    ].map((option) => (
                      <Button
                        key={option.value}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setReviewLanguage(option.value)}
                        className={cn(
                          "text-sm border transition-colors",
                          reviewLanguage === option.value
                            ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                            : "border-border hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isAnonymous"
                    checked={isAnonymous}
                    onCheckedChange={(checked) => setIsAnonymous(checked === true)}
                  />
                  <Label htmlFor="isAnonymous">{t('review.anonymous')}</Label>
                </div>
                
                <div className="text-sm text-muted-foreground ml-6">
                  {isAnonymous 
                    ? t('review.anonymousDescription')
                    : t('review.publicDescription')
                  }
                </div>
                
                {!isAnonymous && (
                  <div className="ml-6 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-amber-800 dark:text-amber-200">
                        <p className="font-medium">{t('review.publicNoticeTitle')}</p>
                        <p className="mt-1">{t('review.publicNoticeDescription')}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="text-red-500 text-lg font-bold mt-0.5">*</div>
                  <div className="text-sm text-muted-foreground">
                    {t('review.requiredFieldsNotice')}
                  </div>
                </div>
              </div>
            </div>
          )
        };

        const previewStep = {
          id: 'preview',
          title: t('review.preview'),
          icon: <Eye className="h-5 w-5" />,
          isValid: () => true,
          content: (
            <div className="w-full -mx-6">
              <div className="rounded-lg p-0 space-y-2 overflow-hidden bg-gray-100 w-full mx-6 dark:bg-[#212936]">
                {/* 評論基本信息 */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-2 min-w-0 flex-1">
                    {/* 用戶信息 */}
                    <div className="flex items-center gap-2 min-w-0">
                      <ReviewAvatar
                        isAnonymous={isAnonymous}
                        userId={user?.$id}
                        username={user?.name || user?.email?.split('@')[0] || 'User'}
                        reviewId="preview"
                        size="sm"
                        className="shrink-0"
                      />
                      <span className="font-medium truncate">
                        {isAnonymous ? t('review.anonymousUser') : (user?.name || user?.email?.split('@')[0] || 'User')}
                      </span>
                    </div>
                    
                    {/* Mobile: 學期和語言徽章 - 自適應寬度顯示 */}
                    <div className="flex md:hidden flex-wrap gap-2">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs border border-border bg-background w-fit">
                        {new Date().getFullYear()} Term 1
                      </span>
                      {reviewLanguage && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs border border-border bg-background w-fit">
                          {
                            reviewLanguage === 'en' ? t('language.english') :
                            reviewLanguage === 'zh-TW' ? t('language.traditionalChinese') :
                            reviewLanguage === 'zh-CN' ? t('language.simplifiedChinese') :
                            reviewLanguage
                          }
                        </span>
                      )}
                    </div>
                    
                    {/* 課程信息 - 顯示在徽章下方 */}
                    {selectedCourse && (
                      <div className="flex items-start gap-2 ml-2 mt-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-lg">
                            <div className="font-bold text-primary">{selectedCourse}</div>
                            <div className="text-sm text-primary font-normal">
                              {courses?.find(c => c.course_code.toLowerCase() === selectedCourse.toLowerCase())?.course_title}
                            </div>
                            {(language === 'zh-TW' || language === 'zh-CN') && (() => {
                              // 🐛 FIX: Case-insensitive comparison for course codes  
                              const selectedCourseData = courses?.find(c => c.course_code.toLowerCase() === selectedCourse.toLowerCase());
                              const chineseName = language === 'zh-TW' ? selectedCourseData?.course_title_tc : selectedCourseData?.course_title_sc;
                              return chineseName && (
                                <div className="text-sm text-primary font-normal mt-0.5">
                                  {chineseName}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Desktop: 學期和語言徽章 with 最終成績 */}
                  <div className="hidden md:flex md:items-center gap-3 shrink-0 ml-2">
                    {/* 學期和語言徽章 - Desktop版本 (左側) */}
                    <div className="flex gap-2">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs border border-border bg-background">
                        {new Date().getFullYear()} Term 1
                      </span>
                      {reviewLanguage && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs border border-border bg-background">
                          {
                            reviewLanguage === 'en' ? t('language.english') :
                            reviewLanguage === 'zh-TW' ? t('language.traditionalChinese') :
                            reviewLanguage === 'zh-CN' ? t('language.simplifiedChinese') :
                            reviewLanguage
                          }
                        </span>
                      )}
                    </div>
                    
                    {/* 最終成績 (右側) */}
                    {grade && grade !== '-1' && (
                      <div className="flex items-center">
                        <GradeBadge 
                          grade={grade}
                          size="md"
                          showTooltip={true}
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Mobile: 最終成績 only */}
                  {grade && grade !== '-1' && (
                    <div className="flex md:hidden flex-col items-center shrink-0 ml-2">
                      <GradeBadge 
                        grade={grade}
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
                        {workload === null ? (
                          <span className="text-muted-foreground text-sm">{t('review.notApplicable')}</span>
                        ) : (
                          <UIStarRating rating={workload} size="sm" showValue={true} showTooltip={true} ratingType="workload" />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-center gap-1 mb-1 lg:mb-0">
                      <span className="font-medium text-sm sm:text-base">{t('review.difficulty')}</span>
                      <div className="flex items-center justify-center lg:ml-1">
                        {difficulty === null ? (
                          <span className="text-muted-foreground text-sm">{t('review.notApplicable')}</span>
                        ) : (
                          <UIStarRating rating={difficulty} size="sm" showValue={true} showTooltip={true} ratingType="difficulty" />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-center gap-1 mb-1 lg:mb-0">
                      <span className="font-medium text-sm sm:text-base">{t('review.usefulness')}</span>
                      <div className="flex items-center justify-center lg:ml-1">
                        {usefulness === null ? (
                          <span className="text-muted-foreground text-sm">{t('review.notApplicable')}</span>
                        ) : (
                          <UIStarRating rating={usefulness} size="sm" showValue={true} showTooltip={true} ratingType="usefulness" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 課程評論 */}
                {courseComments && (
                  <div className="pt-2">
                    <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 shrink-0" />
                      <span>{t('review.courseComments')}</span>
                    </h5>
                    <div className="bg-muted/50 p-2 rounded-md break-words text-sm">
                      <div className="text-sm">{renderCommentMarkdown(courseComments)}</div>
                    </div>
                  </div>
                )}

                {/* 講師評估 */}
                {instructorEvaluations && instructorEvaluations.length > 0 && (
                  <div className="space-y-4">
                    <h5 className="text-sm font-medium mb-2">
                      <span>{t('review.instructorEvaluation')}</span>
                    </h5>
                    {instructorEvaluations.map((instructor, index) => (
                      <div 
                        key={index} 
                        className="rounded-lg p-4 overflow-hidden bg-gray-200 dark:bg-[#1B2331] border-border dark:border-[#2a3441]"
                      >
                        <div className="space-y-2 mb-3">
                          {/* Instructor name and badges container */}
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-4">
                            {/* Instructor name */}
                            <div className="font-semibold text-lg min-w-0 md:flex-1">
                              <div className="text-primary px-2 py-1 rounded-md inline-block">
                                {renderCombinedInstructorName(instructor.instructorName, { wrapperClassName: 'text-left', primaryClassName: 'font-bold', secondaryClassName: 'text-sm text-muted-foreground font-normal mt-0.5 text-left' })}
                              </div>
                            </div>
                            
                            {/* Desktop/Tablet: Badges on the right side of instructor name */}
                            <div className="hidden md:flex md:items-center md:gap-2 md:shrink-0">
                              {/* 課堂類型徽章 */}
                              <span 
                                className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs ${
                                  instructor.sessionType === 'Lecture' 
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'
                                    : instructor.sessionType === 'Tutorial'
                                    ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800'
                                    : ''
                                }`}
                              >
                                {t(`sessionTypeBadge.${instructor.sessionType.toLowerCase()}`)}
                              </span>

                              {/* 教學語言徽章 */}
                              {(() => {
                                const teachingLanguage = getPreviewTeachingLanguageForInstructor(
                                  selectedCourse,
                                  selectedTerm,
                                  instructor.instructorName,
                                  instructor.sessionType
                                );
                                if (teachingLanguage) {
                                  return (
                                    <span 
                                      className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800"
                                    >
                                      {getTeachingLanguageName(teachingLanguage, t)}
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </div>
                          
                          {/* Mobile: Badges on separate lines below instructor name */}
                          <div className="flex md:hidden flex-wrap items-center gap-2">
                            {/* 課堂類型徽章 */}
                            <span 
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs ${
                                instructor.sessionType === 'Lecture' 
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'
                                  : instructor.sessionType === 'Tutorial'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800'
                                  : ''
                              }`}
                            >
                              {t(`sessionTypeBadge.${instructor.sessionType.toLowerCase()}`)}
                            </span>

                            {/* 教學語言徽章 */}
                            {(() => {
                              const teachingLanguage = getPreviewTeachingLanguageForInstructor(
                                selectedCourse,
                                selectedTerm,
                                instructor.instructorName,
                                instructor.sessionType
                              );
                              if (teachingLanguage) {
                                return (
                                  <span 
                                    className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800"
                                  >
                                    {getTeachingLanguageName(teachingLanguage, t)}
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </div>

                        {/* 講師評分 */}
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div className="text-center">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-center gap-1 mb-1 md:mb-0">
                              <span className="font-medium text-sm">
                                <span className="md:hidden">{t('review.teaching')}</span>
                                <span className="hidden md:inline">{t('review.teachingQuality')}</span>
                              </span>
                              <div className="flex items-center justify-center md:ml-1">
                                {instructor.teachingScore === null ? (
                                  <span className="text-muted-foreground text-sm">{t('review.notApplicable')}</span>
                                ) : (
                                  <UIStarRating rating={instructor.teachingScore} size="sm" showValue={true} showTooltip={true} ratingType="teaching" />
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-center gap-1 mb-1 md:mb-0">
                              <span className="font-medium text-sm">
                                <span className="md:hidden">{t('review.grading')}</span>
                                <span className="hidden md:inline">{t('review.gradingSatisfaction')}</span>
                              </span>
                              <div className="flex items-center justify-center md:ml-1">
                                {instructor.gradingScore === null ? (
                                  <span className="text-muted-foreground text-sm">{t('review.notApplicable')}</span>
                                ) : (
                                  <UIStarRating rating={instructor.gradingScore} size="sm" showValue={true} showTooltip={true} ratingType="grading" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 課程要求 */}
                        <div className="mb-6">
                          <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                            <FileText className="h-4 w-4 shrink-0" />
                            <span>{t('review.courseRequirements')}</span>
                          </h5>
                          <div className="ml-4 flex flex-wrap gap-2 overflow-hidden">
                            {(() => {
                              const renderRequirementBadge = (value: boolean, label: string) => (
                                <Badge 
                                  key={label}
                                  variant={value ? "default" : "secondary"}
                                  className={`text-xs shrink-0 ${value ? 'bg-green-100 hover:!bg-green-100 dark:hover:!bg-green-900/20 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-100 hover:!bg-gray-100 dark:hover:!bg-gray-800 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}
                                >
                                  {value ? (
                                    <CheckCircle className="h-3 w-3 mr-1 shrink-0" />
                                  ) : (
                                    <XCircle className="h-3 w-3 mr-1 shrink-0" />
                                  )}
                                  <span className="truncate">{label}</span>
                                </Badge>
                              );
                              
                              return (
                                <>
                                  {renderRequirementBadge(instructor.hasAttendanceRequirement, t('review.requirements.attendance'))}
                                  {renderRequirementBadge(instructor.hasQuiz, t('review.requirements.quiz'))}
                                  {renderRequirementBadge(instructor.hasMidterm, t('review.requirements.midterm'))}
                                  {renderRequirementBadge(instructor.hasFinal, t('review.requirements.final'))}
                                  {renderRequirementBadge(instructor.hasIndividualAssignment, t('review.requirements.individualAssignment'))}
                                  {renderRequirementBadge(instructor.hasGroupProject, t('review.requirements.groupProject'))}
                                  {renderRequirementBadge(instructor.hasPresentation, t('review.requirements.presentation'))}
                                  {renderRequirementBadge(instructor.hasReading, t('review.requirements.reading'))}
                                </>
                              );
                            })()}
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
                              <div className="text-sm">{renderCommentMarkdown(instructor.comments)}</div>
                            </div>
                          </div>
                        )}

                        {/* 服務學習 */}
                        {instructor.hasServiceLearning && (
                          <div className="mb-6">
                            <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                              <GraduationCap className="h-4 w-4 shrink-0" />
                              <span>{t('review.serviceLearning')}</span>
                            </h5>
                            <div className="ml-4 space-y-2">
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs ${
                                  instructor.serviceLearningType === 'compulsory'
                                    ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
                                    : 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
                                }`}>
                                  {instructor.serviceLearningType === 'compulsory' ? t('review.compulsory') : t('review.optional')}
                                </span>
                              </div>
                              {instructor.serviceLearningDescription && (
                                <div className="text-xs break-words">
                                  <div className="text-xs">{renderCommentMarkdown(instructor.serviceLearningDescription)}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* 投票按鈕和時間戳 */}
                <Separator />
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 overflow-hidden">
                  <div className="flex-shrink-0">
                    <VotingButtons
                      reviewId="preview"
                      upvotes={0}
                      downvotes={0}
                      userVote={null}
                      size="sm"
                      disabled={true}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 min-w-0">
                    <ResponsiveTooltip content={t('review.timestampTooltip', { timezone: 'Hong Kong Time (UTC+8)' })}>
                      <span className="truncate cursor-help">
                        {previewTimestamp ? formatDateTimeUTC8(previewTimestamp) : formatDateTimeUTC8(new Date().toISOString())}
                      </span>
                    </ResponsiveTooltip>
                  </div>
                </div>
              </div>
            </div>
          )
        };

          // Combine all steps
          return [...baseSteps, ...instructorSteps, ...remainingInstructorSteps.filter(Boolean), settingsStep, previewStep];
        })()}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        onSubmit={handleSubmitClick}
        submitLabel={editReviewId ? t('review.updateReview') : t('review.submitReview')}
        isSubmitting={submitting}
        previousLabel={t('common.previous') || '上一步'}
        nextLabel={t('common.next') || '下一步'}
        submittingLabel={t('common.submitting') || '提交中...'}
      />

      {/* Main Exit Confirmation Dialog */}
      <AlertDialog open={showMainExitConfirm} onOpenChange={setShowMainExitConfirm}>
        <AlertDialogContent className="bg-white dark:bg-gray-900 sm:rounded-lg rounded-xl mx-auto max-w-[calc(100vw-2rem)] sm:max-w-lg p-6">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('review.exitConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('review.exitConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row gap-3 justify-center pt-2">
            <AlertDialogCancel className="flex-1 min-w-0">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmMainExit} className="flex-1 min-w-0">
              {t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
        <AlertDialogContent className="bg-white dark:bg-gray-900 sm:rounded-lg rounded-xl mx-auto max-w-[calc(100vw-2rem)] sm:max-w-lg p-6">
          <AlertDialogHeader>
            <AlertDialogTitle>{isEditMode ? t('review.confirmUpdate') : t('review.confirmSubmit')}</AlertDialogTitle>
            <AlertDialogDescription>
              {isEditMode 
                ? t('review.confirmUpdateDescription') 
                : t('review.confirmSubmitDescription')
              }
              <br className="hidden sm:block" />
              {t('review.confirmContent')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row gap-3 justify-center pt-2">
            <AlertDialogCancel disabled={submitting} className="flex-1 min-w-0">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmSubmit}
              disabled={submitting}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 flex-1 min-w-0"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('review.submitting')}
                </>
              ) : (
                isEditMode ? t('review.updateReview') : t('review.submitReview')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Celebration Dialog */}
      <AlertDialog open={showCelebration} onOpenChange={setShowCelebration}>
        <AlertDialogContent className="bg-white dark:bg-gray-900 text-center sm:rounded-lg rounded-xl m-4 sm:mx-auto max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <AlertDialogHeader className="items-center">
            <div className="relative mb-4">
              {/* Animated sparkles background */}
              <div className="absolute inset-0 flex justify-center items-center">
                <Sparkles className="h-16 w-16 text-yellow-400 animate-pulse" />
              </div>
              {/* Main success icon */}
              <div className="relative z-10 flex justify-center">
                <CheckCircle2 className="h-20 w-20 text-green-500 animate-bounce" />
              </div>
            </div>
            <AlertDialogTitle className="text-2xl font-bold text-green-600 dark:text-green-400">
              {isEditMode ? t('review.updateSuccess') : t('review.submitSuccess')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-lg">
              {isEditMode 
                ? t('review.updateSuccessMessage') 
                : t('review.submitSuccessMessage')
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="text-4xl animate-bounce mt-2">🎉</div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ReviewSubmissionForm;
