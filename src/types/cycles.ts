import {
  SharingSettings,
  PrivacySettings,
  CollaborationData,
  OfferCrossAgentTracking,
} from "./sharing";

/**
 * Cycle (Transaction Workflow) Types
 */

export type CycleStatus =
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
  | "acquired";

export interface BaseCycle {
  id: string;
  propertyId: string;
  agentId: string;
  agentName?: string;
  status: CycleStatus;
  title?: string;
  notes?: string;

  // Collaboration & Sharing
  sharing?: SharingSettings & {
    privacy?: PrivacySettings;
  };
  collaboration?: CollaborationData;

  createdAt: string;
  updatedAt: string;
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
  expectedCloseDate?: string;
  soldDate?: string;

  // Offers
  offers: Offer[];
  acceptedOfferId?: string;

  // Modality-specific
  sharedWith?: string[];
  videoTourUrl?: string;
  virtualTourUrl?: string;
  isPublished?: boolean;
  publishedOn?: string | string[];
  tags?: string[];
  internalNotes?: string;

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
  amount: number;
  offerAmount?: number; // V4 UI Alias for amount
  status: "pending" | "accepted" | "rejected" | "withdrawn" | "countered";
  propertyId: string;
  cycleId: string;
  cycleType: "sell" | "rent";
  buyerId: string;
  buyerName: string;
  buyerContact?: string;
  buyerEmail?: string;
  agentId: string; // The agent who submitted the offer
  notes?: string;
  submittedDate: string;
  offeredDate?: string; // V4 UI Alias for submittedDate
  expiryDate?: string;
  tokenAmount?: number; // V4 UI field

  // Cross-agent / Integration fields
  buyerRequirementId?: string;
  buyerAgentId?: string;
  buyerAgentName?: string;
  linkedPurchaseCycleId?: string;
  sourceType?: string;
  conditions?: string;
  agentNotes?: string;
  counterOfferAmount?: number;
  responseDate?: string;

  createdAt: string;
  updatedAt: string;
}
