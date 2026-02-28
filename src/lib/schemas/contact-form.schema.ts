import { z } from "zod";
export const PK_PHONE_REGEX = /^((\+92|0)3[0-9]{9})$/;

export const CNIC_REGEX = /^\d{5}-\d{7}-\d$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ============================================================================
// Enum schemas
// ============================================================================

export const ContactFormTypeSchema = z.enum(
  [
    "buyer",
    "seller",
    "tenant",
    "landlord",
    "investor",
    "vendor",
    "external-broker",
  ],
  { required_error: "Contact type is required" },
);

export const FilerStatusSchema = z.enum(["filer", "non-filer"], {
  required_error: "Filer status is required",
});

// ============================================================================
// Main Contact Form Schema
// ============================================================================

/**
 * Zod schema for the Quick Add Contact / KYC form.
 * All optional fields are explicitly marked; required fields have
 * clear, agent-friendly error messages.
 */
export const ContactFormSchema = z.object({
  // ── Personal identity ──────────────────────────────────────────────────

  name: z
    .string({ required_error: "Full name is required" })
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .trim(),

  /**
   * Phone must be in Pakistani format.
   * Default/placeholder guides agent to use 03XX prefix.
   */
  phone: z
    .string({ required_error: "Phone number is required" })
    .trim()
    .regex(
      PK_PHONE_REGEX,
      "Enter a valid Pakistani mobile number — 03XXXXXXXXXX or +923XXXXXXXXX",
    ),

  email: z
    .string()
    .email("Enter a valid email address")
    .max(254, "Email is too long")
    .optional()
    .or(z.literal("")),

  /**
   * CNIC in masked format XXXXX-XXXXXXX-X.
   * The CNICInput component auto-applies the mask before this is
   * validated, so the regex simply verifies the canonical format.
   */
  cnic: z
    .string()
    .regex(
      CNIC_REGEX,
      "Enter a valid CNIC: XXXXX-XXXXXXX-X (e.g. 42101-1234567-3)",
    )
    .optional()
    .or(z.literal("")),

  // ── KYC / Tax info ─────────────────────────────────────────────────────

  /**
   * Critical for PKR WHT calculation on property transfers.
   * Defaults to 'non-filer' (conservative / safer assumption).
   */
  filerStatus: FilerStatusSchema.default("non-filer"),

  // ── Classification ─────────────────────────────────────────────────────

  type: ContactFormTypeSchema,

  company: z
    .string()
    .max(200, "Company name must be less than 200 characters")
    .optional()
    .or(z.literal("")),

  // ── Additional details ─────────────────────────────────────────────────

  address: z
    .string()
    .max(500, "Address must be less than 500 characters")
    .optional()
    .or(z.literal("")),

  notes: z
    .string()
    .max(500, "Notes must be less than 500 characters")
    .optional()
    .or(z.literal("")),
});

// ============================================================================
// Derived types
// ============================================================================

/** TypeScript type inferred from the Zod schema */
export type ContactFormValues = z.infer<typeof ContactFormSchema>;

/** Default values for react-hook-form's useForm({ defaultValues }) */
export const contactFormDefaultValues: ContactFormValues = {
  name: "",
  phone: "",
  email: "",
  cnic: "",
  filerStatus: "non-filer",
  type: "buyer",
  company: "",
  address: "",
  notes: "",
};

// ============================================================================
// Partial schemas for sub-forms / server-side reuse
// ============================================================================

/** KYC-only sub-schema (CNIC + filer) for quick partial validation */
export const KycSubSchema = ContactFormSchema.pick({
  cnic: true,
  filerStatus: true,
});

export type KycValues = z.infer<typeof KycSubSchema>;
