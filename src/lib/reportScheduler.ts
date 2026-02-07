/**
 * Report Scheduler - Client-Side Automation
 * GAP FIX: Report Scheduling Automation
 * 
 * Features:
 * - Client-side scheduler using setInterval
 * - Scheduled report generation
 * - Report queue management
 * - Automatic execution of scheduled reports
 */

import { ScheduledReport, GeneratedReport, ScheduleFrequency } from '../types/reports';
import { executeScheduledReport } from './reports';
import { ScheduledReport } from '../types/reports';

// Import scheduled report functions (using same key as reports.ts)
const SCHEDULED_REPORTS_KEY = 'aaraazi_scheduled_reports';

function getAllScheduledReports(): ScheduledReport[] {
  return JSON.parse(localStorage.getItem(SCHEDULED_REPORTS_KEY) || '[]') as ScheduledReport[];
}

function updateScheduledReport(schedule: ScheduledReport): void {
  const schedules = getAllScheduledReports();
  const index = schedules.findIndex(s => s.id === schedule.id);
  if (index >= 0) {
    schedules[index] = { ...schedule, updatedAt: new Date().toISOString() };
    localStorage.setItem(SCHEDULED_REPORTS_KEY, JSON.stringify(schedules));
  }
}

// ============================================
// TYPES & INTERFACES
// ============================================

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

// ============================================
// SCHEDULER STATE
// ============================================

let schedulerInterval: NodeJS.Timeout | null = null;
let isSchedulerRunning = false;
const CHECK_INTERVAL = 60000; // Check every minute

// ============================================
// SCHEDULER CONTROL
// ============================================

/**
 * Start the report scheduler
 */
export function startReportScheduler(): void {
  if (isSchedulerRunning) {
    console.warn('Report scheduler is already running');
    return;
  }

  isSchedulerRunning = true;
  console.log('Report scheduler started');

  // Check immediately
  checkAndExecuteScheduledReports();

  // Then check every minute
  schedulerInterval = setInterval(() => {
    checkAndExecuteScheduledReports();
  }, CHECK_INTERVAL);

  // Save scheduler state
  saveSchedulerState({ isRunning: true, startedAt: new Date().toISOString() });
}

/**
 * Stop the report scheduler
 */
export function stopReportScheduler(): void {
  if (!isSchedulerRunning) {
    return;
  }

  isSchedulerRunning = false;
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }

  console.log('Report scheduler stopped');
  saveSchedulerState({ isRunning: false, stoppedAt: new Date().toISOString() });
}

/**
 * Check and execute scheduled reports
 */
function checkAndExecuteScheduledReports(): void {
  try {
    const now = new Date();
    const schedules = getAllScheduledReports();

    // Filter active schedules
    const activeSchedules = schedules.filter(schedule => {
      if (!schedule.isActive) return false;
      if (!schedule.nextRun) return false;

      const nextRun = new Date(schedule.nextRun);
      return nextRun <= now;
    });

    // Execute each due schedule
    for (const schedule of activeSchedules) {
      executeSchedule(schedule);
    }

    // Update last check time
    updateSchedulerStatus({ lastCheck: now.toISOString() });
  } catch (error) {
    console.error('Error checking scheduled reports:', error);
    recordSchedulerError('system', 'System Error', String(error));
  }
}

/**
 * Execute a scheduled report
 */
function executeSchedule(schedule: ScheduledReport): void {
  try {
    // Add to queue
    const queueItem = addToQueue({
      scheduleId: schedule.id,
      templateId: schedule.templateId,
      templateName: schedule.templateName,
      scheduledFor: schedule.nextRun || new Date().toISOString(),
      priority: getSchedulePriority(schedule),
    });

    // Update queue item status
    updateQueueItem(queueItem.id, { status: 'processing' });

    // Execute the report
    const report = executeScheduledReport(schedule.id);

    if (report) {
      // Success
      updateQueueItem(queueItem.id, {
        status: 'completed',
        reportId: report.id,
      });

      // Update scheduler stats
      incrementExecutedCount();

      console.log(`Scheduled report executed: ${schedule.templateName} (${schedule.id})`);
    } else {
      // Failed
      updateQueueItem(queueItem.id, {
        status: 'failed',
        error: 'Failed to generate report',
      });

      recordSchedulerError(
        schedule.id,
        schedule.templateName,
        'Failed to generate report'
      );
    }
  } catch (error) {
    console.error(`Error executing schedule ${schedule.id}:`, error);
    recordSchedulerError(schedule.id, schedule.templateName, String(error));
  }
}

/**
 * Get schedule priority (higher = more important)
 */
function getSchedulePriority(schedule: ScheduledReport): number {
  // Priority based on frequency (more frequent = higher priority)
  const frequencyPriority: Record<ScheduleFrequency, number> = {
    daily: 100,
    weekly: 80,
    monthly: 60,
    quarterly: 40,
    yearly: 20,
  };

  return frequencyPriority[schedule.schedule.frequency] || 50;
}

// ============================================
// REPORT QUEUE MANAGEMENT
// ============================================

/**
 * Add report to execution queue
 */
function addToQueue(item: Omit<ReportQueueItem, 'id' | 'status' | 'createdAt'>): ReportQueueItem {
  const queueItem: ReportQueueItem = {
    id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...item,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  const queue = getQueue();
  queue.push(queueItem);
  saveQueue(queue);

  return queueItem;
}

/**
 * Update queue item
 */
function updateQueueItem(id: string, updates: Partial<ReportQueueItem>): void {
  const queue = getQueue();
  const index = queue.findIndex(item => item.id === id);
  if (index >= 0) {
    queue[index] = { ...queue[index], ...updates };
    saveQueue(queue);
  }
}

/**
 * Get report queue
 */
export function getReportQueue(status?: ReportQueueItem['status']): ReportQueueItem[] {
  const queue = getQueue();
  if (status) {
    return queue.filter(item => item.status === status);
  }
  return queue;
}

/**
 * Get queue from storage
 */
function getQueue(): ReportQueueItem[] {
  return JSON.parse(localStorage.getItem('report_scheduler_queue') || '[]') as ReportQueueItem[];
}

/**
 * Save queue to storage
 */
function saveQueue(queue: ReportQueueItem[]): void {
  // Keep only last 100 items
  const limited = queue.slice(-100);
  localStorage.setItem('report_scheduler_queue', JSON.stringify(limited));
}

/**
 * Clear completed queue items older than 7 days
 */
export function cleanupQueue(): void {
  const queue = getQueue();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const filtered = queue.filter(item => {
    if (item.status !== 'completed') return true;
    const createdAt = new Date(item.createdAt);
    return createdAt > sevenDaysAgo;
  });

  saveQueue(filtered);
}

// ============================================
// SCHEDULER STATUS & STATS
// ============================================

/**
 * Get scheduler status
 */
export function getSchedulerStatus(): SchedulerStatus {
  const schedules = getAllScheduledReports();
  const activeSchedules = schedules.filter(s => s.isActive).length;

  const today = new Date().toISOString().split('T')[0];
  const queue = getQueue();
  const executedToday = queue.filter(
    item => item.status === 'completed' && item.createdAt.startsWith(today)
  ).length;

  const errors = getSchedulerErrors().filter(e => !e.resolved);

  const state = getSchedulerState();
  const lastCheck = state.lastCheck || null;
  const nextCheck = state.isRunning
    ? new Date(Date.now() + CHECK_INTERVAL).toISOString()
    : null;

  return {
    isRunning: isSchedulerRunning,
    lastCheck,
    nextCheck,
    activeSchedules,
    executedToday,
    errors: errors.slice(0, 10), // Last 10 errors
  };
}

/**
 * Update scheduler status
 */
function updateSchedulerStatus(updates: Partial<SchedulerStatus>): void {
  const state = getSchedulerState();
  const updated = { ...state, ...updates };
  saveSchedulerState(updated);
}

/**
 * Get scheduler state from storage
 */
function getSchedulerState(): {
  isRunning: boolean;
  startedAt?: string;
  stoppedAt?: string;
  lastCheck?: string;
} {
  return JSON.parse(localStorage.getItem('report_scheduler_state') || '{"isRunning":false}');
}

/**
 * Save scheduler state to storage
 */
function saveSchedulerState(state: {
  isRunning: boolean;
  startedAt?: string;
  stoppedAt?: string;
  lastCheck?: string;
}): void {
  localStorage.setItem('report_scheduler_state', JSON.stringify(state));
}

/**
 * Increment executed count
 */
function incrementExecutedCount(): void {
  const today = new Date().toISOString().split('T')[0];
  const key = `report_scheduler_executed_${today}`;
  const count = parseInt(localStorage.getItem(key) || '0', 10);
  localStorage.setItem(key, String(count + 1));
}

// ============================================
// ERROR HANDLING
// ============================================

/**
 * Record scheduler error
 */
function recordSchedulerError(
  scheduleId: string,
  scheduleName: string,
  error: string
): void {
  const schedulerError: SchedulerError = {
    id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    scheduleId,
    scheduleName,
    error,
    occurredAt: new Date().toISOString(),
    resolved: false,
  };

  const errors = getSchedulerErrors();
  errors.push(schedulerError);

  // Keep only last 50 errors
  const limited = errors.slice(-50);
  localStorage.setItem('report_scheduler_errors', JSON.stringify(limited));
}

/**
 * Get scheduler errors
 */
export function getSchedulerErrors(): SchedulerError[] {
  return JSON.parse(localStorage.getItem('report_scheduler_errors') || '[]') as SchedulerError[];
}

/**
 * Resolve scheduler error
 */
export function resolveSchedulerError(errorId: string): void {
  const errors = getSchedulerErrors();
  const index = errors.findIndex(e => e.id === errorId);
  if (index >= 0) {
    errors[index].resolved = true;
    localStorage.setItem('report_scheduler_errors', JSON.stringify(errors));
  }
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize report scheduler
 * Call this when the app starts
 */
export function initializeReportScheduler(): void {
  // Cleanup old queue items
  cleanupQueue();

  // Auto-start scheduler if there are active schedules
  const schedules = getAllScheduledReports();
  const hasActiveSchedules = schedules.some(s => s.isActive);

  if (hasActiveSchedules) {
    startReportScheduler();
  }

  console.log('Report scheduler initialized');
}

/**
 * Auto-start scheduler when schedules are created/activated
 */
export function checkAndStartScheduler(): void {
  if (isSchedulerRunning) return;

  const schedules = getAllScheduledReports();
  const hasActiveSchedules = schedules.some(s => s.isActive);

  if (hasActiveSchedules) {
    startReportScheduler();
  }
}
