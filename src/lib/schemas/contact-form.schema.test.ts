/**
 * Unit tests — ContactFormSchema (Task 2.6 & 2.7)
 *
 * Covers strict Zod validation for all fields:
 *  • name: required, min 2, max 100
 *  • phone: required, PK_PHONE_REGEX
 *  • email: optional, must be valid when present
 *  • cnic: optional, CNIC_REGEX when present
 *  • filerStatus: enum, defaults to 'non-filer'
 *  • type: required enum
 *  • notes / company / address: optional, max lengths
 */

import { describe, it, expect } from "vitest";
import {
  ContactFormSchema,
  contactFormDefaultValues,
  KycSubSchema,
  PK_PHONE_REGEX,
  CNIC_REGEX,
} from "@/lib/schemas/contact-form.schema";

// Convenience: valid base values to spread and override per test
const VALID_BASE = {
  name: "Ahmed Ali",
  phone: "03001234567",
  type: "buyer" as const,
  filerStatus: "non-filer" as const,
};

// ============================================================================
// PK_PHONE_REGEX standalone tests
// ============================================================================

describe("PK_PHONE_REGEX", () => {
  it.each([
    ["03001234567", true],
    ["+923001234567", true],
    ["03211234567", true],
    ["09001234567", false],
    ["3001234567", false],
    ["0300123456", false], // too short
    ["030012345678", false], // too long
    ["abcd1234567", false],
  ])('"%s" → valid: %s', (phone, expected) => {
    expect(PK_PHONE_REGEX.test(phone)).toBe(expected);
  });
});

// ============================================================================
// CNIC_REGEX standalone tests
// ============================================================================

describe("CNIC_REGEX", () => {
  it.each([
    ["12345-1234567-8", true],
    ["42101-9876543-2", true],
    ["1234512345678", false], // no dashes
    ["1234-1234567-89", false], // wrong first segment length
    ["ABCDE-1234567-8", false], // letters
    ["12345-1234567-89", false], // last segment too long
  ])('"%s" → valid: %s', (cnic, expected) => {
    expect(CNIC_REGEX.test(cnic)).toBe(expected);
  });
});

// ============================================================================
// ContactFormSchema — name
// ============================================================================

describe("ContactFormSchema — name", () => {
  it("passes with a valid name", () => {
    expect(
      ContactFormSchema.safeParse({ ...VALID_BASE, name: "Ahmed Ali" }).success,
    ).toBe(true);
  });

  it("fails when name is missing", () => {
    const result = ContactFormSchema.safeParse({
      ...VALID_BASE,
      name: undefined,
    });
    expect(result.success).toBe(false);
  });

  it("fails when name is empty string", () => {
    const result = ContactFormSchema.safeParse({ ...VALID_BASE, name: "" });
    expect(result.success).toBe(false);
  });

  it("fails when name is 1 character (min 2)", () => {
    const result = ContactFormSchema.safeParse({ ...VALID_BASE, name: "A" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/2 characters/);
    }
  });

  it("fails when name exceeds 100 characters", () => {
    const result = ContactFormSchema.safeParse({
      ...VALID_BASE,
      name: "A".repeat(101),
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// ContactFormSchema — phone
// ============================================================================

describe("ContactFormSchema — phone", () => {
  it("passes with 03XXXXXXXXX format", () => {
    expect(
      ContactFormSchema.safeParse({ ...VALID_BASE, phone: "03001234567" })
        .success,
    ).toBe(true);
  });

  it("passes with +923XXXXXXXXX format", () => {
    expect(
      ContactFormSchema.safeParse({ ...VALID_BASE, phone: "+923001234567" })
        .success,
    ).toBe(true);
  });

  it("fails with invalid format", () => {
    const result = ContactFormSchema.safeParse({
      ...VALID_BASE,
      phone: "021-1234567",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/Pakistani/i);
    }
  });

  it("fails when phone is missing", () => {
    const result = ContactFormSchema.safeParse({
      ...VALID_BASE,
      phone: undefined,
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// ContactFormSchema — email
// ============================================================================

describe("ContactFormSchema — email", () => {
  it("passes when email is omitted (optional)", () => {
    expect(ContactFormSchema.safeParse({ ...VALID_BASE }).success).toBe(true);
  });

  it("passes with a valid email", () => {
    expect(
      ContactFormSchema.safeParse({ ...VALID_BASE, email: "test@example.com" })
        .success,
    ).toBe(true);
  });

  it("passes with empty string (treated as no email)", () => {
    expect(
      ContactFormSchema.safeParse({ ...VALID_BASE, email: "" }).success,
    ).toBe(true);
  });

  it("fails with invalid email format", () => {
    const result = ContactFormSchema.safeParse({
      ...VALID_BASE,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// ContactFormSchema — cnic
// ============================================================================

describe("ContactFormSchema — cnic", () => {
  it("passes when cnic is omitted (optional)", () => {
    expect(ContactFormSchema.safeParse({ ...VALID_BASE }).success).toBe(true);
  });

  it("passes with valid CNIC mask", () => {
    expect(
      ContactFormSchema.safeParse({ ...VALID_BASE, cnic: "12345-1234567-8" })
        .success,
    ).toBe(true);
  });

  it("passes with empty string (no CNIC entered)", () => {
    expect(
      ContactFormSchema.safeParse({ ...VALID_BASE, cnic: "" }).success,
    ).toBe(true);
  });

  it("fails with unmasked digits", () => {
    const result = ContactFormSchema.safeParse({
      ...VALID_BASE,
      cnic: "1234512345678",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/CNIC/i);
    }
  });

  it("fails with wrong format", () => {
    const result = ContactFormSchema.safeParse({
      ...VALID_BASE,
      cnic: "1234-1234567-8",
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// ContactFormSchema — filerStatus
// ============================================================================

describe("ContactFormSchema — filerStatus", () => {
  it('defaults to "non-filer" when not provided', () => {
    const result = ContactFormSchema.safeParse({ ...VALID_BASE });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.filerStatus).toBe("non-filer");
    }
  });

  it('accepts "filer"', () => {
    const result = ContactFormSchema.safeParse({
      ...VALID_BASE,
      filerStatus: "filer",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.filerStatus).toBe("filer");
    }
  });

  it("rejects invalid filer status values", () => {
    const result = ContactFormSchema.safeParse({
      ...VALID_BASE,
      filerStatus: "maybe",
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// ContactFormSchema — type
// ============================================================================

describe("ContactFormSchema — type", () => {
  const validTypes = [
    "buyer",
    "seller",
    "tenant",
    "landlord",
    "investor",
    "vendor",
    "external-broker",
  ] as const;

  it.each(validTypes)('accepts type="%s"', (type) => {
    expect(ContactFormSchema.safeParse({ ...VALID_BASE, type }).success).toBe(
      true,
    );
  });

  it("rejects invalid type", () => {
    const result = ContactFormSchema.safeParse({
      ...VALID_BASE,
      type: "unknown-type",
    });
    expect(result.success).toBe(false);
  });

  it("fails when type is missing", () => {
    const result = ContactFormSchema.safeParse({
      ...VALID_BASE,
      type: undefined,
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// ContactFormSchema — notes, company, address (optional + max length)
// ============================================================================

describe("ContactFormSchema — optional text fields", () => {
  it("passes when notes is empty", () => {
    expect(
      ContactFormSchema.safeParse({ ...VALID_BASE, notes: "" }).success,
    ).toBe(true);
  });

  it("fails when notes exceeds 500 characters", () => {
    const result = ContactFormSchema.safeParse({
      ...VALID_BASE,
      notes: "x".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("fails when company exceeds 200 characters", () => {
    const result = ContactFormSchema.safeParse({
      ...VALID_BASE,
      company: "x".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("fails when address exceeds 500 characters", () => {
    const result = ContactFormSchema.safeParse({
      ...VALID_BASE,
      address: "x".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// contactFormDefaultValues snapshot
// ============================================================================

describe("contactFormDefaultValues", () => {
  it("has the correct shape with all expected keys initialised to empty strings", () => {
    // Defaults are blank form state — intentionally empty for required fields.
    // They should NOT pass full schema validation since name/phone are empty.
    expect(contactFormDefaultValues).toMatchObject({
      name: "",
      phone: "",
      email: "",
      cnic: "",
      company: "",
      address: "",
      notes: "",
      type: "buyer",
      filerStatus: "non-filer",
    });
  });

  it("has filerStatus defaulting to non-filer", () => {
    expect(contactFormDefaultValues.filerStatus).toBe("non-filer");
  });

  it("passes schema validation when required fields are populated", () => {
    const filled = {
      ...contactFormDefaultValues,
      name: "Ahmed Ali",
      phone: "03001234567",
    };
    expect(ContactFormSchema.safeParse(filled).success).toBe(true);
  });
});

// ============================================================================
// KycSubSchema
// ============================================================================

describe("KycSubSchema", () => {
  it("validates cnic + filerStatus independently", () => {
    expect(
      KycSubSchema.safeParse({ cnic: "12345-1234567-8", filerStatus: "filer" })
        .success,
    ).toBe(true);
  });

  it("fails when filerStatus is invalid", () => {
    expect(
      KycSubSchema.safeParse({ cnic: "", filerStatus: "unknown" }).success,
    ).toBe(false);
  });
});
