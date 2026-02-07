/**
 * Advanced Validation System
 * Enhanced validation rules and format enforcement
 */

export interface ValidationRule {
  field: string;
  rules: Array<{
    type: 'required' | 'email' | 'phone' | 'url' | 'number' | 'min' | 'max' | 'pattern' | 'custom';
    value?: any;
    message?: string;
    validator?: (value: any) => boolean;
  }>;
}

export interface ValidationResult {
  valid: boolean;
  errors: { [field: string]: string };
}

// ============================================================================
// VALIDATION RULES
// ============================================================================

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate Pakistani phone number
 * Formats: +92XXXXXXXXXX, 03XXXXXXXXX, 92XXXXXXXXXX
 */
export function isValidPakistaniPhone(phone: string): boolean {
  // Remove all spaces, dashes, and parentheses
  const cleaned = phone.replace(/[\s\-()]/g, '');
  
  // Check for valid Pakistani phone patterns
  const patterns = [
    /^\+92[0-9]{10}$/, // +92XXXXXXXXXX
    /^92[0-9]{10}$/, // 92XXXXXXXXXX
    /^03[0-9]{9}$/, // 03XXXXXXXXX
    /^0[0-9]{10}$/ // 0XXXXXXXXXX
  ];
  
  return patterns.some(pattern => pattern.test(cleaned));
}

/**
 * Format Pakistani phone number
 */
export function formatPakistaniPhone(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // If starts with 92, add +
  if (cleaned.startsWith('92')) {
    return `+${cleaned}`;
  }
  
  // If starts with 0, replace with +92
  if (cleaned.startsWith('0')) {
    return `+92${cleaned.substring(1)}`;
  }
  
  // If no country code, assume Pakistan
  if (cleaned.length === 10) {
    return `+92${cleaned}`;
  }
  
  return phone;
}

/**
 * Validate CNIC (Pakistani National ID)
 * Format: XXXXX-XXXXXXX-X
 */
export function isValidCNIC(cnic: string): boolean {
  const cleaned = cnic.replace(/[\s\-]/g, '');
  return /^[0-9]{13}$/.test(cleaned);
}

/**
 * Format CNIC
 */
export function formatCNIC(cnic: string): string {
  const cleaned = cnic.replace(/\D/g, '');
  if (cleaned.length !== 13) return cnic;
  
  return `${cleaned.substring(0, 5)}-${cleaned.substring(5, 12)}-${cleaned.substring(12)}`;
}

/**
 * Validate URL
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate number within range
 */
export function isNumberInRange(value: number, min?: number, max?: number): boolean {
  if (min !== undefined && value < min) return false;
  if (max !== undefined && value > max) return false;
  return true;
}

/**
 * Validate property price (must be positive)
 */
export function isValidPropertyPrice(price: number): boolean {
  return price > 0 && price <= 1000000000000; // Max 1 trillion PKR
}

/**
 * Validate property area (must be positive)
 */
export function isValidPropertyArea(area: number): boolean {
  return area > 0 && area <= 1000000; // Max 1 million sq ft
}

/**
 * Validate commission rate (0-100%)
 */
export function isValidCommissionRate(rate: number): boolean {
  return rate >= 0 && rate <= 100;
}

// ============================================================================
// FORM VALIDATION
// ============================================================================

/**
 * Validate form data against rules
 */
export function validateForm(data: any, rules: ValidationRule[]): ValidationResult {
  const errors: { [field: string]: string } = {};

  rules.forEach(rule => {
    const value = data[rule.field];

    rule.rules.forEach(r => {
      // Skip if already has error
      if (errors[rule.field]) return;

      switch (r.type) {
        case 'required':
          if (value === undefined || value === null || value === '') {
            errors[rule.field] = r.message || `${rule.field} is required`;
          }
          break;

        case 'email':
          if (value && !isValidEmail(value)) {
            errors[rule.field] = r.message || 'Invalid email format';
          }
          break;

        case 'phone':
          if (value && !isValidPakistaniPhone(value)) {
            errors[rule.field] = r.message || 'Invalid phone number format';
          }
          break;

        case 'url':
          if (value && !isValidURL(value)) {
            errors[rule.field] = r.message || 'Invalid URL format';
          }
          break;

        case 'number':
          if (value && isNaN(Number(value))) {
            errors[rule.field] = r.message || 'Must be a number';
          }
          break;

        case 'min':
          if (value !== undefined && value !== null) {
            const numValue = Number(value);
            if (!isNaN(numValue) && numValue < r.value) {
              errors[rule.field] = r.message || `Must be at least ${r.value}`;
            }
          }
          break;

        case 'max':
          if (value !== undefined && value !== null) {
            const numValue = Number(value);
            if (!isNaN(numValue) && numValue > r.value) {
              errors[rule.field] = r.message || `Must be at most ${r.value}`;
            }
          }
          break;

        case 'pattern':
          if (value && r.value instanceof RegExp && !r.value.test(value)) {
            errors[rule.field] = r.message || 'Invalid format';
          }
          break;

        case 'custom':
          if (r.validator && value && !r.validator(value)) {
            errors[rule.field] = r.message || 'Validation failed';
          }
          break;
      }
    });
  });

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

// ============================================================================
// PREDEFINED VALIDATION RULES
// ============================================================================

/**
 * Property validation rules
 */
export const PROPERTY_VALIDATION_RULES: ValidationRule[] = [
  {
    field: 'title',
    rules: [
      { type: 'required', message: 'Property title is required' },
      { type: 'min', value: 10, message: 'Title must be at least 10 characters' }
    ]
  },
  {
    field: 'address',
    rules: [
      { type: 'required', message: 'Address is required' }
    ]
  },
  {
    field: 'price',
    rules: [
      { type: 'required', message: 'Price is required' },
      { type: 'number', message: 'Price must be a number' },
      { type: 'custom', validator: isValidPropertyPrice, message: 'Invalid price range' }
    ]
  },
  {
    field: 'area',
    rules: [
      { type: 'number', message: 'Area must be a number' },
      { type: 'custom', validator: isValidPropertyArea, message: 'Invalid area value' }
    ]
  },
  {
    field: 'commissionRate',
    rules: [
      { type: 'number', message: 'Commission rate must be a number' },
      { type: 'custom', validator: isValidCommissionRate, message: 'Commission rate must be between 0-100%' }
    ]
  }
];

/**
 * Lead validation rules
 */
export const LEAD_VALIDATION_RULES: ValidationRule[] = [
  {
    field: 'name',
    rules: [
      { type: 'required', message: 'Name is required' },
      { type: 'min', value: 3, message: 'Name must be at least 3 characters' }
    ]
  },
  {
    field: 'phone',
    rules: [
      { type: 'required', message: 'Phone number is required' },
      { type: 'phone', message: 'Invalid Pakistani phone number' }
    ]
  },
  {
    field: 'email',
    rules: [
      { type: 'email', message: 'Invalid email format' }
    ]
  },
  {
    field: 'budget',
    rules: [
      { type: 'number', message: 'Budget must be a number' },
      { type: 'min', value: 0, message: 'Budget must be positive' }
    ]
  }
];

/**
 * Contact validation rules
 */
export const CONTACT_VALIDATION_RULES: ValidationRule[] = [
  {
    field: 'name',
    rules: [
      { type: 'required', message: 'Name is required' },
      { type: 'min', value: 3, message: 'Name must be at least 3 characters' }
    ]
  },
  {
    field: 'phone',
    rules: [
      { type: 'required', message: 'Phone number is required' },
      { type: 'phone', message: 'Invalid Pakistani phone number' }
    ]
  },
  {
    field: 'email',
    rules: [
      { type: 'email', message: 'Invalid email format' }
    ]
  }
];

// ============================================================================
// DUPLICATE DETECTION
// ============================================================================

/**
 * Check for duplicate phone numbers
 */
export function findDuplicatesByPhone<T extends { phone: string; id: string }>(
  items: T[],
  newPhone: string,
  excludeId?: string
): T[] {
  const normalizedPhone = formatPakistaniPhone(newPhone);
  
  return items.filter(item => {
    if (excludeId && item.id === excludeId) return false;
    const itemPhone = formatPakistaniPhone(item.phone);
    return itemPhone === normalizedPhone;
  });
}

/**
 * Check for duplicate emails
 */
export function findDuplicatesByEmail<T extends { email?: string; id: string }>(
  items: T[],
  newEmail: string,
  excludeId?: string
): T[] {
  const normalizedEmail = newEmail.toLowerCase().trim();
  
  return items.filter(item => {
    if (excludeId && item.id === excludeId) return false;
    if (!item.email) return false;
    const itemEmail = item.email.toLowerCase().trim();
    return itemEmail === normalizedEmail;
  });
}

/**
 * Check for duplicate names (fuzzy matching)
 */
export function findDuplicatesByName<T extends { name: string; id: string }>(
  items: T[],
  newName: string,
  excludeId?: string,
  threshold: number = 0.8
): T[] {
  const normalizedName = newName.toLowerCase().trim();
  
  return items.filter(item => {
    if (excludeId && item.id === excludeId) return false;
    const itemName = item.name.toLowerCase().trim();
    const similarity = calculateStringSimilarity(normalizedName, itemName);
    return similarity >= threshold;
  });
}

/**
 * Calculate string similarity (Levenshtein distance based)
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Levenshtein distance algorithm
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

// ============================================================================
// FORMAT ENFORCEMENT
// ============================================================================

/**
 * Enforce uppercase
 */
export function enforceUppercase(value: string): string {
  return value.toUpperCase();
}

/**
 * Enforce lowercase
 */
export function enforceLowercase(value: string): string {
  return value.toLowerCase();
}

/**
 * Enforce title case
 */
export function enforceTitleCase(value: string): string {
  return value
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Remove extra whitespace
 */
export function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

/**
 * Remove non-numeric characters
 */
export function extractNumbers(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Format currency input (remove non-digits, add commas)
 */
export function formatCurrencyInput(value: string): string {
  const numbers = extractNumbers(value);
  if (!numbers) return '';
  
  const num = parseInt(numbers);
  return num.toLocaleString('en-US');
}

// ============================================================================
// DATE FORMATTING
// ============================================================================

/**
 * Format date for display
 */
export function formatDate(date: string | Date, format: 'short' | 'long' | 'full' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return 'Invalid Date';
  }
  
  switch (format) {
    case 'long':
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    case 'full':
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    case 'short':
    default:
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
  }
}

// ============================================================================
// PROPERTY ADDRESS VALIDATION
// ============================================================================

import { PropertyAddress } from '../types/locations';

export interface AddressValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate property address based on property type
 */
export const validatePropertyAddress = (
  propertyType: string,
  address: Partial<PropertyAddress>
): AddressValidationResult => {
  const errors: string[] = [];
  
  // Common required fields for all types
  if (!address.cityId) errors.push('City is required');
  if (!address.areaId) errors.push('Area is required');
  
  // Type-specific validation
  if (propertyType === 'plot' || propertyType === 'land') {
    if (!address.plotNumber?.trim()) {
      errors.push('Plot number is required');
    }
  }
  
  if (propertyType === 'apartment' || propertyType === 'flat') {
    if (!address.buildingId) errors.push('Building is required');
    if (!address.floorNumber) errors.push('Floor number is required');
    if (!address.unitNumber?.trim()) {
      errors.push('Unit number is required');
    }
  }
  
  if (propertyType === 'shop' || propertyType === 'office' || propertyType === 'commercial') {
    if (!address.buildingId) errors.push('Building is required');
    if (!address.floorNumber) errors.push('Floor number is required');
    if (!address.unitNumber?.trim()) {
      errors.push('Shop/Office number is required');
    }
  }
  
  return { isValid: errors.length === 0, errors };
};