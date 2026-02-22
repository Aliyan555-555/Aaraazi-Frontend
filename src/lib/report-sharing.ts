/**
 * Report Sharing System (stub)
 * UI-only: no localStorage.
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

export const getReportShares = (): ReportShare[] => {
  return [];
};

export const getTemplateShares = (_templateId: string): ReportShare[] => {
  return [];
};

export const getSharedWithUser = (_userId: string): ReportShare[] => {
  return [];
};

export const getSharedByUser = (_userId: string): ReportShare[] => {
  return [];
};

export const shareReport = (
  _template: CustomReportTemplate,
  _sharedBy: string,
  _sharedWith: string,
  _sharedWithName: string,
  _permission: SharePermission
): ReportShare => {
  return {
    id: `share_${Date.now()}`,
    templateId: '',
    templateName: '',
    sharedBy: '',
    sharedWith: '',
    sharedWithName: '',
    permission: 'view',
    sharedAt: new Date().toISOString(),
  };
};

export const updateSharePermission = (
  _shareId: string,
  _permission: SharePermission
): void => {
  // no-op
};

export const revokeShare = (_shareId: string): void => {
  // no-op
};

export const revokeAllTemplateShares = (_templateId: string): void => {
  // no-op
};

export const updateLastAccessed = (_shareId: string): void => {
  // no-op
};

export const hasAccess = (
  _templateId: string,
  userId: string,
  createdBy: string
): { hasAccess: boolean; permission: SharePermission | 'owner' } => {
  if (userId === createdBy) {
    return { hasAccess: true, permission: 'owner' };
  }
  return { hasAccess: false, permission: 'view' };
};

export const getSharingStatistics = (_userId: string) => {
  return {
    templatesSharedByMe: 0,
    usersSharedWith: 0,
    templatesSharedWithMe: 0,
    recentlyAccessed: 0,
    totalShares: 0,
  };
};

export const validateShareAccess = (
  _templateId: string,
  _userId: string,
  _createdBy: string,
  _requiredPermission: 'view' | 'edit'
): boolean => {
  return false;
};

export const getTemplateAccessList = (_templateId: string): ReportShare[] => {
  return [];
};
