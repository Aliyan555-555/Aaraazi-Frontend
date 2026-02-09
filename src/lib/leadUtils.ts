/**
 * Lead Utility Functions
 *
 * Supporting utilities for lead management:
 * - Auto-assignment
 * - SLA monitoring
 * - Lead scoring helpers
 * - Search and filtering
 */

import {
  Lead,
  LeadIntent,
  LeadSource,
  LeadStatus,
  LeadPriority,
} from "../types/leads";
import { getLeads, getLeadSettings, updateLead, getActiveLeads } from "./leads";
import { logger } from "./logger";

// ============================================
// AUTO-ASSIGNMENT
// ============================================

export interface AgentWorkload {
  agentId: string;
  agentName: string;
  activeLeads: number;
  newLeads: number;
  qualifyingLeads: number;
  averageScore: number;
  slaCompliance: number;
}

/**
 * Get workload statistics for all agents
 */
export function getAgentWorkloads(inputLeads?: Lead[]): AgentWorkload[] {
  const leads = inputLeads || getActiveLeads();
  const agentMap = new Map<string, AgentWorkload>();

  leads.forEach((lead) => {
    if (!agentMap.has(lead.agentId)) {
      agentMap.set(lead.agentId, {
        agentId: lead.agentId,
        agentName: lead.agentName,
        activeLeads: 0,
        newLeads: 0,
        qualifyingLeads: 0,
        averageScore: 0,
        slaCompliance: 0,
      });
    }

    const workload = agentMap.get(lead.agentId)!;
    workload.activeLeads++;

    if (lead.status === "new") workload.newLeads++;
    if (lead.status === "qualifying") workload.qualifyingLeads++;
  });

  // Calculate averages
  agentMap.forEach((workload, agentId) => {
    const agentLeads = leads.filter((l) => l.agentId === agentId);

    if (agentLeads.length > 0) {
      const totalScore = agentLeads.reduce(
        (sum, l) => sum + l.qualificationScore,
        0,
      );
      workload.averageScore = totalScore / agentLeads.length;

      const compliantCount = agentLeads.filter(
        (l) => l.sla.slaCompliant,
      ).length;
      workload.slaCompliance = (compliantCount / agentLeads.length) * 100;
    }
  });

  return Array.from(agentMap.values());
}

/**
 * Auto-assign a lead to the least busy agent
 * Uses round-robin with workload balancing
 */
export function autoAssignLead(
  leadId: string,
  availableAgents: Array<{ id: string; name: string }>,
): Lead {
  if (availableAgents.length === 0) {
    throw new Error("No available agents for assignment");
  }

  const workloads = getAgentWorkloads();

  // Find agent with lowest workload
  let selectedAgent = availableAgents[0];
  let lowestWorkload = Number.MAX_SAFE_INTEGER;

  availableAgents.forEach((agent) => {
    const workload = workloads.find((w) => w.agentId === agent.id);
    const activeCount = workload?.activeLeads || 0;

    if (activeCount < lowestWorkload) {
      lowestWorkload = activeCount;
      selectedAgent = agent;
    }
  });

  logger.info(`Auto-assigned lead ${leadId} to agent ${selectedAgent.id}`, {
    agentId: selectedAgent.id,
    currentWorkload: lowestWorkload,
  });

  return updateLead(leadId, {
    agentId: selectedAgent.id,
    agentName: selectedAgent.name,
  });
}

/**
 * Suggest best agent for a lead based on multiple factors
 */
export function suggestAgentForLead(
  lead: Lead,
  availableAgents: Array<{
    id: string;
    name: string;
    specialties?: LeadIntent[];
    preferredSources?: LeadSource[];
  }>,
): { agentId: string; agentName: string; confidence: number; reason: string } {
  if (availableAgents.length === 0) {
    throw new Error("No available agents");
  }

  const workloads = getAgentWorkloads();
  const scores: Array<{
    agent: (typeof availableAgents)[0];
    score: number;
    reasons: string[];
  }> = [];

  availableAgents.forEach((agent) => {
    let score = 0;
    const reasons: string[] = [];

    // Factor 1: Specialty match (40 points)
    if (agent.specialties?.includes(lead.intent)) {
      score += 40;
      reasons.push(`Specializes in ${lead.intent}`);
    }

    // Factor 2: Source familiarity (20 points)
    if (agent.preferredSources?.includes(lead.source)) {
      score += 20;
      reasons.push(`Familiar with ${lead.source} leads`);
    }

    // Factor 3: Workload (20 points)
    const workload = workloads.find((w) => w.agentId === agent.id);
    const activeCount = workload?.activeLeads || 0;
    if (activeCount === 0) {
      score += 20;
      reasons.push("Currently has no active leads");
    } else if (activeCount < 5) {
      score += 15;
      reasons.push("Low workload");
    } else if (activeCount < 10) {
      score += 10;
      reasons.push("Moderate workload");
    }

    // Factor 4: SLA compliance (20 points)
    const slaRate = workload?.slaCompliance || 100;
    if (slaRate >= 90) {
      score += 20;
      reasons.push("Excellent SLA compliance");
    } else if (slaRate >= 70) {
      score += 15;
      reasons.push("Good SLA compliance");
    } else if (slaRate >= 50) {
      score += 10;
    }

    scores.push({ agent, score, reasons });
  });

  // Sort by score
  scores.sort((a, b) => b.score - a.score);

  const best = scores[0];
  const confidence = best.score / 100; // Convert to 0-1

  return {
    agentId: best.agent.id,
    agentName: best.agent.name,
    confidence,
    reason: best.reasons.join(", "),
  };
}

// ============================================
// SLA MONITORING
// ============================================

export interface SLAAlert {
  leadId: string;
  leadName: string;
  agentId: string;
  agentName: string;
  alertType:
    | "first-contact-overdue"
    | "qualification-overdue"
    | "conversion-overdue";
  hoursOverdue: number;
  priority: LeadPriority;
  createdAt: string;
}

/**
 * Get all SLA alerts for overdue leads
 */
export function getSLAAlerts(inputLeads?: Lead[]): SLAAlert[] {
  const leads = inputLeads || getActiveLeads();
  const settings = getLeadSettings();
  const alerts: SLAAlert[] = [];
  const now = new Date();

  leads.forEach((lead) => {
    const createdTime = new Date(lead.sla.createdAt).getTime();
    const hoursElapsed = (now.getTime() - createdTime) / (1000 * 60 * 60);

    // Check first contact SLA
    if (
      !lead.sla.firstContactAt &&
      hoursElapsed > settings.slaTargets.firstContactHours
    ) {
      alerts.push({
        leadId: lead.id,
        leadName: lead.name,
        agentId: lead.agentId,
        agentName: lead.agentName,
        alertType: "first-contact-overdue",
        hoursOverdue: hoursElapsed - settings.slaTargets.firstContactHours,
        priority: lead.priority,
        createdAt: lead.createdAt,
      });
    }

    // Check qualification SLA
    if (
      lead.status !== "qualified" &&
      lead.status !== "converted" &&
      hoursElapsed > settings.slaTargets.qualificationHours
    ) {
      alerts.push({
        leadId: lead.id,
        leadName: lead.name,
        agentId: lead.agentId,
        agentName: lead.agentName,
        alertType: "qualification-overdue",
        hoursOverdue: hoursElapsed - settings.slaTargets.qualificationHours,
        priority: lead.priority,
        createdAt: lead.createdAt,
      });
    }

    // Check conversion SLA
    if (
      lead.status === "qualified" &&
      hoursElapsed > settings.slaTargets.conversionHours
    ) {
      alerts.push({
        leadId: lead.id,
        leadName: lead.name,
        agentId: lead.agentId,
        agentName: lead.agentName,
        alertType: "conversion-overdue",
        hoursOverdue: hoursElapsed - settings.slaTargets.conversionHours,
        priority: lead.priority,
        createdAt: lead.createdAt,
      });
    }
  });

  // Sort by hours overdue (most urgent first)
  alerts.sort((a, b) => b.hoursOverdue - a.hoursOverdue);

  return alerts;
}

/**
 * Get SLA performance summary
 */
export interface SLAPerformance {
  totalLeads: number;
  slaCompliant: number;
  slaViolated: number;
  complianceRate: number;
  averageFirstContact: number; // hours
  averageQualification: number; // hours
  averageConversion: number; // hours
  alertsByType: {
    "first-contact-overdue": number;
    "qualification-overdue": number;
    "conversion-overdue": number;
  };
}

export function getSLAPerformance(inputLeads?: Lead[]): SLAPerformance {
  const leads = inputLeads || getLeads();
  const alerts = getSLAAlerts(leads);

  let compliant = 0;
  let violated = 0;
  let totalFirstContact = 0;
  let totalQualification = 0;
  let totalConversion = 0;
  let firstContactCount = 0;
  let qualificationCount = 0;
  let conversionCount = 0;

  leads.forEach((lead) => {
    if (lead.sla.slaCompliant) {
      compliant++;
    } else {
      violated++;
    }

    // Calculate average times
    if (lead.sla.firstContactAt) {
      const created = new Date(lead.sla.createdAt).getTime();
      const contacted = new Date(lead.sla.firstContactAt).getTime();
      totalFirstContact += (contacted - created) / (1000 * 60 * 60);
      firstContactCount++;
    }

    if (lead.sla.qualifiedAt) {
      const created = new Date(lead.sla.createdAt).getTime();
      const qualified = new Date(lead.sla.qualifiedAt).getTime();
      totalQualification += (qualified - created) / (1000 * 60 * 60);
      qualificationCount++;
    }

    if (lead.sla.convertedAt) {
      const created = new Date(lead.sla.createdAt).getTime();
      const converted = new Date(lead.sla.convertedAt).getTime();
      totalConversion += (converted - created) / (1000 * 60 * 60);
      conversionCount++;
    }
  });

  const alertsByType = {
    "first-contact-overdue": alerts.filter(
      (a) => a.alertType === "first-contact-overdue",
    ).length,
    "qualification-overdue": alerts.filter(
      (a) => a.alertType === "qualification-overdue",
    ).length,
    "conversion-overdue": alerts.filter(
      (a) => a.alertType === "conversion-overdue",
    ).length,
  };

  return {
    totalLeads: leads.length,
    slaCompliant: compliant,
    slaViolated: violated,
    complianceRate: leads.length > 0 ? (compliant / leads.length) * 100 : 0,
    averageFirstContact:
      firstContactCount > 0 ? totalFirstContact / firstContactCount : 0,
    averageQualification:
      qualificationCount > 0 ? totalQualification / qualificationCount : 0,
    averageConversion:
      conversionCount > 0 ? totalConversion / conversionCount : 0,
    alertsByType,
  };
}

/**
 * Get SLA status for a specific lead
 */
export interface LeadSLAStatus {
  isOverdue: boolean;
  overdueType?: "first-contact" | "qualification" | "conversion";
  hoursOverdue: number;
  nextCheckpoint: "first-contact" | "qualification" | "conversion" | "complete";
  slaCompliant: boolean;
}

export function getLeadSLAStatus(lead: Lead): LeadSLAStatus {
  // Safety check - if no SLA data, return default status
  if (!lead.sla || !lead.sla.createdAt) {
    return {
      isOverdue: false,
      hoursOverdue: 0,
      nextCheckpoint: "first-contact",
      slaCompliant: true,
    };
  }

  const settings = getLeadSettings();
  const now = new Date();
  const createdTime = new Date(lead.sla.createdAt).getTime();
  const hoursElapsed = (now.getTime() - createdTime) / (1000 * 60 * 60);

  // Check if first contact is overdue
  if (
    !lead.sla.firstContactAt &&
    hoursElapsed > settings.slaTargets.firstContactHours
  ) {
    return {
      isOverdue: true,
      overdueType: "first-contact",
      hoursOverdue: hoursElapsed - settings.slaTargets.firstContactHours,
      nextCheckpoint: "first-contact",
      slaCompliant: false,
    };
  }

  // Check if qualification is overdue
  if (
    lead.status !== "qualified" &&
    lead.status !== "converted" &&
    hoursElapsed > settings.slaTargets.qualificationHours
  ) {
    return {
      isOverdue: true,
      overdueType: "qualification",
      hoursOverdue: hoursElapsed - settings.slaTargets.qualificationHours,
      nextCheckpoint: "qualification",
      slaCompliant: false,
    };
  }

  // Check if conversion is overdue
  if (
    lead.status === "qualified" &&
    hoursElapsed > settings.slaTargets.conversionHours
  ) {
    return {
      isOverdue: true,
      overdueType: "conversion",
      hoursOverdue: hoursElapsed - settings.slaTargets.conversionHours,
      nextCheckpoint: "conversion",
      slaCompliant: false,
    };
  }

  // Determine next checkpoint
  let nextCheckpoint: LeadSLAStatus["nextCheckpoint"] = "complete";
  if (!lead.sla.firstContactAt) {
    nextCheckpoint = "first-contact";
  } else if (!lead.sla.qualifiedAt) {
    nextCheckpoint = "qualification";
  } else if (!lead.sla.convertedAt) {
    nextCheckpoint = "conversion";
  }

  return {
    isOverdue: false,
    hoursOverdue: 0,
    nextCheckpoint,
    slaCompliant: lead.sla.slaCompliant,
  };
}

// ============================================
// SEARCH & FILTERING
// ============================================

export interface LeadFilter {
  status?: LeadStatus[];
  priority?: LeadPriority[];
  intent?: LeadIntent[];
  source?: LeadSource[];
  agentId?: string;
  searchTerm?: string;
  dateFrom?: string;
  dateTo?: string;
  slaCompliant?: boolean;
  minScore?: number;
  maxScore?: number;
}

/**
 * Filter leads based on multiple criteria
 */
export function filterLeads(filter: LeadFilter, inputLeads?: Lead[]): Lead[] {
  let leads = inputLeads || getLeads();

  // Status filter
  if (filter.status && filter.status.length > 0) {
    leads = leads.filter((lead) => filter.status!.includes(lead.status));
  }

  // Priority filter
  if (filter.priority && filter.priority.length > 0) {
    leads = leads.filter((lead) => filter.priority!.includes(lead.priority));
  }

  // Intent filter
  if (filter.intent && filter.intent.length > 0) {
    leads = leads.filter((lead) => filter.intent!.includes(lead.intent));
  }

  // Source filter
  if (filter.source && filter.source.length > 0) {
    leads = leads.filter((lead) => filter.source!.includes(lead.source));
  }

  // Agent filter
  if (filter.agentId) {
    leads = leads.filter((lead) => lead.agentId === filter.agentId);
  }

  // Search term (name, phone, email, notes)
  if (filter.searchTerm) {
    const term = filter.searchTerm.toLowerCase();
    leads = leads.filter(
      (lead) =>
        lead.name.toLowerCase().includes(term) ||
        lead.phone.includes(term) ||
        lead.email?.toLowerCase().includes(term) ||
        lead.notes.toLowerCase().includes(term) ||
        lead.initialMessage?.toLowerCase().includes(term),
    );
  }

  // Date range
  if (filter.dateFrom) {
    const fromDate = new Date(filter.dateFrom).getTime();
    leads = leads.filter(
      (lead) => new Date(lead.createdAt).getTime() >= fromDate,
    );
  }

  if (filter.dateTo) {
    const toDate = new Date(filter.dateTo).getTime();
    leads = leads.filter(
      (lead) => new Date(lead.createdAt).getTime() <= toDate,
    );
  }

  // SLA compliance
  if (filter.slaCompliant !== undefined) {
    leads = leads.filter(
      (lead) => lead.sla.slaCompliant === filter.slaCompliant,
    );
  }

  // Score range
  if (filter.minScore !== undefined) {
    leads = leads.filter((lead) => lead.qualificationScore >= filter.minScore!);
  }

  if (filter.maxScore !== undefined) {
    leads = leads.filter((lead) => lead.qualificationScore <= filter.maxScore!);
  }

  return leads;
}

/**
 * Get leads filtered by priority
 */
export function getLeadsByPriority(priority: LeadPriority): Lead[] {
  return filterLeads({ priority: [priority] });
}

/**
 * Get leads filtered by status
 */
export function getLeadsByStatus(status: LeadStatus): Lead[] {
  return filterLeads({ status: [status] });
}

/**
 * Sort leads by various criteria
 */
export type LeadSortBy =
  | "newest"
  | "oldest"
  | "priority-high"
  | "priority-low"
  | "score-high"
  | "score-low"
  | "name-az"
  | "name-za"
  | "overdue";

export function sortLeads(leads: Lead[], sortBy: LeadSortBy): Lead[] {
  const sorted = [...leads];

  switch (sortBy) {
    case "newest":
      sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      break;

    case "oldest":
      sorted.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      break;

    case "priority-high":
      sorted.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
      break;

    case "priority-low":
      sorted.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
      break;

    case "score-high":
      sorted.sort((a, b) => b.qualificationScore - a.qualificationScore);
      break;

    case "score-low":
      sorted.sort((a, b) => a.qualificationScore - b.qualificationScore);
      break;

    case "name-az":
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;

    case "name-za":
      sorted.sort((a, b) => b.name.localeCompare(a.name));
      break;

    case "overdue":
      sorted.sort((a, b) => {
        const aOverdue = a.sla.overdueBy || 0;
        const bOverdue = b.sla.overdueBy || 0;
        return bOverdue - aOverdue;
      });
      break;
  }

  return sorted;
}

// ============================================
// LEAD TEMPLATES
// ============================================

/**
 * Get common lead templates for quick creation
 */
export interface LeadTemplate {
  id: string;
  name: string;
  description: string;
  intent: LeadIntent;
  source: LeadSource;
  defaultFields: Partial<Lead>;
}

export const LEAD_TEMPLATES: LeadTemplate[] = [
  {
    id: "website-buyer",
    name: "Website Buyer Inquiry",
    description: "Buyer inquiry from website form",
    intent: "buying",
    source: "website",
    defaultFields: {
      timeline: "within-3-months",
    },
  },
  {
    id: "walk-in-seller",
    name: "Walk-in Seller",
    description: "Seller who visited office",
    intent: "selling",
    source: "walk-in",
    defaultFields: {
      timeline: "within-1-month",
    },
  },
  {
    id: "phone-renter",
    name: "Phone Rental Inquiry",
    description: "Renter calling about property",
    intent: "renting",
    source: "phone-call",
    defaultFields: {
      timeline: "immediate",
    },
  },
  {
    id: "referral-buyer",
    name: "Referred Buyer",
    description: "Buyer from client referral",
    intent: "buying",
    source: "referral",
    defaultFields: {
      timeline: "within-1-month",
    },
  },
  {
    id: "whatsapp-investor",
    name: "WhatsApp Investor",
    description: "Investment inquiry via WhatsApp",
    intent: "investing",
    source: "whatsapp",
    defaultFields: {
      timeline: "within-6-months",
    },
  },
];

/**
 * Create lead from template
 */
export function createLeadFromTemplate(
  templateId: string,
  customData: Partial<Lead>,
): Partial<Lead> {
  const template = LEAD_TEMPLATES.find((t) => t.id === templateId);

  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  return {
    ...template.defaultFields,
    intent: template.intent,
    source: template.source,
    ...customData,
  };
}
