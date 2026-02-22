/**
 * Reports Module - Data Service (stub)
 * UI-only: no localStorage, no business logic.
 */

import {
  ReportTemplate,
  GeneratedReport,
  ScheduledReport,
  ReportHistory,
} from '../types/reports';

export function getReportTemplates(_userId: string): ReportTemplate[] {
  return [];
}

export function getReportTemplate(_id: string): ReportTemplate | null {
  return null;
}

export function saveReportTemplate(_template: ReportTemplate): void {
  // no-op
}

export function deleteReportTemplate(_id: string): void {
  // no-op
}

export function toggleTemplateFavorite(_templateId: string, _userId: string): void {
  // no-op
}

export function generateReport(
  _templateId: string,
  _userId: string,
  _userName: string
): GeneratedReport | null {
  return null;
}

export function getReportHistory(_templateId?: string): ReportHistory[] {
  return [];
}

export function getGeneratedReport(_id: string): GeneratedReport | null {
  return null;
}

export function getScheduledReports(_userId: string): ScheduledReport[] {
  return [];
}

export function getScheduledReport(_id: string): ScheduledReport | null {
  return null;
}

export function createScheduledReport(_schedule: ScheduledReport): void {
  // no-op
}

export function updateScheduledReport(_schedule: ScheduledReport): void {
  // no-op
}

export function deleteScheduledReport(_id: string): void {
  // no-op
}

export function toggleScheduleActive(_id: string): void {
  // no-op
}

export function getSchedulesDueForRun(): ScheduledReport[] {
  return [];
}

export function executeScheduledReport(_scheduleId: string): GeneratedReport | null {
  return null;
}
