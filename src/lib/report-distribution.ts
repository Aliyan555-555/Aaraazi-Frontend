/**
 * Report Distribution System
 * 
 * Manages automated report distribution:
 * - Email delivery
 * - Scheduled distributions
 * - Distribution lists
 * - Delivery history
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

const DISTRIBUTION_LISTS_KEY = 'report_distribution_lists';
const DISTRIBUTIONS_KEY = 'report_distributions';
const DISTRIBUTION_HISTORY_KEY = 'distribution_history';
const MAX_HISTORY_ENTRIES = 500;

/**
 * Get all distribution lists
 */
export const getDistributionLists = (): DistributionList[] => {
  try {
    const stored = localStorage.getItem(DISTRIBUTION_LISTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load distribution lists:', error);
    return [];
  }
};

/**
 * Create a new distribution list
 */
export const createDistributionList = (
  name: string,
  recipients: string[],
  userId: string
): DistributionList => {
  const list: DistributionList = {
    id: `dist-list-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    recipients,
    createdAt: new Date().toISOString(),
    createdBy: userId,
  };
  
  const lists = getDistributionLists();
  lists.push(list);
  localStorage.setItem(DISTRIBUTION_LISTS_KEY, JSON.stringify(lists));
  
  return list;
};

/**
 * Update a distribution list
 */
export const updateDistributionList = (
  listId: string,
  updates: Partial<DistributionList>
): void => {
  const lists = getDistributionLists();
  const index = lists.findIndex(l => l.id === listId);
  
  if (index === -1) {
    throw new Error('Distribution list not found');
  }
  
  lists[index] = { ...lists[index], ...updates };
  localStorage.setItem(DISTRIBUTION_LISTS_KEY, JSON.stringify(lists));
};

/**
 * Delete a distribution list
 */
export const deleteDistributionList = (listId: string): void => {
  const lists = getDistributionLists();
  const filtered = lists.filter(l => l.id !== listId);
  localStorage.setItem(DISTRIBUTION_LISTS_KEY, JSON.stringify(filtered));
};

/**
 * Get all report distributions
 */
export const getReportDistributions = (): ReportDistribution[] => {
  try {
    const stored = localStorage.getItem(DISTRIBUTIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load distributions:', error);
    return [];
  }
};

/**
 * Create a new report distribution
 */
export const createReportDistribution = (
  template: CustomReportTemplate,
  recipients: string[],
  distributionListIds: string[],
  format: ExportFormat,
  schedule: ReportDistribution['schedule'] | undefined,
  userId: string
): ReportDistribution => {
  const distribution: ReportDistribution = {
    id: `dist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    templateId: template.id,
    templateName: template.name,
    recipients,
    distributionListIds,
    format,
    schedule,
    createdAt: new Date().toISOString(),
    createdBy: userId,
  };
  
  const distributions = getReportDistributions();
  distributions.push(distribution);
  localStorage.setItem(DISTRIBUTIONS_KEY, JSON.stringify(distributions));
  
  return distribution;
};

/**
 * Update a report distribution
 */
export const updateReportDistribution = (
  distributionId: string,
  updates: Partial<ReportDistribution>
): void => {
  const distributions = getReportDistributions();
  const index = distributions.findIndex(d => d.id === distributionId);
  
  if (index === -1) {
    throw new Error('Distribution not found');
  }
  
  distributions[index] = { ...distributions[index], ...updates };
  localStorage.setItem(DISTRIBUTIONS_KEY, JSON.stringify(distributions));
};

/**
 * Delete a report distribution
 */
export const deleteReportDistribution = (distributionId: string): void => {
  const distributions = getReportDistributions();
  const filtered = distributions.filter(d => d.id !== distributionId);
  localStorage.setItem(DISTRIBUTIONS_KEY, JSON.stringify(filtered));
};

/**
 * Get distribution history
 */
export const getDistributionHistory = (): DistributionHistory[] => {
  try {
    const stored = localStorage.getItem(DISTRIBUTION_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load distribution history:', error);
    return [];
  }
};

/**
 * Add distribution history entry
 */
export const addDistributionHistory = (
  distributionId: string,
  templateName: string,
  recipients: string[],
  format: ExportFormat,
  status: 'success' | 'failed',
  error?: string
): void => {
  const history = getDistributionHistory();
  
  const entry: DistributionHistory = {
    id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    distributionId,
    templateName,
    recipients,
    format,
    status,
    sentAt: new Date().toISOString(),
    error,
  };
  
  history.unshift(entry);
  
  // Keep only the most recent entries
  const trimmed = history.slice(0, MAX_HISTORY_ENTRIES);
  localStorage.setItem(DISTRIBUTION_HISTORY_KEY, JSON.stringify(trimmed));
};

/**
 * Get all recipients from a distribution (including distribution lists)
 */
export const getAllRecipients = (distribution: ReportDistribution): string[] => {
  const allRecipients = [...distribution.recipients];
  
  // Add recipients from distribution lists
  const lists = getDistributionLists();
  distribution.distributionListIds.forEach(listId => {
    const list = lists.find(l => l.id === listId);
    if (list) {
      allRecipients.push(...list.recipients);
    }
  });
  
  // Remove duplicates
  return Array.from(new Set(allRecipients));
};

/**
 * Simulate sending a report (in real app, this would call an email API)
 */
export const sendReport = async (
  distribution: ReportDistribution,
  reportData: any[]
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Get all recipients
    const recipients = getAllRecipients(distribution);
    
    if (recipients.length === 0) {
      throw new Error('No recipients specified');
    }
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real implementation, this would:
    // 1. Generate the report in the specified format
    // 2. Create an email with the report as attachment
    // 3. Send via email service (SendGrid, AWS SES, etc.)
    // 4. Track delivery status
    
    // For now, just simulate success
    addDistributionHistory(
      distribution.id,
      distribution.templateName,
      recipients,
      distribution.format,
      'success'
    );
    
    // Update last sent time if scheduled
    if (distribution.schedule) {
      updateReportDistribution(distribution.id, {
        schedule: {
          ...distribution.schedule,
          lastSent: new Date().toISOString(),
        },
      });
    }
    
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    addDistributionHistory(
      distribution.id,
      distribution.templateName,
      distribution.recipients,
      distribution.format,
      'failed',
      errorMessage
    );
    
    return { success: false, error: errorMessage };
  }
};

/**
 * Get distribution statistics
 */
export const getDistributionStatistics = () => {
  const distributions = getReportDistributions();
  const history = getDistributionHistory();
  
  const totalDistributions = distributions.length;
  const activeSchedules = distributions.filter(d => d.schedule?.enabled).length;
  const totalSent = history.length;
  const successfulSends = history.filter(h => h.status === 'success').length;
  const failedSends = history.filter(h => h.status === 'failed').length;
  const successRate = totalSent > 0 ? Math.round((successfulSends / totalSent) * 100) : 0;
  
  // Get unique recipients
  const allRecipients = new Set<string>();
  distributions.forEach(d => {
    getAllRecipients(d).forEach(r => allRecipients.add(r));
  });
  
  return {
    totalDistributions,
    activeSchedules,
    totalSent,
    successfulSends,
    failedSends,
    successRate,
    uniqueRecipients: allRecipients.size,
  };
};

/**
 * Validate email address
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate multiple email addresses
 */
export const validateEmails = (emails: string[]): { valid: string[]; invalid: string[] } => {
  const valid: string[] = [];
  const invalid: string[] = [];
  
  emails.forEach(email => {
    const trimmed = email.trim();
    if (isValidEmail(trimmed)) {
      valid.push(trimmed);
    } else {
      invalid.push(trimmed);
    }
  });
  
  return { valid, invalid };
};
