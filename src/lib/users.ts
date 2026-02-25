/**
 * User helpers - reads from auth store (real auth)
 * Replaces mock auth.ts for getCurrentUser, getAllAgents, getUserById
 */

import { useAuthStore } from '@/store/useAuthStore';
import type { User as AuthUser } from '@/types/auth.types';
import type { User as UIUser } from '@/types';

/**
 * Get current authenticated user (for use outside React components)
 */
export function getCurrentUser(): AuthUser | null {
  return useAuthStore.getState().user;
}

/**
 * Get all agents - TODO: Replace with GET /agencies/:id/users when backend endpoint exists
 * Returns UI User[] for dashboard/component compatibility.
 */
export function getAllAgents(): UIUser[] {
  // Real auth: agents would come from API. Return empty until backend adds endpoint.
  // When implemented: map API response with mapAuthUserToUIUser
  return [];
}

/**
 * Get user by ID - checks current user, TODO: add API lookup when backend supports it
 */
export function getUserById(id: string): AuthUser | null {
  const user = useAuthStore.getState().user;
  return user?.id === id ? user : null;
}
