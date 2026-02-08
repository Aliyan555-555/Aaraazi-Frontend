/**
 * Dashboard Metrics Calculation Utilities
 *
 * Calculates all business health metrics from localStorage data.
 *
 * METRICS:
 * 1. Active Pipeline Value - Sum of deals in active negotiation
 * 2. Monthly Revenue - Completed deals this month
 * 3. Available Inventory - Properties ready to sell
 * 4. Conversion Rate - Leads that converted to contacts
 *
 * DATA SOURCES:
 * - Sell Cycles (for pipeline and revenue)
 * - Properties (for inventory)
 * - Leads V4 (for conversion)
 * - Contacts (for conversion)
 */

import { SellCycle, Property, Contact } from "../../../types";
import { LeadV4 } from "../../../types/leads";
import { DashboardMetrics } from "../types/dashboard.types";

/**
 * Calculate active pipeline value
 * Sum of all sell cycles in active negotiation stages
 */
export function calculateActivePipeline(sellCycles: SellCycle[]): number {
  const activeCycles = sellCycles.filter((cycle) =>
    ["listed", "offer-received", "under-contract"].includes(cycle.status),
  );

  return activeCycles.reduce((sum, cycle) => {
    // Use highest offer if exists, otherwise asking price
    const highestOffer =
      cycle.offers && cycle.offers.length > 0
        ? Math.max(...cycle.offers.map((o) => o.amount))
        : cycle.askingPrice;

    return sum + highestOffer;
  }, 0);
}

/**
 * Calculate active deal count
 * Count of sell cycles in negotiation stages
 */
export function calculateActiveDealCount(sellCycles: SellCycle[]): number {
  return sellCycles.filter((cycle) =>
    ["listed", "offer-received", "under-contract"].includes(cycle.status),
  ).length;
}

/**
 * Calculate monthly revenue
 * Sum of all deals completed this month
 */
export function calculateMonthlyRevenue(sellCycles: SellCycle[]): number {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const completedThisMonth = sellCycles.filter((cycle) => {
    if (cycle.status !== "sold" || !cycle.soldDate) return false;

    const saleDate = new Date(cycle.soldDate);
    return (
      saleDate.getMonth() === thisMonth && saleDate.getFullYear() === thisYear
    );
  });

  return completedThisMonth.reduce((sum, cycle) => {
    return sum + cycle.askingPrice;
  }, 0);
}

/**
 * Calculate revenue trend
 * Percentage change vs last month
 */
export function calculateRevenueTrend(sellCycles: SellCycle[]): {
  direction: "up" | "down" | "neutral";
  value: number;
} {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  // Last month
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const lastYear = thisMonth === 0 ? thisYear - 1 : thisYear;

  const thisMonthRevenue = sellCycles
    .filter((cycle) => {
      if (cycle.status !== "sold" || !cycle.soldDate) return false;
      const saleDate = new Date(cycle.soldDate);
      return (
        saleDate.getMonth() === thisMonth && saleDate.getFullYear() === thisYear
      );
    })
    .reduce((sum, c) => sum + c.askingPrice, 0);

  const lastMonthRevenue = sellCycles
    .filter((cycle) => {
      if (cycle.status !== "sold" || !cycle.soldDate) return false;
      const saleDate = new Date(cycle.soldDate);
      return (
        saleDate.getMonth() === lastMonth && saleDate.getFullYear() === lastYear
      );
    })
    .reduce((sum, c) => sum + c.askingPrice, 0);

  if (lastMonthRevenue === 0) {
    return { direction: "neutral", value: 0 };
  }

  const percentChange =
    ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;

  return {
    direction:
      percentChange > 0 ? "up" : percentChange < 0 ? "down" : "neutral",
    value: Math.abs(Math.round(percentChange)),
  };
}

/**
 * Calculate available inventory
 * Count of properties with status 'available'
 */
export function calculateAvailableInventory(properties: Property[]): number {
  return properties.filter((p) => p.status === "available").length;
}

/**
 * Calculate conversion rate
 * Percentage of leads V4 that converted to contacts
 */
export function calculateConversionRate(
  leads: LeadV4[],
  contacts: Contact[],
): {
  rate: number;
  convertedCount: number;
  totalLeads: number;
} {
  // Filter leads with conversionStatus = 'converted'
  const convertedLeads = leads.filter(
    (lead) =>
      lead.conversionStatus === "converted" && lead.convertedToContactId,
  );

  const totalLeads = leads.length;
  const convertedCount = convertedLeads.length;

  const rate = totalLeads > 0 ? (convertedCount / totalLeads) * 100 : 0;

  return {
    rate: Math.round(rate),
    convertedCount,
    totalLeads,
  };
}

/**
 * Calculate conversion trend
 * Percentage change vs last 30 days
 */
export function calculateConversionTrend(leads: LeadV4[]): {
  direction: "up" | "down" | "neutral";
  value: number;
} {
  const now = new Date();
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const last60Days = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  // Leads created in last 30 days
  const recent30 = leads.filter((l) => {
    const created = new Date(l.createdAt);
    return created >= last30Days;
  });

  // Leads created 30-60 days ago
  const previous30 = leads.filter((l) => {
    const created = new Date(l.createdAt);
    return created >= last60Days && created < last30Days;
  });

  const recent30Converted = recent30.filter(
    (l) => l.conversionStatus === "converted",
  ).length;
  const previous30Converted = previous30.filter(
    (l) => l.conversionStatus === "converted",
  ).length;

  const recent30Rate =
    recent30.length > 0 ? (recent30Converted / recent30.length) * 100 : 0;
  const previous30Rate =
    previous30.length > 0 ? (previous30Converted / previous30.length) * 100 : 0;

  if (previous30Rate === 0) {
    return { direction: "neutral", value: 0 };
  }

  const percentChange =
    ((recent30Rate - previous30Rate) / previous30Rate) * 100;

  return {
    direction:
      percentChange > 0 ? "up" : percentChange < 0 ? "down" : "neutral",
    value: Math.abs(Math.round(percentChange)),
  };
}

/**
 * Calculate pipeline trend
 * Percentage change vs last month
 */
export function calculatePipelineTrend(sellCycles: SellCycle[]): {
  direction: "up" | "down" | "neutral";
  value: number;
} {
  const now = new Date();
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Current active pipeline
  const currentActive = sellCycles.filter((cycle) =>
    ["listed", "offer-received", "under-contract"].includes(cycle.status),
  );

  // Active deals created in last 30 days
  const recentDeals = currentActive.filter((c) => {
    const created = new Date(c.listedDate || c.createdAt);
    return created >= last30Days;
  }).length;

  // Calculate trend based on recent activity
  const totalActive = currentActive.length;
  const growthRate = totalActive > 0 ? (recentDeals / totalActive) * 100 : 0;

  return {
    direction: growthRate > 20 ? "up" : growthRate < 10 ? "down" : "neutral",
    value: Math.round(growthRate),
  };
}

/**
 * Calculate all dashboard metrics
 * Main function that orchestrates all calculations
 */
export function calculateDashboardMetrics(
  sellCycles: SellCycle[],
  properties: Property[],
  leads: LeadV4[],
  contacts: Contact[],
): DashboardMetrics {
  const activePipeline = calculateActivePipeline(sellCycles);
  const monthlyRevenue = calculateMonthlyRevenue(sellCycles);
  const availableInventory = calculateAvailableInventory(properties);
  const conversionData = calculateConversionRate(leads, contacts);

  return {
    activePipelineValue: activePipeline,
    monthlyRevenue,
    availableInventory,
    conversionRate: conversionData.rate,
  };
}
