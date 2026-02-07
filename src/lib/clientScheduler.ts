/**
 * Master Client-Side Automation Scheduler
 * 
 * Orchestrates background tasks for:
 * 1. Report Scheduling
 * 2. Lead Follow-up Automation (21-day cycle)
 * 3. SLA Violation Monitoring
 * 4. Data Sync/Maintenance
 */

import { startReportScheduler, initializeReportScheduler } from './reportScheduler';
import { getActiveLeads, updateLead, addLeadInteraction } from './leads';
import { logger } from './logger';
import { getCustomReports, generateReport, updateCustomReport } from './custom-report-builder';
import { addReportHistoryEntry, recordFailedReport } from './report-history';

// ============================================
// TYPES & CONFIG
// ============================================

const AUTOMATION_STATE_KEY = 'aaraazi_automation_state';
const CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes

export interface AutomationState {
    lastRun: string;
    isRunning: boolean;
    totalTasksExecuted: number;
}

// ============================================
// SCHEDULER ENGINE
// ============================================

let automationInterval: NodeJS.Timeout | null = null;

/**
 * Initialize and start the master scheduler
 */
export function initializeMasterScheduler(): void {
    // 1. Initialize sub-schedulers
    initializeReportScheduler();

    // 2. Start master loop
    if (automationInterval) clearInterval(automationInterval);

    automationInterval = setInterval(() => {
        runAutomationCycle();
    }, CHECK_INTERVAL);

    // Run once immediately
    runAutomationCycle();

    logger.info('Master Automation Scheduler started');
}

/**
 * Stop the master scheduler
 */
export function stopMasterScheduler(): void {
    if (automationInterval) {
        clearInterval(automationInterval);
        automationInterval = null;
    }
}

/**
 * Main automation cycle
 */
async function runAutomationCycle(): Promise<void> {
    const now = new Date();
    logger.info(`Running automation cycle at ${now.toISOString()}`);

    try {
        // 1. Process Lead Follow-ups
        await processLeadFollowUps();

        // 2. Process Custom Report Schedules
        await processCustomReportSchedules();

        // 3. Monitor SLAs
        await monitorSLAViolations();

        // 4. Update state
        saveAutomationState({
            lastRun: now.toISOString(),
            isRunning: true,
            totalTasksExecuted: 0 // In real app, increment this
        });

    } catch (error) {
        logger.error('Automation cycle failed', error);
    }
}

// ============================================
// LEAD FOLLOW-UPS (21-DAY CYCLE)
// ============================================

/**
 * Processes automated follow-ups for leads based on the documented 21-day cycle.
 * Day 1: Thank you email (immediate)
 * Day 2: Follow-up call task
 * Day 7: Market insights email
 * Day 14: Value proposition email
 * Day 21: Final follow-up / Move to long-term
 */
async function processLeadFollowUps(): Promise<void> {
    const activeLeads = getActiveLeads();
    const now = new Date();

    for (const lead of activeLeads) {
        const createdDate = new Date(lead.createdAt);
        const diffDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

        // Check if we've already handled this day's automation for this lead
        // (Assuming we store lastAutomationDay in lead metadata or check interactions)

        if (diffDays === 0 && !hasInteractionOnDay(lead, 0, 'Welcome Email')) {
            sendMockEmail(lead, 'Welcome to Aaraazi', 'Thank you for your inquiry...');
        } else if (diffDays === 7 && !hasInteractionOnDay(lead, 7, 'Market Insights')) {
            sendMockEmail(lead, 'Market Insights for You', 'Check out the latest trends...');
        } else if (diffDays === 14 && !hasInteractionOnDay(lead, 14, 'Value Prop')) {
            sendMockEmail(lead, 'Why Aaraazi?', 'We offer the best property services...');
        } else if (diffDays === 21 && !hasInteractionOnDay(lead, 21, 'Final Check')) {
            sendMockEmail(lead, 'Still interested?', 'Just checking in one last time...');
            // Optionally move to long-term timeline
            updateLead(lead.id, { timeline: 'long-term' });
        }
    }
}

function hasInteractionOnDay(lead: any, day: number, search: string): boolean {
    return lead.interactions.some((i: any) => i.summary.includes(search));
}

function sendMockEmail(lead: any, subject: string, body: string): void {
    logger.info(`[MOCK EMAIL] To: ${lead.email}, Subject: ${subject}`);

    // Record in interactions so we don't send twice
    addLeadInteraction(lead.id, {
        type: 'email',
        direction: 'outbound',
        summary: `Automated Email: ${subject}`,
        notes: body,
        agentId: 'system',
        agentName: 'Aaraazi Bot'
    });
}

// ============================================
// CUSTOM REPORT SCHEDULES
// ============================================

/**
 * Processes scheduled runs for custom reports
 */
async function processCustomReportSchedules(): Promise<void> {
    const reports = getCustomReports();
    const now = new Date();

    for (const report of reports) {
        if (!report.config.schedule?.enabled) continue;

        let nextRun = report.config.schedule.nextRun ? new Date(report.config.schedule.nextRun) : null;

        // If enabled but no nextRun, calculate it
        if (!nextRun) {
            const calculated = calculateNextRun(report.config.schedule);
            updateCustomReport(report.id, {
                config: {
                    ...report.config,
                    schedule: {
                        ...report.config.schedule,
                        nextRun: calculated
                    }
                }
            });
            nextRun = new Date(calculated);
        }

        if (nextRun && nextRun <= now) {
            logger.info(`Executing scheduled report: ${report.name}`);
            const startTime = Date.now();

            try {
                // Generate the report
                const generatedReport = generateReport(report.config, 'system', 'admin');
                generatedReport.templateId = report.id;
                generatedReport.templateName = report.name;

                // Record in history
                addReportHistoryEntry(generatedReport, 'scheduled', Date.now() - startTime);

                // Calculate next run time
                const newNextRun = calculateNextRun(report.config.schedule);

                // Update report template
                updateCustomReport(report.id, {
                    generationCount: (report.generationCount || 0) + 1,
                    lastGenerated: now.toISOString(),
                    config: {
                        ...report.config,
                        schedule: {
                            ...report.config.schedule,
                            nextRun: newNextRun
                        }
                    }
                });

                logger.info(`Scheduled report ${report.name} completed. Next run: ${newNextRun}`);
            } catch (error) {
                logger.error(`Scheduled report ${report.name} failed`, error);
                recordFailedReport(report.id, report.name, 'system', 'scheduled', String(error));
            }
        }
    }
}

function calculateNextRun(schedule: any): string {
    const now = new Date();
    const next = new Date();
    const [hours, minutes] = (schedule.time || '09:00').split(':').map(Number);

    next.setHours(hours, minutes, 0, 0);

    // If today's time has passed, move to next occurrence
    if (next <= now) {
        switch (schedule.frequency) {
            case 'daily':
                next.setDate(next.getDate() + 1);
                break;
            case 'weekly':
                next.setDate(next.getDate() + 7);
                break;
            case 'monthly':
                next.setMonth(next.getMonth() + 1);
                break;
            case 'quarterly':
                next.setMonth(next.getMonth() + 3);
                break;
            default:
                next.setDate(next.getDate() + 1);
        }
    }

    return next.toISOString();
}

// ============================================
// SLA MONITORING
// ============================================

async function monitorSLAViolations(): Promise<void> {
    const activeLeads = getActiveLeads();
    const now = new Date();

    for (const lead of activeLeads) {
        if (!lead.sla.slaCompliant) continue;

        // Check if now should be overdue
        // (This is already handled by getOverdueLeads but we can trigger notifications here)
        const hoursElapsed = (now.getTime() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60);

        if (lead.status === 'new' && hoursElapsed > 2) {
            triggerSLANotification(lead, 'First Contact Overdue');
        }
    }
}

function triggerSLANotification(lead: any, message: string): void {
    logger.warn(`[SLA ALERT] Lead ${lead.name}: ${message}`);
    // In a real app, send browser notification or push
}

// ============================================
// STATE PERSISTENCE
// ============================================

function saveAutomationState(state: AutomationState): void {
    localStorage.setItem(AUTOMATION_STATE_KEY, JSON.stringify(state));
}

export function getAutomationState(): AutomationState | null {
    const stored = localStorage.getItem(AUTOMATION_STATE_KEY);
    return stored ? JSON.parse(stored) : null;
}
