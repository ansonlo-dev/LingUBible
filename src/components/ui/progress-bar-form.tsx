import React, { useState, useEffect } from 'react';
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
}

export const ProgressBarForm: React.FC<ProgressBarFormProps> = ({
  steps,
  currentStep,
  onStepChange,
  onSubmit,
  submitLabel = 'Submit',
  isSubmitting = false,
  className
}) => {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

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
    // Can only access current step, completed steps, or next step if current is valid
    if (stepIndex === currentStep || 
        completedSteps.has(stepIndex) || 
        (stepIndex === currentStep + 1 && isCurrentStepValid())) {
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

  // Calculate progress percentage
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Progress Bar */}
      <div className="relative">
        {/* Progress background */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.has(index);
            const isCurrent = index === currentStep;
            const isAccessible = index === currentStep || 
                               completedSteps.has(index) || 
                               (index === currentStep + 1 && isCurrentStepValid());

            return (
              <div key={step.id} className="flex flex-col items-center">
                {/* Step circle */}
                <button
                  onClick={() => handleStepClick(index)}
                  disabled={!isAccessible}
                  className={cn(
                    "relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 group",
                    {
                      // Completed or current step
                      "bg-primary border-primary text-primary-foreground": isCompleted || isCurrent,
                      // Accessible but not current/completed
                      "bg-background border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary": isAccessible && !isCurrent && !isCompleted,
                      // Not accessible
                      "bg-muted border-muted-foreground/20 text-muted-foreground/50 cursor-not-allowed": !isAccessible,
                    }
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : step.icon ? (
                    <span className="w-5 h-5 flex items-center justify-center">
                      {step.icon}
                    </span>
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </button>

                {/* Step title */}
                <span className={cn(
                  "mt-2 text-sm font-medium text-center max-w-[100px] leading-tight",
                  {
                    "text-primary": isCurrent,
                    "text-foreground": isCompleted,
                    "text-muted-foreground": !isCurrent && !isCompleted
                  }
                )}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Step Content */}
      <Card className="course-card">
        <CardContent className="p-6">
          {steps[currentStep]?.content}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          {currentStep < steps.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={!isCurrentStepValid()}
              className="flex items-center gap-2 gradient-primary"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!isCurrentStepValid() || isSubmitting}
              className="flex items-center gap-2 gradient-primary"
            >
              {isSubmitting ? 'Submitting...' : submitLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}; 