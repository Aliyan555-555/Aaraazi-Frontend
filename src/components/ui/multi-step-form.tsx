import React, { useState } from 'react';
import { Button } from './button';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

export interface Step {
  id: string;
  title: string;
  component: React.ReactNode;
  validate?: () => boolean | Promise<boolean>;
  description?: string;
}

export interface MultiStepFormProps {
  steps: Step[];
  onComplete: () => void;
  onStepChange?: (stepIndex: number) => void;
  /** Allow navigation to any completed step */
  allowStepNavigation?: boolean;
  /** Show step numbers */
  showStepNumbers?: boolean;
  /** Custom submit button text */
  submitText?: string;
  /** Custom next button text */
  nextText?: string;
  /** Custom back button text */
  backText?: string;
  /** Whether form is currently submitting */
  /** Whether form is currently submitting */
  isSubmitting?: boolean;
  /** Callback for cancel action (e.g. back on first step) */
  onCancel?: () => void;
}

export function MultiStepForm({
  steps,
  onComplete,
  onStepChange,
  allowStepNavigation = true,
  showStepNumbers = true,
  submitText = 'Submit',
  nextText = 'Next',
  backText = 'Back',
  isSubmitting = false,
  onCancel,
}: MultiStepFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isValidating, setIsValidating] = useState(false);

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  // Handle step navigation
  const goToStep = async (stepIndex: number) => {
    // Only allow navigation to completed steps or next step
    if (stepIndex > currentStep + 1) return;
    if (!allowStepNavigation && stepIndex < currentStep) return;

    setCurrentStep(stepIndex);
    onStepChange?.(stepIndex);
  };

  // Handle next step
  const handleNext = async () => {
    // Validate current step if validation function exists
    if (currentStepData.validate) {
      setIsValidating(true);
      const isValid = await currentStepData.validate();
      setIsValidating(false);

      if (!isValid) {
        return;
      }
    }

    // Mark current step as completed
    setCompletedSteps((prev) => new Set([...prev, currentStep]));

    // Move to next step or complete
    if (isLastStep) {
      onComplete();
    } else {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      onStepChange?.(nextStep);
    }
  };

  // Handle previous step
  const handleBack = () => {
    if (isFirstStep) {
      onCancel?.();
      return;
    }
    const prevStep = currentStep - 1;
    setCurrentStep(prevStep);
    onStepChange?.(prevStep);
  };

  // Calculate progress percentage
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="space-y-4">
        {/* Progress Bar */}
        <div className="relative">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300 ease-in-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.has(index);
            const isCurrent = index === currentStep;
            const isAccessible = index <= currentStep || completedSteps.has(index);

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => isAccessible && goToStep(index)}
                disabled={!isAccessible}
                className={`flex-1 flex flex-col items-center gap-2 transition-colors ${isAccessible ? 'cursor-pointer' : 'cursor-not-allowed'
                  }`}
              >
                {/* Step Circle */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${isCompleted
                    ? 'bg-green-600 text-white'
                    : isCurrent
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                    }`}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : showStepNumbers ? (
                    index + 1
                  ) : null}
                </div>

                {/* Step Title */}
                <div className="text-center">
                  <p
                    className={`text-xs font-medium hidden sm:block ${isCurrent ? 'text-blue-600' : 'text-gray-600'
                      }`}
                  >
                    {step.title}
                  </p>
                  {step.description && isCurrent && (
                    <p className="text-xs text-gray-500 mt-1 hidden md:block">
                      {step.description}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Current Step Info */}
        <div className="text-center sm:hidden">
          <p className="text-sm font-medium text-gray-900">
            Step {currentStep + 1} of {steps.length}: {currentStepData.title}
          </p>
          {currentStepData.description && (
            <p className="text-xs text-gray-500 mt-1">
              {currentStepData.description}
            </p>
          )}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {currentStepData.component}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={isFirstStep && !onCancel}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {backText}
        </Button>

        <Button
          type="button"
          onClick={handleNext}
          disabled={isValidating || isSubmitting}
        >
          {isValidating ? (
            'Validating...'
          ) : isLastStep ? (
            submitText
          ) : (
            <>
              {nextText}
              <ChevronRight className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

/**
 * useMultiStepForm - Hook for managing multi-step form state
 */
export function useMultiStepForm<T extends Record<string, any>>(initialData: T) {
  const [formData, setFormData] = useState<T>(initialData);

  const updateFormData = (stepData: Partial<T>) => {
    setFormData((prev) => ({ ...prev, ...stepData }));
  };

  const resetFormData = () => {
    setFormData(initialData);
  };

  return {
    formData,
    updateFormData,
    resetFormData,
  };
}