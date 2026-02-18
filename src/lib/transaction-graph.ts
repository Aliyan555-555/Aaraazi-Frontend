/**
<<<<<<< Updated upstream
 * Transaction Graph Service - Phase 1
 * 
 * Navigates and manages relationships between:
 * - Properties
 * - Sell Cycles
 * - Purchase Cycles
 * - Deals
 * - Buyer Requirements
 * 
 * This creates the "Transaction Trinity" model where one transaction
 * can be viewed from multiple perspectives with full context.
 */

import { Deal, SellCycle, PurchaseCycle, Property, BuyerRequirement } from '../types';
import { getDeals } from './deals';
import { getSellCycles } from './sellCycle';
import { getPurchaseCycles } from './purchaseCycle';
import { getProperties } from './data';
import { getBuyerRequirements } from './buyerRequirements';
import { formatPropertyAddress } from './utils';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface TransactionGraph {
  deal?: Deal;
  sellCycle?: SellCycle;
  purchaseCycle?: PurchaseCycle;
  property?: Property;
  buyerRequirement?: BuyerRequirement;
}

export interface TransactionTimeline {
  date: string;
  event: string;
  entityType: 'property' | 'sellCycle' | 'purchaseCycle' | 'deal' | 'buyerRequirement';
  entityId: string;
  description: string;
}

export interface RelatedEntityLinks {
  propertyId?: string;
  propertyAddress?: string;
  
  sellCycleId?: string;
  sellCycleStatus?: string;
  
  purchaseCycleId?: string;
  purchaseCycleStatus?: string;
  
  dealId?: string;
  dealNumber?: string;
  dealStatus?: string;
  
  buyerRequirementId?: string;
}

// ============================================
// GRAPH RETRIEVAL
// ============================================

/**
 * Get the complete transaction graph for any entity
 */
export function getTransactionGraph(
  entityId: string,
  entityType: 'deal' | 'sellCycle' | 'purchaseCycle' | 'property' | 'buyerRequirement'
): TransactionGraph {
  const graph: TransactionGraph = {};
  
  try {
    switch (entityType) {
      case 'deal':
        return buildGraphFromDeal(entityId);
      
      case 'sellCycle':
        return buildGraphFromSellCycle(entityId);
      
      case 'purchaseCycle':
        return buildGraphFromPurchaseCycle(entityId);
      
      case 'property':
        return buildGraphFromProperty(entityId);
      
      case 'buyerRequirement':
        return buildGraphFromBuyerRequirement(entityId);
      
      default:
        return graph;
    }
  } catch (error) {
    console.error('[TransactionGraph] Error building graph:', error);
    return graph;
  }
}

/**
 * Build graph starting from a Deal
 */
function buildGraphFromDeal(dealId: string): TransactionGraph {
  const graph: TransactionGraph = {};
  const deals = getDeals();
  const deal = deals.find(d => d.id === dealId);
  
  if (!deal) return graph;
  
  graph.deal = deal;
  
  // Get sell cycle (if exists)
  if (deal.cycles.sellCycle) {
    const sellCycles = getSellCycles();
    const sellCycle = sellCycles.find(sc => sc.id === deal.cycles.sellCycle.id);
    if (sellCycle) {
      graph.sellCycle = sellCycle;
      
      // Get property from sell cycle
      const properties = getProperties();
      const property = properties.find(p => p.id === sellCycle.propertyId);
      if (property) {
        graph.property = property;
      }
    }
  }
  
  // Get purchase cycle (if exists)
  if (deal.cycles.purchaseCycle) {
    const purchaseCycles = getPurchaseCycles();
    const purchaseCycle = purchaseCycles.find(pc => pc.id === deal.cycles.purchaseCycle?.id);
    if (purchaseCycle) {
      graph.purchaseCycle = purchaseCycle;
      
      // Get property from purchase cycle (for single-cycle purchase deals)
      if (!graph.property) {
        const properties = getProperties();
        const property = properties.find(p => p.id === purchaseCycle.propertyId);
        if (property) {
          graph.property = property;
        }
      }
      
      // Get buyer requirement (if exists)
      if (purchaseCycle.buyerRequirementId) {
        const buyerRequirements = getBuyerRequirements();
        const buyerRequirement = buyerRequirements.find(br => br.id === purchaseCycle.buyerRequirementId);
        if (buyerRequirement) {
          graph.buyerRequirement = buyerRequirement;
        }
      }
    }
  }
  
  return graph;
}

/**
 * Build graph starting from a Sell Cycle
 */
function buildGraphFromSellCycle(sellCycleId: string): TransactionGraph {
  const graph: TransactionGraph = {};
  const sellCycles = getSellCycles();
  const sellCycle = sellCycles.find(sc => sc.id === sellCycleId);
  
  if (!sellCycle) return graph;
  
  graph.sellCycle = sellCycle;
  
  // Get property
  const properties = getProperties();
  const property = properties.find(p => p.id === sellCycle.propertyId);
  if (property) {
    graph.property = property;
  }
  
  // Get created deal (if exists)
  if (sellCycle.createdDealId) {
    const deals = getDeals();
    const deal = deals.find(d => d.id === sellCycle.createdDealId);
    if (deal) {
      graph.deal = deal;
      
      // Get purchase cycle from deal (if exists)
      if (deal.cycles.purchaseCycle) {
        const purchaseCycles = getPurchaseCycles();
        const purchaseCycle = purchaseCycles.find(pc => pc.id === deal.cycles.purchaseCycle?.id);
        if (purchaseCycle) {
          graph.purchaseCycle = purchaseCycle;
          
          // Get buyer requirement
          if (purchaseCycle.buyerRequirementId) {
            const buyerRequirements = getBuyerRequirements();
            const buyerRequirement = buyerRequirements.find(br => br.id === purchaseCycle.buyerRequirementId);
            if (buyerRequirement) {
              graph.buyerRequirement = buyerRequirement;
            }
          }
        }
      }
    }
  }
  
  // Get winning purchase cycle (if exists and different from deal's purchase cycle)
  if (sellCycle.winningPurchaseCycleId && sellCycle.winningPurchaseCycleId !== graph.purchaseCycle?.id) {
    const purchaseCycles = getPurchaseCycles();
    const winningPurchaseCycle = purchaseCycles.find(pc => pc.id === sellCycle.winningPurchaseCycleId);
    if (winningPurchaseCycle && !graph.purchaseCycle) {
      graph.purchaseCycle = winningPurchaseCycle;
    }
  }
  
  return graph;
}

/**
 * Build graph starting from a Purchase Cycle
 */
function buildGraphFromPurchaseCycle(purchaseCycleId: string): TransactionGraph {
  const graph: TransactionGraph = {};
  const purchaseCycles = getPurchaseCycles();
  const purchaseCycle = purchaseCycles.find(pc => pc.id === purchaseCycleId);
  
  if (!purchaseCycle) return graph;
  
  graph.purchaseCycle = purchaseCycle;
  
  // Get property
  const properties = getProperties();
  const property = properties.find(p => p.id === purchaseCycle.propertyId);
  if (property) {
    graph.property = property;
  }
  
  // Get buyer requirement (if exists)
  if (purchaseCycle.buyerRequirementId) {
    const buyerRequirements = getBuyerRequirements();
    const buyerRequirement = buyerRequirements.find(br => br.id === purchaseCycle.buyerRequirementId);
    if (buyerRequirement) {
      graph.buyerRequirement = buyerRequirement;
    }
  }
  
  // Get sell cycle (if linked)
  if (purchaseCycle.sellCycleId) {
    const sellCycles = getSellCycles();
    const sellCycle = sellCycles.find(sc => sc.id === purchaseCycle.sellCycleId);
    if (sellCycle) {
      graph.sellCycle = sellCycle;
    }
  }
  
  // Get created deal (if exists)
  if (purchaseCycle.createdDealId) {
    const deals = getDeals();
    const deal = deals.find(d => d.id === purchaseCycle.createdDealId);
    if (deal) {
      graph.deal = deal;
    }
  }
  
  return graph;
}

/**
 * Build graph starting from a Property
 */
function buildGraphFromProperty(propertyId: string): TransactionGraph {
  const graph: TransactionGraph = {};
  const properties = getProperties();
  const property = properties.find(p => p.id === propertyId);
  
  if (!property) return graph;
  
  graph.property = property;
  
  // Get the most recent active sell cycle
  if (property.activeSellCycleIds && property.activeSellCycleIds.length > 0) {
    const sellCycles = getSellCycles();
    const sellCycle = sellCycles.find(sc => sc.id === property.activeSellCycleIds[0]);
    if (sellCycle) {
      graph.sellCycle = sellCycle;
      
      // Get deal from sell cycle
      if (sellCycle.createdDealId) {
        const deals = getDeals();
        const deal = deals.find(d => d.id === sellCycle.createdDealId);
        if (deal) {
          graph.deal = deal;
        }
      }
    }
  }
  
  // Get the most recent active purchase cycle
  if (property.activePurchaseCycleIds && property.activePurchaseCycleIds.length > 0) {
    const purchaseCycles = getPurchaseCycles();
    const purchaseCycle = purchaseCycles.find(pc => pc.id === property.activePurchaseCycleIds[0]);
    if (purchaseCycle) {
      if (!graph.purchaseCycle) {
        graph.purchaseCycle = purchaseCycle;
      }
      
      // Get buyer requirement
      if (purchaseCycle.buyerRequirementId) {
        const buyerRequirements = getBuyerRequirements();
        const buyerRequirement = buyerRequirements.find(br => br.id === purchaseCycle.buyerRequirementId);
        if (buyerRequirement) {
          graph.buyerRequirement = buyerRequirement;
        }
      }
    }
  }
  
  return graph;
}

/**
 * Build graph starting from a Buyer Requirement
 */
function buildGraphFromBuyerRequirement(buyerRequirementId: string): TransactionGraph {
  const graph: TransactionGraph = {};
  const buyerRequirements = getBuyerRequirements();
  const buyerRequirement = buyerRequirements.find(br => br.id === buyerRequirementId);
  
  if (!buyerRequirement) return graph;
  
  graph.buyerRequirement = buyerRequirement;
  
  // Find purchase cycles that reference this requirement
  const purchaseCycles = getPurchaseCycles();
  const purchaseCycle = purchaseCycles.find(pc => pc.buyerRequirementId === buyerRequirementId);
  
  if (purchaseCycle) {
    graph.purchaseCycle = purchaseCycle;
    
    // Get property
    const properties = getProperties();
    const property = properties.find(p => p.id === purchaseCycle.propertyId);
    if (property) {
      graph.property = property;
    }
    
    // Get sell cycle
    if (purchaseCycle.sellCycleId) {
      const sellCycles = getSellCycles();
      const sellCycle = sellCycles.find(sc => sc.id === purchaseCycle.sellCycleId);
      if (sellCycle) {
        graph.sellCycle = sellCycle;
      }
    }
    
    // Get deal
    if (purchaseCycle.createdDealId) {
      const deals = getDeals();
      const deal = deals.find(d => d.id === purchaseCycle.createdDealId);
      if (deal) {
        graph.deal = deal;
      }
    }
  }
  
  return graph;
}

// ============================================
// TIMELINE GENERATION
// ============================================

/**
 * Generate a unified timeline across all related entities
 */
export function getUnifiedTimeline(dealId: string): TransactionTimeline[] {
  const timeline: TransactionTimeline[] = [];
  const graph = buildGraphFromDeal(dealId);
  
  // Property created
  if (graph.property) {
    const propertyName = graph.property.title || formatPropertyAddress(graph.property.address);
    timeline.push({
      date: graph.property.createdAt,
      event: 'Property Added',
      entityType: 'property',
      entityId: graph.property.id,
      description: `Property "${propertyName}" added to system`,
    });
  }
  
  // Buyer requirement created
  if (graph.buyerRequirement) {
    timeline.push({
      date: graph.buyerRequirement.createdAt,
      event: 'Buyer Requirement Created',
      entityType: 'buyerRequirement',
      entityId: graph.buyerRequirement.id,
      description: `${graph.buyerRequirement.buyerName} created search requirement`,
    });
  }
  
  // Sell cycle listed
  if (graph.sellCycle) {
    timeline.push({
      date: graph.sellCycle.listedDate,
      event: 'Property Listed',
      entityType: 'sellCycle',
      entityId: graph.sellCycle.id,
      description: `Listed for sale at ${graph.sellCycle.askingPrice}`,
    });
    
    // Offers received
    graph.sellCycle.offers.forEach(offer => {
      timeline.push({
        date: offer.offeredDate,
        event: `Offer ${offer.status === 'accepted' ? 'Accepted' : 'Received'}`,
        entityType: 'sellCycle',
        entityId: graph.sellCycle!.id,
        description: `${offer.buyerName} offered ${offer.offerAmount}`,
      });
    });
  }
  
  // Purchase cycle created
  if (graph.purchaseCycle) {
    timeline.push({
      date: graph.purchaseCycle.createdAt,
      event: 'Purchase Cycle Created',
      entityType: 'purchaseCycle',
      entityId: graph.purchaseCycle.id,
      description: `${graph.purchaseCycle.purchaserName} initiated purchase`,
    });
    
    if (graph.purchaseCycle.offerDate) {
      timeline.push({
        date: graph.purchaseCycle.offerDate,
        event: 'Offer Made',
        entityType: 'purchaseCycle',
        entityId: graph.purchaseCycle.id,
        description: `Offer of ${graph.purchaseCycle.offerAmount} submitted`,
      });
    }
    
    if (graph.purchaseCycle.acceptanceDate) {
      timeline.push({
        date: graph.purchaseCycle.acceptanceDate,
        event: 'Offer Accepted',
        entityType: 'purchaseCycle',
        entityId: graph.purchaseCycle.id,
        description: 'Offer accepted, moving to deal',
      });
    }
  }
  
  // Deal created
  if (graph.deal) {
    timeline.push({
      date: graph.deal.lifecycle.timeline.offerAcceptedDate,
      event: 'Deal Created',
      entityType: 'deal',
      entityId: graph.deal.id,
      description: `Deal ${graph.deal.dealNumber} created for ${graph.deal.financial.agreedPrice}`,
    });
    
    // Deal stages
    const stages = graph.deal.lifecycle.timeline.stages;
    Object.entries(stages).forEach(([stageName, stageProgress]) => {
      if (stageProgress.completedAt) {
        timeline.push({
          date: stageProgress.completedAt,
          event: `Stage Completed: ${formatStageName(stageName)}`,
          entityType: 'deal',
          entityId: graph.deal!.id,
          description: `${formatStageName(stageName)} stage completed`,
        });
      }
    });
    
    // Deal completion
    if (graph.deal.metadata.completedAt) {
      timeline.push({
        date: graph.deal.metadata.completedAt,
        event: 'Deal Completed',
        entityType: 'deal',
        entityId: graph.deal.id,
        description: 'Transaction successfully completed',
      });
    }
  }
  
  // Sort timeline by date (oldest first)
  return timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Helper to format stage names
 */
function formatStageName(stageName: string): string {
  return stageName
    .split(/(?=[A-Z])/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ============================================
// RELATIONSHIP CHECKS
// ============================================

/**
 * Check if two entities are related
 */
export function areEntitiesRelated(
  entity1: { id: string; type: string },
  entity2: { id: string; type: string }
): boolean {
  // If same entity, they're related
  if (entity1.id === entity2.id && entity1.type === entity2.type) {
    return true;
  }
  
  // Build graphs for both entities
  const graph1 = getTransactionGraph(entity1.id, entity1.type as any);
  const graph2 = getTransactionGraph(entity2.id, entity2.type as any);
  
  // Check if they share any common entities
  if (graph1.property?.id && graph1.property.id === graph2.property?.id) return true;
  if (graph1.sellCycle?.id && graph1.sellCycle.id === graph2.sellCycle?.id) return true;
  if (graph1.purchaseCycle?.id && graph1.purchaseCycle.id === graph2.purchaseCycle?.id) return true;
  if (graph1.deal?.id && graph1.deal.id === graph2.deal?.id) return true;
  if (graph1.buyerRequirement?.id && graph1.buyerRequirement.id === graph2.buyerRequirement?.id) return true;
  
  return false;
}

/**
 * Get quick links for related entities
 */
export function getRelatedEntityLinks(
  entityId: string,
  entityType: 'deal' | 'sellCycle' | 'purchaseCycle' | 'property' | 'buyerRequirement'
): RelatedEntityLinks {
  const graph = getTransactionGraph(entityId, entityType);
  const links: RelatedEntityLinks = {};
  
  if (graph.property) {
    links.propertyId = graph.property.id;
    links.propertyAddress = graph.property.address;
  }
  
  if (graph.sellCycle) {
    links.sellCycleId = graph.sellCycle.id;
    links.sellCycleStatus = graph.sellCycle.status;
  }
  
  if (graph.purchaseCycle) {
    links.purchaseCycleId = graph.purchaseCycle.id;
    links.purchaseCycleStatus = graph.purchaseCycle.status;
  }
  
  if (graph.deal) {
    links.dealId = graph.deal.id;
    links.dealNumber = graph.deal.dealNumber;
    links.dealStatus = graph.deal.lifecycle.status;
  }
  
  if (graph.buyerRequirement) {
    links.buyerRequirementId = graph.buyerRequirement.id;
  }
  
  return links;
}

/**
 * Get all deals for a property
 */
export function getPropertyDeals(propertyId: string): Deal[] {
  const property = getProperties().find(p => p.id === propertyId);
  if (!property) return [];
  
  const deals = getDeals();
  return deals.filter(deal => {
    // Check both sell cycle and purchase cycle for the property ID
    if (deal.cycles.sellCycle && deal.cycles.sellCycle.propertyId === propertyId) {
      return true;
    }
    // For single-cycle purchase deals, check purchase cycle
    if (deal.cycles.purchaseCycle) {
      const purchaseCycles = getPurchaseCycles();
      const purchaseCycle = purchaseCycles.find(pc => pc.id === deal.cycles.purchaseCycle?.id);
      if (purchaseCycle && purchaseCycle.propertyId === propertyId) {
        return true;
      }
    }
    return false;
  });
}

/**
 * Get all cycles for a property
 */
export function getPropertyCycles(propertyId: string) {
  const sellCycles = getSellCycles().filter(sc => sc.propertyId === propertyId);
  const purchaseCycles = getPurchaseCycles().filter(pc => pc.propertyId === propertyId);
  
  return {
    sellCycles,
    purchaseCycles,
    all: [...sellCycles, ...purchaseCycles].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
  };
}
=======
 * Transaction graph and timeline helpers
 * Provides a unified view of deal/sell/purchase/property for headers and timelines
 */

export interface TransactionGraph {
  deal?: {
    id: string;
    dealNumber: string;
    lifecycle: { status: string; stage: string };
    financial?: { agreedPrice: number; totalPaid: number };
  };
  sellCycle?: { id: string; cycleNumber: string; status: string };
  purchaseCycle?: { id: string; cycleNumber: string; status: string };
  property?: {
    id: string;
    title?: string;
    address?: string | Record<string, unknown>;
  };
  buyerRequirement?: { id: string };
}

export interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description?: string;
  date: string;
  amount?: number;
}

/**
 * Get transaction graph for an entity (deal, sell cycle, etc.)
 * Returns null when no graph is available; callers can derive from current deal/property
 */
export function getTransactionGraph(_entityId: string, _entityType: string): TransactionGraph | null {
  return null;
}

/**
 * Get unified timeline events for an entity
 */
export function getUnifiedTimeline(_entityId: string): TimelineEvent[] {
  return [];
}
>>>>>>> Stashed changes
