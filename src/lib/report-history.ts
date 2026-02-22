/**
 * Report History Management (stub)
 * UI-only: no localStorage.
 */

import { ReportHistoryEntry, ScheduledReportStatus } from '../types/report-history';
import { GeneratedReport } from '../types/custom-reports';

export const getReportHistory = (): ReportHistoryEntry[] => {
  return [];
};

export const addReportHistoryEntry = (
  _report: GeneratedReport,
  _executionType: 'manual' | 'scheduled',
  _executionTimeMs: number
): ReportHistoryEntry => {
  return {
    id: `history_${Date.now()}`,
    templateId: '',
    templateName: '',
    generatedAt: new Date().toISOString(),
    generatedBy: '',
    executionType: 'manual',
    status: 'success',
  };
};

export const recordFailedReport = (
  templateId: string,
  templateName: string,
  userId: string,
  executionType: 'manual' | 'scheduled',
  errorMessage: string
): ReportHistoryEntry => {
  return {
    id: `history_${Date.now()}`,
    templateId,
    templateName,
    generatedAt: new Date().toISOString(),
    generatedBy: userId,
    executionType,
    status: 'failed',
    errorMessage,
  };
};

export const getTemplateHistory = (_templateId: string): ReportHistoryEntry[] => {
  return [];
};

export const getRecentHistory = (_limit: number = 10): ReportHistoryEntry[] => {
  return [];
};

export const getScheduledReportStatuses = (): ScheduledReportStatus[] => {
  return [];
};

export const deleteTemplateHistory = (_templateId: string): void => {
  // no-op
};

export const clearAllHistory = (): void => {
  // no-op
};

export const recordExport = (
  _historyEntryId: string,
  _format: 'csv' | 'pdf' | 'excel',
  _userId: string,
  _fileSize?: number
): void => {
  // no-op
};

export const getHistoryStatistics = () => {
  return {
    totalReports: 0,
    manualRuns: 0,
    scheduledRuns: 0,
    successfulRuns: 0,
    failedRuns: 0,
    totalRows: 0,
    averageExecutionTime: 0,
  };
};
