/**
 * Sharing Permissions System
 * Handles access control and data anonymization for shared cycles
 */

import {
  AccessLevel,
  AccessContext,
  PermissionCheck,
  UserRole,
} from '../types';
import { Contact, Offer } from '../types';

// ============================================
// ACCESS LEVEL CALCULATION
// ============================================

/**
 * Calculate access level for a user to a cycle
 */
export function getAccessLevel(context: AccessContext): AccessLevel {
  const { userId, userRole, cycleOwnerId, isShared } = context;
  
  // Admin has full access
  if (userRole === 'admin') {
    return 'admin';
  }
  
  // Owner has full access
  if (userId === cycleOwnerId) {
    return 'owner';
  }
  
  // Manager has oversight access
  if (userRole === 'manager') {
    return 'manager';
  }
  
  // Agent can access if shared
  if (userRole === 'agent' && isShared) {
    return 'shared-peer';
  }
  
  // No access
  return 'none';
}

// ============================================
// PERMISSION CHECKS
// ============================================

/**
 * Get permissions based on access level
 */
export function getPermissions(accessLevel: AccessLevel): PermissionCheck {
  const basePermissions: PermissionCheck = {
    canViewProperty: false,
    canViewOwner: false,
    canViewOwnerContact: false,
    canViewInterestedContacts: false,
    canViewContactDetails: false,
    canViewOffers: false,
    canViewOfferDetails: false,
    canSubmitOffer: false,
    canAcceptOffer: false,
    canViewCRM: false,
    canViewPrivateNotes: false,
    canViewFinancials: false,
    canViewCommission: false,
    canViewDocuments: false,
    canViewTransactions: false,
    canEditCycle: false,
    canDeleteCycle: false,
    canShareCycle: false,
  };
  
  switch (accessLevel) {
    case 'owner':
      // Owner has full access to everything
      return {
        canViewProperty: true,
        canViewOwner: true,
        canViewOwnerContact: true,
        canViewInterestedContacts: true,
        canViewContactDetails: true,
        canViewOffers: true,
        canViewOfferDetails: true,
        canSubmitOffer: false, // Can't submit offer on own listing
        canAcceptOffer: true,
        canViewCRM: true,
        canViewPrivateNotes: true,
        canViewFinancials: true,
        canViewCommission: true,
        canViewDocuments: true,
        canViewTransactions: true,
        canEditCycle: true,
        canDeleteCycle: true,
        canShareCycle: true,
      };
    
    case 'shared-peer':
      // Peer can view property and submit offers, but no contact details
      return {
        ...basePermissions,
        canViewProperty: true,
        canViewInterestedContacts: true,  // Count only
        canViewOffers: true,              // Count/status only
        canSubmitOffer: true,             // KEY: Can submit offers
      };
    
    case 'manager':
      // Manager can see pipeline and financials, but not contact details
      return {
        ...basePermissions,
        canViewProperty: true,
        canViewOwner: true,               // Knows owner exists
        canViewInterestedContacts: true,  // Count/status only
        canViewOffers: true,
        canViewOfferDetails: true,        // Amounts visible, buyers anonymized
        canViewFinancials: true,          // Totals only
        canViewDocuments: true,           // Status only
        canViewTransactions: true,
      };
    
    case 'admin':
      // Admin has full access to everything
      return Object.keys(basePermissions).reduce((acc, key) => ({
        ...acc,
        [key]: true,
      }), {} as PermissionCheck);
    
    case 'none':
    default:
      return basePermissions;
  }
}

/**
 * Quick permission check
 */
export function hasPermission(
  context: AccessContext,
  permission: keyof PermissionCheck
): boolean {
  const level = getAccessLevel(context);
  const permissions = getPermissions(level);
  return permissions[permission];
}

// ============================================
// DATA ANONYMIZATION
// ============================================

/**
 * Anonymize contact based on access level
 */
export function anonymizeContact(
  contact: Contact,
  accessLevel: AccessLevel,
  contactType: 'owner' | 'buyer' | 'general' = 'general'
): Contact {
  if (accessLevel === 'owner' || accessLevel === 'admin') {
    return contact; // Return unchanged
  }
  
  const labels = {
    owner: '[Property Owner]',
    buyer: '[Interested Buyer]',
    general: '[Contact]',
  };
  
  return {
    ...contact,
    name: labels[contactType],
    email: '[Contact listing agent]',
    phone: '[Contact listing agent]',
    address: contact.address ? getAreaOnly(String(contact.address)) : '',
    notes: '', // Clear notes
    // Preserve non-sensitive fields
    type: contact.type,
    createdAt: contact.createdAt,
  };
}

/**
 * Anonymize offer based on access level
 */
export function anonymizeOffer(
  offer: Offer,
  accessLevel: AccessLevel,
  buyerIndex?: number
): Offer {
  if (accessLevel === 'owner' || accessLevel === 'admin') {
    return offer;
  }
  
  if (accessLevel === 'manager') {
    return {
      ...offer,
      buyerName: `[Buyer ${buyerIndex ? String.fromCharCode(64 + buyerIndex) : 'X'}]`,
      buyerContact: '[Redacted]',
      notes: '', // Hide private notes
    };
  }
  
  // shared-peer
  return {
    ...offer,
    buyerName: '[Contact listing agent]',
    buyerContact: '[Contact listing agent]',
    offerAmount: 0,
    tokenAmount: 0,
    notes: '',
  };
}

/**
 * Extract area from full address (anonymize detailed location)
 */
export function getAreaOnly(address: string): string {
  // "House 123, Street 5, DHA Phase 8, Karachi, Pakistan"
  // → "DHA Phase 8, Karachi"
  
  const parts = address.split(',').map(p => p.trim());
  
  if (parts.length >= 2) {
    // Return last 2 parts (area, city)
    return parts.slice(-2).join(', ');
  }
  
  return address;
}

/**
 * Get anonymized buyer label for sequential anonymization
 */
export function getAnonymizedBuyerLabel(
  offer: Offer,
  allOffers: Offer[]
): string {
  // Find unique buyers
  const uniqueBuyers = new Set(allOffers.map(o => o.buyerId));
  const buyerArray = Array.from(uniqueBuyers);
  const buyerIndex = buyerArray.indexOf(offer.buyerId);
  
  // Convert to letter: 0 → A, 1 → B, etc.
  if (buyerIndex >= 0 && buyerIndex < 26) {
    return `[Buyer ${String.fromCharCode(65 + buyerIndex)}]`;
  }
  
  // For > 26 buyers, use numbers
  return `[Buyer ${buyerIndex + 1}]`;
}
