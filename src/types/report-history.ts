/**
 * Report History - Type Definitions
 * 
 * Defines types for tracking report generation history,
 * including scheduled runs and manual generations.
 */

export interface ReportHistoryEntry {
  id: string;
  templateId: string;
  templateName: string;
  
  // Execution details
  generatedAt: string;
  generatedBy: string;
  executionType: 'manual' | 'scheduled';
  
  // Results
  status: 'success' | 'failed' | 'running';
  rowCount?: number;
  executionTimeMs?: number;
  errorMessage?: string;
  
  // Data snapshot
  dataSnapshot?: {
    columns: Array<{ id: string; label: string }>;
    sampleRows: any[]; // First 5 rows
    totalRows: number;
  };
  
  // Export info
  exports?: Array<{
    format: 'csv' | 'pdf' | 'excel';
    exportedAt: string;
    exportedBy: string;
    fileSize?: number;
  }>;
}

export interface ScheduledReportStatus {
  templateId: string;
  templateName: string;
  isActive: boolean;
  nextRun?: string;
  lastRun?: string;
  lastRunStatus?: 'success' | 'failed';
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
}
