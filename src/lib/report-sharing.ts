/**
 * Report Sharing System
 * 
 * Manages sharing custom reports with team members:
 * - Share templates with specific users
 * - Role-based access control
 * - View/edit permissions
 * - Share history tracking
 * - Revoke access
 */

import { CustomReportTemplate } from '../types/custom-reports';

export type SharePermission = 'view' | 'edit';

export interface ReportShare {
  id: string;
  templateId: string;
  templateName: string;
  sharedBy: string;
  sharedWith: string;
  sharedWithName: string;
  permission: SharePermission;
  sharedAt: string;
  lastAccessed?: string;
}

const SHARED_REPORTS_KEY = 'shared_reports';

/**
 * Get all report shares
 */
export const getReportShares = (): ReportShare[] => {
  try {
    const stored = localStorage.getItem(SHARED_REPORTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load report shares:', error);
    return [];
  }
};

/**
 * Get shares for a specific template
 */
export const getTemplateShares = (templateId: string): ReportShare[] => {
  const shares = getReportShares();
  return shares.filter(s => s.templateId === templateId);
};

/**
 * Get templates shared with a user
 */
export const getSharedWithUser = (userId: string): ReportShare[] => {
  const shares = getReportShares();
  return shares.filter(s => s.sharedWith === userId);
};

/**
 * Get templates shared by a user
 */
export const getSharedByUser = (userId: string): ReportShare[] => {
  const shares = getReportShares();
  return shares.filter(s => s.sharedBy === userId);
};

/**
 * Share a report template with a user
 */
export const shareReport = (
  template: CustomReportTemplate,
  sharedBy: string,
  sharedWith: string,
  sharedWithName: string,
  permission: SharePermission
): ReportShare => {
  const shares = getReportShares();
  
  // Check if already shared with this user
  const existingIndex = shares.findIndex(
    s => s.templateId === template.id && s.sharedWith === sharedWith
  );
  
  if (existingIndex !== -1) {
    // Update existing share
    shares[existingIndex].permission = permission;
    shares[existingIndex].sharedAt = new Date().toISOString();
    localStorage.setItem(SHARED_REPORTS_KEY, JSON.stringify(shares));
    return shares[existingIndex];
  }
  
  // Create new share
  const share: ReportShare = {
    id: `share-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    templateId: template.id,
    templateName: template.name,
    sharedBy,
    sharedWith,
    sharedWithName,
    permission,
    sharedAt: new Date().toISOString(),
  };
  
  shares.push(share);
  localStorage.setItem(SHARED_REPORTS_KEY, JSON.stringify(shares));
  
  return share;
};

/**
 * Update share permission
 */
export const updateSharePermission = (
  shareId: string,
  permission: SharePermission
): void => {
  const shares = getReportShares();
  const index = shares.findIndex(s => s.id === shareId);
  
  if (index === -1) {
    throw new Error('Share not found');
  }
  
  shares[index].permission = permission;
  localStorage.setItem(SHARED_REPORTS_KEY, JSON.stringify(shares));
};

/**
 * Revoke report share
 */
export const revokeShare = (shareId: string): void => {
  const shares = getReportShares();
  const filtered = shares.filter(s => s.id !== shareId);
  localStorage.setItem(SHARED_REPORTS_KEY, JSON.stringify(filtered));
};

/**
 * Revoke all shares for a template
 */
export const revokeAllTemplateShares = (templateId: string): void => {
  const shares = getReportShares();
  const filtered = shares.filter(s => s.templateId !== templateId);
  localStorage.setItem(SHARED_REPORTS_KEY, JSON.stringify(filtered));
};

/**
 * Update last accessed time
 */
export const updateLastAccessed = (shareId: string): void => {
  const shares = getReportShares();
  const index = shares.findIndex(s => s.id === shareId);
  
  if (index !== -1) {
    shares[index].lastAccessed = new Date().toISOString();
    localStorage.setItem(SHARED_REPORTS_KEY, JSON.stringify(shares));
  }
};

/**
 * Check if user has access to a template
 */
export const hasAccess = (
  templateId: string,
  userId: string,
  createdBy: string
): { hasAccess: boolean; permission: SharePermission | 'owner' } => {
  // Owner has full access
  if (userId === createdBy) {
    return { hasAccess: true, permission: 'owner' };
  }
  
  // Check shares
  const shares = getReportShares();
  const share = shares.find(
    s => s.templateId === templateId && s.sharedWith === userId
  );
  
  if (share) {
    return { hasAccess: true, permission: share.permission };
  }
  
  return { hasAccess: false, permission: 'view' };
};

/**
 * Get sharing statistics
 */
export const getSharingStatistics = (userId: string) => {
  const shares = getReportShares();
  
  const sharedByMe = shares.filter(s => s.sharedBy === userId);
  const sharedWithMe = shares.filter(s => s.sharedWith === userId);
  
  const uniqueTemplatesShared = new Set(sharedByMe.map(s => s.templateId)).size;
  const uniqueUsersSharedWith = new Set(sharedByMe.map(s => s.sharedWith)).size;
  const uniqueTemplatesReceived = new Set(sharedWithMe.map(s => s.templateId)).size;
  
  // Calculate access stats
  const recentlyAccessed = sharedWithMe.filter(s => {
    if (!s.lastAccessed) return false;
    const accessDate = new Date(s.lastAccessed);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return accessDate > weekAgo;
  }).length;
  
  return {
    templatesSharedByMe: uniqueTemplatesShared,
    usersSharedWith: uniqueUsersSharedWith,
    templatesSharedWithMe: uniqueTemplatesReceived,
    recentlyAccessed,
    totalShares: sharedByMe.length + sharedWithMe.length,
  };
};

/**
 * Validate share access before performing an action
 */
export const validateShareAccess = (
  templateId: string,
  userId: string,
  createdBy: string,
  requiredPermission: 'view' | 'edit'
): boolean => {
  const access = hasAccess(templateId, userId, createdBy);
  
  if (!access.hasAccess) {
    return false;
  }
  
  if (access.permission === 'owner') {
    return true;
  }
  
  if (requiredPermission === 'edit') {
    return access.permission === 'edit';
  }
  
  // View permission is always granted if user has any access
  return true;
};

/**
 * Get all users who have access to a template
 */
export const getTemplateAccessList = (templateId: string): ReportShare[] => {
  const shares = getReportShares();
  return shares.filter(s => s.templateId === templateId);
};
