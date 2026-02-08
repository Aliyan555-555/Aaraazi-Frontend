/**
 * Deal Permission System
 * Handles role-based access control for Deal Management
 * 
 * PRIMARY AGENT (Seller's Agent):
 * - Full control over the deal
 * - Can edit, record payments, upload documents, progress stages
 * 
 * SECONDARY AGENT (Buyer's Agent):
 * - View-only access
 * - Can view all updates, download documents, add notes
 * - Cannot edit or record payments
 */

import { AgentRole } from '../types';
import { Deal, DealPermissions } from '../types/deals';

/**
 * Get permissions based on agent role
 */
export const getPermissions = (role: AgentRole): DealPermissions => {
  if (role === 'primary') {
    // Seller's Agent - Full Control
    return {
      canEdit: true,
      canUpdatePayments: true,
      canUploadDocuments: true,
      canProgressStages: true,
      canCloseDeal: true,
      canViewAll: true,
      canDownloadDocs: true,
      canAddNotes: true,
      canSendMessages: true,
    };
  }
  
  if (role === 'secondary') {
    // Buyer's Agent - View Only
    return {
      canEdit: false,
      canUpdatePayments: false,
      canUploadDocuments: false,
      canProgressStages: false,
      canCloseDeal: false,
      canViewAll: true,
      canDownloadDocs: true,
      canAddNotes: true,
      canSendMessages: true,
    };
  }
  
  // No access
  return {
    canEdit: false,
    canUpdatePayments: false,
    canUploadDocuments: false,
    canProgressStages: false,
    canCloseDeal: false,
    canViewAll: false,
    canDownloadDocs: false,
    canAddNotes: false,
    canSendMessages: false,
  };
};

/**
 * Get user's role in a specific deal
 */
export const getUserRoleInDeal = (userId: string, deal: Deal): AgentRole => {
  if (deal.agents.primary.id === userId) {
    return 'primary';
  }
  
  if (deal.agents.secondary?.id === userId) {
    return 'secondary';
  }
  
  return 'none';
};

/**
 * Check if user has a specific permission in a deal
 */
export const checkPermission = (
  userId: string,
  deal: Deal,
  permission: keyof DealPermissions
): boolean => {
  const role = getUserRoleInDeal(userId, deal);
  const permissions = getPermissions(role);
  return permissions[permission];
};

/**
 * Check if user can access the deal at all
 */
export const canAccessDeal = (userId: string, deal: Deal): boolean => {
  const role = getUserRoleInDeal(userId, deal);
  return role !== 'none';
};

/**
 * Get display name for agent role
 */
export const getRoleDisplayName = (role: AgentRole): string => {
  switch (role) {
    case 'primary':
      return 'Primary Agent (Managing Deal)';
    case 'secondary':
      return 'Secondary Agent (Tracking)';
    default:
      return 'No Access';
  }
};

/**
 * Get all deals where user is involved (primary or secondary)
 */
export const getUserDealsFilter = (userId: string) => {
  return (deal: Deal) => {
    return deal.agents.primary.id === userId || deal.agents.secondary?.id === userId;
  };
};

/**
 * Get only deals where user is primary agent
 */
export const getPrimaryDealsFilter = (userId: string) => {
  return (deal: Deal) => {
    return deal.agents.primary.id === userId;
  };
};

/**
 * Get only deals where user is secondary agent
 */
export const getSecondaryDealsFilter = (userId: string) => {
  return (deal: Deal) => {
    return deal.agents.secondary?.id === userId;
  };
};

/**
 * Permission error messages
 */
export const getPermissionErrorMessage = (permission: keyof DealPermissions): string => {
  const messages: Record<keyof DealPermissions, string> = {
    canEdit: 'You do not have permission to edit this deal. Only the primary agent can make changes.',
    canUpdatePayments: 'You do not have permission to update payments. Only the primary agent can record payments.',
    canUploadDocuments: 'You do not have permission to upload documents. Only the primary agent can upload files.',
    canProgressStages: 'You do not have permission to progress stages. Only the primary agent can change the deal stage.',
    canCloseDeal: 'You do not have permission to close this deal. Only the primary agent can close deals.',
    canViewAll: 'You do not have permission to view this deal.',
    canDownloadDocs: 'You do not have permission to download documents.',
    canAddNotes: 'You do not have permission to add notes.',
    canSendMessages: 'You do not have permission to send messages.',
  };
  
  return messages[permission] || 'You do not have permission to perform this action.';
};

/**
 * Validate user has permission, throw error if not
 */
export const validatePermission = (
  userId: string,
  deal: Deal,
  permission: keyof DealPermissions
): void => {
  if (!checkPermission(userId, deal, permission)) {
    throw new Error(getPermissionErrorMessage(permission));
  }
};
