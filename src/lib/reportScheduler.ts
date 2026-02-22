/**
 * Report Scheduler - Client-Side (stub)
 * UI-only: no localStorage, no automation.
 */

export interface SchedulerStatus {
  isRunning: boolean;
  lastCheck: string | null;
  nextCheck: string | null;
  activeSchedules: number;
  executedToday: number;
  errors: SchedulerError[];
}

export interface SchedulerError {
  id: string;
  scheduleId: string;
  scheduleName: string;
  error: string;
  occurredAt: string;
  resolved: boolean;
}

export interface ReportQueueItem {
  id: string;
  scheduleId: string;
  templateId: string;
  templateName: string;
  scheduledFor: string;
  priority: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  reportId?: string;
  error?: string;
  createdAt: string;
}

export function startReportScheduler(): void {
  // no-op
}

export function stopReportScheduler(): void {
  // no-op
}

export function getReportQueue(_status?: ReportQueueItem['status']): ReportQueueItem[] {
  return [];
}

export function cleanupQueue(): void {
  // no-op
}

export function getSchedulerStatus(): SchedulerStatus {
  return {
    isRunning: false,
    lastCheck: null,
    nextCheck: null,
    activeSchedules: 0,
    executedToday: 0,
    errors: [],
  };
}

export function getSchedulerErrors(): SchedulerError[] {
  return [];
}

export function resolveSchedulerError(_errorId: string): void {
  // no-op
}

export function initializeReportScheduler(): void {
  // no-op
}

export function checkAndStartScheduler(): void {
  // no-op
}
