/**
 * Contact types aligned with Prisma schema.
 * Production-grade interfaces for the contact module.
 */

import type { Contact as SchemaContact } from '@/types/schema';
import type { ContactType, ContactCategory, ContactStatus } from './contact.enums';

// Re-export API contact shape
export type Contact = SchemaContact;

/** Form UI type (buyer, seller, etc.) - maps to ContactType + ContactCategory */
export type ContactFormType =
  | 'buyer'
  | 'seller'
  | 'tenant'
  | 'landlord'
  | 'investor'
  | 'vendor'
  | 'external-broker';

/** Preferences JSON stored in Contact.preferences (company, notes) */
export interface ContactPreferences {
  company?: string;
  notes?: string;
}

/** Create contact input - aligns with backend CreateContactDto */
export interface CreateContactInput {
  name: string;
  phone: string;
  email?: string;
  alternatePhone?: string;
  address?: string;
  cnic?: string;
  type: ContactType;
  category: ContactCategory;
  status?: ContactStatus;
  tenantId: string;
  agencyId: string;
  branchId?: string;
  agentId?: string;
  preferences?: string;
  tags?: string;
  isShared?: boolean;
}

/** Update contact input - aligns with backend UpdateContactDto */
export interface UpdateContactInput {
  name?: string;
  phone?: string;
  email?: string;
  alternatePhone?: string;
  address?: string;
  cnic?: string;
  type?: ContactType;
  category?: ContactCategory;
  status?: ContactStatus;
  agentId?: string;
  preferences?: string;
  tags?: string;
}
