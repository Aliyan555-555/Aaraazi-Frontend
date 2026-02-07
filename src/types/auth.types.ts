
import type { User as SchemaUser } from './schema';
import { UserRole, UserStatus, Module } from './schema';
export { UserRole, UserStatus, Module };

export type User = SchemaUser;
/** Alias for auth/schema user when disambiguating from UI User (role 'admin'|'agent') */
export type AuthUser = User;

export interface Branding {
  companyName: string;
  logoUrl?: string;
  iconUrl?: string;
  loginBannerUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  backgroundColor?: string;
  portalTitle?: string;
}

export interface Agency {
  id: string;
  name: string;
  code: string;
  type: string;
  tenantId: string;
}

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  branding: Branding;
  agencies: Agency[];
}

// ============================================================================
// Session Types
// ============================================================================

export interface UserSession {
  id: string;
  userId: string;
  tenantId: string;
  agencyId: string | null;
  sessionToken: string;
  ipAddress: string | null;
  userAgent: string | null;
  loginAt: string;
  lastActivityAt: string;
  expiresAt: string;
  isActive: boolean;
  user: User;
  tenant: Tenant;
  agency: Agency | null;
}

// ============================================================================
// Auth DTOs (Data Transfer Objects)
// ============================================================================

export interface LoginDto {
  tenantId: string;
  agencyId?: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresAt: string;
  user: User;
}

export interface TenantLookupQuery {
  domain: string;
}

export interface TenantLookupResponse {
  id: string;
  name: string;
  domain: string;
  branding: Branding;
  agencies: Agency[];
}

export interface SessionResponse {
  session: UserSession;
}

// ============================================================================
// Auth State Types
// ============================================================================

export interface AuthState {
  user: User | null;
  session: UserSession | null;
  tenant: Tenant | null;
  agency: Agency | null;
  branding: Branding | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
  timestamp?: string;
  path?: string;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'AUTH_ERROR'
  ) {
    super(message);
    this.name = 'AuthError';
  }
}
