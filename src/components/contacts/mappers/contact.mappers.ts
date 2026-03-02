/**
 * Contact mappers - API <-> form value transformations.
 */

import type { Contact } from '@/types/schema';
import type { ContactFormValues } from '@/validations/contacts';
import type { ContactFormType } from '@/types/contacts/contact.types';
import { ContactType, ContactCategory } from '@/types/schema';

// ============================================================================
// Form type -> Backend enum mapping
// ============================================================================

export const FORM_TYPE_TO_CATEGORY: Record<ContactFormType, ContactCategory> = {
  buyer: ContactCategory.BUYER,
  seller: ContactCategory.SELLER,
  tenant: ContactCategory.TENANT,
  landlord: ContactCategory.LANDLORD,
  investor: ContactCategory.BOTH,
  vendor: ContactCategory.BOTH,
  'external-broker': ContactCategory.EXTERNAL_BROKER,
};

export const FORM_TYPE_TO_TYPE: Record<ContactFormType, ContactType> = {
  investor: ContactType.INVESTOR,
  vendor: ContactType.VENDOR,
  buyer: ContactType.CLIENT,
  seller: ContactType.CLIENT,
  tenant: ContactType.CLIENT,
  landlord: ContactType.CLIENT,
  'external-broker': ContactType.CLIENT,
};

// ============================================================================
// API Contact -> Form values (for edit mode)
// ============================================================================

function contactToFormType(c: Contact | null | undefined, defaultType?: ContactFormType): ContactFormType {
  if (!c) return defaultType ?? 'buyer';
  if (c.type === ContactType.INVESTOR) return 'investor';
  if (c.type === ContactType.VENDOR) return 'vendor';
  if (c.category && c.category !== ContactCategory.BOTH) {
    const m: Record<string, ContactFormType> = {
      BUYER: 'buyer',
      SELLER: 'seller',
      TENANT: 'tenant',
      LANDLORD: 'landlord',
      EXTERNAL_BROKER: 'external-broker',
    };
    if (m[c.category]) return m[c.category];
  }
  return defaultType ?? 'buyer';
}

function getPreferences(c: Contact): { company?: string; notes?: string } {
  const p = c.preferences;
  if (!p || typeof p !== 'object') return {};
  const o = p as Record<string, unknown>;
  return {
    company: typeof o.company === 'string' ? o.company : undefined,
    notes: typeof o.notes === 'string' ? o.notes : undefined,
  };
}

export function mapApiContactToFormValues(
  contact: Contact | null | undefined,
  defaultType?: ContactFormType,
): ContactFormValues {
  if (!contact) {
    return {
      name: '',
      phone: '',
      email: '',
      cnic: '',
      type: defaultType ?? 'buyer',
      company: '',
      address: '',
      notes: '',
    };
  }
  const pref = getPreferences(contact);
  return {
    name: contact.name,
    phone: contact.phone,
    email: contact.email ?? '',
    cnic: contact.cnic ?? '',
    type: contactToFormType(contact, defaultType),
    company: pref.company ?? '',
    address: contact.address ?? '',
    notes: pref.notes ?? '',
  };
}

// ============================================================================
// Form values -> Create DTO
// ============================================================================

export function mapFormValuesToCreateDto(
  values: ContactFormValues,
  tenantId: string,
  agencyId: string,
  agentId?: string,
) {
  const type = FORM_TYPE_TO_TYPE[values.type];
  const category = FORM_TYPE_TO_CATEGORY[values.type];
  const preferences: { company?: string; notes?: string } = {};
  if (values.company?.trim()) preferences.company = values.company.trim();
  if (values.notes?.trim()) preferences.notes = values.notes.trim();
  return {
    name: values.name.trim(),
    phone: values.phone.trim(),
    email: values.email?.trim() || undefined,
    type,
    category,
    status: 'ACTIVE' as const,
    tenantId,
    agencyId,
    agentId,
    address: values.address?.trim() || undefined,
    cnic: values.cnic?.trim() || undefined,
    preferences: Object.keys(preferences).length > 0 ? JSON.stringify(preferences) : undefined,
    tags: '',
  };
}

// ============================================================================
// Form values -> Update DTO
// ============================================================================

export function mapFormValuesToUpdateDto(values: ContactFormValues) {
  const type = FORM_TYPE_TO_TYPE[values.type];
  const category = FORM_TYPE_TO_CATEGORY[values.type];
  const preferences: { company?: string; notes?: string } = {};
  if (values.company?.trim()) preferences.company = values.company.trim();
  if (values.notes?.trim()) preferences.notes = values.notes.trim();
  return {
    name: values.name.trim(),
    phone: values.phone.trim(),
    email: values.email?.trim() || undefined,
    type,
    category,
    address: values.address?.trim() || undefined,
    cnic: values.cnic?.trim() || undefined,
    preferences: Object.keys(preferences).length > 0 ? JSON.stringify(preferences) : undefined,
  };
}

// ============================================================================
// API Contact -> UI Contact (for workspace/list display)
// ============================================================================

export interface UIContact {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  type: string;
  category?: string | null;
  status: string;
  tags?: string[] | string | null;
  agentId?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  lastContactDate?: string;
  nextFollowUp?: string;
  address?: string | null;
  cnic?: string | null;
}

export function mapApiContactToUIContact(c: Contact): UIContact {
  const tags = c.tags?.trim() ? c.tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined;
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    type: c.type,
    category: c.category,
    status: c.status,
    tags,
    agentId: c.agentId,
    createdBy: c.createdBy,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    lastContactDate: (c as Contact & { lastContactDate?: string }).lastContactDate,
    nextFollowUp: (c as Contact & { nextFollowUp?: string }).nextFollowUp,
    address: c.address,
    cnic: c.cnic,
  };
}
