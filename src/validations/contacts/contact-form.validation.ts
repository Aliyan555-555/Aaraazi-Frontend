/**
 * Contact Form Validation - Professional-grade Zod schemas
 * Aligned with backend CreateContactDto / UpdateContactDto.
 * User-friendly error messages for Pakistani real estate context.
 */

import { z } from 'zod';

// ============================================================================
// Regex patterns (aligned with backend & FBR requirements)
// ============================================================================

/** Pakistani mobile: 03XXXXXXXXX or +923XXXXXXXXX (11 digits after 03) */
export const PK_PHONE_REGEX = /^((\+92|0)3[0-9]{9})$/;

/** CNIC format: XXXXX-XXXXXXX-X (13 digits with dashes) */
export const CNIC_REGEX = /^\d{5}-\d{7}-\d$/;

// ============================================================================
// Error message constants (centralized for consistency)
// ============================================================================

export const CONTACT_ERROR_MESSAGES = {
  name: {
    required: 'Full name is required',
    min: 'Name must be at least 2 characters',
    max: 'Name cannot exceed 100 characters',
  },
  phone: {
    required: 'Phone number is required',
    invalid: 'Enter a valid Pakistani mobile number (e.g., 03001234567 or +923001234567)',
  },
  email: {
    invalid: 'Please enter a valid email address',
    max: 'Email address is too long',
  },
  cnic: {
    invalid: 'Enter a valid CNIC in format XXXXX-XXXXXXX-X (e.g., 42101-1234567-3)',
  },
  type: {
    required: 'Please select a contact type',
  },
  company: {
    max: 'Company name cannot exceed 200 characters',
  },
  address: {
    max: 'Address cannot exceed 500 characters',
  },
  notes: {
    max: 'Notes cannot exceed 500 characters',
  },
} as const;

// ============================================================================
// Enum schemas
// ============================================================================

export const ContactFormTypeSchema = z.enum(
  [
    'buyer',
    'seller',
    'tenant',
    'landlord',
    'investor',
    'vendor',
    'external-broker',
  ],
  {
    error: (issue) =>
      issue.input === undefined || issue.input === ''
        ? CONTACT_ERROR_MESSAGES.type.required
        : CONTACT_ERROR_MESSAGES.type.required,
  }
);

// ============================================================================
// Main Contact Form Schema
// ============================================================================

export const ContactFormSchema = z.object({
  name: z
    .string()
    .min(1, CONTACT_ERROR_MESSAGES.name.required)
    .min(2, CONTACT_ERROR_MESSAGES.name.min)
    .max(100, CONTACT_ERROR_MESSAGES.name.max)
    .trim(),

  phone: z
    .string()
    .min(1, CONTACT_ERROR_MESSAGES.phone.required)
    .trim()
    .regex(PK_PHONE_REGEX, CONTACT_ERROR_MESSAGES.phone.invalid),

  email: z
    .string()
    .email(CONTACT_ERROR_MESSAGES.email.invalid)
    .max(254, CONTACT_ERROR_MESSAGES.email.max)
    .optional()
    .or(z.literal('')),

  cnic: z
    .string()
    .regex(CNIC_REGEX, CONTACT_ERROR_MESSAGES.cnic.invalid)
    .optional()
    .or(z.literal('')),

  type: ContactFormTypeSchema,

  company: z
    .string()
    .max(200, CONTACT_ERROR_MESSAGES.company.max)
    .optional()
    .or(z.literal('')),

  address: z
    .string()
    .max(500, CONTACT_ERROR_MESSAGES.address.max)
    .optional()
    .or(z.literal('')),

  notes: z
    .string()
    .max(500, CONTACT_ERROR_MESSAGES.notes.max)
    .optional()
    .or(z.literal('')),
});

// ============================================================================
// Derived types
// ============================================================================

export type ContactFormValues = z.infer<typeof ContactFormSchema>;

export const contactFormDefaultValues: ContactFormValues = {
  name: '',
  phone: '',
  email: '',
  cnic: '',
  type: 'buyer',
  company: '',
  address: '',
  notes: '',
};
