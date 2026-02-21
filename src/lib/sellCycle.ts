/**
 * Sell Cycle Management Service - V3.0
 * Handles all operations related to selling properties
 */

import {
  SellCycle,
  Offer,
  Property,
  SharingSettings,
  PrivacySettings,
  CollaborationData,
} from "../types";
import { getProperties, updateProperty } from "./data";
import { transferOwnership } from "./ownership";
import { saveTransaction } from "./transactions";
import { syncPropertyStatusFromSellCycle } from "./propertyStatusSync";
import { formatPropertyAddress } from "./utils";
import { formatPKR } from "./currency";
import { createDealFromOffer, getDealById } from "./deals";
import { createNotification } from "./notifications";
import { getBuyerRequirementById } from "./buyerRequirements";
import {
  updatePurchaseCycle,
  createPurchaseCycleFromBuyerRequirement,
  markPurchaseCycleOfferAccepted,
  getPurchaseCycleByBuyerRequirement,
  getPurchaseCycleById,
} from "./purchaseCycle";
import { updateMatch } from "./smartMatching";

const SELL_CYCLES_KEY = "sell_cycles_v3";

/**
 * Get all sell cycles (with optional filtering by user)
 */
export function getSellCycles(userId?: string, userRole?: string): SellCycle[] {
  const json = localStorage.getItem(SELL_CYCLES_KEY);
  const cycles: SellCycle[] = json ? JSON.parse(json) : [];

  // Admin sees everything
  if (!userId || userRole === "admin") {
    return cycles;
  }

  // Agents see:
  // 1. Their own cycles (regardless of sharing status)
  // 2. ALL shared cycles from other agents in the organization
  return cycles.filter(
    (c: SellCycle) =>
      c.agentId === userId || // My own cycles
      c.sharing?.isShared === true, // All shared cycles from other agents
  );
}

/**
 * Get a specific sell cycle by ID
 */
export function getSellCycleById(id: string): SellCycle | undefined {
  const cycles = getSellCycles();
  return cycles.find((c) => c.id === id);
}

/**
 * Get all sell cycles for a specific property
 * ASSET-CENTRIC: Returns ALL cycles including completed ones for full history
 */
export function getSellCyclesByProperty(propertyId: string): SellCycle[] {
  const cycles = getSellCycles();
  // Return ALL cycles for the property - never hide completed/sold cycles
  // This preserves the complete transaction history (Asset-Centric principle)
  return cycles.filter((c) => c.propertyId === propertyId);
}

/**
 * Create a new sell cycle
 */
export function createSellCycle(data: Partial<SellCycle>): SellCycle {
  const cycles = getSellCycles();

  const newCycle: SellCycle = {
    id: `sell_${Date.now()}`,
    propertyId: data.propertyId!,

    // Seller info
    sellerType: data.sellerType || "client",
    sellerId: data.sellerId!,
    sellerName: data.sellerName!,

    // Agent
    agentId: data.agentId!,
    agentName: data.agentName!,
    sharedWith: data.sharedWith || [],

    // Marketing
    askingPrice: data.askingPrice!,
    commissionRate: data.commissionRate || 2,
    commissionType: data.commissionType || "percentage",
    title: data.title || "",
    description: data.description || "",
    images: data.images || [],
    amenities: data.amenities || [],
    videoTourUrl: data.videoTourUrl,
    virtualTourUrl: data.virtualTourUrl,

    // Publishing
    isPublished: data.isPublished || false,
    publishedOn: data.publishedOn || [],
    publishedDate: data.isPublished
      ? new Date().toISOString().split("T")[0]
      : undefined,

    // Status
    status: "listed",

    // Offers
    offers: [],

    // Dates
    listedDate: new Date().toISOString().split("T")[0],
    expectedCloseDate: data.expectedCloseDate,

    // Notes
    notes: data.notes,
    tags: data.tags || [],
    internalNotes: data.internalNotes,

    // Metadata
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: data.agentId!,
  };

  cycles.push(newCycle);
  localStorage.setItem(SELL_CYCLES_KEY, JSON.stringify(cycles));

  // Update property to link this sell cycle and sync price
  const properties = getProperties();
  const property = properties.find((p) => p.id === data.propertyId);
  if (property) {
    const updatedProperty: Partial<Property> = {
      activeSellCycleIds: [...(property.activeSellCycleIds || []), newCycle.id],
      // CRITICAL FIX: Update property price to reflect the asking price from the active sell cycle
      price: data.askingPrice || property.price,
    };
    updateProperty(data.propertyId!, updatedProperty);
  }

  // CRITICAL: Sync property status based on the new cycle
  syncPropertyStatusFromSellCycle(newCycle.id);

  // Dispatch event so UI can update
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("cycleCreated", {
        detail: {
          propertyId: data.propertyId,
          cycleId: newCycle.id,
          cycleType: "sell",
        },
      }),
    );
  }

  return newCycle;
}

/**
 * Update an existing sell cycle
 */
export function updateSellCycle(id: string, updates: Partial<SellCycle>): void {
  const cycles = getSellCycles();
  const index = cycles.findIndex((c) => c.id === id);

  if (index !== -1) {
    const cycle = cycles[index];
    cycles[index] = {
      ...cycle,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(SELL_CYCLES_KEY, JSON.stringify(cycles));

    // CRITICAL FIX: Update property price if askingPrice changed and this is an active cycle
    if (
      updates.askingPrice !== undefined &&
      updates.askingPrice !== cycle.askingPrice
    ) {
      const property = getProperties().find((p) => p.id === cycle.propertyId);
      if (property && property.activeSellCycleIds?.includes(id)) {
        // Only update if this is the first/primary active cycle
        const activeCycleId = property.activeSellCycleIds[0];
        if (activeCycleId === id) {
          updateProperty(cycle.propertyId, { price: updates.askingPrice });
        }
      }
    }

    // 🔄 AUTO-SYNC: Update property status if cycle status changed
    if (updates.status) {
      try {
        syncPropertyStatusFromSellCycle(id);
      } catch (error) {
        console.error("Error syncing property status from sell cycle:", error);
        // Don't throw - cycle update should succeed even if sync fails
      }
    }

    // Dispatch event so UI can update
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("cycleUpdated", {
          detail: { cycleId: id, cycleType: "sell" },
        }),
      );
    }
  }
}

/**
 * Add an offer to a sell cycle
 */
export function addOffer(sellCycleId: string, offer: Partial<Offer>): Offer {
  const cycle = getSellCycleById(sellCycleId);
  if (!cycle) {
    throw new Error("Sell cycle not found");
  }

  // CRITICAL VALIDATION: Validate offer data before creating
  if (!offer.offerAmount || offer.offerAmount <= 0) {
    throw new Error("Offer amount must be greater than 0");
  }

  if (!offer.buyerName || offer.buyerName.trim() === "") {
    throw new Error("Buyer name is required");
  }

  // CRITICAL: Validate token amount doesn't exceed offer amount
  if (
    offer.tokenAmount !== undefined &&
    offer.tokenAmount > offer.offerAmount
  ) {
    throw new Error("Token money cannot exceed offer amount");
  }

  const newOffer: Offer = {
    id: `offer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    buyerId: offer.buyerId!,
    buyerName: offer.buyerName!,
    buyerContact: offer.buyerContact,
    offerAmount: offer.offerAmount!,
    amount: offer.offerAmount,
    tokenAmount: offer.tokenAmount,
    conditions: offer.conditions,
    offeredDate: new Date().toISOString().split("T")[0],
    submittedDate: new Date().toISOString().split("T")[0],
    expiryDate: offer.expiryDate,
    status: "pending",
    notes: offer.notes,
    agentNotes: offer.agentNotes,

    // V3.0: Track buyer requirement source and buyer agent
    buyerRequirementId: offer.buyerRequirementId,
    sourceType:
      offer.sourceType ||
      (offer.buyerRequirementId ? "buyer-requirement" : "manual"),
    buyerAgentId: offer.buyerAgentId, // Buyer's agent (for Purchase Cycle creation later)
    buyerAgentName: offer.buyerAgentName,

    // CRITICAL FIX: Link to purchase cycle if provided
    linkedPurchaseCycleId: offer.linkedPurchaseCycleId,

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updatedOffers = [...cycle.offers, newOffer];
  updateSellCycle(sellCycleId, {
    offers: updatedOffers,
    status: cycle.status === "listed" ? "offer-received" : cycle.status,
  });

  // Dispatch event so UI can update
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("offerCreated", {
        detail: { sellCycleId, offerId: newOffer.id },
      }),
    );
  }

  return newOffer;
}

/**
 * Update an existing offer
 */
export function updateOffer(
  sellCycleId: string,
  offerId: string,
  updates: Partial<Offer>,
): void {
  const cycle = getSellCycleById(sellCycleId);
  if (!cycle) {
    throw new Error("Sell cycle not found");
  }

  const updatedOffers = cycle.offers.map((o) =>
    o.id === offerId
      ? { ...o, ...updates, updatedAt: new Date().toISOString() }
      : o,
  );

  // Update sell cycle
  updateSellCycle(sellCycleId, { offers: updatedOffers });

  // ============================================================================
  // CRITICAL FIX: Sync offer acceptance back to linked purchase cycle
  // If this offer is linked to a purchase cycle and is being accepted, update it
  // ============================================================================
  if (updates.status === "accepted") {
    try {
      const acceptedOffer = updatedOffers.find((o) => o.id === offerId);

      if (acceptedOffer?.linkedPurchaseCycleId) {
        console.log("🔗 Syncing offer acceptance to purchase cycle");
        console.log(`   - Offer ID: ${offerId}`);
        console.log(
          `   - Purchase Cycle: ${acceptedOffer.linkedPurchaseCycleId}`,
        );
        console.log(`   - Accepted Amount: ${acceptedOffer.offerAmount}`);

        // Update purchase cycle status to accepted
        updatePurchaseCycle(acceptedOffer.linkedPurchaseCycleId, {
          status: "accepted",
          negotiatedPrice: acceptedOffer.offerAmount,
          acceptanceDate: new Date().toISOString().split("T")[0],
        });

        console.log(
          '✅ Purchase cycle successfully updated to "accepted" status',
        );
      }
    } catch (error) {
      console.error(
        "❌ Error syncing offer acceptance to purchase cycle:",
        error,
      );
      // Don't throw - offer is still updated even if sync fails
    }
  }
}

/**
 * Accept an offer
 * Automatically creates Purchase Cycle (if from buyer requirement) and Deal
 */
export function acceptOffer(sellCycleId: string, offerId: string): void {
  const cycle = getSellCycleById(sellCycleId);
  if (!cycle) {
    throw new Error("Sell cycle not found");
  }

  const offer = cycle.offers.find((o) => o.id === offerId);
  if (!offer) {
    throw new Error("Offer not found");
  }

  // Update sell cycle status and offers
  const updatedOffers = cycle.offers.map((o) => ({
    ...o,
    status: o.id === offerId ? ("accepted" as const) : ("rejected" as const),
  }));

  updateSellCycle(sellCycleId, {
    offers: updatedOffers,
    acceptedOfferId: offerId,
    status: "under-contract",
  });

  // AUTO-CREATE PURCHASE CYCLE + DEAL when offer is accepted
  try {
    console.log("🚀 Starting deal creation process...");
    console.log(`   - Sell Cycle ID: ${sellCycleId}`);
    console.log(`   - Offer ID: ${offerId}`);

    // Get updated cycle
    const updatedCycle = getSellCycleById(sellCycleId);
    if (!updatedCycle) {
      throw new Error("Updated sell cycle not found after offer acceptance");
    }

    console.log("✅ Updated cycle retrieved");

    // Get property
    const properties = getProperties();
    const property = properties.find((p) => p.id === updatedCycle.propertyId);
    if (!property) {
      throw new Error(`Property not found: ${updatedCycle.propertyId}`);
    }

    console.log(
      "✅ Property retrieved:",
      property.title || formatPropertyAddress(property.address),
    );

    // CRITICAL FIX: Check THREE scenarios for purchase cycle
    let purchaseCycle = undefined;
    let buyerRequirement = undefined;

    // SCENARIO 1: Offer came from a direct purchase cycle (linkedPurchaseCycleId)
    if (offer.linkedPurchaseCycleId) {
      console.log("🔗 Offer is linked to an existing purchase cycle");
      purchaseCycle = getPurchaseCycleById(offer.linkedPurchaseCycleId);

      if (purchaseCycle) {
        console.log(`✅ Found linked purchase cycle: ${purchaseCycle.id}`);
        console.log(
          `   - Purchaser: ${purchaseCycle.purchaserName} (${purchaseCycle.purchaserType})`,
        );

        // Update purchase cycle status to "accepted"
        markPurchaseCycleOfferAccepted(purchaseCycle.id, offer.offerAmount);
      }
    }
    // SCENARIO 2: Offer came from a buyer requirement
    else if (offer.buyerRequirementId && offer.buyerAgentId) {
      console.log("🔗 Offer came from buyer requirement");
      // Find the buyer requirement
      buyerRequirement = getBuyerRequirementById(offer.buyerRequirementId);

      // Check if Purchase Cycle already exists (shouldn't, but check anyway)
      purchaseCycle = getPurchaseCycleByBuyerRequirement(
        offer.buyerRequirementId,
        updatedCycle.propertyId,
      );

      // If Purchase Cycle doesn't exist, create it NOW
      if (!purchaseCycle && buyerRequirement) {
        console.log("✨ Creating Purchase Cycle on offer acceptance...");
        purchaseCycle = createPurchaseCycleFromBuyerRequirement(
          buyerRequirement,
          property,
          updatedCycle.id,
          offer.buyerAgentId,
          offer.buyerAgentName || "Unknown Agent",
        );
        console.log(`✅ Purchase Cycle created: ${purchaseCycle.id}`);
      }

      // Update purchase cycle status to "accepted"
      if (purchaseCycle) {
        markPurchaseCycleOfferAccepted(purchaseCycle.id, offer.offerAmount);
      }
    }
    // SCENARIO 3: Direct offer (no purchase cycle, no buyer requirement)
    else {
      console.log("📋 Direct offer - no purchase cycle or buyer requirement");
    }

    console.log("🎯 Creating deal from offer...");

    // Create deal - supports both dual-cycle and single-cycle scenarios
    // Dual-cycle: When offer comes from a buyer requirement (has purchaseCycle)
    // Single-cycle: Direct offers from buyers (no purchaseCycle)

    // Create the deal with available cycle(s)
    // NOTE: createDealFromOffer saves the deal internally
    const deal = createDealFromOffer(
      updatedCycle,
      offer,
      updatedCycle.agentId,
      purchaseCycle, // undefined for single-cycle deals
    );

    if (!deal) {
      throw new Error("createDealFromOffer returned null or undefined");
    }

    // CRITICAL: Final update to Sell Cycle to link the deal and set winning purchase cycle
    const finalOffers = updatedCycle.offers.map((o) => ({
      ...o,
      status:
        o.id === offerId
          ? ("accepted" as const)
          : o.status === "pending"
            ? ("rejected" as const)
            : o.status,
    }));

    updateSellCycle(sellCycleId, {
      linkedDealId: deal.id,
      createdDealId: deal.id,
      winningPurchaseCycleId: purchaseCycle?.id,
      acceptedOfferId: offerId,
      offers: finalOffers,
      status: "under-contract",
    });

    // Update Purchase Cycle with deal link if it exists
    if (purchaseCycle) {
      updatePurchaseCycle(purchaseCycle.id, {
        linkedDealId: deal.id,
        createdDealId: deal.id,
        linkedSellCycleId: sellCycleId,
      });
    }

    if (!purchaseCycle) {
      console.log("✅ Single-cycle deal created (no purchase cycle)");
      console.log(`   - Deal ID: ${deal.id}`);
      console.log(`   - Deal Number: ${deal.dealNumber}`);
      console.log(`   - Sell Cycle: ${updatedCycle.id}`);
    } else {
      console.log(`✅ Dual-cycle deal created`);
      console.log(`   - Deal ID: ${deal.id}`);
      console.log(`   - Deal Number: ${deal.dealNumber}`);
      console.log(`   - Sell Cycle: ${updatedCycle.id}`);
      console.log(`   - Purchase Cycle: ${purchaseCycle.id}`);
    }

    // Verify the deal was saved
    const savedDeal = getDealById(deal.id);
    if (!savedDeal) {
      throw new Error("Deal was created but not found in storage after save");
    }
    console.log("✅ Deal verified in storage");

    // createDealFromOffer already creates notifications, but let's add specific ones for this workflow
    // Send notifications to both agents
    createNotification({
      userId: updatedCycle.agentId,
      type: "DEAL_CREATED",
      priority: "HIGH",
      title: "Deal Auto-Created",
      message: `Deal ${deal.dealNumber} has been automatically created from the accepted offer.`,
      entityType: "deal",
      entityId: deal.id,
      actionLabel: "View Deal",
      actionType: "navigate",
    });

    // Notify secondary agent if exists
    if (deal.agents.secondary) {
      createNotification({
        userId: deal.agents.secondary.id,
        type: "DEAL_CREATED",
        priority: "HIGH",
        title: "New Deal - Buyer Agent",
        message: `You've been added as buyer agent for deal ${deal.dealNumber}.`,
        entityType: "deal",
        entityId: deal.id,
        actionLabel: "View Deal",
        actionType: "navigate",
      });
    }

    console.log("🎉 Deal creation process completed successfully!");
  } catch (error) {
    console.error(
      "❌ ERROR: Failed to auto-create purchase cycle and deal:",
      error,
    );
    console.error("Stack trace:", error);
    // CRITICAL: Throw error so UI can handle it properly
    throw new Error(
      `Deal creation failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Reject an offer
 */
export function rejectOffer(sellCycleId: string, offerId: string): void {
  const cycle = getSellCycleById(sellCycleId);
  if (!cycle) {
    throw new Error("Sell cycle not found");
  }

  const updatedOffers = cycle.offers.map((o) => ({
    ...o,
    status: o.id === offerId ? ("rejected" as const) : o.status,
  }));

  updateSellCycle(sellCycleId, { offers: updatedOffers });
}

/**
 * Close/Complete a sell cycle (property sold)
 * This handles ownership transfer and transaction creation
 */
export function completeSale(
  id: string,
  soldPrice: number,
  buyerId: string,
  buyerName: string,
): { success: boolean; transactionId?: string; error?: string } {
  try {
    const cycle = getSellCycleById(id);
    if (!cycle) {
      return { success: false, error: "Sell cycle not found" };
    }

    // Calculate commission
    let commissionAmount = 0;
    if (cycle.commissionType === "percentage") {
      commissionAmount = (soldPrice * cycle.commissionRate) / 100;
    } else {
      commissionAmount = cycle.commissionRate;
    }

    // Create transaction record
    const transactionId = `txn_${Date.now()}`;
    const transaction = {
      id: transactionId,
      propertyId: cycle.propertyId,
      type: "sell" as const,
      agreedPrice: soldPrice,
      startDate: new Date().toISOString(),
      agentId: cycle.agentId,
      buyerName,
      buyerContactId: buyerId,
      sellerName: cycle.sellerName,
      sellerContactId: cycle.sellerId,
      acceptedOfferAmount: soldPrice,
      commissionAmount,
      acceptedDate: new Date().toISOString().split("T")[0],
      status: "completed" as const,
      sellCycleId: id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveTransaction(transaction);

    // Transfer ownership to buyer
    transferOwnership(
      cycle.propertyId,
      buyerId,
      buyerName,
      "client",
      transactionId,
      undefined,
      soldPrice,
      `Sold via sell cycle. Agent: ${cycle.agentName}. Price: ${soldPrice}`,
    );

    // Update sell cycle
    updateSellCycle(id, {
      status: "sold",
      soldDate: new Date().toISOString().split("T")[0],
    });

    // Remove from property's active cycles and add to history
    const properties = getProperties();
    const property = properties.find((p) => p.id === cycle.propertyId);
    if (property) {
      const updatedActiveSellCycles = (
        property.activeSellCycleIds || []
      ).filter((cId) => cId !== id);
      const updatedProperty: Partial<Property> = {
        activeSellCycleIds: updatedActiveSellCycles,
        cycleHistory: {
          ...property.cycleHistory,
          sellCycles: [...(property.cycleHistory?.sellCycles || []), id],
        },
        transactionIds: [...(property.transactionIds || []), transactionId],
      };
      updateProperty(cycle.propertyId, updatedProperty);
    }

    return { success: true, transactionId };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * DEPRECATED: Use completeSale() instead
 * Close/Complete a sell cycle (property sold)
 */
export function closeSellCycle(
  id: string,
  soldPrice: number,
  buyerId: string,
  buyerName: string,
): void {
  // Call the new comprehensive function
  completeSale(id, soldPrice, buyerId, buyerName);
}

/**
 * Cancel a sell cycle
 */
export function cancelSellCycle(id: string, reason?: string): void {
  updateSellCycle(id, {
    status: "cancelled",
    notes: reason ? `Cancelled: ${reason}` : undefined,
  });

  const cycle = getSellCycleById(id);
  if (cycle) {
    // Remove from property's active cycles
    const properties = getProperties();
    const property = properties.find((p) => p.id === cycle.propertyId);
    if (property) {
      const updatedActiveSellCycles = (
        property.activeSellCycleIds || []
      ).filter((cId) => cId !== id);
      const updatedProperty: Partial<Property> = {
        activeSellCycleIds: updatedActiveSellCycles,
        cycleHistory: {
          ...property.cycleHistory,
          sellCycles: [...(property.cycleHistory?.sellCycles || []), id],
        },
      };
      updateProperty(cycle.propertyId, updatedProperty);
    }
  }
}

/**
 * Share sell cycle with other agents
 */
export function shareSellCycle(id: string, agentIds: string[]): void {
  const cycle = getSellCycleById(id);
  if (!cycle) {
    throw new Error("Sell cycle not found");
  }

  const uniqueAgents = Array.from(new Set([...cycle.sharedWith, ...agentIds]));
  updateSellCycle(id, { sharedWith: uniqueAgents });
}

/**
 * Unshare sell cycle from agents
 */
export function unshareSellCycle(id: string, agentIds: string[]): void {
  const cycle = getSellCycleById(id);
  if (!cycle) {
    throw new Error("Sell cycle not found");
  }

  const updatedSharedWith = cycle.sharedWith.filter(
    (aId) => !agentIds.includes(aId),
  );
  updateSellCycle(id, { sharedWith: updatedSharedWith });
}

/**
 * Get sell cycle statistics
 */
export function getSellCycleStats(userId?: string, userRole?: string) {
  const cycles = getSellCycles(userId, userRole);

  return {
    total: cycles.length,
    listed: cycles.filter((c) => c.status === "listed").length,
    offerReceived: cycles.filter((c) => c.status === "offer-received").length,
    negotiation: cycles.filter((c) => c.status === "negotiation").length,
    underContract: cycles.filter((c) => c.status === "under-contract").length,
    sold: cycles.filter((c) => c.status === "sold").length,
    cancelled: cycles.filter((c) => c.status === "cancelled").length,
    totalOffers: cycles.reduce((sum, c) => sum + c.offers.length, 0),
    averageOffers:
      cycles.length > 0
        ? cycles.reduce((sum, c) => sum + c.offers.length, 0) / cycles.length
        : 0,
  };
}

/**
 * V3.0: Get all offers sent from a buyer requirement
 * Returns offers with their associated sell cycle info
 */
export function getOffersByBuyerRequirement(requirementId: string): Array<{
  offer: Offer;
  sellCycle: SellCycle;
  propertyId: string;
}> {
  const cycles = getSellCycles();
  const results: Array<{
    offer: Offer;
    sellCycle: SellCycle;
    propertyId: string;
  }> = [];

  cycles.forEach((cycle) => {
    const matchingOffers = cycle.offers.filter(
      (offer) => offer.buyerRequirementId === requirementId,
    );

    matchingOffers.forEach((offer) => {
      results.push({
        offer,
        sellCycle: cycle,
        propertyId: cycle.propertyId,
      });
    });
  });

  return results;
}

/**
 * V3.0: Get the latest offer for a specific property from a buyer requirement
 */
export function getLatestOfferForProperty(
  requirementId: string,
  propertyId: string,
): { offer: Offer; sellCycleId: string } | null {
  const cycles = getSellCyclesByProperty(propertyId);

  for (const cycle of cycles) {
    const offers = cycle.offers.filter(
      (offer) => offer.buyerRequirementId === requirementId,
    );

    if (offers.length > 0) {
      // Return the most recent offer
      const latestOffer = offers.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0];

      return {
        offer: latestOffer,
        sellCycleId: cycle.id,
      };
    }
  }

  return null;
}

// ============================================
// SHARING FUNCTIONALITY (Phase 1)
// ============================================

/**
 * Toggle sharing for a sell cycle
 */
export function toggleSellCycleSharing(
  id: string,
  isShared: boolean,
  userId: string,
  userName: string,
): void {
  const cycle = getSellCycleById(id);
  if (!cycle) {
    throw new Error("Sell cycle not found");
  }

  const now = new Date().toISOString();

  const sharing: SharingSettings = {
    isShared,
    sharedAt: isShared ? now : undefined,
    shareLevel: isShared ? "organization" : "none",
    shareHistory: [
      ...(cycle.sharing?.shareHistory || []),
      {
        action: isShared ? "shared" : "unshared",
        timestamp: now,
        userId,
        userName,
      },
    ],
  };

  const privacy: PrivacySettings = {
    hideOwnerDetails: true,
    hideNegotiations: true,
    hideCommissions: true,
    allowManagerView: true,
  };

  const collaboration: CollaborationData = cycle.collaboration || {
    viewCount: 0,
    viewedBy: [],
    inquiries: [],
  };

  updateSellCycle(id, {
    sharing,
    privacy,
    collaboration,
  });
}

/**
 * Track view of a shared sell cycle
 */
export function trackSellCycleView(id: string, viewerId: string): void {
  const cycle = getSellCycleById(id);
  if (!cycle || !cycle.sharing?.isShared) {
    return; // Only track views for shared cycles
  }

  const viewedBy = cycle.collaboration?.viewedBy || [];
  if (!viewedBy.includes(viewerId) && viewerId !== cycle.agentId) {
    updateSellCycle(id, {
      collaboration: {
        ...cycle.collaboration,
        viewCount: (cycle.collaboration?.viewCount || 0) + 1,
        viewedBy: [...viewedBy, viewerId],
        lastViewedAt: new Date().toISOString(),
      },
    });
  }
}

// ============================================
// CROSS-AGENT OFFER FUNCTIONALITY (Phase 2)
// ============================================

/**
 * Submit a cross-agent offer (from another agent's buyer)
 */
export function submitCrossAgentOffer(
  sellCycleId: string,
  offerData: {
    amount: number;
    buyerId: string;
    buyerName: string;
    buyerContact: string;
    buyerEmail?: string;
    submittedByAgentId: string;
    submittedByAgentName: string;
    submittedByAgentContact?: string;
    fromRequirementId?: string;
    matchId?: string;
    matchScore?: number;
    buyerNotes?: string;
    agentNotes?: string;
    coordinationRequired?: boolean;
  },
): string {
  const cycle = getSellCycleById(sellCycleId);
  if (!cycle) {
    throw new Error("Sell cycle not found");
  }

  // Verify cycle is shared
  if (!cycle.sharing?.isShared) {
    throw new Error("Cannot submit offer - cycle is not shared");
  }

  const offerId = `offer_${Date.now()}`;
  const now = new Date().toISOString();

  const newOffer: Offer = {
    id: offerId,
    buyerId: offerData.buyerId,
    buyerName: offerData.buyerName,
    buyerContact: offerData.buyerContact,
    buyerEmail: offerData.buyerEmail,
    amount: offerData.amount,
    offerAmount: offerData.amount,
    status: "pending",
    submittedDate: now.split("T")[0],
    offeredDate: now.split("T")[0],
    notes: offerData.buyerNotes,

    // Cross-agent tracking
    submittedByAgentId: offerData.submittedByAgentId,
    submittedByAgentName: offerData.submittedByAgentName,
    submittedByAgentContact: offerData.submittedByAgentContact,
    fromRequirementId: offerData.fromRequirementId,
    matchId: offerData.matchId,
    matchScore: offerData.matchScore,
    submittedVia: "match",
    agentNotes: offerData.agentNotes,
    coordinationRequired: offerData.coordinationRequired,

    createdAt: now,
    updatedAt: now,
  };

  // Add offer to cycle
  const updatedOffers = [...cycle.offers, newOffer];
  updateSellCycle(sellCycleId, {
    offers: updatedOffers,
    status: "negotiation", // Move to negotiation status
  });

  // Update match status if this was from a match
  if (offerData.matchId) {
    try {
      updateMatch(offerData.matchId, {
        status: "offer-submitted",
        offerId: offerId,
      });
    } catch (error) {
      console.error("Error updating match status:", error);
      // Don't fail the offer submission if match update fails
    }
  }

  // Send notification to listing agent
  if (typeof window !== "undefined") {
    try {
      createNotification({
        userId: cycle.agentId,
        type: "OFFER_RECEIVED",
        title: "New Cross-Agent Offer Received",
        message: `${offerData.submittedByAgentName} submitted an offer of ${formatPKR(offerData.amount)} for ${cycle.title || "your listing"}`,
        priority: "HIGH",
        entityType: "sellCycle",
        entityId: sellCycleId,
        actionUrl: `/sell-cycles/${sellCycleId}`,
        metadata: {
          offerId,
          offerAmount: offerData.amount,
          fromAgent: offerData.submittedByAgentName,
          matchScore: offerData.matchScore,
        },
      });
    } catch (error) {
      console.error("Error creating notification:", error);
      // Don't fail the offer submission if notification fails
    }
  }

  return offerId;
}

/**
 * Accept a cross-agent offer
 */
export function acceptCrossAgentOffer(
  sellCycleId: string,
  offerId: string,
  acceptedBy: string,
): void {
  const cycle = getSellCycleById(sellCycleId);
  if (!cycle) {
    throw new Error("Sell cycle not found");
  }

  const offer = cycle.offers.find((o) => o.id === offerId);
  if (!offer) {
    throw new Error("Offer not found");
  }

  // Update offer status
  updateOffer(sellCycleId, offerId, {
    status: "accepted",
    responseDate: new Date().toISOString().split("T")[0],
  });

  // Update match if this was from a match
  if (offer.matchId) {
    try {
      updateMatch(offer.matchId, {
        status: "accepted",
      });
    } catch (error) {
      console.error("Error updating match status:", error);
    }
  }

  // Send notification to submitting agent
  if (offer.submittedByAgentId && typeof window !== "undefined") {
    try {
      createNotification({
        userId: offer.submittedByAgentId,
        type: "OFFER_ACCEPTED",
        title: "🎉 Offer Accepted!",
        message: `Your offer of ${formatPKR(offer.amount)} for ${cycle.title || "the property"} was accepted`,
        priority: "HIGH",
        entityType: "sellCycle",
        entityId: sellCycleId,
        actionUrl: `/sell-cycles/${sellCycleId}`,
        metadata: {
          offerId,
          offerAmount: offer.amount,
          listingAgent: cycle.agentName,
        },
      });
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  }
}

/**
 * Reject a cross-agent offer
 */
export function rejectCrossAgentOffer(
  sellCycleId: string,
  offerId: string,
  reason?: string,
): void {
  const cycle = getSellCycleById(sellCycleId);
  if (!cycle) {
    throw new Error("Sell cycle not found");
  }

  const offer = cycle.offers.find((o) => o.id === offerId);
  if (!offer) {
    throw new Error("Offer not found");
  }

  // Update offer status
  updateOffer(sellCycleId, offerId, {
    status: "rejected",
    responseDate: new Date().toISOString().split("T")[0],
    listingAgentNotes: reason,
  });

  // Send notification to submitting agent
  if (offer.submittedByAgentId && typeof window !== "undefined") {
    try {
      createNotification({
        userId: offer.submittedByAgentId,
        type: "OFFER_REJECTED",
        title: "Offer Not Accepted",
        message: `Your offer of ${formatPKR(offer.amount)} for ${cycle.title || "the property"} was not accepted`,
        priority: "MEDIUM",
        entityType: "sellCycle",
        entityId: sellCycleId,
        actionUrl: `/sell-cycles/${sellCycleId}`,
        metadata: {
          offerId,
          offerAmount: offer.amount,
          reason: reason || "No reason provided",
        },
      });
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  }
}

/**
 * Get all offers submitted by a specific agent across all sell cycles
 */
export function getOffersSubmittedByAgent(agentId: string): any[] {
  const cycles = getSellCycles();
  const offersWithCycles: any[] = [];

  cycles.forEach((cycle) => {
    const agentOffers = cycle.offers.filter(
      (offer) => offer.submittedByAgentId === agentId,
    );

    agentOffers.forEach((offer) => {
      offersWithCycles.push({
        ...offer,
        cycleId: cycle.id,
        cycleTitle: cycle.title,
        propertyId: cycle.propertyId,
        listingAgentId: cycle.agentId,
        listingAgentName: cycle.agentName,
      });
    });
  });

  return offersWithCycles.sort(
    (a, b) =>
      new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime(),
  );
}
