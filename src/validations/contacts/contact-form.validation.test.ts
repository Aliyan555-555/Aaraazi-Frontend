/**
 * Unit tests — ContactFormSchema (validations/contacts)
 * Aligned with production schema (no filerStatus).
 */

import { describe, it, expect } from 'vitest';
import {
  ContactFormSchema,
  contactFormDefaultValues,
  PK_PHONE_REGEX,
  CNIC_REGEX,
} from './contact-form.validation';

const VALID_BASE = {
  name: 'Ahmed Ali',
  phone: '03001234567',
  type: 'buyer' as const,
};

describe('PK_PHONE_REGEX', () => {
  it.each([
    ['03001234567', true],
    ['+923001234567', true],
    ['03211234567', true],
    ['09001234567', false],
    ['3001234567', false],
    ['0300123456', false],
    ['030012345678', false],
    ['abcd1234567', false],
  ])('"%s" → valid: %s', (phone, expected) => {
    expect(PK_PHONE_REGEX.test(phone)).toBe(expected);
  });
});

describe('CNIC_REGEX', () => {
  it.each([
    ['12345-1234567-8', true],
    ['42101-9876543-2', true],
    ['1234512345678', false],
    ['1234-1234567-89', false],
    ['ABCDE-1234567-8', false],
  ])('"%s" → valid: %s', (cnic, expected) => {
    expect(CNIC_REGEX.test(cnic)).toBe(expected);
  });
});

describe('ContactFormSchema — name', () => {
  it('passes with a valid name', () => {
    expect(ContactFormSchema.safeParse({ ...VALID_BASE, name: 'Ahmed Ali' }).success).toBe(true);
  });

  it('fails when name is missing', () => {
    expect(ContactFormSchema.safeParse({ ...VALID_BASE, name: undefined }).success).toBe(false);
  });

  it('fails when name is empty string', () => {
    expect(ContactFormSchema.safeParse({ ...VALID_BASE, name: '' }).success).toBe(false);
  });

  it('fails when name is 1 character', () => {
    const result = ContactFormSchema.safeParse({ ...VALID_BASE, name: 'A' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/2 characters/);
    }
  });

  it('fails when name exceeds 100 characters', () => {
    expect(ContactFormSchema.safeParse({ ...VALID_BASE, name: 'A'.repeat(101) }).success).toBe(false);
  });
});

describe('ContactFormSchema — phone', () => {
  it('passes with 03XXXXXXXXX format', () => {
    expect(ContactFormSchema.safeParse({ ...VALID_BASE, phone: '03001234567' }).success).toBe(true);
  });

  it('passes with +923XXXXXXXXX format', () => {
    expect(ContactFormSchema.safeParse({ ...VALID_BASE, phone: '+923001234567' }).success).toBe(true);
  });

  it('fails with invalid format', () => {
    const result = ContactFormSchema.safeParse({ ...VALID_BASE, phone: '021-1234567' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/Pakistani/i);
    }
  });
});

describe('ContactFormSchema — email', () => {
  it('passes when email is omitted', () => {
    expect(ContactFormSchema.safeParse(VALID_BASE).success).toBe(true);
  });

  it('passes with valid email', () => {
    expect(ContactFormSchema.safeParse({ ...VALID_BASE, email: 'test@example.com' }).success).toBe(true);
  });

  it('passes with empty string', () => {
    expect(ContactFormSchema.safeParse({ ...VALID_BASE, email: '' }).success).toBe(true);
  });

  it('fails with invalid email format', () => {
    expect(ContactFormSchema.safeParse({ ...VALID_BASE, email: 'not-an-email' }).success).toBe(false);
  });
});

describe('ContactFormSchema — cnic', () => {
  it('passes when cnic is omitted', () => {
    expect(ContactFormSchema.safeParse(VALID_BASE).success).toBe(true);
  });

  it('passes with valid CNIC', () => {
    expect(ContactFormSchema.safeParse({ ...VALID_BASE, cnic: '12345-1234567-8' }).success).toBe(true);
  });

  it('passes with empty string', () => {
    expect(ContactFormSchema.safeParse({ ...VALID_BASE, cnic: '' }).success).toBe(true);
  });

  it('fails with invalid format', () => {
    expect(ContactFormSchema.safeParse({ ...VALID_BASE, cnic: '1234512345678' }).success).toBe(false);
  });
});

describe('ContactFormSchema — type', () => {
  const validTypes = ['buyer', 'seller', 'tenant', 'landlord', 'investor', 'vendor', 'external-broker'] as const;

  it.each(validTypes)('accepts type="%s"', (type) => {
    expect(ContactFormSchema.safeParse({ ...VALID_BASE, type }).success).toBe(true);
  });

  it('rejects invalid type', () => {
    expect(ContactFormSchema.safeParse({ ...VALID_BASE, type: 'unknown' }).success).toBe(false);
  });
});

describe('ContactFormSchema — optional text fields', () => {
  it('passes when notes is empty', () => {
    expect(ContactFormSchema.safeParse({ ...VALID_BASE, notes: '' }).success).toBe(true);
  });

  it('fails when notes exceeds 500 characters', () => {
    expect(ContactFormSchema.safeParse({ ...VALID_BASE, notes: 'x'.repeat(501) }).success).toBe(false);
  });

  it('fails when company exceeds 200 characters', () => {
    expect(ContactFormSchema.safeParse({ ...VALID_BASE, company: 'x'.repeat(201) }).success).toBe(false);
  });

  it('fails when address exceeds 500 characters', () => {
    expect(ContactFormSchema.safeParse({ ...VALID_BASE, address: 'x'.repeat(501) }).success).toBe(false);
  });
});

describe('contactFormDefaultValues', () => {
  it('has the correct shape', () => {
    expect(contactFormDefaultValues).toMatchObject({
      name: '',
      phone: '',
      email: '',
      cnic: '',
      type: 'buyer',
      company: '',
      address: '',
      notes: '',
    });
  });

  it('passes schema when required fields are populated', () => {
    const filled = {
      ...contactFormDefaultValues,
      name: 'Ahmed Ali',
      phone: '03001234567',
    };
    expect(ContactFormSchema.safeParse(filled).success).toBe(true);
  });
});
