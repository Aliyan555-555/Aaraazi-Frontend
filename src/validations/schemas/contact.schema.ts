import { z } from "zod";
import { phoneRegex } from "../common";

export const contactFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  phone: z
    .string()
    .min(1, { message: "Phone number is required" })
    .regex(phoneRegex, {
      message: "Invalid Pakistan phone number format (e.g. 03001234567)",
    }),
  email: z
    .union([
      z.string().email({ message: "Invalid email address" }),
      z.literal(""),
    ])
    .optional(),
  type: z.enum(
    [
      "buyer",
      "seller",
      "tenant",
      "landlord",
      "investor",
      "vendor",
      "external-broker",
    ],
    {
      error: { message: "Please select a contact type" },
    } as any,
  ),
  company: z.string().optional(),
  address: z.string().optional(),
  notes: z
    .string()
    .max(500, { message: "Notes cannot exceed 500 characters" })
    .optional(),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
