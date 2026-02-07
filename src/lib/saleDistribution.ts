/**
 * Sale Distribution Management
 * Handles profit calculation and distribution when investor-owned properties are sold
 * CRITICAL: Completes the investor syndication lifecycle
 */

import { InvestorDistribution, Property, InvestorInvestment, Deal } from '../types';
import { getPropertyById } from './data';
import { getInvestorById, getInvestorInvestments } from './investors';
import { getPropertyInvestorTransactions } from './investorTransactions';

const DISTRIBUTIONS_KEY = 'investor_distributions';

/**
 * Get all investor distributions
 */
export function getAllInvestorDistributions(): InvestorDistribution[] {
  const stored = localStorage.getItem(DISTRIBUTIONS_KEY);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Save investor distributions to localStorage
 */
function saveInvestorDistributions(distributions: InvestorDistribution[]): void {
  localStorage.setItem(DISTRIBUTIONS_KEY, JSON.stringify(distributions));
}

/**
 * Get distributions for a specific property
 */
export function getPropertyDistributions(propertyId: string): InvestorDistribution[] {
  const distributions = getAllInvestorDistributions();
  return distributions.filter(d => d.propertyId === propertyId);
}

/**
 * Get distributions for a specific investor
 */
export function getInvestorDistributions(investorId: string): InvestorDistribution[] {
  const distributions = getAllInvestorDistributions();
  return distributions.filter(d => d.investorId === investorId);
}

/**
 * Get distribution by ID
 */
export function getDistributionById(id: string): InvestorDistribution | undefined {
  const distributions = getAllInvestorDistributions();
  return distributions.find(d => d.id === id);
}

/**
 * Calculate profit distribution for property sale
 * CRITICAL: This is the core calculation that determines investor returns
 */
export function calculateSaleDistribution(
  propertyId: string,
  salePrice: number,
  saleDate: string,
  dealId?: string
): {
  totalPurchasePrice: number;
  totalSalePrice: number;
  capitalGain: number;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  investorDistributions: Array<{
    investorId: string;
    investorName: string;
    sharePercentage: number;
    investmentAmount: number;
    rentalIncome: number;
    expenses: number;
    capitalGain: number;
    totalProfit: number;
    totalReturn: number;
    roi: number;
  }>;
} {
  const property = getPropertyById(propertyId);
  if (!property) {
    throw new Error('Property not found');
  }

  if (property.currentOwnerType !== 'investor' || !property.investorShares || property.investorShares.length === 0) {
    throw new Error('Property is not investor-owned');
  }

  // Get all active investments for this property
  const allInvestments = JSON.parse(localStorage.getItem('investor_investments') || '[]') as InvestorInvestment[];
  const propertyInvestments = allInvestments.filter(
    inv => inv.propertyId === propertyId && inv.status === 'active'
  );

  if (propertyInvestments.length === 0) {
    throw new Error('No active investments found for this property');
  }

  // Calculate totals
  const totalPurchasePrice = propertyInvestments.reduce((sum, inv) => sum + inv.investmentAmount, 0);
  const totalSalePrice = salePrice;
  const capitalGain = totalSalePrice - totalPurchasePrice;

  // Calculate total income and expenses from transactions
  const transactions = getPropertyInvestorTransactions(propertyId);
  const totalIncome = transactions
    .filter(t => t.transactionType === 'rental-income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions
    .filter(t => t.transactionType.startsWith('expense-'))
    .reduce((sum, t) => sum + t.amount, 0);

  // Net profit = capital gain + rental income - expenses
  const netProfit = capitalGain + totalIncome - totalExpenses;

  // Calculate distribution for each investor
  const investorDistributions = propertyInvestments.map(investment => {
    const investor = getInvestorById(investment.investorId);
    const sharePercentage = investment.sharePercentage;
    
    // Each investor gets their share of everything
    const investorCapitalGain = (capitalGain * sharePercentage) / 100;
    const investorRentalIncome = investment.rentalIncome || 0;
    const investorExpenses = investment.totalExpenses || 0;
    
    // Total profit for this investor
    const investorTotalProfit = investorCapitalGain + investorRentalIncome - investorExpenses;
    
    // Total return = investment + profit
    const totalReturn = investment.investmentAmount + investorTotalProfit;
    
    // ROI
    const roi = (investorTotalProfit / investment.investmentAmount) * 100;

    return {
      investorId: investment.investorId,
      investorName: investor?.name || 'Unknown Investor',
      sharePercentage,
      investmentAmount: investment.investmentAmount,
      rentalIncome: investorRentalIncome,
      expenses: investorExpenses,
      capitalGain: investorCapitalGain,
      totalProfit: investorTotalProfit,
      totalReturn,
      roi,
    };
  });

  return {
    totalPurchasePrice,
    totalSalePrice,
    capitalGain,
    totalIncome,
    totalExpenses,
    netProfit,
    investorDistributions,
  };
}

/**
 * Execute sale distribution
 * Creates distribution records and updates InvestorInvestment records
 * CRITICAL: This finalizes the investment and marks it as "exited"
 */
export function executeSaleDistribution(
  propertyId: string,
  salePrice: number,
  saleDate: string,
  userId: string,
  userName: string,
  dealId?: string,
  notes?: string
): InvestorDistribution[] {
  const property = getPropertyById(propertyId);
  if (!property) {
    throw new Error('Property not found');
  }

  // Calculate distribution
  const calculation = calculateSaleDistribution(propertyId, salePrice, saleDate, dealId);

  // Get all active investments for this property
  const allInvestments = JSON.parse(localStorage.getItem('investor_investments') || '[]') as InvestorInvestment[];
  const propertyInvestments = allInvestments.filter(
    inv => inv.propertyId === propertyId && inv.status === 'active'
  );

  const distributionRecords: InvestorDistribution[] = [];

  // Create distribution record for each investor
  calculation.investorDistributions.forEach(dist => {
    const distribution: InvestorDistribution = {
      id: `dist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      investorId: dist.investorId,
      investorName: dist.investorName,
      propertyId,
      propertyTitle: property.title,
      propertyAddress: property.address,
      
      // Investment details
      investmentId: propertyInvestments.find(inv => inv.investorId === dist.investorId)?.id || '',
      sharePercentage: dist.sharePercentage,
      investmentAmount: dist.investmentAmount,
      
      // Sale details
      salePrice: (salePrice * dist.sharePercentage) / 100, // Their share of sale price
      saleDate,
      purchaseCycleId: propertyInvestments.find(inv => inv.investorId === dist.investorId)?.purchaseCycleId,
      dealId,
      
      // Profit breakdown
      capitalGain: dist.capitalGain,
      rentalIncome: dist.rentalIncome,
      totalExpenses: dist.expenses,
      netProfit: dist.totalProfit,
      
      // Returns
      totalReturn: dist.totalReturn,
      roi: dist.roi,
      
      // Distribution status
      distributionStatus: 'pending',
      distributionDate: null,
      paymentMethod: null,
      paymentReference: null,
      
      // Metadata
      notes,
      processedBy: userId,
      processedByName: userName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    distributionRecords.push(distribution);
  });

  // Save distribution records
  const allDistributions = getAllInvestorDistributions();
  allDistributions.push(...distributionRecords);
  saveInvestorDistributions(allDistributions);

  // Update InvestorInvestment records - mark as "exited"
  propertyInvestments.forEach(investment => {
    const distribution = distributionRecords.find(d => d.investorId === investment.investorId);
    if (distribution) {
      investment.status = 'exited';
      investment.exitDate = saleDate;
      investment.exitValue = distribution.totalReturn;
      investment.realizedProfit = distribution.netProfit;
      investment.roi = distribution.roi;
      investment.distributionId = distribution.id;
      investment.updatedAt = new Date().toISOString();
    }
  });

  // Save updated investments
  localStorage.setItem('investor_investments', JSON.stringify(allInvestments));

  console.log(`✅ Sale distribution executed for ${distributionRecords.length} investors`);
  console.log(`   Total sale price: ${salePrice}`);
  console.log(`   Net profit distributed: ${calculation.netProfit}`);

  return distributionRecords;
}

/**
 * Mark distribution as paid
 */
export function markDistributionPaid(
  distributionId: string,
  paymentDate: string,
  paymentMethod: string,
  paymentReference?: string
): InvestorDistribution | null {
  const distributions = getAllInvestorDistributions();
  const index = distributions.findIndex(d => d.id === distributionId);

  if (index === -1) {
    console.error('Distribution not found:', distributionId);
    return null;
  }

  distributions[index] = {
    ...distributions[index],
    distributionStatus: 'paid',
    distributionDate: paymentDate,
    paymentMethod,
    paymentReference: paymentReference || null,
    updatedAt: new Date().toISOString(),
  };

  saveInvestorDistributions(distributions);

  console.log(`✅ Distribution marked as paid: ${distributionId}`);
  return distributions[index];
}

/**
 * Cancel distribution (if sale falls through)
 */
export function cancelDistribution(distributionId: string, reason: string): boolean {
  const distributions = getAllInvestorDistributions();
  const index = distributions.findIndex(d => d.id === distributionId);

  if (index === -1) {
    console.error('Distribution not found:', distributionId);
    return false;
  }

  const distribution = distributions[index];

  // Revert InvestorInvestment status
  const allInvestments = JSON.parse(localStorage.getItem('investor_investments') || '[]') as InvestorInvestment[];
  const investment = allInvestments.find(inv => inv.id === distribution.investmentId);
  
  if (investment) {
    investment.status = 'active';
    investment.exitDate = undefined;
    investment.exitValue = undefined;
    investment.realizedProfit = undefined;
    investment.distributionId = undefined;
    investment.updatedAt = new Date().toISOString();
    localStorage.setItem('investor_investments', JSON.stringify(allInvestments));
  }

  // Update distribution status
  distributions[index] = {
    ...distribution,
    distributionStatus: 'cancelled',
    notes: distribution.notes ? `${distribution.notes}\n\nCancelled: ${reason}` : `Cancelled: ${reason}`,
    updatedAt: new Date().toISOString(),
  };

  saveInvestorDistributions(distributions);

  console.log(`✅ Distribution cancelled: ${distributionId}`);
  return true;
}

/**
 * Get distribution summary for property
 */
export function getPropertyDistributionSummary(propertyId: string): {
  totalDistributed: number;
  totalInvestors: number;
  pendingCount: number;
  paidCount: number;
  cancelledCount: number;
  pendingAmount: number;
  paidAmount: number;
} {
  const distributions = getPropertyDistributions(propertyId);

  const pending = distributions.filter(d => d.distributionStatus === 'pending');
  const paid = distributions.filter(d => d.distributionStatus === 'paid');
  const cancelled = distributions.filter(d => d.distributionStatus === 'cancelled');

  return {
    totalDistributed: distributions.reduce((sum, d) => sum + d.totalReturn, 0),
    totalInvestors: distributions.length,
    pendingCount: pending.length,
    paidCount: paid.length,
    cancelledCount: cancelled.length,
    pendingAmount: pending.reduce((sum, d) => sum + d.totalReturn, 0),
    paidAmount: paid.reduce((sum, d) => sum + d.totalReturn, 0),
  };
}

/**
 * Get investor's total returns across all distributions
 */
export function getInvestorTotalReturns(investorId: string): {
  totalInvested: number;
  totalReturned: number;
  totalProfit: number;
  averageROI: number;
  distributionCount: number;
} {
  const distributions = getInvestorDistributions(investorId);
  const paidDistributions = distributions.filter(d => d.distributionStatus === 'paid');

  const totalInvested = paidDistributions.reduce((sum, d) => sum + d.investmentAmount, 0);
  const totalReturned = paidDistributions.reduce((sum, d) => sum + d.totalReturn, 0);
  const totalProfit = paidDistributions.reduce((sum, d) => sum + d.netProfit, 0);
  const averageROI = paidDistributions.length > 0 
    ? paidDistributions.reduce((sum, d) => sum + d.roi, 0) / paidDistributions.length 
    : 0;

  return {
    totalInvested,
    totalReturned,
    totalProfit,
    averageROI,
    distributionCount: paidDistributions.length,
  };
}
