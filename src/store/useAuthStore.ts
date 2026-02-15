/**
 * Professional-grade Auth Store with Zustand
 * Enhanced with proper typing, error handling, and state management
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  User,
  Branding,
  Agency,
  Tenant,
  UserSession,
  LoginDto,
  ApiError,
} from '@/types/auth.types';
import { authService } from '@/services/auth.service';
import { setAuthToken, clearAuthToken } from '@/lib/api/client';

// ============================================================================
// Auth Store State Interface
// ============================================================================

export interface AuthStore {
  // State
  user: User | null;
  accessToken: string | null;
  session: UserSession | null;
  tenantId: string | null;
  agencyId: string | null;
  branding: Branding | null;
  agencies: Agency[];
  /** Agency users/agents (populated from API or set by app). Single source for getAllAgents/getUserById. */
  agents: User[];
  currentModule: string | null;
  
  // Loading & Error States
  isLoading: boolean;
  isInitialized: boolean;
  error: ApiError | null;
  
  // Computed
  isAuthenticated: boolean;
  
  // Actions
  setTenant: (tenantId: string, branding: Branding, agencies: Agency[]) => void;
  setAgency: (agencyId: string) => void;
  setAgents: (agents: User[]) => void;
  setCurrentModule: (moduleId: string) => void;
  
  // Auth Actions
  login: (credentials: LoginDto) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  validateSession: () => Promise<boolean>;
  
  // Utility Actions
  setLoading: (loading: boolean) => void;
  setError: (error: ApiError | null) => void;
  clearError: () => void;
  reset: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState = {
  user: null,
  accessToken: null,
  session: null,
  tenantId: null,
  agencyId: null,
  branding: null,
  agencies: [],
  agents: [],
  currentModule: null,
  isLoading: false,
  isInitialized: false,
  error: null,
  isAuthenticated: false,
};

// ============================================================================
// Auth Store
// ============================================================================

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ========================================================================
      // Basic Setters
      // ========================================================================

      setTenant: (tenantId, branding, agencies) => {
        set({
          tenantId,
          branding,
          agencies,
          error: null,
        });
      },

      setAgency: (agencyId) => {
        set({ agencyId, error: null });
      },

      setAgents: (agents) => {
        set({ agents, error: null });
      },

      setCurrentModule: (moduleId) => {
        set({ currentModule: moduleId, error: null });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      setError: (error) => {
        set({ error, isLoading: false });
      },

      clearError: () => {
        set({ error: null });
      },

      // ========================================================================
      // Login Action
      // ========================================================================

      login: async (credentials) => {
        try {
          set({ isLoading: true, error: null });

          const response = await authService.login(credentials);

          // Set auth token for future requests
          setAuthToken(response.accessToken);

          // Update store with auth data
          set({
            user: response.user,
            accessToken: response.accessToken,
            tenantId: credentials.tenantId,
            agencyId: credentials.agencyId || response.user.agencyId,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
            error: null,
          });

          // Fetch full session data
          try {
            const sessionResponse = await authService.getSession();
            set({ session: sessionResponse.session });
          } catch (sessionError) {
            console.warn('Failed to fetch session details:', sessionError);
          }
        } catch (error) {
          const apiError = error as ApiError;
          set({
            error: apiError,
            isLoading: false,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      // ========================================================================
      // Logout Action
      // ========================================================================

      logout: async () => {
        try {
          set({ isLoading: true });

          // Call logout API to invalidate session
          await authService.logout();
        } catch (error) {
          console.error('Logout API failed:', error);
          // Continue with local cleanup even if API fails
        } finally {
          // Clear auth token
          clearAuthToken();

          // Reset store to initial state
          set({
            ...initialState,
            isInitialized: true,
          });
        }
      },

      // ========================================================================
      // Refresh Session Action
      // ========================================================================

      refreshSession: async () => {
        const { accessToken } = get();

        if (!accessToken) {
          throw new Error('No access token available');
        }

        try {
          set({ isLoading: true, error: null });

          const response = await authService.refreshSession();

          set({
            session: response.session,
            user: response.session.user,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const apiError = error as ApiError;
          
          // If session is invalid, logout
          if (apiError.statusCode === 401) {
            await get().logout();
          }
          
          set({
            error: apiError,
            isLoading: false,
          });
          throw error;
        }
      },

      // ========================================================================
      // Validate Session Action
      // ========================================================================

      validateSession: async () => {
        const { accessToken } = get();

        if (!accessToken) {
          return false;
        }

        try {
          const isValid = await authService.validateSession(accessToken);

          if (!isValid) {
            await get().logout();
            return false;
          }

          return true;
        } catch (error) {
          console.error('Session validation failed:', error);
          await get().logout();
          return false;
        }
      },

      // ========================================================================
      // Reset Action
      // ========================================================================

      reset: () => {
        clearAuthToken();
        set({
          ...initialState,
          isInitialized: true,
        });
      },
    }),
    {
      name: 'aaraazi-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist essential data (Zustand persist is the single storage for auth)
        user: state.user,
        accessToken: state.accessToken,
        tenantId: state.tenantId,
        agencyId: state.agencyId,
        branding: state.branding,
        agencies: state.agencies,
        agents: state.agents,
        currentModule: state.currentModule,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // After rehydration, set token if available
        if (state?.accessToken) {
          setAuthToken(state.accessToken);
        }
        
        // Mark as initialized
        if (state) {
          state.isInitialized = true;
        }
      },
    }
  )
);

// ============================================================================
// Selectors (for optimized re-renders)
// ============================================================================

export const selectUser = (state: AuthStore) => state.user;
export const selectIsAuthenticated = (state: AuthStore) => state.isAuthenticated;
export const selectIsLoading = (state: AuthStore) => state.isLoading;
export const selectError = (state: AuthStore) => state.error;
export const selectBranding = (state: AuthStore) => state.branding;
export const selectTenant = (state: AuthStore) => ({
  tenantId: state.tenantId,
  branding: state.branding,
  agencies: state.agencies,
});
