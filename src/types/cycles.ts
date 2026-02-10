import {
  SharingSettings,
  PrivacySettings,
  CollaborationData,
  OfferCrossAgentTracking,
} from "./sharing";

/**
 * Cycle (Transaction Workflow) Types
 */

export type CycleStatusType =
  | "active"
  | "pending"
  | "completed"
  | "cancelled"
  | "on-hold"
  | "showing"
  | "leased"
  | "renewal-pending"
  | "ending"
  | "ended"
  | "application-received"
  | "applications-received"
  | "available"
  | "listed"
  | "negotiation"
  | "under-contract"
  | "sold"
  | "rejected"
  | "offer-received"
  | "offer-made"
  | "under-offer"
  | "prospecting"
  | "due-diligence"
  | "financing"
  | "closing"
  | "accepted"
  | "acquired";

export type PurchaserType = "agency" | "investor" | "client";

export interface BaseCycle {
  id: string;
  propertyId: string;
  agentId: string;
  agentName?: string;
  status: CycleStatusType;
  title?: string;
  notes?: string;

  // Collaboration & Sharing
  sharing?: SharingSettings;
  privacy?: PrivacySettings;
  collaboration?: CollaborationData;

  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface SellCycle extends BaseCycle {
  // Seller info
  sellerType: "client" | "developer" | "sub-agent" | string;
  sellerId: string;
  sellerName: string;

  // Marketing
  askingPrice: number;
  minPrice?: number;
  commissionRate: number;
  commissionType: "percentage" | "fixed";
  title: string;
  description?: string;
  images?: string[];
  amenities?: string[];

  // Dates
  listedDate: string;
  publishedDate?: string;
  expectedCloseDate?: string;
  soldDate?: string;

  // Offers
  offers: Offer[];
  acceptedOfferId?: string;

  // Modality-specific
  sharedWith: string[];
  videoTourUrl?: string;
  virtualTourUrl?: string;
  isPublished?: boolean;
  publishedOn?: string | string[];
  tags?: string[];
  internalNotes?: string;

  // Sharing & Collaboration
  sharing?: any;
  privacy?: any;
  collaboration?: any;

  // Links & Sync
  linkedDealId?: string;
  createdDealId?: string;
  winningPurchaseCycleId?: string;
  dealStage?: string;
  dealPayments?: any[];
}

export interface RentCycle extends BaseCycle {
  monthlyRent: number;
  securityDeposit?: number;
  commissionAmount?: number;
  offersSubmitted?: string[]; // Offer IDs

  // Rental Specifics
  landlordType?: string;
  landlordId?: string;
  landlordName?: string;
  leasePeriod?: string;
  availableFrom?: string;
  minimumLeasePeriod?: string;
  utilitiesIncluded?: boolean;
  maintenanceIncluded?: boolean;
  maintenanceResponsibility?: string;
  propertyManagerId?: string;
  propertyManagerName?: string;
  rentDueDay?: number;
  publishedOn?: string;
  isPublished?: boolean;

  // Lifecycle Data
  applications?: any[];
  rentPayments?: any[];
  leaseStartDate?: string;
  leaseEndDate?: string;
  leaseHistory?: any[];
  currentTenantId?: string;
  currentTenantName?: string;
  agentName?: string;
}

export interface PurchaseCycle extends BaseCycle {
  targetPrice?: number;
  maxPrice?: number;
  investmentGoal?: string;
  actualCloseDate?: string;
  buyerRequirementId?: string;
  purchaserName?: string;
  purchaserType?: string;
  investors?: any[]; // InvestorShare[]

  // Financials (Agency Owned / Investment)
  offerDate?: string;
  offerAmount?: number;
  renovationBudget?: number;
  expectedResaleValue?: number;
  targetROI?: number;

  // Seller Details
  sellerId?: string;
  sellerName?: string;
  sellerContact?: string;
  sellerType?: string;

  // Financials & Deal Structure
  askingPrice?: number;
  negotiatedPrice?: number;
  tokenAmount?: number;
  purchaserId?: string;

  // Commission & Fees
  facilitationFee?: number;
  commissionRate?: number;
  commissionAmount?: number;
  commissionType?: string;
  commissionSource?: string;

  // Investment Specifics
  purpose?: string;
  investmentNotes?: string;

  // Buyer/Client Specifics
  buyerBudgetMin?: number;
  buyerBudgetMax?: number;
  buyerPrequalified?: boolean;
  buyerFinancingType?: string;
  matchedFromRequirementId?: string;
  conditions?: string;

  // Financing
  financingType?: string;
  loanAmount?: number;
  loanApproved?: boolean;
  bankName?: string;

  // Dates
  targetCloseDate?: string;
  acceptanceDate?: string;

  // Due Diligence
  titleClear?: boolean;
  inspectionDone?: boolean;
  documentsVerified?: boolean;
  surveyCompleted?: boolean;

  // Costs
  estimatedClosingCosts?: number;
  additionalCosts?: number;

  // Notes & Logs
  internalNotes?: string;
  communicationLog?: any[];

  // Links
  linkedSellCycleOfferId?: string;

  // Links & Sync
  linkedDealId?: string;
  createdDealId?: string;
  linkedSellCycleId?: string;
  dealStage?: string;
  dealPayments?: any[];
}

/**
 * Offer Type
 */
export interface Offer extends Partial<OfferCrossAgentTracking> {
  id: string;
  amount?: number;
  offerAmount: number; // Required by V3.0
  status: "pending" | "accepted" | "rejected" | "withdrawn" | "countered";
  propertyId?: string;
  cycleId?: string;
  cycleType?: "sell" | "rent";
  buyerId: string;
  buyerName: string;
  buyerContact?: string;
  buyerEmail?: string;
  agentId?: string;
  notes?: string;
  submittedDate?: string;
  offeredDate: string; // Required by V3.0
  expiryDate?: string;
  tokenAmount?: number;

  // Cross-agent / Integration fields
  buyerRequirementId?: string;
  buyerAgentId?: string;
  buyerAgentName?: string;
  linkedPurchaseCycleId?: string;
  sourceType?: string;
  conditions?: string;
  agentNotes?: string;
  listingAgentNotes?: string;
  matchScore?: number;
  coordinationRequired?: boolean;
  counterOfferAmount?: number;
  responseDate?: string;

  createdAt: string;
  updatedAt: string;
}
