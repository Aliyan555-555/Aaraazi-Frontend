/**
 * Detect Insights
 *
 * Analyzes data and generates actionable insights using pattern detection.
 *
 * INSIGHT TYPES:
 * 1. Opportunity - Actions to take
 * 2. Warning - Issues needing attention
 * 3. Achievement - Celebrate wins
 * 4. Recommendation - Data-driven suggestions
 * 5. Alert - Urgent problems
 * 6. Info - Useful information
 *
 * PATTERNS DETECTED:
 * - Leads needing follow-up
 * - Response time degradation
 * - Revenue milestones
 * - Hot locations
 * - Low conversion areas
 * - Pipeline risks
 * - Activity patterns
 * - Price range opportunities
 */

import { Property, User } from "../../../types";
import { DashboardLead } from "../../../types/leads";
import { Task } from "../../../types/tasks";
import { Insight } from "../components/InsightCard";
import { formatPKR } from "../../../lib/currency";

/**
 * Detect leads needing follow-up (>3 days since last contact)
 */
function detectStaledLeads(leads: DashboardLead[]): Insight | null {
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  const staledLeads = leads.filter((lead) => {
    // Skip closed/lost leads
    if (["closed-won", "closed-lost", "disqualified"].includes(lead.stage)) {
      return false;
    }

    // Check last activity date from lead
    const lastActivity = lead.lastActivityDate
      ? new Date(lead.lastActivityDate)
      : new Date(lead.createdAt);

    return lastActivity < threeDaysAgo;
  });

  if (staledLeads.length === 0) return null;

  return {
    id: "staled-leads",
    type: "opportunity",
    priority: staledLeads.length >= 5 ? "high" : "medium",
    title: `${staledLeads.length} leads need follow-up`,
    message: `You have ${staledLeads.length} active leads that haven't been contacted in over 3 days. Following up could revive these opportunities.`,
    data: [
      { label: "leads", value: staledLeads.length },
      {
        label: "oldest",
        value: `${Math.floor((now.getTime() - new Date(staledLeads[0].createdAt).getTime()) / (24 * 60 * 60 * 1000))}d ago`,
      },
    ],
    action: {
      label: "View Leads",
      onClick: () => {
        // Navigation will be passed from parent
        console.log("Navigate to leads");
      },
    },
    dismissible: false,
  };
}

/**
 * Detect response time degradation (>20% increase)
 */
function detectSlowResponseTime(leads: DashboardLead[]): Insight | null {
  // Calculate average response time for this week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const recentLeads = leads.filter((l) => new Date(l.createdAt) >= oneWeekAgo);

  let totalResponseTime = 0;
  let count = 0;

  recentLeads.forEach((lead) => {
    // Check first contact (using lastContactDate as proxy)
    if (lead.lastContactDate) {
      const leadCreated = new Date(lead.createdAt);
      const firstResponse = new Date(lead.lastContactDate);
      const diffHours =
        (firstResponse.getTime() - leadCreated.getTime()) / (1000 * 60 * 60);

      if (diffHours >= 0 && diffHours < 168) {
        totalResponseTime += diffHours;
        count++;
      }
    }
  });

  const avgResponseTime = count > 0 ? totalResponseTime / count : 0;

  // If average response time is >6 hours, warn
  if (avgResponseTime > 6) {
    return {
      id: "slow-response",
      type: "warning",
      priority: avgResponseTime > 12 ? "high" : "medium",
      title: "Response time is increasing",
      message: `Your average response time is ${avgResponseTime.toFixed(1)} hours. Leads expect faster responses. Aim for under 4 hours to improve conversion rates.`,
      data: [
        { label: "avg response", value: `${avgResponseTime.toFixed(1)}h` },
        { label: "target", value: "<4h" },
      ],
      dismissible: true,
    };
  }

  return null;
}

/**
 * Detect revenue milestones
 */
function detectRevenueMilestone(properties: Property[]): Insight | null {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  // Revenue this month
  const soldThisMonth = properties.filter((p) => {
    if (p.status !== "sold" || !p.updatedAt) return false;
    const updatedDate = new Date(p.updatedAt);
    return (
      updatedDate.getMonth() === thisMonth &&
      updatedDate.getFullYear() === thisYear
    );
  });

  const revenue = soldThisMonth.reduce((sum, p) => sum + (p.price || 0), 0);

  // Check for milestones (50M, 100M, 500M, 1B)
  const milestones = [
    { value: 1000000000, label: "PKR 1 Billion" },
    { value: 500000000, label: "PKR 500 Million" },
    { value: 100000000, label: "PKR 100 Million" },
    { value: 50000000, label: "PKR 50 Million" },
  ];

  const achievedMilestone = milestones.find(
    (m) => revenue >= m.value && revenue < m.value * 1.2, // Within 20% of milestone
  );

  if (achievedMilestone) {
    return {
      id: "revenue-milestone",
      type: "achievement",
      priority: "high",
      title: `🎉 ${achievedMilestone.label} milestone reached!`,
      message: `Congratulations! You've achieved ${formatPKR(revenue)} in revenue this month. That's an incredible achievement for your team.`,
      data: [
        { label: "revenue", value: formatPKR(revenue) },
        { label: "deals", value: soldThisMonth.length },
      ],
      dismissible: true,
    };
  }

  return null;
}

/**
 * Detect hot location (most inquiries)
 */
function detectHotLocation(
  leads: DashboardLead[],
  properties: Property[],
): Insight | null {
  // Count leads by property location
  const locationCounts = new Map<string, number>();

  leads.forEach((lead) => {
    if (lead.propertyId) {
      const property = properties.find((p) => p.id === lead.propertyId);
      if (property && property.address.area) {
        const area = property.address.area;
        locationCounts.set(area, (locationCounts.get(area) || 0) + 1);
      }
    }
  });

  // Find top location
  let topLocation = "";
  let maxCount = 0;

  locationCounts.forEach((count, location) => {
    if (count > maxCount) {
      maxCount = count;
      topLocation = location;
    }
  });

  if (maxCount >= 5) {
    return {
      id: "hot-location",
      type: "recommendation",
      priority: "medium",
      title: `${topLocation} is trending`,
      message: `${topLocation} has received ${maxCount} inquiries recently. Consider focusing your marketing efforts and inventory in this area to capitalize on the demand.`,
      data: [
        { label: "inquiries", value: maxCount },
        { label: "location", value: topLocation },
      ],
      dismissible: true,
    };
  }

  return null;
}

/**
 * Detect low conversion location
 */
function detectLowConversionLocation(
  leads: DashboardLead[],
  properties: Property[],
): Insight | null {
  // Count leads and conversions by location
  const locationStats = new Map<string, { total: number; converted: number }>();

  leads.forEach((lead) => {
    if (lead.propertyId) {
      const property = properties.find((p) => p.id === lead.propertyId);
      if (property && property.address.area) {
        const area = property.address.area;
        const current = locationStats.get(area) || { total: 0, converted: 0 };
        current.total++;
        if (lead.stage === "closed-won") {
          current.converted++;
        }
        locationStats.set(area, current);
      }
    }
  });

  // Find locations with low conversion (>10 leads, <10% conversion)
  let worstLocation = "";
  let worstRate = 100;
  let worstLeads = 0;

  locationStats.forEach((stats, location) => {
    if (stats.total >= 10) {
      const rate = (stats.converted / stats.total) * 100;
      if (rate < worstRate && rate < 10) {
        worstRate = rate;
        worstLocation = location;
        worstLeads = stats.total;
      }
    }
  });

  if (worstLocation) {
    return {
      id: "low-conversion-location",
      type: "warning",
      priority: "low",
      title: `${worstLocation} has low conversion`,
      message: `Despite ${worstLeads} inquiries, ${worstLocation} has only ${worstRate.toFixed(1)}% conversion rate. Consider reviewing pricing, property quality, or lead qualification for this area.`,
      data: [
        { label: "conversion", value: `${worstRate.toFixed(1)}%` },
        { label: "leads", value: worstLeads },
      ],
      dismissible: true,
    };
  }

  return null;
}

/**
 * Detect pipeline risks (deals stalling)
 */
function detectPipelineRisks(leads: DashboardLead[]): Insight | null {
  const now = new Date();
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Find deals in negotiation for >14 days
  const stallingDeals = leads.filter((lead) => {
    if (lead.stage !== "negotiation" && lead.stage !== "proposal") {
      return false;
    }

    const lastActivity = lead.lastActivityDate
      ? new Date(lead.lastActivityDate)
      : new Date(lead.createdAt);

    return lastActivity < twoWeeksAgo;
  });

  if (stallingDeals.length >= 3) {
    return {
      id: "pipeline-risk",
      type: "alert",
      priority: "high",
      title: `${stallingDeals.length} deals are stalling`,
      message: `You have ${stallingDeals.length} deals in negotiation or proposal stage for over 2 weeks without progress. These deals may be at risk of falling through. Take action to move them forward or qualify them out.`,
      data: [
        { label: "stalled deals", value: stallingDeals.length },
        { label: "stage", value: "negotiation/proposal" },
      ],
      action: {
        label: "Review Pipeline",
        onClick: () => {
          console.log("Navigate to pipeline");
        },
      },
      dismissible: false,
    };
  }

  return null;
}

/**
 * Detect best performing day
 */
function detectBestPerformingDay(
  properties: Property[],
  leads: DashboardLead[],
  tasks: Task[],
): Insight | null {
  // Count activity by day of week
  const dayCounts = new Map<string, number>();
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  [...properties, ...leads, ...tasks].forEach((item) => {
    const date = new Date(item.createdAt);
    const dayName = dayNames[date.getDay()];
    dayCounts.set(dayName, (dayCounts.get(dayName) || 0) + 1);
  });

  // Find best day
  let bestDay = "";
  let maxActivity = 0;

  dayCounts.forEach((count, day) => {
    if (count > maxActivity) {
      maxActivity = count;
      bestDay = day;
    }
  });

  if (maxActivity >= 20) {
    return {
      id: "best-day",
      type: "info",
      priority: "low",
      title: `${bestDay}s are your most active day`,
      message: `${bestDay}s have consistently shown the highest activity with ${maxActivity} actions. Consider scheduling important meetings and follow-ups on ${bestDay}s when your team is most productive.`,
      data: [
        { label: "activity", value: maxActivity },
        { label: "day", value: bestDay },
      ],
      dismissible: true,
    };
  }

  return null;
}

/**
 * Detect price range opportunity
 */
function detectPriceRangeOpportunity(
  leads: DashboardLead[],
  properties: Property[],
): Insight | null {
  // Count leads by price range
  const ranges = [
    { min: 0, max: 10000000, label: "Under PKR 10M" },
    { min: 10000000, max: 25000000, label: "PKR 10-25M" },
    { min: 25000000, max: 50000000, label: "PKR 25-50M" },
    { min: 50000000, max: 100000000, label: "PKR 50-100M" },
    { min: 100000000, max: Infinity, label: "Over PKR 100M" },
  ];

  const rangeCounts = ranges.map((range) => ({
    ...range,
    count: 0,
  }));

  leads.forEach((lead) => {
    if (lead.propertyId) {
      const property = properties.find((p) => p.id === lead.propertyId);
      if (property && property.price) {
        const rangeIndex = rangeCounts.findIndex(
          (r) => property.price >= r.min && property.price < r.max,
        );
        if (rangeIndex >= 0) {
          rangeCounts[rangeIndex].count++;
        }
      }
    }
  });

  // Find most popular range
  const topRange = rangeCounts.reduce((prev, current) =>
    current.count > prev.count ? current : prev,
  );

  if (topRange.count >= 10) {
    return {
      id: "price-range-opportunity",
      type: "recommendation",
      priority: "medium",
      title: `High demand in ${topRange.label} range`,
      message: `You're receiving strong interest in the ${topRange.label} price range with ${topRange.count} inquiries. Consider sourcing more inventory in this segment to meet demand.`,
      data: [
        { label: "inquiries", value: topRange.count },
        { label: "range", value: topRange.label },
      ],
      dismissible: true,
    };
  }

  return null;
}

/**
 * Main function: Detect all insights
 */
export function detectInsights(data: {
  properties: Property[];
  leads: DashboardLead[];
  tasks: Task[];
  users: User[];
}): Insight[] {
  const { properties, leads, tasks, users } = data;

  const insights: (Insight | null)[] = [
    detectStaledLeads(leads),
    detectSlowResponseTime(leads),
    detectRevenueMilestone(properties),
    detectHotLocation(leads, properties),
    detectLowConversionLocation(leads, properties),
    detectPipelineRisks(leads),
    detectBestPerformingDay(properties, leads, tasks),
    detectPriceRangeOpportunity(leads, properties),
  ];

  // Filter out null insights and sort by priority
  const validInsights = insights.filter((i): i is Insight => i !== null);

  // Sort by priority: high > medium > low
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  validInsights.sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
  );

  return validInsights;
}
