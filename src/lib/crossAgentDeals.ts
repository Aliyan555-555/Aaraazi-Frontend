/**
 * Cross-Agent Deal Operations
 * 
 * Functions for creating deals from cross-agent offers and linking cycles
 * This implements Phase 3 of the sharing functionality roadmap
 */

import { 
  Deal,
  CrossAgentOffer, 
  CrossAgentDeal, 
  DealAgentTracking,
  LinkCyclesToDealParams,
  LinkCyclesResult 
} from '../types/deals';
import { getDeals as getDealsFromStorage, saveDealToStorage, updateDealInStorage, createDealFromOffer } from './deals';
import { getSellCycleById, updateSellCycle, createSellCycle } from './sellCycle';
import { getPurchaseCycleById, updatePurchaseCycle, createPurchaseCycle, getPurchaseCycles } from './purchaseCycle';
import { getRentCycleById, updateRentCycle } from './rentCycle';
import { getPropertyById } from './data';
import { createNotification } from './notifications';
import { toast } from 'sonner';

// ============================================
// PHASE 3: DEAL CREATION FROM CROSS-AGENT OFFERS
// ============================================

/**
 * Create a purchase cycle for the buyer agent when their offer is accepted
 * This allows the buyer agent to track their side of the transaction
 * 
 * @param offer - The accepted cross-agent offer
 * @param sellCycle - The sell cycle the offer was submitted to
 * @param dealId - ID of the created deal
 * @returns Created purchase cycle ID or null
 */
export function createCycleFromAcceptedOffer(
  offer: CrossAgentOffer,
  sellCycle: any, // SellCycle type
  dealId: string
): string | null {
  try {
    const property = getPropertyById(sellCycle.propertyId);
    
    if (!property) {
      console.error('[createCycleFromAcceptedOffer] Property not found:', sellCycle.propertyId);
      return null;
    }

    // Check if the buyer agent already has a purchase cycle for this property
    const existingCycle = getPurchaseCycleByPropertyAndAgent(sellCycle.propertyId, offer.submittedByAgentId);
    
    if (existingCycle) {
      console.log('[createCycleFromAcceptedOffer] Purchase cycle already exists:', existingCycle.id);
      
      // Update existing cycle with deal link
      updatePurchaseCycle(existingCycle.id, {
        createdDealId: dealId,
        linkedDealId: dealId,
        sellCycleId: sellCycle.id,
        status: 'under-contract',
        updatedAt: new Date().toISOString()
      });
      
      return existingCycle.id;
    }

    // Create new purchase cycle for the buyer agent
    const purchaseCycle = createPurchaseCycle({
      propertyId: sellCycle.propertyId,
      agentId: offer.submittedByAgentId,
      agentName: offer.submittedByAgentName,
      buyerId: offer.buyerId,
      buyerName: offer.buyerName,
      buyerContact: offer.buyerContact,
      buyerEmail: offer.buyerEmail,
      buyerRequirementId: offer.fromRequirementId,
      agreedPrice: offer.amount,
      status: 'under-contract',
      stage: 'offer-accepted',
      createdDealId: dealId,
      linkedDealId: dealId,
      sellCycleId: sellCycle.id,
      source: 'shared-listing',
      matchId: offer.matchId,
      notes: `Created automatically from accepted offer on shared listing (${sellCycle.propertyAddress || 'Property'}). Original offer submitted via cross-agent collaboration.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    if (!purchaseCycle) {
      console.error('[createCycleFromAcceptedOffer] Failed to create purchase cycle');
      return null;
    }

    console.log(`[createCycleFromAcceptedOffer] Created purchase cycle ${purchaseCycle.id} for buyer agent ${offer.submittedByAgentName}`);

    // Send notification to buyer agent
    createNotification({
      recipientId: offer.submittedByAgentId,
      type: 'offer-accepted',
      title: 'Your Offer Was Accepted!',
      message: `Your offer of PKR ${offer.amount.toLocaleString()} for ${property.address || 'the property'} has been accepted. A purchase cycle has been created to track your transaction.`,
      entityType: 'purchase-cycle',
      entityId: purchaseCycle.id,
      actionUrl: `/purchase-cycles/${purchaseCycle.id}`,
      priority: 'high'
    });

    return purchaseCycle.id;
  } catch (error) {
    console.error('[createCycleFromAcceptedOffer] Error:', error);
    return null;
  }
}

/**
 * Link a purchase cycle and sell cycle to the same deal
 * This creates the bidirectional relationship that enables:
 * - Commission splitting between both agents
 * - Coordinated deal progression
 * - Shared visibility (with privacy controls)
 * 
 * @param params - Linking parameters
 * @returns Result of linking operation
 */
export function linkCycleToDeal(params: LinkCyclesToDealParams): LinkCyclesResult {
  const { dealId, sellCycleId, purchaseCycleId, rentCycleId } = params;
  const errors: string[] = [];

  try {
    const deal = getDealById(dealId);
    
    if (!deal) {
      return {
        success: false,
        dealId,
        linkedCycles: {},
        errors: ['Deal not found']
      };
    }

    const linkedCycles: LinkCyclesResult['linkedCycles'] = {};

    // Link sell cycle
    if (sellCycleId) {
      const sellCycle = getSellCycleById(sellCycleId);
      if (sellCycle) {
        updateSellCycle(sellCycleId, {
          createdDealId: dealId,
          linkedDealId: dealId,
          winningPurchaseCycleId: purchaseCycleId,
          updatedAt: new Date().toISOString()
        });
        linkedCycles.sellCycle = sellCycleId;
        console.log(`[linkCycleToDeal] Linked sell cycle ${sellCycleId} to deal ${dealId}`);
      } else {
        errors.push(`Sell cycle ${sellCycleId} not found`);
      }
    }

    // Link purchase cycle
    if (purchaseCycleId) {
      const purchaseCycle = getPurchaseCycleById(purchaseCycleId);
      if (purchaseCycle) {
        updatePurchaseCycle(purchaseCycleId, {
          createdDealId: dealId,
          linkedDealId: dealId,
          sellCycleId: sellCycleId,
          updatedAt: new Date().toISOString()
        });
        linkedCycles.purchaseCycle = purchaseCycleId;
        console.log(`[linkCycleToDeal] Linked purchase cycle ${purchaseCycleId} to deal ${dealId}`);
      } else {
        errors.push(`Purchase cycle ${purchaseCycleId} not found`);
      }
    }

    // Link rent cycle (if applicable)
    if (rentCycleId) {
      const rentCycle = getRentCycleById(rentCycleId);
      if (rentCycle) {
        updateRentCycle(rentCycleId, {
          linkedDealId: dealId,
          updatedAt: new Date().toISOString()
        });
        linkedCycles.rentCycle = rentCycleId;
        console.log(`[linkCycleToDeal] Linked rent cycle ${rentCycleId} to deal ${dealId}`);
      } else {
        errors.push(`Rent cycle ${rentCycleId} not found`);
      }
    }

    // Update deal with cycle linkages
    updateDealWithCycleLinkage(dealId, linkedCycles);

    // Send notifications to both agents
    if (deal.agents.primary && deal.agents.secondary) {
      createNotification({
        recipientId: deal.agents.primary.id,
        type: 'deal-updated',
        title: 'Deal Cycles Linked',
        message: `Both sell and purchase cycles are now linked to deal ${deal.dealNumber}`,
        entityType: 'deal',
        entityId: dealId,
        priority: 'medium'
      });

      createNotification({
        recipientId: deal.agents.secondary.id,
        type: 'deal-updated',
        title: 'Deal Cycles Linked',
        message: `Your purchase cycle is now linked to deal ${deal.dealNumber}`,
        entityType: 'deal',
        entityId: dealId,
        priority: 'medium'
      });
    }

    return {
      success: errors.length === 0,
      dealId,
      linkedCycles,
      errors: errors.length > 0 ? errors : undefined
    };
  } catch (error) {
    console.error('[linkCycleToDeal] Error:', error);
    return {
      success: false,
      dealId,
      linkedCycles: {},
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

/**
 * Create a complete cross-agent deal from an accepted offer
 * This is the main entry point for Phase 3 deal creation
 * 
 * Steps:
 * 1. Create the deal record
 * 2. Create/link purchase cycle for buyer agent
 * 3. Link both cycles to the deal
 * 4. Setup cross-agent tracking and commission split
 * 5. Send notifications
 * 
 * @param offer - The accepted cross-agent offer
 * @param sellCycleId - ID of the sell cycle
 * @param commissionSplitRatio - Commission split [seller%, buyer%] - default [60, 40]
 * @returns Created deal or null
 */
export function createDealFromCrossAgentOffer(
  offer: CrossAgentOffer,
  sellCycleId: string,
  commissionSplitRatio: [number, number] = [60, 40]
): CrossAgentDeal | null {
  try {
    const sellCycle = getSellCycleById(sellCycleId);
    
    if (!sellCycle) {
      console.error('[createDealFromCrossAgentOffer] Sell cycle not found:', sellCycleId);
      toast.error('Cannot create deal: Sell cycle not found');
      return null;
    }

    const property = getPropertyById(sellCycle.propertyId);
    
    if (!property) {
      console.error('[createDealFromCrossAgentOffer] Property not found:', sellCycle.propertyId);
      toast.error('Cannot create deal: Property not found');
      return null;
    }

    // Step 1: Create purchase cycle for buyer agent
    const purchaseCycleId = createCycleFromAcceptedOffer(offer, sellCycle, ''); // Will update with deal ID
    
    if (!purchaseCycleId) {
      console.error('[createDealFromCrossAgentOffer] Failed to create purchase cycle');
      toast.error('Failed to create purchase cycle for buyer agent');
      return null;
    }

    const purchaseCycle = getPurchaseCycleById(purchaseCycleId);

    // Step 2: Create the deal using standard deal creation
    // Convert CrossAgentOffer to standard Offer format
    const standardOffer = {
      id: offer.id,
      sellCycleId: sellCycleId,
      buyerId: offer.buyerId,
      buyerName: offer.buyerName,
      buyerContact: offer.buyerContact,
      buyerEmail: offer.buyerEmail,
      offerAmount: offer.amount,
      status: offer.status,
      submittedDate: offer.submittedDate,
      responseDate: offer.responseDate,
      createdAt: offer.createdAt,
      updatedAt: offer.updatedAt,
      submittedByAgentId: offer.submittedByAgentId,
      submittedByAgentName: offer.submittedByAgentName,
      fromRequirementId: offer.fromRequirementId,
      matchId: offer.matchId,
      submittedVia: offer.submittedVia
    };

    const deal = createDealFromOffer(
      sellCycle,
      standardOffer,
      sellCycle.agentId, // Primary agent (seller agent)
      purchaseCycle,
      undefined // Buyer requirement - will be linked via purchase cycle
    ) as Deal;

    if (!deal) {
      console.error('[createDealFromCrossAgentOffer] Failed to create deal');
      toast.error('Failed to create deal');
      return null;
    }

    // Step 3: Calculate cross-agent commission split
    const commissionRate = sellCycle.commissionRate || property.commissionRate || 2;
    const totalCommission = offer.amount * (commissionRate / 100);
    const sellerAgentAmount = totalCommission * (commissionSplitRatio[0] / 100);
    const buyerAgentAmount = totalCommission * (commissionSplitRatio[1] / 100);

    // Step 4: Add cross-agent tracking to deal
    const crossAgentTracking: DealAgentTracking = {
      buyerAgentId: offer.submittedByAgentId,
      buyerAgentName: offer.submittedByAgentName,
      sellerAgentId: sellCycle.agentId,
      sellerAgentName: sellCycle.agentName,
      crossAgentCommission: {
        buyerAgentPercentage: commissionSplitRatio[1],
        buyerAgentAmount,
        sellerAgentPercentage: commissionSplitRatio[0],
        sellerAgentAmount,
        splitRatio: `${commissionSplitRatio[0]}/${commissionSplitRatio[1]}`
      },
      coordinationNotes: [],
      jointMeetings: []
    };

    // Create extended cross-agent deal
    const crossAgentDeal: CrossAgentDeal = {
      ...deal,
      crossAgentTracking,
      originatedFromMatch: !!offer.matchId,
      matchId: offer.matchId,
      requirementId: offer.fromRequirementId
    };

    // Update deal in storage with cross-agent tracking
    updateDealInStorage(deal.id, { crossAgentTracking });

    // Step 5: Link cycles to deal
    linkCycleToDeal({
      dealId: deal.id,
      sellCycleId: sellCycleId,
      purchaseCycleId: purchaseCycleId
    });

    // Step 6: Send success notifications
    toast.success('Cross-agent deal created successfully!');
    
    console.log(`[createDealFromCrossAgentOffer] Created cross-agent deal ${deal.dealNumber}`);
    console.log(`  - Seller Agent: ${sellCycle.agentName} (${commissionSplitRatio[0]}% = PKR ${sellerAgentAmount.toLocaleString()})`);
    console.log(`  - Buyer Agent: ${offer.submittedByAgentName} (${commissionSplitRatio[1]}% = PKR ${buyerAgentAmount.toLocaleString()})`);
    console.log(`  - Sell Cycle: ${sellCycleId}`);
    console.log(`  - Purchase Cycle: ${purchaseCycleId}`);

    return crossAgentDeal;
  } catch (error) {
    console.error('[createDealFromCrossAgentOffer] Error:', error);
    toast.error('Failed to create cross-agent deal');
    return null;
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get deal by ID
 */
function getDealById(dealId: string): Deal | null {
  const deals = getDealsFromStorage();
  return deals.find(d => d.id === dealId) || null;
}

/**
 * Get purchase cycle by property and agent
 */
function getPurchaseCycleByPropertyAndAgent(propertyId: string, agentId: string): any | null {
  try {
    const cycles = getPurchaseCycles();
    return cycles.find((c: any) => c.propertyId === propertyId && c.agentId === agentId) || null;
  } catch (error) {
    console.error('Error getting purchase cycle:', error);
    return null;
  }
}

/**
 * Update deal with cycle linkage information
 */
function updateDealWithCycleLinkage(dealId: string, linkedCycles: LinkCyclesResult['linkedCycles']): void {
  try {
    const deal = getDealById(dealId);
    if (!deal) return;

    // Update the deal's cycle references
    if (linkedCycles.sellCycle) {
      deal.cycles.sellCycle.id = linkedCycles.sellCycle;
    }
    
    if (linkedCycles.purchaseCycle && deal.cycles.purchaseCycle) {
      deal.cycles.purchaseCycle.id = linkedCycles.purchaseCycle;
    }

    // Update sync status
    deal.sync.lastSyncedAt = new Date().toISOString();
    deal.sync.isInSync = true;
    deal.metadata.updatedAt = new Date().toISOString();

    // Save updated deal
    updateDealInStorage(dealId, {
      cycles: deal.cycles,
      sync: deal.sync,
      metadata: deal.metadata
    });

    console.log(`[updateDealWithCycleLinkage] Updated deal ${dealId} with cycle links`);
  } catch (error) {
    console.error('[updateDealWithCycleLinkage] Error:', error);
  }
}

/**
 * Check if a cross-agent deal can be created from an offer
 */
export function canCreateCrossAgentDeal(offer: CrossAgentOffer, sellCycleId: string): {
  canCreate: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  // Check offer status
  if (offer.status !== 'accepted') {
    reasons.push('Offer must be accepted to create a deal');
  }

  // Check sell cycle exists
  const sellCycle = getSellCycleById(sellCycleId);
  if (!sellCycle) {
    reasons.push('Sell cycle not found');
  }

  // Check property exists
  if (sellCycle) {
    const property = getPropertyById(sellCycle.propertyId);
    if (!property) {
      reasons.push('Property not found');
    }
  }

  // Check offer has required fields
  if (!offer.submittedByAgentId) {
    reasons.push('Offer missing buyer agent ID');
  }
  
  if (!offer.buyerId) {
    reasons.push('Offer missing buyer ID');
  }

  return {
    canCreate: reasons.length === 0,
    reasons
  };
}

/**
 * Get commission split for a cross-agent deal
 * Returns standard splits based on agency policy
 */
export function getStandardCommissionSplit(): [number, number] {
  // Standard 60/40 split: Seller agent gets 60%, Buyer agent gets 40%
  // This can be customized based on agency settings
  return [60, 40];
}

/**
 * Calculate commission breakdown for both agents
 */
export function calculateCrossAgentCommission(
  dealAmount: number,
  commissionRate: number,
  splitRatio: [number, number] = [60, 40]
): {
  totalCommission: number;
  sellerAgentAmount: number;
  buyerAgentAmount: number;
  sellerAgentPercentage: number;
  buyerAgentPercentage: number;
} {
  const totalCommission = dealAmount * (commissionRate / 100);
  const sellerAgentAmount = totalCommission * (splitRatio[0] / 100);
  const buyerAgentAmount = totalCommission * (splitRatio[1] / 100);

  return {
    totalCommission,
    sellerAgentAmount,
    buyerAgentAmount,
    sellerAgentPercentage: splitRatio[0],
    buyerAgentPercentage: splitRatio[1]
  };
}
