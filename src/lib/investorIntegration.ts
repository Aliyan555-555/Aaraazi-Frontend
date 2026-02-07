import { Property, PropertyInvestment, ProfitDistribution, Investor } from '../types';
import { 
  savePropertyInvestment, 
  getPropertyInvestmentsByProperty, 
  deletePropertyInvestment,
  updateInvestorStats,
  saveProfitDistribution,
  getProfitDistributionByProperty,
  getInvestorById,
  getPropertyInvestments
} from './investors';

/**
 * Sync investor allocations from property to PropertyInvestment records
 * This creates/updates PropertyInvestment records based on property purchaseDetails
 */
export function syncPropertyInvestors(property: Property, userId: string): void {
  // Only sync for investor-purchase properties
  if (property.acquisitionType !== 'investor-purchase') {
    return;
  }

  // Get existing investments for this property
  const existingInvestments = getPropertyInvestmentsByProperty(property.id);
  
  // If no purchase details or no investors assigned, clean up existing investments
  if (!property.purchaseDetails?.assignedInvestors || property.purchaseDetails.assignedInvestors.length === 0) {
    // Delete all existing investments for this property
    existingInvestments.forEach(inv => {
      deletePropertyInvestment(inv.id);
    });
    return;
  }

  const assignedInvestorIds = property.purchaseDetails.assignedInvestors;
  const totalInvestment = property.purchaseDetails.totalCostBasis || 0;
  
  // Remove investments that are no longer assigned
  existingInvestments.forEach(inv => {
    if (!assignedInvestorIds.includes(inv.investorId)) {
      deletePropertyInvestment(inv.id);
    }
  });

  // Create or update investments for assigned investors
  assignedInvestorIds.forEach(investorId => {
    const investor = getInvestorById(investorId);
    if (!investor) return;

    const existingInv = existingInvestments.find(inv => inv.investorId === investorId);
    
    // Calculate equal share if not specified otherwise
    const investmentAmount = totalInvestment / assignedInvestorIds.length;
    const profitSharePercentage = 100 / assignedInvestorIds.length;

    const investmentData: PropertyInvestment = {
      id: existingInv?.id || `propinv-${property.id}-${investorId}-${Date.now()}`,
      propertyId: property.id,
      investorId: investorId,
      investorName: investor.name,
      investmentAmount: investmentAmount,
      investmentDate: property.purchaseDetails.purchaseDate || property.createdAt,
      profitSharePercentage: profitSharePercentage,
      status: property.status === 'sold' ? 'completed' : 'active',
      expectedReturn: investmentAmount * 1.2, // Default 20% expected return
      actualReturn: property.status === 'sold' ? calculateInvestorReturn(property, investorId, investmentAmount, profitSharePercentage) : undefined,
      paymentStatus: 'invested',
      returnDistributionDate: property.soldDate,
      agreementTerms: `Equal partnership investment for ${property.title}`,
      notes: `Auto-synced investment allocation`,
      createdBy: userId,
      createdAt: existingInv?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    savePropertyInvestment(investmentData);
  });
}

/**
 * Calculate investor return based on property sale
 */
function calculateInvestorReturn(
  property: Property, 
  investorId: string, 
  investmentAmount: number, 
  profitSharePercentage: number
): number {
  if (!property.finalSalePrice || !property.purchaseDetails) return investmentAmount;
  
  const salePrice = property.finalSalePrice;
  const costBasis = property.purchaseDetails.totalCostBasis;
  const commissionAmount = property.commissionEarned || 0;
  
  const netProfit = salePrice - costBasis - commissionAmount;
  const investorProfitShare = (netProfit * profitSharePercentage) / 100;
  
  return investmentAmount + investorProfitShare;
}

/**
 * Create profit distribution when property is sold
 */
export function createProfitDistributionForSale(
  property: Property,
  transactionId: string,
  userId: string
): void {
  // Only create distribution for investor-purchase properties that are sold
  if (property.acquisitionType !== 'investor-purchase' || property.status !== 'sold') {
    return;
  }

  if (!property.finalSalePrice || !property.purchaseDetails) {
    return;
  }

  // Check if distribution already exists
  const existing = getProfitDistributionByProperty(property.id);
  if (existing) {
    return; // Don't create duplicate
  }

  const salePrice = property.finalSalePrice;
  const costBasis = property.purchaseDetails.totalCostBasis;
  const commissionAmount = property.commissionEarned || 0;
  const netProfit = salePrice - costBasis - commissionAmount;

  // Get property investments
  const investments = getPropertyInvestmentsByProperty(property.id);
  
  if (investments.length === 0) {
    return;
  }

  // Calculate distributions
  const distributions = investments.map(inv => {
    const profitShare = (netProfit * inv.profitSharePercentage) / 100;
    
    return {
      recipientId: inv.investorId,
      recipientName: inv.investorName,
      recipientType: 'investor' as 'investor' | 'agent' | 'company',
      investmentAmount: inv.investmentAmount,
      profitSharePercentage: inv.profitSharePercentage,
      profitAmount: profitShare,
      totalPayout: inv.investmentAmount + profitShare,
      status: 'pending' as 'pending' | 'approved' | 'paid',
      paymentMethod: undefined,
      paymentDate: undefined,
      paymentReference: undefined,
      notes: undefined
    };
  });

  const profitDist: ProfitDistribution = {
    id: `profitdist-${property.id}-${Date.now()}`,
    propertyId: property.id,
    transactionId: transactionId,
    finalSalePrice: salePrice,
    totalCostBasis: costBasis,
    totalNetProfit: netProfit,
    distributions: distributions,
    status: 'calculated',
    calculatedDate: new Date().toISOString(),
    createdBy: userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    notes: `Profit distribution for ${property.title}`
  };

  saveProfitDistribution(profitDist);
}

/**
 * Get total invested amount for a property from all investors
 */
export function getPropertyTotalInvestment(propertyId: string): number {
  const investments = getPropertyInvestmentsByProperty(propertyId);
  return investments.reduce((sum, inv) => sum + inv.investmentAmount, 0);
}

/**
 * Get investor ownership percentage in a property
 */
export function getInvestorOwnershipPercentage(propertyId: string, investorId: string): number {
  const investments = getPropertyInvestmentsByProperty(propertyId);
  const totalInvestment = investments.reduce((sum, inv) => sum + inv.investmentAmount, 0);
  
  if (totalInvestment === 0) return 0;
  
  const investorInvestment = investments.find(inv => inv.investorId === investorId);
  if (!investorInvestment) return 0;
  
  return (investorInvestment.investmentAmount / totalInvestment) * 100;
}

/**
 * Recalculate all investor stats
 * Useful when syncing or migrating data
 */
export function recalculateAllInvestorStats(investorIds?: string[]): void {
  const idsToUpdate = investorIds || [];
  
  if (idsToUpdate.length === 0) {
    // Get all unique investor IDs from investments
    const allInvestments = getPropertyInvestments();
    const uniqueIds = Array.from(new Set(allInvestments.map((inv: PropertyInvestment) => inv.investorId)));
    idsToUpdate.push(...uniqueIds);
  }
  
  idsToUpdate.forEach(investorId => {
    updateInvestorStats(investorId);
  });
}
