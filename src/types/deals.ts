/**
 * Deal Types - Complete Real Estate Transaction Management
 *
 * Comprehensive type definitions for deals, offers, and cross-agent collaboration
 */

// ============================================
// CORE DEAL TYPES
// ============================================

/**
 * Deal - Complete real estate transaction between buyer and seller
 * Can involve one or two agents (single-cycle or dual-cycle)
 */
// COMMISSION TYPES
export type CommissionStatus =
  | "pending"
  | "pending-approval"
  | "approved"
  | "paid"
  | "cancelled"
  | "on-hold";

export interface CommissionAgent {
  id: string; // User ID or Contact ID
  type: "internal" | "external"; // internal=User agent, external=Contact broker
  entityType: "user" | "contact"; // For data fetching
  name: string;
  email?: string;
  phone?: string;
  percentage: number;
  amount: number;
  status: CommissionStatus;
  paidDate?: string;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
}

export interface Deal {
  id: string;
  dealNumber: string; // Format: DEAL-YYYY-NNN
  tenantId?: string;
  agencyId?: string;
  notes?: string;

  // DUAL-CYCLE INTEGRATION
  cycles: {
    sellCycle?: {
      id: string;
      agentId: string;
      agentName: string;
      propertyId: string;
      offerId: string;
    };
    purchaseCycle?: {
      id: string;
      agentId: string;
      agentName: string;
      buyerRequirementId: string;
    };
  };

  // AGENT ROLES & PERMISSIONS
  agents: {
    primary: {
      id: string;
      name: string;
      role: "seller-agent" | "buyer-agent";
      permissions: DealPermissions;
    };
    secondary?: {
      id: string;
      name: string;
      role: "seller-agent" | "buyer-agent";
      permissions: DealPermissions;
    };
  };

  // PARTIES
  parties: {
    seller: {
      id: string;
      name: string;
      contact: string;
      email: string;
      representedBy?: string; // Agent ID
    };
    buyer: {
      id: string;
      name: string;
      contact: string;
      email: string;
      representedBy?: string; // Agent ID
    };
  };

  // PROPERTY (Details often eager loaded or part of cycle)
  property: {
    id: string;
    title?: string;
    address: string;
  };

  // FINANCIAL
  financial: {
    agreedPrice: number;

    // Payment Plan
    paymentPlan?: DealPaymentPlan;
    paymentState:
      | "no-plan"
      | "plan-draft"
      | "plan-active"
      | "partially-paid"
      | "fully-paid"
      | "overdue"
      | "plan-modified";

    // Commission
    commission: {
      total: number;
      rate: number;
      payoutTrigger?: "booking" | "50-percent" | "possession" | "full-payment";
      agents?: CommissionAgent[];

      split: {
        primaryAgent: {
          percentage: number;
          amount: number;
          status: "pending" | "paid" | "cancelled";
        };
        secondaryAgent?: {
          percentage: number;
          amount: number;
          status: "pending" | "paid" | "cancelled";
        };
        agency: {
          percentage: number;
          amount: number;
          status?: CommissionStatus;
          notes?: string;
        };
      };

      // Commission received tracking
      receivedFromClient?: boolean;
      receivedAt?: string;
      receivedBy?: string;
      receivedByName?: string;
    };

    // Payments
    payments: DealPayment[];
    totalPaid: number;
    balanceRemaining: number;

    // Transfer Costs
    transferCosts: {
      stampDuty: number;
      registrationFee: number;
      legalFees: number;
      societyFee: number;
      other: number;
      total: number;
    };
  };

  // LIFECYCLE
  lifecycle: {
    stage: DealStage;
    status: "active" | "on-hold" | "cancelled" | "completed";

    timeline: {
      offerAcceptedDate: string;
      agreementSignedDate?: string;
      documentationCompleteDate?: string;
      paymentStartDate?: string;
      handoverDate?: string;
      transferCompletedDate?: string;
      actualClosingDate?: string;
      expectedClosingDate: string;

      stages: {
        offerAccepted: DealStageProgress;
        agreementSigning: DealStageProgress;
        documentation: DealStageProgress;
        paymentProcessing: DealStageProgress;
        handoverPrep: DealStageProgress;
        transferRegistration: DealStageProgress;
        finalHandover: DealStageProgress;
      };
    };
  };

  // COLLABORATION
  collaboration: {
    primaryAgentNotes: DealNote[];
    sharedNotes: DealNote[];
    secondaryAgentNotes: DealNote[];
    communications: DealCommunication[];
    lastUpdatedBy: {
      agentId: string;
      agentName: string;
      timestamp: string;
      action: string;
    };
  };

  // TASKS
  tasks: DealTask[];

  // DOCUMENTS
  documents: DealDocument[];

  // SYNC STATUS
  sync: {
    lastSyncedAt: string;
    sellCycleLastUpdated: string;
    purchaseCycleLastUpdated: string;
    isInSync: boolean;
  };

  // METADATA
  metadata: {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
  };
}

/**
 * Deal stage progression
 */
export type DealStage =
  | "offer-accepted"
  | "agreement-signing"
  | "documentation"
  | "payment-processing"
  | "handover-prep"
  | "transfer-registration"
  | "final-handover"
  | "completed";

/**
 * Progress tracking for each deal stage
 */
export interface DealStageProgress {
  status: "not-started" | "in-progress" | "completed";
  startedAt?: string;
  completedAt?: string;
  completionPercentage: number;
  tasksCompleted: number;
  totalTasks: number;
  notes?: string;
}

/**
 * Deal permissions for agent roles
 */
export interface DealPermissions {
  canViewFinancials: boolean;
  canEditNotes: boolean;
  canProgressStage: boolean;
  canRecordPayments: boolean;
  canEditPaymentPlan: boolean;
  canViewBuyerInfo: boolean;
  canViewSellerInfo: boolean;
  canUploadDocuments: boolean;
  canViewCommission: boolean;
  canEditCommission: boolean;
  // Legacy/Extended permissions
  canEdit: boolean;
  canUpdatePayments: boolean;
  canProgressStages: boolean;
  canCloseDeal: boolean;
  canViewAll: boolean;
  canDownloadDocs: boolean;
  canAddNotes: boolean;
  canSendMessages: boolean;
  canUpdateTasks: boolean;
}

/**
 * Payment Plan Modification Record
 */
export interface PaymentPlanModification {
  id: string;
  modifiedAt: string;
  modifiedBy: string;
  modifiedByName: string;
  modificationType:
    | "installment-added"
    | "installment-removed"
    | "amount-changed"
    | "date-changed"
    | "other";
  changes: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
  reason: string;
}

/**
 * Deal payment plan
 */
export interface DealPaymentPlan {
  id: string;
  dealId: string;
  installments: DealInstallment[];
  totalAmount: number;
  createdAt: string;
  createdBy: string;
  // Enhanced fields
  modifications?: PaymentPlanModification[];
  lastModified?: string;
  modifiedBy?: string;
  status?: "active" | "completed" | "cancelled" | "draft";
}
export type PaymentPlan = DealPaymentPlan;

/**
 * Payment installment
 */
export interface DealInstallment {
  id: string;
  name?: string; // Used for display title
  description?: string; // Alias/Alternate for name
  amount: number;
  dueDate: string;
  status:
    | "pending"
    | "paid"
    | "partially-paid"
    | "overdue"
    | "partial"
    | "canceled";
  amountPaid?: number;
  paidAmount?: number; // Alias for amountPaid
  paymentDate?: string;
  paidDate?: string; // Alias for paymentDate
  notes?: string;

  // Enhanced fields for modification tracking
  sequence?: number;
  paymentIds?: string[];
  wasModified?: boolean;
  modificationReason?: string;
  modifiedAt?: string;
  originalAmount?: number;
  originalDueDate?: string;
}
export type PaymentInstallment = DealInstallment;

/**
 * Individual payment record
 */
export interface DealPayment {
  id: string;
  dealId?: string;
  type?:
    | "ad-hoc"
    | "down-payment"
    | "installment"
    | "token"
    | "final-payment"
    | "other";
  date?: string;
  amount: number;
  method?: "cash" | "bank-transfer" | "cheque" | "online" | "financing";
  paymentMethod?: "cash" | "bank-transfer" | "cheque" | "online" | "financing"; // Alias
  status:
    | "pending"
    | "paid"
    | "partially-paid"
    | "overdue"
    | "verified"
    | "rejected"
    | "recorded";
  reference?: string;
  referenceNumber?: string; // Alias
  receiptNumber?: string;
  notes?: string;
  recordedBy:
    | string
    | { agentId: string; agentName: string; agentRole?: string };
  recordedByName?: string;
  recordedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  paidDate?: string;
  installmentId?: string; // Link to installment if from plan
}

/**
 * Deal note
 */
export interface DealNote {
  id: string;
  dealId?: string;
  content: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt?: string;
  isPinned?: boolean;
}

/**
 * Deal communication
 */
export interface DealCommunication {
  id: string;
  type: "call" | "email" | "meeting" | "sms" | "other";
  subject: string;
  content: string;
  participants: string[]; // Agent/Party IDs
  date: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

/**
 * Deal task
 */
export interface DealTask {
  id: string;
  dealId?: string;
  title: string;
  description?: string;
  stage: DealStage;
  assignedTo: string;
  assignedToName: string;
  assignedToRole?: string;
  dueDate: string;
  status: "not-started" | "in-progress" | "completed";
  completedAt?: string;
  completedBy?: string;
  priority: "low" | "medium" | "high" | "urgent";
  automated: boolean;
  createdAt: string;
}

/**
 * Deal document
 */
export interface DealDocument {
  id: string;
  dealId?: string;
  name: string;
  type: string;
  category: "agreement" | "payment" | "legal" | "transfer" | "other";
  url?: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  stage?: DealStage;
  required: boolean;
  status: "pending" | "uploaded" | "verified" | "rejected";
}

// ============================================
// OFFER TYPES
// ============================================

/**
 * Standard offer (from sell cycle)
 * Renamed to DealOffer to avoid conflict with core Offer type
 */
export interface DealOffer {
  id: string;
  sellCycleId: string;
  buyerId: string;
  buyerName: string;
  buyerContact?: string;
  buyerEmail?: string;
  offerAmount: number;
  tokenAmount?: number;
  conditions?: string;
  notes?: string;
  status: "pending" | "accepted" | "rejected" | "withdrawn" | "countered";
  submittedDate: string;
  responseDate?: string;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;

  // Cross-agent fields (if submitted through sharing system)
  submittedByAgentId?: string;
  submittedByAgentName?: string;
  fromRequirementId?: string;
  matchId?: string;
  submittedVia?: "direct" | "match" | "shared-listing";
}

/**
 * Buyer offer (from purchase cycle)
 */
export interface BuyerOffer {
  id: string;
  requirementId: string;
  propertyId: string;
  buyerContactId: string;
  offerAmount: number;
  tokenAmount: number;
  conditions?: string;
  status: "drafted" | "submitted" | "accepted" | "rejected" | "countered";
  dealSource: "internal-match" | "external-market";
  listingAgentId?: string; // For internal matches
  buyingAgentId: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// CROSS-AGENT COLLABORATION TYPES
// ============================================

/**
 * Complete cross-agent offer data structure
 * Used when agents submit offers through the sharing system
 */
export interface CrossAgentOffer {
  // Core offer fields
  id: string;
  amount: number;

  // Buyer/Tenant info
  buyerId: string;
  buyerName: string;
  buyerContact: string;
  buyerEmail?: string;

  // Agent info (cross-agent support)
  submittedByAgentId: string; // The agent submitting on behalf of buyer
  submittedByAgentName: string;
  submittedByAgentContact?: string; // For coordination

  // Match tracking
  fromRequirementId?: string; // The requirement that led to this offer
  matchId?: string; // The match that prompted this offer
  matchScore?: number; // For reference
  submittedVia: "direct" | "match" | "shared-listing";

  // Status tracking
  status: "pending" | "accepted" | "rejected" | "withdrawn" | "countered";

  // Dates
  submittedDate: string;
  responseDate?: string;
  expiryDate?: string;

  // Notes
  buyerNotes?: string; // Visible to listing agent
  agentNotes?: string; // Private to submitting agent
  listingAgentNotes?: string; // Private to listing agent

  // Coordination
  coordinationRequired?: boolean; // If agents need to coordinate
  meetingScheduled?: string; // ISO date if meeting set

  // Metadata
  createdAt: string;
  updatedAt: string;
}

/**
 * Fields to add to Deal for cross-agent tracking
 * EXTENDS the base Deal type with cross-agent collaboration fields
 */
export interface DealAgentTracking {
  buyerAgentId?: string; // If buyer has an agent
  buyerAgentName?: string;
  sellerAgentId?: string; // Always present
  sellerAgentName?: string;

  // Commission split when both agents involved
  crossAgentCommission?: {
    buyerAgentPercentage: number;
    buyerAgentAmount: number;
    sellerAgentPercentage: number;
    sellerAgentAmount: number;
    splitRatio: string; // e.g., "60/40", "50/50"
  };

  // Coordination
  coordinationNotes?: DealNote[];
  jointMeetings?: DealCommunication[];
}

/**
 * Extended Deal type with cross-agent support
 * Use this for deals created from cross-agent offers
 */
export interface CrossAgentDeal extends Deal {
  crossAgentTracking: DealAgentTracking;
  originatedFromMatch?: boolean;
  matchId?: string;
  requirementId?: string;
}

// ============================================
// DEAL CREATION & LINKING TYPES
// ============================================

/**
 * Parameters for creating a deal from an accepted cross-agent offer
 */
export interface CreateDealFromCrossAgentOfferParams {
  offer: CrossAgentOffer;
  sellCycle: any; // SellCycle type
  listingAgent: {
    id: string;
    name: string;
  };
  buyerAgent: {
    id: string;
    name: string;
  };
  property: any; // Property type
  commissionSplitRatio?: [number, number]; // e.g., [60, 40]
}

/**
 * Parameters for linking cycles to a deal
 */
export interface LinkCyclesToDealParams {
  dealId: string;
  sellCycleId: string;
  purchaseCycleId?: string;
  rentCycleId?: string;
}

/**
 * Result of linking operation
 */
export interface LinkCyclesResult {
  success: boolean;
  dealId: string;
  linkedCycles: {
    sellCycle?: string;
    purchaseCycle?: string;
    rentCycle?: string;
  };
  errors?: string[];
}

// ============================================
// TYPE GUARDS & UTILITIES
// ============================================

/**
 * Check if deal involves two agents
 */
export function isCrossAgentDeal(deal: Deal): deal is CrossAgentDeal {
  return !!deal.agents.secondary;
}

/**
 * Check if deal has a buyer agent
 */
export function hasBuyerAgent(deal: Deal): boolean {
  return !!deal.cycles.purchaseCycle;
}

/**
 * Check if offer is cross-agent
 */
export function isCrossAgentOffer(
  offer: DealOffer | CrossAgentOffer,
): offer is CrossAgentOffer {
  return "submittedByAgentId" in offer && !!offer.submittedByAgentId;
}
