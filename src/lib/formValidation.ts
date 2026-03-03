/**
 * Form Validation Utilities - PHASE 3 Form Design Standards ✅
 * 
 * Centralized validation functions with:
 * - Consistent error messages
 * - Type-safe validation
 * - Reusable validators
 * - Pakistan-specific validations
 */

/** Validation error object */
export type ValidationError = string;

/** Validation result */
export type ValidationResult = ValidationError | undefined;

/** Errors object for forms */
export type FormErrors<T> = Partial<Record<keyof T, ValidationError>>;

// ==================== BASIC VALIDATORS ====================

/**
 * Validate required field
 */
export function required(value: any, fieldName: string = 'This field'): ValidationResult {
  if (value === undefined || value === null || value === '') {
    return `${fieldName} is required`;
  }
  
  // Handle trimmed strings
  if (typeof value === 'string' && value.trim() === '') {
    return `${fieldName} is required`;
  }
  
  // Handle empty arrays
  if (Array.isArray(value) && value.length === 0) {
    return `${fieldName} is required`;
  }
  
  return undefined;
}

/**
 * Curried version: Create a required validator with custom message
 */
required.withMessage = (message: string) => (value: any) => {
  if (value === undefined || value === null || value === '') {
    return message;
  }
  
  // Handle trimmed strings
  if (typeof value === 'string' && value.trim() === '') {
    return message;
  }
  
  // Handle empty arrays
  if (Array.isArray(value) && value.length === 0) {
    return message;
  }
  
  return undefined;
};

/**
 * Validate minimum length
 */
export function minLength(
  value: string,
  min: number,
  fieldName: string = 'This field'
): ValidationResult {
  if (value && value.length < min) {
    return `${fieldName} must be at least ${min} characters`;
  }
  return undefined;
}

/**
 * Curried version: Create a minLength validator
 */
minLength.rule = (min: number, message?: string) => (value: string) => {
  if (value && value.length < min) {
    return message || `Must be at least ${min} characters`;
  }
  return undefined;
};

/**
 * Validate maximum length
 */
export function maxLength(
  value: string,
  max: number,
  fieldName: string = 'This field'
): ValidationResult {
  if (value && value.length > max) {
    return `${fieldName} must be less than ${max} characters`;
  }
  return undefined;
}

/**
 * Curried version: Create a maxLength validator
 */
maxLength.rule = (max: number, message?: string) => (value: string) => {
  if (value && value.length > max) {
    return message || `Must be less than ${max} characters`;
  }
  return undefined;
};

/**
 * Validate minimum value
 */
export function minValue(
  value: number,
  min: number,
  fieldName: string = 'This field'
): ValidationResult {
  if (value !== undefined && value !== null && value < min) {
    return `${fieldName} must be at least ${min}`;
  }
  return undefined;
}

/**
 * Curried version: Create a minValue validator
 */
minValue.rule = (min: number, message?: string) => (value: number | string) => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (!isNaN(num) && num < min) {
    return message || `Must be at least ${min}`;
  }
  return undefined;
};

/**
 * Validate maximum value
 */
export function maxValue(
  value: number,
  max: number,
  fieldName: string = 'This field'
): ValidationResult {
  if (value !== undefined && value !== null && value > max) {
    return `${fieldName} must be less than ${max}`;
  }
  return undefined;
}

/**
 * Curried version: Create a maxValue validator
 */
maxValue.rule = (max: number, message?: string) => (value: number | string) => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (!isNaN(num) && num > max) {
    return message || `Must be less than ${max}`;
  }
  return undefined;
};

/**
 * Validate number range
 */
export function range(
  value: number,
  min: number,
  max: number,
  fieldName: string = 'This field'
): ValidationResult {
  if (value !== undefined && value !== null) {
    if (value < min || value > max) {
      return `${fieldName} must be between ${min} and ${max}`;
    }
  }
  return undefined;
}

// ==================== FORMAT VALIDATORS ====================

/**
 * Validate email format
 */
export function email(value: string): ValidationResult {
  if (!value) return undefined;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return 'Please enter a valid email address';
  }
  
  return undefined;
}

/**
 * Validate Pakistani phone number
 * Formats: 03001234567, +923001234567, 923001234567
 */
export function pakistanPhone(value: string): ValidationResult {
  if (!value) return undefined;
  
  // Remove spaces and dashes
  const cleaned = value.replace(/[\s-]/g, '');
  
  // Check formats
  const formats = [
    /^03\d{9}$/,        // 03001234567 (11 digits)
    /^\+923\d{9}$/,     // +923001234567 (13 chars)
    /^923\d{9}$/,       // 923001234567 (12 digits)
  ];
  
  const isValid = formats.some(regex => regex.test(cleaned));
  
  if (!isValid) {
    return 'Please enter a valid Pakistani phone number (e.g., 03001234567)';
  }
  
  return undefined;
}

/**
 * Validate URL format
 */
export function url(value: string): ValidationResult {
  if (!value) return undefined;
  
  try {
    new URL(value);
    return undefined;
  } catch {
    return 'Please enter a valid URL (e.g., https://example.com)';
  }
}

/**
 * Validate CNIC (Pakistani National ID)
 * Format: 12345-1234567-1 (13 digits with dashes)
 */
export function cnic(value: string): ValidationResult {
  if (!value) return undefined;
  
  const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
  
  if (!cnicRegex.test(value)) {
    return 'Please enter a valid CNIC (e.g., 12345-1234567-1)';
  }
  
  return undefined;
}

/**
 * Alias for cnic validation (for consistency with naming convention)
 */
export const pakistaniCNIC = cnic;

/**
 * Validate positive number
 */
export function positiveNumber(
  value: number | string,
  fieldName: string = 'This field'
): ValidationResult {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) {
    return `${fieldName} must be a valid number`;
  }
  
  if (num <= 0) {
    return `${fieldName} must be a positive number`;
  }
  
  return undefined;
}

/**
 * Curried version: Create a positiveNumber validator
 */
positiveNumber.withMessage = (message: string) => (value: number | string) => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) {
    return message;
  }
  
  if (num <= 0) {
    return message;
  }
  
  return undefined;
};

/**
 * Validate integer
 */
export function integer(
  value: number | string,
  fieldName: string = 'This field'
): ValidationResult {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) {
    return `${fieldName} must be a valid number`;
  }
  
  if (!Number.isInteger(num)) {
    return `${fieldName} must be a whole number`;
  }
  
  return undefined;
}

// ==================== DATE VALIDATORS ====================

/**
 * Validate future date
 */
export function futureDate(value: string | Date): ValidationResult {
  if (!value) return undefined;
  
  const date = typeof value === 'string' ? new Date(value) : value;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (date < today) {
    return 'Date must be in the future';
  }
  
  return undefined;
}

/**
 * Validate past date
 */
export function pastDate(value: string | Date): ValidationResult {
  if (!value) return undefined;
  
  const date = typeof value === 'string' ? new Date(value) : value;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (date > today) {
    return 'Date must be in the past';
  }
  
  return undefined;
}

/**
 * Validate date range
 */
export function dateRange(
  value: string | Date,
  min?: string | Date,
  max?: string | Date
): ValidationResult {
  if (!value) return undefined;
  
  const date = typeof value === 'string' ? new Date(value) : value;
  
  if (min) {
    const minDate = typeof min === 'string' ? new Date(min) : min;
    if (date < minDate) {
      return `Date must be after ${minDate.toLocaleDateString()}`;
    }
  }
  
  if (max) {
    const maxDate = typeof max === 'string' ? new Date(max) : max;
    if (date > maxDate) {
      return `Date must be before ${maxDate.toLocaleDateString()}`;
    }
  }
  
  return undefined;
}

// ==================== CUSTOM VALIDATORS ====================

/**
 * Validate Pakistani currency (PKR)
 */
export function pkrAmount(
  value: number | string,
  fieldName: string = 'Amount'
): ValidationResult {
  const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
  
  if (isNaN(num)) {
    return `${fieldName} must be a valid amount`;
  }
  
  if (num < 0) {
    return `${fieldName} cannot be negative`;
  }
  
  // Check for excessive decimal places (PKR typically uses 0-2 decimals)
  if (num % 1 !== 0) {
    const decimals = num.toString().split('.')[1]?.length || 0;
    if (decimals > 2) {
      return `${fieldName} should have at most 2 decimal places`;
    }
  }
  
  return undefined;
}

/**
 * Validate property area (sq yd, sq ft, marla, kanal)
 */
export function propertyArea(
  value: number | string,
  unit: string = 'sq yd'
): ValidationResult {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) {
    return 'Area must be a valid number';
  }
  
  if (num <= 0) {
    return 'Area must be greater than 0';
  }
  
  // Reasonable limits based on unit
  const limits: Record<string, { min: number; max: number }> = {
    'sq yd': { min: 10, max: 100000 },
    'sq ft': { min: 100, max: 1000000 },
    'marla': { min: 1, max: 1000 },
    'kanal': { min: 1, max: 100 },
  };
  
  const limit = limits[unit];
  if (limit) {
    if (num < limit.min) {
      return `Area seems too small for ${unit}. Minimum is ${limit.min} ${unit}`;
    }
    if (num > limit.max) {
      return `Area seems too large for ${unit}. Maximum is ${limit.max} ${unit}`;
    }
  }
  
  return undefined;
}

/**
 * Compare two fields (e.g., password confirmation)
 */
export function matches(
  value: any,
  compareValue: any,
  fieldName: string = 'This field',
  compareFieldName: string = 'the other field'
): ValidationResult {
  if (value !== compareValue) {
    return `${fieldName} must match ${compareFieldName}`;
  }
  return undefined;
}

/**
 * Validate at least one checkbox is checked
 */
export function atLeastOne(
  values: any[],
  fieldName: string = 'At least one option'
): ValidationResult {
  if (!values || values.length === 0 || values.every(v => !v)) {
    return `${fieldName} must be selected`;
  }
  return undefined;
}

// ==================== COMPOSITE VALIDATORS ====================

/**
 * Combine multiple validators
 */
export function compose(
  ...validators: Array<(value: any) => ValidationResult>
): (value: any) => ValidationResult {
  return (value: any) => {
    for (const validator of validators) {
      const error = validator(value);
      if (error) return error;
    }
    return undefined;
  };
}

/**
 * Validate entire form object
 */
export function validateForm<T extends Record<string, any>>(
  data: T,
  rules: {
    [K in keyof T]?: (value: T[K]) => ValidationResult;
  }
): FormErrors<T> {
  const errors: FormErrors<T> = {};
  
  for (const field in rules) {
    const validator = rules[field];
    if (validator) {
      const error = validator(data[field]);
      if (error) {
        errors[field] = error;
      }
    }
  }
  
  return errors;
}

/**
 * Check if form has any errors
 */
export function hasErrors<T>(errors: FormErrors<T>): boolean {
  return Object.keys(errors).length > 0;
}

// ==================== ASYNC VALIDATORS ====================

/**
 * Validate unique value (e.g., email uniqueness)
 */
export async function unique(
  value: string,
  checkFunction: (value: string) => Promise<boolean>,
  fieldName: string = 'This field'
): Promise<ValidationResult> {
  if (!value) return undefined;
  
  const isUnique = await checkFunction(value);
  if (!isUnique) {
    return `${fieldName} is already taken`;
  }
  
  return undefined;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Format validation error for display
 */
export function formatError(error: ValidationError | undefined): string {
  return error || '';
}

/**
 * Get first error from errors object
 */
export function getFirstError<T>(errors: FormErrors<T>): ValidationError | undefined {
  const firstKey = Object.keys(errors)[0] as keyof T;
  return firstKey ? errors[firstKey] : undefined;
}

/**
 * Clear specific field errors
 */
export function clearFieldError<T>(
  errors: FormErrors<T>,
  field: keyof T
): FormErrors<T> {
  const newErrors = { ...errors };
  delete newErrors[field];
  return newErrors;
}

/**
 * Merge errors objects
 */
export function mergeErrors<T>(
  ...errorsArray: Array<FormErrors<T>>
): FormErrors<T> {
  return Object.assign({}, ...errorsArray);
}

// ==================== INVESTOR SHARE VALIDATORS ====================

/** Minimal shape for investor share validation */
export interface InvestorShareInput {
  investorId?: string;
  investorName?: string;
  sharePercentage: number;
  investmentAmount?: number;
}

/**
 * Validate investor shares for multi-investor purchase
 * Ensures percentages sum to 100% and all required fields are present
 */
export function validateInvestorShares(shares: InvestorShareInput[]): {
  valid: boolean;
  error?: string;
} {
  if (!shares || shares.length === 0) {
    return { valid: false, error: 'At least one investor is required' };
  }

  for (const share of shares) {
    if (!share.investorId || !share.investorName) {
      return { valid: false, error: 'All investors must have ID and name' };
    }
    if (share.sharePercentage <= 0 || share.sharePercentage > 100) {
      return {
        valid: false,
        error: 'Each investor percentage must be between 0 and 100',
      };
    }
    if (!share.investmentAmount || share.investmentAmount <= 0) {
      return {
        valid: false,
        error: 'All investors must have valid investment amounts',
      };
    }
  }

  const totalPercentage = shares.reduce((sum, s) => sum + s.sharePercentage, 0);
  if (Math.abs(totalPercentage - 100) > 0.01) {
    return {
      valid: false,
      error: `Total percentage must equal 100% (currently ${totalPercentage.toFixed(2)}%)`,
    };
  }

  return { valid: true };
}