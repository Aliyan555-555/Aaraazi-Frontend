import {
  CrossAgentOffer as BaseCrossAgentOffer,
  DealAgentTracking as BaseDealAgentTracking,
} from "./deals";

/**
 * Sharing Functionality Types
 * Types for property matching, sharing settings, and collaboration
 */

// ============================================
// ACCESS CONTROL TYPES
// ============================================

/**
 * Access level for a user viewing a cycle/resource
 */
export type AccessLevel =
  | "owner"
  | "shared-peer"
  | "manager"
  | "admin"
  | "none";

/**
 * User role (extended to include manager)
 */
export type UserRole = "admin" | "manager" | "agent";

/**
 * Cycle types
 */
export type CycleType = "sell" | "rent";

/**
 * Requirement types
 */
export type RequirementType = "buyer" | "rent";

/**
 * Share level (for future expansion)
 */
export type ShareLevel = "none" | "team" | "organization";

// ============================================
// SMART MATCHING TYPES
// ============================================

/**
 * Property Match
 * Represents a match between a shared cycle and a requirement
 */
export interface PropertyMatch {
  matchId: string;

  // Cycle side (Sell OR Rent Cycle)
  cycleId: string; // SellCycle ID OR RentCycle ID
  cycleType: CycleType; // 'sell' or 'rent'
  listingAgentId: string;
  listingAgentName: string;

  // Requirement side (Buyer OR Rent Requirement)
  requirementId: string; // BuyerRequirement OR RentRequirement ID
  requirementType: RequirementType; // 'buyer' or 'rent'

  // Agent details (depends on requirement type)
  buyerAgentId?: string; // If buyer requirement
  buyerAgentName?: string;
  renterAgentId?: string; // If rent requirement
  renterAgentName?: string;

  // Matching
  matchScore: number; // 0-100
  matchDetails: MatchDetails;
  matchedAt: string;

  // Status
  status:
    | "pending"
    | "viewed"
    | "offer-submitted"
    | "accepted"
    | "deal-created"
    | "dismissed";

  // Tracking
  viewedAt?: string;
  notificationSent: boolean;
  dismissedAt?: string;
  dismissReason?: string;

  // Links
  offerId?: string; // If offer was submitted
  dealId?: string; // If deal was created

  // UI Enrichment (Optional)
  property?: import("./properties").Property;

  updatedAt: string;
}

/**
 * Match Details
 * Breakdown of what matched and what didn't
 */
export interface MatchDetails {
  propertyTypeMatch: boolean;
  locationMatch: boolean;
  priceMatch: boolean;
  areaMatch: boolean;
  bedroomsMatch: boolean;
  bathroomsMatch: boolean;
  featuresMatch: string[]; // Array of matching features
  overallScore: number;
}

// ============================================
// SHARING SETTINGS TYPES
// ============================================

/**
 * Sharing settings for cycles
 */
export interface SharingSettings {
  isShared: boolean;
  sharedAt?: string;
  sharedWith?: string[]; // Future: specific agents (empty = all)
  shareLevel: ShareLevel;
  shareHistory?: ShareEvent[];
}

/**
 * Privacy settings for cycles
 */
export interface PrivacySettings {
  hideOwnerDetails: boolean;
  hideSellerContact?: boolean;
  hideNegotiations: boolean;
  hideCommissions: boolean;
  allowManagerView: boolean;
}

/**
 * Collaboration data for cycles
 */
export interface CollaborationData {
  viewCount: number;
  viewedBy: string[];
  lastViewedAt?: string;
  inquiries?: Inquiry[];
}

/**
 * Share event (audit trail)
 */
export interface ShareEvent {
  action: "shared" | "unshared";
  timestamp: string;
  userId: string;
  userName: string;
}

/**
 * Inquiry from one agent to another
 */
export interface Inquiry {
  id: string;
  fromAgentId: string;
  fromAgentName: string;
  fromAgentContact?: string;
  message: string;
  timestamp: string;
  status: "pending" | "responded" | "ignored";
  response?: string;
  respondedAt?: string;
}

// ============================================
// PERMISSION TYPES
// ============================================

/**
 * Access context for permission calculation
 */
export interface AccessContext {
  userId: string;
  userRole: UserRole;
  cycleId: string;
  cycleType: CycleType;
  cycleOwnerId: string;
  isShared: boolean;
}

/**
 * Permission check result
 */
export interface PermissionCheck {
  // View permissions
  canViewProperty: boolean;
  canViewOwner: boolean;
  canViewOwnerContact: boolean;
  canViewInterestedContacts: boolean;
  canViewContactDetails: boolean;
  canViewOffers: boolean;
  canViewOfferDetails: boolean;
  canSubmitOffer: boolean;
  canAcceptOffer: boolean;
  canViewCRM: boolean;
  canViewPrivateNotes: boolean;
  canViewFinancials: boolean;
  canViewCommission: boolean;
  canViewDocuments: boolean;
  canViewTransactions: boolean;

  // Action permissions
  canEditCycle: boolean;
  canDeleteCycle: boolean;
  canShareCycle: boolean;
}

// ============================================
// EXTENSION INTERFACES
// ============================================

/**
 * Fields to add to SellCycle
 */
export interface SellCycleSharing {
  sharing?: SharingSettings;
  privacy?: PrivacySettings;
  collaboration?: CollaborationData;
}

/**
 * Fields to add to RentCycle
 */
export interface RentCycleSharing {
  sharing?: SharingSettings;
  privacy?: PrivacySettings;
  collaboration?: CollaborationData;
}

/**
 * Fields to add to BuyerRequirement
 */
export interface BuyerRequirementMatching {
  matchedProperties?: string[]; // PropertyMatch IDs
  matchCount?: number;
  lastMatchAt?: string;
  offersSubmitted?: string[]; // Offer IDs
}

/**
 * Fields to add to RentRequirement
 */
export interface RentRequirementMatching {
  matchedProperties?: string[]; // PropertyMatch IDs
  matchCount?: number;
  lastMatchAt?: string;
  offersSubmitted?: string[]; // Offer IDs
}

/**
 * Fields to add to Offer for cross-agent tracking
 */
export interface OfferCrossAgentTracking {
  submittedByAgentId?: string; // If from another agent
  submittedByAgentName?: string;
  submittedByAgentContact?: string;
  fromRequirementId?: string; // Link to requirement
  matchId?: string; // Link to match
  submittedVia?: "direct" | "match" | "shared-listing";
}

// ============================================
// CROSS-AGENT OFFER ALIASES (Consolidated in deals.ts)
// ============================================

/**
 * Complete cross-agent offer data structure
 */
export type CrossAgentOffer = BaseCrossAgentOffer;

/**
 * Fields to add to Deal for agent tracking
 */
export type DealAgentTracking = BaseDealAgentTracking;
