/**
 * Contact form validation - production-grade Zod schemas.
 * Aligned with backend CreateContactDto / UpdateContactDto.
 */

import { z } from 'zod';

// ============================================================================
// Regex patterns (aligned with backend)
// ============================================================================

export const PK_PHONE_REGEX = /^((\+92|0)3[0-9]{9})$/;
export const CNIC_REGEX = /^\d{5}-\d{7}-\d$/;

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
  { required_error: 'Contact type is required' },
);

// ============================================================================
// Main Contact Form Schema
// ============================================================================

export const ContactFormSchema = z.object({
  name: z
    .string({ required_error: 'Full name is required' })
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .trim(),

  phone: z
    .string({ required_error: 'Phone number is required' })
    .trim()
    .regex(
      PK_PHONE_REGEX,
      'Enter a valid Pakistani mobile number — 03XXXXXXXXXX or +923XXXXXXXXX',
    ),

  email: z
    .string()
    .email('Enter a valid email address')
    .max(254, 'Email is too long')
    .optional()
    .or(z.literal('')),

  cnic: z
    .string()
    .regex(CNIC_REGEX, 'Enter a valid CNIC: XXXXX-XXXXXXX-X (e.g. 42101-1234567-3)')
    .optional()
    .or(z.literal('')),

  type: ContactFormTypeSchema,

  company: z
    .string()
    .max(200, 'Company name must be less than 200 characters')
    .optional()
    .or(z.literal('')),

  address: z
    .string()
    .max(500, 'Address must be less than 500 characters')
    .optional()
    .or(z.literal('')),

  notes: z
    .string()
    .max(500, 'Notes must be less than 500 characters')
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
