import type { User } from "@/types/auth.types";
import { useAuthStore } from "@/store/useAuthStore";
export const initializeUsers = () => {};

export const getCurrentUser = (): User | null => {
  return useAuthStore.getState().user ?? null;
};

export const getAllAgents = (): User[] => {
  return useAuthStore.getState().agents ?? [];
};

export const getUserById = (id: string): User | null => {
  const state = useAuthStore.getState();
  const fromAgents = state.agents?.find((u) => u.id === id) ?? null;
  if (fromAgents) return fromAgents;
  if (state.user?.id === id) return state.user;
  return null;
};
