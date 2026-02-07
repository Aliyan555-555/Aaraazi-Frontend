/**
 * Commission Reporting & Analytics Functions
 * Comprehensive reporting tools for commission analysis
 */

import { Property, Lead, Commission } from '../types';

// ============================================================================
// COMMISSION REPORTING INTERFACES
// ============================================================================

export interface CommissionReport {
  period: string;
  startDate: string;
  endDate: string;
  totalCommissions: number;
  paidCommissions: number;
  pendingCommissions: number;
  overdueCommissions: number;
  totalCount: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
  averageCommission: number;
  averageRate: number;
  topAgents: Array<{
    agentId: string;
    agentName: string;
    totalCommissions: number;
    count: number;
    averageRate: number;
  }>;
  byPropertyType: Array<{
    type: string;
    totalCommissions: number;
    count: number;
    averageCommission: number;
  }>;
  byStatus: Array<{
    status: string;
    amount: number;
    count: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    total: number;
    paid: number;
    pending: number;
    count: number;
  }>;
}

export interface AgentPerformanceMetrics {
  agentId: string;
  agentName: string;
  period: string;
  totalCommissions: number;
  paidCommissions: number;
  pendingCommissions: number;
  commissionCount: number;
  propertiesSold: number;
  averageCommissionRate: number;
  averageCommissionAmount: number;
  conversionRate: number;
  totalSalesValue: number;
  rank: number;
  percentOfTotal: number;
  topProperties: Array<{
    propertyId: string;
    propertyTitle: string;
    commission: number;
    date: string;
  }>;
  monthlyBreakdown: Array<{
    month: string;
    commissions: number;
    count: number;
  }>;
}

// ============================================================================
// COMMISSION REPORTING FUNCTIONS
// ============================================================================

/**
 * Generate comprehensive commission report
 */
export function generateCommissionReport(
  startDate: string,
  endDate: string,
  agentId?: string,
  userRole?: string
): CommissionReport {
  try {
    const stored = localStorage.getItem('estate_commissions');
    const allCommissions: Commission[] = stored ? JSON.parse(stored) : [];
    
    // Filter by date range
    let commissions = allCommissions.filter(c => {
      const createdDate = new Date(c.createdAt);
      return createdDate >= new Date(startDate) && createdDate <= new Date(endDate);
    });
    
    // Filter by agent if not admin
    if (userRole !== 'admin' && agentId) {
      commissions = commissions.filter(c => c.agentId === agentId);
    }
    
    // Calculate totals
    const totalCommissions = commissions.reduce((sum, c) => sum + c.amount, 0);
    const paidCommissions = commissions
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + c.amount, 0);
    const pendingCommissions = commissions
      .filter(c => c.status === 'pending')
      .reduce((sum, c) => sum + c.amount, 0);
    const overdueCommissions = commissions
      .filter(c => c.isOverdue)
      .reduce((sum, c) => sum + c.amount, 0);
    
    // Calculate counts
    const totalCount = commissions.length;
    const paidCount = commissions.filter(c => c.status === 'paid').length;
    const pendingCount = commissions.filter(c => c.status === 'pending').length;
    const overdueCount = commissions.filter(c => c.isOverdue).length;
    
    // Calculate averages
    const averageCommission = totalCount > 0 ? totalCommissions / totalCount : 0;
    const averageRate = totalCount > 0 
      ? commissions.reduce((sum, c) => sum + c.rate, 0) / totalCount 
      : 0;
    
    // Top agents
    const agentStats = new Map<string, { 
      agentId: string; 
      agentName: string; 
      total: number; 
      count: number; 
      rates: number[] 
    }>();
    
    commissions.forEach(c => {
      if (!agentStats.has(c.agentId)) {
        agentStats.set(c.agentId, {
          agentId: c.agentId,
          agentName: c.agentName,
          total: 0,
          count: 0,
          rates: []
        });
      }
      const stats = agentStats.get(c.agentId)!;
      stats.total += c.amount;
      stats.count += 1;
      stats.rates.push(c.rate);
    });
    
    const topAgents = Array.from(agentStats.values())
      .map(s => ({
        agentId: s.agentId,
        agentName: s.agentName,
        totalCommissions: s.total,
        count: s.count,
        averageRate: s.rates.reduce((sum, r) => sum + r, 0) / s.rates.length
      }))
      .sort((a, b) => b.totalCommissions - a.totalCommissions)
      .slice(0, 10);
    
    // By property type (need to get properties)
    const propertiesStored = localStorage.getItem('estate_properties');
    const properties: Property[] = propertiesStored ? JSON.parse(propertiesStored) : [];
    
    const typeStats = new Map<string, { total: number; count: number }>();
    commissions.forEach(c => {
      const property = properties.find(p => p.id === c.propertyId);
      const type = property?.type || 'Unknown';
      
      if (!typeStats.has(type)) {
        typeStats.set(type, { total: 0, count: 0 });
      }
      const stats = typeStats.get(type)!;
      stats.total += c.amount;
      stats.count += 1;
    });
    
    const byPropertyType = Array.from(typeStats.entries())
      .map(([type, stats]) => ({
        type,
        totalCommissions: stats.total,
        count: stats.count,
        averageCommission: stats.total / stats.count
      }))
      .sort((a, b) => b.totalCommissions - a.totalCommissions);
    
    // By status
    const statusStats = new Map<string, { amount: number; count: number }>();
    commissions.forEach(c => {
      if (!statusStats.has(c.status)) {
        statusStats.set(c.status, { amount: 0, count: 0 });
      }
      const stats = statusStats.get(c.status)!;
      stats.amount += c.amount;
      stats.count += 1;
    });
    
    const byStatus = Array.from(statusStats.entries()).map(([status, stats]) => ({
      status,
      amount: stats.amount,
      count: stats.count
    }));
    
    // Monthly trend
    const monthStats = new Map<string, { 
      total: number; 
      paid: number; 
      pending: number; 
      count: number 
    }>();
    
    commissions.forEach(c => {
      const date = new Date(c.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthStats.has(monthKey)) {
        monthStats.set(monthKey, { total: 0, paid: 0, pending: 0, count: 0 });
      }
      const stats = monthStats.get(monthKey)!;
      stats.total += c.amount;
      stats.count += 1;
      
      if (c.status === 'paid') {
        stats.paid += c.amount;
      } else if (c.status === 'pending') {
        stats.pending += c.amount;
      }
    });
    
    const monthlyTrend = Array.from(monthStats.entries())
      .map(([month, stats]) => ({
        month,
        total: stats.total,
        paid: stats.paid,
        pending: stats.pending,
        count: stats.count
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
    
    return {
      period: `${startDate} to ${endDate}`,
      startDate,
      endDate,
      totalCommissions,
      paidCommissions,
      pendingCommissions,
      overdueCommissions,
      totalCount,
      paidCount,
      pendingCount,
      overdueCount,
      averageCommission,
      averageRate,
      topAgents,
      byPropertyType,
      byStatus,
      monthlyTrend
    };
  } catch (error) {
    console.error('Error generating commission report:', error);
    return {
      period: `${startDate} to ${endDate}`,
      startDate,
      endDate,
      totalCommissions: 0,
      paidCommissions: 0,
      pendingCommissions: 0,
      overdueCommissions: 0,
      totalCount: 0,
      paidCount: 0,
      pendingCount: 0,
      overdueCount: 0,
      averageCommission: 0,
      averageRate: 0,
      topAgents: [],
      byPropertyType: [],
      byStatus: [],
      monthlyTrend: []
    };
  }
}

/**
 * Get agent performance metrics
 */
export function getAgentPerformanceMetrics(
  agentId: string,
  startDate: string,
  endDate: string
): AgentPerformanceMetrics {
  try {
    const commissionsStored = localStorage.getItem('estate_commissions');
    const allCommissions: Commission[] = commissionsStored ? JSON.parse(commissionsStored) : [];
    
    // Filter by agent and date range
    const commissions = allCommissions.filter(c => {
      const createdDate = new Date(c.createdAt);
      return c.agentId === agentId && 
             createdDate >= new Date(startDate) && 
             createdDate <= new Date(endDate);
    });
    
    if (commissions.length === 0) {
      return {
        agentId,
        agentName: '',
        period: `${startDate} to ${endDate}`,
        totalCommissions: 0,
        paidCommissions: 0,
        pendingCommissions: 0,
        commissionCount: 0,
        propertiesSold: 0,
        averageCommissionRate: 0,
        averageCommissionAmount: 0,
        conversionRate: 0,
        totalSalesValue: 0,
        rank: 0,
        percentOfTotal: 0,
        topProperties: [],
        monthlyBreakdown: []
      };
    }
    
    const agentName = commissions[0].agentName;
    
    // Calculate totals
    const totalCommissions = commissions.reduce((sum, c) => sum + c.amount, 0);
    const paidCommissions = commissions
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + c.amount, 0);
    const pendingCommissions = commissions
      .filter(c => c.status === 'pending')
      .reduce((sum, c) => sum + c.amount, 0);
    
    const commissionCount = commissions.length;
    const propertiesSold = new Set(commissions.map(c => c.propertyId)).size;
    
    // Calculate averages
    const averageCommissionRate = commissions.reduce((sum, c) => sum + c.rate, 0) / commissionCount;
    const averageCommissionAmount = totalCommissions / commissionCount;
    
    // Calculate conversion rate (need leads)
    const leadsStored = localStorage.getItem('estate_leads');
    const allLeads: Lead[] = leadsStored ? JSON.parse(leadsStored) : [];
    const agentLeads = allLeads.filter(l => {
      const createdDate = new Date(l.createdAt);
      return l.agentId === agentId && 
             createdDate >= new Date(startDate) && 
             createdDate <= new Date(endDate);
    });
    const convertedLeads = agentLeads.filter(l => l.status === 'converted').length;
    const conversionRate = agentLeads.length > 0 
      ? (convertedLeads / agentLeads.length) * 100 
      : 0;
    
    // Calculate total sales value (commission / rate)
    const totalSalesValue = commissions.reduce((sum, c) => {
      return sum + (c.amount / (c.rate / 100));
    }, 0);
    
    // Calculate rank (compare with other agents)
    const allAgentTotals = new Map<string, number>();
    allCommissions
      .filter(c => {
        const createdDate = new Date(c.createdAt);
        return createdDate >= new Date(startDate) && createdDate <= new Date(endDate);
      })
      .forEach(c => {
        allAgentTotals.set(c.agentId, (allAgentTotals.get(c.agentId) || 0) + c.amount);
      });
    
    const sortedAgents = Array.from(allAgentTotals.entries())
      .sort((a, b) => b[1] - a[1]);
    const rank = sortedAgents.findIndex(([id]) => id === agentId) + 1;
    
    const totalAllCommissions = Array.from(allAgentTotals.values()).reduce((sum, v) => sum + v, 0);
    const percentOfTotal = totalAllCommissions > 0 
      ? (totalCommissions / totalAllCommissions) * 100 
      : 0;
    
    // Top properties
    const propertiesStored = localStorage.getItem('estate_properties');
    const properties: Property[] = propertiesStored ? JSON.parse(propertiesStored) : [];
    
    const topProperties = commissions
      .map(c => {
        const property = properties.find(p => p.id === c.propertyId);
        return {
          propertyId: c.propertyId,
          propertyTitle: property?.title || c.propertyTitle,
          commission: c.amount,
          date: c.createdAt
        };
      })
      .sort((a, b) => b.commission - a.commission)
      .slice(0, 5);
    
    // Monthly breakdown
    const monthStats = new Map<string, { commissions: number; count: number }>();
    commissions.forEach(c => {
      const date = new Date(c.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthStats.has(monthKey)) {
        monthStats.set(monthKey, { commissions: 0, count: 0 });
      }
      const stats = monthStats.get(monthKey)!;
      stats.commissions += c.amount;
      stats.count += 1;
    });
    
    const monthlyBreakdown = Array.from(monthStats.entries())
      .map(([month, stats]) => ({
        month,
        commissions: stats.commissions,
        count: stats.count
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
    
    return {
      agentId,
      agentName,
      period: `${startDate} to ${endDate}`,
      totalCommissions,
      paidCommissions,
      pendingCommissions,
      commissionCount,
      propertiesSold,
      averageCommissionRate,
      averageCommissionAmount,
      conversionRate,
      totalSalesValue,
      rank,
      percentOfTotal,
      topProperties,
      monthlyBreakdown
    };
  } catch (error) {
    console.error('Error getting agent performance metrics:', error);
    return {
      agentId,
      agentName: '',
      period: `${startDate} to ${endDate}`,
      totalCommissions: 0,
      paidCommissions: 0,
      pendingCommissions: 0,
      commissionCount: 0,
      propertiesSold: 0,
      averageCommissionRate: 0,
      averageCommissionAmount: 0,
      conversionRate: 0,
      totalSalesValue: 0,
      rank: 0,
      percentOfTotal: 0,
      topProperties: [],
      monthlyBreakdown: []
    };
  }
}

/**
 * Compare multiple agents
 */
export function compareAgents(
  agentIds: string[],
  startDate: string,
  endDate: string
): AgentPerformanceMetrics[] {
  return agentIds.map(agentId => 
    getAgentPerformanceMetrics(agentId, startDate, endDate)
  ).sort((a, b) => b.totalCommissions - a.totalCommissions);
}

/**
 * Get commission forecast based on historical data
 */
export function getCommissionForecast(
  agentId?: string,
  userRole?: string
): {
  currentMonth: number;
  projectedMonth: number;
  currentQuarter: number;
  projectedQuarter: number;
  currentYear: number;
  projectedYear: number;
  confidence: 'high' | 'medium' | 'low';
} {
  try {
    const stored = localStorage.getItem('estate_commissions');
    const allCommissions: Commission[] = stored ? JSON.parse(stored) : [];
    
    let commissions = allCommissions;
    if (userRole !== 'admin' && agentId) {
      commissions = commissions.filter(c => c.agentId === agentId);
    }
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentQuarter = Math.floor(currentMonth / 3);
    
    // Current month commissions
    const currentMonthCommissions = commissions.filter(c => {
      const date = new Date(c.createdAt);
      return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
    }).reduce((sum, c) => sum + c.amount, 0);
    
    // Previous months average (last 3 months excluding current)
    const last3MonthsTotal = commissions.filter(c => {
      const date = new Date(c.createdAt);
      const monthsAgo = (currentYear - date.getFullYear()) * 12 + (currentMonth - date.getMonth());
      return monthsAgo > 0 && monthsAgo <= 3;
    }).reduce((sum, c) => sum + c.amount, 0);
    
    const averageMonthly = last3MonthsTotal / 3;
    
    // Project current month (assume linear progression through month)
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const progressThroughMonth = dayOfMonth / daysInMonth;
    const projectedMonth = progressThroughMonth > 0 
      ? currentMonthCommissions / progressThroughMonth 
      : averageMonthly;
    
    // Current quarter
    const quarterStartMonth = currentQuarter * 3;
    const currentQuarterCommissions = commissions.filter(c => {
      const date = new Date(c.createdAt);
      return date.getFullYear() === currentYear && 
             date.getMonth() >= quarterStartMonth && 
             date.getMonth() <= currentMonth;
    }).reduce((sum, c) => sum + c.amount, 0);
    
    // Project quarter
    const monthsIntoQuarter = (currentMonth - quarterStartMonth) + 1;
    const projectedQuarter = (currentQuarterCommissions / monthsIntoQuarter) * 3;
    
    // Current year
    const currentYearCommissions = commissions.filter(c => {
      const date = new Date(c.createdAt);
      return date.getFullYear() === currentYear;
    }).reduce((sum, c) => sum + c.amount, 0);
    
    // Project year
    const monthsIntoYear = currentMonth + 1;
    const projectedYear = (currentYearCommissions / monthsIntoYear) * 12;
    
    // Determine confidence based on data availability
    const dataPoints = commissions.length;
    const confidence: 'high' | 'medium' | 'low' = 
      dataPoints > 50 ? 'high' : 
      dataPoints > 20 ? 'medium' : 'low';
    
    return {
      currentMonth: currentMonthCommissions,
      projectedMonth,
      currentQuarter: currentQuarterCommissions,
      projectedQuarter,
      currentYear: currentYearCommissions,
      projectedYear,
      confidence
    };
  } catch (error) {
    console.error('Error getting commission forecast:', error);
    return {
      currentMonth: 0,
      projectedMonth: 0,
      currentQuarter: 0,
      projectedQuarter: 0,
      currentYear: 0,
      projectedYear: 0,
      confidence: 'low'
    };
  }
}

/**
 * Get commission distribution analysis
 */
export function getCommissionDistribution(
  startDate: string,
  endDate: string,
  agentId?: string,
  userRole?: string
): {
  ranges: Array<{
    range: string;
    count: number;
    totalAmount: number;
    percentage: number;
  }>;
  median: number;
  mean: number;
  mode: number;
  standardDeviation: number;
} {
  try {
    const stored = localStorage.getItem('estate_commissions');
    const allCommissions: Commission[] = stored ? JSON.parse(stored) : [];
    
    let commissions = allCommissions.filter(c => {
      const createdDate = new Date(c.createdAt);
      return createdDate >= new Date(startDate) && createdDate <= new Date(endDate);
    });
    
    if (userRole !== 'admin' && agentId) {
      commissions = commissions.filter(c => c.agentId === agentId);
    }
    
    if (commissions.length === 0) {
      return {
        ranges: [],
        median: 0,
        mean: 0,
        mode: 0,
        standardDeviation: 0
      };
    }
    
    // Define ranges (PKR)
    const rangeDefinitions = [
      { min: 0, max: 50000, label: '< 50K' },
      { min: 50000, max: 100000, label: '50K - 100K' },
      { min: 100000, max: 250000, label: '100K - 250K' },
      { min: 250000, max: 500000, label: '250K - 500K' },
      { min: 500000, max: 1000000, label: '500K - 1M' },
      { min: 1000000, max: Infinity, label: '> 1M' }
    ];
    
    const totalAmount = commissions.reduce((sum, c) => sum + c.amount, 0);
    
    const ranges = rangeDefinitions.map(def => {
      const inRange = commissions.filter(c => c.amount >= def.min && c.amount < def.max);
      const rangeTotal = inRange.reduce((sum, c) => sum + c.amount, 0);
      
      return {
        range: def.label,
        count: inRange.length,
        totalAmount: rangeTotal,
        percentage: totalAmount > 0 ? (rangeTotal / totalAmount) * 100 : 0
      };
    });
    
    // Calculate statistics
    const amounts = commissions.map(c => c.amount).sort((a, b) => a - b);
    
    // Mean
    const mean = totalAmount / commissions.length;
    
    // Median
    const mid = Math.floor(amounts.length / 2);
    const median = amounts.length % 2 === 0 
      ? (amounts[mid - 1] + amounts[mid]) / 2 
      : amounts[mid];
    
    // Mode (most common amount range)
    const mode = ranges.reduce((max, r) => r.count > max.count ? r : max, ranges[0]).totalAmount / 
                 (ranges.reduce((max, r) => r.count > max.count ? r : max, ranges[0]).count || 1);
    
    // Standard deviation
    const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - mean, 2), 0) / amounts.length;
    const standardDeviation = Math.sqrt(variance);
    
    return {
      ranges,
      median,
      mean,
      mode,
      standardDeviation
    };
  } catch (error) {
    console.error('Error getting commission distribution:', error);
    return {
      ranges: [],
      median: 0,
      mean: 0,
      mode: 0,
      standardDeviation: 0
    };
  }
}
