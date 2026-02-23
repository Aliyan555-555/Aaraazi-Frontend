/**
 * Auth Validation Schemas
 * Standard Zod schemas for consistent input validation across authentication forms
 */

import { z } from 'zod';

// ============================================================================
// Agency Code / Tenant Lookup
// ============================================================================

export const tenantLookupSchema = z.object({
  domain: z
    .string()
    .transform((s) => s.trim())
    .pipe(
      z
        .string()
        .min(1, 'Agency domain or code is required')
        .min(2, 'Domain/code must be at least 2 characters')
        .max(255, 'Domain/code must be less than 255 characters')
    ),
});

export type TenantLookupInput = z.infer<typeof tenantLookupSchema>;

// ============================================================================
// Login
// ============================================================================

const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(255, 'Email must be less than 255 characters')
  .toLowerCase()
  .trim();

const passwordSchema = z
  .string()
  .min(1, 'Password is required')
  .min(6, 'Password must be at least 6 characters')
  .max(128, 'Password must be less than 128 characters');

export const loginSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
  agencyId: z.string().optional(),
  email: emailSchema,
  password: passwordSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;

// Form-only schema (email + password) for client-side validation before API call
export const loginFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  selectedAgencyId: z.string().optional(),
});

export type LoginFormInput = z.infer<typeof loginFormSchema>;
