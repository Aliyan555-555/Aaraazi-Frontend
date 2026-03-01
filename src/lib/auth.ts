/**
 * @deprecated Use @/lib/users instead. This module re-exports for backward compatibility.
 * New code should import from '@/lib/users' for getCurrentUser, getAllAgents, getUserById.
 */
export {
  getCurrentUser,
  getAllAgents,
  getUserById,
} from '@/lib/users';

export const initializeUsers = () => {};
