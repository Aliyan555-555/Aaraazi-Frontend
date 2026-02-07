/**
 * Portfolio Management Service
 * Handles filtered property views for agency and investor portfolios
 */

import { Property } from '../types';
import { getProperties } from './data';
import { getPaymentSchedules } from './paymentSchedule';
import { getPurchaseCycles } from './purchaseCycle';
import { getInvestors } from './investors';
import type { PaymentSchedule, Instalment } from '../types/paymentSchedule';

// ============================================
// FILTERED PROPERTY VIEWS
// ============================================

/**
 * Get all properties owned by the agency
 */
export function getAgencyOwnedProperties(userId?: string, userRole?: string): Property[] {
  const allProperties = getProperties(userId, userRole);
  return allProperties.filter(prop => prop.currentOwnerType === 'agency');
}

/**
 * Get all properties owned by investors
 */
export function getInvestorOwnedProperties(userId?: string, userRole?: string): Property[] {
  const allProperties = getProperties(userId, userRole);
  return allProperties.filter(prop => prop.currentOwnerType === 'investor');
}

/**
 * Get all client properties (traditional listings)
 */
export function getClientProperties(userId?: string, userRole?: string): Property[] {
  const allProperties = getProperties(userId, userRole);
  return allProperties.filter(prop => 
    prop.currentOwnerType === 'client' || prop.currentOwnerType === 'external'
  );
}

/**
 * Get properties by owner type with optional status filtering
 */
export function getPropertiesByOwnerType(
  ownerType: 'client' | 'agency' | 'investor' | 'external',
  status?: string,
  userId?: string,
  userRole?: string
): Property[] {
  let properties: Property[];
  
  switch (ownerType) {
    case 'agency':
      properties = getAgencyOwnedProperties(userId, userRole);
      break;
    case 'investor':
      properties = getInvestorOwnedProperties(userId, userRole);
      break;
    case 'client':
    case 'external':
    default:
      properties = getClientProperties(userId, userRole);
      break;
  }
  
  if (status) {
    properties = properties.filter(prop => prop.currentStatus === status);
  }
  
  return properties;
}

// ============================================
// AGENCY PORTFOLIO ANALYTICS
// ============================================

/**
 * Calculate total acquisition cost for agency-owned properties
 */
export function getAgencyAcquisitionCosts(userId?: string, userRole?: string): number {
  const agencyProperties = getAgencyOwnedProperties(userId, userRole);
  const purchaseCycles = getPurchaseCycles(userId, userRole);
  
  let totalCost = 0;
  
  agencyProperties.forEach(property => {
    // Find the purchase cycle where agency acquired this property
    const acquisitionCycle = purchaseCycles.find(cycle => 
      cycle.propertyId === property.id && 
      cycle.purchaserType === 'agency' &&
      cycle.status === 'acquired'
    );
    
    if (acquisitionCycle) {
      totalCost += acquisitionCycle.negotiatedPrice || acquisitionCycle.offerAmount;
    }
  });
  
  return totalCost;
}

/**
 * Calculate current market value of agency portfolio
 * NOTE: Uses last known sale price or acquisition price as estimate
 * In production, you'd have a property valuation service
 */
export function calculateAgencyPortfolioValue(userId?: string, userRole?: string): number {
  const agencyProperties = getAgencyOwnedProperties(userId, userRole);
  const purchaseCycles = getPurchaseCycles(userId, userRole);
  
  let totalValue = 0;
  
  agencyProperties.forEach(property => {
    // Find acquisition cycle to get purchase price as baseline
    const acquisitionCycle = purchaseCycles.find(cycle => 
      cycle.propertyId === property.id && 
      cycle.purchaserType === 'agency' &&
      cycle.status === 'acquired'
    );
    
    if (acquisitionCycle) {
      // Use negotiated price or asking price as current value
      // In real app, you'd have market value updates
      totalValue += acquisitionCycle.negotiatedPrice || acquisitionCycle.offerAmount;
    }
  });
  
  return totalValue;
}

/**
 * Calculate unrealized gains/losses for agency portfolio
 */
export function getAgencyUnrealizedGains(userId?: string, userRole?: string): number {
  const acquisitionCost = getAgencyAcquisitionCosts(userId, userRole);
  const currentValue = calculateAgencyPortfolioValue(userId, userRole);
  
  return currentValue - acquisitionCost;
}

/**
 * Get agency portfolio summary
 */
export function getAgencyPortfolioSummary(userId?: string, userRole?: string): {
  totalProperties: number;
  totalInvested: number;
  currentValue: number;
  unrealizedGains: number;
  roi: number;
  listedProperties: number;
  propertiesHolding: number;
  totalPendingPayments: number;
} {
  const agencyProperties = getAgencyOwnedProperties(userId, userRole);
  const totalInvested = getAgencyAcquisitionCosts(userId, userRole);
  const currentValue = calculateAgencyPortfolioValue(userId, userRole);
  const unrealizedGains = currentValue - totalInvested;
  const roi = totalInvested > 0 ? (unrealizedGains / totalInvested) * 100 : 0;
  
  const listedProperties = agencyProperties.filter(prop => 
    prop.activeSellCycleIds && prop.activeSellCycleIds.length > 0
  ).length;
  
  const propertiesHolding = agencyProperties.filter(prop => 
    !prop.activeSellCycleIds || prop.activeSellCycleIds.length === 0
  ).length;
  
  const totalPendingPayments = getTotalPendingAgencyPayments();
  
  return {
    totalProperties: agencyProperties.length,
    totalInvested,
    currentValue,
    unrealizedGains,
    roi,
    listedProperties,
    propertiesHolding,
    totalPendingPayments,
  };
}

// ============================================
// AGENCY PAYMENT TRACKING
// ============================================

/**
 * Get all payment schedules for agency acquisitions
 */
export function getAgencyAcquisitionPayments(): PaymentSchedule[] {
  const allSchedules = getPaymentSchedules();
  
  // Filter for purchase-cycle payment schedules where purchaser is agency
  return allSchedules.filter(schedule => {
    if (schedule.entityType !== 'purchase-cycle') return false;
    
    // Find the purchase cycle
    const purchaseCycles = getPurchaseCycles();
    const cycle = purchaseCycles.find(c => c.id === schedule.entityId);
    
    return cycle?.purchaserType === 'agency';
  });
}

/**
 * Get upcoming payments for agency acquisitions
 */
export function getUpcomingAgencyPayments(daysAhead: number = 30): {
  instalment: Instalment;
  schedule: PaymentSchedule;
  propertyAddress?: string;
}[] {
  const agencyPaymentSchedules = getAgencyAcquisitionPayments();
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + daysAhead);
  
  const upcomingPayments: {
    instalment: Instalment;
    schedule: PaymentSchedule;
    propertyAddress?: string;
  }[] = [];
  
  agencyPaymentSchedules.forEach(schedule => {
    schedule.instalments.forEach(instalment => {
      if (instalment.status === 'pending' || instalment.status === 'overdue') {
        const dueDate = new Date(instalment.dueDate);
        
        if (dueDate >= today && dueDate <= futureDate) {
          // Get property address from purchase cycle
          const purchaseCycles = getPurchaseCycles();
          const cycle = purchaseCycles.find(c => c.id === schedule.entityId);
          let propertyAddress: string | undefined;
          
          if (cycle) {
            const properties = getProperties();
            const property = properties.find(p => p.id === cycle.propertyId);
            propertyAddress = property?.address;
          }
          
          upcomingPayments.push({
            instalment,
            schedule,
            propertyAddress,
          });
        }
      }
    });
  });
  
  // Sort by due date
  return upcomingPayments.sort((a, b) => 
    new Date(a.instalment.dueDate).getTime() - new Date(b.instalment.dueDate).getTime()
  );
}

/**
 * Get overdue payments for agency acquisitions
 */
export function getOverdueAgencyPayments(): {
  instalment: Instalment;
  schedule: PaymentSchedule;
  propertyAddress?: string;
  daysOverdue: number;
}[] {
  const agencyPaymentSchedules = getAgencyAcquisitionPayments();
  const today = new Date();
  
  const overduePayments: {
    instalment: Instalment;
    schedule: PaymentSchedule;
    propertyAddress?: string;
    daysOverdue: number;
  }[] = [];
  
  agencyPaymentSchedules.forEach(schedule => {
    schedule.instalments.forEach(instalment => {
      if (instalment.status === 'pending' || instalment.status === 'overdue') {
        const dueDate = new Date(instalment.dueDate);
        
        if (dueDate < today) {
          const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          
          // Get property address
          const purchaseCycles = getPurchaseCycles();
          const cycle = purchaseCycles.find(c => c.id === schedule.entityId);
          let propertyAddress: string | undefined;
          
          if (cycle) {
            const properties = getProperties();
            const property = properties.find(p => p.id === cycle.propertyId);
            propertyAddress = property?.address;
          }
          
          overduePayments.push({
            instalment,
            schedule,
            propertyAddress,
            daysOverdue,
          });
        }
      }
    });
  });
  
  // Sort by days overdue (most overdue first)
  return overduePayments.sort((a, b) => b.daysOverdue - a.daysOverdue);
}

/**
 * Get total pending payments for agency acquisitions
 */
export function getTotalPendingAgencyPayments(): number {
  const agencyPaymentSchedules = getAgencyAcquisitionPayments();
  
  let totalPending = 0;
  
  agencyPaymentSchedules.forEach(schedule => {
    totalPending += schedule.totalPending;
  });
  
  return totalPending;
}

// ============================================
// INVESTOR PORTFOLIO ANALYTICS
// ============================================

/**
 * Get investor portfolio summary (aggregate across all investors)
 */
export function getInvestorPortfolioSummary(userId?: string, userRole?: string): {
  totalProperties: number;
  activeInvestments: number;
  totalInvested: number;
  currentValue: number;
  unrealizedGains: number;
  averageROI: number;
  totalRealizedProfit: number;
} {
  const investorProperties = getInvestorOwnedProperties(userId, userRole);
  const investors = getInvestors(userId, userRole);
  
  // Get unique investors
  const investorIds = new Set<string>();
  investorProperties.forEach(prop => {
    if (prop.investorShares) {
      prop.investorShares.forEach(share => investorIds.add(share.investorId));
    }
  });
  
  // Calculate totals from investor data
  let totalInvested = 0;
  let currentValue = 0;
  let totalRealizedProfit = 0;
  let totalROI = 0;
  let activeInvestments = 0;
  
  investors.forEach(investor => {
    totalInvested += investor.totalInvested || 0;
    currentValue += investor.currentPortfolioValue || 0;
    totalRealizedProfit += investor.realizedGains || 0;
    totalROI += investor.totalROI || 0;
    activeInvestments += investor.activeProperties || 0;
  });
  
  const averageROI = investors.length > 0 ? totalROI / investors.length : 0;
  const unrealizedGains = currentValue - totalInvested;
  
  return {
    totalProperties: investorProperties.length,
    activeInvestments,
    totalInvested,
    currentValue,
    unrealizedGains,
    averageROI,
    totalRealizedProfit,
  };
}

// ============================================
// PROPERTY OWNERSHIP HELPERS
// ============================================

/**
 * Check if a property is agency-owned
 */
export function isAgencyOwned(propertyId: string): boolean {
  const properties = getProperties();
  const property = properties.find(p => p.id === propertyId);
  return property?.currentOwnerType === 'agency';
}

/**
 * Check if a property is investor-owned
 */
export function isInvestorOwned(propertyId: string): boolean {
  const properties = getProperties();
  const property = properties.find(p => p.id === propertyId);
  return property?.currentOwnerType === 'investor';
}

/**
 * Get owner type for a property
 */
export function getPropertyOwnerType(propertyId: string): 'client' | 'agency' | 'investor' | 'external' | null {
  const properties = getProperties();
  const property = properties.find(p => p.id === propertyId);
  return property?.currentOwnerType || null;
}

// ============================================
// LEGACY FUNCTION ALIASES
// ============================================

/**
 * Alias for getAgencyOwnedProperties (for backwards compatibility)
 */
export function getAgencyProperties(userId?: string, userRole?: string): Property[] {
  return getAgencyOwnedProperties(userId, userRole);
}

/**
 * Get properties that can be re-listed (sold properties owned by agency)
 */
export function getRelistableProperties(userId?: string, userRole?: string): Property[] {
  const agencyProperties = getAgencyOwnedProperties(userId, userRole);
  
  // Properties that were sold and can be re-listed
  return agencyProperties.filter(prop => 
    prop.currentStatus === 'sold' || 
    (prop.ownershipHistory && prop.ownershipHistory.length > 0)
  );
}