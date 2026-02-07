/**
 * Calculate Performance Metrics
 * 
 * Calculates performance metrics for the Performance Pulse section.
 * 
 * METRICS:
 * 1. Weekly Activity - Daily activity trend
 * 2. Conversion Rate - Lead to deal conversion
 * 3. Average Response Time - Time to first response
 * 4. Active Deals - Deals in pipeline
 * 5. Revenue This Month - Total revenue
 * 6. Lead Velocity - Leads per day
 * 7. Top Performer - Best agent
 * 8. Deal Cycle Time - Average days to close
 */

import { Property, User } from '../../../types';
import { LeadV4 } from '../../../types/leads';
import { CRMTask, CRMInteraction } from '../../../types';
import { PerformanceMetric } from '../components/PerformanceCard';
import { formatPKR } from '../../../lib/currency';
import {
  Activity,
  TrendingUp,
  Clock,
  Handshake,
  DollarSign,
  Users,
  Award,
  Calendar,
} from 'lucide-react';

/**
 * Calculate daily activity for the last 7 days
 */
function calculateDailyActivity(
  properties: Property[],
  leads: LeadV4[],
  tasks: CRMTask[],
  interactions: CRMInteraction[]
): Array<{ value: number; label: string }> {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date;
  });

  return last7Days.map(date => {
    const dateStr = date.toISOString().split('T')[0];
    const count =
      properties.filter(p => p.createdAt === dateStr).length +
      leads.filter(l => l.createdAt.startsWith(dateStr)).length +
      tasks.filter(t => t.createdAt === dateStr).length +
      interactions.filter(i => i.date === dateStr).length;

    return {
      value: count,
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
    };
  });
}

/**
 * Calculate conversion rate (leads to deals)
 */
function calculateConversionRate(
  leads: LeadV4[],
  properties: Property[]
): { rate: number; trend: number } {
  // Total qualified leads (not new, not lost)
  const qualifiedLeads = leads.filter(
    l => !['new', 'lost', 'disqualified'].includes(l.stage)
  ).length;

  // Converted leads (deals/sold properties)
  const convertedLeads = leads.filter(
    l => l.stage === 'closed-won'
  ).length;

  const rate = qualifiedLeads > 0 ? (convertedLeads / qualifiedLeads) * 100 : 0;

  // Calculate trend (compare with previous period)
  // TODO: Implement time-based comparison
  const trend = 5.2; // Mock for now

  return { rate, trend };
}

/**
 * Calculate average response time (hours)
 */
function calculateAverageResponseTime(
  leads: LeadV4[],
  interactions: CRMInteraction[]
): { avgHours: number; trend: number } {
  let totalResponseTime = 0;
  let responseCount = 0;

  leads.forEach(lead => {
    // Find first interaction for this lead
    const leadInteractions = interactions
      .filter(i => i.contactId === lead.contactId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (leadInteractions.length > 0) {
      const leadCreated = new Date(lead.createdAt);
      const firstResponse = new Date(leadInteractions[0].date);
      const diffHours = (firstResponse.getTime() - leadCreated.getTime()) / (1000 * 60 * 60);

      if (diffHours >= 0 && diffHours < 168) { // Within 1 week
        totalResponseTime += diffHours;
        responseCount++;
      }
    }
  });

  const avgHours = responseCount > 0 ? totalResponseTime / responseCount : 0;

  // Calculate trend
  const trend = -8.3; // Mock (negative is good for response time)

  return { avgHours, trend };
}

/**
 * Calculate active deals
 */
function calculateActiveDeals(
  leads: LeadV4[],
  properties: Property[]
): { count: number; pipelineValue: number; trend: number } {
  // Active deals = leads in negotiation or proposal stage
  const activeDeals = leads.filter(
    l => ['negotiation', 'proposal'].includes(l.stage)
  );

  const count = activeDeals.length;

  // Calculate pipeline value (sum of property prices for active deals)
  const pipelineValue = activeDeals.reduce((sum, lead) => {
    const property = properties.find(p => p.id === lead.propertyId);
    return sum + (property?.price || 0);
  }, 0);

  // Calculate trend
  const trend = 12.4; // Mock

  return { count, pipelineValue, trend };
}

/**
 * Calculate revenue this month
 */
function calculateMonthlyRevenue(
  properties: Property[]
): { revenue: number; trend: number; chartData: Array<{ value: number }> } {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  // Get sold properties this month
  const soldThisMonth = properties.filter(p => {
    if (p.status !== 'sold' || !p.updatedAt) return false;
    const updatedDate = new Date(p.updatedAt);
    return updatedDate.getMonth() === thisMonth && updatedDate.getFullYear() === thisYear;
  });

  const revenue = soldThisMonth.reduce((sum, p) => sum + (p.price || 0), 0);

  // Calculate trend (compare with last month)
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

  const soldLastMonth = properties.filter(p => {
    if (p.status !== 'sold' || !p.updatedAt) return false;
    const updatedDate = new Date(p.updatedAt);
    return updatedDate.getMonth() === lastMonth && updatedDate.getFullYear() === lastMonthYear;
  });

  const lastMonthRevenue = soldLastMonth.reduce((sum, p) => sum + (p.price || 0), 0);
  const trend = lastMonthRevenue > 0 ? ((revenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

  // Chart data - last 4 weeks
  const chartData = Array.from({ length: 4 }, (_, i) => {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (3 - i) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const weekRevenue = properties
      .filter(p => {
        if (p.status !== 'sold' || !p.updatedAt) return false;
        const updatedDate = new Date(p.updatedAt);
        return updatedDate >= weekStart && updatedDate < weekEnd;
      })
      .reduce((sum, p) => sum + (p.price || 0), 0);

    return { value: weekRevenue };
  });

  return { revenue, trend, chartData };
}

/**
 * Calculate lead velocity (leads per day)
 */
function calculateLeadVelocity(
  leads: LeadV4[]
): { velocity: number; trend: number; chartData: Array<{ value: number }> } {
  // Leads created in last 7 days
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);

  const recentLeads = leads.filter(
    l => new Date(l.createdAt) >= last7Days
  );

  const velocity = recentLeads.length / 7;

  // Calculate trend (compare with previous 7 days)
  const last14Days = new Date();
  last14Days.setDate(last14Days.getDate() - 14);

  const previousPeriodLeads = leads.filter(
    l => {
      const created = new Date(l.createdAt);
      return created >= last14Days && created < last7Days;
    }
  );

  const previousVelocity = previousPeriodLeads.length / 7;
  const trend = previousVelocity > 0 ? ((velocity - previousVelocity) / previousVelocity) * 100 : 0;

  // Chart data - last 7 days
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split('T')[0];
    const count = leads.filter(l => l.createdAt.startsWith(dateStr)).length;
    return { value: count };
  });

  return { velocity, trend, chartData };
}

/**
 * Find top performer (agent with most deals)
 */
function findTopPerformer(
  leads: LeadV4[],
  properties: Property[],
  users: User[]
): { agent: User | null; dealCount: number; revenue: number } {
  // Count deals per agent
  const agentStats = new Map<string, { deals: number; revenue: number }>();

  leads
    .filter(l => l.stage === 'closed-won')
    .forEach(lead => {
      const agentId = lead.assignedTo;
      const property = properties.find(p => p.id === lead.propertyId);
      const revenue = property?.price || 0;

      const current = agentStats.get(agentId) || { deals: 0, revenue: 0 };
      agentStats.set(agentId, {
        deals: current.deals + 1,
        revenue: current.revenue + revenue,
      });
    });

  // Find agent with most deals
  let topAgentId: string | null = null;
  let maxDeals = 0;
  let maxRevenue = 0;

  agentStats.forEach((stats, agentId) => {
    if (stats.deals > maxDeals) {
      topAgentId = agentId;
      maxDeals = stats.deals;
      maxRevenue = stats.revenue;
    }
  });

  const agent = topAgentId ? users.find(u => u.id === topAgentId) || null : null;

  return { agent, dealCount: maxDeals, revenue: maxRevenue };
}

/**
 * Calculate average deal cycle time (days)
 */
function calculateDealCycleTime(
  leads: LeadV4[]
): { avgDays: number; trend: number; chartData: Array<{ value: number }> } {
  const closedDeals = leads.filter(l => l.stage === 'closed-won');

  let totalDays = 0;
  let count = 0;

  closedDeals.forEach(lead => {
    if (lead.lastActivityDate) {
      const created = new Date(lead.createdAt);
      const closed = new Date(lead.lastActivityDate);
      const days = (closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);

      if (days >= 0 && days < 365) { // Sanity check
        totalDays += days;
        count++;
      }
    }
  });

  const avgDays = count > 0 ? totalDays / count : 0;

  // Calculate trend (mock for now)
  const trend = -5.7; // Negative is good (faster deals)

  // Chart data - last 5 closed deals
  const recentClosedDeals = closedDeals
    .sort((a, b) => new Date(b.lastActivityDate || 0).getTime() - new Date(a.lastActivityDate || 0).getTime())
    .slice(0, 5);

  const chartData = recentClosedDeals.map(lead => {
    const created = new Date(lead.createdAt);
    const closed = new Date(lead.lastActivityDate || new Date());
    const days = (closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    return { value: Math.round(days) };
  }).reverse();

  return { avgDays, trend, chartData };
}

/**
 * Main function: Calculate all performance metrics
 */
export function calculatePerformanceMetrics(data: {
  properties: Property[];
  leads: LeadV4[];
  tasks: CRMTask[];
  interactions: CRMInteraction[];
  users: User[];
}): PerformanceMetric[] {
  const { properties, leads, tasks, interactions, users } = data;

  // 1. Weekly Activity
  const activityData = calculateDailyActivity(properties, leads, tasks, interactions);
  const totalActivity = activityData.reduce((sum, d) => sum + d.value, 0);
  const weeklyActivity: PerformanceMetric = {
    id: 'weekly-activity',
    title: 'Weekly Activity',
    value: totalActivity,
    trend: totalActivity > 50 ? 'up' : totalActivity > 30 ? 'neutral' : 'down',
    trendValue: 8.5,
    comparison: 'vs last week',
    chartType: 'line',
    chartData: activityData,
    icon: Activity,
    iconColor: 'text-[#2D6A54]',
    iconBgColor: 'bg-[#2D6A54]/10',
  };

  // 2. Conversion Rate
  const { rate: conversionRate, trend: conversionTrend } = calculateConversionRate(leads, properties);
  const conversion: PerformanceMetric = {
    id: 'conversion-rate',
    title: 'Conversion Rate',
    value: conversionRate.toFixed(1),
    unit: '%',
    trend: conversionTrend > 0 ? 'up' : conversionTrend < 0 ? 'down' : 'neutral',
    trendValue: conversionTrend,
    comparison: 'vs last month',
    chartType: 'none',
    icon: TrendingUp,
    iconColor: 'text-[#C17052]',
    iconBgColor: 'bg-[#C17052]/10',
  };

  // 3. Average Response Time
  const { avgHours, trend: responseTrend } = calculateAverageResponseTime(leads, interactions);
  const responseTime: PerformanceMetric = {
    id: 'response-time',
    title: 'Avg Response Time',
    value: avgHours.toFixed(1),
    unit: 'hrs',
    trend: responseTrend < 0 ? 'up' : responseTrend > 0 ? 'down' : 'neutral', // Inverted (lower is better)
    trendValue: Math.abs(responseTrend),
    comparison: 'vs last week',
    chartType: 'none',
    icon: Clock,
    iconColor: 'text-blue-600',
    iconBgColor: 'bg-blue-600/10',
  };

  // 4. Active Deals
  const { count: activeDealsCount, pipelineValue, trend: dealsTrend } = calculateActiveDeals(leads, properties);
  const activeDeals: PerformanceMetric = {
    id: 'active-deals',
    title: 'Active Deals',
    value: activeDealsCount,
    trend: dealsTrend > 0 ? 'up' : dealsTrend < 0 ? 'down' : 'neutral',
    trendValue: dealsTrend,
    comparison: formatPKR(pipelineValue) + ' pipeline',
    chartType: 'none',
    icon: Handshake,
    iconColor: 'text-purple-600',
    iconBgColor: 'bg-purple-600/10',
  };

  // 5. Revenue This Month
  const { revenue, trend: revenueTrend, chartData: revenueChartData } = calculateMonthlyRevenue(properties);
  const monthlyRevenue: PerformanceMetric = {
    id: 'monthly-revenue',
    title: 'Revenue This Month',
    value: formatPKR(revenue),
    trend: revenueTrend > 0 ? 'up' : revenueTrend < 0 ? 'down' : 'neutral',
    trendValue: Math.abs(revenueTrend),
    comparison: 'vs last month',
    chartType: 'bar',
    chartData: revenueChartData,
    icon: DollarSign,
    iconColor: 'text-green-600',
    iconBgColor: 'bg-green-600/10',
  };

  // 6. Lead Velocity
  const { velocity, trend: velocityTrend, chartData: velocityChartData } = calculateLeadVelocity(leads);
  const leadVelocity: PerformanceMetric = {
    id: 'lead-velocity',
    title: 'Lead Velocity',
    value: velocity.toFixed(1),
    unit: '/day',
    trend: velocityTrend > 0 ? 'up' : velocityTrend < 0 ? 'down' : 'neutral',
    trendValue: Math.abs(velocityTrend),
    comparison: 'vs last week',
    chartType: 'bar',
    chartData: velocityChartData,
    icon: Users,
    iconColor: 'text-[#C17052]',
    iconBgColor: 'bg-[#C17052]/10',
  };

  // 7. Top Performer
  const { agent: topAgent, dealCount, revenue: topRevenue } = findTopPerformer(leads, properties, users);
  const topPerformer: PerformanceMetric = {
    id: 'top-performer',
    title: 'Top Performer',
    value: topAgent?.name || 'No data',
    trend: 'up',
    trendValue: dealCount,
    comparison: `${dealCount} deals, ${formatPKR(topRevenue)}`,
    chartType: 'none',
    icon: Award,
    iconColor: 'text-amber-600',
    iconBgColor: 'bg-amber-600/10',
  };

  // 8. Deal Cycle Time
  const { avgDays, trend: cycleTrend, chartData: cycleChartData } = calculateDealCycleTime(leads);
  const dealCycleTime: PerformanceMetric = {
    id: 'deal-cycle-time',
    title: 'Avg Deal Cycle',
    value: avgDays.toFixed(0),
    unit: 'days',
    trend: cycleTrend < 0 ? 'up' : cycleTrend > 0 ? 'down' : 'neutral', // Inverted (lower is better)
    trendValue: Math.abs(cycleTrend),
    comparison: 'vs last month',
    chartType: 'bar',
    chartData: cycleChartData.length > 0 ? cycleChartData : [{ value: 0 }],
    icon: Calendar,
    iconColor: 'text-indigo-600',
    iconBgColor: 'bg-indigo-600/10',
  };

  return [
    weeklyActivity,
    conversion,
    responseTime,
    activeDeals,
    monthlyRevenue,
    leadVelocity,
    topPerformer,
    dealCycleTime,
  ];
}
