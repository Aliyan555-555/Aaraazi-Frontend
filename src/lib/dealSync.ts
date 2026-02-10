/**
 * Deal Auto-Sync System
 * Automatically syncs data between Deal, Sell Cycle, and Purchase Cycle
 *
 * When primary agent updates deal:
 * - Sync to Sell Cycle
 * - Sync to Purchase Cycle (if exists)
 * - Notify secondary agent (if exists)
 * - Update all linked entities
 */

import {
  Deal,
  DealPayment,
  DealDocument,
  CycleStatusType,
  PropertyStatus,
} from "../types";
import { getSellCycles, updateSellCycle } from "./sellCycle";
import { getPurchaseCycles, updatePurchaseCycle } from "./purchaseCycle";
import { getProperties, updateProperty } from "./data";
import { createNotification } from "./notifications";

/**
 * Sync deal to all linked cycles
 */
export const syncDealToAllCycles = (deal: Deal): void => {
  try {
    // Sync to Sell Cycle (if exists - may not exist for single-cycle purchase deals)
    if (deal.cycles.sellCycle) {
      syncToSellCycle(deal);
    }

    // Sync to Purchase Cycle (if exists - may not exist for single-cycle sell deals)
    if (deal.cycles.purchaseCycle) {
      syncToPurchaseCycle(deal);
    }

    // Update property status
    updatePropertyFromDeal(deal);

    // Update sync timestamp
    updateSyncTimestamp(deal.id);
  } catch (error) {
    console.error("Error syncing deal to cycles:", error);
    throw error;
  }
};

/**
 * Sync deal data to Sell Cycle
 */
const syncToSellCycle = (deal: Deal): void => {
  // Guard: Don't sync if no sell cycle exists (single-cycle purchase deals)
  if (!deal.cycles.sellCycle) {
    return;
  }

  const sellCycles = getSellCycles();
  const scLink = deal.cycles.sellCycle;
  if (!scLink) return;

  const sellCycle = sellCycles.find((sc) => sc.id === scLink.id);

  if (!sellCycle) {
    console.warn(`Sell cycle ${scLink.id} not found`);
    return;
  }

  // Update sell cycle status based on deal stage
  const newStatus = getDealStageToSellCycleStatus(
    deal.lifecycle.stage,
    deal.lifecycle.status,
  );

  const updates: any = {
    status: newStatus,
    updatedAt: new Date().toISOString(),
  };

  // If deal is completed, mark sell cycle as sold
  if (deal.lifecycle.status === "completed") {
    updates.status = "sold";
    updates.soldDate =
      deal.lifecycle.timeline.actualClosingDate || new Date().toISOString();
  }

  updateSellCycle(sellCycle.id, updates);
};

/**
 * Sync deal data to Purchase Cycle
 */
const syncToPurchaseCycle = (deal: Deal): void => {
  if (!deal.cycles.purchaseCycle) return;

  const purchaseCycles = getPurchaseCycles();
  const pcLink = deal.cycles.purchaseCycle;
  if (!pcLink) return;

  const purchaseCycle = purchaseCycles.find((pc) => pc.id === pcLink.id);

  if (!purchaseCycle) {
    console.warn(`Purchase cycle ${pcLink.id} not found`);
    return;
  }

  // Update purchase cycle status based on deal stage
  const newStatus = getDealStageToPurchaseCycleStatus(
    deal.lifecycle.stage,
    deal.lifecycle.status,
  );

  const updates: any = {
    status: newStatus,
    updatedAt: new Date().toISOString(),
  };

  // If deal is completed, mark purchase cycle as acquired
  if (deal.lifecycle.status === "completed") {
    updates.actualCloseDate =
      deal.lifecycle.timeline.actualClosingDate || new Date().toISOString();
  }

  updatePurchaseCycle(purchaseCycle.id, updates);
};

/**
 * Update property status based on deal
 */
const updatePropertyFromDeal = (deal: Deal): void => {
  // Get property ID from either sell cycle or purchase cycle
  let propertyId: string | undefined;

  if (deal.cycles.sellCycle) {
    propertyId = deal.cycles.sellCycle.propertyId;
  } else if (deal.cycles.purchaseCycle) {
    // For single-cycle purchase deals, we need to get the property ID differently
    // The property ID should be stored somewhere in the deal or we can get it from purchase cycle
    // For now, skip property update for single-cycle purchase deals
    console.log("Skipping property update for single-cycle purchase deal");
    return;
  }

  if (!propertyId) {
    console.warn("No property ID found in deal cycles");
    return;
  }

  const properties = getProperties();
  const property = properties.find((p) => p.id === propertyId);

  if (!property) {
    console.warn(`Property ${propertyId} not found`);
    return;
  }

  // Update property status based on deal stage
  const newStatus = getDealStageToPropertyStatus(
    deal.lifecycle.stage,
    deal.lifecycle.status,
  );

  updateProperty(property.id, {
    status: newStatus,
    updatedAt: new Date().toISOString(),
  });
};

/**
 * Map deal stage to sell cycle status
 */
const getDealStageToSellCycleStatus = (
  stage: string,
  dealStatus: string,
): CycleStatusType => {
  if (dealStatus === "cancelled") return "cancelled";
  if (dealStatus === "completed") return "sold";

  switch (stage) {
    case "offer-accepted":
    case "agreement-signing":
    case "documentation":
    case "payment-processing":
    case "handover-preparation":
    case "transfer-registration":
    case "final-handover":
      return "under-contract";
    default:
      return "under-contract";
  }
};

/**
 * Map deal stage to purchase cycle status
 */
const getDealStageToPurchaseCycleStatus = (
  stage: string,
  dealStatus: string,
): CycleStatusType => {
  if (dealStatus === "cancelled") return "cancelled";
  if (dealStatus === "completed") return "acquired";

  switch (stage) {
    case "offer-accepted":
      return "accepted";
    case "agreement-signing":
    case "documentation":
      return "due-diligence";
    case "payment-processing":
      return "financing";
    case "handover-preparation":
    case "transfer-registration":
    case "final-handover":
      return "closing";
    default:
      return "closing";
  }
};

/**
 * Map deal stage to property status
 */
const getDealStageToPropertyStatus = (
  stage: string,
  dealStatus: string,
): PropertyStatus => {
  if (dealStatus === "cancelled") return "available"; // Return to market
  if (dealStatus === "completed") return "sold";

  return "under-offer";
};

/**
 * Sync payment to both cycles and notify
 */
export const syncPaymentToCycles = (deal: Deal, payment: DealPayment): void => {
  try {
    // Mark payment as synced
    payment.syncedToPurchaseCycle = true;

    // Sync deal to all cycles
    syncDealToAllCycles(deal);

    // Notify secondary agent if exists
    if (deal.agents.secondary) {
      createNotification({
        userId: deal.agents.secondary.id,
        type: "DEAL_PAYMENT_UPDATED",
        title: "Payment Recorded",
        message: `${deal.agents.primary.name} recorded ${payment.type?.replace("-", " ") || "payment"} of PKR ${payment.amount.toLocaleString()}`,
        priority: "MEDIUM",
        entityType: "deal",
        entityId: deal.id,
      });
    }

    console.log(`Payment ${payment.id} synced to all cycles`);
  } catch (error) {
    console.error("Error syncing payment:", error);
    throw error;
  }
};

/**
 * Sync document to cycles and notify
 */
export const syncDocumentToCycles = (
  deal: Deal,
  document: DealDocument,
): void => {
  try {
    // Sync deal to all cycles
    syncDealToAllCycles(deal);

    // Notify secondary agent if exists
    if (deal.agents.secondary) {
      createNotification({
        userId: deal.agents.secondary.id,
        type: "DEAL_DOCUMENT_UPLOADED",
        title: "New Document Uploaded",
        message: `${deal.agents.primary.name} uploaded: ${document.name}`,
        priority: "LOW",
        entityType: "deal",
        entityId: deal.id,
      });
    }

    console.log(`Document ${document.id} synced to all cycles`);
  } catch (error) {
    console.error("Error syncing document:", error);
    throw error;
  }
};

/**
 * Sync stage progression to cycles and notify
 */
export const syncStageProgressionToCycles = (
  deal: Deal,
  newStage: string,
): void => {
  try {
    // Sync deal to all cycles
    syncDealToAllCycles(deal);

    // Notify secondary agent if exists
    if (deal.agents.secondary) {
      createNotification({
        userId: deal.agents.secondary.id,
        type: "DEAL_STAGE_UPDATED",
        title: "Deal Stage Updated",
        message: `${deal.agents.primary.name} progressed deal to: ${newStage.replace("-", " ")}`,
        priority: "MEDIUM",
        entityType: "deal",
        entityId: deal.id,
      });
    }

    // Notify primary agent
    createNotification({
      userId: deal.agents.primary.id,
      type: "DEAL_STAGE_UPDATED",
      title: "Deal Stage Updated",
      message: `Deal progressed to: ${newStage.replace("-", " ")}`,
      priority: "MEDIUM",
      entityType: "deal",
      entityId: deal.id,
    });

    console.log(`Stage progression to ${newStage} synced to all cycles`);
  } catch (error) {
    console.error("Error syncing stage progression:", error);
    throw error;
  }
};

/**
 * Update sync timestamp for a deal
 */
const updateSyncTimestamp = (dealId: string): void => {
  try {
    const deals = getDealsFromStorage();
    const deal = deals.find((d) => d.id === dealId);

    if (deal) {
      const now = new Date().toISOString();
      deal.sync.lastSyncedAt = now;
      deal.sync.sellCycleLastUpdated = now;

      if (deal.cycles.purchaseCycle) {
        deal.sync.purchaseCycleLastUpdated = now;
      }

      deal.sync.isInSync = true;
      saveDealsToStorage(deals);
    }
  } catch (error) {
    console.error("Error updating sync timestamp:", error);
  }
};

/**
 * Check if deal is in sync with cycles
 */
export const checkDealSyncStatus = (deal: Deal): boolean => {
  return deal.sync.isInSync;
};

/**
 * Force re-sync of a deal
 */
export const forceDealResync = (deal: Deal): void => {
  console.log(`Force re-syncing deal ${deal.dealNumber}`);
  syncDealToAllCycles(deal);
};

// Helper functions for storage
const DEALS_STORAGE_KEY = "estatemanager_deals";

const getDealsFromStorage = (): Deal[] => {
  try {
    const data = localStorage.getItem(DEALS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error reading deals from storage:", error);
    return [];
  }
};

const saveDealsToStorage = (deals: Deal[]): void => {
  try {
    localStorage.setItem(DEALS_STORAGE_KEY, JSON.stringify(deals));
  } catch (error) {
    console.error("Error saving deals to storage:", error);
    throw error;
  }
};
