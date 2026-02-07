/**
 * FormSection Component - PHASE 3 Form Design Standards ✅
 * 
 * Groups related form fields with optional title and description.
 * Provides consistent spacing and visual hierarchy.
 * 
 * Usage:
 * <FormSection
 *   title="Property Information"
 *   description="Enter basic details about the property"
 * >
 *   <FormField label="Title">...</FormField>
 *   <FormField label="Address">...</FormField>
 * </FormSection>
 */

import React from 'react';

export interface FormSectionProps {
  /** Section title */
  title?: string;
  /** Section description */
  description?: string;
  /** Optional icon for the section */
  icon?: React.ReactNode;
  /** Form fields */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
}

export function FormSection({
  title,
  description,
  icon,
  children,
  className = '',
}: FormSectionProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Section Header */}
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              {icon && <span className="text-primary">{icon}</span>}
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-gray-500">
              {description}
            </p>
          )}
        </div>
      )}

      {/* Section Fields */}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

/**
 * FormSectionDivider - Visual divider between form sections
 */
export function FormSectionDivider() {
  return <div className="border-t border-gray-200 my-6" />;
}