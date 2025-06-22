import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Star, 
  ArrowLeft, 
  Loader2, 
  AlertCircle, 
  AlertTriangle,
  BookOpen,
  Calendar,
  Users,
  MessageSquare,
  CheckCircle,
  X,
  ChevronDown,
  ChevronUp,
  Mail,
  Sparkles,
  Smile,
  Frown,
  Eye,
  Edit,
  User,
  Brain,
  Target,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  GraduationCap
} from 'lucide-react';
import { CourseService, Course, Term, TeachingRecord, InstructorDetail, Review } from '@/services/api/courseService';
import { cn } from '@/lib/utils';
import { validateWordCount } from '@/utils/textUtils';
import { WordCounter } from '@/components/ui/word-counter';
import { renderCommentMarkdown, hasMarkdownFormatting } from '@/utils/ui/markdownRenderer';
import { ReviewAvatar } from '@/components/ui/review-avatar';
import { StarRating as UIStarRating } from '@/components/ui/star-rating';

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
  hasQuiz: boolean;
  hasGroupProject: boolean;
  hasIndividualAssignment: boolean;
  hasPresentation: boolean;
  hasReading: boolean;
  hasAttendanceRequirement: boolean;
}

// 新增 StarRating 組件
interface StarRatingProps {
  rating: number | null;
  onRatingChange: (rating: number | null) => void;
  label: string;
  type?: 'workload' | 'difficulty' | 'usefulness' | 'teaching' | 'grading';
  t: (key: string) => string;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, onRatingChange, label, type = 'teaching', t }) => {
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
        <Label className="text-sm font-medium min-w-[120px] flex-shrink-0">{label}</Label>
        
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
        <Label className="text-sm font-medium">{label}</Label>
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
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
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
  const [hasServiceLearning, setHasServiceLearning] = useState<boolean>(false);
  const [serviceLearningType, setServiceLearningType] = useState<'compulsory' | 'optional' | null>('compulsory');
  const [serviceLearningDescription, setServiceLearningDescription] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(true);
  const [reviewLanguage, setReviewLanguage] = useState<string>('en'); // Default to English

  // Instructor evaluations
  const [instructorEvaluations, setInstructorEvaluations] = useState<InstructorEvaluation[]>([]);

  // Edit mode states
  const [isEditMode, setIsEditMode] = useState<boolean>(!!editReviewId);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [isPopulatingEditData, setIsPopulatingEditData] = useState<boolean>(false);

  // Common phrases UI states
  const [coursePhrasesExpanded, setCoursePhrasesExpanded] = useState<boolean>(false);
  const [teachingPhrasesExpanded, setTeachingPhrasesExpanded] = useState<{[key: number]: boolean}>({});
  const [courseActiveTab, setCourseActiveTab] = useState<string>('content');
  const [teachingActiveTabs, setTeachingActiveTabs] = useState<{[key: number]: string}>({});

  // Textarea refs for formatting
  const courseCommentsRef = useRef<HTMLTextAreaElement>(null);
  const teachingCommentsRefs = useRef<{[key: number]: HTMLTextAreaElement | null}>({});
  const serviceLearningRef = useRef<HTMLTextAreaElement>(null);

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
              <Button onClick={() => navigate('/login')} className="w-full">
                {t('review.loginToWrite')}
              </Button>
              <Button variant="outline" onClick={() => navigate('/courses')} className="w-full">
                {t('review.backToCourses')}
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
    setHasServiceLearning(reviewData.has_service_learning || false);
    
    // Parse service learning type and description
    const slDescription = reviewData.service_learning_description || '';
    if (slDescription.startsWith('[COMPULSORY]')) {
      setServiceLearningType('compulsory');
      setServiceLearningDescription(slDescription.replace('[COMPULSORY] ', ''));
    } else if (slDescription.startsWith('[OPTIONAL]')) {
      setServiceLearningType('optional');
      setServiceLearningDescription(slDescription.replace('[OPTIONAL] ', ''));
    } else {
      setServiceLearningType('compulsory'); // Default
      setServiceLearningDescription(slDescription);
    }
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
          hasQuiz: detail.has_quiz || false,
          hasGroupProject: detail.has_group_project || false,
          hasIndividualAssignment: detail.has_individual_assignment || false,
          hasPresentation: detail.has_presentation || false,
          hasReading: detail.has_reading || false,
          hasAttendanceRequirement: detail.has_attendance_requirement || false
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
        hasQuiz: false,
        hasGroupProject: false,
        hasIndividualAssignment: false,
        hasPresentation: false,
        hasReading: false,
        hasAttendanceRequirement: false,
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

    // 如果有服務學習，檢查描述
    if (hasServiceLearning) {
      // 必修服務學習必須填寫描述
      if (serviceLearningType === 'compulsory' && !serviceLearningDescription.trim()) {
        toast({
          title: t('common.error'),
          description: t('review.fillAllFields'),
          variant: 'destructive',
        });
        return false;
      }
      
      // 如果有填寫服務學習描述，檢查字數
      if (serviceLearningDescription.trim()) {
        const minWords = serviceLearningType === 'compulsory' ? 5 : 0;
        const serviceLearningValidation = validateWordCount(serviceLearningDescription, minWords, 1000);
        if (!serviceLearningValidation.isValid) {
          toast({
            title: t('common.error'),
            description: serviceLearningType === 'compulsory' 
              ? t('review.wordCount.serviceLearningRequired')
              : t('review.wordCount.serviceLearningOptional'),
            variant: 'destructive',
          });
          return false;
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
        has_quiz: evaluation.hasQuiz,
        has_group_project: evaluation.hasGroupProject,
        has_individual_assignment: evaluation.hasIndividualAssignment,
        has_presentation: evaluation.hasPresentation,
        has_reading: evaluation.hasReading,
        has_attendance_requirement: evaluation.hasAttendanceRequirement,
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
        has_service_learning: hasServiceLearning,
        service_learning_description: hasServiceLearning ? 
          `[${serviceLearningType?.toUpperCase() || 'UNSPECIFIED'}] ${serviceLearningDescription}` : undefined,
        submitted_at: new Date().toISOString(),
        instructor_details: JSON.stringify(instructorDetails),
        review_language: reviewLanguage,
      };

      console.log('📋 Review data prepared:', reviewData);

      if (isEditMode && editReviewId) {
        console.log('✏️ Updating existing review...');
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
          <div className="border rounded-lg p-4 space-y-4">
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
                </div>
                <Badge variant="outline" className="text-xs w-fit">
                  <Calendar className="h-3 w-3 mr-1 shrink-0" />
                  <span className="truncate">{mockTerm.name}</span>
                </Badge>
              </div>
              {/* 最終成績 - 右上角大顯示 */}
              {grade && grade !== '-1' && (
                <div className="flex flex-col items-center shrink-0">
                  <Badge variant="default" className="text-lg font-bold w-10 h-10 rounded-full flex items-center justify-center bg-primary text-primary-foreground">
                    {grade}
                  </Badge>
                </div>
              )}
            </div>

            {/* 課程評分 */}
            <div className="grid grid-cols-3 gap-1 text-xs">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <BookOpen className="h-3 w-3 text-primary" />
                  <span className="font-medium text-sm sm:text-base">{t('review.workload')}</span>
                </div>
                {workload === null ? (
                  <span className="text-muted-foreground">{t('review.rating.notRated')}</span>
                ) : workload === -1 ? (
                  <span className="text-muted-foreground">{t('review.notApplicable')}</span>
                ) : (
                  <UIStarRating rating={workload} showValue size="sm" />
                )}
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Brain className="h-3 w-3 text-primary" />
                  <span className="font-medium text-sm sm:text-base">{t('review.difficulty')}</span>
                </div>
                {difficulty === null ? (
                  <span className="text-muted-foreground">{t('review.rating.notRated')}</span>
                ) : difficulty === -1 ? (
                  <span className="text-muted-foreground">{t('review.notApplicable')}</span>
                ) : (
                  <UIStarRating rating={difficulty} showValue size="sm" />
                )}
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Target className="h-3 w-3 text-primary" />
                  <span className="font-medium text-sm sm:text-base">{t('review.usefulness')}</span>
                </div>
                {usefulness === null ? (
                  <span className="text-muted-foreground">{t('review.rating.notRated')}</span>
                ) : usefulness === -1 ? (
                  <span className="text-muted-foreground">{t('review.notApplicable')}</span>
                ) : (
                  <UIStarRating rating={usefulness} showValue size="sm" />
                )}
              </div>
            </div>

            {/* 課程評論 */}
            {courseComments && (
              <>
                <Separator />
                <div className="min-w-0">
                  <h5 className="text-sm font-medium mb-2">{t('review.courseComments')}</h5>
                  <div className="bg-muted/50 p-3 rounded-md break-words">
                    {hasMarkdownFormatting(courseComments) ? (
                      renderCommentMarkdown(courseComments)
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {courseComments}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* 服務學習 */}
            {hasServiceLearning && (
              <>
                <Separator />
                <div>
                  <Badge variant="default" className="mb-2">
                    {t('review.serviceLearning')}
                  </Badge>
                  {serviceLearningType && (
                    <Badge variant="outline" className="ml-2">
                      {serviceLearningType === 'compulsory' ? t('review.compulsory') : t('review.optional')}
                    </Badge>
                  )}
                  {serviceLearningDescription && (
                    <div className="mt-2 bg-muted/50 p-3 rounded-md break-words">
                      {hasMarkdownFormatting(serviceLearningDescription) ? (
                        renderCommentMarkdown(serviceLearningDescription)
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {serviceLearningDescription}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* 講師評價 */}
            {instructorEvaluations.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h5 className="text-sm font-medium">{t('review.instructorEvaluation')}</h5>
                  {instructorEvaluations.map((instructor, index) => (
                    <div key={index} className="p-3 rounded-md space-y-3 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/30 dark:to-indigo-950/30 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{instructor.instructorName}</span>
                        <Badge variant="outline">{instructor.sessionType}</Badge>
                      </div>
                      
                      {/* 教學評分 - 緊湊的2列佈局 */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <GraduationCap className="h-3 w-3 text-primary" />
                            <span className="font-medium text-sm sm:text-base">{t('card.teaching')}</span>
                          </div>
                          {instructor.teachingScore === null ? (
                            <span className="text-muted-foreground">{t('review.rating.notRated')}</span>
                          ) : instructor.teachingScore === -1 ? (
                            <span className="text-muted-foreground">{t('review.notApplicable')}</span>
                          ) : (
                            <UIStarRating rating={instructor.teachingScore} showValue size="sm" />
                          )}
                        </div>
                        
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Target className="h-3 w-3 text-primary" />
                            <span className="font-medium text-sm sm:text-base">{t('card.grading')}</span>
                          </div>
                          {instructor.gradingScore === null ? (
                            <span className="text-muted-foreground">{t('review.rating.notRated')}</span>
                          ) : instructor.gradingScore === -1 ? (
                            <span className="text-muted-foreground">{t('review.notApplicable')}</span>
                          ) : (
                            <UIStarRating rating={instructor.gradingScore} showValue size="sm" />
                          )}
                        </div>
                      </div>

                      {/* 課程要求 */}
                      <div className="space-y-2">
                        <h6 className="text-sm font-medium">{t('review.courseRequirements')}</h6>
                        <div className="flex flex-wrap gap-2">
                          {instructor.hasMidterm && <Badge variant="secondary">{t('review.requirements.midterm')}</Badge>}
                          {instructor.hasQuiz && <Badge variant="secondary">{t('review.requirements.quiz')}</Badge>}
                          {instructor.hasGroupProject && <Badge variant="secondary">{t('review.requirements.groupProject')}</Badge>}
                          {instructor.hasIndividualAssignment && <Badge variant="secondary">{t('review.requirements.individualAssignment')}</Badge>}
                          {instructor.hasPresentation && <Badge variant="secondary">{t('review.requirements.presentation')}</Badge>}
                          {instructor.hasReading && <Badge variant="secondary">{t('review.requirements.reading')}</Badge>}
                          {instructor.hasAttendanceRequirement && <Badge variant="secondary">{t('review.requirements.attendance')}</Badge>}
                        </div>
                      </div>

                      {/* 教學評論 */}
                      {instructor.comments && (
                        <div>
                          <h6 className="text-sm font-medium mb-2">{t('review.teachingComments')}</h6>
                          <div className="bg-background/50 p-3 rounded-md break-words">
                            {hasMarkdownFormatting(instructor.comments) ? (
                              renderCommentMarkdown(instructor.comments)
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                {instructor.comments}
                              </p>
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
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
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
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
      </div>

      {/* Course Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {t('review.courseInfo')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Course Selection - Desktop: inline, Mobile: stacked */}
          <div className="space-y-2 md:space-y-0">
            <div className="md:flex md:items-center md:gap-4">
              <Label htmlFor="course" className="md:min-w-[120px] md:flex-shrink-0">{t('review.selectCourse')}</Label>
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
              <Label htmlFor="term" className="md:min-w-[120px] md:flex-shrink-0">{t('review.selectTerm')}</Label>
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
              <Label className="md:min-w-[120px] md:flex-shrink-0 md:pt-3">{t('review.selectInstructors')}</Label>
              <div className="md:flex-1">
                {instructorsLoading ? (
                  <div className="flex items-center gap-2 p-3 border rounded-md">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">{t('review.loadingInstructors')}</span>
                  </div>
                ) : availableInstructors.length === 0 ? (
                  <div className="flex items-center justify-center h-10 px-3 border rounded-md text-center text-muted-foreground opacity-50 cursor-not-allowed">
                    {t('review.noInstructors')}
                  </div>
                ) : (
                  <div className="space-y-2 border rounded-md p-3">
                    {availableInstructors
                      .sort((a, b) => {
                        // Sort by session type first, then by instructor name
                        const typeOrder = { 'Lecture': 0, 'Tutorial': 1, 'Lab': 2, 'Seminar': 3 };
                        const aTypeOrder = typeOrder[a.session_type as keyof typeof typeOrder] ?? 999;
                        const bTypeOrder = typeOrder[b.session_type as keyof typeof typeOrder] ?? 999;
                        
                        if (aTypeOrder !== bTypeOrder) {
                          return aTypeOrder - bTypeOrder;
                        }
                        
                        // If same type, sort by instructor name alphabetically
                        return a.instructor_name.localeCompare(b.instructor_name);
                      })
                      .map((record) => {
                        const instructorKey = `${record.instructor_name}|${record.session_type}`;
                        const isSelected = selectedInstructors.includes(instructorKey);
                        
                        // Debug logging
                        if (editReviewId) {
                          console.log(`🎯 Instructor ${instructorKey}: selected=${isSelected}, selectedInstructors=`, selectedInstructors);
                        }
                        
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
                                <Badge variant="outline" className="text-xs">
                                  {record.session_type}
                                </Badge>
                              </div>
                            </Label>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course Evaluation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            {t('review.courseReview')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Workload Rating */}
          <div className="space-y-1">
            {/* Description only shown on mobile, since desktop shows everything inline */}
            <p className="text-sm text-muted-foreground md:hidden">{t('review.workloadDescription')}</p>
            <StarRating rating={workload} onRatingChange={setWorkload} label={t('review.workload')} type="workload" t={t} />
          </div>

          {/* Difficulty Rating */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground md:hidden">{t('review.difficultyDescription')}</p>
            <StarRating rating={difficulty} onRatingChange={setDifficulty} label={t('review.difficulty')} type="difficulty" t={t} />
          </div>

          {/* Usefulness Rating */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground md:hidden">{t('review.usefulnessDescription')}</p>
            <StarRating rating={usefulness} onRatingChange={setUsefulness} label={t('review.usefulness')} type="usefulness" t={t} />
          </div>

          {/* Grade - Desktop: inline, Mobile: stacked */}
          <div className="space-y-2 md:space-y-0">
            <div className="md:flex md:items-center md:gap-4">
              <Label htmlFor="grade" className="md:min-w-[120px] md:flex-shrink-0">{t('review.grade')}</Label>
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
            <Label htmlFor="courseComments">{t('review.comments')}</Label>
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
                      renderCommentMarkdown(courseComments)
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
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasServiceLearning"
                checked={hasServiceLearning}
                onCheckedChange={(checked) => setHasServiceLearning(checked === true)}
              />
              <Label htmlFor="hasServiceLearning">{t('review.hasServiceLearning')}</Label>
            </div>
            
            {hasServiceLearning && (
              <div className="space-y-3 ml-6">
                {/* Service Learning Type */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setServiceLearningType(serviceLearningType === 'compulsory' ? null : 'compulsory')}
                      className={cn(
                        "text-xs border transition-colors",
                        serviceLearningType === 'compulsory'
                          ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                          : "border-border hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      {t('review.compulsory')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setServiceLearningType(serviceLearningType === 'optional' ? null : 'optional')}
                      className={cn(
                        "text-xs border transition-colors",
                        serviceLearningType === 'optional'
                          ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                          : "border-border hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      {t('review.optional')}
                    </Button>
                  </div>
                </div>
                
                {/* Service Learning Description */}
                <div className="space-y-2">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Input Area */}
                    <div className="relative">
                      {renderFormattingToolbar(serviceLearningRef, setServiceLearningDescription)}
                      <Textarea
                        ref={serviceLearningRef}
                        id="serviceLearningDescription"
                        value={serviceLearningDescription}
                        onChange={(e) => setServiceLearningDescription(e.target.value)}
                        placeholder={
                          serviceLearningType === 'optional' 
                            ? t('review.serviceLearningOptionalPlaceholder')
                            : serviceLearningType === 'compulsory'
                            ? t('review.serviceLearningPlaceholder')
                            : t('review.serviceLearningOptionalPlaceholder')
                        }
                        rows={3}
                        className="rounded-t-none border-t-0"
                      />
                      <WordCounter text={serviceLearningDescription} minWords={serviceLearningType === 'compulsory' ? 5 : 0} maxWords={1000} />
                    </div>
                    
                    {/* Live Preview */}
                    {serviceLearningDescription && (
                      <div className="relative">
                        <div className="text-sm text-muted-foreground mb-2 font-medium">{t('review.formatting.livePreview')}</div>
                        <div className="border rounded-lg p-3 bg-muted/20 min-h-[100px]">
                          {hasMarkdownFormatting(serviceLearningDescription) ? (
                            renderCommentMarkdown(serviceLearningDescription)
                          ) : (
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {serviceLearningDescription}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instructor Evaluations */}
      {instructorEvaluations.length > 0 && (
        <div className="space-y-4">
          {instructorEvaluations.map((evaluation, index) => (
            <Card key={`${evaluation.instructorName}-${evaluation.sessionType}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {t('review.instructorEvaluation')}: {evaluation.instructorName}
                  <Badge variant="outline">{evaluation.sessionType}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Teaching Score */}
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground md:hidden">{t('review.teachingScoreDescription')}</p>
                  <StarRating rating={evaluation.teachingScore} onRatingChange={(rating) => updateInstructorEvaluation(index, 'teachingScore', rating)} label={t('review.teachingScore')} type="teaching" t={t} />
                </div>

                {/* Grading Score */}
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground md:hidden">{t('review.gradingScoreDescription')}</p>
                  <StarRating rating={evaluation.gradingScore} onRatingChange={(rating) => updateInstructorEvaluation(index, 'gradingScore', rating)} label={t('review.gradingScore')} type="grading" t={t} />
                </div>

                {/* Course Requirements */}
                <div className="space-y-3">
                  <Label>{t('review.courseRequirements')}</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { key: 'hasMidterm', label: t('review.hasMidterm') },
                      { key: 'hasQuiz', label: t('review.hasQuiz') },
                      { key: 'hasGroupProject', label: t('review.hasGroupProject') },
                      { key: 'hasIndividualAssignment', label: t('review.hasIndividualAssignment') },
                      { key: 'hasPresentation', label: t('review.hasPresentation') },
                      { key: 'hasReading', label: t('review.hasReading') },
                      { key: 'hasAttendanceRequirement', label: t('review.hasAttendanceRequirement') },
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

                {/* Teaching Comments */}
                <div className="space-y-3">
                  <Label htmlFor={`teachingComments-${index}`}>{t('review.teachingComments')}</Label>
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
                        <div className="border rounded-lg p-3 bg-muted/20 min-h-[100px]">
                          {hasMarkdownFormatting(evaluation.comments) ? (
                            renderCommentMarkdown(evaluation.comments)
                          ) : (
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {evaluation.comments}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Submission Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            {t('review.submit')}
          </CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default ReviewSubmissionForm;