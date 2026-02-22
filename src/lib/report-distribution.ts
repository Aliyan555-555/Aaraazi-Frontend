/**
 * Report Distribution System (stub)
 * UI-only: no localStorage.
 */

import { CustomReportTemplate } from '../types/custom-reports';
import { ExportFormat } from './report-export';

export interface DistributionList {
  id: string;
  name: string;
  recipients: string[];
  createdAt: string;
  createdBy: string;
}

export interface ReportDistribution {
  id: string;
  templateId: string;
  templateName: string;
  recipients: string[];
  distributionListIds: string[];
  format: ExportFormat;
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    enabled: boolean;
    lastSent?: string;
    nextSend?: string;
  };
  createdAt: string;
  createdBy: string;
}

export interface DistributionHistory {
  id: string;
  distributionId: string;
  templateName: string;
  recipients: string[];
  format: ExportFormat;
  status: 'success' | 'failed' | 'pending';
  sentAt: string;
  error?: string;
}

export const getDistributionLists = (): DistributionList[] => {
  return [];
};

export const createDistributionList = (
  name: string,
  recipients: string[],
  userId: string
): DistributionList => {
  return {
    id: `dist-list-${Date.now()}`,
    name,
    recipients,
    createdAt: new Date().toISOString(),
    createdBy: userId,
  };
};

export const updateDistributionList = (
  _listId: string,
  _updates: Partial<Omit<DistributionList, 'id' | 'createdAt' | 'createdBy'>>
): void => {
  // no-op
};

export const deleteDistributionList = (_listId: string): void => {
  // no-op
};

export const getReportDistributions = (): ReportDistribution[] => {
  return [];
};

export const createReportDistribution = (
  _template: CustomReportTemplate,
  _userId: string
): ReportDistribution => {
  return {
    id: `dist-${Date.now()}`,
    templateId: '',
    templateName: '',
    recipients: [],
    distributionListIds: [],
    format: 'pdf',
    createdAt: new Date().toISOString(),
    createdBy: '',
  };
};

export const updateReportDistribution = (
  _distributionId: string,
  _updates: Partial<ReportDistribution>
): void => {
  // no-op
};

export const deleteReportDistribution = (_distributionId: string): void => {
  // no-op
};

export const getDistributionHistory = (): DistributionHistory[] => {
  return [];
};

export const addDistributionHistory = (
  _distributionId: string,
  _templateName: string,
  _recipients: string[],
  _format: ExportFormat,
  _status: 'success' | 'failed',
  _error?: string
): void => {
  // no-op
};

export const getAllRecipients = (distribution: ReportDistribution): string[] => {
  return [...distribution.recipients];
};

export const sendReport = async (
  _distribution: ReportDistribution,
  _reportData: any[]
): Promise<{ success: boolean; error?: string }> => {
  return { success: false, error: 'Not implemented' };
};

export const getDistributionStatistics = () => {
  return {
    totalDistributions: 0,
    activeSchedules: 0,
    totalSent: 0,
    successfulSends: 0,
    failedSends: 0,
    successRate: 0,
    uniqueRecipients: 0,
  };
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateEmails = (
  emails: string[]
): { valid: string[]; invalid: string[] } => {
  const valid: string[] = [];
  const invalid: string[] = [];

  emails.forEach((email) => {
    const trimmed = email.trim();
    if (isValidEmail(trimmed)) {
      valid.push(trimmed);
    } else {
      invalid.push(trimmed);
    }
  });

  return { valid, invalid };
};
