/**
 * Unit tests — TaskFormSchema
 * Covers all fields: title, description, type, priority, status, dueDate
 */

import { describe, it, expect } from 'vitest';
import {
  TaskFormSchema,
  taskFormDefaultValues,
} from './task-form.schema';

const VALID_BASE = {
  title: 'Follow up with Ahmed about property',
  type: 'FOLLOW_UP' as const,
  priority: 'MEDIUM' as const,
  dueDate: '2026-03-01',
};

// ============================================================================
// title
// ============================================================================

describe('TaskFormSchema — title', () => {
  it('passes with a valid title', () => {
    expect(TaskFormSchema.safeParse(VALID_BASE).success).toBe(true);
  });

  it('fails when title is missing', () => {
    const result = TaskFormSchema.safeParse({ ...VALID_BASE, title: undefined });
    expect(result.success).toBe(false);
  });

  it('fails when title is too short (< 3 chars)', () => {
    const result = TaskFormSchema.safeParse({ ...VALID_BASE, title: 'Hi' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/3 characters/);
    }
  });

  it('fails when title exceeds 200 characters', () => {
    expect(
      TaskFormSchema.safeParse({ ...VALID_BASE, title: 'x'.repeat(201) }).success,
    ).toBe(false);
  });

  it('passes with exactly 3 characters', () => {
    expect(
      TaskFormSchema.safeParse({ ...VALID_BASE, title: 'abc' }).success,
    ).toBe(true);
  });
});

// ============================================================================
// type
// ============================================================================

describe('TaskFormSchema — type', () => {
  const validTypes = [
    'FOLLOW_UP',
    'VIEWING',
    'MEETING',
    'DOCUMENT',
    'CALL',
    'EMAIL',
    'INSPECTION',
    'OTHER',
  ] as const;

  it.each(validTypes)('accepts type="%s"', (type) => {
    expect(TaskFormSchema.safeParse({ ...VALID_BASE, type }).success).toBe(true);
  });

  it('rejects invalid type', () => {
    expect(
      TaskFormSchema.safeParse({ ...VALID_BASE, type: 'LUNCH' }).success,
    ).toBe(false);
  });

  it('fails when type is missing', () => {
    const { type: _, ...rest } = VALID_BASE;
    expect(TaskFormSchema.safeParse(rest).success).toBe(false);
  });
});

// ============================================================================
// priority
// ============================================================================

describe('TaskFormSchema — priority', () => {
  const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

  it.each(validPriorities)('accepts priority="%s"', (priority) => {
    expect(
      TaskFormSchema.safeParse({ ...VALID_BASE, priority }).success,
    ).toBe(true);
  });

  it('rejects invalid priority', () => {
    expect(
      TaskFormSchema.safeParse({ ...VALID_BASE, priority: 'EXTREME' }).success,
    ).toBe(false);
  });
});

// ============================================================================
// status (optional)
// ============================================================================

describe('TaskFormSchema — status', () => {
  const validStatuses = [
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'OVERDUE',
  ] as const;

  it.each(validStatuses)('accepts status="%s"', (status) => {
    expect(
      TaskFormSchema.safeParse({ ...VALID_BASE, status }).success,
    ).toBe(true);
  });

  it('passes when status is omitted (optional)', () => {
    expect(TaskFormSchema.safeParse(VALID_BASE).success).toBe(true);
  });

  it('rejects invalid status', () => {
    expect(
      TaskFormSchema.safeParse({ ...VALID_BASE, status: 'DONE' }).success,
    ).toBe(false);
  });
});

// ============================================================================
// dueDate
// ============================================================================

describe('TaskFormSchema — dueDate', () => {
  it('passes with ISO date string', () => {
    expect(
      TaskFormSchema.safeParse({ ...VALID_BASE, dueDate: '2026-06-30' }).success,
    ).toBe(true);
  });

  it('fails when dueDate is empty', () => {
    expect(
      TaskFormSchema.safeParse({ ...VALID_BASE, dueDate: '' }).success,
    ).toBe(false);
  });

  it('fails when dueDate is missing', () => {
    const { dueDate: _, ...rest } = VALID_BASE;
    expect(TaskFormSchema.safeParse(rest).success).toBe(false);
  });
});

// ============================================================================
// description (optional)
// ============================================================================

describe('TaskFormSchema — description', () => {
  it('passes when description is omitted', () => {
    expect(TaskFormSchema.safeParse(VALID_BASE).success).toBe(true);
  });

  it('passes with empty string', () => {
    expect(
      TaskFormSchema.safeParse({ ...VALID_BASE, description: '' }).success,
    ).toBe(true);
  });

  it('fails when description exceeds 1000 characters', () => {
    expect(
      TaskFormSchema.safeParse({
        ...VALID_BASE,
        description: 'x'.repeat(1001),
      }).success,
    ).toBe(false);
  });
});

// ============================================================================
// Default values
// ============================================================================

describe('taskFormDefaultValues', () => {
  it('has all expected keys', () => {
    expect(taskFormDefaultValues).toMatchObject({
      title: '',
      description: '',
      type: 'FOLLOW_UP',
      priority: 'MEDIUM',
      status: 'PENDING',
    });
  });

  it('dueDate defaults to tomorrow (YYYY-MM-DD format)', () => {
    expect(taskFormDefaultValues.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(taskFormDefaultValues.dueDate).toBe(
      tomorrow.toISOString().split('T')[0],
    );
  });

  it('passes schema validation when required fields are populated', () => {
    const filled = { ...taskFormDefaultValues, ...VALID_BASE };
    expect(TaskFormSchema.safeParse(filled).success).toBe(true);
  });
});
