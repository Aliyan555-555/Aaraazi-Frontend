/**
 * Multi-Investor Purchase System
 * Handles creation of multi-investor purchases and investor investment records
 */

import { InvestorShare, PurchaseCycle, Property, InvestorInvestment, Investor } from '../types';
import { getPropertyById } from './data';
import { 
  getInvestorById, 
  addInvestorInvestment, 
  updateInvestor, 
  getInvestorInvestments,
  recalculateInvestorPortfolio 
} from './investors';
import { formatPropertyAddress } from './utils';

const PROPERTIES_KEY = 'estate_properties'; // CRITICAL: Use the correct localStorage key

/**
 * Create InvestorInvestment records for each investor in a multi-investor purchase
 * CRITICAL: Called after purchase cycle is created
 */
export function createInvestorInvestmentsFromPurchase(
  purchaseCycleId: string,
  propertyId: string,
  investorShares: InvestorShare[],
  purchaseCycle: PurchaseCycle
): void {
  const property = getPropertyById(propertyId);
  if (!property) {
    console.error('Property not found:', propertyId);
    throw new Error('Property not found');
  }
  
  const acquisitionPrice = purchaseCycle.negotiatedPrice || purchaseCycle.offerAmount || purchaseCycle.askingPrice;
  
  investorShares.forEach(share => {
    const investor = getInvestorById(share.investorId);
    if (!investor) {
      console.warn(`Investor not found: ${share.investorId}`);
      return;
    }
    
    // Use addInvestorInvestment with the correct signature
    addInvestorInvestment(
      share.investorId,
      propertyId,
      {
        propertyAddress: typeof property.address === 'string' 
          ? property.address 
          : formatPropertyAddress(property.address),
        sharePercentage: share.sharePercentage,
        investmentAmount: share.investmentAmount!,
        acquisitionPrice: acquisitionPrice,
        purchaseCycleId: purchaseCycleId,
        notes: share.notes,
      }
    );
  });
  
  console.log(`✅ Created ${investorShares.length} InvestorInvestment records for purchase cycle ${purchaseCycleId}`);
}

/**
 * Transfer property ownership to multiple investors
 * CRITICAL: Called after multi-investor purchase cycle is created
 */
export function transferPropertyToInvestors(
  propertyId: string,
  investorShares: InvestorShare[],
  purchaseCycle: PurchaseCycle
): void {
  console.log('🏠 transferPropertyToInvestors - Starting...', {
    propertyId,
    investorCount: investorShares.length,
  });

  const property = getPropertyById(propertyId);
  if (!property) {
    console.error('❌ Property not found via getPropertyById:', propertyId);
    throw new Error('Property not found');
  }
  
  console.log('✅ Property found:', {
    id: property.id,
    title: property.title,
    currentOwner: property.currentOwnerName,
  });
  
  const properties = JSON.parse(localStorage.getItem(PROPERTIES_KEY) || '[]') as Property[];
  console.log('📦 Total properties in storage:', properties.length);
  console.log('🔍 Looking for property with ID:', propertyId);
  console.log('📋 Property IDs in storage:', properties.map(p => p.id).slice(0, 10));
  
  const index = properties.findIndex(p => p.id === propertyId);
  if (index === -1) {
    console.error('❌ Property not found in storage array:', propertyId);
    console.error('Available property IDs:', properties.map(p => ({ id: p.id, title: p.title })));
    return;
  }
  
  console.log(`✅ Property found at index ${index}`);
  
  // Build investor names list
  const investorNames = investorShares.map(s => s.investorName).join(', ');
  
  // Update property ownership
  properties[index] = {
    ...property,
    
    // OWNERSHIP TRACKING
    currentOwnerId: 'INVESTORS', // Special ID for multi-investor ownership
    currentOwnerName: investorNames,
    currentOwnerType: 'investor',
    
    // INVESTOR SHARES (CRITICAL!)
    investorShares: investorShares,
    
    // OWNERSHIP HISTORY
    ownershipHistory: [
      ...property.ownershipHistory,
      {
        ownerId: 'INVESTORS',
        ownerName: investorNames,
        transactionId: purchaseCycle.id,
        acquiredDate: purchaseCycle.createdAt || new Date().toISOString(),
        notes: `Acquired by ${investorShares.length} investor(s): ${investorNames}`,
      }
    ],
    
    updatedAt: new Date().toISOString(),
  };
  
  localStorage.setItem(PROPERTIES_KEY, JSON.stringify(properties));
  
  console.log(`✅ Property ${propertyId} transferred to ${investorShares.length} investor(s)`);
}

/**
 * Validate investor shares
 * Ensures percentages sum to 100% and all required fields are present
 */
export function validateInvestorShares(shares: InvestorShare[]): { valid: boolean; error?: string } {
  console.log('🔍 Validating investor shares:', {
    count: shares.length,
    shares: shares.map(s => ({
      id: s.investorId,
      name: s.investorName,
      percentage: s.sharePercentage,
      amount: s.investmentAmount,
    })),
  });

  if (!shares || shares.length === 0) {
    return { valid: false, error: 'At least one investor is required' };
  }
  
  // Check that all shares have required fields
  for (const share of shares) {
    if (!share.investorId || !share.investorName) {
      console.error('❌ Missing investor ID or name:', share);
      return { valid: false, error: 'All investors must have ID and name' };
    }
    if (share.sharePercentage <= 0 || share.sharePercentage > 100) {
      console.error('❌ Invalid percentage:', share);
      return { valid: false, error: 'Each investor percentage must be between 0 and 100' };
    }
    if (!share.investmentAmount || share.investmentAmount <= 0) {
      console.error('❌ Invalid investment amount:', share);
      return { valid: false, error: 'All investors must have valid investment amounts' };
    }
  }
  
  // Check total percentage
  const totalPercentage = shares.reduce((sum, s) => sum + s.sharePercentage, 0);
  
  // Allow small floating point errors (0.01%)
  if (Math.abs(totalPercentage - 100) > 0.01) {
    console.error('❌ Invalid total percentage:', totalPercentage);
    return { 
      valid: false, 
      error: `Total percentage must equal 100% (currently ${totalPercentage.toFixed(2)}%)` 
    };
  }
  
  console.log('✅ Investor shares validation passed');
  return { valid: true };
}

/**
 * Calculate investment amounts for each investor based on total price
 */
export function calculateInvestmentAmounts(
  investorShares: InvestorShare[],
  totalPrice: number
): InvestorShare[] {
  return investorShares.map(share => ({
    ...share,
    investmentAmount: (totalPrice * share.sharePercentage) / 100,
  }));
}

/**
 * Check if investor has capacity for this investment
 * Returns warning if exceeding capacity, but doesn't block
 */
export function validateInvestorCapacity(
  investor: Investor,
  investmentAmount: number
): { valid: boolean; warning?: string } {
  if (!investor.totalInvestmentCapacity) {
    return { valid: true }; // No capacity limit set
  }
  
  const currentInvestments = getInvestorInvestments(investor.id);
  const activeInvestments = currentInvestments.filter(inv => inv.status === 'active');
  const totalInvested = activeInvestments.reduce((sum, inv) => sum + inv.investmentAmount, 0);
  const remainingCapacity = investor.totalInvestmentCapacity - totalInvested;
  
  if (investmentAmount > remainingCapacity) {
    return {
      valid: true,
      warning: `Warning: This investment (PKR ${investmentAmount.toLocaleString()}) exceeds ${investor.name}'s remaining capacity (PKR ${remainingCapacity.toLocaleString()})`
    };
  }
  
  return { valid: true };
}

/**
 * Get purchase cycle investors (supports both new multi-investor and legacy single-investor)
 * For backward compatibility
 */
export function getPurchaseCycleInvestors(cycle: PurchaseCycle): InvestorShare[] {
  // New multi-investor format
  if (cycle.investors && cycle.investors.length > 0) {
    return cycle.investors;
  }
  
  // Legacy single investor format (for backward compatibility)
  if (cycle.purchaserType === 'investor' && cycle.purchaserId && cycle.purchaserName) {
    const totalAmount = cycle.negotiatedPrice || cycle.offerAmount || cycle.askingPrice;
    return [{
      investorId: cycle.purchaserId,
      investorName: cycle.purchaserName,
      sharePercentage: 100,
      investmentAmount: totalAmount,
    }];
  }
  
  return [];
}