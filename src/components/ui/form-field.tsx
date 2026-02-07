/**
 * FormField Component - PHASE 3 Form Design Standards ✅
 * 
 * Reusable form field wrapper with:
 * - Label with optional required indicator
 * - Optional tooltip
 * - Error message display
 * - Hint text display
 * - Proper ARIA attributes
 * - Consistent spacing
 * 
 * Usage:
 * <FormField
 *   label="Property Title"
 *   required
 *   error={errors.title}
 *   hint="Enter a descriptive title"
 * >
 *   <Input
 *     value={formData.title}
 *     onChange={(e) => handleChange('title', e.target.value)}
 *   />
 * </FormField>
 */

import React from 'react';
import { Label } from './label';
import { AlertCircle, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';

export interface FormFieldProps {
  /** Field label text */
  label: string;
  /** Unique ID for the field */
  id?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Error message to display */
  error?: string;
  /** Hint text to display when no error */
  hint?: string;
  /** Tooltip content */
  tooltip?: string;
  /** The input component or wrapper div */
  children: React.ReactNode;
  /** Additional className for the wrapper */
  className?: string;
}

export function FormField({
  label,
  id,
  required = false,
  error,
  hint,
  tooltip,
  children,
  className = '',
}: FormFieldProps) {
  // Generate ID if not provided
  const fieldId = id || `field-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;

  // Try to clone the child element and add ARIA attributes
  // Handle complex children (divs with inputs inside) gracefully
  let childWithProps;
  try {
    if (React.isValidElement(children)) {
      childWithProps = React.cloneElement(children, {
        id: fieldId,
        'aria-invalid': !!error,
        'aria-describedby': error ? errorId : hint ? hintId : undefined,
        className: error
          ? `${(children.props as any)?.className || ''} border-red-500 focus:ring-red-200`.trim()
          : (children.props as any)?.className || '',
      } as any);
    } else {
      childWithProps = children;
    }
  } catch (err) {
    // If cloning fails, just render children as-is
    childWithProps = children;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      <Label htmlFor={fieldId} className="flex items-center gap-2">
        <span>{label}</span>
        {required && <span className="text-red-500" aria-label="required">*</span>}
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="More information"
                >
                  <Info className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-sm">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </Label>

      {/* Input */}
      {childWithProps}

      {/* Error Message */}
      {error && (
        <p
          id={errorId}
          className="text-sm text-red-600 flex items-center gap-1"
          role="alert"
        >
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {/* Hint Text */}
      {!error && hint && (
        <p id={hintId} className="text-sm text-gray-500">
          {hint}
        </p>
      )}
    </div>
  );
}