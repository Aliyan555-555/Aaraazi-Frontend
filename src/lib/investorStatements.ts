import { formatPKR } from './currency';

// Stubs for removed dependencies (helpers are dead code - only formatStatementAsText/exportStatementJSON are used)
function getSyndicateById(_id: string): any { return null; }
function getPropertyById(_id: string): any { return null; }
function getDistributionsForQuarter(_q: number, _y: number): any[] { return []; }

export interface InvestorStatement {
  id: string;
  investorId: string;
  investorName: string;
  syndicateId: string;
  propertyId: string;
  propertyTitle: string;
  period: {
    startDate: string;
    endDate: string;
    quarter: string;
    year: number;
  };
  ownership: {
    shares: number;
    totalShares: number;
    percentage: number;
    investmentAmount: number;
  };
  income: {
    rentalIncome: number;
    otherIncome: number;
    total: number;
    yourShare: number;
  };
  expenses: {
    management: number;
    maintenance: number;
    propertyTax: number;
    insurance: number;
    utilities: number;
    other: number;
    total: number;
    yourShare: number;
  };
  netIncome: {
    total: number;
    yourShare: number;
  };
  distributions: Array<{
    date: string;
    amount: number;
    method: string;
    reference: string;
  }>;
  valuation: {
    originalValue: number;
    currentValue: number;
    appreciation: number;
    appreciationPercent: number;
    yourEquity: number;
  };
  performance: {
    cashOnCashReturn: number;
    annualizedReturn: number;
    totalReturn: number;
    irr: number;
  };
  yearToDate: {
    totalDistributions: number;
    totalIncome: number;
    returnOnInvestment: number;
  };
  generatedAt: string;
  generatedBy: string;
}

/**
 * Generate quarterly investor statement
 */
export function generateInvestorStatement(
  investorId: string,
  syndicateId: string,
  quarter: number,
  year: number
): InvestorStatement {
  // Stub: return empty structure
  const startDate = `${year}-${String((quarter - 1) * 3 + 1).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(quarter * 3).padStart(2, '0')}-${new Date(year, quarter * 3, 0).getDate()}`;
  return {
    id: `stmt-${Date.now()}`,
    investorId,
    investorName: '',
    syndicateId,
    propertyId: '',
    propertyTitle: '',
    period: { startDate, endDate, quarter: `Q${quarter}`, year },
    ownership: { shares: 0, totalShares: 0, percentage: 0, investmentAmount: 0 },
    income: { rentalIncome: 0, otherIncome: 0, total: 0, yourShare: 0 },
    expenses: {
      management: 0,
      maintenance: 0,
      propertyTax: 0,
      insurance: 0,
      utilities: 0,
      other: 0,
      total: 0,
      yourShare: 0,
    },
    netIncome: { total: 0, yourShare: 0 },
    distributions: [],
    valuation: {
      originalValue: 0,
      currentValue: 0,
      appreciation: 0,
      appreciationPercent: 0,
      yourEquity: 0,
    },
    performance: {
      cashOnCashReturn: 0,
      annualizedReturn: 0,
      totalReturn: 0,
      irr: 0,
    },
    yearToDate: {
      totalDistributions: 0,
      totalIncome: 0,
      returnOnInvestment: 0,
    },
    generatedAt: new Date().toISOString(),
    generatedBy: '',
  };
}

/**
 * Generate statements for all investors in a syndicate (stub)
 */
export function generateAllStatements(
  _syndicateId: string,
  _quarter: number,
  _year: number
): InvestorStatement[] {
  return [];
}

/**
 * Export statement as formatted text
 */
export function formatStatementAsText(statement: InvestorStatement): string {
  return `
INVESTOR STATEMENT
================================================================================

INVESTOR INFORMATION
Name: ${statement.investorName}
Property: ${statement.propertyTitle}
Period: ${statement.period.quarter} ${statement.period.year}
Statement Date: ${new Date(statement.generatedAt).toLocaleDateString()}

OWNERSHIP DETAILS
Shares Owned: ${statement.ownership.shares} of ${statement.ownership.totalShares}
Ownership Percentage: ${statement.ownership.percentage.toFixed(2)}%
Investment Amount: ${formatPKR(statement.ownership.investmentAmount)}

INCOME (${statement.period.quarter} ${statement.period.year})
Rental Income:        ${formatPKR(statement.income.rentalIncome)}
Other Income:         ${formatPKR(statement.income.otherIncome)}
Total Income:         ${formatPKR(statement.income.total)}
Your Share:           ${formatPKR(statement.income.yourShare)}

EXPENSES (${statement.period.quarter} ${statement.period.year})
Management Fees:      ${formatPKR(statement.expenses.management)}
Maintenance:          ${formatPKR(statement.expenses.maintenance)}
Property Tax:         ${formatPKR(statement.expenses.propertyTax)}
Insurance:            ${formatPKR(statement.expenses.insurance)}
Utilities:            ${formatPKR(statement.expenses.utilities)}
Other:                ${formatPKR(statement.expenses.other)}
Total Expenses:       ${formatPKR(statement.expenses.total)}
Your Share:           ${formatPKR(statement.expenses.yourShare)}

NET INCOME
Total:                ${formatPKR(statement.netIncome.total)}
Your Share:           ${formatPKR(statement.netIncome.yourShare)}

DISTRIBUTIONS
${statement.distributions.map(d => 
  `${new Date(d.date).toLocaleDateString()}: ${formatPKR(d.amount)} (${d.method})`
).join('\n') || 'No distributions this period'}

PROPERTY VALUATION
Original Value:       ${formatPKR(statement.valuation.originalValue)}
Current Value:        ${formatPKR(statement.valuation.currentValue)}
Appreciation:         ${formatPKR(statement.valuation.appreciation)} (${statement.valuation.appreciationPercent.toFixed(2)}%)
Your Equity:          ${formatPKR(statement.valuation.yourEquity)}

PERFORMANCE METRICS
Cash-on-Cash Return:  ${statement.performance.cashOnCashReturn.toFixed(2)}%
Annualized Return:    ${statement.performance.annualizedReturn.toFixed(2)}%
Total Return:         ${statement.performance.totalReturn.toFixed(2)}%
IRR:                  ${statement.performance.irr.toFixed(2)}%

YEAR-TO-DATE SUMMARY (${statement.period.year})
Total Distributions:  ${formatPKR(statement.yearToDate.totalDistributions)}
Total Income:         ${formatPKR(statement.yearToDate.totalIncome)}
ROI:                  ${statement.yearToDate.returnOnInvestment.toFixed(2)}%

================================================================================
For questions, please contact your property manager.
  `.trim();
}

/**
 * Export statement as JSON for API/external systems
 */
export function exportStatementJSON(statement: InvestorStatement): string {
  return JSON.stringify(statement, null, 2);
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
  // For prototype, return estimated values based on property
  
  // Simplified: Assume 2% monthly rental yield
  const syndicate = getSyndicateById(syndicateId);
  if (!syndicate) {
    return {
      rentalIncome: 0,
      otherIncome: 0,
      total: 0
    };
  }
  
  const property = getPropertyById(syndicate.propertyId);
  if (!property) {
    return {
      rentalIncome: 0,
      otherIncome: 0,
      total: 0
    };
  }
  
  // Estimate: 2% of property value per month for 3 months (quarterly)
  const monthlyRental = (property.price || 0) * 0.02;
  const quarterlyRental = monthlyRental * 3;
  
  return {
    rentalIncome: quarterlyRental,
    otherIncome: 0,
    total: quarterlyRental
  };
}

function calculateExpensesForPeriod(syndicateId: string, period: any) {
  // In a real implementation, this would query expense transactions
  // For prototype, return estimated values
  
  const syndicate = getSyndicateById(syndicateId);
  if (!syndicate) {
    return {
      management: 0,
      maintenance: 0,
      propertyTax: 0,
      insurance: 0,
      utilities: 0,
      other: 0,
      total: 0
    };
  }
  
  const property = getPropertyById(syndicate.propertyId);
  if (!property) {
    return {
      management: 0,
      maintenance: 0,
      propertyTax: 0,
      insurance: 0,
      utilities: 0,
      other: 0,
      total: 0
    };
  }
  
  // Estimate: 0.5% of property value per month for expenses (quarterly)
  const monthlyExpenses = (property.price || 0) * 0.005;
  const quarterlyExpenses = monthlyExpenses * 3;
  
  // Break down by category (estimated percentages)
  const management = quarterlyExpenses * 0.30;
  const maintenance = quarterlyExpenses * 0.25;
  const propertyTax = quarterlyExpenses * 0.20;
  const insurance = quarterlyExpenses * 0.15;
  const utilities = quarterlyExpenses * 0.07;
  const other = quarterlyExpenses * 0.03;
  
  return {
    management,
    maintenance,
    propertyTax,
    insurance,
    utilities,
    other,
    total: quarterlyExpenses
  };
}

function getDistributionsForPeriod(investorId: string, syndicateId: string, period: any) {
  // Get quarterly distributions for this period
  const quarter = getQuarterFromDate(period.startDate);
  const year = new Date(period.startDate).getFullYear();
  
  const distributions = getDistributionsForQuarter(quarter, year);
  const syndicateDistribution = distributions.find(d => d.syndicateId === syndicateId);
  
  if (!syndicateDistribution) {
    return [];
  }
  
  // Find this investor's distribution
  const investorDist = syndicateDistribution.distributions.find(d => d.investorId === investorId);
  
  if (!investorDist) {
    return [];
  }
  
  return [{
    date: investorDist.paymentDate || syndicateDistribution.createdAt,
    amount: investorDist.distributionAmount,
    method: investorDist.paymentMethod || 'Bank Transfer',
    reference: investorDist.paymentReference || `Q${quarter}-${year}`
  }];
}

function getQuarterFromDate(dateString: string): number {
  const date = new Date(dateString);
  const month = date.getMonth() + 1; // 1-12
  if (month <= 3) return 1;
  if (month <= 6) return 2;
  if (month <= 9) return 3;
  return 4;
}

function calculateValuation(syndicate: any, property: any, investor: any) {
  const currentValue = property.currentValue || property.price || 0;
  const originalValue = syndicate.totalInvestment || currentValue;
  const appreciation = currentValue - originalValue;
  const ownershipPercent = investor.shares / syndicate.totalShares;
  
  return {
    originalValue,
    currentValue,
    appreciation,
    appreciationPercent: originalValue > 0 ? (appreciation / originalValue) * 100 : 0,
    yourEquity: currentValue * ownershipPercent
  };
}

function calculatePerformance(investment: number, equity: number, distributions: any[], period: any) {
  const totalDistributions = distributions.reduce((sum, d) => sum + d.amount, 0);
  
  // Cash-on-cash return (distributions / investment)
  const cashOnCash = investment > 0 ? (totalDistributions / investment) * 100 : 0;
  
  // Annualized return (quarterly to annual)
  const annualizedReturn = cashOnCash * 4;
  
  // Total return ((equity + distributions - investment) / investment)
  const totalReturn = investment > 0 ? ((equity + totalDistributions - investment) / investment) * 100 : 0;
  
  // Simplified IRR (same as total return for prototype)
  const irr = totalReturn;
  
  return {
    cashOnCashReturn: cashOnCash,
    annualizedReturn,
    totalReturn,
    irr
  };
}

function calculateYearToDate(investorId: string, syndicateId: string, year: number) {
  // Get all quarterly distributions for this year
  const q1Dist = getDistributionsForQuarter(1, year);
  const q2Dist = getDistributionsForQuarter(2, year);
  const q3Dist = getDistributionsForQuarter(3, year);
  const q4Dist = getDistributionsForQuarter(4, year);
  
  const allDistributions = [...q1Dist, ...q2Dist, ...q3Dist, ...q4Dist];
  const syndicateDistributions = allDistributions.filter(d => d.syndicateId === syndicateId);
  
  // Calculate total distributions for this investor
  let totalDistributions = 0;
  let totalIncome = 0;
  
  syndicateDistributions.forEach(dist => {
    const investorDist = dist.distributions.find(d => d.investorId === investorId);
    if (investorDist && investorDist.status === 'paid') {
      totalDistributions += investorDist.distributionAmount;
    }
    totalIncome += dist.totalIncome;
  });
  
  const syndicate = getSyndicateById(syndicateId);
  const investor = syndicate?.investors?.find((i: { contactId: string }) => i.contactId === investorId);
  const investmentAmount = investor?.investmentAmount || 0;
  
  return {
    totalDistributions,
    totalIncome: totalIncome * (investor ? investor.shares / syndicate!.totalShares : 0),
    returnOnInvestment: investmentAmount > 0 ? 
      (totalDistributions / investmentAmount) * 100 : 0
  };
}
