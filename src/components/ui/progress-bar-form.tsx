import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

interface ProgressBarFormStep {
  id: string;
  title: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  isValid?: () => boolean;
  isCompleted?: boolean;
}

interface ProgressBarFormProps {
  steps: ProgressBarFormStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onSubmit?: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  className?: string;
  previousLabel?: string;
  nextLabel?: string;
  submittingLabel?: string;
}

export const ProgressBarForm: React.FC<ProgressBarFormProps> = ({
  steps,
  currentStep,
  onStepChange,
  onSubmit,
  submitLabel = 'Submit',
  isSubmitting = false,
  className,
  previousLabel = '上一步',
  nextLabel = '下一步',
  submittingLabel = '提交中...'
}) => {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [unlockedSteps, setUnlockedSteps] = useState<Set<number>>(new Set([0])); // Initially unlock the first step
  const progressContainerRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Scroll current step into view
  useEffect(() => {
    if (progressContainerRef.current && stepRefs.current[currentStep]) {
      const container = progressContainerRef.current;
      const currentStepElement = stepRefs.current[currentStep];
      
      if (currentStepElement) {
        const containerRect = container.getBoundingClientRect();
        const stepRect = currentStepElement.getBoundingClientRect();
        
        // Check if step is outside the visible area
        if (stepRect.left < containerRect.left || stepRect.right > containerRect.right) {
          // Scroll to make current step visible on the left side
          const scrollLeft = currentStepElement.offsetLeft - container.offsetLeft - 20; // 20px padding
          container.scrollTo({
            left: Math.max(0, scrollLeft),
            behavior: 'smooth'
          });
        }
      }
    }
  }, [currentStep]);

  // Check if current step is valid
  const isCurrentStepValid = () => {
    const step = steps[currentStep];
    return step?.isValid ? step.isValid() : true;
  };

  // Handle next step
  const handleNext = () => {
    if (isCurrentStepValid()) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      if (currentStep < steps.length - 1) {
        // Unlock the next step
        setUnlockedSteps(prev => new Set([...prev, currentStep + 1]));
        onStepChange(currentStep + 1);
      }
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      onStepChange(currentStep - 1);
    }
  };

  // Handle step click (only if step is accessible)
  const handleStepClick = (stepIndex: number) => {
    // Can only access current step, completed steps, or unlocked steps
    if (stepIndex === currentStep || 
        completedSteps.has(stepIndex) || 
        unlockedSteps.has(stepIndex)) {
      
      // Mark current step as completed when moving forward to next step
      if (stepIndex > currentStep && isCurrentStepValid()) {
        setCompletedSteps(prev => new Set([...prev, currentStep]));
        // Unlock the target step if moving forward
        setUnlockedSteps(prev => new Set([...prev, stepIndex]));
      }
      
      onStepChange(stepIndex);
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    if (isCurrentStepValid() && onSubmit) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      onSubmit();
    }
  };


  return (
    <div className={cn('space-y-6', className)}>
      {/* Progress Bar */}
      <div className="space-y-4">

        {/* Modern pill-based progress bar - Mobile optimized with animation */}
        <div ref={progressContainerRef} className="flex justify-start md:justify-center overflow-x-auto py-3 px-1">
          <div className="flex items-center">
            {steps
              .map((step, index) => ({ ...step, originalIndex: index }))
              .map((step, displayIndex) => {
                const originalIndex = step.originalIndex;
                const isCompleted = completedSteps.has(originalIndex);
                const isCurrent = originalIndex === currentStep;
                const isAccessible = originalIndex === currentStep || 
                                   completedSteps.has(originalIndex) || 
                                   unlockedSteps.has(originalIndex);

                return (
                  <div key={step.id} className="flex items-center flex-shrink-0">
                    {/* Step pill */}
                    <button
                      ref={(el) => { stepRefs.current[originalIndex] = el; }}
                      onClick={() => handleStepClick(originalIndex)}
                      disabled={!isAccessible}
                      className={cn(
                        "relative flex items-center justify-center rounded-full border-2 transition-all duration-300 transform hover:scale-105 group z-10 font-medium",
                        // Mobile: smaller padding and size
                        "px-2 py-1.5 text-xs min-w-[80px]",
                        // Desktop: larger padding and size  
                        "md:px-4 md:py-2 md:text-sm md:min-w-[120px]",
                        {
                          // Completed step - changed to red
                          "bg-red-500 border-red-500 text-white shadow-md hover:bg-red-600": isCompleted && !isCurrent,
                          // Current step
                          "bg-red-500 border-red-500 text-white shadow-lg ring-4 ring-red-500/20 dark:ring-red-500/30": isCurrent,
                          // Accessible but not current/completed
                          "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-muted-foreground hover:border-red-400 hover:font-bold": isAccessible && !isCurrent && !isCompleted,
                          // Not accessible
                          "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-60": !isAccessible,
                        }
                      )}
                    >
                      <div className="flex items-center gap-1 md:gap-2">
                        {step.icon ? (
                          <span className="w-3 h-3 md:w-4 md:h-4 flex items-center justify-center">
                            {React.cloneElement(step.icon as React.ReactElement, { 
                              className: "w-3 h-3 md:w-4 md:h-4" 
                            })}
                          </span>
                        ) : (
                          <span className="text-xs md:text-sm font-semibold">{originalIndex + 1}</span>
                        )}
                        <span className="hidden sm:inline truncate">{step.title}</span>
                        <span className="sm:hidden truncate">{step.title.split(' ')[0]}</span>
                      </div>
                    </button>

                    {/* Connection line between boxes - Made more prominent */}
                    {displayIndex < steps.length - 1 && (
                      <div className="flex-1 h-1 mx-2 md:mx-4 relative min-w-[20px]">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-500 ease-out",
                            // Red line if current step is completed, grey otherwise
                            completedSteps.has(originalIndex) 
                              ? "bg-red-500 dark:bg-red-600" 
                              : "bg-gray-300 dark:bg-gray-600"
                          )}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Current Step Content */}
      <Card className="course-card shadow-lg border-gray-200 dark:border-gray-700">
        <CardContent className="p-6 bg-white dark:bg-gray-900/50">
          <div className="animate-in fade-in-50 duration-300">
            {steps[currentStep]?.content}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="flex items-center gap-2 hover:bg-transparent hover:border-red-400 hover:text-red-500 dark:hover:border-red-400 dark:hover:text-red-400 transition-all duration-200 transform hover:scale-105"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{previousLabel}</span>
        </Button>

        <div className="flex items-center gap-2">
          {currentStep < steps.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={!isCurrentStepValid()}
              className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              {nextLabel}
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!isCurrentStepValid() || isSubmitting}
              className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              {isSubmitting ? submittingLabel : submitLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};