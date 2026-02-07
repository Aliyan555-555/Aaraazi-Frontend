import { Offer, OfferStatusChange } from '../types';
import { getProperties } from './data';
import { getSellCyclesByProperty, createSellCycle, updateSellCycle } from './sellCycle';
import { createDealFromOffer } from './deals';
import { getUserById } from './auth';
import { createNotification } from './notifications';

const OFFERS_KEY = 'crm_offers';

// ============================================================================
// OFFER MANAGEMENT
// ============================================================================

export function getOffers(propertyId?: string): Offer[] {
  try {
    const stored = localStorage.getItem(OFFERS_KEY);
    if (!stored) return [];
    
    const offers = JSON.parse(stored);
    
    if (!Array.isArray(offers)) {
      console.error('Offers data is not an array');
      return [];
    }
    
    // Filter by property if specified
    if (propertyId) {
      return offers.filter((offer: Offer) => offer.propertyId === propertyId);
    }
    
    return offers;
  } catch (error) {
    console.error('Error loading offers:', error);
    return [];
  }
}

export function getOfferById(offerId: string): Offer | null {
  try {
    const stored = localStorage.getItem(OFFERS_KEY);
    if (!stored) return null;
    
    const offers = JSON.parse(stored);
    return offers.find((offer: Offer) => offer.id === offerId) || null;
  } catch (error) {
    console.error('Error loading offer:', error);
    return null;
  }
}

export function saveOffer(offer: Offer): void {
  try {
    const stored = localStorage.getItem(OFFERS_KEY);
    const offers = stored ? JSON.parse(stored) : [];
    
    const existingIndex = offers.findIndex((o: Offer) => o.id === offer.id);
    
    if (existingIndex >= 0) {
      offers[existingIndex] = offer;
    } else {
      offers.push(offer);
    }
    
    localStorage.setItem(OFFERS_KEY, JSON.stringify(offers));
  } catch (error) {
    console.error('Error saving offer:', error);
    throw error;
  }
}

export function deleteOffer(offerId: string): void {
  try {
    const stored = localStorage.getItem(OFFERS_KEY);
    if (!stored) return;
    
    const offers = JSON.parse(stored);
    const filtered = offers.filter((offer: Offer) => offer.id !== offerId);
    
    localStorage.setItem(OFFERS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting offer:', error);
    throw error;
  }
}

export function updateOfferStatus(
  offerId: string, 
  newStatus: 'active' | 'accepted' | 'rejected' | 'countered',
  userId: string,
  notes?: string,
  counterAmount?: number
): void {
  try {
    const offer = getOfferById(offerId);
    if (!offer) {
      throw new Error('Offer not found');
    }
    
    // Create status change record
    const statusChange: OfferStatusChange = {
      status: newStatus,
      date: new Date().toISOString(),
      notes,
      changedBy: userId
    };
    
    // Update offer
    offer.status = newStatus;
    offer.updatedAt = new Date().toISOString();
    offer.statusHistory = offer.statusHistory || [];
    offer.statusHistory.push(statusChange);
    
    if (newStatus === 'countered' && counterAmount) {
      offer.counterAmount = counterAmount;
    }
    
    saveOffer(offer);
    
    // CRITICAL FIX: When offer is accepted, create a deal
    if (newStatus === 'accepted' && offer.propertyId) {
      try {
        const properties = getProperties();
        const property = properties.find((p: any) => p.id === offer.propertyId);
        
        if (property) {
          // Check if there's an active sell cycle for this property
          let sellCycles = getSellCyclesByProperty(offer.propertyId);
          let sellCycle = sellCycles[0]; // Get the first active sell cycle
          
          // If no sell cycle exists, create one
          if (!sellCycle) {
            console.log('No sell cycle found, creating one automatically...');
            const agent = getUserById(userId);
            
            sellCycle = createSellCycle({
              propertyId: offer.propertyId,
              sellerType: property.currentOwnerType || 'client',
              sellerId: property.currentOwnerId || 'unknown',
              sellerName: property.currentOwnerName || 'Unknown Seller',
              agentId: userId,
              agentName: agent?.name || 'Unknown Agent',
              askingPrice: property.price,
              commissionRate: property.commissionRate || 2,
              title: property.title,
              description: property.description || '',
              isPublished: true,
            });
            
            console.log(`✅ Auto-created sell cycle: ${sellCycle.id}`);
          }
          
          // Convert the CRM offer to a sell cycle offer format
          const sellCycleOffer = {
            id: offer.id,
            buyerId: offer.buyerContactId || `buyer_${Date.now()}`,
            buyerName: offer.buyerName,
            buyerContact: offer.buyerContact,
            offerAmount: offer.offerAmount,
            tokenAmount: 0,
            offeredDate: offer.dateReceived,
            status: 'accepted' as const,
            notes: offer.notes,
            createdAt: offer.createdAt,
            updatedAt: offer.updatedAt,
          };
          
          // Add the offer to the sell cycle if it's not already there
          const existingOffer = sellCycle.offers.find((o: any) => o.id === offer.id);
          if (!existingOffer) {
            sellCycle.offers.push(sellCycleOffer);
          }
          
          // Update sell cycle status
          updateSellCycle(sellCycle.id, {
            offers: sellCycle.offers.map((o: any) => ({
              ...o,
              status: o.id === offer.id ? 'accepted' as const : 'rejected' as const,
            })),
            acceptedOfferId: offer.id,
            status: 'under-contract',
          });
          
          // Create the deal
          const deal = createDealFromOffer(
            sellCycle,
            sellCycleOffer,
            userId,
            undefined, // No purchase cycle for single-cycle deals
            undefined  // No buyer requirement
          );
          
          console.log('✅ Single-cycle deal created from CRM offer');
          console.log(`   - Deal: ${deal.dealNumber}`);
          console.log(`   - Sell Cycle: ${sellCycle.id}`);
          console.log(`   - Property: ${property.title}`);
          
          // Create notification
          createNotification({
            userId: userId,
            type: 'DEAL_CREATED',
            priority: 'HIGH',
            title: 'Deal Auto-Created',
            message: `Deal ${deal.dealNumber} has been automatically created from the accepted offer.`,
            entityType: 'deal',
            entityId: deal.id,
            actionLabel: 'View Deal',
            actionType: 'navigate',
          });
        }
      } catch (error) {
        console.error('Error auto-creating deal from CRM offer:', error);
        // Don't throw - offer is still accepted even if deal creation fails
      }
    }
  } catch (error) {
    console.error('Error updating offer status:', error);
    throw error;
  }
}

// ============================================================================
// OFFER ANALYTICS
// ============================================================================

export function getPropertyOfferStats(propertyId: string): {
  totalOffers: number;
  activeOffers: number;
  acceptedOffers: number;
  rejectedOffers: number;
  counteredOffers: number;
  highestOffer: number;
  averageOffer: number;
} {
  const offers = getOffers(propertyId);
  
  const stats = {
    totalOffers: offers.length,
    activeOffers: offers.filter(o => o.status === 'active').length,
    acceptedOffers: offers.filter(o => o.status === 'accepted').length,
    rejectedOffers: offers.filter(o => o.status === 'rejected').length,
    counteredOffers: offers.filter(o => o.status === 'countered').length,
    highestOffer: offers.length > 0 ? Math.max(...offers.map(o => o.offerAmount)) : 0,
    averageOffer: offers.length > 0 
      ? offers.reduce((sum, o) => sum + o.offerAmount, 0) / offers.length 
      : 0
  };
  
  return stats;
}

export function getOfferConversionRate(propertyId: string): number {
  const offers = getOffers(propertyId);
  if (offers.length === 0) return 0;
  
  const accepted = offers.filter(o => o.status === 'accepted').length;
  return (accepted / offers.length) * 100;
}

// ============================================================================
// VALIDATION
// ============================================================================

export function validateOffer(offer: Partial<Offer>): string[] {
  const errors: string[] = [];
  
  if (!offer.buyerName || offer.buyerName.trim() === '') {
    errors.push('Buyer name is required');
  }
  
  if (!offer.offerAmount || offer.offerAmount <= 0) {
    errors.push('Offer amount must be greater than zero');
  }
  
  if (!offer.dateReceived) {
    errors.push('Date received is required');
  }
  
  if (offer.status === 'countered' && (!offer.counterAmount || offer.counterAmount <= 0)) {
    errors.push('Counter amount is required for countered offers');
  }
  
  return errors;
}