/**
 * Unit tests — InteractionFormSchema
 * Covers all fields: type, direction, summary, notes, date
 */

import { describe, it, expect } from 'vitest';
import {
  InteractionFormSchema,
  interactionFormDefaultValues,
} from './interaction-form.schema';

const VALID_BASE = {
  type: 'CALL' as const,
  subject: 'Follow-up call with buyer',
  notes: 'Detailed notes here',
  date: '2026-01-15',
};

// ============================================================================
// type
// ============================================================================

describe('InteractionFormSchema — type', () => {
  const validTypes = [
    'CALL',
    'EMAIL',
    'MEETING',
    'NOTE',
    'SMS',
    'WHATSAPP',
    'VIDEO_CALL',
  ] as const;

  it.each(validTypes)('accepts type="%s"', (type) => {
    expect(InteractionFormSchema.safeParse({ ...VALID_BASE, type }).success).toBe(true);
  });

  it('rejects invalid type', () => {
    expect(
      InteractionFormSchema.safeParse({ ...VALID_BASE, type: 'FAXED' }).success,
    ).toBe(false);
  });

  it('fails when type is missing', () => {
    const { type: _, ...rest } = VALID_BASE;
    expect(InteractionFormSchema.safeParse(rest).success).toBe(false);
  });
});

// ============================================================================
// subject
// ============================================================================

describe('InteractionFormSchema — subject', () => {
  it('passes with a valid subject', () => {
    expect(InteractionFormSchema.safeParse(VALID_BASE).success).toBe(true);
  });

  it('fails when subject is missing', () => {
    const result = InteractionFormSchema.safeParse({
      ...VALID_BASE,
      subject: undefined,
    });
    expect(result.success).toBe(false);
  });

  it('fails when subject is too short (< 3 chars)', () => {
    const result = InteractionFormSchema.safeParse({ ...VALID_BASE, subject: 'Hi' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/3 characters/);
    }
  });

  it('passes with exactly 3 characters', () => {
    expect(
      InteractionFormSchema.safeParse({ ...VALID_BASE, subject: 'abc' }).success,
    ).toBe(true);
  });
});

// ============================================================================
// notes (required)
// ============================================================================

describe('InteractionFormSchema — notes', () => {
  it('passes with valid notes', () => {
    expect(
      InteractionFormSchema.safeParse({
        ...VALID_BASE,
        notes: 'Buyer expressed interest',
      }).success,
    ).toBe(true);
  });

  it('fails when notes is empty', () => {
    expect(
      InteractionFormSchema.safeParse({ ...VALID_BASE, notes: '' }).success,
    ).toBe(false);
  });

  it('fails when notes exceed 2000 characters', () => {
    expect(
      InteractionFormSchema.safeParse({
        ...VALID_BASE,
        notes: 'x'.repeat(2001),
      }).success,
    ).toBe(false);
  });
});

// ============================================================================
// date
// ============================================================================

describe('InteractionFormSchema — date', () => {
  it('passes with ISO date string', () => {
    expect(
      InteractionFormSchema.safeParse({ ...VALID_BASE, date: '2026-03-01' })
        .success,
    ).toBe(true);
  });

  it('fails when date is missing', () => {
    const result = InteractionFormSchema.safeParse({ ...VALID_BASE, date: '' });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// Default values
// ============================================================================

describe('interactionFormDefaultValues', () => {
  it('has all required keys', () => {
    expect(interactionFormDefaultValues).toMatchObject({
      type: 'CALL',
      subject: '',
      notes: '',
    });
  });

  it('date defaults to today (YYYY-MM-DD format)', () => {
    expect(interactionFormDefaultValues.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('passes validation when required fields are populated', () => {
    const filled = { ...interactionFormDefaultValues, ...VALID_BASE };
    expect(InteractionFormSchema.safeParse(filled).success).toBe(true);
  });
});
