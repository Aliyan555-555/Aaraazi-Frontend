/**
 * Deal Permission System
 * Handles role-based access control for Deal Management
 */

import { Deal, DealPermissions } from "../types/deals";

export type DealUserRole = "primary" | "secondary" | "viewer";

/**
 * Get the current user's role in the deal (primary agent, secondary agent, or viewer)
 */
export function getUserRoleInDeal(userId: string, deal: Deal): DealUserRole {
  if (!userId || !deal?.agents) return "viewer";
  if (deal.agents.primary?.id === userId) return "primary";
  if (deal.agents.secondary?.id === userId) return "secondary";
  return "viewer";
}

/**
 * Human-readable role name for display
 */
export function getRoleDisplayName(role: DealUserRole): string {
  const names: Record<DealUserRole, string> = {
    primary: "Primary Agent",
    secondary: "Secondary Agent",
    viewer: "Viewer",
  };
  return names[role] ?? "Viewer";
}

const DEFAULT_PERMISSIONS: DealPermissions = {
  canViewFinancials: true,
  canEditNotes: true,
  canProgressStage: true,
  canRecordPayments: true,
  canEditPaymentPlan: true,
  canViewBuyerInfo: true,
  canViewSellerInfo: true,
  canUploadDocuments: true,
  canViewCommission: true,
  canEditCommission: false,
  canEdit: true,
  canUpdatePayments: true,
  canProgressStages: true,
  canCloseDeal: true,
  canViewAll: true,
  canDownloadDocs: true,
  canAddNotes: true,
  canSendMessages: true,
  canUpdateTasks: true,
};

/**
 * Get the default permissions for a deal role
 */
export function getPermissions(role: string): DealPermissions {
  // Primary agents have full permissions by default
  // Secondary agents use the DEFAULT_PERMISSIONS template
  return { ...DEFAULT_PERMISSIONS };
}

/**
 * Check if the user has a specific permission for the deal
 */
export function checkPermission(
  userId: string,
  deal: Deal,
  permission: keyof DealPermissions,
): boolean {
  const role = getUserRoleInDeal(userId, deal);
  if (role === "primary") return true;
  if (role === "viewer") {
    const viewOnly: (keyof DealPermissions)[] = [
      "canViewFinancials",
      "canViewBuyerInfo",
      "canViewSellerInfo",
      "canViewCommission",
      "canViewAll",
      "canDownloadDocs",
    ];
    return viewOnly.includes(permission);
  }
  const perms = deal.agents.secondary?.permissions ?? DEFAULT_PERMISSIONS;
  return Boolean((perms as unknown as Record<string, boolean>)[permission]);
}

/**
 * Message to show when user lacks a permission
 */
export function getPermissionErrorMessage(
  permission: keyof DealPermissions,
): string {
  const messages: Record<string, string> = {
    canEdit:
      "You do not have permission to edit this deal. Only the primary agent can make changes.",
    canUpdatePayments:
      "You do not have permission to update payments. Only the primary agent can record payments.",
    canUploadDocuments:
      "You do not have permission to upload documents. Only the primary agent can upload files.",
    canProgressStages:
      "You do not have permission to progress stages. Only the primary agent can change the deal stage.",
    canCloseDeal:
      "You do not have permission to close this deal. Only the primary agent can close deals.",
    canViewAll: "You do not have permission to view this deal.",
    canDownloadDocs: "You do not have permission to download documents.",
    canAddNotes: "You do not have permission to add notes.",
    canSendMessages: "You do not have permission to send messages.",
  };

  return (
    messages[permission] ||
    `You don't have permission to ${permission
      .replace(/([A-Z])/g, " $1")
      .toLowerCase()
      .trim()}.`
  );
}

/**
 * Validate user has permission, throw error if not
 */
export const validatePermission = (
  userId: string,
  deal: Deal,
  permission: keyof DealPermissions,
): void => {
  if (!checkPermission(userId, deal, permission)) {
    throw new Error(getPermissionErrorMessage(permission));
  }
};

/**
 * Get all deals where user is involved (primary or secondary)
 */
export const getUserDealsFilter = (userId: string) => {
  return (deal: Deal) => {
    return (
      deal.agents.primary.id === userId || deal.agents.secondary?.id === userId
    );
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
 * Check if user can access the deal at all
 */
export const canAccessDeal = (userId: string, deal: Deal): boolean => {
  const role = getUserRoleInDeal(userId, deal);
  return role !== "viewer";
};
