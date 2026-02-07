/**
 * Buy Cycle Management Utilities
 * Handles buyer representation, property matching, and offer management
 */

import { Property, Contact, Transaction, Commission } from '../types';
import { getProperties, getContacts, updateProperty, addProperty } from './data';
import { transferOwnership } from './ownership';
import { saveTransaction } from './transactions';

// ============================================================================
// PROPERTY MATCHING
// ============================================================================

export interface PropertyMatch {
  property: Property;
  matchScore: number;
  matchReasons: string[];
}

/**
 * Find properties that match a buyer's requirements
 */
export function findMatchingProperties(
  requirement: Property,
  availableProperties: Property[]
): PropertyMatch[] {
  if (requirement.listingType !== 'wanted') {
    return [];
  }

  const matches: PropertyMatch[] = [];

  for (const property of availableProperties) {
    // Skip wanted listings and non-sale properties
    if (property.listingType === 'wanted' || property.listingType === 'for-rent') {
      continue;
    }

    // Skip unavailable properties
    if (property.status !== 'available' && property.status !== 'negotiation') {
      continue;
    }

    let matchScore = 0;
    const matchReasons: string[] = [];

    // Budget matching (40 points)
    if (requirement.budgetMin && requirement.budgetMax) {
      if (property.price >= requirement.budgetMin && property.price <= requirement.budgetMax) {
        matchScore += 40;
        matchReasons.push('Within budget range');
      } else if (property.price < requirement.budgetMin * 1.1 || property.price > requirement.budgetMax * 0.9) {
        matchScore += 20;
        matchReasons.push('Close to budget range');
      }
    }

    // Location matching (30 points)
    if (requirement.preferredLocations && requirement.preferredLocations.length > 0) {
      const propertyLocation = property.address.toLowerCase();
      let locationMatch = false;

      for (const preferredLoc of requirement.preferredLocations) {
        if (propertyLocation.includes(preferredLoc.toLowerCase())) {
          matchScore += 30;
          matchReasons.push(`Located in ${preferredLoc}`);
          locationMatch = true;
          break;
        }
      }

      if (!locationMatch) {
        // Partial location match
        const locationWords = propertyLocation.split(/[\s,]+/);
        for (const preferredLoc of requirement.preferredLocations) {
          const prefWords = preferredLoc.toLowerCase().split(/[\s,]+/);
          if (locationWords.some(w => prefWords.includes(w))) {
            matchScore += 10;
            matchReasons.push('Nearby preferred location');
            break;
          }
        }
      }
    }

    // Property type matching (20 points)
    if (requirement.propertyType && property.propertyType === requirement.propertyType) {
      matchScore += 20;
      matchReasons.push(`${property.propertyType} as requested`);
    }

    // Area matching (10 points)
    if (requirement.area && property.area) {
      const areaDiff = Math.abs(property.area - requirement.area) / requirement.area;
      if (areaDiff <= 0.2) { // Within 20%
        matchScore += 10;
        matchReasons.push('Similar size');
      } else if (areaDiff <= 0.4) { // Within 40%
        matchScore += 5;
        matchReasons.push('Close in size');
      }
    }

    // Bedrooms matching (bonus points)
    if (requirement.bedrooms && property.bedrooms === requirement.bedrooms) {
      matchScore += 5;
      matchReasons.push(`${property.bedrooms} bedrooms as requested`);
    }

    // Only include properties with at least 30% match
    if (matchScore >= 30) {
      matches.push({
        property,
        matchScore,
        matchReasons
      });
    }
  }

  // Sort by match score (highest first)
  return matches.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Get smart property matches for a buyer requirement
 */
export function getSmartMatches(requirementId: string): PropertyMatch[] {
  const properties = getProperties();
  const requirement = properties.find(p => p.id === requirementId);

  if (!requirement || requirement.listingType !== 'wanted') {
    return [];
  }

  return findMatchingProperties(requirement, properties);
}

// ============================================================================
// SHORTLISTING
// ============================================================================

/**
 * Add a property to buyer's shortlist
 */
export function shortlistProperty(
  requirementId: string,
  propertyId: string
): boolean {
  try {
    const properties = getProperties();
    const requirement = properties.find(p => p.id === requirementId);

    if (!requirement || requirement.listingType !== 'wanted') {
      return false;
    }

    const shortlisted = requirement.shortlistedProperties || [];
    
    if (!shortlisted.includes(propertyId)) {
      shortlisted.push(propertyId);
      updateProperty(requirementId, {
        shortlistedProperties: shortlisted
      });
    }

    return true;
  } catch (error) {
    console.error('Error shortlisting property:', error);
    return false;
  }
}

/**
 * Remove a property from buyer's shortlist
 */
export function removeFromShortlist(
  requirementId: string,
  propertyId: string
): boolean {
  try {
    const properties = getProperties();
    const requirement = properties.find(p => p.id === requirementId);

    if (!requirement || requirement.listingType !== 'wanted') {
      return false;
    }

    const shortlisted = (requirement.shortlistedProperties || []).filter(
      id => id !== propertyId
    );

    updateProperty(requirementId, {
      shortlistedProperties: shortlisted
    });

    return true;
  } catch (error) {
    console.error('Error removing from shortlist:', error);
    return false;
  }
}

// ============================================================================
// VIEWING FEEDBACK
// ============================================================================

export interface ViewingFeedback {
  propertyId: string;
  date: string;
  feedback: string;
  rating?: number;
}

/**
 * Add viewing feedback for a property
 */
export function addViewingFeedback(
  requirementId: string,
  feedback: ViewingFeedback
): boolean {
  try {
    const properties = getProperties();
    const requirement = properties.find(p => p.id === requirementId);

    if (!requirement || requirement.listingType !== 'wanted') {
      return false;
    }

    const existingFeedback = requirement.viewingFeedback || [];
    
    // Check if feedback for this property already exists
    const existingIndex = existingFeedback.findIndex(
      f => f.propertyId === feedback.propertyId
    );

    if (existingIndex >= 0) {
      // Update existing feedback
      existingFeedback[existingIndex] = feedback;
    } else {
      // Add new feedback
      existingFeedback.push(feedback);
    }

    updateProperty(requirementId, {
      viewingFeedback: existingFeedback
    });

    return true;
  } catch (error) {
    console.error('Error adding viewing feedback:', error);
    return false;
  }
}

// ============================================================================
// OFFERS
// ============================================================================

export interface BuyerOffer {
  id: string;
  requirementId: string;
  propertyId: string;
  buyerContactId: string;
  offerAmount: number;
  tokenAmount: number;
  conditions?: string;
  status: 'drafted' | 'submitted' | 'accepted' | 'rejected' | 'countered';
  dealSource: 'internal-match' | 'external-market';
  listingAgentId?: string; // For internal matches
  buyingAgentId: string;
  createdAt: string;
  updatedAt: string;
}

const OFFERS_KEY = 'buyer_offers';

/**
 * Get all offers
 */
export function getAllOffers(): BuyerOffer[] {
  try {
    const offersJson = localStorage.getItem(OFFERS_KEY);
    return offersJson ? JSON.parse(offersJson) : [];
  } catch (error) {
    console.error('Error getting offers:', error);
    return [];
  }
}

/**
 * Create a new buyer offer
 */
export function createBuyerOffer(
  offer: Omit<BuyerOffer, 'id' | 'createdAt' | 'updatedAt'>
): BuyerOffer {
  const offers = getAllOffers();
  
  const newOffer: BuyerOffer = {
    ...offer,
    id: `offer_${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  offers.push(newOffer);
  localStorage.setItem(OFFERS_KEY, JSON.stringify(offers));

  return newOffer;
}

/**
 * Update an existing offer
 */
export function updateOffer(
  offerId: string,
  updates: Partial<BuyerOffer>
): BuyerOffer | null {
  const offers = getAllOffers();
  const index = offers.findIndex(o => o.id === offerId);

  if (index === -1) {
    return null;
  }

  const updatedOffer = {
    ...offers[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  offers[index] = updatedOffer;
  localStorage.setItem(OFFERS_KEY, JSON.stringify(offers));

  return updatedOffer;
}

/**
 * Get offers for a specific requirement
 */
export function getOffersByRequirement(requirementId: string): BuyerOffer[] {
  return getAllOffers().filter(o => o.requirementId === requirementId);
}

/**
 * Get offers for a specific property
 */
export function getOffersByProperty(propertyId: string): BuyerOffer[] {
  return getAllOffers().filter(o => o.propertyId === propertyId);
}

// ============================================================================
// DEAL CLOSING
// ============================================================================

/**
 * Create commission records for buyer deal
 */
function createCommissions(
  offer: BuyerOffer,
  transaction: Transaction,
  finalAmount: number
): void {
  try {
    const COMMISSIONS_KEY = 'commissions';
    const commissionsJson = localStorage.getItem(COMMISSIONS_KEY);
    const commissions = commissionsJson ? JSON.parse(commissionsJson) : [];

    if (offer.dealSource === 'internal-match') {
      // Internal match: Create TWO commissions (50/50 split)
      const property = getProperties().find(p => p.id === offer.propertyId);
      const commissionRate = property?.commissionRate || 2;
      const totalCommission = finalAmount * (commissionRate / 100);
      const splitAmount = totalCommission / 2;

      // Listing Agent Commission
      if (offer.listingAgentId) {
        const listingCommission: Commission = {
          id: `comm_${Date.now()}_listing`,
          transactionId: transaction.id,
          propertyId: offer.propertyId,
          agentId: offer.listingAgentId,
          agentName: property?.agentName || 'Listing Agent',
          amount: splitAmount,
          rate: commissionRate / 2,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        commissions.push(listingCommission);
      }

      // Buying Agent Commission
      const buyingCommission: Commission = {
        id: `comm_${Date.now()}_buying`,
        transactionId: transaction.id,
        propertyId: offer.propertyId,
        agentId: offer.buyingAgentId,
        agentName: 'Buying Agent', // Will be updated with actual name
        amount: splitAmount,
        rate: commissionRate / 2,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      commissions.push(buyingCommission);
    } else {
      // External match: Create ONE commission (buyer agent only)
      const commissionRate = 2; // Default 2% for buyer representation
      const totalCommission = finalAmount * (commissionRate / 100);

      const buyingCommission: Commission = {
        id: `comm_${Date.now()}_buying`,
        transactionId: transaction.id,
        propertyId: offer.propertyId,
        agentId: offer.buyingAgentId,
        agentName: 'Buying Agent',
        amount: totalCommission,
        rate: commissionRate,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      commissions.push(buyingCommission);
    }

    localStorage.setItem(COMMISSIONS_KEY, JSON.stringify(commissions));
  } catch (error) {
    console.error('Error creating commissions:', error);
  }
}

/**
 * Create shadow property record for externally acquired properties
 */
function createExternalPropertyRecord(
  offer: BuyerOffer,
  buyerContactId: string,
  buyerName: string
): Property | null {
  try {
    // Only create for external market acquisitions
    if (offer.dealSource !== 'external-market') {
      return null;
    }

    // Create a basic property record for tracking
    const shadowProperty: Partial<Property> = {
      title: `External Property - Buyer ${buyerName}`,
      address: 'External Market',
      price: offer.offerAmount,
      listingType: 'for-sale',
      propertyType: 'house', // Default
      status: 'sold',
      currentOwnerId: buyerContactId,
      agentId: offer.buyingAgentId,
      agentName: 'Buying Agent',
      description: `Property acquired through buyer representation. Original offer: ${offer.offerAmount}`,
      acquisitionType: 'client-listing',
      sharedWith: [],
      isPublished: false,
      isAnonymous: false,
      commissionRate: 2
    };

    const newProperty = addProperty(shadowProperty);
    
    // Initialize ownership history
    transferOwnership(
      newProperty.id,
      buyerContactId,
      buyerName,
      undefined,
      'Property acquired through buyer representation (external market)'
    );

    return newProperty;
  } catch (error) {
    console.error('Error creating external property record:', error);
    return null;
  }
}

/**
 * Close a buyer deal (property acquired)
 * This implements the complete Asset-Centric workflow with ownership transfer
 */
export function closeBuyerDeal(
  offerId: string,
  buyerContactName: string,
  closingDate?: string
): { success: boolean; transactionId?: string; error?: string } {
  try {
    const offer = getAllOffers().find(o => o.id === offerId);
    
    if (!offer) {
      return { success: false, error: 'Offer not found' };
    }

    if (offer.status === 'accepted') {
      return { success: false, error: 'This offer has already been accepted' };
    }

    const requirement = getProperties().find(p => p.id === offer.requirementId);
    
    if (!requirement) {
      return { success: false, error: 'Requirement not found' };
    }

    // Get buyer contact
    const contacts = getContacts();
    const buyer = contacts.find(c => c.id === offer.buyerContactId);
    
    if (!buyer) {
      return { success: false, error: 'Buyer contact not found' };
    }

    const finalClosingDate = closingDate || new Date().toISOString().split('T')[0];

    // Create transaction (use correct key - 'crm_transactions')
    const transactionId = `txn_${Date.now()}`;
    const transaction: Transaction = {
      id: transactionId,
      propertyId: offer.propertyId,
      type: 'purchase',
      dealSource: offer.dealSource,
      agentId: offer.buyingAgentId,
      buyingAgentId: offer.buyingAgentId,
      listingAgentId: offer.listingAgentId,
      buyerContactId: offer.buyerContactId,
      buyerName: buyerContactName || buyer.name,
      buyerContact: buyer.phone,
      buyerEmail: buyer.email,
      acceptedOfferAmount: offer.offerAmount,
      acceptedDate: finalClosingDate,
      expectedClosingDate: finalClosingDate,
      status: 'completed', // Mark as completed for buyer acquisition
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save transaction using the correct system
    saveTransaction(transaction);

    // Create commission records
    createCommissions(offer, transaction, offer.offerAmount);

    // Update offer status
    updateOffer(offerId, { status: 'accepted' });

    // Update requirement status
    updateProperty(offer.requirementId, { status: 'sold' });

    // Handle property based on deal source
    if (offer.dealSource === 'internal-match') {
      // Internal match: Transfer ownership from agency/seller to buyer
      const property = getProperties().find(p => p.id === offer.propertyId);
      
      if (property) {
        // Transfer ownership to buyer (Asset-Centric principle)
        transferOwnership(
          offer.propertyId,
          offer.buyerContactId,
          buyerContactName || buyer.name,
          transactionId,
          `Sold via internal match. Buyer agent: ${offer.buyingAgentId}`
        );

        // Update property status
        updateProperty(offer.propertyId, {
          status: 'sold',
          activeTransactionId: transactionId,
          soldDate: finalClosingDate,
          finalSalePrice: offer.offerAmount
        });
      }
    } else {
      // External match: Create shadow property record for tracking
      const shadowProperty = createExternalPropertyRecord(
        offer,
        offer.buyerContactId,
        buyerContactName || buyer.name
      );

      if (shadowProperty) {
        // Update transaction with shadow property ID
        transaction.propertyId = shadowProperty.id;
        saveTransaction(transaction);
      }
    }

    return { success: true, transactionId };
  } catch (error) {
    console.error('Error closing buyer deal:', error);
    return { success: false, error: String(error) };
  }
}