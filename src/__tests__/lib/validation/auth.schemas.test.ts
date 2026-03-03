/**
 * Auth Validation Schema Tests
 * Unit tests for Zod validation schemas
 */

import {
  tenantLookupSchema,
  loginFormSchema,
  loginSchema,
} from '@/lib/validation/auth.schemas';

describe('tenantLookupSchema', () => {
  it('accepts valid domain', () => {
    const result = tenantLookupSchema.safeParse({ domain: 'agency.com' });
    expect(result.success).toBe(true);
  });

  it('rejects empty domain', () => {
    const result = tenantLookupSchema.safeParse({ domain: '' });
    expect(result.success).toBe(false);
  });

  it('rejects whitespace-only domain', () => {
    const result = tenantLookupSchema.safeParse({ domain: '   ' });
    expect(result.success).toBe(false);
  });

  it('rejects domain shorter than 2 characters', () => {
    const result = tenantLookupSchema.safeParse({ domain: 'a' });
    expect(result.success).toBe(false);
  });

  it('trims and accepts domain with surrounding whitespace', () => {
    const result = tenantLookupSchema.safeParse({ domain: '  agency.com  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.domain).toBe('agency.com');
    }
  });
});

describe('loginFormSchema', () => {
  it('accepts valid email and password', () => {
    const result = loginFormSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = loginFormSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects short password', () => {
    const result = loginFormSchema.safeParse({
      email: 'user@example.com',
      password: '12345',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty email', () => {
    const result = loginFormSchema.safeParse({
      email: '',
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty password', () => {
    const result = loginFormSchema.safeParse({
      email: 'user@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional selectedAgencyId', () => {
    const result = loginFormSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      selectedAgencyId: 'agency-1',
    });
    expect(result.success).toBe(true);
  });
});

describe('loginSchema', () => {
  it('accepts full login payload', () => {
    const result = loginSchema.safeParse({
      tenantId: 'tenant-1',
      email: 'user@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('accepts optional agencyId', () => {
    const result = loginSchema.safeParse({
      tenantId: 'tenant-1',
      agencyId: 'agency-1',
      email: 'user@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing tenantId', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });
});
