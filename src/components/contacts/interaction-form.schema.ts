import { z } from 'zod';

// ============================================================================
// Enum schemas (matching backend Prisma enums)
// ============================================================================

export const InteractionTypeSchema = z.enum(
  ['CALL', 'EMAIL', 'MEETING', 'NOTE', 'SMS', 'WHATSAPP', 'VIDEO_CALL'],
  { required_error: 'Interaction type is required' },
);

// ============================================================================
// Main Interaction Form Schema — matches prototype layout
// Fields: Interaction Type*, Date*, Subject*, Notes*, Outcome, Related Property
// ============================================================================

export const InteractionFormSchema = z.object({
  type: InteractionTypeSchema,

  /** Subject — maps to backend "summary" */
  subject: z
    .string({ required_error: 'Subject is required' })
    .min(3, 'Subject must be at least 3 characters')
    .max(500, 'Subject must be less than 500 characters')
    .trim(),

  notes: z
    .string({ required_error: 'Notes are required' })
    .min(1, 'Notes are required')
    .max(2000, 'Notes must be less than 2000 characters')
    .trim(),

  /** ISO date string — the date picker provides YYYY-MM-DD */
  date: z
    .string({ required_error: 'Date is required' })
    .min(1, 'Date is required'),

  /** Optional outcome / result / next steps */
  outcome: z.string().max(500).optional().or(z.literal('')),

  /** Optional property reference */
  propertyId: z.string().optional().or(z.literal('')),
});

// ============================================================================
// Derived types
// ============================================================================

export type InteractionFormValues = z.infer<typeof InteractionFormSchema>;

export const interactionFormDefaultValues: InteractionFormValues = {
  type: 'CALL',
  subject: '',
  notes: '',
  date: new Date().toISOString().split('T')[0],
  outcome: '',
  propertyId: '',
};

// ============================================================================
// Human-readable labels
// ============================================================================

export const INTERACTION_TYPE_LABELS: Record<
  InteractionFormValues['type'],
  string
> = {
  CALL: 'Phone Call',
  EMAIL: 'Email',
  MEETING: 'Meeting',
  NOTE: 'Note',
  SMS: 'SMS',
  WHATSAPP: 'WhatsApp',
  VIDEO_CALL: 'Video Call',
};
