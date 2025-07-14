import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
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
  ChevronDown,
  ChevronUp,
  Smile,
  Frown,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CourseService, Course, Term, Review, TeachingRecord, InstructorDetail, Instructor } from '@/services/api/courseService';
import { GradeBadge } from '@/components/ui/GradeBadge';
import { WordCounter } from '@/components/ui/word-counter';
import { renderCommentMarkdown, hasMarkdownFormatting } from '@/utils/ui/markdownRenderer';
import { validateWordCount } from '@/utils/textUtils';
import { formatDateTimeUTC8 } from '@/utils/ui/dateUtils';
import { ReviewAvatar } from '@/components/ui/review-avatar';
import { StarRating as UIStarRating } from '@/components/ui/star-rating';
import { useInstructorDetailTeachingLanguages } from '@/hooks/useInstructorDetailTeachingLanguages';
import { getTeachingLanguageName, extractInstructorNameForSorting, getInstructorName } from '@/utils/textUtils';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';

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
  const isNotRated = rating === null;

  return (
    <div className="space-y-1">
      {/* Desktop: Label, N/A, Stars, and Description on same line */}
      <div className="hidden md:flex md:items-center md:gap-4">
        <Label className="text-sm font-medium min-w-[120px] flex-shrink-0">
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
        <div 
          className={cn(
            "flex items-center gap-1 flex-shrink-0",
            isNotApplicable && "opacity-40 pointer-events-none"
          )}
          onMouseLeave={() => setHoveredRating(null)}
        >
          {/* 0 star button - easy to click */}
          <button
            type="button"
            onClick={() => onRatingChange(rating === 0 ? null : 0)}
            onMouseEnter={() => setHoveredRating(0)}
            className={cn(
              "h-6 w-6 rounded-full border-2 transition-all hover:scale-110 focus:outline-none flex items-center justify-center text-xs font-bold mr-1",
              rating === 0
                ? "bg-red-500 border-red-500 text-white"
                : "border-gray-300 text-gray-400 hover:border-red-400 hover:text-red-400 dark:border-gray-600 dark:text-gray-500 dark:hover:border-red-500 dark:hover:text-red-400"
            )}
            disabled={isNotApplicable}
          >
            0
          </button>
          
          {[1, 2, 3, 4, 5].map((starValue) => (
            <div key={starValue} className="relative">
              {/* Half star (left side) */}
              <button
                type="button"
                onClick={() => onRatingChange(rating === starValue - 0.5 ? null : starValue - 0.5)}
                onMouseEnter={() => setHoveredRating(starValue - 0.5)}
                className="absolute left-0 top-0 w-3 h-6 transition-all hover:scale-110 focus:outline-none focus:ring-0 focus:border-0 focus:shadow-none focus:ring-offset-0 outline-none border-none rounded-l z-10"
                style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
                disabled={isNotApplicable}
              >
                <Star
                  className={`h-6 w-6 transition-colors ${
                    isNotApplicable
                      ? 'text-gray-300 dark:text-gray-600'
                      : starValue - 0.5 <= displayRating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                  style={{
                    clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)'
                  }}
                />
              </button>
              
              {/* Full star */}
              <button
                type="button"
                onClick={() => onRatingChange(rating === starValue ? null : starValue)}
                onMouseEnter={() => setHoveredRating(starValue)}
                className="transition-all hover:scale-110 focus:outline-none focus:ring-0 focus:border-0 focus:shadow-none focus:ring-offset-0 outline-none border-none rounded"
                style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
                disabled={isNotApplicable}
              >
                <Star
                  className={`h-6 w-6 transition-colors ${
                    isNotApplicable
                      ? 'text-gray-300 dark:text-gray-600'
                      : starValue <= displayRating
                      ? 'fill-yellow-400 text-yellow-400'
                      : starValue - 0.5 <= displayRating
                      ? 'text-yellow-400'
                      : 'text-gray-300'
                  }`}
                  style={{
                    fill: isNotApplicable 
                      ? 'none'
                      : starValue <= displayRating 
                      ? 'currentColor' 
                      : starValue - 0.5 <= displayRating 
                      ? 'url(#half-fill)' 
                      : 'none'
                  }}
                />
              </button>
            </div>
          ))}
        </div>
        
        <span className="text-sm text-muted-foreground flex-1">
          {isNotRated ? t('review.rating.notRated') : 
           isNotApplicable ? '' : 
           `${displayRating}/5 - ${getDescription(displayRating)}`}
        </span>
      </div>

      {/* Mobile: Traditional stacked layout */}
      <div className="md:hidden space-y-2">
        <Label className="text-sm font-medium">
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
          <div 
            className={cn(
              "flex items-center gap-1",
              isNotApplicable && "opacity-40 pointer-events-none"
            )}
            onMouseLeave={() => setHoveredRating(null)}
          >
            {/* 0 star button - easy to click */}
            <button
              type="button"
              onClick={() => onRatingChange(rating === 0 ? null : 0)}
              onMouseEnter={() => setHoveredRating(0)}
              className={cn(
                "h-6 w-6 rounded-full border-2 transition-all hover:scale-110 focus:outline-none flex items-center justify-center text-xs font-bold mr-1",
                rating === 0
                  ? "bg-red-500 border-red-500 text-white"
                  : "border-gray-300 text-gray-400 hover:border-red-400 hover:text-red-400 dark:border-gray-600 dark:text-gray-500 dark:hover:border-red-500 dark:hover:text-red-400"
              )}
              disabled={isNotApplicable}
            >
              0
            </button>
            
            {[1, 2, 3, 4, 5].map((starValue) => (
              <div key={starValue} className="relative">
                {/* Half star (left side) */}
                <button
                  type="button"
                  onClick={() => onRatingChange(rating === starValue - 0.5 ? null : starValue - 0.5)}
                  onMouseEnter={() => setHoveredRating(starValue - 0.5)}
                  className="absolute left-0 top-0 w-3 h-6 transition-all hover:scale-110 focus:outline-none focus:ring-0 focus:border-0 focus:shadow-none focus:ring-offset-0 outline-none border-none rounded-l z-10"
                  style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
                  disabled={isNotApplicable}
                >
                  <Star
                    className={`h-6 w-6 transition-colors ${
                      isNotApplicable
                        ? 'text-gray-300 dark:text-gray-600'
                        : starValue - 0.5 <= displayRating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                    style={{
                      clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)'
                    }}
                  />
                </button>
                
                {/* Full star */}
                <button
                  type="button"
                  onClick={() => onRatingChange(rating === starValue ? null : starValue)}
                  onMouseEnter={() => setHoveredRating(starValue)}
                  className="transition-all hover:scale-110 focus:outline-none focus:ring-0 focus:border-0 focus:shadow-none focus:ring-offset-0 outline-none border-none rounded"
                  style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
                  disabled={isNotApplicable}
                >
                  <Star
                    className={`h-6 w-6 transition-colors ${
                      isNotApplicable
                        ? 'text-gray-300 dark:text-gray-600'
                        : starValue <= displayRating
                        ? 'fill-yellow-400 text-yellow-400'
                        : starValue - 0.5 <= displayRating
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                    style={{
                      fill: isNotApplicable 
                        ? 'none'
                        : starValue <= displayRating 
                        ? 'currentColor' 
                        : starValue - 0.5 <= displayRating 
                        ? 'url(#half-fill)' 
                        : 'none'
                    }}
                  />
                </button>
              </div>
            ))}
          </div>
          
          <span className="text-sm text-muted-foreground ml-2">
            {isNotRated ? t('review.rating.notRated') : 
             isNotApplicable ? '' : 
             `${displayRating}/5 - ${getDescription(displayRating)}`}
          </span>
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

  // Form states
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [selectedInstructors, setSelectedInstructors] = useState<string[]>([]);
  
  // Course evaluation - Use null to represent "not yet rated" state
  const [workload, setWorkload] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<number | null>(null);
  const [usefulness, setUsefulness] = useState<number | null>(null);
  const [grade, setGrade] = useState<string>('');
  const [courseComments, setCourseComments] = useState<string>('');

  const [isAnonymous, setIsAnonymous] = useState<boolean>(true);
  const [reviewLanguage, setReviewLanguage] = useState<string>('en'); // Default to English

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

  // Textarea refs for formatting
  const courseCommentsRef = useRef<HTMLTextAreaElement>(null);
  const teachingCommentsRefs = useRef<{[key: number]: HTMLTextAreaElement | null}>({});
  const serviceLearningRef = useRef<HTMLTextAreaElement>(null);

  // Teaching languages hook for preview (selected instructors)
  const allInstructorDetails = useMemo(() => {
    return instructorEvaluations.map(instructorEval => ({
      instructor_name: instructorEval.instructorName,
      session_type: instructorEval.sessionType,
      teaching: instructorEval.teachingScore,
      grading: instructorEval.gradingScore,
      comments: instructorEval.comments,
      has_midterm: instructorEval.hasMidterm,
      has_final: instructorEval.hasFinal,
      has_quiz: instructorEval.hasQuiz,
      has_group_project: instructorEval.hasGroupProject,
      has_individual_assignment: instructorEval.hasIndividualAssignment,
      has_presentation: instructorEval.hasPresentation,
      has_reading: instructorEval.hasReading,
      has_attendance_requirement: instructorEval.hasAttendanceRequirement,
      has_service_learning: instructorEval.hasServiceLearning,
      service_learning_type: instructorEval.serviceLearningType,
      service_learning_description: instructorEval.serviceLearningDescription
    }));
  }, [instructorEvaluations]);

  // Teaching languages hook for all available instructors (for selection UI)
  const allAvailableInstructorDetails = useMemo(() => {
    return availableInstructors.map(instructor => ({
      instructor_name: instructor.instructor_name,
      session_type: instructor.session_type,
      teaching: null,
      grading: null,
      comments: '',
      has_midterm: false,
      has_final: false,
      has_quiz: false,
      has_group_project: false,
      has_individual_assignment: false,
      has_presentation: false,
      has_reading: false,
      has_attendance_requirement: false,
      has_service_learning: false,
      service_learning_type: 'compulsory' as const,
      service_learning_description: ''
    }));
  }, [availableInstructors]);

  // Use teaching languages hook for preview (selected instructors)
  const { 
    teachingLanguages: previewTeachingLanguages, 
    loading: teachingLanguagesLoading, 
    getTeachingLanguageForInstructor: getPreviewTeachingLanguageForInstructor 
  } = useInstructorDetailTeachingLanguages({
    instructorDetails: allInstructorDetails,
    courseCode: selectedCourse,
    termCode: selectedTerm
  });

  // Use teaching languages hook for all available instructors (for selection UI)
  const { 
    teachingLanguages: availableTeachingLanguages, 
    loading: availableTeachingLanguagesLoading, 
    getTeachingLanguageForInstructor: getAvailableTeachingLanguageForInstructor 
  } = useInstructorDetailTeachingLanguages({
    instructorDetails: allAvailableInstructorDetails,
    courseCode: selectedCourse,
    termCode: selectedTerm
  });

  // Formatting functions
  const applyFormatting = (textareaRef: React.RefObject<HTMLTextAreaElement>, setValue: (value: string) => void, formatType: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);

    let formattedText = '';
    let newCursorPos = start;

    switch (formatType) {
      case 'bold':
        if (selectedText) {
          formattedText = `**${selectedText}**`;
          newCursorPos = start + formattedText.length;
        } else {
          formattedText = `**${t('review.formatting.boldText')}**`;
          newCursorPos = start + 2; // Position cursor between **
        }
        break;
      case 'italic':
        if (selectedText) {
          formattedText = `*${selectedText}*`;
          newCursorPos = start + formattedText.length;
        } else {
          formattedText = `*${t('review.formatting.italicText')}*`;
          newCursorPos = start + 1; // Position cursor between *
        }
        break;
      case 'underline':
        if (selectedText) {
          formattedText = `__${selectedText}__`;
          newCursorPos = start + formattedText.length;
        } else {
          formattedText = `__${t('review.formatting.underlineText')}__`;
          newCursorPos = start + 2; // Position cursor between __
        }
        break;
      case 'strikethrough':
        if (selectedText) {
          formattedText = `~~${selectedText}~~`;
          newCursorPos = start + formattedText.length;
        } else {
          formattedText = `~~${t('review.formatting.strikethroughText')}~~`;
          newCursorPos = start + 2; // Position cursor between ~~
        }
        break;
      case 'unorderedList':
        const unorderedLines = selectedText ? selectedText.split('\n') : [
          t('review.formatting.listItem1'), 
          t('review.formatting.listItem2'), 
          t('review.formatting.listItem3')
        ];
        formattedText = unorderedLines.map(line => `- ${line.trim()}`).join('\n');
        newCursorPos = start + formattedText.length;
        break;
      case 'orderedList':
        const orderedLines = selectedText ? selectedText.split('\n') : [
          t('review.formatting.listItem1'), 
          t('review.formatting.listItem2'), 
          t('review.formatting.listItem3')
        ];
        formattedText = orderedLines.map((line, index) => `${index + 1}. ${line.trim()}`).join('\n');
        newCursorPos = start + formattedText.length;
        break;
    }

    const newValue = beforeText + formattedText + afterText;
    setValue(newValue);

    // Set cursor position after state update
    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const renderFormattingToolbar = (textareaRef: React.RefObject<HTMLTextAreaElement>, setValue: (value: string) => void) => {
    return (
      <div className="flex flex-wrap gap-1 p-2 bg-muted/20 dark:bg-muted/10 border border-border rounded-t-lg">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => applyFormatting(textareaRef, setValue, 'bold')}
          title={t('review.formatting.bold')}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => applyFormatting(textareaRef, setValue, 'italic')}
          title={t('review.formatting.italic')}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => applyFormatting(textareaRef, setValue, 'underline')}
          title={t('review.formatting.underline')}
        >
          <Underline className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => applyFormatting(textareaRef, setValue, 'strikethrough')}
          title={t('review.formatting.strikethrough')}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <div className="w-px bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => applyFormatting(textareaRef, setValue, 'unorderedList')}
          title={t('review.formatting.unorderedList')}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => applyFormatting(textareaRef, setValue, 'orderedList')}
          title={t('review.formatting.orderedList')}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
      </div>
    );
  };

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

            {/* Phrases content - two columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                            : "text-green-600 border-green-200 hover:bg-green-50 hover:text-green-600 hover:border-green-300 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/20 dark:hover:border-green-700"
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
        const coursesData = await CourseService.getAllCourses();
        setCourses(coursesData);
        
        // If preselected course code is provided, set it
        if (preselectedCourseCode) {
          const course = coursesData.find(c => c.course_code === preselectedCourseCode);
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
        const teachingRecords = await CourseService.getCourseTeachingRecords(selectedCourse);
        const termCodes = [...new Set(teachingRecords.map(record => record.term_code))];
        
        const termsData = await Promise.all(
          termCodes.map(async (termCode) => {
            return await CourseService.getTermByCode(termCode);
          })
        );
        
        const validTerms = termsData.filter((term): term is Term => term !== null);
        const sortedTerms = validTerms.sort((a, b) => b.term_code.localeCompare(a.term_code));
        setTerms(sortedTerms);
        
        // Clear selected term and instructors when course changes (but not during edit data population)
        // Also don't clear if we're in edit mode and already have selections
        if (!isPopulatingEditData && (!editReviewId || (!selectedTerm && selectedInstructors.length === 0))) {
          setSelectedTerm('');
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
        const teachingRecords = await CourseService.getCourseTeachingRecords(selectedCourse);
        const filteredRecords = teachingRecords.filter(record => record.term_code === selectedTerm);
        setAvailableInstructors(filteredRecords);
        
        // Remove any selected instructors that are not available for this course/term combination
        // But preserve selected instructors during edit data population
        if (!isPopulatingEditData) {
          const validInstructorKeys = filteredRecords.map(record => `${record.instructor_name}|${record.session_type}`);
          setSelectedInstructors(prev => prev.filter(instructorKey => validInstructorKeys.includes(instructorKey)));
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
    
    const newEvaluations: InstructorEvaluation[] = selectedInstructors.map(instructorKey => {
      const [instructorName, sessionType] = instructorKey.split('|');
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
        record => record.instructor_name === evaluation.instructorName && 
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
        record => record.instructor_name === evaluation.instructorName && 
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
        const eligibility = await CourseService.canUserSubmitReview(user.$id, selectedCourse);
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
      if (instructorEvaluations.length === 0) return;
      
      const instructorNames = new Set<string>();
      instructorEvaluations.forEach(evaluation => {
        instructorNames.add(evaluation.instructorName);
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
  }, [instructorEvaluations]);

  const handleInstructorToggle = (instructorKey: string) => {
    setSelectedInstructors(prev => 
      prev.includes(instructorKey) 
        ? prev.filter(key => key !== instructorKey)
        : [...prev, instructorKey]
    );
  };

  const validateForm = async (): Promise<boolean> => {
    // 檢查基本選擇
    if (!selectedCourse || !selectedTerm || selectedInstructors.length === 0) {
      toast({
        title: t('common.error'),
        description: t('review.fillAllFields'),
        variant: 'destructive',
      });
      return false;
    }

    // Check review eligibility (only for new reviews, not edits)
    if (!isEditMode && reviewEligibility && !reviewEligibility.canSubmit) {
      let errorMessage = t('review.submitLimitReached');
      
      switch (reviewEligibility.reason) {
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
      const teachingRecords = await CourseService.getCourseTeachingRecords(selectedCourse);
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
  };

  const handleSubmit = async () => {
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
        has_service_learning: false, // Deprecated: service learning is now per instructor
        service_learning_description: undefined, // Deprecated: service learning is now per instructor
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
          
          // Check if we're changing from F (fail) to a non-F grade
          if (originalGrade === 'F' && newGrade && newGrade !== 'F') {
            try {
              // Get all user's reviews for this course to check if they have 2 reviews
              const allUserReviews = await CourseService.canUserSubmitReview(user.$id, selectedCourse);
              
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
    } catch (error) {
      console.error('❌ Error submitting review:', error);
      toast({
        title: t('common.error'),
        description: t('review.submitError'),
        variant: 'destructive',
      });
    } finally {
      console.log('🏁 Setting submitting to false');
      setSubmitting(false);
    }
  };

  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Preview component
  const PreviewCard = () => {
    const mockTerm = { name: `${new Date().getFullYear()} Term 1` };
    const mockUsername = user?.name || user?.email?.split('@')[0] || 'User';
    
    return (
      <Card className="course-card">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                {t('review.previewMode')}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {t('review.previewDescription')}
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setIsPreviewMode(false)}
              className="shrink-0"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('review.backToEdit')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg p-3 space-y-2 overflow-hidden bg-card border border-border dark:bg-[#202936] dark:border-[#2a3441]">
            {/* 評論基本信息 */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-2 min-w-0 flex-1">
                <div className="flex items-center gap-2 min-w-0">
                  <ReviewAvatar
                    isAnonymous={isAnonymous}
                    userId={user?.$id}
                    username={mockUsername}
                    reviewId="preview"
                    size="sm"
                    className="shrink-0"
                  />
                  <span className="font-medium truncate">
                    {isAnonymous ? t('review.anonymousUser') : mockUsername}
                  </span>
                  {/* 學期徽章 - 桌面版顯示在用戶名旁邊 */}
                  <Badge 
                    variant="outline" 
                    className="text-xs shrink-0 hidden md:inline-flex"
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    <span className="truncate">{mockTerm.name}</span>
                  </Badge>
                </div>
                {/* 學期徽章 - 手機版顯示在下方 */}
                <Badge 
                  variant="outline" 
                  className="text-xs w-fit md:hidden"
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  <span className="truncate">{mockTerm.name}</span>
                </Badge>
              </div>
              {/* 最終成績 - 右上角大顯示 */}
              {grade && grade !== '-1' && (
                <div className="flex flex-col items-center shrink-0">
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
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="font-medium text-sm sm:text-base">{t('review.workload')}</span>
                </div>
                <div className="flex items-center justify-center">
                  {workload === null ? (
                    <span className="text-muted-foreground">{t('review.rating.notRated')}</span>
                  ) : workload === -1 ? (
                    <span className="text-muted-foreground">{t('review.notApplicable')}</span>
                  ) : (
                    <UIStarRating rating={workload} showValue size="sm" showTooltip ratingType="workload" />
                  )}
                </div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="font-medium text-sm sm:text-base">{t('review.difficulty')}</span>
                </div>
                <div className="flex items-center justify-center">
                  {difficulty === null ? (
                    <span className="text-muted-foreground">{t('review.rating.notRated')}</span>
                  ) : difficulty === -1 ? (
                    <span className="text-muted-foreground">{t('review.notApplicable')}</span>
                  ) : (
                    <UIStarRating rating={difficulty} showValue size="sm" showTooltip ratingType="difficulty" />
                  )}
                </div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="font-medium text-sm sm:text-base">{t('review.usefulness')}</span>
                </div>
                <div className="flex items-center justify-center">
                  {usefulness === null ? (
                    <span className="text-muted-foreground">{t('review.rating.notRated')}</span>
                  ) : usefulness === -1 ? (
                    <span className="text-muted-foreground">{t('review.notApplicable')}</span>
                  ) : (
                    <UIStarRating rating={usefulness} showValue size="sm" showTooltip ratingType="usefulness" />
                  )}
                </div>
              </div>
            </div>

            {/* 課程評論 */}
            {courseComments && (
              <>
                <Separator />
                <div className="min-w-0">
                  <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 shrink-0" />
                    <span>{t('review.courseComments')}</span>
                  </h5>
                  <div className="bg-muted/50 p-2 rounded-md break-words text-sm">
                    {hasMarkdownFormatting(courseComments) ? (
                      <div className="text-sm">{renderCommentMarkdown(courseComments)}</div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {courseComments}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Service learning is now handled per instructor, not at course level */}

            {/* 講師評價 */}
            {instructorEvaluations.length > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  {instructorEvaluations.map((instructor, index) => (
                    <div 
                      key={index} 
                      className="rounded-lg p-4 overflow-hidden bg-gray-200 dark:bg-[rgb(26_35_50)]"
                    >
                      <div className="flex items-start justify-between mb-3 gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-lg">
                            <button
                              type="button"
                              onClick={(e) => {
                                const url = `/instructors/${encodeURIComponent(instructor.instructorName)}`;
                                if (e.button === 1 || e.ctrlKey || e.metaKey) {
                                  // Middle click, Ctrl+click, or Cmd+click - open in new tab
                                  window.open(url, '_blank');
                                } else {
                                  // Regular click - navigate in same tab
                                  navigate(url);
                                }
                              }}
                              onMouseDown={(e) => {
                                if (e.button === 1) {
                                  // Middle click
                                  e.preventDefault();
                                  const url = `/instructors/${encodeURIComponent(instructor.instructorName)}`;
                                  window.open(url, '_blank');
                                }
                              }}
                              className="text-primary px-2 py-1 rounded-md inline-block hover:bg-primary/10 hover:text-primary transition-colors no-underline focus:outline-none focus:bg-primary/10"
                            >
                              {(() => {
                                const fullInstructor = instructorsMap.get(instructor.instructorName);
                                if (fullInstructor) {
                                  const nameInfo = getInstructorName(fullInstructor, language);
                                  return (
                                                                        <div className="text-left">
                                      <div className="font-bold">{nameInfo.primary}</div>
                                      {nameInfo.secondary && (
                                        <div className="text-sm text-muted-foreground font-normal mt-0.5 text-left">
                                          {nameInfo.secondary}
                                        </div>
                                      )}
                                    </div>
                                  );
                                }
                                return (
                                  <div className="font-bold text-left">{instructor.instructorName}</div>
                                );
                              })()}
                            </button>
                          </h4>
                        </div>
                        <div className="shrink-0 flex items-start gap-2 pt-1">
                                    {/* 教學語言徽章 */}
          {(() => {
            const teachingLanguage = getPreviewTeachingLanguageForInstructor(
              instructor.instructorName,
              instructor.sessionType
            );
                            if (teachingLanguage) {
                              return (
                                <span 
                                  className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800"
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
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <span className="font-medium text-sm sm:text-base">{t('card.teaching')}</span>
                          </div>
                          <div className="flex items-center justify-center">
                            {instructor.teachingScore === null ? (
                              <span className="text-muted-foreground">
                                {t('review.rating.notRated')}
                              </span>
                            ) : instructor.teachingScore === -1 ? (
                              <span className="text-muted-foreground">
                                {t('review.notApplicable')}
                              </span>
                            ) : (
                              <UIStarRating rating={instructor.teachingScore} showValue size="sm" showTooltip ratingType="teaching" />
                            )}
                          </div>
                        </div>
                        
                        {instructor.gradingScore !== null && instructor.gradingScore !== -1 && (
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <span className="font-medium text-sm sm:text-base">{t('card.grading')}</span>
                            </div>
                            <div className="flex items-center justify-center">
                              <UIStarRating rating={instructor.gradingScore} showValue size="sm" showTooltip ratingType="grading" />
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
                        <div className="ml-4 flex flex-wrap gap-2 overflow-hidden">
                          {[
                            { key: 'hasAttendanceRequirement', label: t('review.hasAttendanceRequirement') },
                            { key: 'hasQuiz', label: t('review.hasQuiz') },
                            { key: 'hasMidterm', label: t('review.hasMidterm') },
                            { key: 'hasFinal', label: t('review.hasFinal') },
                            { key: 'hasIndividualAssignment', label: t('review.hasIndividualAssignment') },
                            { key: 'hasGroupProject', label: t('review.hasGroupProject') },
                            { key: 'hasPresentation', label: t('review.hasPresentation') },
                            { key: 'hasReading', label: t('review.hasReading') },
                          ].map(({ key, label }) => {
                            const hasRequirement = instructor[key as keyof typeof instructor] as boolean;
                            return (
                              <Badge 
                                key={key}
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
                          })}
                        </div>
                      </div>

                      {/* 講師評論 */}
                      {instructor.comments && (
                        <div className="min-w-0 mb-4">
                          <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                            <User className="h-4 w-4 shrink-0" />
                            <span>{t('review.instructorComments')}</span>
                          </h5>
                          <div className="ml-4 break-words">
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
                      {instructor.hasServiceLearning && (
                        <div className="mb-4">
                          <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 shrink-0" />
                            <span>{t('review.serviceLearning')}</span>
                          </h5>
                          <div className="ml-4 space-y-2">
                            <div className="flex items-center gap-2">
                              <span 
                                className={cn(
                                  "inline-flex items-center px-1.5 py-0.5 rounded text-xs",
                                  instructor.serviceLearningType === 'compulsory'
                                    ? "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
                                    : "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
                                )}
                              >
                                {instructor.serviceLearningType === 'compulsory' ? t('review.compulsory') : t('review.optional')}
                              </span>
                            </div>
                            {instructor.serviceLearningDescription && (
                              <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md border border-blue-200 dark:border-blue-800/30">
                                <div className="break-words">
                                  {hasMarkdownFormatting(instructor.serviceLearningDescription) ? (
                                    renderCommentMarkdown(instructor.serviceLearningDescription)
                                  ) : (
                                    <p className="text-sm text-blue-900 dark:text-blue-100">
                                      {instructor.serviceLearningDescription}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isPreviewMode) {
    return <PreviewCard />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 space-y-2">
          <h1 className="text-3xl font-bold">
            {isEditMode ? t('review.editTitle') : t('review.title')}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode ? t('review.editSubtitle') : t('review.subtitle')}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="shrink-0 hover:bg-primary/10 hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
      </div>

      {/* Course Selection */}
      <CollapsibleSection
        title={t('review.courseInfo')}
        icon={<BookText className="h-5 w-5" />}
        defaultExpanded={true}
        className="course-card"
        contentClassName="space-y-3"
        expandedHint={t('common.clickToCollapse') || 'Click to collapse'}
        collapsedHint={t('common.clickToExpand') || 'Click to expand'}
      >
          {/* Course Selection - Desktop: inline, Mobile: stacked */}
          <div className="space-y-2 md:space-y-0">
            <div className="md:flex md:items-center md:gap-4">
              <Label htmlFor="course" className="md:min-w-[120px] md:flex-shrink-0">
                {t('review.selectCourse')} <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={selectedCourse} 
                onValueChange={setSelectedCourse} 
                disabled={coursesLoading || !!preselectedCourseCode}
              >
                <SelectTrigger className="md:flex-1">
                  <SelectValue placeholder={coursesLoading ? t('review.loadingCourses') : t('review.selectCoursePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
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
              <Label htmlFor="term" className="md:min-w-[120px] md:flex-shrink-0">
                {t('review.selectTerm')} <span className="text-red-500">*</span>
              </Label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm} disabled={!selectedCourse || termsLoading}>
                <SelectTrigger className="md:flex-1">
                  <SelectValue placeholder={termsLoading ? t('review.loadingTerms') : t('review.selectTermPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {terms.map((term) => (
                    <SelectItem key={term.$id} value={term.term_code}>
                      <span className="font-medium">{term.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Instructor Selection - Desktop: inline, Mobile: stacked */}
          <div className="space-y-2 md:space-y-0">
            <div className="md:flex md:items-start md:gap-4">
              <Label className="md:min-w-[120px] md:flex-shrink-0 md:pt-3">
                {t('review.selectInstructors')} <span className="text-red-500">*</span>
              </Label>
              <div className="md:flex-1">
                {instructorsLoading ? (
                  <div className="flex items-center gap-2 h-10 px-3 py-2 border rounded-md">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">{t('review.loadingInstructors')}</span>
                  </div>
                ) : availableInstructors.length === 0 ? (
                  <div className="flex items-center justify-center h-10 px-3 py-2 border rounded-md text-center text-muted-foreground opacity-50 cursor-not-allowed">
                    {t('review.noInstructors')}
                  </div>
                ) : (() => {
                  // Filter instructors by session type
                  const lectureInstructors = availableInstructors.filter(record => record.session_type === 'Lecture');
                  const tutorialInstructors = availableInstructors.filter(record => record.session_type === 'Tutorial');
                  
                  const hasLectureInstructors = lectureInstructors.length > 0;
                  const hasTutorialInstructors = tutorialInstructors.length > 0;
                  
                  // Helper function to render instructor list
                  const renderInstructorList = (instructors: typeof availableInstructors) => (
                    <div className="space-y-2">
                      {instructors
                        .sort((a, b) => {
                          const aNameForSort = extractInstructorNameForSorting(a.instructor_name);
                          const bNameForSort = extractInstructorNameForSorting(b.instructor_name);
                          return aNameForSort.localeCompare(bNameForSort);
                        })
                        .map((record) => {
                          const instructorKey = `${record.instructor_name}|${record.session_type}`;
                          const isSelected = selectedInstructors.includes(instructorKey);
                          
                          // Get teaching language for this instructor
                          const teachingLanguage = getAvailableTeachingLanguageForInstructor(record.instructor_name, record.session_type);
                          
                          return (
                            <div key={instructorKey} className="flex items-center space-x-2">
                              <Checkbox
                                id={instructorKey}
                                checked={isSelected}
                                onCheckedChange={() => handleInstructorToggle(instructorKey)}
                              />
                              <Label htmlFor={instructorKey} className="flex-1 cursor-pointer">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{record.instructor_name}</span>
                                  {teachingLanguage && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800">
                                      {getTeachingLanguageName(teachingLanguage, t)}
                                    </span>
                                  )}
                                </div>
                              </Label>
                            </div>
                          );
                        })}
                    </div>
                  );
                  
                  // If both types have instructors, show tabs
                  if (hasLectureInstructors && hasTutorialInstructors) {
                    return (
                      <div className="border rounded-md px-3 py-2">
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
                      <div className="border rounded-md px-3 py-2">
                        <div className="mb-2">
                          <h4 className="text-sm font-medium text-muted-foreground">{sectionTitle}</h4>
                        </div>
                        {renderInstructorList(instructorsToShow)}
                      </div>
                    );
                  }
                  
                  // This should not happen since we already check availableInstructors.length === 0 above
                  return null;
                })()}
              </div>
            </div>
          </div>
      </CollapsibleSection>

      {/* Review Eligibility Warning */}
      {!isEditMode && selectedCourse && (
        <div className="space-y-2">
          {checkingEligibility ? (
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">{t('review.checkingEligibility')}</span>
            </div>
          ) : reviewEligibility && reviewEligibility.existingReviews.length > 0 ? (
            <div className={cn(
              "p-4 rounded-lg border",
              reviewEligibility.canSubmit 
                ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
            )}>
              <div className="flex items-start gap-3">
                {reviewEligibility.canSubmit ? (
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                )}
                <div className="space-y-2">
                  <h3 className={cn(
                    "font-semibold text-sm",
                    reviewEligibility.canSubmit 
                      ? "text-amber-800 dark:text-amber-200"
                      : "text-red-800 dark:text-red-200"
                  )}>
                    {reviewEligibility.canSubmit ? t('review.reviewLimitWarning') : t('review.reviewLimitBlocked')}
                  </h3>
                  <div className={cn(
                    "text-sm",
                    reviewEligibility.canSubmit 
                      ? "text-amber-700 dark:text-amber-300"
                      : "text-red-700 dark:text-red-300"
                  )}>
                    {reviewEligibility.existingReviews.length === 1 ? (
                      <>
                        <p className="mb-2">{t('review.existingReviewInfo')}</p>
                        <div 
                          className="bg-white dark:bg-gray-800 rounded-md p-3 border border-amber-200 dark:border-amber-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                          onClick={() => navigate(`/courses/${selectedCourse}?review_id=${reviewEligibility.existingReviews[0].$id}`)}
                          title={t('review.clickToViewReview')}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-muted-foreground">
                              {t('review.submittedOn')}: {formatDateTimeUTC8(reviewEligibility.existingReviews[0].$createdAt)} (UTC+8)
                            </span>
                            <GradeBadge grade={reviewEligibility.existingReviews[0].course_final_grade} />
                          </div>
                          <p className="text-sm">
                            {reviewEligibility.canSubmit 
                              ? t('review.canSubmitBecauseFailed')
                              : t('review.cannotSubmitBecausePassed')
                            }
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="mb-2">{t('review.multipleReviewsInfo')}</p>
                        <div className="space-y-2">
                          {reviewEligibility.existingReviews.map((review, index) => (
                            <div 
                              key={review.$id} 
                              className="bg-white dark:bg-gray-800 rounded-md p-3 border border-red-200 dark:border-red-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                              onClick={() => navigate(`/courses/${selectedCourse}?review_id=${review.$id}`)}
                              title={t('review.clickToViewReview')}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-muted-foreground">
                                  {t('review.reviewNumber', { number: index + 1 })} - {formatDateTimeUTC8(review.$createdAt)} (UTC+8)
                                </span>
                                <GradeBadge grade={review.course_final_grade} />
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="mt-2 text-sm">{t('review.reviewLimitExceededInfo')}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Course Evaluation */}
      <CollapsibleSection
        title={t('review.courseReview')}
        icon={<Star className="h-5 w-5" />}
        defaultExpanded={true}
        className="course-card"
        contentClassName="space-y-2"
        expandedHint={t('common.clickToCollapse') || 'Click to collapse'}
        collapsedHint={t('common.clickToExpand') || 'Click to expand'}
      >
          {/* Workload Rating */}
          <div className="space-y-1">
            {/* Description only shown on mobile, since desktop shows everything inline */}
            <p className="text-sm text-muted-foreground md:hidden">{t('review.workloadDescription')}</p>
            <FormStarRating rating={workload} onRatingChange={setWorkload} label={t('review.workload')} type="workload" t={t} required />
          </div>

          {/* Difficulty Rating */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground md:hidden">{t('review.difficultyDescription')}</p>
            <FormStarRating rating={difficulty} onRatingChange={setDifficulty} label={t('review.difficulty')} type="difficulty" t={t} required />
          </div>

          {/* Usefulness Rating */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground md:hidden">{t('review.usefulnessDescription')}</p>
            <FormStarRating rating={usefulness} onRatingChange={setUsefulness} label={t('review.usefulness')} type="usefulness" t={t} required />
          </div>

          {/* Grade - Desktop: inline, Mobile: stacked */}
          <div className="space-y-2 md:space-y-0">
            <div className="md:flex md:items-center md:gap-4">
              <Label htmlFor="grade" className="md:min-w-[120px] md:flex-shrink-0">
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
                  {t('review.notApplicable')}
                </Button>
                <Select value={grade === '-1' ? '' : grade} onValueChange={setGrade} disabled={grade === '-1'}>
                  <SelectTrigger className={cn("w-[180px]", grade === '-1' && "opacity-50 cursor-not-allowed")}>
                    <SelectValue placeholder={t('review.gradePlaceholder')} />
                  </SelectTrigger>
                <SelectContent className="font-mono min-w-[120px]">
                  <SelectItem value="A">
                    <div className="flex w-full">
                      <span className="w-6 text-left">A</span>
                      <span className="text-left">(4.00)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="A-">
                    <div className="flex w-full">
                      <span className="w-6 text-left">A-</span>
                      <span className="text-left">(3.67)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="B+">
                    <div className="flex w-full">
                      <span className="w-6 text-left">B+</span>
                      <span className="text-left">(3.33)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="B">
                    <div className="flex w-full">
                      <span className="w-6 text-left">B</span>
                      <span className="text-left">(3.00)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="B-">
                    <div className="flex w-full">
                      <span className="w-6 text-left">B-</span>
                      <span className="text-left">(2.67)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="C+">
                    <div className="flex w-full">
                      <span className="w-6 text-left">C+</span>
                      <span className="text-left">(2.33)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="C">
                    <div className="flex w-full">
                      <span className="w-6 text-left">C</span>
                      <span className="text-left">(2.00)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="C-">
                    <div className="flex w-full">
                      <span className="w-6 text-left">C-</span>
                      <span className="text-left">(1.67)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="D+">
                    <div className="flex w-full">
                      <span className="w-6 text-left">D+</span>
                      <span className="text-left">(1.33)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="D">
                    <div className="flex w-full">
                      <span className="w-6 text-left">D</span>
                      <span className="text-left">(1.00)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="F">
                    <div className="flex w-full">
                      <span className="w-6 text-left">F</span>
                      <span className="text-left">(0.00)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
                </Select>
              </div>

            </div>
          </div>

          {/* Course Comments */}
          <div className="space-y-3">
            <Label htmlFor="courseComments">
              {t('review.comments')} <span className="text-red-500">*</span>
            </Label>
            {renderCommonPhrases('course')}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Input Area */}
              <div className="relative">
                {renderFormattingToolbar(courseCommentsRef, setCourseComments)}
                <Textarea
                  ref={courseCommentsRef}
                  id="courseComments"
                  value={courseComments}
                  onChange={(e) => setCourseComments(e.target.value)}
                  placeholder={t('review.commentsPlaceholder')}
                  rows={4}
                  className="rounded-t-none border-t-0"
                />
                <WordCounter text={courseComments} minWords={5} maxWords={1000} />
              </div>
              
              {/* Live Preview */}
              {courseComments && (
                                 <div className="relative">
                   <div className="text-sm text-muted-foreground mb-2 font-medium">{t('review.formatting.livePreview')}</div>
                  <div className="border rounded-lg p-3 bg-muted/20 min-h-[120px]">
                    {hasMarkdownFormatting(courseComments) ? (
                      <div className="text-sm">{renderCommentMarkdown(courseComments)}</div>
                    ) : (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {courseComments}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Service Learning */}
          <div className="space-y-3">
            {/* Service learning is now handled per instructor, not at course level */}
          </div>
      </CollapsibleSection>

      {/* Instructor Evaluations */}
      {instructorEvaluations.length > 0 && (
        <div className="space-y-4">
          {instructorEvaluations.map((evaluation, index) => (
            <CollapsibleSection
              key={`${evaluation.instructorName}-${evaluation.sessionType}`}
              title={
                <div className="flex items-center gap-2">
                  <span>{t('review.instructorEvaluation')}: {evaluation.instructorName}</span>
                  <Badge variant="outline">
                    {evaluation.sessionType === 'Tutorial' ? t('review.tutorial') : 
                     evaluation.sessionType === 'Lecture' ? t('review.lecture') : 
                     evaluation.sessionType}
                  </Badge>
                </div>
              }
              icon={<Users className="h-5 w-5" />}
              defaultExpanded={true}
              className="course-card"
              contentClassName="space-y-2"
              expandedHint={t('common.clickToCollapse') || 'Click to collapse'}
              collapsedHint={t('common.clickToExpand') || 'Click to expand'}
            >
                {/* Teaching Score */}
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground md:hidden">{t('review.teachingScoreDescription')}</p>
                  <FormStarRating rating={evaluation.teachingScore} onRatingChange={(rating) => updateInstructorEvaluation(index, 'teachingScore', rating)} label={t('review.teachingScore')} type="teaching" t={t} required />
                </div>

                {/* Grading Score */}
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground md:hidden">{t('review.gradingScoreDescription')}</p>
                  <FormStarRating rating={evaluation.gradingScore} onRatingChange={(rating) => updateInstructorEvaluation(index, 'gradingScore', rating)} label={t('review.gradingScore')} type="grading" t={t} required />
                </div>

                {/* Course Requirements */}
                <div className="space-y-3">
                  <Label>
                    {t('review.courseRequirements')} <span className="text-red-500">*</span>
                  </Label>
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
                          id={`${index}-${key}`}
                          checked={evaluation[key as keyof InstructorEvaluation] as boolean}
                          onCheckedChange={(checked) => updateInstructorEvaluation(index, key as keyof InstructorEvaluation, checked)}
                        />
                        <Label htmlFor={`${index}-${key}`} className="text-sm">{label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Service Learning */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    {t('review.serviceLearning')}
                  </Label>
                  
                  {/* Service Learning Status Indicator */}
                  <div className="p-3 bg-muted/30 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${evaluation.hasServiceLearning ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <span className="text-sm font-medium">
                          {evaluation.hasServiceLearning ? t('review.hasServiceLearning') : t('review.noServiceLearning')}
                        </span>
                      </div>
                      {evaluation.hasServiceLearning && (
                        <span 
                          className={cn(
                            "inline-flex items-center px-1.5 py-0.5 rounded text-xs",
                            evaluation.serviceLearningType === 'compulsory'
                              ? "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
                              : "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
                          )}
                        >
                          {evaluation.serviceLearningType === 'compulsory' ? t('review.compulsory') : t('review.optional')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('review.serviceLearningAutoFilled')}
                    </p>
                  </div>

                  {/* Service Learning Description - only show if has service learning */}
                  {evaluation.hasServiceLearning && (
                    <div className="space-y-2">
                      <Label htmlFor={`serviceLearningDescription-${index}`}>
                        {t('review.serviceLearningDescription')}
                        {evaluation.serviceLearningType === 'compulsory' && (
                          <span className="text-destructive ml-1">*</span>
                        )}
                      </Label>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Input Area */}
                        <div className="relative">
                          {renderFormattingToolbar(
                            { current: null }, // We can add ref later if needed
                            (value: string) => updateInstructorEvaluation(index, 'serviceLearningDescription', value)
                          )}
                          <Textarea
                            id={`serviceLearningDescription-${index}`}
                            value={evaluation.serviceLearningDescription}
                            onChange={(e) => updateInstructorEvaluation(index, 'serviceLearningDescription', e.target.value)}
                            placeholder={
                              evaluation.serviceLearningType === 'optional' 
                                ? t('review.serviceLearningOptionalPlaceholder')
                                : t('review.serviceLearningPlaceholder')
                            }
                            rows={3}
                            className="rounded-t-none border-t-0"
                          />
                          <WordCounter 
                            text={evaluation.serviceLearningDescription} 
                            minWords={evaluation.serviceLearningType === 'compulsory' ? 5 : 0} 
                            maxWords={1000} 
                          />
                        </div>
                        
                        {/* Live Preview */}
                        {evaluation.serviceLearningDescription && (
                          <div className="relative">
                            <div className="text-sm text-muted-foreground mb-2 font-medium">{t('review.formatting.livePreview')}</div>
                            <div className="border rounded-lg p-3 bg-muted/20 min-h-[100px] text-xs">
                              {hasMarkdownFormatting(evaluation.serviceLearningDescription) ? (
                                <div className="text-xs">{renderCommentMarkdown(evaluation.serviceLearningDescription)}</div>
                              ) : (
                                <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                                  {evaluation.serviceLearningDescription}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Teaching Comments */}
                <div className="space-y-3">
                  <Label htmlFor={`teachingComments-${index}`}>
                    {t('review.teachingComments')} <span className="text-red-500">*</span>
                  </Label>
                  {renderCommonPhrases('teaching', index)}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Input Area */}
                    <div className="relative">
                      {renderFormattingToolbar(
                        { current: teachingCommentsRefs.current[index] || null },
                        (value: string) => updateInstructorEvaluation(index, 'comments', value)
                      )}
                      <Textarea
                        ref={(el) => {
                          teachingCommentsRefs.current[index] = el;
                        }}
                        id={`teachingComments-${index}`}
                        value={evaluation.comments}
                        onChange={(e) => updateInstructorEvaluation(index, 'comments', e.target.value)}
                        placeholder={t('review.teachingCommentsPlaceholder')}
                        rows={3}
                        className="rounded-t-none border-t-0"
                      />
                      <WordCounter text={evaluation.comments} minWords={5} maxWords={1000} />
                    </div>
                    
                    {/* Live Preview */}
                    {evaluation.comments && (
                      <div className="relative">
                        <div className="text-sm text-muted-foreground mb-2 font-medium">{t('review.formatting.livePreview')}</div>
                        <div className="border rounded-lg p-3 bg-muted/20 min-h-[100px] text-xs">
                          {hasMarkdownFormatting(evaluation.comments) ? (
                            <div className="text-xs">{renderCommentMarkdown(evaluation.comments)}</div>
                          ) : (
                            <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                              {evaluation.comments}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
            </CollapsibleSection>
          ))}
        </div>
      )}

      {/* Submission Options */}
      <CollapsibleSection
        title={t('review.submit')}
        icon={<CheckCircle className="h-5 w-5" />}
        defaultExpanded={true}
        className="course-card"
        contentClassName="space-y-3"
        expandedHint={t('common.clickToCollapse') || 'Click to collapse'}
        collapsedHint={t('common.clickToExpand') || 'Click to expand'}
      >
          <div className="space-y-3">
            {/* Review Language Selection */}
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Label htmlFor="reviewLanguage" className="min-w-[120px] flex-shrink-0">{t('review.language')}</Label>
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

            {/* Anonymous Option */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isAnonymous"
                  checked={isAnonymous}
                  onCheckedChange={(checked) => setIsAnonymous(checked === true)}
                />
                <Label htmlFor="isAnonymous">{t('review.anonymous')}</Label>
              </div>
              
              {/* Dynamic text based on anonymous checkbox */}
              <div className="text-sm text-muted-foreground ml-6">
                {isAnonymous 
                  ? t('review.anonymousDescription')
                  : t('review.publicDescription')
                }
              </div>
              
              {/* Notice when unchecking anonymous */}
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

            <Separator />

            {/* Required Fields Notice */}
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="text-red-500 text-lg font-bold mt-0.5">*</div>
                <div className="text-sm text-muted-foreground">
                  {t('review.requiredFieldsNotice')}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-6">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1 h-12 text-base font-medium"
                onClick={() => setIsPreviewMode(true)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {t('review.preview')}
              </Button>
              <Button 
                type="button" 
                disabled={submitting} 
                className="flex-1 h-12 text-base font-medium"
                onClick={handleSubmit}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('review.submitting')}
                  </>
                ) : (
                  editReviewId ? t('review.updateReview') : t('review.submitReview')
                )}
              </Button>
            </div>
          </div>
      </CollapsibleSection>
    </div>
  );
};

export default ReviewSubmissionForm;