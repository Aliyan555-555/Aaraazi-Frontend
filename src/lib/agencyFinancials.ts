/**
 * Agency Financials - Calculations (stub)
 * UI-only: no localStorage, return zeros/empty.
 */

// Types for stub return values (aligned with consumers)
interface PropertyFinancials {
  propertyId: string;
  propertyAddress: string;
  totalAcquisitionCost: number;
  purchasePrice: number;
  acquisitionExpenses: number;
  acquisitionBreakdown: Record<string, number>;
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  incomeBreakdown: Record<string, number>;
  expenseBreakdown: Record<string, number>;
  acquisitionDate: string;
  saleDate?: string;
  salePrice?: number;
  saleExpenses?: number;
  netSaleProceeds?: number;
  saleBreakdown?: Record<string, number>;
  capitalGain?: number;
  operatingProfit?: number;
  totalProfit?: number;
  roi?: number;
  annualizedROI?: number;
  holdingPeriod?: number;
  holdingPeriodYears?: number;
  status: 'active' | 'sold';
  lastCalculated: string;
  transactionCount: number;
}
interface AgencyPortfolioFinancials {
  totalInvested: number;
  currentPortfolioValue: number;
  totalRealizedGain: number;
  totalUnrealizedGain: number;
  totalROI: number;
  annualizedROI: number;
  activePropertyCount: number;
  soldPropertyCount: number;
  totalIncome: number;
  totalExpenses: number;
  netOperatingIncome: number;
  lastCalculated: string;
}
interface PropertyProfitLoss {
  propertyAddress: string;
  acquisitionDate: string;
  saleDate: string;
  totalAcquisitionCost: number;
  acquisitionBreakdown: Record<string, number>;
  totalIncome: number;
  totalExpenses: number;
  operatingProfit: number;
  salePrice: number;
  saleExpenses: number;
  saleBreakdown: Record<string, number>;
  netSaleProceeds: number;
  capitalGain: number;
  totalProfit: number;
  totalROI: number;
  annualizedROI: number;
  operatingPeriod: { days: number; years: number };
  generatedAt: string;
}

export function calculatePropertyFinancials(
  propertyId: string,
  propertyAddress: string,
  acquisitionDate: string,
  _currentValue?: number,
  _saleDate?: string
): PropertyFinancials {
  const zeroBreakdown = {
    registrationFee: 0,
    stampDuty: 0,
    legalFees: 0,
    brokerCommission: 0,
    renovation: 0,
    other: 0,
  };
  const incomeBreakdown = {
    rentalIncome: 0,
    parkingFee: 0,
    lateFee: 0,
    otherIncome: 0,
  };
  const expenseBreakdown = {
    propertyTax: 0,
    maintenance: 0,
    repairs: 0,
    utilities: 0,
    insurance: 0,
    managementFee: 0,
    marketing: 0,
    legalExpense: 0,
    otherExpense: 0,
  };
  return {
    propertyId,
    propertyAddress,
    totalAcquisitionCost: 0,
    purchasePrice: 0,
    acquisitionExpenses: 0,
    acquisitionBreakdown: zeroBreakdown,
    totalIncome: 0,
    totalExpenses: 0,
    netCashFlow: 0,
    incomeBreakdown,
    expenseBreakdown,
    acquisitionDate,
    status: 'active',
    lastCalculated: new Date().toISOString(),
    transactionCount: 0,
  };
}

export function calculatePortfolioFinancials(
  _properties: Array<{
    id: string;
    address: string;
    acquisitionDate: string;
    currentValue: number;
    status: 'active' | 'sold';
    saleDate?: string;
  }>
): AgencyPortfolioFinancials {
  return {
    totalInvested: 0,
    currentPortfolioValue: 0,
    totalRealizedGain: 0,
    totalUnrealizedGain: 0,
    totalROI: 0,
    annualizedROI: 0,
    activePropertyCount: 0,
    soldPropertyCount: 0,
    totalIncome: 0,
    totalExpenses: 0,
    netOperatingIncome: 0,
    lastCalculated: new Date().toISOString(),
  };
}

export function generatePropertyProfitLoss(
  _propertyId: string,
  _propertyAddress: string,
  _acquisitionDate: string,
  _saleDate: string
): PropertyProfitLoss {
  const zeroBreakdown = {
    purchasePrice: 0,
    registrationFee: 0,
    stampDuty: 0,
    legalFees: 0,
    brokerCommission: 0,
    renovation: 0,
    other: 0,
  };
  return {
    propertyAddress: '',
    acquisitionDate: '',
    saleDate: '',
    totalAcquisitionCost: 0,
    acquisitionBreakdown: zeroBreakdown,
    totalIncome: 0,
    totalExpenses: 0,
    operatingProfit: 0,
    salePrice: 0,
    saleExpenses: 0,
    saleBreakdown: { saleCommission: 0, closingCosts: 0 },
    netSaleProceeds: 0,
    capitalGain: 0,
    totalProfit: 0,
    totalROI: 0,
    annualizedROI: 0,
    operatingPeriod: { days: 0, years: 0 },
    generatedAt: new Date().toISOString(),
  };
}

export function calculateROI(_profit: number, _investment: number): number {
  return 0;
}

export function calculateAnnualizedROI(_roi: number, _years: number): number {
  return 0;
}

export function calculateHoldingPeriod(_startDate: string, _endDate: string): number {
  return 0;
}

export function calculateHoldingPeriodYears(_startDate: string, _endDate: string): number {
  return 0;
}

export function formatProfitLossReport(pnl: PropertyProfitLoss): string {
  return `Profit & Loss - ${pnl.propertyAddress} (stub)`;
}

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
