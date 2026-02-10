import { Offer, SellCycle, PurchaseCycle } from "../types";
import {
  Deal,
  DealTask,
  DealPayment,
  DealStage,
  DealNote,
  DealDocument,
} from "../types/deals";
import { createNotification } from "./notifications";
import { triggerAutomation } from "./tasks";
import { getPermissions } from "./dealPermissions";
import {
  linkAllContactsToDeal,
  linkDealToTransaction,
} from "./dataFlowConnections";
// REMOVED CIRCULAR IMPORTS: updatePurchaseCycle, getPurchaseCycleById, savePurchaseCycle
// REMOVED CIRCULAR IMPORTS: getSellCycleById, updateSellCycle, saveSellCycle
// These functions are defined locally at the bottom of this file to prevent circular dependencies
// with sellCycle.ts and purchaseCycle.ts which both import from deals.ts
import { transferOwnership } from "./ownership";
import { updateProperty, getPropertyById } from "./data";
import { saveTransaction } from "./transactions";
import { syncDealToAllCycles as syncDealToAllCyclesFromSync } from "./dealSync";
import { syncPropertyStatusFromSellCycle } from "./propertyStatusSync";

const DEALS_KEY = "aaraazi_deals_v4";

/**
 * Generate deal number in format DEAL-YYYY-NNN
 */
function generateDealNumber(): string {
  const deals = getDeals();
  const year = new Date().getFullYear();
  const count = deals.filter((d) =>
    d.dealNumber.startsWith(`DEAL-${year}`),
  ).length;
  const nextNumber = (count + 1).toString().padStart(3, "0");
  return `DEAL-${year}-${nextNumber}`;
}

/**
 * Create a new deal from an accepted offer
 */
export const createDealFromOffer = (
  sellCycle: SellCycle,
  offer: Offer,
  primaryAgentId: string,
  purchaseCycle?: PurchaseCycle,
): Deal => {
  const dealNumber = generateDealNumber();
  const now = new Date().toISOString();

  // Handle amount fallbacks
  const agreedPrice = offer.offerAmount || offer.amount || 0;

  // Get property for details
  const propertyObj = getPropertyById(sellCycle.propertyId);

  // Calculate commission split
  const hasTwoAgents = !!purchaseCycle;
  const primaryPercentage = hasTwoAgents ? 60 : 100;
  const secondaryPercentage = hasTwoAgents ? 40 : 0;

  const totalCommission =
    (offer.offerAmount || 0) * (sellCycle.commissionRate / 100);
  const primaryCommissionAmount = totalCommission * (primaryPercentage / 100);
  const secondaryCommissionAmount = hasTwoAgents
    ? totalCommission * (secondaryPercentage / 100)
    : 0;

  const deal: Deal = {
    id: `deal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    dealNumber,

    property: {
      id: sellCycle.propertyId,
      title: sellCycle.title || propertyObj?.title || "Property",
      address:
        typeof propertyObj?.address === "string"
          ? propertyObj.address
          : propertyObj?.address?.fullAddress || "Address Pending",
    },

    // DUAL-CYCLE INTEGRATION
    cycles: {
      sellCycle: {
        id: sellCycle.id,
        agentId: sellCycle.agentId,
        agentName: sellCycle.agentName || "Unknown Agent",
        propertyId: sellCycle.propertyId,
        offerId: offer.id,
      },
      purchaseCycle: purchaseCycle
        ? {
            id: purchaseCycle.id,
            agentId: purchaseCycle.agentId,
            agentName: purchaseCycle.agentName || "Unknown Agent",
            buyerRequirementId: purchaseCycle.buyerRequirementId || "",
          }
        : undefined,
    },

    // AGENT ROLES & PERMISSIONS
    agents: {
      primary: {
        id: primaryAgentId,
        name: sellCycle.agentName || "Unknown Agent",
        role: "seller-agent",
        permissions: getPermissions("primary"),
      },
      secondary: purchaseCycle
        ? {
            id: purchaseCycle.agentId,
            name: purchaseCycle.agentName || "Unknown Agent",
            role: "buyer-agent",
            permissions: getPermissions("secondary"),
          }
        : undefined,
    },

    // PARTIES
    parties: {
      seller: {
        id: sellCycle.sellerId,
        name: sellCycle.sellerName,
        contact: "",
        email: "",
        representedBy: primaryAgentId,
      },
      buyer: {
        id: offer.buyerId,
        name: offer.buyerName,
        contact: offer.buyerContact || "",
        email: "",
        representedBy: purchaseCycle?.agentId || "",
      },
    },

    // FINANCIAL
    financial: {
      agreedPrice,

      // PAYMENT PLAN (not created yet - created during Sales Agreement stage)
      paymentPlan: undefined,

      // PAYMENT STATE (no plan yet)
      paymentState: "no-plan",

      // Commission with split support
      commission: {
        total: totalCommission,
        rate: sellCycle.commissionRate,

        split: {
          primaryAgent: {
            percentage: primaryPercentage,
            amount: primaryCommissionAmount,
            status: "pending",
          },
          secondaryAgent: hasTwoAgents
            ? {
                percentage: secondaryPercentage,
                amount: secondaryCommissionAmount,
                status: "pending",
              }
            : undefined,
          agency: {
            percentage: 0,
            amount: 0,
          },
        },
      },

      payments: [], // No payments yet - will be recorded as they happen
      totalPaid: 0,
      balanceRemaining: agreedPrice,

      transferCosts: {
        stampDuty: agreedPrice * 0.04, // 4% in Pakistan
        registrationFee: 15000, // Approximate PKR
        legalFees: 0,
        societyFee: 0,
        other: 0,
        total: 0,
      },
    },

    // LIFECYCLE
    lifecycle: {
      stage: "offer-accepted",
      status: "active",

      timeline: {
        offerAcceptedDate: now,
        expectedClosingDate: calculateExpectedClosingDate(60), // 60 days default

        stages: {
          offerAccepted: {
            status: "not-started",
            completionPercentage: 0,
            tasksCompleted: 0,
            totalTasks: 0,
          },
          agreementSigning: {
            status: "not-started",
            completionPercentage: 0,
            tasksCompleted: 0,
            totalTasks: 0,
          },
          documentation: {
            status: "not-started",
            completionPercentage: 0,
            tasksCompleted: 0,
            totalTasks: 0,
          },
          paymentProcessing: {
            status: "not-started",
            completionPercentage: 0,
            tasksCompleted: 0,
            totalTasks: 0,
          },
          handoverPrep: {
            status: "not-started",
            completionPercentage: 0,
            tasksCompleted: 0,
            totalTasks: 0,
          },
          transferRegistration: {
            status: "not-started",
            completionPercentage: 0,
            tasksCompleted: 0,
            totalTasks: 0,
          },
          finalHandover: {
            status: "not-started",
            completionPercentage: 0,
            tasksCompleted: 0,
            totalTasks: 0,
          },
        },
      },
    },

    // COLLABORATION
    collaboration: {
      primaryAgentNotes: [],
      sharedNotes: [],
      secondaryAgentNotes: [],
      communications: [],
      lastUpdatedBy: {
        agentId: primaryAgentId,
        agentName: sellCycle.agentName || "Unknown Agent",
        timestamp: now,
        action: "Deal created",
      },
    },

    // TASKS
    tasks: generateAllTasks(),

    // DOCUMENTS
    documents: generateDefaultDocuments(),

    // SYNC STATUS
    sync: {
      lastSyncedAt: now,
      sellCycleLastUpdated: sellCycle.updatedAt,
      purchaseCycleLastUpdated: purchaseCycle?.updatedAt || now,
      isInSync: true,
    },

    // METADATA
    metadata: {
      createdAt: now,
      updatedAt: now,
      createdBy: primaryAgentId,
    },
  };

  // Calculate transfer costs total
  deal.financial.transferCosts.total =
    deal.financial.transferCosts.stampDuty +
    deal.financial.transferCosts.registrationFee +
    deal.financial.transferCosts.legalFees +
    deal.financial.transferCosts.societyFee +
    deal.financial.transferCosts.other;

  // Update first stage progress
  const firstStageTasks = deal.tasks.filter(
    (t) => t.stage === "offer-accepted",
  );
  deal.lifecycle.timeline.stages.offerAccepted = {
    status: "in-progress",
    startedAt: now,
    completionPercentage: 0,
    tasksCompleted: 0,
    totalTasks: firstStageTasks.length,
  };

  // Save deal
  const deals = getDeals();
  deals.push(deal);
  saveDeals(deals);

  // DATA FLOW CONNECTION: Link contacts to deal (prevents data loss)
  // This ensures Contact -> Deal bidirectional linking is maintained
  try {
    linkAllContactsToDeal(deal);
  } catch (error) {
    console.error("Error linking contacts to deal:", error);
  }

  // PHASE 2: Trigger side effects
  try {
    // Sync to all cycles - handled by caller in Sell/Purchase Cycle for better data integrity
    // But we still attempt basic sync here
    syncDealToAllCyclesFromSync(deal);
  } catch (error) {
    console.warn(
      "Sync failed in createDealFromOffer, caller should handle it:",
      error,
    );
  }

  // Create notifications
  try {
    createDealNotifications(deal);
  } catch (error) {
    console.error("Error creating notifications:", error);
  }

  // Trigger task automation for new deal
  try {
    const createdTasks = triggerAutomation(
      {
        type: "entity-created",
        entityType: "deal",
      },
      { ...deal, title: `Deal ${deal.dealNumber}`, agentId: primaryAgentId },
      { id: primaryAgentId, name: sellCycle.agentName || "System" } as any,
    );

    console.log(
      `📋 Created ${createdTasks.length} automated task(s) for deal ${deal.dealNumber}`,
    );
  } catch (error) {
    console.error("Error triggering deal automation:", error);
    // Don't throw - deal is still created
  }

  // Dispatch event to notify components that a deal was created
  window.dispatchEvent(
    new CustomEvent("dealCreated", {
      detail: {
        dealId: deal.id,
        sellCycleId: sellCycle.id,
        purchaseCycleId: purchaseCycle?.id,
      },
    }),
  );

  return deal;
};

/**
 * Create a new deal from a CROSS-AGENT Accepted Offer
 * Used when we accept an offer from another agent in our system
 */
export const createDealFromCrossAgentOffer = (
  offer: Offer,
  sellCycleId: string,
): Deal => {
  // 1. Get the sell cycle
  const sellCycle = getSellCycleById(sellCycleId);

  if (!sellCycle) {
    throw new Error("Sell cycle not found");
  }

  // 2. Create a synthetic purchase cycle for the structure
  // This allows us to reuse the createDealFromOffer logic which handles splits
  const syntheticPurchaseCycle: any = {
    id: `pc_cross_${offer.buyerAgentId || offer.submittedByAgentId}_${Date.now()}`,
    agentId: offer.buyerAgentId || offer.submittedByAgentId,
    agentName: offer.buyerAgentName || offer.submittedByAgentName,
    buyerRequirementId: (offer as any).buyerRequirementId || "",
    updatedAt: new Date().toISOString(),
  };

  // 3. Create the deal using existing logic
  // This ensures consistent deal structure and permission handling
  return createDealFromOffer(
    sellCycle,
    offer,
    sellCycle.agentId,
    syntheticPurchaseCycle,
  );
};

/**
 * Create a new deal from a PURCHASE CYCLE (single-cycle, buyer-side only)
 * Used for inter-agency deals where we only represent the buyer
 */
export const createDealFromPurchaseCycle = (
  purchaseCycle: PurchaseCycle,
  buyerAgentId: string,
): Deal => {
  const dealNumber = generateDealNumber();
  const now = new Date().toISOString();

  // Create a synthetic offer object from the purchase cycle
  const pc = purchaseCycle as any;
  const syntheticOffer = {
    id: `offer_from_purchase_${pc.id}`,
    buyerId: pc.purchaserId || pc.purchaserContactId || pc.id,
    buyerName: pc.purchaserName || pc.agentName || "Unknown Buyer",
    buyerContact: pc.purchaserContact || "",
    offerAmount: pc.negotiatedPrice || pc.offerAmount || pc.targetPrice || 0,
    tokenAmount: pc.tokenAmount || 0,
    offeredDate: pc.offerDate || pc.createdAt || now,
    status: "accepted" as const,
    notes: `Purchase cycle offer - ${pc.purchaserType || "Direct"}`,
    createdAt: pc.createdAt,
    updatedAt: pc.updatedAt,
  };

  // Calculate commission for purchase side
  let commissionRate = 2; // Default
  let commissionAmount = 0;

  switch (pc.purchaserType) {
    case "client":
      commissionRate = pc.commissionRate || 2;
      if (pc.commissionType === "percentage") {
        commissionAmount = syntheticOffer.offerAmount * (commissionRate / 100);
      } else {
        commissionAmount = commissionRate;
      }
      break;
    case "investor":
      commissionAmount = pc.facilitationFee || 0;
      commissionRate =
        syntheticOffer.offerAmount > 0
          ? (commissionAmount / syntheticOffer.offerAmount) * 100
          : 0;
      break;
    case "agency":
      commissionAmount = 0; // No commission for agency purchases
      commissionRate = 0;
      break;
    default:
      commissionRate = pc.commissionRate || 2;
      commissionAmount = pc.commissionAmount || 0;
  }

  const deal: Deal = {
    id: `deal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    dealNumber,

    property: {
      id: purchaseCycle.propertyId,
      title: purchaseCycle.title || "Property",
      address: "Address Pending", // Will be updated during sync/load
    },

    // SINGLE-CYCLE INTEGRATION (Purchase side only)
    cycles: {
      sellCycle: undefined, // No sell cycle - external seller
      purchaseCycle: {
        id: purchaseCycle.id,
        agentId: purchaseCycle.agentId,
        agentName: purchaseCycle.agentName || "Unknown Agent",
        buyerRequirementId: purchaseCycle.buyerRequirementId || "",
      },
    },

    // AGENT ROLES & PERMISSIONS (Buyer agent only)
    agents: {
      primary: {
        id: buyerAgentId,
        name: purchaseCycle.agentName || "Unknown Agent",
        role: "buyer-agent",
        permissions: getPermissions("primary"),
      },
      secondary: undefined, // No seller agent in our system
    },

    // PARTIES
    parties: {
      seller: {
        id: (purchaseCycle as any).sellerId || "",
        name: (purchaseCycle as any).sellerName || "External Seller",
        contact: (purchaseCycle as any).sellerContact || "",
        email: "",
        representedBy: "",
      },
      buyer: {
        id: (purchaseCycle as any).purchaserId || purchaseCycle.id,
        name:
          (purchaseCycle as any).purchaserName ||
          purchaseCycle.agentName ||
          "Unknown Buyer",
        contact: "",
        email: "",
        representedBy: buyerAgentId,
      },
    },

    // FINANCIAL
    financial: {
      agreedPrice: syntheticOffer.offerAmount,

      // PAYMENT PLAN (not created yet - created during Sales Agreement stage)
      paymentPlan: undefined,

      // PAYMENT STATE (no plan yet)
      paymentState: "no-plan",

      // Commission with split support
      commission: {
        total: commissionAmount,
        rate: commissionRate,

        split: {
          primaryAgent: {
            percentage: 100,
            amount: commissionAmount,
            status: "pending",
          },
          secondaryAgent: undefined,
          agency: {
            percentage: 0,
            amount: 0,
          },
        },
      },

      payments: [], // No payments yet - will be recorded as they happen
      totalPaid: 0,
      balanceRemaining: syntheticOffer.offerAmount,

      transferCosts: {
        stampDuty: syntheticOffer.offerAmount * 0.04, // 4% in Pakistan
        registrationFee: 15000, // Approximate PKR
        legalFees: 0,
        societyFee: 0,
        other: 0,
        total: 0,
      },
    },

    // LIFECYCLE
    lifecycle: {
      stage: "offer-accepted",
      status: "active",

      timeline: {
        offerAcceptedDate: now,
        expectedClosingDate: calculateExpectedClosingDate(45),

        stages: {
          offerAccepted: {
            status: "not-started",
            completionPercentage: 0,
            tasksCompleted: 0,
            totalTasks: 0,
          },
          agreementSigning: {
            status: "not-started",
            completionPercentage: 0,
            tasksCompleted: 0,
            totalTasks: 0,
          },
          documentation: {
            status: "not-started",
            completionPercentage: 0,
            tasksCompleted: 0,
            totalTasks: 0,
          },
          paymentProcessing: {
            status: "not-started",
            completionPercentage: 0,
            tasksCompleted: 0,
            totalTasks: 0,
          },
          handoverPrep: {
            status: "not-started",
            completionPercentage: 0,
            tasksCompleted: 0,
            totalTasks: 0,
          },
          transferRegistration: {
            status: "not-started",
            completionPercentage: 0,
            tasksCompleted: 0,
            totalTasks: 0,
          },
          finalHandover: {
            status: "not-started",
            completionPercentage: 0,
            tasksCompleted: 0,
            totalTasks: 0,
          },
        },
      },
    },

    // COLLABORATION
    collaboration: {
      primaryAgentNotes: [],
      sharedNotes: [],
      secondaryAgentNotes: [],
      communications: [],
      lastUpdatedBy: {
        agentId: buyerAgentId,
        agentName: purchaseCycle.agentName || "Unknown Agent",
        timestamp: now,
        action: "Deal created from purchase cycle",
      },
    },

    // TASKS
    tasks: generateAllTasks(),

    // DOCUMENTS
    documents: generateDefaultDocuments(),

    // SYNC STATUS
    sync: {
      lastSyncedAt: now,
      sellCycleLastUpdated: now, // No sell cycle
      purchaseCycleLastUpdated: purchaseCycle.updatedAt || now,
      isInSync: true,
    },

    // METADATA
    metadata: {
      createdAt: now,
      updatedAt: now,
      createdBy: buyerAgentId,
    },
  };

  // Calculate transfer costs total
  deal.financial.transferCosts.total =
    deal.financial.transferCosts.stampDuty +
    deal.financial.transferCosts.registrationFee +
    deal.financial.transferCosts.legalFees +
    deal.financial.transferCosts.societyFee +
    deal.financial.transferCosts.other;

  // Update first stage progress
  const firstStageTasks = deal.tasks.filter(
    (t) => t.stage === "offer-accepted",
  );
  deal.lifecycle.timeline.stages.offerAccepted = {
    status: "in-progress",
    startedAt: now,
    completionPercentage: 0,
    tasksCompleted: 0,
    totalTasks: firstStageTasks.length,
  };

  // Save deal
  const deals = getDeals();
  deals.push(deal);
  saveDeals(deals);

  // Update bidirectional relationship: Deal → PurchaseCycle
  try {
    // Update purchase cycle with deal ID
    updatePurchaseCycle(purchaseCycle.id, {
      createdDealId: deal.id,
      linkedDealId: deal.id, // Link for payment tracking
    });

    console.log("[Phase 1] Relationships updated:");
    console.log(`  - Deal ${deal.id}`);
    console.log(
      `  - PurchaseCycle ${purchaseCycle.id} → createdDealId: ${deal.id}, linkedDealId: ${deal.id}`,
    );
  } catch (error) {
    console.error("[Phase 1] Error updating relationships:", error);
    // Don't throw - deal is still created even if relationship update fails
  }

  // DATA FLOW CONNECTION: Link contacts to deal (prevents data loss)
  try {
    linkAllContactsToDeal(deal);
  } catch (error) {
    console.error("Error linking contacts to deal:", error);
    // Don't throw - deal is still created
  }

  // Sync to purchase cycle
  syncDealToAllCyclesFromSync(deal);

  // Create notifications
  createDealNotifications(deal);

  // Dispatch event to notify components that a deal was created
  window.dispatchEvent(
    new CustomEvent("dealCreated", {
      detail: {
        dealId: deal.id,
        sellCycleId: undefined,
        purchaseCycleId: purchaseCycle.id,
      },
    }),
  );

  return deal;
};

/**
 * Generate all tasks for a deal
 */
const generateAllTasks = (): DealTask[] => {
  const taskTemplates: Record<
    DealStage,
    Array<{
      title: string;
      description: string;
      priority: DealTask["priority"];
      daysUntilDue: number;
    }>
  > = {
    "offer-accepted": [
      {
        title: "Schedule signing meeting",
        description: "Coordinate with buyer and seller for agreement signing",
        priority: "high",
        daysUntilDue: 2,
      },
      {
        title: "Prepare sale agreement",
        description: "Draft and review sale agreement document",
        priority: "medium",
        daysUntilDue: 4,
      },
      {
        title: "Request buyer documentation",
        description: "Collect CNIC, proof of funds, etc.",
        priority: "medium",
        daysUntilDue: 3,
      },
      {
        title: "Verify buyer financing",
        description: "Confirm buyer has funds or loan approval",
        priority: "medium",
        daysUntilDue: 4,
      },
      {
        title: "Collect token money",
        description: "Receive and document token payment",
        priority: "urgent",
        daysUntilDue: 5,
      },
    ],
    "agreement-signing": [
      {
        title: "Finalize sale agreement",
        description: "Review and finalize all terms",
        priority: "high",
        daysUntilDue: 2,
      },
      {
        title: "Legal review",
        description: "Have lawyer review agreement",
        priority: "medium",
        daysUntilDue: 3,
      },
      {
        title: "Obtain buyer signature",
        description: "Get buyer to sign agreement",
        priority: "high",
        daysUntilDue: 5,
      },
      {
        title: "Obtain seller signature",
        description: "Get seller to sign agreement",
        priority: "high",
        daysUntilDue: 5,
      },
      {
        title: "Collect down payment",
        description: "Receive down payment from buyer",
        priority: "urgent",
        daysUntilDue: 7,
      },
      {
        title: "Issue receipt for down payment",
        description: "Provide official receipt",
        priority: "medium",
        daysUntilDue: 7,
      },
    ],
    documentation: [
      {
        title: "Collect property title deed",
        description: "Obtain original title from seller",
        priority: "high",
        daysUntilDue: 3,
      },
      {
        title: "Obtain NOC from society",
        description: "Get No Objection Certificate",
        priority: "high",
        daysUntilDue: 7,
      },
      {
        title: "Clear property tax dues",
        description: "Ensure all taxes are paid",
        priority: "medium",
        daysUntilDue: 5,
      },
      {
        title: "Clear utility bills",
        description: "Settle electricity, gas, water bills",
        priority: "medium",
        daysUntilDue: 5,
      },
      {
        title: "Collect buyer CNIC copies",
        description: "Get copies of buyer identification",
        priority: "medium",
        daysUntilDue: 3,
      },
      {
        title: "Collect seller CNIC copies",
        description: "Get copies of seller identification",
        priority: "medium",
        daysUntilDue: 3,
      },
      {
        title: "Legal document verification",
        description: "Verify all documents with lawyer",
        priority: "high",
        daysUntilDue: 10,
      },
      {
        title: "Bank loan processing",
        description: "Support buyer with bank paperwork if needed",
        priority: "medium",
        daysUntilDue: 14,
      },
    ],
    "payment-processing": [
      {
        title: "Track installment 1 payment",
        description: "Ensure timely payment",
        priority: "high",
        daysUntilDue: 3,
      },
      {
        title: "Issue receipt for installment 1",
        description: "Provide official receipt",
        priority: "medium",
        daysUntilDue: 3,
      },
      {
        title: "Track installment 2 payment",
        description: "Ensure timely payment",
        priority: "high",
        daysUntilDue: 15,
      },
      {
        title: "Issue receipt for installment 2",
        description: "Provide official receipt",
        priority: "medium",
        daysUntilDue: 15,
      },
      {
        title: "Update financial records",
        description: "Maintain accurate payment log",
        priority: "low",
        daysUntilDue: 1,
      },
    ],
    "handover-prep": [
      {
        title: "Schedule final property inspection",
        description: "Arrange final walkthrough",
        priority: "high",
        daysUntilDue: 5,
      },
      {
        title: "Create defects list (if any)",
        description: "Document any issues found",
        priority: "medium",
        daysUntilDue: 5,
      },
      {
        title: "Coordinate repairs",
        description: "Fix any defects found",
        priority: "medium",
        daysUntilDue: 7,
      },
      {
        title: "Document meter readings",
        description: "Record all utility meters",
        priority: "low",
        daysUntilDue: 3,
      },
      {
        title: "Collect all keys from seller",
        description: "Get all sets of keys",
        priority: "medium",
        daysUntilDue: 3,
      },
      {
        title: "Prepare handover documents",
        description: "Prepare handover certificate",
        priority: "medium",
        daysUntilDue: 5,
      },
    ],
    "transfer-registration": [
      {
        title: "Prepare transfer documents",
        description: "Prepare all transfer paperwork",
        priority: "high",
        daysUntilDue: 3,
      },
      {
        title: "Calculate stamp duty",
        description: "Calculate 4% stamp duty",
        priority: "medium",
        daysUntilDue: 1,
      },
      {
        title: "Schedule registrar appointment",
        description: "Book appointment at Sub-Registrar office",
        priority: "high",
        daysUntilDue: 5,
      },
      {
        title: "Accompany parties to registrar",
        description: "Be present at registration",
        priority: "high",
        daysUntilDue: 7,
      },
      {
        title: "Submit transfer documents",
        description: "Submit all docs to registrar",
        priority: "high",
        daysUntilDue: 7,
      },
      {
        title: "Pay stamp duty",
        description: "Pay 4% stamp duty",
        priority: "urgent",
        daysUntilDue: 7,
      },
      {
        title: "Track registration status",
        description: "Follow up on registration process",
        priority: "medium",
        daysUntilDue: 10,
      },
    ],
    "final-handover": [
      {
        title: "Collect final payment",
        description: "Receive final payment from buyer",
        priority: "high",
        daysUntilDue: 2,
      },
      {
        title: "Issue final receipt",
        description: "Provide receipt for final payment",
        priority: "high",
        daysUntilDue: 2,
      },
      {
        title: "Schedule handover meeting",
        description: "Coordinate final handover",
        priority: "high",
        daysUntilDue: 3,
      },
      {
        title: "Conduct handover meeting",
        description: "Meet with all parties",
        priority: "high",
        daysUntilDue: 5,
      },
      {
        title: "Sign handover documents",
        description: "Get signatures on handover certificate",
        priority: "high",
        daysUntilDue: 5,
      },
      {
        title: "Exchange keys",
        description: "Hand over all keys to buyer",
        priority: "high",
        daysUntilDue: 5,
      },
      {
        title: "Calculate commission",
        description: "Calculate agent commission",
        priority: "medium",
        daysUntilDue: 7,
      },
      {
        title: "Archive deal documents",
        description: "Store all documents properly",
        priority: "low",
        daysUntilDue: 7,
      },
    ],
    completed: [],
  };

  const now = new Date();

  return Object.keys(taskTemplates).flatMap((stage) => {
    const templates = taskTemplates[stage as DealStage];

    return templates.map((template, index) => {
      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + template.daysUntilDue);

      return {
        id: `task_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
        title: template.title,
        description: template.description,
        stage: stage as DealStage,
        assignedTo: "",
        assignedToName: "",
        dueDate: dueDate.toISOString(),
        status: "not-started",
        priority: template.priority,
        automated: true,
        createdAt: new Date().toISOString(),
      };
    });
  });
};

/**
 * Generate default documents for a deal
 */
const generateDefaultDocuments = (): DealDocument[] => {
  const documentTemplates: Record<
    DealStage,
    Array<{ type: string; name: string }>
  > = {
    "offer-accepted": [
      { type: "offer-letter", name: "Offer Acceptance Letter" },
      { type: "agreement", name: "Initial Agreement to Sell" },
      { type: "buyer-info", name: "Buyer Information Sheet" },
    ],
    "agreement-signing": [
      { type: "sale-agreement", name: "Sale Agreement" },
      { type: "receipt", name: "Token Money Receipt" },
      { type: "payment-schedule", name: "Payment Schedule Document" },
    ],
    documentation: [
      { type: "title-deed", name: "Property Title Deed" },
      { type: "noc", name: "NOC from Society" },
      { type: "tax-clearance", name: "Property Tax Clearance" },
      { type: "utility-clearance", name: "Utility Bills Clearance" },
      { type: "transfer-letter", name: "Transfer Letter" },
      { type: "possession-letter", name: "Possession Letter" },
      { type: "buyer-cnic", name: "Buyer CNIC Copy" },
      { type: "seller-cnic", name: "Seller CNIC Copy" },
      { type: "bank-statement", name: "Buyer Bank Statement" },
      { type: "loan-approval", name: "Loan Approval Letter (if applicable)" },
    ],
    "payment-processing": [
      { type: "payment-receipt", name: "Installment Payment Receipts" },
      { type: "payment-log", name: "Complete Payment Log" },
    ],
    "handover-prep": [
      { type: "inspection-report", name: "Final Inspection Report" },
      { type: "meter-readings", name: "Utility Meter Readings" },
      { type: "handover-checklist", name: "Handover Checklist" },
    ],
    "transfer-registration": [
      { type: "transfer-documents", name: "Property Transfer Documents" },
      { type: "stamp-duty-receipt", name: "Stamp Duty Payment Receipt" },
      { type: "registration-receipt", name: "Registration Fee Receipt" },
      { type: "registered-deed", name: "Registered Property Deed" },
    ],
    "final-handover": [
      { type: "handover-certificate", name: "Property Handover Certificate" },
      { type: "keys-receipt", name: "Keys Handover Receipt" },
      { type: "final-receipt", name: "Final Payment Receipt" },
      { type: "commission-statement", name: "Commission Statement" },
    ],
    completed: [],
  };

  const now = new Date();

  return Object.keys(documentTemplates).flatMap((stage) => {
    const templates = documentTemplates[stage as DealStage];

    return templates.map((template, index) => ({
      id: `doc_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
      name: template.name,
      type: template.type,
      category: "other",
      uploadedBy: "",
      uploadedByName: "",
      uploadedAt: new Date().toISOString(),
      stage: stage as DealStage,
      required: true,
      status: "pending",
    }));
  });
};

/**
 * Calculate expected closing date
 */
const calculateExpectedClosingDate = (daysToAdd: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString();
};

/**
 * Generate tasks for a specific stage
 */
const generateStageTasks = (stage: DealStage): DealTask[] => {
  const allTasks = generateAllTasks();
  return allTasks.filter((t) => t.stage === stage);
};

/**
 * Generate documents for a specific stage
 */
const generateStageDocuments = (stage: DealStage): DealDocument[] => {
  const allDocs = generateDefaultDocuments();
  return allDocs.filter((d) => d.stage === stage);
};

/**
 * Create notifications for new deal
 */
const createDealNotifications = (deal: Deal): void => {
  // Notify primary agent
  createNotification({
    userId: deal.agents.primary.id,
    type: "DEAL_CREATED",
    title: "New Deal Created",
    message: `Deal ${deal.dealNumber} created for ${deal.parties.buyer.name}`,
    priority: "HIGH",
    entityType: "deal",
    entityId: deal.id,
  });

  // Notify secondary agent if exists
  if (deal.agents.secondary) {
    createNotification({
      userId: deal.agents.secondary.id,
      type: "DEAL_CREATED",
      title: "Deal Created - View Access",
      message: `${deal.agents.primary.name} created deal ${deal.dealNumber}. You have view-only access to track progress.`,
      priority: "MEDIUM",
      entityType: "deal",
      entityId: deal.id,
    });
  }
};

/**
 * Get all deals
 */
export const getDeals = (userId?: string, userRole?: string): Deal[] => {
  try {
    const data = localStorage.getItem(DEALS_KEY);
    const allDeals: Deal[] = data ? JSON.parse(data) : [];

    // Admin sees everything
    if (!userId || userRole === "admin") {
      return allDeals;
    }

    // Agents see deals where they're involved (primary or secondary)
    return allDeals.filter(
      (d) =>
        d.agents.primary.id === userId || d.agents.secondary?.id === userId,
    );
  } catch (error) {
    console.error("Error reading deals:", error);
    return [];
  }
};

/**
 * Save deals to storage
 */
export const saveDeals = (deals: Deal[]): void => {
  try {
    localStorage.setItem(DEALS_KEY, JSON.stringify(deals));
  } catch (error) {
    console.error("Error saving deals:", error);
    throw error;
  }
};

/**
 * Get deal by ID
 */
export const getDealById = (id: string): Deal | null => {
  const deals = getDeals();
  return (deals.find((d) => d.id === id) as Deal) || null;
};

/**
 * Get deals by agent (primary or secondary)
 */
export const getDealsByAgent = (
  agentId: string,
  role?: "primary" | "secondary",
): Deal[] => {
  const deals = getDeals();

  if (!role) {
    // Get all deals where agent is involved
    return deals.filter(
      (d) =>
        d.agents.primary.id === agentId || d.agents.secondary?.id === agentId,
    );
  }

  if (role === "primary") {
    return deals.filter((d) => d.agents.primary.id === agentId);
  }

  if (role === "secondary") {
    return deals.filter((d) => d.agents.secondary?.id === agentId);
  }

  return [];
};

/**
 * Get deals by status
 */
export const getDealsByStatus = (
  status: Deal["lifecycle"]["status"],
): Deal[] => {
  const deals = getDeals();
  return deals.filter((d) => d.lifecycle.status === status);
};

/**
 * Get deals by stage
 */
export const getDealsByStage = (stage: DealStage): Deal[] => {
  const deals = getDeals();
  return deals.filter((d) => d.lifecycle.stage === stage);
};

/**
 * Get deals grouped by stage with counts
 * Returns object with stage names as keys and counts as values
 */
export const getDealStageStats = (deals: Deal[]): Record<string, number> => {
  return {
    "offer-accepted": deals.filter(
      (d) => d.lifecycle.stage === "offer-accepted",
    ).length,
    "agreement-signing": deals.filter(
      (d) => d.lifecycle.stage === "agreement-signing",
    ).length,
    documentation: deals.filter((d) => d.lifecycle.stage === "documentation")
      .length,
    "payment-processing": deals.filter(
      (d) => d.lifecycle.stage === "payment-processing",
    ).length,
    "handover-preparation": deals.filter(
      (d) => d.lifecycle.stage === "handover-prep",
    ).length,
    "transfer-registration": deals.filter(
      (d) => d.lifecycle.stage === "transfer-registration",
    ).length,
    "final-handover": deals.filter(
      (d) => d.lifecycle.stage === "final-handover",
    ).length,
  };
};

/**
 * Get deals grouped by status with counts
 * Returns object with status names as keys and counts as values
 */
export const getDealStatusStats = (deals: Deal[]): Record<string, number> => {
  return {
    active: deals.filter((d) => d.lifecycle.status === "active").length,
    "on-hold": deals.filter((d) => d.lifecycle.status === "on-hold").length,
    cancelled: deals.filter((d) => d.lifecycle.status === "cancelled").length,
    completed: deals.filter((d) => d.lifecycle.status === "completed").length,
  };
};

/**
 * Update deal
 * NOTE: Uses shallow merge - caller must spread nested objects
 */
export const updateDeal = (dealId: string, updates: Partial<Deal>): Deal => {
  console.log("🔄 updateDeal called:", { dealId, updates });

  const deals = getDeals();
  const dealIndex = deals.findIndex((d) => d.id === dealId);

  if (dealIndex === -1) {
    throw new Error(`Deal ${dealId} not found`);
  }

  console.log("🔄 Current deal before update:", deals[dealIndex]);

  deals[dealIndex] = {
    ...deals[dealIndex],
    ...updates,
    metadata: {
      ...deals[dealIndex].metadata,
      updatedAt: new Date().toISOString(),
    },
  };

  console.log("🔄 Deal after merge:", deals[dealIndex]);

  saveDeals(deals);

  console.log("💾 Deal saved to localStorage");

  syncDealToAllCycles(deals[dealIndex]);

  console.log("✅ Deal update complete");

  return deals[dealIndex];
};

/**
 * Progress deal to next stage
 */
export const progressDealStage = (
  dealId: string,
  newStage: DealStage,
  agentId: string,
  agentName: string,
): Deal => {
  const deal = getDealById(dealId);

  if (!deal) {
    throw new Error(`Deal ${dealId} not found`);
  }

  const now = new Date().toISOString();

  // Update current stage to completed
  const currentStageKey = getStageKey(deal.lifecycle.stage);
  if (currentStageKey) {
    deal.lifecycle.timeline.stages[currentStageKey].status = "completed";
    deal.lifecycle.timeline.stages[currentStageKey].completedAt = now;
    deal.lifecycle.timeline.stages[currentStageKey].completionPercentage = 100;
  }

  // Update to new stage
  deal.lifecycle.stage = newStage;
  const newStageKey = getStageKey(newStage);
  if (newStageKey) {
    deal.lifecycle.timeline.stages[newStageKey].status = "in-progress";
    deal.lifecycle.timeline.stages[newStageKey].startedAt = now;
  }

  // Add new tasks for this stage
  const newTasks = generateStageTasks(newStage);
  newTasks.forEach((task) => {
    task.dealId = dealId;
    deal.tasks.push(task);
  });

  // Add new documents for this stage
  const newDocs = generateStageDocuments(newStage);
  newDocs.forEach((doc) => {
    doc.dealId = dealId;
    deal.documents.push(doc);
  });

  // Update last action
  deal.collaboration.lastUpdatedBy = {
    agentId,
    agentName,
    timestamp: now,
    action: `progressed-to-${newStage}`,
  };

  // Update total tasks for new stage
  const newStageTasks = deal.tasks.filter((t) => t.stage === newStage);
  if (newStageKey) {
    deal.lifecycle.timeline.stages[newStageKey].totalTasks =
      newStageTasks.length;
  }

  // Save and sync
  const deals = getDeals();
  const dealIndex = deals.findIndex((d) => d.id === dealId);
  deals[dealIndex] = deal;
  saveDeals(deals);

  syncStageProgressionToCycles(deal, newStage);

  return deal;
};

/**
 * Get stage key from stage value
 */
const getStageKey = (
  stage: DealStage,
): keyof Deal["lifecycle"]["timeline"]["stages"] | null => {
  const mapping: Record<
    DealStage,
    keyof Deal["lifecycle"]["timeline"]["stages"]
  > = {
    "offer-accepted": "offerAccepted",
    "agreement-signing": "agreementSigning",
    documentation: "documentation",
    "payment-processing": "paymentProcessing",
    "handover-prep": "handoverPrep",
    "transfer-registration": "transferRegistration",
    "final-handover": "finalHandover",
    completed: "finalHandover", // Mapping for completed stage
  };

  return mapping[stage] || null;
};

/**
 * Record a payment
 */
export const recordDealPayment = (
  dealId: string,
  paymentId: string,
  agentId: string,
  agentName: string,
  paymentData: Partial<DealPayment>,
): Deal => {
  const deal = getDealById(dealId);

  if (!deal) {
    throw new Error(`Deal ${dealId} not found`);
  }

  const payment = deal.financial.payments.find((p) => p.id === paymentId);

  if (!payment) {
    throw new Error(`Payment ${paymentId} not found`);
  }

  // Update payment
  payment.status = "paid";
  payment.paidDate = paymentData.paidDate || new Date().toISOString();
  payment.paymentMethod = paymentData.paymentMethod;
  payment.referenceNumber = paymentData.referenceNumber;
  payment.receiptNumber = `RCP-${Date.now()}`;
  payment.notes = paymentData.notes;
  payment.updatedAt = new Date().toISOString();

  payment.recordedBy = agentId;
  payment.recordedByName = agentName;

  // Update totals
  deal.financial.totalPaid += payment.amount;
  deal.financial.balanceRemaining -= payment.amount;

  // Save and sync
  const deals = getDeals();
  const dealIndex = deals.findIndex((d) => d.id === dealId);
  deals[dealIndex] = deal;
  saveDeals(deals);

  syncPaymentToCycles(deal, payment);

  return deal;
};

/**
 * Complete deal
 * Handles ownership transfer and cycle completion
 *
 * NOTE: This function completes ALL stages including Final Handover.
 * When the deal is in 'final-handover' stage, calling this function:
 * - Marks Final Handover as complete (100%)
 * - Transfers property ownership to buyer
 * - Closes sell/purchase cycles
 * - Creates transaction record
 * - Changes deal status to 'completed'
 */
export const completeDeal = (
  dealId: string,
  agentId: string,
  agentName: string,
): Deal => {
  const deal = getDealById(dealId);

  if (!deal) {
    throw new Error(`Deal ${dealId} not found`);
  }

  const now = new Date().toISOString();

  // CRITICAL: Handle ownership transfer and cycle completion
  try {
    // Handle based on whether this is a sell-side or purchase-side deal
    if (deal.cycles.sellCycle) {
      // Dual-cycle or single-cycle sell deal
      const sellCycle = getSellCycleById(deal.cycles.sellCycle.id);

      if (sellCycle) {
        // Use getPropertyById - never use getProperties().find(); that filters by user/validity
        // and can exclude the property, skipping ownership transfer entirely.
        const property = getPropertyById(sellCycle.propertyId);

        if (property) {
          // Create transaction record
          const transactionId = `txn_${Date.now()}`;
          const transaction = {
            id: transactionId,
            propertyId: sellCycle.propertyId,
            type: "sell" as const,
            agentId: deal.agents.primary.id,
            buyerName: deal.parties.buyer.name,
            buyerContactId: deal.parties.buyer.id,
            sellerName: deal.parties.seller.name,
            sellerContactId: deal.parties.seller.id,
            agreedPrice: deal.financial.agreedPrice, // Required by Transaction type
            acceptedOfferAmount: deal.financial.agreedPrice,
            commissionAmount: deal.financial.commission.total,
            acceptedDate: now.split("T")[0],
            startDate: deal.lifecycle.timeline.offerAcceptedDate || now, // Required by Transaction type
            status: "completed" as const,
            sellCycleId: deal.cycles.sellCycle.id,
            purchaseCycleId: deal.cycles.purchaseCycle?.id,
            createdAt: now,
            updatedAt: now,
          } as any; // Cast to any to allow extra fields not in strict Transaction interface

          saveTransaction(transaction);

          // Determine buyer type from purchase cycle if available, otherwise default to 'client'
          let buyerType: "client" | "agency" | "investor" | "external" =
            "client";
          let investorShares = undefined;

          if (deal.cycles.purchaseCycle) {
            const purchaseCycle = getPurchaseCycleById(
              deal.cycles.purchaseCycle.id,
            );
            if (purchaseCycle) {
              // Map purchaserType to ownerType
              if (purchaseCycle.purchaserType === "agency") {
                buyerType = "agency";
              } else if (purchaseCycle.purchaserType === "investor") {
                buyerType = "investor";
                investorShares = purchaseCycle.investors;
              } else {
                buyerType = "client";
              }
            }
          }

          // Transfer ownership to buyer
          console.log("🔄 Attempting ownership transfer for sell cycle...");
          console.log("   - Property ID:", sellCycle.propertyId);
          console.log("   - New Owner ID:", deal.parties.buyer.id);
          console.log("   - New Owner Name:", deal.parties.buyer.name);
          console.log("   - New Owner Type:", buyerType);
          console.log("   - Transaction ID:", transactionId);

          const ownershipResult = transferOwnership(
            sellCycle.propertyId,
            deal.parties.buyer.id,
            deal.parties.buyer.name,
            buyerType,
            transactionId,
            investorShares,
            deal.financial.agreedPrice,
            `Sold via deal ${deal.dealNumber}. Seller: ${deal.parties.seller.name}. Buyer: ${deal.parties.buyer.name}. Price: ${deal.financial.agreedPrice}`,
          );

          if (!ownershipResult) {
            console.error(
              "❌ Ownership transfer FAILED - transferOwnership returned null",
            );
            console.error(
              "   - This usually means the property was not found or there was an error",
            );
            throw new Error(
              "Failed to transfer ownership - property not found or transfer failed",
            );
          } else {
            console.log("✅ Ownership transferred successfully");
            console.log(
              "   - New current owner:",
              ownershipResult.currentOwnerId,
            );
            console.log(
              "   - New owner name:",
              ownershipResult.currentOwnerName,
            );
            console.log(
              "   - New owner type:",
              ownershipResult.currentOwnerType,
            );
          }

          // Update sell cycle status
          updateSellCycle(deal.cycles.sellCycle.id, {
            status: "sold",
            soldDate: now.split("T")[0],
          });

          // Update purchase cycle if exists
          if (deal.cycles.purchaseCycle) {
            const purchaseCycle = getPurchaseCycleById(
              deal.cycles.purchaseCycle.id,
            );
            if (purchaseCycle) {
              updatePurchaseCycle(deal.cycles.purchaseCycle.id, {
                status: "acquired",
                actualCloseDate: now.split("T")[0],
              });
            }
          }

          // CRITICAL FIX: Update property status to 'sold' (ownership already updated by transferOwnership)
          // Only update status, not owner fields (they're already updated by transferOwnership)
          const currentProperty = getPropertyById(sellCycle.propertyId);
          if (currentProperty) {
            updateProperty(sellCycle.propertyId, {
              status: "sold",
              updatedAt: now,
            });
          }

          console.log("✅ Ownership transferred and cycles completed");
          console.log(`   - Property: ${sellCycle.propertyId}`);
          console.log(`   - Property Status: sold`);
          console.log(`   - New Owner: ${deal.parties.buyer.name}`);
          console.log(`   - Transaction: ${transactionId}`);
        } else {
          throw new Error(
            `Property ${sellCycle.propertyId} not found in database`,
          );
        }
      } else {
        throw new Error(`Sell Cycle ${deal.cycles.sellCycle.id} not found`);
      }
    } else if (deal.cycles.purchaseCycle) {
      // Single-cycle purchase deal (buyer-side only)
      console.log("📋 Processing single-cycle PURCHASE deal");
      console.log("   - Deal parties:", deal.parties);
      console.log("   - Buyer ID:", deal.parties.buyer.id);
      console.log("   - Buyer Name:", deal.parties.buyer.name);
      console.log("   - Seller ID:", deal.parties.seller.id);
      console.log("   - Seller Name:", deal.parties.seller.name);

      const purchaseCycle = getPurchaseCycleById(deal.cycles.purchaseCycle.id);

      if (purchaseCycle) {
        console.log("✅ Purchase cycle found:", purchaseCycle.id);
        console.log("   - Property ID:", purchaseCycle.propertyId);

        // Use getPropertyById - never use getProperties().find(); that can exclude the property.
        const property = getPropertyById(purchaseCycle.propertyId);

        if (property) {
          console.log("✅ Property found:", property.title);

          // Create transaction record
          const transactionId = `txn_${Date.now()}`;
          const transaction = {
            id: transactionId,
            propertyId: purchaseCycle.propertyId,
            type: "purchase" as const,
            agentId: deal.agents.primary.id,
            buyerName: deal.parties.buyer.name,
            buyerContactId: deal.parties.buyer.id,
            sellerName: deal.parties.seller.name,
            sellerContactId: deal.parties.seller.id,
            agreedPrice: deal.financial.agreedPrice, // Required by Transaction type
            acceptedOfferAmount: deal.financial.agreedPrice,
            commissionAmount: deal.financial.commission.total,
            acceptedDate: now.split("T")[0],
            startDate: deal.lifecycle.timeline.offerAcceptedDate || now, // Required by Transaction type
            status: "completed" as const,
            purchaseCycleId: deal.cycles.purchaseCycle.id,
            createdAt: now,
            updatedAt: now,
          } as any; // Cast to any to allow extra fields not in strict Transaction interface

          console.log(
            "🔍 Creating transaction for purchase cycle:",
            transaction,
          );
          saveTransaction(transaction);
          console.log("✅ Transaction saved successfully");

          // DATA FLOW CONNECTION: Link transaction to deal
          try {
            linkDealToTransaction(deal.id, transactionId);
          } catch (error) {
            console.error("Error linking transaction to deal:", error);
            // Don't throw - transaction is still saved
          }

          // Determine buyer type from purchase cycle
          let buyerType: "client" | "agency" | "investor" | "external" =
            "client";
          let investorShares = undefined;

          // Map purchaserType to ownerType
          if (purchaseCycle.purchaserType === "agency") {
            buyerType = "agency";
          } else if (purchaseCycle.purchaserType === "investor") {
            buyerType = "investor";
            investorShares = purchaseCycle.investors;
          } else {
            buyerType = "client";
          }

          // Transfer ownership to buyer
          console.log("🔄 Attempting ownership transfer...");
          console.log("   - Property ID:", purchaseCycle.propertyId);
          console.log("   - New Owner ID:", deal.parties.buyer.id);
          console.log("   - New Owner Name:", deal.parties.buyer.name);
          console.log("   - New Owner Type:", buyerType);
          console.log("   - Transaction ID:", transactionId);

          const ownershipResult = transferOwnership(
            purchaseCycle.propertyId,
            deal.parties.buyer.id,
            deal.parties.buyer.name,
            buyerType,
            transactionId,
            investorShares,
            deal.financial.agreedPrice,
            `Purchased via deal ${deal.dealNumber}. Seller: ${deal.parties.seller.name}. Buyer: ${deal.parties.buyer.name}. Price: ${deal.financial.agreedPrice}`,
          );

          if (!ownershipResult) {
            console.error(
              "❌ Ownership transfer FAILED - transferOwnership returned null",
            );
            console.error(
              "   - This usually means the property was not found or there was an error",
            );
          } else {
            console.log("✅ Ownership transferred successfully");
            console.log(
              "   - New current owner:",
              ownershipResult.currentOwnerId,
            );
          }

          // Update purchase cycle status
          updatePurchaseCycle(deal.cycles.purchaseCycle.id, {
            status: "acquired",
            actualCloseDate: now.split("T")[0],
          });

          // CRITICAL FIX: Update property status to 'sold' (for purchase-side deals too)
          // Ownership already updated by transferOwnership, just update status
          const currentProperty = getPropertyById(purchaseCycle.propertyId);
          if (currentProperty) {
            updateProperty(purchaseCycle.propertyId, {
              status: "sold",
              updatedAt: now,
            });
          }

          console.log("✅ Ownership transferred and purchase cycle completed");
          console.log(`   - Property: ${purchaseCycle.propertyId}`);
          console.log(`   - Property Status: sold`);
          console.log(`   - New Owner: ${deal.parties.buyer.name}`);
          console.log(`   - Transaction: ${transactionId}`);
        } else {
          // Property not found
          throw new Error(`Property ${purchaseCycle.propertyId} not found`);
        }
      } else {
        // Purchase cycle not found
        throw new Error(
          `Purchase Cycle ${deal.cycles.purchaseCycle.id} not found`,
        );
      }
    }
  } catch (error) {
    console.error("Error handling ownership transfer:", error);
    // CRITICAL FIX: Throw the error to prevent partial completion state
    // If ownership transfer fails, the entire deal completion should fail
    throw error;
  }

  // Update status
  deal.lifecycle.status = "completed";
  deal.lifecycle.timeline.actualClosingDate = now;
  // deal.metadata.completedAt = now; // Removed: Not in type definition

  // Mark all stages as completed
  Object.keys(deal.lifecycle.timeline.stages).forEach((key) => {
    const stageKey = key as keyof Deal["lifecycle"]["timeline"]["stages"];
    if (deal.lifecycle.timeline.stages[stageKey].status !== "completed") {
      deal.lifecycle.timeline.stages[stageKey].status = "completed";
      deal.lifecycle.timeline.stages[stageKey].completedAt = now;
      deal.lifecycle.timeline.stages[stageKey].completionPercentage = 100;
    }
  });

  // Update last action
  deal.collaboration.lastUpdatedBy = {
    agentId,
    agentName,
    timestamp: now,
    action: "deal-completed",
  };

  // Save and sync
  const deals = getDeals();
  const dealIndex = deals.findIndex((d) => d.id === dealId);
  deals[dealIndex] = deal;
  saveDeals(deals);

  // Use the proper sync function from dealSync.ts that updates cycle statuses
  syncDealToAllCyclesFromSync(deal);

  // Also ensure property status is synced (updateSellCycle already triggers this, but double-check)
  if (deal.cycles.sellCycle) {
    try {
      syncPropertyStatusFromSellCycle(deal.cycles.sellCycle.id);
    } catch (error) {
      console.error("Error syncing property status:", error);
    }
  }

  // Dispatch event to notify property components to reload
  const propertyId = deal.cycles.sellCycle?.propertyId;
  if (propertyId) {
    window.dispatchEvent(
      new CustomEvent("dealCompleted", {
        detail: {
          dealId: deal.id,
          propertyId: propertyId,
        },
      }),
    );
  }

  // Notify both agents
  createNotification({
    userId: deal.agents.primary.id,
    type: "DEAL_COMPLETED",
    title: "Deal Completed!",
    message: `Deal ${deal.dealNumber} has been successfully completed`,
    priority: "HIGH",
    entityType: "deal",
    entityId: deal.id,
  });

  if (deal.agents.secondary) {
    createNotification({
      userId: deal.agents.secondary.id,
      type: "DEAL_COMPLETED",
      title: "Deal Completed!",
      message: `Deal ${deal.dealNumber} has been successfully completed`,
      priority: "HIGH",
      entityType: "deal",
      entityId: deal.id,
    });
  }

  return deal;
};

/**
 * Cancel deal
 */
export const cancelDeal = (
  dealId: string,
  reason: string,
  agentId: string,
  agentName: string,
): Deal => {
  const deal = getDealById(dealId);

  if (!deal) {
    throw new Error(`Deal ${dealId} not found`);
  }

  const now = new Date().toISOString();

  // Update status
  deal.lifecycle.status = "cancelled";

  // Add cancellation note
  const note: DealNote = {
    id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    dealId,
    content: `Deal cancelled: ${reason}`,
    createdBy: agentId,
    createdByName: agentName,
    createdAt: now,
    updatedAt: now,
  };

  deal.collaboration.sharedNotes.push(note);

  // Update last action
  deal.collaboration.lastUpdatedBy = {
    agentId,
    agentName,
    timestamp: now,
    action: "deal-cancelled",
  };

  // Save and sync
  const deals = getDeals();
  const dealIndex = deals.findIndex((d) => d.id === dealId);
  deals[dealIndex] = deal;
  saveDeals(deals);

  syncDealToAllCyclesFromSync(deal);

  return deal;
};

/**
 * Sync deal to all cycles
 */
const syncDealToAllCycles = (deal: Deal): void => {
  // Sync to Sell Cycle (if exists - may not exist for single-cycle purchase deals)
  if (deal.cycles.sellCycle) {
    const sellCycle = getSellCycleById(deal.cycles.sellCycle.id);

    if (sellCycle) {
      // Use the correct links property names
      (sellCycle as any).linkedDealId = deal.id;
      (sellCycle as any).dealStage = deal.lifecycle.stage;
      saveSellCycle(sellCycle);
    }
  }

  // Sync to Purchase Cycle (if exists - may not exist for single-cycle sell deals)
  if (deal.cycles.purchaseCycle) {
    const purchaseCycle = getPurchaseCycleById(deal.cycles.purchaseCycle.id);

    if (purchaseCycle) {
      // Use the correct links property names
      (purchaseCycle as any).linkedDealId = deal.id;
      (purchaseCycle as any).dealStage = deal.lifecycle.stage;
      savePurchaseCycle(purchaseCycle);
    }
  }
};

/**
 * Sync stage progression to cycles
 */
const syncStageProgressionToCycles = (
  deal: Deal,
  newStage: DealStage,
): void => {
  // Sync to Sell Cycle (if exists)
  if (deal.cycles.sellCycle) {
    const sellCycle = getSellCycleById(deal.cycles.sellCycle.id);

    if (sellCycle) {
      sellCycle.dealStage = newStage;
      saveSellCycle(sellCycle);
    }
  }

  // Sync to Purchase Cycle (if exists)
  if (deal.cycles.purchaseCycle) {
    const purchaseCycle = getPurchaseCycleById(deal.cycles.purchaseCycle.id);

    if (purchaseCycle) {
      purchaseCycle.dealStage = newStage;
      savePurchaseCycle(purchaseCycle);
    }
  }
};

/**
 * Sync payment to cycles
 */
const syncPaymentToCycles = (deal: Deal, payment: DealPayment): void => {
  // Sync to Sell Cycle (if exists)
  if (deal.cycles.sellCycle) {
    const sellCycle = getSellCycleById(deal.cycles.sellCycle.id);

    if (sellCycle) {
      sellCycle.dealPayments = sellCycle.dealPayments || [];
      sellCycle.dealPayments.push(payment);
      saveSellCycle(sellCycle);
    }
  }

  // Sync to Purchase Cycle (if exists)
  if (deal.cycles.purchaseCycle) {
    const purchaseCycle = getPurchaseCycleById(deal.cycles.purchaseCycle.id);

    if (purchaseCycle) {
      purchaseCycle.dealPayments = purchaseCycle.dealPayments || [];
      purchaseCycle.dealPayments.push(payment);
      savePurchaseCycle(purchaseCycle);
    }
  }
};

/**
 * Get sell cycle by ID
 */
const getSellCycleById = (id: string): SellCycle | null => {
  const sellCycles = getSellCycles();
  return sellCycles.find((c) => c.id === id) || null;
};

/**
 * Get purchase cycle by ID
 */
const getPurchaseCycleById = (id: string): PurchaseCycle | null => {
  const purchaseCycles = getPurchaseCycles();
  return purchaseCycles.find((c) => c.id === id) || null;
};

/**
 * Save sell cycle
 */
const saveSellCycle = (cycle: SellCycle): void => {
  const sellCycles = getSellCycles();
  const index = sellCycles.findIndex((c) => c.id === cycle.id);

  if (index !== -1) {
    sellCycles[index] = cycle;
  } else {
    sellCycles.push(cycle);
  }

  saveSellCycles(sellCycles);
};

/**
 * Save purchase cycle
 */
const savePurchaseCycle = (cycle: PurchaseCycle): void => {
  const purchaseCycles = getPurchaseCycles();
  const index = purchaseCycles.findIndex((c) => c.id === cycle.id);

  if (index !== -1) {
    purchaseCycles[index] = cycle;
  } else {
    purchaseCycles.push(cycle);
  }

  savePurchaseCycles(purchaseCycles);
};

/**
 * Get all sell cycles
 */
const getSellCycles = (): SellCycle[] => {
  try {
    const data = localStorage.getItem("sell_cycles_v3");
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error reading sell cycles:", error);
    return [];
  }
};

/**
 * Save sell cycles to storage
 */
const saveSellCycles = (cycles: SellCycle[]): void => {
  try {
    localStorage.setItem("sell_cycles_v3", JSON.stringify(cycles));
  } catch (error) {
    console.error("Error saving sell cycles:", error);
    throw error;
  }
};

/**
 * Get all purchase cycles
 */
const getPurchaseCycles = (): PurchaseCycle[] => {
  try {
    const data = localStorage.getItem("purchase_cycles_v3");
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error reading purchase cycles:", error);
    return [];
  }
};

/**
 * Save purchase cycles to storage
 */
const savePurchaseCycles = (cycles: PurchaseCycle[]): void => {
  try {
    localStorage.setItem("purchase_cycles_v3", JSON.stringify(cycles));
  } catch (error) {
    console.error("Error saving purchase cycles:", error);
    throw error;
  }
};

/**
 * Update sell cycle
 */
const updateSellCycle = (id: string, updates: Partial<SellCycle>): void => {
  const cycles = getSellCycles();
  const index = cycles.findIndex((c) => c.id === id);

  if (index !== -1) {
    cycles[index] = { ...cycles[index], ...updates };
    saveSellCycles(cycles);
  }
};

/**
 * Update purchase cycle
 */
const updatePurchaseCycle = (
  id: string,
  updates: Partial<PurchaseCycle>,
): void => {
  const cycles = getPurchaseCycles();
  const index = cycles.findIndex((c) => c.id === id);

  if (index !== -1) {
    cycles[index] = { ...cycles[index], ...updates };
    savePurchaseCycles(cycles);
  }
};

// ============================================
// EXPORT ALIASES FOR CROSS-AGENT DEALS MODULE
// ============================================

/**
 * Export aliases for use by crossAgentDeals.ts
 * These allow the cross-agent module to access storage functions
 * without creating circular dependencies
 */
export const getDealsFromStorage = getDeals;
export const saveDealToStorage = (deal: Deal): void => {
  const deals = getDeals();
  deals.push(deal);
  saveDeals(deals);
};
export const updateDealInStorage = updateDeal;
