/**
 * Prisma-aligned model interfaces for Aaraazi frontend.
 * Matches Aaraazi-Backend/prisma/schema.prisma (JSON-safe: Date -> string, Decimal -> number).
 */

import type {
  UserRole,
  UserStatus,
  AgencyType,
  Module,
  TenantStatus,
  PropertyType,
  PropertyListingStatus,
  ListingType,
  LeadStatus,
  LeadStage,
  LeadSource,
  LeadIntent,
  ContactType,
  ContactCategory,
  ContactStatus,
  AreaUnit,
  CycleStatus,
  DealStage,
  DealStatus,
  TaskStatus,
  TaskPriority,
  TaskType,
  RequirementType,
  RequirementStatus,
  BranchStatus,
  ListingVisibility,
  Priority,
  NotificationType,
} from './enums';

// ============================================================================
// Multi-Tenancy & Core
// ============================================================================

export interface TenantBranding {
  id: string;
  tenantId: string;
  companyName: string;
  portalTitle: string | null;
  logoUrl: string | null;
  iconUrl: string | null;
  loginBannerUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string | null;
  currency: string;
  language: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  status: TenantStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  subscriptionPlanId: string | null;
  billingInfo: Record<string, unknown> | null;
  branding?: TenantBranding | null;
  agencies?: Agency[];
}

export interface Agency {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  type: AgencyType;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Branch {
  id: string;
  agencyId: string;
  name: string;
  address: Record<string, unknown> | null;
  contact: Record<string, unknown> | null;
  modules: Module[];
  status: BranchStatus;
  noOfEmployees: number | null;
  branchManagerId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface User {
  id: string;
  tenantId: string | null;
  agencyId: string | null;
  branchId: string | null;
  email: string;
  name: string;
  password?: string | null;
  role: UserRole;
  status: UserStatus;
  avatar: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  lastLoginAt: string | null;
  permissions: Record<string, unknown>;
  modules: Module[];
}

/** User without password for API responses and UI */
export type SafeUser = Omit<User, 'password'> & { password?: never };

export interface UserSession {
  id: string;
  userId: string;
  tenantId: string;
  agencyId: string | null;
  sessionToken: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceInfo: Record<string, unknown> | null;
  loginAt: string;
  lastActivityAt: string;
  logoutAt: string | null;
  expiresAt: string;
  isActive: boolean;
  user?: SafeUser;
  tenant?: Tenant;
  agency?: Agency | null;
}

// ============================================================================
// CRM
// ============================================================================

export interface Lead {
  id: string;
  tenantId: string;
  agencyId: string;
  branchId: string | null;
  agentId: string;
  marketingCampaignId: string | null;
  leadNumber: string;
  name: string;
  phone: string;
  email: string | null;
  source: LeadSource;
  status: LeadStatus;
  stage: LeadStage;
  intent: LeadIntent;
  timeline: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  notes: string | null;
  priority: Priority;
  lostReason: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  convertedAt: string | null;
  convertedToContactId: string | null;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface Contact {
  id: string;
  tenantId: string;
  agencyId: string;
  branchId: string | null;
  agentId: string | null;
  contactNumber: string;
  type: ContactType;
  category: ContactCategory;
  status: ContactStatus;
  name: string;
  email: string | null;
  phone: string;
  alternatePhone: string | null;
  address: string | null;
  preferences: Record<string, unknown> | null;
  tags: string;
  isShared: boolean;
  originLeadId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  /** Frontend-only: last contact date (ISO string) */
  lastContactDate?: string;
  /** Frontend-only: next follow-up date (ISO string) */
  nextFollowUp?: string;
}

export interface Task {
  id: string;
  tenantId: string;
  agencyId: string;
  title: string;
  description: string | null;
  dueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  assignedToId: string;
  relatedToType: string | null;
  contactId: string | null;
  dealId: string | null;
  propertyListingId: string | null;
  leadId: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
}

// ============================================================================
// Requirements
// ============================================================================

export interface Requirement {
  id: string;
  tenantId: string;
  agencyId: string;
  agentId: string;
  contactId: string;
  requirementNumber: string;
  type: RequirementType;
  minPrice: number | null;
  maxPrice: number | null;
  minArea: number | null;
  maxArea: number | null;
  areaUnit: AreaUnit | null;
  propertyType: string;
  locations: Record<string, unknown>;
  bedrooms: number | null;
  bathrooms: number | null;
  mustHaveFeatures: Record<string, unknown> | null;
  features: string;
  status: RequirementStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// ============================================================================
// Location
// ============================================================================

export interface Country {
  id: string;
  name: string;
  code: string;
  currency: string;
  createdAt: string;
}

export interface City {
  id: string;
  name: string;
  countryId: string;
  stateProvince: string | null;
  createdAt: string;
}

export interface Area {
  id: string;
  name: string;
  cityId: string;
  postalCode: string | null;
  createdAt: string;
}

export interface Block {
  id: string;
  name: string;
  areaId: string;
  createdAt: string;
}

export interface Address {
  id: string;
  addressType: string;
  countryId: string;
  cityId: string;
  areaId: string;
  blockId: string | null;
  plotNo: string | null;
  streetNo: string | null;
  buildingName: string | null;
  floorNo: string | null;
  apartmentNo: string | null;
  shopNo: string | null;
  fullAddress: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  addressHash: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Property & Listings
// ============================================================================

export interface MasterProperty {
  id: string;
  propertyCode: string;
  addressId: string;
  type: PropertyType;
  area: number;
  areaUnit: AreaUnit;
  bedrooms: number | null;
  bathrooms: number | null;
  features: string;
  constructionYear: number | null;
  currentOwnerName: string | null;
  currentOwnerCNIC: string | null;
  currentOwnerPhone: string | null;
  lastVerifiedAt: string | null;
  lastTransactionDate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  updatedBy: string | null;
}

export interface PropertyListing {
  id: string;
  tenantId: string;
  agencyId: string;
  branchId: string | null;
  agentId: string;
  masterPropertyId: string;
  visibility: ListingVisibility;
  sharedWithAgents: string | null;
  sharedWithBranches: string | null;
  isAgencyWide: boolean;
  acquisitionType: string;
  targetResalePrice: number | null;
  holdingCost: number;
  acquiredDate: string | null;
  title: string;
  description: string | null;
  listingType: ListingType;
  status: PropertyListingStatus;
  price: number;
  images: string;
  virtualTourUrl: string | null;
  videoUrl: string | null;
  notes: string | null;
  isPrivate: boolean;
  isArchived: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  deletedBy: string | null;
}

// ============================================================================
// Deals
// ============================================================================

export interface Deal {
  id: string;
  dealNumber: string;
  tenantId: string;
  agencyId: string;
  notes: string;
  branchId: string | null;
  sellCycleId: string | null;
  purchaseCycleId: string | null;
  propertyListingId: string | null;
  masterPropertyId: string | null;
  primaryAgentId: string;
  secondaryAgentId: string | null;
  buyerContactId: string | null;
  sellerContactId: string | null;
  status: DealStatus;
  stage: DealStage;
  agreedPrice: number;
  commissionTotal: number | null;
  closingDate: string | null;
  actualClosingDate: string | null;
  ownershipTransferred: boolean;
  masterDataSynced: boolean;
  syncedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
}

// ============================================================================
// Notifications
// ============================================================================

export interface Notification {
  id: string;
  tenantId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  isRead: boolean;
  readAt: string | null;
  priority: Priority;
  expiresAt: string | null;
  createdAt: string;
}
