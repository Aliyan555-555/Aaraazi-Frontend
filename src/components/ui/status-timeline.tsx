/**
 * StatusTimeline - Horizontal timeline component for status progression
 * 
 * Features:
 * - Horizontal timeline layout
 * - Step completion indicators (complete, current, pending, skipped)
 * - Date stamps
 * - Clickable steps
 * - Compact mode
 * - Responsive
 * 
 * Usage:
 * <StatusTimeline
 *   steps={[
 *     { label: 'Listed', status: 'complete', date: '2024-01-15' },
 *     { label: 'Offers Received', status: 'current', date: '2024-02-01' },
 *     { label: 'Under Contract', status: 'pending' },
 *     { label: 'Sold', status: 'pending' },
 *   ]}
 *   onStepClick={(step) => console.log('Clicked:', step)}
 * />
 */

import React from 'react';
import { Check, Circle, AlertCircle } from 'lucide-react';

export interface TimelineStep {
  label: string;
  status: 'complete' | 'current' | 'pending' | 'skipped' | 'error';
  date?: string;
  description?: string;
  onClick?: () => void;
}

export interface StatusTimelineProps {
  steps: TimelineStep[];
  onStepClick?: (step: TimelineStep, index: number) => void;
  compact?: boolean;
  className?: string;
}

export function StatusTimeline({
  steps,
  onStepClick,
  compact = false,
  className = '',
}: StatusTimelineProps) {
  // Get step color classes
  const getStepClasses = (status: TimelineStep['status']) => {
    switch (status) {
      case 'complete':
        return {
          dot: 'bg-green-600 border-green-600',
          icon: 'text-white',
          line: 'bg-green-600',
          label: 'text-gray-900',
          date: 'text-gray-600',
        };
      case 'current':
        return {
          dot: 'bg-blue-600 border-blue-600 ring-4 ring-blue-100',
          icon: 'text-white',
          line: 'bg-gray-300',
          label: 'text-blue-600 font-medium',
          date: 'text-blue-600',
        };
      case 'error':
        return {
          dot: 'bg-red-600 border-red-600',
          icon: 'text-white',
          line: 'bg-gray-300',
          label: 'text-red-600',
          date: 'text-red-600',
        };
      case 'skipped':
        return {
          dot: 'bg-gray-300 border-gray-300',
          icon: 'text-white',
          line: 'bg-gray-300',
          label: 'text-gray-400 line-through',
          date: 'text-gray-400',
        };
      default: // pending
        return {
          dot: 'bg-white border-gray-300',
          icon: 'text-gray-400',
          line: 'bg-gray-300',
          label: 'text-gray-500',
          date: 'text-gray-500',
        };
    }
  };

  // Get step icon
  const getStepIcon = (status: TimelineStep['status']) => {
    switch (status) {
      case 'complete':
        return <Check className={compact ? 'w-3 h-3' : 'w-4 h-4'} />;
      case 'error':
        return <AlertCircle className={compact ? 'w-3 h-3' : 'w-4 h-4'} />;
      default:
        return <Circle className={compact ? 'w-2 h-2' : 'w-3 h-3'} />;
    }
  };

  const dotSize = compact ? 'w-6 h-6' : 'w-8 h-8';
  const lineHeight = compact ? 'h-0.5' : 'h-1';

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="relative">
        {/* Timeline */}
        <div className="flex items-start justify-between relative">
          {steps.map((step, index) => {
            const classes = getStepClasses(step.status);
            const isClickable = !!(step.onClick || onStepClick);
            const isLast = index === steps.length - 1;

            return (
              <div
                key={index}
                className="flex flex-col items-center relative"
                style={{ flex: 1 }}
              >
                {/* Connecting line (before dot) */}
                {index > 0 && (
                  <div
                    className={`absolute top-4 ${lineHeight} ${
                      steps[index - 1].status === 'complete'
                        ? 'bg-green-600'
                        : 'bg-gray-300'
                    }`}
                    style={{
                      right: '50%',
                      left: '-50%',
                      transform: 'translateY(-50%)',
                    }}
                  />
                )}

                {/* Connecting line (after dot) */}
                {!isLast && (
                  <div
                    className={`absolute top-4 ${lineHeight} ${classes.line}`}
                    style={{
                      left: '50%',
                      right: '-50%',
                      transform: 'translateY(-50%)',
                    }}
                  />
                )}

                {/* Step dot */}
                <div
                  className={`${dotSize} rounded-full border-2 ${classes.dot} ${
                    isClickable
                      ? 'cursor-pointer hover:scale-110 transition-transform'
                      : ''
                  } flex items-center justify-center relative z-10 bg-white`}
                  onClick={() => {
                    if (step.onClick) {
                      step.onClick();
                    } else if (onStepClick) {
                      onStepClick(step, index);
                    }
                  }}
                  role={isClickable ? 'button' : undefined}
                  tabIndex={isClickable ? 0 : undefined}
                  onKeyDown={
                    isClickable
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            if (step.onClick) {
                              step.onClick();
                            } else if (onStepClick) {
                              onStepClick(step, index);
                            }
                          }
                        }
                      : undefined
                  }
                  aria-label={`Step ${index + 1}: ${step.label} - ${step.status}`}
                >
                  <span className={classes.icon}>{getStepIcon(step.status)}</span>
                </div>

                {/* Step label */}
                <div className="mt-3 text-center max-w-[120px]">
                  <div className={`text-sm ${classes.label} ${compact ? 'text-xs' : ''}`}>
                    {step.label}
                  </div>
                  {step.date && (
                    <div className={`text-xs mt-1 ${classes.date}`}>
                      {new Date(step.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  )}
                  {step.description && !compact && (
                    <div className="text-xs text-gray-500 mt-1">
                      {step.description}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
