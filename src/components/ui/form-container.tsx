/**
 * FormContainer Component - PHASE 3 Form Design Standards ✅
 * 
 * Root container for forms with:
 * - Consistent max-width and padding
 * - Header with title and description
 * - Body with form content
 * - Footer with action buttons
 * - Responsive design
 * 
 * Usage:
 * <FormContainer
 *   title="Add Property"
 *   description="Fill in the property details"
 *   onSubmit={handleSubmit}
 * >
 *   <FormContainer.Body>
 *     <FormSection>...</FormSection>
 *   </FormContainer.Body>
 *   
 *   <FormContainer.Footer>
 *     <Button variant="outline">Cancel</Button>
 *     <Button type="submit">Save</Button>
 *   </FormContainer.Footer>
 * </FormContainer>
 */

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from './button';

export interface FormContainerProps {
  /** Form title */
  title?: string;
  /** Form description */
  description?: string;
  /** Back button handler */
  onBack?: () => void;
  /** Form submit handler */
  onSubmit?: (e: React.FormEvent) => void;
  /** Form children */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
  /** Max width (default: 640px) */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Disable form wrapper (use div instead) - for wrapping components that already have forms */
  asDiv?: boolean;
  /** Header icon */
  icon?: React.ReactNode;
}


export function FormContainer({
  title,
  description,
  onBack,
  onSubmit,
  children,
  className = '',
  maxWidth = 'md',
  asDiv = false,
  icon,
}: FormContainerProps) {

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full',
  };

  const Wrapper = asDiv ? 'div' : 'form';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${maxWidthClasses[maxWidth]} ${className}`}>
        {asDiv ? (
          <div>
            {/* Header */}
            {(title || description || onBack || icon) && (
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  {icon && (
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                      {icon}
                    </div>
                  )}
                  <div className="flex-1">
                    {/* Back Button */}
                    {onBack && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={onBack}
                        className="mb-1 -ml-2 h-8 px-2 text-gray-500 hover:text-gray-900"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                      </Button>
                    )}

                    {/* Title & Description */}
                    {(title || description) && (
                      <div className="space-y-1">
                        {title && (
                          <h1 className="text-2xl font-bold text-gray-900">
                            {title}
                          </h1>
                        )}
                        {description && (
                          <p className="text-gray-600">
                            {description}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}


            {/* Body */}
            {children}
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate>
            {/* Header */}
            {(title || description || onBack || icon) && (
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  {icon && (
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                      {icon}
                    </div>
                  )}
                  <div className="flex-1">
                    {/* Back Button */}
                    {onBack && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={onBack}
                        className="mb-1 -ml-2 h-8 px-2 text-gray-500 hover:text-gray-900"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                      </Button>
                    )}

                    {/* Title & Description */}
                    {(title || description) && (
                      <div className="space-y-1">
                        {title && (
                          <h1 className="text-2xl font-bold text-gray-900">
                            {title}
                          </h1>
                        )}
                        {description && (
                          <p className="text-gray-600">
                            {description}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}


            {/* Body */}
            {children}
          </form>
        )}
      </div>
    </div>
  );
}

/**
 * FormContainer.Body - Main form content area
 */
FormContainer.Body = function FormBody({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 space-y-6 ${className}`}>
      {children}
    </div>
  );
};

/**
 * FormContainer.Footer - Form action buttons
 */
FormContainer.Footer = function FormFooter({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 ${className}`}>
      {children}
    </div>
  );
};