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
  return useAuthStore.getState().user ?? null;
}

/**
 * Get all agents from store.
 * TODO: Replace with GET /agencies/:id/users when backend endpoint exists.
 */
export function getAllAgents(): UIUser[] {
  const { agents } = useAuthStore.getState();
  return (agents ?? []) as unknown as UIUser[];
}

/**
 * Get user by ID - checks agents first, then current user.
 * TODO: Add API lookup when backend supports it.
 */
export function getUserById(id: string): AuthUser | null {
  const state = useAuthStore.getState();
  const fromAgents = state.agents?.find((u) => u.id === id) ?? null;
  if (fromAgents) return fromAgents;
  if (state.user?.id === id) return state.user;
  return null;
}
