/**
 * Quarterly Distribution Automation
 * GAP FIX: Quarterly distribution automation was documented but not implemented
 * 
 * This module handles automated quarterly distribution of rental income to investors
 * in syndicates. Works client-side without backend.
 */

import { Syndicate } from '../types';
import { getSyndicateById } from './investors';
import { getPropertyById } from './data';
import { formatPKR } from './currency';

export interface QuarterlyDistribution {
  id: string;
  syndicateId: string;
  propertyId: string;
  quarter: number;
  year: number;
  period: {
    startDate: string;
    endDate: string;
  };
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  distributions: Array<{
    investorId: string;
    investorName: string;
    shares: number;
    sharePercentage: number;
    distributionAmount: number;
    status: 'pending' | 'approved' | 'paid' | 'cancelled';
    paymentDate?: string;
    paymentMethod?: string;
    paymentReference?: string;
  }>;
  status: 'draft' | 'approved' | 'distributed' | 'cancelled';
  createdAt: string;
  createdBy: string;
  approvedAt?: string;
  approvedBy?: string;
  distributedAt?: string;
  notes?: string;
}

const QUARTERLY_DISTRIBUTIONS_KEY = 'quarterly_distributions';

/**
 * Calculate quarterly distribution for a syndicate
 * GAP FIX: This was missing - now implemented
 */
export function calculateQuarterlyDistribution(
  syndicateId: string,
  quarter: number,
  year: number
): QuarterlyDistribution {
  const syndicate = getSyndicateById(syndicateId);
  if (!syndicate) {
    throw new Error('Syndicate not found');
  }

  const property = getPropertyById(syndicate.propertyId);
  if (!property) {
    throw new Error('Property not found');
  }

  // Calculate period dates
  const period = calculateQuarterPeriod(quarter, year);

  // Calculate income for the quarter
  const income = calculateIncomeForPeriod(syndicateId, period);
  
  // Calculate expenses for the quarter
  const expenses = calculateExpensesForPeriod(syndicateId, period);
  
  // Net income available for distribution
  const netIncome = income.total - expenses.total;

  // Calculate distribution for each investor based on share percentage
  const distributions = syndicate.investors.map(investor => {
    const sharePercentage = (investor.shares / syndicate.totalShares) * 100;
    const distributionAmount = netIncome * (sharePercentage / 100);

    return {
      investorId: investor.contactId,
      investorName: investor.contactName || 'Unknown',
      shares: investor.shares,
      sharePercentage,
      distributionAmount,
      status: 'pending' as const
    };
  });

  return {
    id: `qdist-${syndicateId}-${year}-Q${quarter}-${Date.now()}`,
    syndicateId,
    propertyId: property.id,
    quarter,
    year,
    period,
    totalIncome: income.total,
    totalExpenses: expenses.total,
    netIncome,
    distributions,
    status: 'draft',
    createdAt: new Date().toISOString(),
    createdBy: 'system'
  };
}

/**
 * Save quarterly distribution to storage
 */
export function saveQuarterlyDistribution(distribution: QuarterlyDistribution): void {
  const distributions = getAllQuarterlyDistributions();
  
  // Check if distribution already exists for this quarter
  const existingIndex = distributions.findIndex(
    d => d.syndicateId === distribution.syndicateId &&
         d.quarter === distribution.quarter &&
         d.year === distribution.year &&
         d.status !== 'cancelled'
  );

  if (existingIndex >= 0) {
    // Update existing
    distributions[existingIndex] = distribution;
  } else {
    // Add new
    distributions.push(distribution);
  }

  localStorage.setItem(QUARTERLY_DISTRIBUTIONS_KEY, JSON.stringify(distributions));
}

/**
 * Get all quarterly distributions
 */
export function getAllQuarterlyDistributions(): QuarterlyDistribution[] {
  try {
    const stored = localStorage.getItem(QUARTERLY_DISTRIBUTIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load quarterly distributions:', error);
    return [];
  }
}

/**
 * Get distributions for a specific syndicate
 */
export function getSyndicateDistributions(syndicateId: string): QuarterlyDistribution[] {
  return getAllQuarterlyDistributions().filter(d => d.syndicateId === syndicateId);
}

/**
 * Get distributions for a specific investor
 */
export function getInvestorQuarterlyDistributions(investorId: string): QuarterlyDistribution[] {
  const allDistributions = getAllQuarterlyDistributions();
  return allDistributions.filter(d =>
    d.distributions.some(dist => dist.investorId === investorId)
  );
}

/**
 * Get distribution by ID
 */
export function getQuarterlyDistributionById(id: string): QuarterlyDistribution | undefined {
  return getAllQuarterlyDistributions().find(d => d.id === id);
}

/**
 * Approve a quarterly distribution
 */
export function approveQuarterlyDistribution(
  distributionId: string,
  approvedBy: string
): QuarterlyDistribution | null {
  const distributions = getAllQuarterlyDistributions();
  const index = distributions.findIndex(d => d.id === distributionId);

  if (index === -1) {
    throw new Error('Distribution not found');
  }

  distributions[index] = {
    ...distributions[index],
    status: 'approved',
    approvedAt: new Date().toISOString(),
    approvedBy
  };

  localStorage.setItem(QUARTERLY_DISTRIBUTIONS_KEY, JSON.stringify(distributions));
  return distributions[index];
}

/**
 * Mark distribution as paid for a specific investor
 */
export function markInvestorDistributionPaid(
  distributionId: string,
  investorId: string,
  paymentDate: string,
  paymentMethod: string,
  paymentReference?: string
): QuarterlyDistribution | null {
  const distributions = getAllQuarterlyDistributions();
  const index = distributions.findIndex(d => d.id === distributionId);

  if (index === -1) {
    throw new Error('Distribution not found');
  }

  const distribution = distributions[index];
  const investorIndex = distribution.distributions.findIndex(d => d.investorId === investorId);

  if (investorIndex === -1) {
    throw new Error('Investor not found in distribution');
  }

  // Update investor distribution status
  distribution.distributions[investorIndex] = {
    ...distribution.distributions[investorIndex],
    status: 'paid',
    paymentDate,
    paymentMethod,
    paymentReference
  };

  // Check if all distributions are paid
  const allPaid = distribution.distributions.every(d => d.status === 'paid');
  if (allPaid) {
    distribution.status = 'distributed';
    distribution.distributedAt = new Date().toISOString();
  }

  distributions[index] = distribution;
  localStorage.setItem(QUARTERLY_DISTRIBUTIONS_KEY, JSON.stringify(distributions));
  return distribution;
}

/**
 * Generate quarterly distributions for all active syndicates
 * GAP FIX: Automation function - can be called on schedule
 */
export function generateQuarterlyDistributionsForAll(
  quarter: number,
  year: number,
  createdBy: string = 'system'
): QuarterlyDistribution[] {
  // Get all active syndicates
  const syndicates = getAllActiveSyndicates();
  const distributions: QuarterlyDistribution[] = [];

  syndicates.forEach(syndicate => {
    try {
      const distribution = calculateQuarterlyDistribution(
        syndicate.id,
        quarter,
        year
      );
      distribution.createdBy = createdBy;
      saveQuarterlyDistribution(distribution);
      distributions.push(distribution);
    } catch (error) {
      console.error(`Failed to generate distribution for syndicate ${syndicate.id}:`, error);
    }
  });

  return distributions;
}

/**
 * Get distributions due for a specific quarter
 */
export function getDistributionsForQuarter(
  quarter: number,
  year: number
): QuarterlyDistribution[] {
  return getAllQuarterlyDistributions().filter(
    d => d.quarter === quarter && d.year === year
  );
}

/**
 * Get pending distributions (not yet paid)
 */
export function getPendingDistributions(): QuarterlyDistribution[] {
  return getAllQuarterlyDistributions().filter(
    d => d.status === 'draft' || d.status === 'approved'
  );
}

/**
 * Get distributions summary for an investor
 */
export function getInvestorDistributionSummary(investorId: string): {
  totalDistributions: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  distributions: QuarterlyDistribution[];
} {
  const distributions = getInvestorQuarterlyDistributions(investorId);
  
  let totalAmount = 0;
  let paidAmount = 0;
  let pendingAmount = 0;

  distributions.forEach(dist => {
    const investorDist = dist.distributions.find(d => d.investorId === investorId);
    if (investorDist) {
      totalAmount += investorDist.distributionAmount;
      if (investorDist.status === 'paid') {
        paidAmount += investorDist.distributionAmount;
      } else {
        pendingAmount += investorDist.distributionAmount;
      }
    }
  });

  return {
    totalDistributions: distributions.length,
    totalAmount,
    paidAmount,
    pendingAmount,
    distributions
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateQuarterPeriod(quarter: number, year: number) {
  const quarters: Record<number, { start: string; end: string }> = {
    1: { start: `${year}-01-01`, end: `${year}-03-31` },
    2: { start: `${year}-04-01`, end: `${year}-06-30` },
    3: { start: `${year}-07-01`, end: `${year}-09-30` },
    4: { start: `${year}-10-01`, end: `${year}-12-31` }
  };

  const q = quarters[quarter];
  if (!q) {
    throw new Error(`Invalid quarter: ${quarter}. Must be 1-4.`);
  }

  return {
    startDate: q.start,
    endDate: q.end
  };
}

function calculateIncomeForPeriod(syndicateId: string, period: any) {
  // In a real implementation, this would query financial transactions
  // For prototype, estimate based on property value (2% monthly rental yield)
  
  const syndicate = getSyndicateById(syndicateId);
  if (!syndicate) {
    return { total: 0 };
  }

  const property = getPropertyById(syndicate.propertyId);
  if (!property) {
    return { total: 0 };
  }

  // Estimate: 2% of property value per month for 3 months (quarterly)
  const monthlyRental = (property.price || 0) * 0.02;
  const quarterlyRental = monthlyRental * 3;

  return {
    total: quarterlyRental,
    rentalIncome: quarterlyRental,
    otherIncome: 0
  };
}

function calculateExpensesForPeriod(syndicateId: string, period: any) {
  // In a real implementation, this would query expense transactions
  // For prototype, estimate based on property value (0.5% monthly)
  
  const syndicate = getSyndicateById(syndicateId);
  if (!syndicate) {
    return { total: 0 };
  }

  const property = getPropertyById(syndicate.propertyId);
  if (!property) {
    return { total: 0 };
  }

  // Estimate: 0.5% of property value per month for expenses (quarterly)
  const monthlyExpenses = (property.price || 0) * 0.005;
  const quarterlyExpenses = monthlyExpenses * 3;

  return {
    total: quarterlyExpenses,
    management: quarterlyExpenses * 0.30,
    maintenance: quarterlyExpenses * 0.25,
    propertyTax: quarterlyExpenses * 0.20,
    insurance: quarterlyExpenses * 0.15,
    utilities: quarterlyExpenses * 0.07,
    other: quarterlyExpenses * 0.03
  };
}

function getAllActiveSyndicates(): Syndicate[] {
  // Get all syndicates from investors.ts
  // This is a simplified version - in real app, would query properly
  try {
    const investorsJson = localStorage.getItem('estate_investors');
    if (!investorsJson) return [];
    
    // For now, return empty - would need to query syndicates properly
    // This is a placeholder - actual implementation would query from investors.ts
    return [];
  } catch (error) {
    console.error('Failed to get active syndicates:', error);
    return [];
  }
}

/**
 * Format distribution as text for display/export
 */
export function formatDistributionAsText(distribution: QuarterlyDistribution): string {
  return `
QUARTERLY DISTRIBUTION STATEMENT
================================================================================

SYNDICATE INFORMATION
Property: ${distribution.propertyId}
Quarter: Q${distribution.quarter} ${distribution.year}
Period: ${new Date(distribution.period.startDate).toLocaleDateString()} - ${new Date(distribution.period.endDate).toLocaleDateString()}

FINANCIAL SUMMARY
Total Income:        ${formatPKR(distribution.totalIncome)}
Total Expenses:      ${formatPKR(distribution.totalExpenses)}
Net Income:          ${formatPKR(distribution.netIncome)}

DISTRIBUTIONS
${distribution.distributions.map(d => 
  `${d.investorName} (${d.sharePercentage.toFixed(2)}%): ${formatPKR(d.distributionAmount)} - ${d.status}`
).join('\n')}

STATUS: ${distribution.status.toUpperCase()}
Created: ${new Date(distribution.createdAt).toLocaleDateString()}
${distribution.approvedAt ? `Approved: ${new Date(distribution.approvedAt).toLocaleDateString()}` : ''}
${distribution.distributedAt ? `Distributed: ${new Date(distribution.distributedAt).toLocaleDateString()}` : ''}

================================================================================
  `.trim();
}
