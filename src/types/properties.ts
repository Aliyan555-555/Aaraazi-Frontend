import { PropertyAddress } from "./locations";

/**
 * Property Management Types
 */

export type PropertyType =
  | "house"
  | "apartment"
  | "plot"
  | "commercial"
  | "land"
  | "industrial";
export type AreaUnit = "sqft" | "sqyards" | "marla" | "kanal";
export type PropertyStatus =
  | "available"
  | "sold"
  | "rented"
  | "under-offer"
  | "under-contract";

export interface Property {
  id: string;
  title: string;
  description?: string;
  address: string | any; // V4 often uses string, but can be PropertyAddress
  addressDetails?: PropertyAddress;
  city?: string;
  area: number | string;
  areaUnit: AreaUnit;
  propertyType: PropertyType;
  price: number;
  status: PropertyStatus;
  agentId: string;
  agentName?: string;
  assignedAgent?: string;
  assignedAgentName?: string;
  createdBy: string;
  sharedWith: string[];
  archived?: boolean;
  archivedAt?: string;

  // V3.0 Asset-Centric Lifecycle IDs
  activeSellCycleIds?: string[];
  activeRentCycleIds?: string[];
  activePurchaseCycleIds?: string[];

  // Specs
  bedrooms?: number;
  bathrooms?: number;
  floor?: number;
  constructionYear?: number;
  parkingSpaces?: number;
  features?: string[];
  isInternalListing?: boolean;
  images?: string[];

  // Listing Info
  listingType?:
    | "sale"
    | "rent"
    | "for-sale"
    | "for-rent"
    | "wanted"
    | "investor";
  rentAmount?: number;
  securityDeposit?: number;
  listedDate?: string;
  notes?: string;
  acquisitionType?: "direct" | "investor-purchase" | "joint-venture";
  isPublished?: boolean;
  publishedOn?: string | string[];

  // Analytics
  viewCount?: number;
  inquiryCount?: number;

  // Financials & Ownership (Historical/V3 legacy often used in reports)
  soldDate?: string;
  finalSalePrice?: number;
  commissionEarned?: number;
  commissionRate?: number;
  currentOwnerId?: string;
  currentOwnerName?: string;
  currentOwnerType?: "client" | "agency" | "investor" | "external";
  ownershipHistory?: any[]; // Full OwnershipRecord[] type might cause circular dependency if imported
  investorShares?: any[]; // InvestorShare[]
  transactionIds?: string[];
  cycleHistory?: any;

  // Legacy/Module Specific
  type?: string;

  // Buyer Requirement fields (when listingType === 'wanted')
  budgetMin?: number;
  budgetMax?: number;
  preferredLocations?: string[];
  shortlistedProperties?: string[];
  viewingFeedback?: Array<{
    propertyId: string;
    feedback: string;
    rating?: number;
    date?: string;
  }>;

  // Metadata
  createdAt: string;
  updatedAt: string;
}
