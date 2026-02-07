/**
 * Agency Financials Library
 * Financial calculations and P&L analysis for agency-owned properties
 * 
 * Handles:
 * - Property financial summaries
 * - Portfolio-wide calculations
 * - P&L statements
 * - ROI calculations
 * - Performance metrics
 */

import {
  PropertyFinancials,
  AgencyPortfolioFinancials,
  PropertyProfitLoss,
  AgencyTransaction,
} from '../types';
import {
  getTransactionsByProperty,
  getTransactionsByCategory,
  getTotalByCategory,
  getTotalByType,
  getAllAgencyTransactions,
} from './agencyTransactions';

// ============================================================================
// PROPERTY-LEVEL FINANCIALS
// ============================================================================

/**
 * Calculate complete financial summary for a property
 */
export function calculatePropertyFinancials(
  propertyId: string,
  propertyAddress: string,
  acquisitionDate: string,
  currentValue?: number,
  saleDate?: string
): PropertyFinancials {
  const transactions = getTransactionsByProperty(propertyId);
  
  // ACQUISITION COSTS
  const acquisitionTransactions = transactions.filter(t => t.category === 'acquisition');
  const purchasePrice = getTotalByType(propertyId, 'purchase_price');
  
  const acquisitionBreakdown = {
    registrationFee: getTotalByType(propertyId, 'registration_fee'),
    stampDuty: getTotalByType(propertyId, 'stamp_duty'),
    legalFees: getTotalByType(propertyId, 'legal_fees'),
    brokerCommission: getTotalByType(propertyId, 'broker_commission'),
    renovation: getTotalByType(propertyId, 'renovation'),
    other: getTotalByType(propertyId, 'other_acquisition'),
  };
  
  const acquisitionExpenses = Object.values(acquisitionBreakdown).reduce((a, b) => a + b, 0);
  const totalAcquisitionCost = purchasePrice + acquisitionExpenses;
  
  // INCOME
  const incomeBreakdown = {
    rentalIncome: getTotalByType(propertyId, 'rental_income'),
    parkingFee: getTotalByType(propertyId, 'parking_fee'),
    lateFee: getTotalByType(propertyId, 'late_fee'),
    otherIncome: getTotalByType(propertyId, 'other_income'),
  };
  
  const totalIncome = Object.values(incomeBreakdown).reduce((a, b) => a + b, 0);
  
  // EXPENSES
  const expenseBreakdown = {
    propertyTax: getTotalByType(propertyId, 'property_tax'),
    maintenance: getTotalByType(propertyId, 'maintenance'),
    repairs: getTotalByType(propertyId, 'repairs'),
    utilities: getTotalByType(propertyId, 'utilities'),
    insurance: getTotalByType(propertyId, 'insurance'),
    managementFee: getTotalByType(propertyId, 'management_fee'),
    marketing: getTotalByType(propertyId, 'marketing'),
    legalExpense: getTotalByType(propertyId, 'legal_expense'),
    otherExpense: getTotalByType(propertyId, 'other_expense'),
  };
  
  const totalExpenses = Object.values(expenseBreakdown).reduce((a, b) => a + b, 0);
  const netCashFlow = totalIncome - totalExpenses;
  const operatingProfit = netCashFlow;
  
  // SALE (if sold)
  let salePrice: number | undefined;
  let saleExpenses: number | undefined;
  let netSaleProceeds: number | undefined;
  let saleBreakdown: { saleCommission: number; closingCosts: number } | undefined;
  let capitalGain: number | undefined;
  let totalProfit: number | undefined;
  let roi: number | undefined;
  let annualizedROI: number | undefined;
  let holdingPeriod: number | undefined;
  let holdingPeriodYears: number | undefined;
  let status: 'active' | 'sold' = 'active';
  
  if (saleDate) {
    status = 'sold';
    salePrice = getTotalByType(propertyId, 'sale_price');
    
    saleBreakdown = {
      saleCommission: getTotalByType(propertyId, 'sale_commission'),
      closingCosts: getTotalByType(propertyId, 'closing_costs'),
    };
    
    saleExpenses = saleBreakdown.saleCommission + saleBreakdown.closingCosts;
    netSaleProceeds = salePrice - saleExpenses;
    capitalGain = netSaleProceeds - totalAcquisitionCost;
    totalProfit = capitalGain + operatingProfit;
    
    // Calculate holding period
    const acquireDate = new Date(acquisitionDate);
    const sellDate = new Date(saleDate);
    holdingPeriod = Math.floor((sellDate.getTime() - acquireDate.getTime()) / (1000 * 60 * 60 * 24));
    holdingPeriodYears = holdingPeriod / 365;
    
    // Calculate ROI
    if (totalAcquisitionCost > 0) {
      roi = (totalProfit / totalAcquisitionCost) * 100;
      annualizedROI = holdingPeriodYears > 0 ? roi / holdingPeriodYears : roi;
    }
  }
  
  return {
    propertyId,
    propertyAddress,
    totalAcquisitionCost,
    purchasePrice,
    acquisitionExpenses,
    acquisitionBreakdown,
    totalIncome,
    totalExpenses,
    netCashFlow,
    incomeBreakdown,
    expenseBreakdown,
    salePrice,
    saleExpenses,
    netSaleProceeds,
    saleBreakdown,
    capitalGain,
    operatingProfit,
    totalProfit,
    roi,
    annualizedROI,
    acquisitionDate,
    saleDate,
    holdingPeriod,
    holdingPeriodYears,
    status,
    lastCalculated: new Date().toISOString(),
    transactionCount: transactions.length,
  };
}

// ============================================================================
// PORTFOLIO-LEVEL FINANCIALS
// ============================================================================

/**
 * Calculate portfolio-wide financial summary
 */
export function calculatePortfolioFinancials(
  properties: Array<{
    id: string;
    address: string;
    acquisitionDate: string;
    currentValue: number;
    status: 'active' | 'sold';
    saleDate?: string;
  }>
): AgencyPortfolioFinancials {
  const activeProperties = properties.filter(p => p.status === 'active');
  const soldProperties = properties.filter(p => p.status === 'sold');
  
  // INVESTMENT
  let totalInvested = 0;
  let currentPortfolioValue = 0;
  let totalIncome = 0;
  let totalExpenses = 0;
  let totalRealizedProfit = 0;
  let totalHoldingPeriod = 0;
  
  // YTD calculations
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];
  let incomeYTD = 0;
  let expensesYTD = 0;
  
  // Calculate metrics for each property
  properties.forEach(property => {
    const financials = calculatePropertyFinancials(
      property.id,
      property.address,
      property.acquisitionDate,
      property.currentValue,
      property.saleDate
    );
    
    totalInvested += financials.totalAcquisitionCost;
    
    if (property.status === 'active') {
      currentPortfolioValue += property.currentValue;
      totalIncome += financials.totalIncome;
      totalExpenses += financials.totalExpenses;
      
      // YTD calculations
      const incomeTransactions = getTransactionsByCategory(property.id, 'income')
        .filter(t => t.date >= yearStart && t.date <= today);
      incomeYTD += incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
      
      const expenseTransactions = getTransactionsByCategory(property.id, 'expense')
        .filter(t => t.date >= yearStart && t.date <= today);
      expensesYTD += expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
    }
    
    if (property.status === 'sold' && financials.totalProfit) {
      totalRealizedProfit += financials.totalProfit;
      if (financials.holdingPeriod) {
        totalHoldingPeriod += financials.holdingPeriod;
      }
    }
  });
  
  const netCashFlow = totalIncome - totalExpenses;
  const netCashFlowYTD = incomeYTD - expensesYTD;
  
  // Portfolio ROI
  const totalRealizedROI = totalInvested > 0 ? (totalRealizedProfit / totalInvested) * 100 : 0;
  const averageHoldingPeriod = soldProperties.length > 0 ? totalHoldingPeriod / soldProperties.length : 0;
  
  // Unrealized profit (if all active properties sold at current value)
  let unrealizedProfit = 0;
  activeProperties.forEach(property => {
    const financials = calculatePropertyFinancials(
      property.id,
      property.address,
      property.acquisitionDate
    );
    const potentialSaleProceeds = property.currentValue;
    const potentialCapitalGain = potentialSaleProceeds - financials.totalAcquisitionCost;
    unrealizedProfit += potentialCapitalGain + financials.operatingProfit;
  });
  
  const portfolioROI = totalInvested > 0 
    ? ((totalRealizedProfit + unrealizedProfit) / totalInvested) * 100 
    : 0;
  
  // Top performers
  let bestROIProperty: AgencyPortfolioFinancials['bestROIProperty'];
  let bestCashFlowProperty: AgencyPortfolioFinancials['bestCashFlowProperty'];
  
  properties.forEach(property => {
    const financials = calculatePropertyFinancials(
      property.id,
      property.address,
      property.acquisitionDate,
      property.currentValue,
      property.saleDate
    );
    
    if (financials.roi && (!bestROIProperty || financials.roi > bestROIProperty.roi)) {
      bestROIProperty = {
        propertyId: property.id,
        address: property.address,
        roi: financials.roi,
      };
    }
    
    if (!bestCashFlowProperty || financials.netCashFlow > bestCashFlowProperty.netCashFlow) {
      bestCashFlowProperty = {
        propertyId: property.id,
        address: property.address,
        netCashFlow: financials.netCashFlow,
      };
    }
  });
  
  return {
    totalProperties: properties.length,
    activeProperties: activeProperties.length,
    soldProperties: soldProperties.length,
    totalInvested,
    currentPortfolioValue,
    totalIncome,
    totalExpenses,
    netCashFlow,
    incomeYTD,
    expensesYTD,
    netCashFlowYTD,
    totalRealizedProfit,
    totalRealizedROI,
    averageHoldingPeriod,
    unrealizedProfit,
    portfolioROI,
    bestROIProperty,
    bestCashFlowProperty,
    calculatedAt: new Date().toISOString(),
  };
}

// ============================================================================
// PROFIT & LOSS STATEMENT
// ============================================================================

/**
 * Generate complete P&L statement for a sold property
 */
export function generatePropertyProfitLoss(
  propertyId: string,
  propertyAddress: string,
  acquisitionDate: string,
  saleDate: string,
  generatedBy: string
): PropertyProfitLoss {
  const transactions = getTransactionsByProperty(propertyId);
  
  // ACQUISITION
  const purchasePrice = getTotalByType(propertyId, 'purchase_price');
  const acquisitionBreakdown = {
    purchasePrice,
    registrationFee: getTotalByType(propertyId, 'registration_fee'),
    stampDuty: getTotalByType(propertyId, 'stamp_duty'),
    legalFees: getTotalByType(propertyId, 'legal_fees'),
    brokerCommission: getTotalByType(propertyId, 'broker_commission'),
    renovation: getTotalByType(propertyId, 'renovation'),
    other: getTotalByType(propertyId, 'other_acquisition'),
  };
  
  const totalAcquisitionCost = Object.values(acquisitionBreakdown).reduce((a, b) => a + b, 0);
  
  // OPERATIONS
  const totalIncome = getTotalByCategory(propertyId, 'income');
  const totalExpenses = getTotalByCategory(propertyId, 'expense');
  const operatingProfit = totalIncome - totalExpenses;
  
  // Calculate operating period
  const startDate = new Date(acquisitionDate);
  const endDate = new Date(saleDate);
  const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const years = days / 365;
  
  // SALE
  const salePrice = getTotalByType(propertyId, 'sale_price');
  const saleCommission = getTotalByType(propertyId, 'sale_commission');
  const closingCosts = getTotalByType(propertyId, 'closing_costs');
  const saleExpenses = saleCommission + closingCosts;
  const netSaleProceeds = salePrice - saleExpenses;
  
  // PROFITABILITY
  const capitalGain = netSaleProceeds - totalAcquisitionCost;
  const totalProfit = capitalGain + operatingProfit;
  const totalROI = totalAcquisitionCost > 0 ? (totalProfit / totalAcquisitionCost) * 100 : 0;
  const annualizedROI = years > 0 ? totalROI / years : totalROI;
  
  return {
    propertyId,
    propertyAddress,
    acquisitionDate,
    totalAcquisitionCost,
    acquisitionBreakdown,
    operatingPeriod: {
      start: acquisitionDate,
      end: saleDate,
      days,
      years,
    },
    totalIncome,
    totalExpenses,
    operatingProfit,
    saleDate,
    salePrice,
    saleExpenses,
    netSaleProceeds,
    capitalGain,
    totalProfit,
    totalROI,
    annualizedROI,
    profitBreakdown: {
      fromCapitalGain: capitalGain,
      fromOperations: operatingProfit,
    },
    generatedAt: new Date().toISOString(),
    generatedBy,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate ROI percentage
 */
export function calculateROI(profit: number, investment: number): number {
  if (investment === 0) return 0;
  return (profit / investment) * 100;
}

/**
 * Calculate annualized ROI
 */
export function calculateAnnualizedROI(roi: number, years: number): number {
  if (years === 0) return roi;
  return roi / years;
}

/**
 * Calculate holding period in days
 */
export function calculateHoldingPeriod(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Calculate holding period in years
 */
export function calculateHoldingPeriodYears(startDate: string, endDate: string): number {
  const days = calculateHoldingPeriod(startDate, endDate);
  return days / 365;
}

/**
 * Format financial report as text
 */
export function formatProfitLossReport(pnl: PropertyProfitLoss): string {
  return `
PROFIT & LOSS STATEMENT
Property: ${pnl.propertyAddress}
Period: ${pnl.acquisitionDate} to ${pnl.saleDate} (${pnl.operatingPeriod.days} days)

ACQUISITION COSTS
Purchase Price:           ${pnl.acquisitionBreakdown.purchasePrice.toLocaleString()}
Registration Fee:         ${pnl.acquisitionBreakdown.registrationFee.toLocaleString()}
Stamp Duty:              ${pnl.acquisitionBreakdown.stampDuty.toLocaleString()}
Legal Fees:              ${pnl.acquisitionBreakdown.legalFees.toLocaleString()}
Broker Commission:        ${pnl.acquisitionBreakdown.brokerCommission.toLocaleString()}
Renovation:              ${pnl.acquisitionBreakdown.renovation.toLocaleString()}
Other:                   ${pnl.acquisitionBreakdown.other.toLocaleString()}
TOTAL ACQUISITION:        ${pnl.totalAcquisitionCost.toLocaleString()}

OPERATIONS
Total Income:            ${pnl.totalIncome.toLocaleString()}
Total Expenses:          ${pnl.totalExpenses.toLocaleString()}
OPERATING PROFIT:         ${pnl.operatingProfit.toLocaleString()}

SALE
Sale Price:              ${pnl.salePrice.toLocaleString()}
Sale Expenses:           ${pnl.saleExpenses.toLocaleString()}
NET SALE PROCEEDS:        ${pnl.netSaleProceeds.toLocaleString()}

PROFITABILITY
Capital Gain:            ${pnl.capitalGain.toLocaleString()}
Operating Profit:        ${pnl.operatingProfit.toLocaleString()}
TOTAL PROFIT:            ${pnl.totalProfit.toLocaleString()}
ROI:                     ${pnl.totalROI.toFixed(2)}%
Annualized ROI:          ${pnl.annualizedROI.toFixed(2)}%

Generated: ${new Date(pnl.generatedAt).toLocaleString()}
  `.trim();
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  calculatePropertyFinancials,
  calculatePortfolioFinancials,
  generatePropertyProfitLoss,
  calculateROI,
  calculateAnnualizedROI,
  calculateHoldingPeriod,
  calculateHoldingPeriodYears,
  formatProfitLossReport,
};
