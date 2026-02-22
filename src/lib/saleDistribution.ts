/**
 * Sale Distribution Management (stub)
 * UI-only: no localStorage.
 */

import type { InvestorDistribution } from '../types';

export function getAllInvestorDistributions(): InvestorDistribution[] {
  return [];
}

export function getPropertyDistributions(_propertyId: string): InvestorDistribution[] {
  return [];
}

export function getInvestorDistributions(_investorId: string): InvestorDistribution[] {
  return [];
}

export function getDistributionById(_id: string): InvestorDistribution | undefined {
  return undefined;
}

export function calculateSaleDistribution(
  _propertyId: string,
  _salePrice: number,
  _saleDate: string,
  _dealId?: string
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
  return {
    totalPurchasePrice: 0,
    totalSalePrice: 0,
    capitalGain: 0,
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    investorDistributions: [],
  };
}

export function executeSaleDistribution(
  _propertyId: string,
  _salePrice: number,
  _saleDate: string,
  _dealId?: string
): InvestorDistribution[] {
  return [];
}

export function markDistributionPaid(
  _distributionId: string,
  _paymentDate: string,
  _paymentMethod: string,
  _reference?: string
): boolean {
  return false;
}

export function cancelDistribution(_distributionId: string, _reason: string): boolean {
  return false;
}

export function getPropertyDistributionSummary(_propertyId: string): {
  totalDistributions: number;
  totalAmount: number;
  paidCount: number;
  pendingCount: number;
} {
  return {
    totalDistributions: 0,
    totalAmount: 0,
    paidCount: 0,
    pendingCount: 0,
  };
}

export function getInvestorTotalReturns(_investorId: string): {
  totalDistributions: number;
  totalAmount: number;
  averageROI: number;
} {
  return {
    totalDistributions: 0,
    totalAmount: 0,
    averageROI: 0,
  };
}
