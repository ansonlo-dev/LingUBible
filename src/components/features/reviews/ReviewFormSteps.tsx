import React, { useMemo } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  BookText, 
  User, 
  MessageSquare, 
  Eye, 
  ChevronDown,
  ChevronUp,
  Smile,
  Frown,
  Calendar,
  Users,
  Award,
  Target
} from 'lucide-react';
import { CourseService, Course, Term, TeachingRecord, Instructor } from '@/services/api/courseService';
import { GradeBadge } from '@/components/ui/GradeBadge';
import { HybridMarkdownEditor } from '@/components/ui/hybrid-markdown-editor';
import { renderCommentMarkdown, hasMarkdownFormatting } from '@/utils/ui/markdownRenderer';
import { validateWordCount } from '@/utils/textUtils';
import { InstructorEvaluation } from './types/ReviewSubmissionForm.types';
import FormStarRating from './FormStarRating';
import { formatDateTimeUTC8 } from '@/utils/ui/dateUtils';
import { ReviewAvatar } from '@/components/ui/review-avatar';
import { StarRating as UIStarRating } from '@/components/ui/star-rating';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { getTeachingLanguageName, extractInstructorNameForSorting, getInstructorName } from '@/utils/textUtils';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { VotingButtons } from '@/components/ui/voting-buttons';
import { ReviewFormState } from './hooks/useReviewFormState';

interface ReviewFormStepsProps {
  // State from useReviewFormState
  state: ReviewFormState;
  
  // Additional props from parent component
  filteredCourses: Course[];
  availableSessionTypes: string[];
  filteredInstructorsBySelection: TeachingRecord[];
  instructorsBySessionType: Record<string, TeachingRecord[]>;
  
  // Teaching languages data
  previewTeachingLanguages: any;
  previewCurrentTermTeachingLanguages: any;
  previewTeachingLanguagesLoading: boolean;
  previewTeachingLanguagesError: any;
  allTeachingLanguages: any;
  allCurrentTermTeachingLanguages: any;
  allTeachingLanguagesLoading: boolean;
  allTeachingLanguagesError: any;
  
  // Validation functions
  validateCourseSelectionStep: () => boolean;
  validateCourseReviewStep: () => boolean;
  validateInstructorEvaluationsStep: () => boolean;
  validateSingleInstructorEvaluation: (index: number) => boolean;
  validateSubmissionStep: () => boolean;
  
  // Event handlers
  onInstructorEvaluationChange: (index: number, field: keyof InstructorEvaluation, value: any) => void;
  onInstructorSelectionChange: (instructorKey: string, selected: boolean) => void;
  
  // Other required data and functions
  preselectedCourseCode?: string;
  isEditMode: boolean;
  reviewEligibility: any;
  getCachedTeachingRecords: (courseCode: string) => Promise<TeachingRecord[]>;
  batchLoadTerms: (termCodes: string[]) => Promise<Map<string, Term>>;
  batchLoadInstructors: (instructorNames: string[]) => Promise<Map<string, Instructor>>;
  
  // UI state handlers
  onCoursePhrasesToggle: () => void;
  onTeachingPhrasesToggle: (index: number) => void;
  onCourseTabChange: (tab: string) => void;
  onTeachingTabChange: (index: number, tab: string) => void;
  onInstructorTabChange: (tab: string) => void;
}

export const ReviewFormSteps: React.FC<ReviewFormStepsProps> = ({
  state,
  filteredCourses,
  availableSessionTypes,
  filteredInstructorsBySelection,
  instructorsBySessionType,
  previewTeachingLanguages,
  previewCurrentTermTeachingLanguages,
  previewTeachingLanguagesLoading,
  previewTeachingLanguagesError,
  allTeachingLanguages,
  allCurrentTermTeachingLanguages,
  allTeachingLanguagesLoading,
  allTeachingLanguagesError,
  validateCourseSelectionStep,
  validateCourseReviewStep,
  validateInstructorEvaluationsStep,
  validateSingleInstructorEvaluation,
  validateSubmissionStep,
  onInstructorEvaluationChange,
  onInstructorSelectionChange,
  preselectedCourseCode,
  isEditMode,
  reviewEligibility,
  getCachedTeachingRecords,
  batchLoadTerms,
  batchLoadInstructors,
  onCoursePhrasesToggle,
  onTeachingPhrasesToggle,
  onCourseTabChange,
  onTeachingTabChange,
  onInstructorTabChange,
}) => {
  const { t, language } = useLanguage();

  const {
    coursesLoading,
    termsLoading,
    instructorsLoading,
    courses,
    terms,
    availableInstructors,
    instructorsMap,
    selectedCourse,
    setSelectedCourse,
    selectedTerm,
    setSelectedTerm,
    selectedInstructors,
    setSelectedInstructors,
    workload,
    setWorkload,
    difficulty,
    setDifficulty,
    usefulness,
    setUsefulness,
    grade,
    setGrade,
    courseComments,
    setCourseComments,
    isAnonymous,
    setIsAnonymous,
    reviewLanguage,
    setReviewLanguage,
    previewTimestamp,
    instructorEvaluations,
    coursePhrasesExpanded,
    teachingPhrasesExpanded,
    courseActiveTab,
    teachingActiveTabs,
    activeInstructorTab,
  } = state;

  // Generate the steps array
  const steps = useMemo(() => {
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
                  <SelectValue placeholder={coursesLoading ? t('review.loadingCourses') : t('review.selectCoursePlaceholder')}>
                    <div className="w-full overflow-hidden">
                      <div className="truncate">
                        {selectedCourse ? 
                          courses?.find(c => c.course_code === selectedCourse)?.course_code + " - " + 
                          courses?.find(c => c.course_code === selectedCourse)?.course_title : 
                          (coursesLoading ? t("review.loadingCourses") : t("review.selectCoursePlaceholder"))
                        }
                      </div>
                    </div>
                  </SelectValue>
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

          {/* Term Selection */}
          <div className="space-y-2 md:space-y-0">
            <div className="md:flex md:items-center md:gap-4">
              <Label htmlFor="term" className="md:min-w-[120px] md:flex-shrink-0 font-bold">
                {t('review.selectTerm')} <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={selectedTerm} 
                onValueChange={setSelectedTerm} 
                disabled={termsLoading || !selectedCourse}
              >
                <SelectTrigger className="md:flex-1">
                  <SelectValue placeholder={termsLoading ? t('review.loadingTerms') : t('review.selectTermPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {terms.map((term) => (
                    <SelectItem key={term.$id} value={term.term_code}>
                      {term.term_name} ({term.term_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Instructor Selection */}
          {selectedCourse && selectedTerm && (
            <div className="space-y-3">
              <Label className="font-bold">
                {t('review.selectInstructors')} <span className="text-red-500">*</span>
              </Label>
              
              {instructorsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">{t('review.loadingInstructors')}</p>
                  </div>
                </div>
              ) : availableInstructors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>{t('review.noInstructorsFound')}</p>
                </div>
              ) : (
                <Tabs value={activeInstructorTab} onValueChange={onInstructorTabChange} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    {availableSessionTypes.map((sessionType) => (
                      <TabsTrigger key={sessionType} value={sessionType}>
                        {t(`review.${sessionType.toLowerCase()}`) || sessionType}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {availableSessionTypes.map((sessionType) => (
                    <TabsContent key={sessionType} value={sessionType} className="space-y-2">
                      {(instructorsBySessionType[sessionType] || []).map((instructor) => {
                        const instructorKey = `${instructor.instructor_name}|${instructor.session_type}`;
                        const isSelected = selectedInstructors.includes(instructorKey);
                        const teachingLanguages = allTeachingLanguages?.[instructor.instructor_name] || [];
                        
                        return (
                          <div key={instructorKey} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => onInstructorSelectionChange(instructorKey, !!checked)}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium truncate">
                                  {getInstructorName(instructor.instructor_name, language)}
                                </span>
                                {teachingLanguages.length > 0 && (
                                  <div className="flex gap-1">
                                    {teachingLanguages.slice(0, 2).map((lang: string) => (
                                      <Badge key={lang} variant="outline" className="text-xs">
                                        {getTeachingLanguageName(lang)}
                                      </Badge>
                                    ))}
                                    {teachingLanguages.length > 2 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{teachingLanguages.length - 2}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {sessionType}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </div>
          )}

          {/* Review Eligibility Warning */}
          {!isEditMode && reviewEligibility && !reviewEligibility.canSubmit && (
            <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    <strong>{t('review.eligibilityWarning')}</strong>
                  </p>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                    {reviewEligibility.reason}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        )
      },
      
      {
        id: 'course-review',
        title: t('review.courseEvaluation'),
        icon: <MessageSquare className="h-5 w-5" />,
        isValid: validateCourseReviewStep,
        content: (
          <div className="space-y-6">
            {/* Course Rating Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('review.courseRating')}</h3>
              
              {/* Workload Rating */}
              <FormStarRating
                rating={workload}
                onRatingChange={setWorkload}
                label={t('review.workload')}
                type="workload"
                t={t}
                required
              />
              
              {/* Difficulty Rating */}
              <FormStarRating
                rating={difficulty}
                onRatingChange={setDifficulty}
                label={t('review.difficulty')}
                type="difficulty"
                t={t}
                required
              />
              
              {/* Usefulness Rating */}
              <FormStarRating
                rating={usefulness}
                onRatingChange={setUsefulness}
                label={t('review.usefulness')}
                type="usefulness"
                t={t}
                required
              />
            </div>

            {/* Grade Selection */}
            <div className="space-y-2">
              <Label className="font-bold">
                {t('review.finalGrade')} <span className="text-red-500">*</span>
              </Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger>
                  <SelectValue placeholder={t('review.selectGrade')} />
                </SelectTrigger>
                <SelectContent>
                  {['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'].map((gradeOption) => (
                    <SelectItem key={gradeOption} value={gradeOption}>
                      <div className="flex items-center gap-2">
                        <GradeBadge grade={gradeOption} />
                        <span>{gradeOption}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Course Comments */}
            <div className="space-y-2">
              <Label className="font-bold">
                {t('review.courseComments')} <span className="text-red-500">*</span>
              </Label>
              
              {/* Common Phrases */}
              <CollapsibleSection
                isExpanded={coursePhrasesExpanded}
                onToggle={onCoursePhrasesToggle}
                title={t('review.commonPhrases')}
                className="mb-3"
              >
                <Tabs value={courseActiveTab} onValueChange={onCourseTabChange} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="content">{t('review.content')}</TabsTrigger>
                    <TabsTrigger value="assessment">{t('review.assessment')}</TabsTrigger>
                    <TabsTrigger value="general">{t('review.general')}</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="content" className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        t('review.phrases.content.interesting'),
                        t('review.phrases.content.practical'),
                        t('review.phrases.content.challenging'),
                        t('review.phrases.content.wellStructured'),
                        t('review.phrases.content.upToDate'),
                        t('review.phrases.content.comprehensive'),
                      ].map((phrase) => (
                        <Button
                          key={phrase}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const currentText = courseComments;
                            const newText = currentText ? `${currentText} ${phrase}` : phrase;
                            setCourseComments(newText);
                          }}
                          className="justify-start text-left h-auto py-2 px-3"
                        >
                          {phrase}
                        </Button>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="assessment" className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        t('review.phrases.assessment.fair'),
                        t('review.phrases.assessment.clear'),
                        t('review.phrases.assessment.reasonable'),
                        t('review.phrases.assessment.challenging'),
                        t('review.phrases.assessment.wellDesigned'),
                        t('review.phrases.assessment.timely'),
                      ].map((phrase) => (
                        <Button
                          key={phrase}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const currentText = courseComments;
                            const newText = currentText ? `${currentText} ${phrase}` : phrase;
                            setCourseComments(newText);
                          }}
                          className="justify-start text-left h-auto py-2 px-3"
                        >
                          {phrase}
                        </Button>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="general" className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        t('review.phrases.general.recommend'),
                        t('review.phrases.general.worthTaking'),
                        t('review.phrases.general.goodExperience'),
                        t('review.phrases.general.learned'),
                        t('review.phrases.general.enjoyable'),
                        t('review.phrases.general.satisfied'),
                      ].map((phrase) => (
                        <Button
                          key={phrase}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const currentText = courseComments;
                            const newText = currentText ? `${currentText} ${phrase}` : phrase;
                            setCourseComments(newText);
                          }}
                          className="justify-start text-left h-auto py-2 px-3"
                        >
                          {phrase}
                        </Button>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CollapsibleSection>

              <HybridMarkdownEditor
                value={courseComments}
                onChange={setCourseComments}
                placeholder={t('review.courseCommentsPlaceholder')}
                minRows={4}
                className="min-h-[120px]"
              />
              <div className="text-xs text-muted-foreground">
                {validateWordCount(courseComments).isValid ? 
                  `${validateWordCount(courseComments).wordCount}/1000 ${t('review.words')}` :
                  <span className="text-red-500">
                    {t('review.wordLimitExceeded')} ({validateWordCount(courseComments).wordCount}/1000)
                  </span>
                }
              </div>
            </div>
          </div>
        )
      }
    ];

    // Add instructor evaluation steps
    const instructorSteps = instructorEvaluations.map((evaluation, index) => ({
      id: `instructor-${index}`,
      title: `${t('review.instructor')} ${index + 1}: ${evaluation.instructorName}`,
      subtitle: evaluation.sessionType,
      icon: <User className="h-5 w-5" />,
      isValid: () => validateSingleInstructorEvaluation(index),
      content: (
        <div className="space-y-6">
          {/* Instructor Info Header */}
          <div className="bg-muted/20 dark:bg-muted/10 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <User className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold">{evaluation.instructorName}</h3>
                <p className="text-sm text-muted-foreground">{evaluation.sessionType}</p>
              </div>
            </div>
            
            {/* Teaching Languages */}
            {previewTeachingLanguages?.[evaluation.instructorName] && (
              <div className="flex gap-1 mt-2">
                {previewTeachingLanguages[evaluation.instructorName].slice(0, 3).map((lang: string) => (
                  <Badge key={lang} variant="outline" className="text-xs">
                    {getTeachingLanguageName(lang)}
                  </Badge>
                ))}
                {previewTeachingLanguages[evaluation.instructorName].length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{previewTeachingLanguages[evaluation.instructorName].length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Teaching and Grading Ratings */}
          <div className="space-y-4">
            <FormStarRating
              rating={evaluation.teachingScore}
              onRatingChange={(value) => onInstructorEvaluationChange(index, 'teachingScore', value)}
              label={t('review.teachingQuality')}
              type="teaching"
              t={t}
              required
            />
            
            <FormStarRating
              rating={evaluation.gradingScore}
              onRatingChange={(value) => onInstructorEvaluationChange(index, 'gradingScore', value)}
              label={t('review.gradingFairness')}
              type="grading"
              t={t}
              required
            />
          </div>

          {/* Course Requirements */}
          <div className="space-y-3">
            <Label className="font-bold">{t('review.courseRequirements')} <span className="text-red-500">*</span></Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'hasMidterm', label: t('review.midterm') },
                { key: 'hasFinal', label: t('review.final') },
                { key: 'hasQuiz', label: t('review.quiz') },
                { key: 'hasGroupProject', label: t('review.groupProject') },
                { key: 'hasIndividualAssignment', label: t('review.individualAssignment') },
                { key: 'hasPresentation', label: t('review.presentation') },
                { key: 'hasReading', label: t('review.reading') },
                { key: 'hasAttendanceRequirement', label: t('review.attendance') },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    checked={evaluation[key as keyof InstructorEvaluation] as boolean}
                    onCheckedChange={(checked) => onInstructorEvaluationChange(index, key as keyof InstructorEvaluation, checked)}
                  />
                  <span className="text-sm">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Service Learning */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={evaluation.hasServiceLearning}
                onCheckedChange={(checked) => onInstructorEvaluationChange(index, 'hasServiceLearning', checked)}
              />
              <Label>{t('review.serviceLearning')}</Label>
            </div>
            
            {evaluation.hasServiceLearning && (
              <div className="space-y-3 ml-6">
                <div>
                  <Label className="font-bold">{t('review.serviceLearningType')}</Label>
                  <Select 
                    value={evaluation.serviceLearningType} 
                    onValueChange={(value) => onInstructorEvaluationChange(index, 'serviceLearningType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compulsory">{t('review.compulsory')}</SelectItem>
                      <SelectItem value="optional">{t('review.optional')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {evaluation.serviceLearningType === 'compulsory' && (
                  <div>
                    <Label className="font-bold">
                      {t('review.serviceLearningDescription')} <span className="text-red-500">*</span>
                    </Label>
                    <HybridMarkdownEditor
                      value={evaluation.serviceLearningDescription}
                      onChange={(value) => onInstructorEvaluationChange(index, 'serviceLearningDescription', value)}
                      placeholder={t('review.serviceLearningPlaceholder')}
                      minRows={2}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Instructor Comments */}
          <div className="space-y-2">
            <Label className="font-bold">
              {t('review.instructorComments')} <span className="text-red-500">*</span>
            </Label>
            
            {/* Common Teaching Phrases */}
            <CollapsibleSection
              isExpanded={teachingPhrasesExpanded[index] || false}
              onToggle={() => onTeachingPhrasesToggle(index)}
              title={t('review.commonPhrases')}
              className="mb-3"
            >
              <Tabs value={teachingActiveTabs[index] || 'teaching'} onValueChange={(tab) => onTeachingTabChange(index, tab)} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="teaching">{t('review.teaching')}</TabsTrigger>
                  <TabsTrigger value="interaction">{t('review.interaction')}</TabsTrigger>
                  <TabsTrigger value="support">{t('review.support')}</TabsTrigger>
                </TabsList>
                
                <TabsContent value="teaching" className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      t('review.phrases.teaching.clear'),
                      t('review.phrases.teaching.engaging'),
                      t('review.phrases.teaching.knowledgeable'),
                      t('review.phrases.teaching.organized'),
                      t('review.phrases.teaching.passionate'),
                      t('review.phrases.teaching.experienced'),
                    ].map((phrase) => (
                      <Button
                        key={phrase}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const currentText = evaluation.comments;
                          const newText = currentText ? `${currentText} ${phrase}` : phrase;
                          onInstructorEvaluationChange(index, 'comments', newText);
                        }}
                        className="justify-start text-left h-auto py-2 px-3"
                      >
                        {phrase}
                      </Button>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="interaction" className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      t('review.phrases.interaction.responsive'),
                      t('review.phrases.interaction.approachable'),
                      t('review.phrases.interaction.helpful'),
                      t('review.phrases.interaction.patient'),
                      t('review.phrases.interaction.encouraging'),
                      t('review.phrases.interaction.supportive'),
                    ].map((phrase) => (
                      <Button
                        key={phrase}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const currentText = evaluation.comments;
                          const newText = currentText ? `${currentText} ${phrase}` : phrase;
                          onInstructorEvaluationChange(index, 'comments', newText);
                        }}
                        className="justify-start text-left h-auto py-2 px-3"
                      >
                        {phrase}
                      </Button>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="support" className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      t('review.phrases.support.feedback'),
                      t('review.phrases.support.guidance'),
                      t('review.phrases.support.resources'),
                      t('review.phrases.support.availability'),
                      t('review.phrases.support.mentorship'),
                      t('review.phrases.support.development'),
                    ].map((phrase) => (
                      <Button
                        key={phrase}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const currentText = evaluation.comments;
                          const newText = currentText ? `${currentText} ${phrase}` : phrase;
                          onInstructorEvaluationChange(index, 'comments', newText);
                        }}
                        className="justify-start text-left h-auto py-2 px-3"
                      >
                        {phrase}
                      </Button>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CollapsibleSection>

            <HybridMarkdownEditor
              value={evaluation.comments}
              onChange={(value) => onInstructorEvaluationChange(index, 'comments', value)}
              placeholder={t('review.instructorCommentsPlaceholder')}
              minRows={4}
              className="min-h-[120px]"
            />
            <div className="text-xs text-muted-foreground">
              {validateWordCount(evaluation.comments).isValid ? 
                `${validateWordCount(evaluation.comments).wordCount}/1000 ${t('review.words')}` :
                <span className="text-red-500">
                  {t('review.wordLimitExceeded')} ({validateWordCount(evaluation.comments).wordCount}/1000)
                </span>
              }
            </div>
          </div>
        </div>
      )
    }));

    // Settings step
    const settingsStep = {
      id: 'settings',
      title: t('review.reviewSettings'),
      icon: <Eye className="h-5 w-5" />,
      isValid: validateSubmissionStep,
      content: (
        <div className="space-y-6">
          {/* Anonymous Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <div className="font-medium">{t('review.anonymousReview')}</div>
              <div className="text-sm text-muted-foreground">
                {t('review.anonymousDescription')}
              </div>
            </div>
            <Checkbox
              checked={isAnonymous}
              onCheckedChange={setIsAnonymous}
            />
          </div>

          {/* Language Selection */}
          <div className="space-y-2">
            <Label className="font-bold">{t('review.reviewLanguage')}</Label>
            <Select value={reviewLanguage} onValueChange={setReviewLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="zh-TW">繁體中文</SelectItem>
                <SelectItem value="zh-CN">简体中文</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )
    };

    // Preview step  
    const previewStep = {
      id: 'preview',
      title: t('review.preview'),
      icon: <Eye className="h-5 w-5" />,
      isValid: validateSubmissionStep,
      content: (
        <div className="space-y-4">
          <div className="bg-muted/20 dark:bg-muted/10 rounded-lg p-4">
            <h3 className="font-semibold mb-4">{t('review.reviewPreview')}</h3>
            
            {/* Course Info */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2">
                <BookText className="h-4 w-4" />
                <span className="font-medium">
                  {selectedCourse} - {courses.find(c => c.course_code === selectedCourse)?.course_title}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{terms.find(t => t.term_code === selectedTerm)?.term_name}</span>
              </div>
            </div>

            {/* Course Ratings */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between items-center">
                <span>{t('review.workload')}:</span>
                <UIStarRating rating={workload || 0} readonly size="sm" />
              </div>
              <div className="flex justify-between items-center">
                <span>{t('review.difficulty')}:</span>
                <UIStarRating rating={difficulty || 0} readonly size="sm" />
              </div>
              <div className="flex justify-between items-center">
                <span>{t('review.usefulness')}:</span>
                <UIStarRating rating={usefulness || 0} readonly size="sm" />
              </div>
              <div className="flex justify-between items-center">
                <span>{t('review.finalGrade')}:</span>
                <GradeBadge grade={grade} />
              </div>
            </div>

            {/* Course Comments */}
            <div className="mb-6">
              <h4 className="font-medium mb-2">{t('review.courseComments')}:</h4>
              <div className="prose prose-sm max-w-none dark:prose-invert bg-background/50 p-3 rounded border">
                {hasMarkdownFormatting(courseComments) ? 
                  renderCommentMarkdown(courseComments) : 
                  <p className="whitespace-pre-wrap">{courseComments}</p>
                }
              </div>
            </div>

            {/* Instructor Evaluations */}
            <div className="space-y-4">
              <h4 className="font-medium">{t('review.instructorEvaluations')}:</h4>
              {instructorEvaluations.map((evaluation, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <ReviewAvatar 
                        username={evaluation.instructorName}
                        isAnonymous={false}
                        size="sm"
                      />
                      <div>
                        <div className="font-medium">{evaluation.instructorName}</div>
                        <div className="text-sm text-muted-foreground">{evaluation.sessionType}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">{t('review.teachingQuality')}:</span>
                        <UIStarRating rating={evaluation.teachingScore || 0} readonly size="sm" />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">{t('review.gradingFairness')}:</span>
                        <UIStarRating rating={evaluation.gradingScore || 0} readonly size="sm" />
                      </div>
                    </div>

                    <div className="prose prose-sm max-w-none dark:prose-invert bg-background/50 p-3 rounded border">
                      {hasMarkdownFormatting(evaluation.comments) ? 
                        renderCommentMarkdown(evaluation.comments) : 
                        <p className="whitespace-pre-wrap">{evaluation.comments}</p>
                      }
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Settings */}
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

    return [...baseSteps, ...instructorSteps, settingsStep, previewStep];
  }, [
    selectedCourse, selectedTerm, selectedInstructors, instructorEvaluations,
    workload, difficulty, usefulness, grade, courseComments,
    isAnonymous, reviewLanguage, previewTimestamp,
    filteredCourses, terms, courses, availableInstructors, instructorsBySessionType,
    activeInstructorTab, coursePhrasesExpanded, teachingPhrasesExpanded,
    courseActiveTab, teachingActiveTabs, previewTeachingLanguages,
    allTeachingLanguages, validateCourseSelectionStep, validateCourseReviewStep,
    validateInstructorEvaluationsStep, validateSingleInstructorEvaluation,
    validateSubmissionStep, t, language
  ]);

  return steps;
};