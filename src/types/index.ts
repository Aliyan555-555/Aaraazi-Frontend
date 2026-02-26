/**
 * Aaraazi Frontend Types - Prisma schema aligned.
 */

import type { User as AuthUser } from "./auth.types";
import { UserRole } from "./schema";

export {
  UserRole,
  UserStatus,
  AgencyType,
  Module,
  PropertyListingStatus,
  ListingType,
  LeadStatus,
  LeadStage,
  LeadSource,
  LeadIntent,
  Priority,
  CycleStatus,
  DealStage,
  DealStatus,
  TaskStatus,
  TaskPriority,
  TaskType,
  ContactType as SchemaContactType,
  ContactCategory as SchemaContactCategory,
  ContactStatus as SchemaContactStatus,
  TenantStatus,
  RequirementType,
  RequirementStatus,
  NotificationType,
  ListingVisibility,
  BranchStatus,
} from "./schema";
export type { PropertyType, AreaUnit } from "./schema";
export type {
  Tenant,
  TenantBranding,
  Agency as SchemaAgency,
  Branch,
  User as SchemaUser,
  SafeUser,
  UserSession as SchemaUserSession,
  Lead,
  Contact as SchemaContact,
  Task,
  Requirement,
  Country,
  City,
  Area,
  Block,
  Address,
  MasterProperty,
  PropertyListing,
  Deal as SchemaDeal,
  Notification as SchemaNotification,
} from "./schema";

// ============================================================================
// Auth types (uses schema; auth-specific DTOs)
// ============================================================================

export type {
  User as AuthUser,
  Branding,
  Agency as AuthAgency,
  Tenant as AuthTenant,
  UserSession as AuthUserSession,
  LoginDto,
  LoginResponse,
  TenantLookupQuery,
  TenantLookupResponse,
  SessionResponse,
  AuthState,
  ApiError,
} from "./auth.types";
export { AuthError } from "./auth.types";

// ============================================================================
// UI compatibility: Dashboard and components that expect role 'admin' | 'agent'
// ============================================================================

export type UserRoleUI = "admin" | "agent";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRoleUI;
  avatar?: string | null;
  contactNumber?: string;
}

// ============================================================================
// Core entities (legacy; prefer schema types where applicable)
// ============================================================================

export type { Property, PropertyStatus } from "./properties";
export * from "./contacts";
export * from "./cycles";
export * from "./requirements";
export * from "./transactions";
export * from "./payments";
export * from "./financials";

// ============================================================================
// Module types
// ============================================================================

export * from "./accounting";
export * from "./crm";
export * from "./custom-reports";
export * from "./deals";
export type { PaymentPlan } from "./payments";
export * from "./documents";
export * from "./investors";
export * from "./inventory";
export * from "./leads";
export * from "./leadsIntegration";
export * from "./locations";
export * from "./notifications";
export * from "./paymentSchedule";
export * from "./report-history";
export * from "./reports";
export * from "./tasks";

// Sharing
export type {
  AccessLevel,
  CycleType,
  RequirementType as SharingRequirementType,
  ShareLevel,
  PropertyMatch,
  MatchDetails,
  SharingSettings,
  PrivacySettings,
  CollaborationData,
  ShareEvent,
  Inquiry,
  AccessContext,
  PermissionCheck,
  SellCycleSharing,
  RentCycleSharing,
  BuyerRequirementMatching,
  RentRequirementMatching,
  OfferCrossAgentTracking,
} from "./sharing";

/** Map auth store user (schema) to UI User (role 'admin' | 'agent') for dashboard and components. */
export function mapAuthUserToUIUser(saasUser: AuthUser | null): User | null {
  if (!saasUser) return null;
  const role: UserRoleUI =
    saasUser.role === UserRole.SAAS_ADMIN ||
    saasUser.role === UserRole.AGENCY_OWNER ||
    saasUser.role === UserRole.AGENCY_MANAGER
      ? "admin"
      : "agent";
  return {
    id: saasUser.id,
    name: saasUser.name,
    email: saasUser.email,
    role,
    avatar: saasUser.avatar,
    contactNumber: saasUser.phone ?? "",
  };
}
