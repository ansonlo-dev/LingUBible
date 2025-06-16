import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
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
  BookOpen,
  Calendar,
  Users,
  MessageSquare,
  CheckCircle,
  X
} from 'lucide-react';
import { CourseService, Course, Term, TeachingRecord, InstructorDetail, Review } from '@/services/api/courseService';

interface ReviewSubmissionFormProps {
  preselectedCourseCode?: string;
  editReviewId?: string;
}

interface InstructorEvaluation {
  instructorName: string;
  sessionType: string;
  teachingScore: number;
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

const ReviewSubmissionForm = ({ preselectedCourseCode, editReviewId }: ReviewSubmissionFormProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Loading states
  const [loading, setLoading] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [termsLoading, setTermsLoading] = useState(false);
  const [instructorsLoading, setInstructorsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Data states
  const [courses, setCourses] = useState<Course[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [availableInstructors, setAvailableInstructors] = useState<TeachingRecord[]>([]);

  // Form states
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [selectedInstructors, setSelectedInstructors] = useState<string[]>([]);
  
  // Course evaluation
  const [workload, setWorkload] = useState<number>(0);
  const [difficulty, setDifficulty] = useState<number>(0);
  const [usefulness, setUsefulness] = useState<number>(0);
  const [grade, setGrade] = useState<string>('');
  const [courseComments, setCourseComments] = useState<string>('');
  const [hasServiceLearning, setHasServiceLearning] = useState<boolean>(false);
  const [serviceLearningDescription, setServiceLearningDescription] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);

  // Instructor evaluations
  const [instructorEvaluations, setInstructorEvaluations] = useState<InstructorEvaluation[]>([]);

  // Edit mode states
  const [isEditMode, setIsEditMode] = useState<boolean>(!!editReviewId);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [loadingEditData, setLoadingEditData] = useState<boolean>(!!editReviewId);

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
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={() => navigate('/login')} className="flex-1">
                {t('review.loginToWrite')}
              </Button>
              <Button variant="outline" onClick={() => navigate('/courses')} className="flex-1">
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
    setServiceLearningDescription(reviewData.service_learning_description || '');
    setIsAnonymous(reviewData.is_anon || false);
    
    // Parse and set instructor evaluations if available
    if (reviewData.instructor_details) {
      try {
        const instructorDetails = JSON.parse(reviewData.instructor_details) as InstructorDetail[];
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
        // Extract instructor names for selection
        const instructorNames = instructorDetails.map(detail => detail.instructor_name);
        setSelectedInstructors(instructorNames);
      } catch (error) {
        console.error('Failed to parse instructor details:', error);
      }
    }
  };

  // Load review data for editing
  useEffect(() => {
    const loadEditData = async () => {
      if (!editReviewId) return;
      
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
  }, [editReviewId, t, toast, navigate]);

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
        setSelectedTerm(''); // Clear selected term when no course
        setSelectedInstructors([]); // Clear selected instructors when no course
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
        
        // Clear selected term and instructors when course changes
        setSelectedTerm('');
        setSelectedInstructors([]);
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
  }, [selectedCourse, t, toast]);

  // Clear instructors when term changes
  useEffect(() => {
    setSelectedInstructors([]);
  }, [selectedTerm]);

  // Load instructors when course and term are selected
  useEffect(() => {
    const loadInstructors = async () => {
      if (!selectedCourse || !selectedTerm) {
        setAvailableInstructors([]);
        setSelectedInstructors([]); // Clear selected instructors when no course/term
        return;
      }

      try {
        setInstructorsLoading(true);
        const teachingRecords = await CourseService.getCourseTeachingRecords(selectedCourse);
        const filteredRecords = teachingRecords.filter(record => record.term_code === selectedTerm);
        setAvailableInstructors(filteredRecords);
        
        // Remove any selected instructors that are not available for this course/term combination
        const validInstructorKeys = filteredRecords.map(record => `${record.instructor_name}|${record.session_type}`);
        setSelectedInstructors(prev => prev.filter(instructorKey => validInstructorKeys.includes(instructorKey)));
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
  }, [selectedCourse, selectedTerm, t, toast]);

  // Update instructor evaluations when selected instructors change
  useEffect(() => {
    const newEvaluations: InstructorEvaluation[] = selectedInstructors.map(instructorKey => {
      const [instructorName, sessionType] = instructorKey.split('|');
      const existing = instructorEvaluations.find(
        evaluation => evaluation.instructorName === instructorName && evaluation.sessionType === sessionType
      );
      
      return existing || {
        instructorName,
        sessionType,
        teachingScore: 0,
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
    
    setInstructorEvaluations(newEvaluations);
  }, [selectedInstructors]);

  const handleInstructorToggle = (instructorKey: string) => {
    setSelectedInstructors(prev => 
      prev.includes(instructorKey) 
        ? prev.filter(key => key !== instructorKey)
        : [...prev, instructorKey]
    );
  };

  const updateInstructorEvaluation = (index: number, field: keyof InstructorEvaluation, value: any) => {
    setInstructorEvaluations(prev => 
      prev.map((evaluation, i) => 
        i === index ? { ...evaluation, [field]: value } : evaluation
      )
    );
  };

  const renderStarRating = (rating: number, onRatingChange: (rating: number) => void, label: string, type: 'workload' | 'difficulty' | 'usefulness' | 'teaching' | 'grading' = 'teaching') => {
    const getDescription = (value: number) => {
      if (value === 0) return '';
      
      switch (type) {
        case 'workload':
          return t(`review.workload.${['', 'veryLight', 'light', 'moderate', 'heavy', 'veryHeavy'][value]}`);
        case 'difficulty':
          return t(`review.difficulty.${['', 'veryEasy', 'easy', 'moderate', 'hard', 'veryHard'][value]}`);
        case 'usefulness':
          return t(`review.usefulness.${['', 'notUseful', 'slightlyUseful', 'moderatelyUseful', 'veryUseful', 'extremelyUseful'][value]}`);
        case 'teaching':
        case 'grading':
        default:
          return t(`review.rating.${value}`);
      }
    };

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onRatingChange(star)}
              className="transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/20 rounded"
            >
              <Star
                className={`h-6 w-6 ${
                  star <= rating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300 hover:text-yellow-400'
                }`}
              />
            </button>
          ))}
          <span className="text-sm text-muted-foreground ml-2">
            {rating > 0 ? `${rating}/5 - ${getDescription(rating)}` : ''}
          </span>
        </div>
        {rating === 0 && (
          <p className="text-xs text-muted-foreground">
            {t('review.selectRating')}
          </p>
        )}
      </div>
    );
  };

  const validateForm = async (): Promise<boolean> => {
    if (!selectedCourse || !selectedTerm || selectedInstructors.length === 0) {
      toast({
        title: t('common.error'),
        description: t('review.fillRequired'),
        variant: 'destructive',
      });
      return false;
    }

    if (workload === 0 || difficulty === 0 || usefulness === 0) {
      toast({
        title: t('common.error'),
        description: t('review.fillRequired'),
        variant: 'destructive',
      });
      return false;
    }

    if (!grade.trim()) {
      toast({
        title: t('common.error'),
        description: t('review.fillRequired'),
        variant: 'destructive',
      });
      return false;
    }

    for (const evaluation of instructorEvaluations) {
      if (evaluation.teachingScore === 0) {
        toast({
          title: t('common.error'),
          description: t('review.fillRequired'),
          variant: 'destructive',
        });
        return false;
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
    if (!(await validateForm())) return;

    try {
      setSubmitting(true);

      const instructorDetails: InstructorDetail[] = instructorEvaluations.map(evaluation => ({
        instructor_name: evaluation.instructorName,
        session_type: evaluation.sessionType,
        grading: evaluation.gradingScore,
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
        service_learning_description: hasServiceLearning ? serviceLearningDescription : undefined,
        submitted_at: new Date().toISOString(),
        instructor_details: JSON.stringify(instructorDetails),
      };

      if (isEditMode && editReviewId) {
        // Update existing review
        await CourseService.updateReview(editReviewId, reviewData);
        toast({
          title: t('common.success'),
          description: t('review.updateSuccess'),
        });
        // Navigate back to my reviews page
        navigate('/my-reviews');
      } else {
        // Create new review
        await CourseService.createReview(reviewData);
        toast({
          title: t('common.success'),
          description: t('review.submitSuccess'),
        });
        // Navigate back to course detail page
        navigate(`/courses/${selectedCourse}`);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: t('common.error'),
        description: t('review.submitError'),
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="hover:bg-muted/50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEditMode ? t('review.editTitle') : t('review.title')}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode ? t('review.editSubtitle') : t('review.subtitle')}
          </p>
        </div>
      </div>

      {/* Course Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {t('review.courseInfo')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Course Selection */}
          <div className="space-y-2">
            <Label htmlFor="course">{t('review.selectCourse')} *</Label>
            <Select 
              value={selectedCourse} 
              onValueChange={setSelectedCourse} 
              disabled={coursesLoading || !!preselectedCourseCode}
            >
              <SelectTrigger>
                <SelectValue placeholder={coursesLoading ? t('review.loadingCourses') : t('review.selectCoursePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.$id} value={course.course_code}>
                    <div className="flex flex-col">
                      <span className="font-medium">{course.course_title}</span>
                      <span className="text-sm text-muted-foreground">{course.course_code}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {preselectedCourseCode && (
              <p className="text-xs text-muted-foreground">
                {t('review.coursePreselected')}
              </p>
            )}
          </div>

          {/* Term Selection */}
          <div className="space-y-2">
            <Label htmlFor="term">{t('review.selectTerm')} *</Label>
            <Select value={selectedTerm} onValueChange={setSelectedTerm} disabled={!selectedCourse || termsLoading}>
              <SelectTrigger>
                <SelectValue placeholder={termsLoading ? t('review.loadingTerms') : t('review.selectTermPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {terms.map((term) => (
                  <SelectItem key={term.$id} value={term.term_code}>
                    <div className="flex flex-col">
                      <span className="font-medium">{term.name}</span>
                      <span className="text-sm text-muted-foreground">{term.term_code}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Instructor Selection */}
          <div className="space-y-2">
            <Label>{t('review.selectInstructors')} *</Label>
            {instructorsLoading ? (
              <div className="flex items-center gap-2 p-3 border rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">{t('review.loadingInstructors')}</span>
              </div>
            ) : availableInstructors.length === 0 ? (
              <div className="p-3 border rounded-md text-center text-muted-foreground">
                {t('review.noInstructors')}
              </div>
            ) : (
              <div className="space-y-2 border rounded-md p-3">
                {availableInstructors.map((record) => {
                  const instructorKey = `${record.instructor_name}|${record.session_type}`;
                  const isSelected = selectedInstructors.includes(instructorKey);
                  
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
        </CardContent>
      </Card>

      {/* Course Evaluation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            {t('review.courseInfo')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Workload Rating */}
          <div className="space-y-2">
            <Label>{t('review.workload')} *</Label>
            <p className="text-sm text-muted-foreground">{t('review.workloadDescription')}</p>
            {renderStarRating(workload, setWorkload, t('review.workload'), 'workload')}
          </div>

          {/* Difficulty Rating */}
          <div className="space-y-2">
            <Label>{t('review.difficulty')} *</Label>
            <p className="text-sm text-muted-foreground">{t('review.difficultyDescription')}</p>
            {renderStarRating(difficulty, setDifficulty, t('review.difficulty'), 'difficulty')}
          </div>

          {/* Usefulness Rating */}
          <div className="space-y-2">
            <Label>{t('review.usefulness')} *</Label>
            <p className="text-sm text-muted-foreground">{t('review.usefulnessDescription')}</p>
            {renderStarRating(usefulness, setUsefulness, t('review.usefulness'), 'usefulness')}
          </div>

          {/* Grade */}
          <div className="space-y-2">
            <Label htmlFor="grade">{t('review.grade')} *</Label>
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger className="max-w-xs">
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

          {/* Course Comments */}
          <div className="space-y-2">
            <Label htmlFor="courseComments">{t('review.comments')}</Label>
            <Textarea
              id="courseComments"
              value={courseComments}
              onChange={(e) => setCourseComments(e.target.value)}
              placeholder={t('review.commentsPlaceholder')}
              rows={4}
            />
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
              <div className="space-y-2 ml-6">
                <Label htmlFor="serviceLearningDescription">{t('review.serviceLearningDescription')}</Label>
                <Textarea
                  id="serviceLearningDescription"
                  value={serviceLearningDescription}
                  onChange={(e) => setServiceLearningDescription(e.target.value)}
                  placeholder={t('review.serviceLearningPlaceholder')}
                  rows={3}
                />
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
              <CardContent className="space-y-6">
                {/* Teaching Score */}
                <div className="space-y-2">
                  <Label>{t('review.teachingScore')} *</Label>
                  <p className="text-sm text-muted-foreground">{t('review.teachingScoreDescription')}</p>
                  {renderStarRating(
                    evaluation.teachingScore,
                    (rating) => updateInstructorEvaluation(index, 'teachingScore', rating),
                    t('review.teachingScore'),
                    'teaching'
                  )}
                </div>

                {/* Grading Score */}
                <div className="space-y-2">
                  <Label>{t('review.gradingScore')}</Label>
                  <p className="text-sm text-muted-foreground">{t('review.gradingScoreDescription')}</p>
                  {renderStarRating(
                    evaluation.gradingScore || 0,
                    (rating) => updateInstructorEvaluation(index, 'gradingScore', rating),
                    t('review.gradingScore'),
                    'grading'
                  )}
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
                <div className="space-y-2">
                  <Label htmlFor={`teachingComments-${index}`}>{t('review.teachingComments')}</Label>
                  <Textarea
                    id={`teachingComments-${index}`}
                    value={evaluation.comments}
                    onChange={(e) => updateInstructorEvaluation(index, 'comments', e.target.value)}
                    placeholder={t('review.teachingCommentsPlaceholder')}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Submission Options */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Anonymous Option */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isAnonymous"
                checked={isAnonymous}
                onCheckedChange={(checked) => setIsAnonymous(checked === true)}
              />
              <Label htmlFor="isAnonymous">{t('review.anonymous')}</Label>
            </div>
            <p className="text-sm text-muted-foreground ml-6">
              {t('review.anonymousDescription')}
            </p>

            <Separator />

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 gradient-primary hover:opacity-90 text-white"
                size="lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isEditMode ? t('review.updating') : t('review.submitting')}
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {isEditMode ? t('review.updateReview') : t('review.submitReview')}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={submitting}
                size="lg"
              >
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReviewSubmissionForm;