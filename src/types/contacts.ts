import { z } from "zod";
import type { ContactLeadTracking } from "./leadsIntegration";

/**
 * Contact/Client Management Types
 *
 * Task 1.1: Zod schema-first approach.
 * All TypeScript interfaces are inferred from Zod schemas.
 *
 * NOTE: ContactType here is the frontend-facing union used in the UI.
 * It extends the backend Prisma enum with AGENT and DEVELOPER for the
 * acceptance criteria "Buyer, Seller, Investor, Agent, Developer".
 */

// ============================================================================
// Zod Schemas
// ============================================================================

export const ContactTypeSchema = z.enum([
  "client",
  "prospect",
  "investor",
  "vendor",
  "partner",
  "agent",
  "developer",
]);

export const ContactCategorySchema = z.enum([
  "buyer",
  "seller",
  "tenant",
  "landlord",
  "external-broker",
  "both",
]);

export const ContactStatusSchema = z.enum([
  "active",
  "inactive",
  "archived",
  "blocked",
]);

/** CNIC regex: 5 digits, dash, 7 digits, dash, 1 digit e.g. 12345-1234567-8 */
const cnicRegex = /^\d{5}-\d{7}-\d$/;

/**
 * Pakistani mobile number: 03XXXXXXXXX or +923XXXXXXXXX
 */
const pkPhoneRegex = /^((\+92|0)3[0-9]{9})$/;

export const ContactSchema = z.object({
  id: z.string().cuid(),

  // Core identity
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z
    .string()
    .regex(
      pkPhoneRegex,
      "Must be a valid Pakistani mobile number (03XXXXXXXXXX or +923XXXXXXXXX)",
    ),
  email: z.string().email("Invalid email address").optional(),
  address: z.string().max(500).optional(),
  company: z.string().max(200).optional(),
  cnic: z
    .string()
    .regex(cnicRegex, "CNIC must be in the format XXXXX-XXXXXXX-X")
    .optional(),

  // Classification
  type: ContactTypeSchema,
  category: ContactCategorySchema.optional(),
  status: ContactStatusSchema,

  // Source & notes
  source: z.string().optional(),
  notes: z.string().max(2000).optional(),
  tags: z.array(z.string()).optional(),

  // Assignment
  agentId: z.string().optional(),
  createdBy: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),

  // Tracking (from CRM / lead integration)
  lastContactDate: z.string().datetime().optional(),
  nextFollowUp: z.string().datetime().optional(),
  recentInquiryDate: z.string().datetime().optional(),
  interestedProperties: z.array(z.string()).optional(),
  totalTransactions: z.number().int().nonnegative().optional(),
  totalDeals: z.number().int().nonnegative().optional(),
  totalVolume: z.number().nonnegative().optional(),
  totalCommissionEarned: z.number().nonnegative().optional(),
});

/** Schema for creating a new contact — no id/timestamps required */
export const CreateContactSchema = ContactSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  // Allow non-strict datetime strings from form inputs
  lastContactDate: z.string().optional(),
  nextFollowUp: z.string().optional(),
  recentInquiryDate: z.string().optional(),
});

/** Schema for partial updates */
export const UpdateContactSchema = CreateContactSchema.partial().extend({
  id: z.string().cuid(),
});

// ============================================================================
// Inferred TypeScript Types
// ============================================================================

export type ContactType = z.infer<typeof ContactTypeSchema>;
export type ContactCategory = z.infer<typeof ContactCategorySchema>;
export type ContactStatus = z.infer<typeof ContactStatusSchema>;

/**
 * The full Contact type — Zod-inferred + lead tracking fields.
 * Lead tracking is a Partial extension (from leadsIntegration.ts).
 */
export type Contact = z.infer<typeof ContactSchema> &
  Partial<ContactLeadTracking>;

export type CreateContactInput = z.infer<typeof CreateContactSchema> &
  Partial<ContactLeadTracking>;

export type UpdateContactInput = z.infer<typeof UpdateContactSchema>;

// ============================================================================
// Filter Type (for the UI filter panel — Task 1.4)
// ============================================================================

/**
 * The consolidated "role" filter used in the FilterPanel / quickFilters.
 * Maps "Buyer" -> category=buyer, "Seller" -> category=seller,
 * "Investor" -> type=investor, "Agent" -> type=agent,
 * "Developer" -> type=developer.
 */
export type ContactRoleFilter =
  | "buyer"
  | "seller"
  | "investor"
  | "agent"
  | "developer";
