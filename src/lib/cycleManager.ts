/**
 * Cycle Manager - V3.0
 * Unified cycle operations, status computation, and match detection
 */

import { Property, SellCycle, PurchaseCycle, RentCycle } from '../types';
import { getSellCycleById, getSellCyclesByProperty, getSellCycleStats } from './sellCycle';
import { getPurchaseCycleById, getPurchaseCyclesByProperty, getPurchaseCycleStats } from './purchaseCycle';
import { getRentCycleById, getRentCyclesByProperty, getRentCycleStats } from './rentCycle';
import { getProperties } from './data';
import { getTransactions } from './transactions';

/**
 * Compute property status from all active cycles
 */
export function computePropertyStatus(property: Property): string {
  const statuses: string[] = [];
  
  // Check sell cycles
  if (property.activeSellCycleIds && property.activeSellCycleIds.length > 0) {
    const sellCycles = property.activeSellCycleIds
      .map(id => getSellCycleById(id))
      .filter(Boolean) as SellCycle[];
    
    if (sellCycles.some(c => c.status === 'under-contract')) {
      statuses.push('Under Contract');
    } else if (sellCycles.some(c => c.status === 'negotiation')) {
      statuses.push('Negotiation');
    } else if (sellCycles.some(c => c.status === 'listed')) {
      statuses.push('For Sale');
    }
  }
  
  // Check purchase cycles
  if (property.activePurchaseCycleIds && property.activePurchaseCycleIds.length > 0) {
    const purchaseCycles = property.activePurchaseCycleIds
      .map(id => getPurchaseCycleById(id))
      .filter(Boolean) as PurchaseCycle[];
    
    if (purchaseCycles.length > 0) {
      const offerCount = purchaseCycles.filter(c => 
        c.status === 'offer-made' || c.status === 'negotiation'
      ).length;
      
      if (offerCount > 1) {
        statuses.push(`${offerCount} Purchase Offers`);
      } else if (offerCount === 1) {
        statuses.push('Purchase Offer');
      } else {
        statuses.push('In Acquisition');
      }
    }
  }
  
  // Check rent cycles
  if (property.activeRentCycleIds && property.activeRentCycleIds.length > 0) {
    const rentCycles = property.activeRentCycleIds
      .map(id => getRentCycleById(id))
      .filter(Boolean) as RentCycle[];
    
    if (rentCycles.some(c => c.status === 'active')) {
      statuses.push('Leased');
    } else if (rentCycles.some(c => c.status === 'application-received')) {
      statuses.push('Applications Received');
    } else if (rentCycles.some(c => c.status === 'available')) {
      statuses.push('For Rent');
    }
  }
  
  if (statuses.length === 0) {
    return 'No Active Cycle';
  }
  
  return statuses.join(' & ');
}

/**
 * Get all cycles for a property (organized by type)
 */
export function getPropertyCycles(propertyId: string) {
  return {
    sellCycles: getSellCyclesByProperty(propertyId),
    purchaseCycles: getPurchaseCyclesByProperty(propertyId),
    rentCycles: getRentCyclesByProperty(propertyId),
  };
}

/**
 * Detect internal matches
 * Returns properties where both sell and purchase cycles exist
 */
export interface InternalMatch {
  propertyId: string;
  propertyAddress: string;
  sellCycle: {
    id: string;
    agentId: string;
    agentName: string;
    sellerName: string;
    askingPrice: number;
    commissionRate: number;
  };
  purchaseCycles: Array<{
    id: string;
    agentId: string;
    agentName: string;
    purchaserType: string;
    purchaserName: string;
    offerAmount: number;
    isDualRep: boolean;
  }>;
  potentialRevenue: number;
  gap: number;
  gapPercentage: number;
}

export function detectInternalMatches(
  userId?: string,
  userRole?: string
): InternalMatch[] {
  const properties: Property[] = getProperties(userId, userRole);
  
  const matches: InternalMatch[] = [];
  
  for (const property of properties) {
    // Skip if no active cycles
    if (!property.activeSellCycleIds?.length || !property.activePurchaseCycleIds?.length) {
      continue;
    }
    
    const sellCycles = property.activeSellCycleIds
      .map(id => getSellCycleById(id))
      .filter(Boolean) as SellCycle[];
    
    const purchaseCycles = property.activePurchaseCycleIds
      .map(id => getPurchaseCycleById(id))
      .filter(Boolean) as PurchaseCycle[];
    
    // Only consider active cycles
    const activeSell = sellCycles.filter(c => 
      c.status === 'listed' || c.status === 'offer-received' || c.status === 'negotiation'
    );
    const activePurchase = purchaseCycles.filter(c =>
      c.status === 'offer-made' || c.status === 'negotiation' || c.status === 'accepted'
    );
    
    if (activeSell.length > 0 && activePurchase.length > 0) {
      // We have a potential match!
      const sellCycle = activeSell[0]; // Primary sell cycle
      
      const purchaseCycleData = activePurchase.map(pc => {
        const isDualRep = pc.agentId === sellCycle.agentId;
        let commissionAmount = 0;
        
        if (pc.purchaserType === 'client' && pc.commissionRate) {
          if (pc.commissionType === 'percentage') {
            commissionAmount = (pc.offerAmount * pc.commissionRate) / 100;
          } else {
            commissionAmount = pc.commissionRate;
          }
        } else if (pc.purchaserType === 'investor' && pc.facilitationFee) {
          commissionAmount = pc.facilitationFee;
        }
        
        return {
          id: pc.id,
          agentId: pc.agentId,
          agentName: pc.agentName,
          purchaserType: pc.purchaserType,
          purchaserName: pc.purchaserName,
          offerAmount: pc.offerAmount,
          isDualRep,
          commissionAmount,
        };
      });
      
      // Calculate potential revenue
      const sellCommission = (sellCycle.askingPrice * sellCycle.commissionRate) / 100;
      const purchaseCommissions = purchaseCycleData.reduce((sum, pc) => sum + pc.commissionAmount, 0);
      const potentialRevenue = sellCommission + purchaseCommissions;
      
      // Find best offer
      const bestOffer = Math.max(...purchaseCycleData.map(pc => pc.offerAmount));
      const gap = sellCycle.askingPrice - bestOffer;
      const gapPercentage = (gap / sellCycle.askingPrice) * 100;
      
      matches.push({
        propertyId: property.id,
        propertyAddress: property.address,
        sellCycle: {
          id: sellCycle.id,
          agentId: sellCycle.agentId,
          agentName: sellCycle.agentName,
          sellerName: sellCycle.sellerName,
          askingPrice: sellCycle.askingPrice,
          commissionRate: sellCycle.commissionRate,
        },
        purchaseCycles: purchaseCycleData,
        potentialRevenue,
        gap,
        gapPercentage,
      });
    }
  }
  
  // Sort by smallest gap (most likely to close)
  return matches.sort((a, b) => Math.abs(a.gap) - Math.abs(b.gap));
}

/**
 * Check if an agent has dual representation on a property
 */
export function checkAgentDualRepresentation(
  propertyId: string,
  agentId: string
): {
  hasDualRep: boolean;
  sellCycleIds: string[];
  purchaseCycleIds: string[];
} {
  const sellCycles = getSellCyclesByProperty(propertyId);
  const purchaseCycles = getPurchaseCyclesByProperty(propertyId);
  
  const agentSellCycles = sellCycles.filter(c => c.agentId === agentId);
  const agentPurchaseCycles = purchaseCycles.filter(c => c.agentId === agentId);
  
  return {
    hasDualRep: agentSellCycles.length > 0 && agentPurchaseCycles.length > 0,
    sellCycleIds: agentSellCycles.map(c => c.id),
    purchaseCycleIds: agentPurchaseCycles.map(c => c.id),
  };
}

/**
 * Get cycle statistics across all types
 */
export function getAllCycleStats(userId?: string, userRole?: string) {
  return {
    sell: getSellCycleStats(userId, userRole),
    purchase: getPurchaseCycleStats(userId, userRole),
    rent: getRentCycleStats(userId, userRole),
    internalMatches: detectInternalMatches(userId, userRole).length,
  };
}

/**
 * Get cycle activity timeline for a property
 */
export function getPropertyCycleTimeline(propertyId: string) {
  const cycles = getPropertyCycles(propertyId);
  const transactions = getTransactions().filter((t: any) => t.propertyId === propertyId);
  
  const timeline: Array<{
    date: string;
    type: 'sell-cycle' | 'purchase-cycle' | 'rent-cycle' | 'transaction';
    action: string;
    details: any;
  }> = [];
  
  // Add sell cycles
  cycles.sellCycles.forEach(cycle => {
    timeline.push({
      date: cycle.listedDate,
      type: 'sell-cycle',
      action: 'Sell Cycle Started',
      details: {
        id: cycle.id,
        agent: cycle.agentName,
        askingPrice: cycle.askingPrice,
        status: cycle.status,
      },
    });
    
    if (cycle.soldDate) {
      timeline.push({
        date: cycle.soldDate,
        type: 'sell-cycle',
        action: 'Property Sold',
        details: {
          id: cycle.id,
          agent: cycle.agentName,
        },
      });
    }
  });
  
  // Add purchase cycles
  cycles.purchaseCycles.forEach(cycle => {
    timeline.push({
      date: cycle.offerDate || cycle.createdAt.split('T')[0],
      type: 'purchase-cycle',
      action: `Purchase Cycle Started (${cycle.purchaserType})`,
      details: {
        id: cycle.id,
        agent: cycle.agentName,
        purchaser: cycle.purchaserName,
        offerAmount: cycle.offerAmount,
        status: cycle.status,
      },
    });
    
    if (cycle.actualCloseDate) {
      timeline.push({
        date: cycle.actualCloseDate,
        type: 'purchase-cycle',
        action: 'Purchase Completed',
        details: {
          id: cycle.id,
          agent: cycle.agentName,
          purchaser: cycle.purchaserName,
        },
      });
    }
  });
  
  // Add rent cycles
  cycles.rentCycles.forEach(cycle => {
    timeline.push({
      date: cycle.availableFrom,
      type: 'rent-cycle',
      action: 'Rent Cycle Started',
      details: {
        id: cycle.id,
        agent: cycle.agentName,
        monthlyRent: cycle.monthlyRent,
        status: cycle.status,
      },
    });
    
    if (cycle.leaseStartDate) {
      timeline.push({
        date: cycle.leaseStartDate,
        type: 'rent-cycle',
        action: 'Lease Signed',
        details: {
          id: cycle.id,
          tenant: cycle.currentTenantName,
        },
      });
    }
  });
  
  // Add transactions
  transactions.forEach((txn: any) => {
    timeline.push({
      date: txn.acceptedDate || txn.createdAt.split('T')[0],
      type: 'transaction',
      action: `Transaction: ${txn.type}`,
      details: txn,
    });
  });
  
  // Sort by date (newest first)
  return timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
