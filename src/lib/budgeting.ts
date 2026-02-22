import { Property, Lead } from '../types';
import { getProperties } from './data';
import { getLeads } from './data';

/**
 * Budgeting & Cash Flow Management
 * Financial planning and forecasting for agency operations
 */

export interface MonthlyBudget {
  id: string;
  month: string; // YYYY-MM format
  category: 'marketing' | 'operations' | 'salaries' | 'office' | 'technology' | 'other';
  budgeted: number;
  actual: number;
  variance: number;
  variancePercentage: number;
  notes?: string;
}

export interface BudgetSummary {
  month: string;
  totalBudgeted: number;
  totalActual: number;
  totalVariance: number;
  categories: MonthlyBudget[];
  overBudget: boolean;
}

export interface CashFlowProjection {
  month: string;
  expectedRevenue: number;
  expectedExpenses: number;
  netCashFlow: number;
  cumulativeCashFlow: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface RevenueProjection {
  month: string;
  projectedCommissions: number;
  expectedClosings: number;
  averageDealSize: number;
  sources: {
    activeListings: number;
    pipelineDeals: number;
    newProspects: number;
  };
}

export interface ExpenseBreakdown {
  month: string;
  categories: {
    marketing: number;
    operations: number;
    salaries: number;
    office: number;
    technology: number;
    other: number;
  };
  total: number;
}

// ============================================================================
// BUDGET MANAGEMENT
// ============================================================================

/**
 * Create monthly budget
 */
export function createMonthlyBudget(
  month: string,
  category: MonthlyBudget['category'],
  budgeted: number,
  notes?: string
): MonthlyBudget {
  return {
    id: `budget-${month}-${category}-${Date.now()}`,
    month,
    category,
    budgeted,
    actual: 0,
    variance: -budgeted,
    variancePercentage: -100,
    notes
  };
}

/**
 * Update actual spending
 */
export function updateActualSpending(
  budget: MonthlyBudget,
  actual: number
): MonthlyBudget {
  const variance = actual - budget.budgeted;
  const variancePercentage = budget.budgeted > 0 
    ? (variance / budget.budgeted) * 100 
    : 0;

  return {
    ...budget,
    actual,
    variance,
    variancePercentage
  };
}

/**
 * Get budget summary for a month
 */
export function getBudgetSummary(budgets: MonthlyBudget[], month: string): BudgetSummary {
  const monthBudgets = budgets.filter(b => b.month === month);

  const totalBudgeted = monthBudgets.reduce((sum, b) => sum + b.budgeted, 0);
  const totalActual = monthBudgets.reduce((sum, b) => sum + b.actual, 0);
  const totalVariance = totalActual - totalBudgeted;

  return {
    month,
    totalBudgeted,
    totalActual,
    totalVariance,
    categories: monthBudgets,
    overBudget: totalVariance > 0
  };
}

/**
 * Get budget vs actual comparison for multiple months
 */
export function getBudgetComparison(
  budgets: MonthlyBudget[],
  months: number = 6
): Array<{
  month: string;
  budgeted: number;
  actual: number;
  variance: number;
}> {
  const today = new Date();
  const monthlyData: { [key: string]: { budgeted: number; actual: number } } = {};

  // Initialize last N months
  for (let i = 0; i < months; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthKey = date.toISOString().slice(0, 7);
    monthlyData[monthKey] = { budgeted: 0, actual: 0 };
  }

  // Aggregate budgets
  budgets.forEach(budget => {
    if (monthlyData[budget.month]) {
      monthlyData[budget.month].budgeted += budget.budgeted;
      monthlyData[budget.month].actual += budget.actual;
    }
  });

  // Convert to array
  return Object.entries(monthlyData)
    .map(([month, data]) => ({
      month,
      budgeted: data.budgeted,
      actual: data.actual,
      variance: data.actual - data.budgeted
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Get expense breakdown by category
 */
export function getExpenseBreakdown(budgets: MonthlyBudget[], month: string): ExpenseBreakdown {
  const monthBudgets = budgets.filter(b => b.month === month);

  const categories = {
    marketing: 0,
    operations: 0,
    salaries: 0,
    office: 0,
    technology: 0,
    other: 0
  };

  monthBudgets.forEach(budget => {
    categories[budget.category] += budget.actual;
  });

  const total = Object.values(categories).reduce((sum, val) => sum + val, 0);

  return {
    month,
    categories,
    total
  };
}

// ============================================================================
// CASH FLOW PROJECTION
// ============================================================================

/**
 * Project cash flow for next N months
 */
export function projectCashFlow(
  months: number = 6,
  currentCash: number = 0
): CashFlowProjection[] {
  const projections: CashFlowProjection[] = [];
  let cumulativeCash = currentCash;

  const today = new Date();

  for (let i = 0; i < months; i++) {
    const projectionDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const monthKey = projectionDate.toISOString().slice(0, 7);

    const revenueProjection = projectRevenue(monthKey);
    const expenseProjection = projectExpenses(monthKey);

    const netCashFlow = revenueProjection.projectedCommissions - expenseProjection.total;
    cumulativeCash += netCashFlow;

    const confidence = getProjectionConfidence(i);

    projections.push({
      month: monthKey,
      expectedRevenue: revenueProjection.projectedCommissions,
      expectedExpenses: expenseProjection.total,
      netCashFlow,
      cumulativeCashFlow: cumulativeCash,
      confidence
    });
  }

  return projections;
}

/**
 * Project revenue for a month
 */
export function projectRevenue(month: string): RevenueProjection {
  const allProperties = getProperties();
  const allLeads = getLeads();

  // Active listings that might close
  const activeListings = allProperties.filter((p: Property) => 
    p.status === 'available' && p.isPublished
  );

  // Calculate average commission rate
  const avgCommissionRate = 0.02; // 2% default

  // Estimate conversion rate (10% monthly for active listings)
  const conversionRate = 0.10;
  const expectedClosings = Math.round(activeListings.length * conversionRate);

  // Calculate average deal size
  const averageDealSize = activeListings.length > 0
    ? activeListings.reduce((sum: number, p: Property) => sum + (p.price || 0), 0) / activeListings.length
    : 0;

  // Calculate projected commissions
  const activeListingsRevenue = averageDealSize * expectedClosings * avgCommissionRate;

  // Pipeline deals (from qualified and negotiation stage leads)
  const pipelineLeads = allLeads.filter((l: Lead) => 
    l.status === 'qualified' || l.status === 'negotiation'
  );
  const pipelineRevenue = pipelineLeads.length * averageDealSize * avgCommissionRate * 0.3; // 30% close rate

  // New prospects (from new and contacted leads)
  const newProspects = allLeads.filter((l: Lead) => 
    l.status === 'new' || l.status === 'contacted'
  );
  const prospectsRevenue = newProspects.length * averageDealSize * avgCommissionRate * 0.05; // 5% close rate

  const projectedCommissions = Math.round(
    activeListingsRevenue + pipelineRevenue + prospectsRevenue
  );

  return {
    month,
    projectedCommissions,
    expectedClosings,
    averageDealSize: Math.round(averageDealSize),
    sources: {
      activeListings: Math.round(activeListingsRevenue),
      pipelineDeals: Math.round(pipelineRevenue),
      newProspects: Math.round(prospectsRevenue)
    }
  };
}

/**
 * Project expenses for a month
 */
export function projectExpenses(month: string): ExpenseBreakdown {
  // Use historical average or default estimates
  const defaultExpenses = {
    marketing: 50000, // PKR 50k for marketing
    operations: 30000, // PKR 30k for operations
    salaries: 200000, // PKR 200k for salaries
    office: 40000, // PKR 40k for office rent/utilities
    technology: 20000, // PKR 20k for software/tools
    other: 10000 // PKR 10k miscellaneous
  };

  const total = Object.values(defaultExpenses).reduce((sum, val) => sum + val, 0);

  return {
    month,
    categories: defaultExpenses,
    total
  };
}

/**
 * Get projection confidence based on time horizon
 */
function getProjectionConfidence(monthsAhead: number): 'high' | 'medium' | 'low' {
  if (monthsAhead <= 1) return 'high';
  if (monthsAhead <= 3) return 'medium';
  return 'low';
}

/**
 * Get cash flow health status
 */
export function getCashFlowHealth(projections: CashFlowProjection[]): {
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  recommendation: string;
} {
  const threeMonthProjection = projections.slice(0, 3);
  const negativeCashFlowMonths = threeMonthProjection.filter(p => p.netCashFlow < 0).length;
  const endingCash = threeMonthProjection[threeMonthProjection.length - 1]?.cumulativeCashFlow || 0;

  if (negativeCashFlowMonths === 0 && endingCash > 0) {
    return {
      status: 'healthy',
      message: 'Cash flow is positive for the next 3 months',
      recommendation: 'Consider investing in growth opportunities'
    };
  } else if (negativeCashFlowMonths <= 1 || endingCash > 0) {
    return {
      status: 'warning',
      message: 'Some months show negative cash flow',
      recommendation: 'Monitor expenses and accelerate collections'
    };
  } else {
    return {
      status: 'critical',
      message: 'Multiple months with negative cash flow',
      recommendation: 'Reduce expenses immediately and focus on closing deals'
    };
  }
}

// ============================================================================
// FINANCIAL METRICS
// ============================================================================

/**
 * Calculate break-even point
 */
export function calculateBreakEven(
  fixedCosts: number,
  averageCommissionPerDeal: number
): {
  dealsNeeded: number;
  revenueNeeded: number;
  monthsToBreakEven: number;
} {
  const dealsNeeded = Math.ceil(fixedCosts / averageCommissionPerDeal);
  const revenueNeeded = dealsNeeded * averageCommissionPerDeal;
  
  // Assuming average 1 deal per week
  const dealsPerMonth = 4;
  const monthsToBreakEven = Math.ceil(dealsNeeded / dealsPerMonth);

  return {
    dealsNeeded,
    revenueNeeded,
    monthsToBreakEven
  };
}

/**
 * Calculate return on marketing investment
 */
export function calculateROI(
  marketingSpend: number,
  revenueGenerated: number
): {
  roi: number;
  roiPercentage: number;
  profit: number;
} {
  const profit = revenueGenerated - marketingSpend;
  const roi = marketingSpend > 0 ? profit / marketingSpend : 0;
  const roiPercentage = roi * 100;

  return {
    roi,
    roiPercentage,
    profit
  };
}

/**
 * Calculate revenue per agent
 */
export function calculateRevenuePerAgent(
  totalRevenue: number,
  numberOfAgents: number
): {
  revenuePerAgent: number;
  dailyRevenuePerAgent: number;
  monthlyTarget: number;
} {
  const revenuePerAgent = numberOfAgents > 0 ? totalRevenue / numberOfAgents : 0;
  const dailyRevenuePerAgent = revenuePerAgent / 30; // Average days in month
  const monthlyTarget = revenuePerAgent * 1.2; // 20% growth target

  return {
    revenuePerAgent: Math.round(revenuePerAgent),
    dailyRevenuePerAgent: Math.round(dailyRevenuePerAgent),
    monthlyTarget: Math.round(monthlyTarget)
  };
}

/**
 * Get financial summary
 */
export function getFinancialSummary(
  budgets: MonthlyBudget[],
  projections: CashFlowProjection[]
): {
  currentMonth: BudgetSummary;
  nextThreeMonths: CashFlowProjection[];
  cashFlowHealth: ReturnType<typeof getCashFlowHealth>;
  budgetUtilization: number;
  projectedProfit: number;
} {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const budgetSummary = getBudgetSummary(budgets, currentMonth);
  const nextThreeMonths = projections.slice(0, 3);
  const cashFlowHealth = getCashFlowHealth(projections);

  const budgetUtilization = budgetSummary.totalBudgeted > 0
    ? (budgetSummary.totalActual / budgetSummary.totalBudgeted) * 100
    : 0;

  const projectedProfit = nextThreeMonths.reduce((sum, p) => sum + p.netCashFlow, 0);

  return {
    currentMonth: budgetSummary,
    nextThreeMonths,
    cashFlowHealth,
    budgetUtilization,
    projectedProfit
  };
}



export function saveBudgets(_budgets: MonthlyBudget[]): void {
  // no-op (stub)
}

export function loadBudgets(): MonthlyBudget[] {
  return [];
}
