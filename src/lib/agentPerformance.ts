import { Property, Lead, Contact, User } from '../types';
import { getProperties } from './data';
import { getLeads } from './data';
import { getContacts } from './data';
import { getAllAgents } from './auth';

/**
 * Agent Performance Analytics Library
 * Comprehensive metrics for agent productivity, sales, and rankings
 */

export interface AgentPerformance {
  agentId: string;
  agentName: string;
  
  // Sales Metrics
  totalListings: number;
  activeListings: number;
  soldProperties: number;
  totalSalesValue: number;
  averageSalePrice: number;
  conversionRate: number;
  
  // Lead Metrics
  totalLeads: number;
  convertedLeads: number;
  leadConversionRate: number;
  averageLeadResponseTime: number; // hours
  
  // Time Metrics
  averageDaysToSell: number;
  fastestSale: number; // days
  slowestSale: number; // days
  
  // Financial Metrics
  totalCommissionEarned: number;
  averageCommission: number;
  projectedCommission: number; // from active listings
  
  // Activity Metrics
  newListingsThisMonth: number;
  newLeadsThisMonth: number;
  propertiesViewedThisMonth: number;
  
  // Quality Metrics
  averagePropertyViews: number;
  listingQualityScore: number; // 0-100
  clientSatisfactionScore: number; // 0-5
  
  // CRM Metrics
  totalContacts: number;
  activeContacts: number;
  interactionsThisMonth: number;
  
  // Performance Score (0-100)
  overallScore: number;
}

export interface AgentRanking {
  rank: number;
  agentId: string;
  agentName: string;
  score: number;
  previousRank?: number;
  rankChange?: 'up' | 'down' | 'same';
  badge?: 'gold' | 'silver' | 'bronze' | 'rising-star' | 'top-performer';
}

export interface AgentActivity {
  date: string;
  type: 'listing' | 'sale' | 'lead' | 'contact' | 'interaction';
  description: string;
  value?: number;
}

// ============================================================================
// PERFORMANCE CALCULATION
// ============================================================================

/**
 * Calculate comprehensive performance metrics for an agent
 */
export function calculateAgentPerformance(
  agentId: string,
  agentName: string,
  timeRange: 'all' | '30days' | '90days' | 'ytd' = 'all'
): AgentPerformance {
  // Get date range
  const { startDate, endDate } = getDateRange(timeRange);
  
  // Get all agent data
  const allProperties = getProperties();
  const allLeads = getLeads();
  const allContacts = getContacts();
  
  // Filter by agent
  const agentProperties = allProperties.filter((p: Property) => p.agentId === agentId);
  const agentLeads = allLeads.filter((l: Lead) => l.agentId === agentId);
  const agentContacts = allContacts.filter((c: Contact) => c.assignedAgent === agentId);
  
  // Filter by date range if specified
  const filteredProperties = startDate
    ? agentProperties.filter((p: Property) => {
        const createdDate = new Date(p.createdAt);
        return createdDate >= new Date(startDate) && createdDate <= new Date(endDate!);
      })
    : agentProperties;
  
  const filteredLeads = startDate
    ? agentLeads.filter((l: Lead) => {
        const createdDate = new Date(l.createdAt);
        return createdDate >= new Date(startDate) && createdDate <= new Date(endDate!);
      })
    : agentLeads;
  
  // Sales Metrics
  const totalListings = filteredProperties.length;
  const activeListings = filteredProperties.filter((p: Property) => 
    p.status === 'available' && p.isPublished
  ).length;
  const soldProperties = filteredProperties.filter((p: Property) => p.status === 'sold').length;
  
  const totalSalesValue = filteredProperties
    .filter((p: Property) => p.status === 'sold')
    .reduce((sum: number, p: Property) => sum + (p.finalSalePrice || p.price || 0), 0);
  
  const averageSalePrice = soldProperties > 0 ? totalSalesValue / soldProperties : 0;
  const conversionRate = totalListings > 0 ? (soldProperties / totalListings) * 100 : 0;
  
  // Lead Metrics
  const totalLeads = filteredLeads.length;
  const convertedLeads = filteredLeads.filter((l: Lead) => l.status === 'converted').length;
  const leadConversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
  
  // Calculate average lead response time (mock for now, would need interaction tracking)
  const averageLeadResponseTime = 2.5; // hours (placeholder)
  
  // Time Metrics
  const soldPropertiesWithDates = filteredProperties.filter((p: Property) => 
    p.status === 'sold' && p.soldDate
  );
  
  const daysToSell = soldPropertiesWithDates.map((p: Property) => {
    const listedDate = new Date(p.listedDate || p.createdAt);
    const soldDate = new Date(p.soldDate!);
    const diffTime = Math.abs(soldDate.getTime() - listedDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  });
  
  const averageDaysToSell = daysToSell.length > 0
    ? Math.round(daysToSell.reduce((sum, days) => sum + days, 0) / daysToSell.length)
    : 0;
  
  const fastestSale = daysToSell.length > 0 ? Math.min(...daysToSell) : 0;
  const slowestSale = daysToSell.length > 0 ? Math.max(...daysToSell) : 0;
  
  // Financial Metrics
  const totalCommissionEarned = filteredProperties
    .filter((p: Property) => p.status === 'sold')
    .reduce((sum: number, p: Property) => sum + (p.commissionEarned || 0), 0);
  
  const averageCommission = soldProperties > 0 ? totalCommissionEarned / soldProperties : 0;
  
  const projectedCommission = filteredProperties
    .filter((p: Property) => p.status === 'available')
    .reduce((sum: number, p: Property) => {
      const price = p.price || 0;
      const rate = (p.commissionRate || 2) / 100;
      return sum + (price * rate);
    }, 0);
  
  // Activity Metrics (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const newListingsThisMonth = agentProperties.filter((p: Property) => {
    const createdDate = new Date(p.createdAt);
    return createdDate >= thirtyDaysAgo;
  }).length;
  
  const newLeadsThisMonth = agentLeads.filter((l: Lead) => {
    const createdDate = new Date(l.createdAt);
    return createdDate >= thirtyDaysAgo;
  }).length;
  
  // Property views (from viewCount)
  const propertiesViewedThisMonth = agentProperties.reduce((sum: number, p: Property) => {
    return sum + (p.viewCount || 0);
  }, 0);
  
  // Quality Metrics
  const averagePropertyViews = totalListings > 0
    ? agentProperties.reduce((sum: number, p: Property) => sum + (p.viewCount || 0), 0) / totalListings
    : 0;
  
  const listingQualityScore = calculateListingQualityScore(agentProperties);
  const clientSatisfactionScore = 4.2; // Placeholder (would come from reviews/feedback)
  
  // CRM Metrics
  const totalContacts = agentContacts.length;
  const activeContacts = agentContacts.filter((c: Contact) => c.status === 'active').length;
  const interactionsThisMonth = agentContacts.reduce((sum: number, c: Contact) => {
    const recentInteractions = (c.interactions || []).filter((i: any) => {
      const interactionDate = new Date(i.date);
      return interactionDate >= thirtyDaysAgo;
    });
    return sum + recentInteractions.length;
  }, 0);
  
  // Overall Performance Score (0-100)
  const overallScore = calculateOverallScore({
    conversionRate,
    leadConversionRate,
    averageDaysToSell,
    listingQualityScore,
    newListingsThisMonth,
    soldProperties
  });
  
  return {
    agentId,
    agentName,
    totalListings,
    activeListings,
    soldProperties,
    totalSalesValue,
    averageSalePrice,
    conversionRate,
    totalLeads,
    convertedLeads,
    leadConversionRate,
    averageLeadResponseTime,
    averageDaysToSell,
    fastestSale,
    slowestSale,
    totalCommissionEarned,
    averageCommission,
    projectedCommission,
    newListingsThisMonth,
    newLeadsThisMonth,
    propertiesViewedThisMonth,
    averagePropertyViews,
    listingQualityScore,
    clientSatisfactionScore,
    totalContacts,
    activeContacts,
    interactionsThisMonth,
    overallScore
  };
}

/**
 * Calculate listing quality score (0-100)
 */
function calculateListingQualityScore(properties: Property[]): number {
  if (properties.length === 0) return 0;
  
  let totalScore = 0;
  
  properties.forEach((p: Property) => {
    let score = 100;
    
    // Deduct for missing images
    if (!p.images || p.images.length === 0) {
      score -= 20;
    } else if (p.images.length < 3) {
      score -= 10;
    }
    
    // Deduct for short description
    if (!p.description || p.description.length < 50) {
      score -= 15;
    }
    
    // Deduct for missing key details
    if (!p.bedrooms && p.propertyType !== 'land') score -= 5;
    if (!p.bathrooms && p.propertyType !== 'land') score -= 5;
    if (!p.yearBuilt) score -= 5;
    
    // Deduct for not published
    if (!p.isPublished) score -= 10;
    
    // Bonus for featured
    if (p.isFeatured) score += 10;
    
    // Bonus for marketing notes
    if (p.marketingNotes && p.marketingNotes.length > 0) score += 5;
    
    totalScore += Math.max(0, Math.min(100, score));
  });
  
  return Math.round(totalScore / properties.length);
}

/**
 * Calculate overall performance score (0-100)
 */
function calculateOverallScore(metrics: {
  conversionRate: number;
  leadConversionRate: number;
  averageDaysToSell: number;
  listingQualityScore: number;
  newListingsThisMonth: number;
  soldProperties: number;
}): number {
  let score = 0;
  
  // Conversion Rate (30 points max)
  score += Math.min(30, metrics.conversionRate * 3);
  
  // Lead Conversion Rate (25 points max)
  score += Math.min(25, metrics.leadConversionRate * 2.5);
  
  // Days to Sell (20 points max)
  if (metrics.averageDaysToSell > 0) {
    const daysScore = 20 - (metrics.averageDaysToSell / 10);
    score += Math.max(0, daysScore);
  }
  
  // Listing Quality (15 points max)
  score += (metrics.listingQualityScore / 100) * 15;
  
  // Activity (10 points max)
  score += Math.min(10, metrics.newListingsThisMonth);
  
  return Math.round(Math.max(0, Math.min(100, score)));
}

// ============================================================================
// RANKINGS
// ============================================================================

/**
 * Get agent rankings based on performance
 */
export function getAgentRankings(
  timeRange: 'all' | '30days' | '90days' | 'ytd' = 'all'
): AgentRanking[] {
  const agents = getAllAgents();
  
  // Calculate performance for each agent
  const performances = agents.map((agent: User) => 
    calculateAgentPerformance(agent.id, agent.name, timeRange)
  );
  
  // Sort by overall score
  const sortedPerformances = performances.sort((a, b) => b.overallScore - a.overallScore);
  
  // Create rankings with badges
  const rankings: AgentRanking[] = sortedPerformances.map((perf, index) => {
    let badge: AgentRanking['badge'];
    
    if (index === 0) {
      badge = 'gold';
    } else if (index === 1) {
      badge = 'silver';
    } else if (index === 2) {
      badge = 'bronze';
    } else if (perf.overallScore >= 80) {
      badge = 'top-performer';
    } else if (perf.newListingsThisMonth >= 5) {
      badge = 'rising-star';
    }
    
    return {
      rank: index + 1,
      agentId: perf.agentId,
      agentName: perf.agentName,
      score: perf.overallScore,
      badge
    };
  });
  
  return rankings;
}

/**
 * Get top performing agents
 */
export function getTopPerformers(limit: number = 5, timeRange: 'all' | '30days' | '90days' | 'ytd' = 'all'): AgentPerformance[] {
  const agents = getAllAgents();
  
  const performances = agents.map((agent: User) => 
    calculateAgentPerformance(agent.id, agent.name, timeRange)
  );
  
  return performances
    .sort((a, b) => b.overallScore - a.overallScore)
    .slice(0, limit);
}

// ============================================================================
// COMPARISONS
// ============================================================================

/**
 * Compare agent to team average
 */
export function compareToTeamAverage(agentId: string): {
  agentPerformance: AgentPerformance;
  teamAverage: {
    conversionRate: number;
    leadConversionRate: number;
    averageDaysToSell: number;
    averageCommission: number;
    overallScore: number;
  };
  comparisons: {
    metric: string;
    agentValue: number;
    teamValue: number;
    difference: number;
    differencePercentage: number;
    status: 'above' | 'at' | 'below';
  }[];
} {
  const agents = getAllAgents();
  
  const agentPerformance = calculateAgentPerformance(
    agentId,
    agents.find((a: User) => a.id === agentId)?.name || 'Unknown',
    'all'
  );
  
  // Calculate team averages
  const allPerformances = agents.map((agent: User) => 
    calculateAgentPerformance(agent.id, agent.name, 'all')
  );
  
  const teamAverage = {
    conversionRate: average(allPerformances.map(p => p.conversionRate)),
    leadConversionRate: average(allPerformances.map(p => p.leadConversionRate)),
    averageDaysToSell: average(allPerformances.map(p => p.averageDaysToSell)),
    averageCommission: average(allPerformances.map(p => p.averageCommission)),
    overallScore: average(allPerformances.map(p => p.overallScore))
  };
  
  // Create comparisons
  const comparisons = [
    {
      metric: 'Conversion Rate',
      agentValue: agentPerformance.conversionRate,
      teamValue: teamAverage.conversionRate
    },
    {
      metric: 'Lead Conversion Rate',
      agentValue: agentPerformance.leadConversionRate,
      teamValue: teamAverage.leadConversionRate
    },
    {
      metric: 'Average Days to Sell',
      agentValue: agentPerformance.averageDaysToSell,
      teamValue: teamAverage.averageDaysToSell
    },
    {
      metric: 'Average Commission',
      agentValue: agentPerformance.averageCommission,
      teamValue: teamAverage.averageCommission
    },
    {
      metric: 'Overall Score',
      agentValue: agentPerformance.overallScore,
      teamValue: teamAverage.overallScore
    }
  ].map(comp => {
    const difference = comp.agentValue - comp.teamValue;
    const differencePercentage = comp.teamValue > 0 
      ? (difference / comp.teamValue) * 100 
      : 0;
    
    let status: 'above' | 'at' | 'below';
    // For days to sell, lower is better
    if (comp.metric === 'Average Days to Sell') {
      status = difference < -5 ? 'above' : difference > 5 ? 'below' : 'at';
    } else {
      status = difference > 5 ? 'above' : difference < -5 ? 'below' : 'at';
    }
    
    return {
      ...comp,
      difference,
      differencePercentage: parseFloat(differencePercentage.toFixed(2)),
      status
    };
  });
  
  return {
    agentPerformance,
    teamAverage,
    comparisons
  };
}

// ============================================================================
// ACTIVITY TRACKING
// ============================================================================

/**
 * Get agent activity timeline
 */
export function getAgentActivityTimeline(
  agentId: string,
  days: number = 30
): AgentActivity[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const allProperties = getProperties();
  const allLeads = getLeads();
  
  const agentProperties = allProperties.filter((p: Property) => p.agentId === agentId);
  const agentLeads = allLeads.filter((l: Lead) => l.agentId === agentId);
  
  const activities: AgentActivity[] = [];
  
  // Property listings
  agentProperties.forEach((p: Property) => {
    const createdDate = new Date(p.createdAt);
    if (createdDate >= cutoffDate) {
      activities.push({
        date: p.createdAt,
        type: 'listing',
        description: `Listed property: ${p.title}`,
        value: p.price
      });
    }
    
    // Property sales
    if (p.status === 'sold' && p.soldDate) {
      const soldDate = new Date(p.soldDate);
      if (soldDate >= cutoffDate) {
        activities.push({
          date: p.soldDate,
          type: 'sale',
          description: `Sold property: ${p.title}`,
          value: p.finalSalePrice || p.price
        });
      }
    }
  });
  
  // Leads
  agentLeads.forEach((l: Lead) => {
    const createdDate = new Date(l.createdAt);
    if (createdDate >= cutoffDate) {
      activities.push({
        date: l.createdAt,
        type: 'lead',
        description: `New lead: ${l.name}`
      });
    }
  });
  
  // Sort by date (most recent first)
  return activities.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

/**
 * Get agent performance trends over time
 */
export function getAgentPerformanceTrends(
  agentId: string,
  agentName: string,
  months: number = 6
): Array<{
  month: string;
  sales: number;
  leads: number;
  commission: number;
  conversionRate: number;
}> {
  const allProperties = getProperties();
  const allLeads = getLeads();
  
  const agentProperties = allProperties.filter((p: Property) => p.agentId === agentId);
  const agentLeads = allLeads.filter((l: Lead) => l.agentId === agentId);
  
  // Group by month
  const monthlyData: { [key: string]: { sales: number; leads: number; commission: number; total: number } } = {};
  
  const today = new Date();
  for (let i = 0; i < months; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthKey = date.toISOString().slice(0, 7);
    monthlyData[monthKey] = { sales: 0, leads: 0, commission: 0, total: 0 };
  }
  
  // Count sales by month
  agentProperties.forEach((p: Property) => {
    if (p.status === 'sold' && p.soldDate) {
      const month = p.soldDate.slice(0, 7);
      if (monthlyData[month]) {
        monthlyData[month].sales += 1;
        monthlyData[month].commission += p.commissionEarned || 0;
      }
    }
    
    // Count total listings
    const listedMonth = p.createdAt.slice(0, 7);
    if (monthlyData[listedMonth]) {
      monthlyData[listedMonth].total += 1;
    }
  });
  
  // Count leads by month
  agentLeads.forEach((l: Lead) => {
    const month = l.createdAt.slice(0, 7);
    if (monthlyData[month]) {
      monthlyData[month].leads += 1;
    }
  });
  
  // Calculate conversion rate for each month
  const trends = Object.entries(monthlyData)
    .map(([month, data]) => ({
      month,
      sales: data.sales,
      leads: data.leads,
      commission: data.commission,
      conversionRate: data.total > 0 ? (data.sales / data.total) * 100 : 0
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
  
  return trends;
}

// ============================================================================
// HELPERS
// ============================================================================

function getDateRange(timeRange: 'all' | '30days' | '90days' | 'ytd'): {
  startDate: string | null;
  endDate: string | null;
} {
  if (timeRange === 'all') {
    return { startDate: null, endDate: null };
  }
  
  const today = new Date();
  let startDate = new Date();
  
  switch (timeRange) {
    case '30days':
      startDate.setDate(today.getDate() - 30);
      break;
    case '90days':
      startDate.setDate(today.getDate() - 90);
      break;
    case 'ytd':
      startDate = new Date(today.getFullYear(), 0, 1);
      break;
  }
  
  return {
    startDate: startDate.toISOString(),
    endDate: today.toISOString()
  };
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}
