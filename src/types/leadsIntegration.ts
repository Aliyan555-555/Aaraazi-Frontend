/**
 * Lead Integration Types
 * 
 * Extension types for integrating the new Lead system with existing entities
 * These fields should be added to Contact, Requirement, and Property types
 */

import { LeadSource, LeadIntent } from './leads';

// ============================================
// CONTACT LEAD TRACKING
// ============================================

/**
 * Fields to be added to Contact interface for lead tracking
 * 
 * Usage: Add these fields to your existing Contact interface
 */
export interface ContactLeadTracking {
  // Lead linkage
  leadId?: string;                    // ID of the originating lead
  convertedFromLead?: boolean;        // Was this contact created from lead conversion?
  leadSource?: LeadSource;            // Original lead source
  leadInitialIntent?: LeadIntent;     // Original intent when first contacted
  leadConvertedAt?: string;           // When lead was converted to contact
  
  // Quality indicators
  leadQualificationScore?: number;    // Original qualification score (0-100)
}

// ============================================
// REQUIREMENT LEAD TRACKING
// ============================================

/**
 * Fields to be added to BuyerRequirement and RentRequirement interfaces
 * 
 * Usage: Add these fields to your existing Requirement interfaces
 */
export interface RequirementLeadTracking {
  // Contact linkage (REQUIRED for requirements)
  contactId: string;                  // REQUIRED - link to the contact
  
  // Lead linkage
  leadId?: string;                    // ID of the originating lead
  createdFromLead?: boolean;          // Was this created from lead conversion?
}

// ============================================
// PROPERTY LISTING SOURCE TRACKING
// ============================================

/**
 * Listing source information for properties
 * Tracks how the property listing was acquired
 */
export interface PropertyListingSource {
  type: 'lead-conversion' | 'direct' | 'referral' | 'other';
  leadId?: string;                    // If from lead conversion
  contactId?: string;                 // Contact who listed it
  convertedAt?: string;               // When converted from lead
  notes?: string;                     // Additional source notes
}

/**
 * Fields to be added to Property interface for listing source tracking
 * 
 * Usage: Add this field to your existing Property interface
 */
export interface PropertyLeadTracking {
  // Listing source
  listingSource?: PropertyListingSource;
}

// ============================================
// FULL EXTENDED TYPES (REFERENCE)
// ============================================

/**
 * Reference: How Contact type should look with lead tracking
 * 
 * @example
 * ```typescript
 * interface Contact extends ContactLeadTracking {
 *   // ... existing Contact fields ...
 *   id: string;
 *   name: string;
 *   phone: string;
 *   email?: string;
 *   // ... etc
 * }
 * ```
 */

/**
 * Reference: How BuyerRequirement type should look with lead tracking
 * 
 * @example
 * ```typescript
 * interface BuyerRequirement extends RequirementLeadTracking {
 *   // ... existing BuyerRequirement fields ...
 *   id: string;
 *   budgetMin?: number;
 *   budgetMax?: number;
 *   // ... etc
 * }
 * ```
 */

/**
 * Reference: How Property type should look with lead tracking
 * 
 * @example
 * ```typescript
 * interface Property extends PropertyLeadTracking {
 *   // ... existing Property fields ...
 *   id: string;
 *   title: string;
 *   address: string;
 *   // ... etc
 * }
 * ```
 */

// ============================================
// TYPE GUARDS
// ============================================

/**
 * Check if a contact was created from a lead
 */
export function isLeadConvertedContact(contact: any): boolean {
  return contact.convertedFromLead === true && !!contact.leadId;
}

/**
 * Check if a requirement was created from a lead
 */
export function isLeadConvertedRequirement(requirement: any): boolean {
  return requirement.createdFromLead === true && !!requirement.leadId;
}

/**
 * Check if a property listing came from lead conversion
 */
export function isLeadConvertedProperty(property: any): boolean {
  return property.listingSource?.type === 'lead-conversion' && !!property.listingSource.leadId;
}

// ============================================
// CONVERSION HELPERS
// ============================================

/**
 * Extract lead tracking data for contact creation
 */
export function extractContactLeadTracking(lead: {
  id: string;
  source: LeadSource;
  intent: LeadIntent;
  qualificationScore: number;
}): ContactLeadTracking {
  return {
    leadId: lead.id,
    convertedFromLead: true,
    leadSource: lead.source,
    leadInitialIntent: lead.intent,
    leadConvertedAt: new Date().toISOString(),
    leadQualificationScore: lead.qualificationScore,
  };
}

/**
 * Extract lead tracking data for requirement creation
 */
export function extractRequirementLeadTracking(
  leadId: string,
  contactId: string
): RequirementLeadTracking {
  return {
    contactId,
    leadId,
    createdFromLead: true,
  };
}

/**
 * Extract listing source for property creation
 */
export function extractPropertyListingSource(
  leadId: string,
  contactId: string
): PropertyListingSource {
  return {
    type: 'lead-conversion',
    leadId,
    contactId,
    convertedAt: new Date().toISOString(),
  };
}
