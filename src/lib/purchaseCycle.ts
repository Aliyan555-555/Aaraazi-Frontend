/**
 * Purchase Cycle Management Service - V3.0
 * Handles all three types of purchases: Agency, Investor, Client
 */

import {
  PurchaseCycle,
  Property,
  PurchaserType,
  BuyerRequirement,
} from "../types";
import { getProperties, updateProperty } from "./data";
import { transferOwnership } from "./ownership";
import { saveTransaction } from "./transactions";
import {
  getSellCycleById,
  getSellCyclesByProperty,
  addOffer,
} from "./sellCycle";
import { syncPropertyStatusFromPurchaseCycle } from "./propertyStatusSync";
import { createDealFromPurchaseCycle } from "./deals";
import { createNotification } from "./notifications";

const PURCHASE_CYCLES_KEY = "purchase_cycles_v3";

/**
 * Get all purchase cycles (with optional filtering by user)
 */
export function getPurchaseCycles(
  userId?: string,
  userRole?: string,
): PurchaseCycle[] {
  const json = localStorage.getItem(PURCHASE_CYCLES_KEY);
  const cycles: PurchaseCycle[] = json ? JSON.parse(json) : [];

  // Admin sees everything
  if (!userId || userRole === "admin") {
    return cycles;
  }

  // Agents see only their cycles
  return cycles.filter((c: PurchaseCycle) => c.agentId === userId);
}

/**
 * Get a specific purchase cycle by ID
 */
export function getPurchaseCycleById(id: string): PurchaseCycle | undefined {
  const cycles = getPurchaseCycles();
  return cycles.find((c) => c.id === id);
}

/**
 * Get all purchase cycles for a specific property
 * ASSET-CENTRIC: Returns ALL cycles including completed ones for full history
 */
export function getPurchaseCyclesByProperty(
  propertyId: string,
): PurchaseCycle[] {
  const cycles = getPurchaseCycles();
  // Return ALL cycles for the property - never hide completed/acquired cycles
  // This preserves the complete transaction history (Asset-Centric principle)
  return cycles.filter((c) => c.propertyId === propertyId);
}

/**
 * Get purchase cycles by purchaser type
 */
export function getPurchaseCyclesByType(
  type: PurchaserType,
  userId?: string,
  userRole?: string,
): PurchaseCycle[] {
  const cycles = getPurchaseCycles(userId, userRole);
  return cycles.filter((c) => c.purchaserType === type);
}

/**
 * Create a new purchase cycle
 */
export function createPurchaseCycle(
  data: Partial<PurchaseCycle>,
): PurchaseCycle {
  const cycles = getPurchaseCycles();

  const newCycle: PurchaseCycle = {
    id: `purchase_${Date.now()}`,
    propertyId: data.propertyId!,

    // Purchaser info (V3.0: KEY FEATURE!)
    purchaserType: data.purchaserType!,
    purchaserId: data.purchaserId!,
    purchaserName: data.purchaserName!,

    // Seller info
    sellerId: data.sellerId!,
    sellerName: data.sellerName!,
    sellerContact: data.sellerContact!,
    sellerType: data.sellerType || "individual",

    // Financial
    askingPrice: data.askingPrice!,
    offerAmount: data.offerAmount!,
    negotiatedPrice: data.negotiatedPrice,
    tokenAmount: data.tokenAmount,

    // Context-specific fields (based on purchaserType)
    ...(data.purchaserType === "agency" && {
      purpose: data.purpose || "investment",
      expectedResaleValue: data.expectedResaleValue,
      renovationBudget: data.renovationBudget,
      targetROI: data.targetROI,
      investmentNotes: data.investmentNotes,
    }),

    ...(data.purchaserType === "investor" && {
      facilitationFee: data.facilitationFee,
      // CRITICAL: Save investor shares for multi-investor purchases
      investors: data.investors,
    }),

    ...(data.purchaserType === "client" && {
      commissionRate: data.commissionRate || 2,
      commissionType: data.commissionType || "percentage",
      commissionSource: data.commissionSource || "buyer",
      buyerBudgetMin: data.buyerBudgetMin,
      buyerBudgetMax: data.buyerBudgetMax,
      buyerPrequalified: data.buyerPrequalified || false,
      buyerFinancingType: data.buyerFinancingType,
      matchedFromRequirementId: data.matchedFromRequirementId,
      conditions: data.conditions,
    }),

    // Financing
    financingType: data.financingType || "cash",
    loanAmount: data.loanAmount,
    loanApproved: data.loanApproved || false,
    bankName: data.bankName,

    // Agent
    agentId: data.agentId!,
    agentName: data.agentName!,

    // Status
    status: "offer-made",

    // Dates
    targetCloseDate: data.targetCloseDate,
    offerDate: new Date().toISOString().split("T")[0],

    // Due Diligence
    titleClear: false,
    inspectionDone: false,
    documentsVerified: false,
    surveyCompleted: false,

    // Costs
    estimatedClosingCosts: data.estimatedClosingCosts,
    additionalCosts: data.additionalCosts,

    // Notes
    notes: data.notes,
    internalNotes: data.internalNotes,
    communicationLog: [],

    // Metadata
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: data.agentId!,
  };

  cycles.push(newCycle);
  localStorage.setItem(PURCHASE_CYCLES_KEY, JSON.stringify(cycles));

  // Update property to link this purchase cycle
  const properties = getProperties();
  const property = properties.find((p) => p.id === data.propertyId);
  if (property) {
    const updatedProperty: Partial<Property> = {
      activePurchaseCycleIds: [
        ...(property.activePurchaseCycleIds || []),
        newCycle.id,
      ],
    };
    updateProperty(data.propertyId!, updatedProperty);
  }

  // CRITICAL: Sync property status based on the new cycle
  syncPropertyStatusFromPurchaseCycle(newCycle.id);

  // Dispatch event so UI can update
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("cycleCreated", {
        detail: {
          propertyId: data.propertyId,
          cycleId: newCycle.id,
          cycleType: "purchase",
        },
      }),
    );
  }

  return newCycle;
}

/**
 * Update an existing purchase cycle
 */
export function updatePurchaseCycle(
  id: string,
  updates: Partial<PurchaseCycle>,
): void {
  const cycles = getPurchaseCycles();
  const index = cycles.findIndex((c) => c.id === id);

  if (index !== -1) {
    cycles[index] = {
      ...cycles[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(PURCHASE_CYCLES_KEY, JSON.stringify(cycles));

    // 🔄 AUTO-SYNC: Update property status if cycle status changed
    if (updates.status) {
      try {
        syncPropertyStatusFromPurchaseCycle(id);
      } catch (error) {
        console.error(
          "Error syncing property status from purchase cycle:",
          error,
        );
        // Don't throw - cycle update should succeed even if sync fails
      }
    }
  }
}

/**
 * Add a communication log entry
 */
export function addCommunicationLog(
  cycleId: string,
  type: "call" | "email" | "meeting" | "note",
  summary: string,
  by: string,
): void {
  const cycle = getPurchaseCycleById(cycleId);
  if (!cycle) {
    throw new Error("Purchase cycle not found");
  }

  const logEntry = {
    date: new Date().toISOString(),
    type,
    summary,
    by,
  };

  const updatedLog = [...(cycle.communicationLog || []), logEntry];
  updatePurchaseCycle(cycleId, { communicationLog: updatedLog });
}

/**
 * Complete a purchase (property acquired)
 * This handles all three purchaser types appropriately
 */
export function completePurchase(
  cycleId: string,
  finalPrice: number,
): { success: boolean; transactionId?: string; error?: string } {
  try {
    const cycle = getPurchaseCycleById(cycleId);
    if (!cycle) {
      return { success: false, error: "Purchase cycle not found" };
    }

    // Determine the new owner based on purchaser type
    let newOwnerId = "";
    let newOwnerName = "";
    let newOwnerType: "client" | "agency" | "investor" | "external" = "client";
    let commissionAmount = 0;
    let investorShares = undefined;

    switch (cycle.purchaserType) {
      case "agency":
        // Agency is buying - no commission, agency becomes owner
        newOwnerId = cycle.purchaserId || ""; // Agency ID
        newOwnerName = cycle.purchaserName || ""; // Agency name
        newOwnerType = "agency"; // CRITICAL: Set owner type to 'agency'
        break;

      case "investor":
        // Investor is buying - facilitation fee applies, investor becomes owner
        newOwnerId = cycle.purchaserId || ""; // Investor Contact ID
        newOwnerName = cycle.purchaserName || "";
        newOwnerType = "investor"; // CRITICAL: Set owner type to 'investor'
        commissionAmount = cycle.facilitationFee || 0;
        // Pass investor shares if multi-investor purchase
        investorShares = cycle.investors;
        break;

      case "client":
        // Client is buying - buyer agent commission applies, client becomes owner
        newOwnerId = cycle.purchaserId || ""; // Buyer Contact ID
        newOwnerName = cycle.purchaserName || "";
        newOwnerType = "client"; // CRITICAL: Set owner type to 'client'
        if (cycle.commissionType === "percentage") {
          commissionAmount = (finalPrice * (cycle.commissionRate || 0)) / 100;
        } else {
          commissionAmount = cycle.commissionRate || 0;
        }
        break;

      default:
        return { success: false, error: "Invalid purchaser type" };
    }

    // Create transaction
    const transactionId = `txn_${Date.now()}`;
    const transaction = {
      id: transactionId,
      propertyId: cycle.propertyId,
      type: "purchase" as const,
      agreedPrice: finalPrice,
      startDate: new Date().toISOString(),
      agentId: cycle.agentId,
      buyerName: newOwnerName,
      buyerContactId: newOwnerId,
      acceptedOfferAmount: finalPrice,
      acceptedDate: new Date().toISOString().split("T")[0],
      expectedClosingDate:
        cycle.targetCloseDate || new Date().toISOString().split("T")[0],
      status: "completed" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveTransaction(transaction);

    // Transfer ownership with CORRECT parameter order
    console.log("🔄 Completing purchase - transferring ownership:");
    console.log("   - Property ID:", cycle.propertyId);
    console.log("   - New Owner ID:", newOwnerId);
    console.log("   - New Owner Name:", newOwnerName);
    console.log("   - New Owner Type:", newOwnerType);
    console.log("   - Purchaser Type:", cycle.purchaserType);
    console.log("   - Final Price:", finalPrice);

    transferOwnership(
      cycle.propertyId,
      newOwnerId,
      newOwnerName,
      newOwnerType, // CRITICAL FIX: Pass owner type as 4th parameter
      transactionId, // Transaction ID as 5th parameter
      investorShares, // Investor shares as 6th parameter
      finalPrice, // Sale price as 7th parameter
      `Purchased via ${cycle.purchaserType} purchase cycle. Seller: ${cycle.sellerName}`, // Notes as 8th parameter
    );

    console.log("✅ Ownership transferred successfully");

    // Update purchase cycle
    updatePurchaseCycle(cycleId, {
      status: "acquired",
      negotiatedPrice: finalPrice,
      actualCloseDate: new Date().toISOString().split("T")[0],
      commissionAmount,
    });

    // Remove from property's active cycles
    const properties = getProperties();
    const property = properties.find((p) => p.id === cycle.propertyId);
    if (property) {
      const updatedActivePurchaseCycles = (
        property.activePurchaseCycleIds || []
      ).filter((cId) => cId !== cycleId);
      const updatedProperty: Partial<Property> = {
        activePurchaseCycleIds: updatedActivePurchaseCycles,
        cycleHistory: {
          ...property.cycleHistory,
          purchaseCycles: [
            ...(property.cycleHistory?.purchaseCycles || []),
            cycleId,
          ],
        },
      };
      updateProperty(cycle.propertyId, updatedProperty);
    }

    return { success: true, transactionId };
  } catch (error) {
    console.error("❌ Error completing purchase:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Cancel a purchase cycle
 */
export function cancelPurchaseCycle(id: string, reason?: string): void {
  updatePurchaseCycle(id, {
    status: "cancelled",
    notes: reason ? `Cancelled: ${reason}` : undefined,
  });

  const cycle = getPurchaseCycleById(id);
  if (cycle) {
    // Remove from property's active cycles
    const properties = getProperties();
    const property = properties.find((p) => p.id === cycle.propertyId);
    if (property) {
      const updatedActivePurchaseCycles = (
        property.activePurchaseCycleIds || []
      ).filter((cId) => cId !== id);
      const updatedProperty: Partial<Property> = {
        activePurchaseCycleIds: updatedActivePurchaseCycles,
        cycleHistory: {
          ...property.cycleHistory,
          purchaseCycles: [
            ...(property.cycleHistory?.purchaseCycles || []),
            id,
          ],
        },
      };
      updateProperty(cycle.propertyId, updatedProperty);
    }
  }
}

/**
 * Check for dual representation
 * Returns true if the agent already has a sell cycle on this property
 */
export function checkDualRepresentation(
  propertyId: string,
  agentId: string,
): { isDualRep: boolean; sellCycleIds?: string[] } {
  const sellCycles = getSellCyclesByProperty(propertyId);
  const agentSellCycles = (sellCycles || []).filter(
    (sc: any) => sc.agentId === agentId,
  );

  return {
    isDualRep: agentSellCycles.length > 0,
    sellCycleIds: agentSellCycles.map((sc: any) => sc.id),
  };
}

/**
 * Get purchase cycle statistics
 */
export function getPurchaseCycleStats(
  userId?: string,
  userRole?: string,
  purchaserType?: PurchaserType,
) {
  let cycles = getPurchaseCycles(userId, userRole);

  if (purchaserType) {
    cycles = cycles.filter((c) => c.purchaserType === purchaserType);
  }

  return {
    total: cycles.length,
    byType: {
      agency: cycles.filter((c) => c.purchaserType === "agency").length,
      investor: cycles.filter((c) => c.purchaserType === "investor").length,
      client: cycles.filter((c) => c.purchaserType === "client").length,
    },
    byStatus: {
      prospecting: cycles.filter((c) => c.status === "prospecting").length,
      offerMade: cycles.filter((c) => c.status === "offer-made").length,
      negotiation: cycles.filter((c) => c.status === "negotiation").length,
      accepted: cycles.filter((c) => c.status === "accepted").length,
      dueDiligence: cycles.filter((c) => c.status === "due-diligence").length,
      financing: cycles.filter((c) => c.status === "financing").length,
      closing: cycles.filter((c) => c.status === "closing").length,
      acquired: cycles.filter((c) => c.status === "acquired").length,
      cancelled: cycles.filter((c) => c.status === "cancelled").length,
    },
    averageOfferAmount:
      cycles.length > 0
        ? cycles.reduce((sum, c) => sum + (c.offerAmount || 0), 0) /
          cycles.length
        : 0,
    totalInvestment: cycles
      .filter((c) => c.purchaserType === "agency" && c.status === "acquired")
      .reduce((sum, c) => sum + (c.negotiatedPrice || c.offerAmount || 0), 0),
  };
}

/**
 * Get ROI for agency investments
 */
export function getAgencyInvestmentROI(cycleId: string): {
  invested: number;
  expectedReturn: number;
  roi: number;
} | null {
  const cycle = getPurchaseCycleById(cycleId);

  if (!cycle || cycle.purchaserType !== "agency") {
    return null;
  }

  const invested =
    (cycle.negotiatedPrice || cycle.offerAmount || 0) +
    (cycle.renovationBudget || 0);
  const expectedReturn = cycle.expectedResaleValue || 0;
  const roi =
    expectedReturn > 0 ? ((expectedReturn - invested) / invested) * 100 : 0;

  return {
    invested,
    expectedReturn,
    roi,
  };
}

// ============================================================================
// BUYER REQUIREMENT INTEGRATION - V3.0 CRITICAL FEATURE
// ============================================================================

/**
 * Check if a purchase cycle exists for a buyer requirement + property combination
 */
export function getPurchaseCycleByBuyerRequirement(
  buyerRequirementId: string,
  propertyId: string,
): PurchaseCycle | undefined {
  const cycles = getPurchaseCycles();
  return cycles.find(
    (c) =>
      c.buyerRequirementId === buyerRequirementId &&
      c.propertyId === propertyId &&
      c.status !== "cancelled",
  );
}

/**
 * Create Purchase Cycle from Buyer Requirement
 * This is the CRITICAL function that initiates buyer commitment
 * Must be called BEFORE sending offers
 */
export function createPurchaseCycleFromBuyerRequirement(
  buyerRequirement: BuyerRequirement,
  property: Property,
  sellCycleId: string,
  agentId: string,
  agentName: string,
): PurchaseCycle {
  // Get sell cycle info
  const sellCycle = getSellCycleById(sellCycleId);
  if (!sellCycle) {
    throw new Error("Sell cycle not found");
  }

  // Create purchase cycle for this buyer-property match
  const purchaseCycle = createPurchaseCycle({
    propertyId: property.id,

    // Purchaser is the buyer from the requirement
    purchaserType: "client", // Buyer requirements are always for clients
    purchaserId: buyerRequirement.id, // Link to buyer requirement
    purchaserName: buyerRequirement.buyerName,

    // Seller info from sell cycle
    sellerId: sellCycle.sellerId,
    sellerName: sellCycle.sellerName,
    sellerContact: "", // Not available in sell cycle
    sellerType: sellCycle.sellerType,

    // Financial - use sell cycle asking price
    askingPrice: sellCycle.askingPrice,
    offerAmount: sellCycle.askingPrice, // Default to asking, can be changed

    // Financing
    financingType: buyerRequirement.financingType || "cash",

    // Agent (buyer agent)
    agentId: agentId,
    agentName: agentName,

    // Status - just initiated
    status: "prospecting",

    // Link to buyer requirement
    buyerRequirementId: buyerRequirement.id,
    matchedFromRequirementId: buyerRequirement.id,

    // Commission (buyer agent commission)
    commissionRate: 2, // Default 2%
    commissionType: "percentage",
    commissionSource: "buyer",

    // Budget constraints
    buyerBudgetMin: buyerRequirement.budgetMin,
    buyerBudgetMax: buyerRequirement.budgetMax,

    // Notes
    notes: `Purchase cycle initiated from buyer requirement match. Buyer: ${buyerRequirement.buyerName}`,
    internalNotes: `Match score: Automatically created from buyer requirement ID: ${buyerRequirement.id}`,

    createdBy: agentId,
  });

  return purchaseCycle;
}

/**
 * Update purchase cycle when offer is sent
 */
export function markPurchaseCycleOfferSent(
  purchaseCycleId: string,
  offerAmount: number,
  tokenAmount?: number,
): void {
  updatePurchaseCycle(purchaseCycleId, {
    status: "offer-made",
    offerAmount: offerAmount,
    tokenAmount: tokenAmount,
    offerDate: new Date().toISOString().split("T")[0],
  });
}

/**
 * Update purchase cycle when offer is accepted
 * CRITICAL: Also creates a single-cycle purchase deal (buyer-side only)
 */
export function markPurchaseCycleOfferAccepted(
  purchaseCycleId: string,
  acceptedAmount: number,
): void {
  // Update purchase cycle status
  updatePurchaseCycle(purchaseCycleId, {
    status: "accepted",
    negotiatedPrice: acceptedAmount,
  });

  // AUTO-CREATE SINGLE-CYCLE PURCHASE DEAL
  // This handles the inter-agency scenario where:
  // - Agency A represents the buyer (this purchase cycle)
  // - Agency B represents the seller (external, not in our system)
  // - We only manage the purchase side of the transaction
  //
  // CRITICAL: If this purchase cycle is linked to a sell cycle (intra-agency),
  // the sell cycle will create the deal. Don't create duplicate deals!
  try {
    const cycle = getPurchaseCycleById(purchaseCycleId);
    if (!cycle) return;

    // CRITICAL FIX: Check if linked to a sell cycle (intra-agency scenario)
    if (cycle.linkedSellCycleId) {
      console.log(
        "⚠️ Purchase cycle is linked to sell cycle - deal will be created from sell cycle",
      );
      console.log(`   - Purchase Cycle: ${cycle.id}`);
      console.log(`   - Linked Sell Cycle: ${cycle.linkedSellCycleId}`);
      console.log(
        "   - Skipping duplicate deal creation from purchase cycle side",
      );
      return; // Let the sell cycle create the deal
    }

    // Check if deal already exists for this purchase cycle
    if (cycle.createdDealId) {
      console.log(
        `⚠️ Purchase cycle ${purchaseCycleId} already has a deal: ${cycle.createdDealId}`,
      );
      return;
    }

    // Get property
    const properties = getProperties();
    const property = properties.find((p) => p.id === cycle.propertyId);
    if (!property) {
      console.warn(
        "Property not found for purchase cycle - cannot create deal",
      );
      return;
    }

    // Create single-cycle purchase deal (ONLY for inter-agency scenarios)
    const deal = createDealFromPurchaseCycle(cycle, cycle.agentId);

    console.log("✅ Single-cycle purchase deal created (inter-agency)");
    console.log(`   - Deal: ${deal.dealNumber}`);
    console.log(`   - Purchase Cycle: ${cycle.id}`);
    console.log(
      `   - Purchaser: ${cycle.purchaserName} (${cycle.purchaserType})`,
    );

    // Update purchase cycle with deal reference
    updatePurchaseCycle(purchaseCycleId, {
      createdDealId: deal.id,
    });

    // Send notification
    createNotification({
      userId: cycle.agentId,
      type: "DEAL_CREATED",
      priority: "HIGH",
      title: "Purchase Deal Auto-Created",
      message: `Deal ${deal.dealNumber} has been automatically created for the accepted purchase offer.`,
      entityType: "deal",
      entityId: deal.id,
      actionLabel: "View Deal",
      actionType: "navigate",
    });
  } catch (error) {
    console.error("Error auto-creating purchase deal:", error);
    // Don't throw - purchase cycle is still updated even if deal creation fails
  }
}

/**
 * V3.0: Send offer from purchase cycle to sell cycle
 * CRITICAL FUNCTION: Enables purchase cycles to make offers on listed properties
 * Creates bidirectional link between purchase cycle and sell cycle offer
 */
export function sendOfferToSellCycle(
  purchaseCycleId: string,
  sellCycleId: string,
  offerData: {
    offerAmount: number;
    tokenAmount?: number;
    conditions?: string;
    notes?: string;
  },
): { success: boolean; offerId?: string; error?: string } {
  try {
    // Get purchase cycle
    const purchaseCycle = getPurchaseCycleById(purchaseCycleId);
    if (!purchaseCycle) {
      return { success: false, error: "Purchase cycle not found" };
    }

    // Get sell cycle
    const sellCycle = getSellCycleById(sellCycleId);
    if (!sellCycle) {
      return { success: false, error: "Sell cycle not found" };
    }

    // Verify they're for the same property
    if (purchaseCycle.propertyId !== sellCycle.propertyId) {
      return {
        success: false,
        error: "Purchase cycle and sell cycle are for different properties",
      };
    }

    console.log("📤 Sending offer from purchase cycle to sell cycle");
    console.log(`   - Purchase Cycle: ${purchaseCycleId}`);
    console.log(`   - Sell Cycle: ${sellCycleId}`);
    console.log(
      `   - Purchaser: ${purchaseCycle.purchaserName} (${purchaseCycle.purchaserType})`,
    );
    console.log(`   - Offer Amount: ${offerData.offerAmount}`);

    // Create offer in sell cycle with bidirectional link
    const offer = addOffer(sellCycleId, {
      buyerId: purchaseCycle.purchaserId,
      buyerName: purchaseCycle.purchaserName,
      buyerContact: purchaseCycle.purchaserName, // Use purchaser name as contact for now
      offerAmount: offerData.offerAmount,
      tokenAmount: offerData.tokenAmount,
      conditions: offerData.conditions,
      notes: offerData.notes,
      agentNotes: `Offer sent from purchase cycle ${purchaseCycleId}. Purchaser Type: ${purchaseCycle.purchaserType}. Agent: ${purchaseCycle.agentName}`,

      // CRITICAL: Bidirectional linking
      linkedPurchaseCycleId: purchaseCycleId,
      sourceType: "purchase-cycle",

      // Track buyer agent for commission split
      buyerAgentId: purchaseCycle.agentId,
      buyerAgentName: purchaseCycle.agentName,
    });

    console.log(`✅ Offer created in sell cycle: ${offer.id}`);

    // Update purchase cycle with bidirectional link and status
    updatePurchaseCycle(purchaseCycleId, {
      linkedSellCycleId: sellCycleId,
      linkedSellCycleOfferId: offer.id,
      status: "offer-made",
      offerAmount: offerData.offerAmount,
      tokenAmount: offerData.tokenAmount,
      offerDate: new Date().toISOString().split("T")[0],
    });

    console.log("✅ Purchase cycle updated with offer link");
    console.log(`   - Status: offer-made`);
    console.log(`   - Linked Sell Cycle: ${sellCycleId}`);
    console.log(`   - Linked Offer: ${offer.id}`);

    return { success: true, offerId: offer.id };
  } catch (error) {
    console.error("❌ Error sending offer to sell cycle:", error);
    return { success: false, error: String(error) };
  }
}
