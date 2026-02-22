/**
 * Lead Management Service (Stub)
 *
 * Stub implementation - no persistence, no localStorage.
 * All operations return minimal/default values.
 */

import type {
  Lead,
  LeadStatus,
  LeadSource,
  LeadPriority,
  LeadIntent,
  LeadTimeline,
  LeadDetails,
  LeadSLA,
  LeadScoreBreakdown,
  LeadInteraction,
  LeadLossReason,
} from '../types/leads';

// ============================================
// LEAD SETTINGS
// ============================================

export interface LeadSettings {
  autoAssignEnabled: boolean;
  defaultAgentId?: string;
  slaTargets: {
    firstContactHours: number;
    qualificationHours: number;
    conversionHours: number;
  };
  qualificationScoreWeights: {
    contactQuality: number;
    intentClarity: number;
    budgetRealism: number;
    timelineUrgency: number;
    sourceQuality: number;
  };
  autoArchiveAfterDays: number;
}

export const DEFAULT_LEAD_SETTINGS: LeadSettings = {
  autoAssignEnabled: false,
  slaTargets: {
    firstContactHours: 2,
    qualificationHours: 24,
    conversionHours: 48,
  },
  qualificationScoreWeights: {
    contactQuality: 20,
    intentClarity: 20,
    budgetRealism: 20,
    timelineUrgency: 20,
    sourceQuality: 20,
  },
  autoArchiveAfterDays: 30,
};

// ============================================
// SETTINGS MANAGEMENT
// ============================================

export function getLeadSettings(): LeadSettings {
  return DEFAULT_LEAD_SETTINGS;
}

export function updateLeadSettings(_settings: Partial<LeadSettings>): void {
  // no-op
}

// ============================================
// HELPERS
// ============================================

function createMinimalLead(overrides: Partial<Lead> = {}): Lead {
  const now = new Date().toISOString();
  const defaultSla: LeadSLA = {
    createdAt: now,
    slaCompliant: true,
    overdueBy: 0,
  };
  const defaultScoreBreakdown: LeadScoreBreakdown = {
    contactQuality: 0,
    intentClarity: 0,
    budgetRealism: 0,
    timelineUrgency: 0,
    sourceQuality: 0,
  };
  return {
    id: generateLeadId(),
    workspaceId: '',
    name: '',
    phone: '',
    phoneVerified: false,
    emailVerified: false,
    intent: 'unknown',
    timeline: 'unknown',
    source: 'other',
    qualificationScore: 0,
    scoreBreakdown: defaultScoreBreakdown,
    priority: 'low',
    status: 'new',
    interactions: [],
    notes: '',
    sla: defaultSla,
    agentId: '',
    agentName: '',
    createdAt: now,
    updatedAt: now,
    createdBy: '',
    version: 2,
    ...overrides,
  };
}

function defaultSLAStatus(): { sla: LeadSLA; status: 'compliant' | 'warning' | 'overdue'; message: string } {
  const now = new Date().toISOString();
  return {
    sla: { createdAt: now, slaCompliant: true, overdueBy: 0 },
    status: 'compliant',
    message: 'All SLA targets met',
  };
}

// ============================================
// LEAD CRUD OPERATIONS
// ============================================

export function getLeads(): Lead[] {
  return [];
}

export function getLeadById(_leadId: string): Lead | undefined {
  return undefined;
}

export function createLead(data: {
  name: string;
  phone: string;
  email?: string;
  alternatePhone?: string;
  source: LeadSource;
  sourceDetails?: string;
  campaign?: string;
  referredBy?: string;
  initialMessage?: string;
  intent?: LeadIntent;
  timeline?: LeadTimeline;
  details?: LeadDetails;
  agentId: string;
  agentName: string;
  createdBy: string;
  workspaceId: string;
}): Lead {
  return createMinimalLead({
    id: generateLeadId(),
    name: data.name,
    phone: data.phone,
    email: data.email,
    alternatePhone: data.alternatePhone,
    source: data.source,
    sourceDetails: data.sourceDetails,
    campaign: data.campaign,
    referredBy: data.referredBy,
    initialMessage: data.initialMessage,
    intent: data.intent ?? 'unknown',
    timeline: data.timeline ?? 'unknown',
    details: data.details,
    agentId: data.agentId,
    agentName: data.agentName,
    createdBy: data.createdBy,
    workspaceId: data.workspaceId,
  });
}

export function updateLead(_leadId: string, updates: Partial<Lead>): Lead {
  return createMinimalLead(updates);
}

export function deleteLead(_leadId: string): void {
  // no-op
}

// ============================================
// LEAD INTERACTIONS
// ============================================

export function addLeadInteraction(
  _leadId: string,
  _interaction: Omit<LeadInteraction, 'id' | 'timestamp'>
): Lead {
  // no-op - but return type is Lead, so return minimal
  return createMinimalLead();
}

export function updateLeadNotes(_leadId: string, _notes: string): Lead {
  return createMinimalLead();
}

// ============================================
// QUALIFICATION SCORING
// ============================================

export function recalculateLeadScore(_leadId: string): Lead {
  return createMinimalLead();
}

// ============================================
// SLA TRACKING
// ============================================

export function getLeadSLAStatus(_leadId: string): {
  sla: LeadSLA;
  status: 'compliant' | 'warning' | 'overdue';
  message: string;
} {
  return defaultSLAStatus();
}

// ============================================
// LEAD STATUS MANAGEMENT
// ============================================

export function markLeadAsLost(
  _leadId: string,
  _reason: LeadLossReason,
  _notes?: string
): Lead {
  // no-op
  return createMinimalLead();
}

export function archiveLead(_leadId: string): Lead {
  return createMinimalLead({ status: 'archived' });
}

export function reactivateLead(_leadId: string): Lead {
  return createMinimalLead();
}

// ============================================
// FILTERING & QUERIES
// ============================================

export function getLeadsByStatus(_status: LeadStatus): Lead[] {
  return [];
}

export function getLeadsByAgent(_agentId: string): Lead[] {
  return [];
}

export function getLeadsByPriority(_priority: LeadPriority): Lead[] {
  return [];
}

export function getOverdueLeads(): Lead[] {
  return [];
}

export function getActiveLeads(): Lead[] {
  return [];
}

export function getLeadsRequiringAction(): Lead[] {
  return [];
}

// ============================================
// BULK OPERATIONS
// ============================================

export function bulkAssignLeads(
  _leadIds: string[],
  _agentId: string,
  _agentName: string
): void {
  // no-op
}

export function bulkUpdateLeadStatus(_leadIds: string[], _status: LeadStatus): void {
  // no-op
}

// ============================================
// ANALYTICS
// ============================================

export interface LeadStats {
  total: number;
  byStatus: Record<LeadStatus, number>;
  byPriority: Record<LeadPriority, number>;
  byIntent: Record<LeadIntent, number>;
  bySource: Record<string, number>;
  averageScore: number;
  slaCompliance: number;
  conversionRate: number;
  averageTimeToConversion: number;
}

export function getLeadStatistics(): LeadStats {
  return {
    total: 0,
    byStatus: {
      new: 0,
      qualifying: 0,
      qualified: 0,
      converted: 0,
      lost: 0,
      archived: 0,
    },
    byPriority: {
      high: 0,
      medium: 0,
      low: 0,
    },
    byIntent: {
      buying: 0,
      selling: 0,
      renting: 0,
      'leasing-out': 0,
      investing: 0,
      unknown: 0,
    },
    bySource: {},
    averageScore: 0,
    slaCompliance: 0,
    conversionRate: 0,
    averageTimeToConversion: 0,
  };
}

// ============================================
// UTILITIES
// ============================================

export function generateLeadId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `lead_${timestamp}_${random}`;
}

export function validateLeadData(_data: Partial<Lead>): {
  valid: boolean;
  errors: string[];
} {
  return { valid: true, errors: [] };
}
