/**
 * Report History Management
 * 
 * Handles storage and retrieval of report generation history.
 * Tracks both manual and scheduled report runs.
 */

import { ReportHistoryEntry, ScheduledReportStatus } from '../types/report-history';
import { GeneratedReport } from '../types/custom-reports';

const STORAGE_KEY = 'report_history';
const MAX_HISTORY_ENTRIES = 1000; // Keep last 1000 entries

/**
 * Get all report history entries
 */
export const getReportHistory = (): ReportHistoryEntry[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const history = JSON.parse(stored);
    return Array.isArray(history) ? history : [];
  } catch (error) {
    console.error('Error loading report history:', error);
    return [];
  }
};

/**
 * Add a new report history entry
 */
export const addReportHistoryEntry = (
  report: GeneratedReport,
  executionType: 'manual' | 'scheduled',
  executionTimeMs: number
): ReportHistoryEntry => {
  try {
    const history = getReportHistory();
    
    const entry: ReportHistoryEntry = {
      id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      templateId: report.templateId,
      templateName: report.templateName,
      generatedAt: report.generatedAt,
      generatedBy: report.generatedBy,
      executionType,
      status: 'success',
      rowCount: report.rowCount,
      executionTimeMs,
      dataSnapshot: {
        columns: report.columns.map(col => ({ id: col.id, label: col.label })),
        sampleRows: report.data.slice(0, 5),
        totalRows: report.rowCount,
      },
    };
    
    // Add to beginning of array
    history.unshift(entry);
    
    // Trim to max entries
    const trimmed = history.slice(0, MAX_HISTORY_ENTRIES);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    
    return entry;
  } catch (error) {
    console.error('Error adding report history entry:', error);
    throw error;
  }
};

/**
 * Record a failed report generation
 */
export const recordFailedReport = (
  templateId: string,
  templateName: string,
  userId: string,
  executionType: 'manual' | 'scheduled',
  errorMessage: string
): ReportHistoryEntry => {
  try {
    const history = getReportHistory();
    
    const entry: ReportHistoryEntry = {
      id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      templateId,
      templateName,
      generatedAt: new Date().toISOString(),
      generatedBy: userId,
      executionType,
      status: 'failed',
      errorMessage,
    };
    
    history.unshift(entry);
    const trimmed = history.slice(0, MAX_HISTORY_ENTRIES);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    
    return entry;
  } catch (error) {
    console.error('Error recording failed report:', error);
    throw error;
  }
};

/**
 * Get history for a specific template
 */
export const getTemplateHistory = (templateId: string): ReportHistoryEntry[] => {
  const history = getReportHistory();
  return history.filter(entry => entry.templateId === templateId);
};

/**
 * Get recent history (last N entries)
 */
export const getRecentHistory = (limit: number = 10): ReportHistoryEntry[] => {
  const history = getReportHistory();
  return history.slice(0, limit);
};

/**
 * Get scheduled report statuses
 */
export const getScheduledReportStatuses = (): ScheduledReportStatus[] => {
  try {
    const customReports = localStorage.getItem('custom_report_templates');
    if (!customReports) return [];
    
    const templates = JSON.parse(customReports);
    const history = getReportHistory();
    
    return templates
      .filter((t: any) => t.config.schedule?.enabled)
      .map((template: any) => {
        const templateHistory = history.filter(h => h.templateId === template.id);
        const scheduledHistory = templateHistory.filter(h => h.executionType === 'scheduled');
        
        const lastRun = scheduledHistory[0];
        
        return {
          templateId: template.id,
          templateName: template.name,
          isActive: template.config.schedule.enabled,
          nextRun: template.config.schedule.nextRun,
          lastRun: lastRun?.generatedAt,
          lastRunStatus: lastRun?.status,
          totalRuns: scheduledHistory.length,
          successfulRuns: scheduledHistory.filter(h => h.status === 'success').length,
          failedRuns: scheduledHistory.filter(h => h.status === 'failed').length,
        };
      });
  } catch (error) {
    console.error('Error getting scheduled report statuses:', error);
    return [];
  }
};

/**
 * Delete history entries for a template
 */
export const deleteTemplateHistory = (templateId: string): void => {
  try {
    const history = getReportHistory();
    const filtered = history.filter(entry => entry.templateId !== templateId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting template history:', error);
    throw error;
  }
};

/**
 * Clear all history
 */
export const clearAllHistory = (): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  } catch (error) {
    console.error('Error clearing history:', error);
    throw error;
  }
};

/**
 * Record an export action
 */
export const recordExport = (
  historyEntryId: string,
  format: 'csv' | 'pdf' | 'excel',
  userId: string,
  fileSize?: number
): void => {
  try {
    const history = getReportHistory();
    const entry = history.find(h => h.id === historyEntryId);
    
    if (entry) {
      if (!entry.exports) {
        entry.exports = [];
      }
      
      entry.exports.push({
        format,
        exportedAt: new Date().toISOString(),
        exportedBy: userId,
        fileSize,
      });
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }
  } catch (error) {
    console.error('Error recording export:', error);
  }
};

/**
 * Get statistics for report history
 */
export const getHistoryStatistics = () => {
  const history = getReportHistory();
  
  return {
    totalReports: history.length,
    manualRuns: history.filter(h => h.executionType === 'manual').length,
    scheduledRuns: history.filter(h => h.executionType === 'scheduled').length,
    successfulRuns: history.filter(h => h.status === 'success').length,
    failedRuns: history.filter(h => h.status === 'failed').length,
    totalRows: history.reduce((sum, h) => sum + (h.rowCount || 0), 0),
    averageExecutionTime: history.length > 0
      ? history.reduce((sum, h) => sum + (h.executionTimeMs || 0), 0) / history.length
      : 0,
  };
};
