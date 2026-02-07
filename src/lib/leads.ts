/**
 * Lead Management Service
 * 
 * Core CRUD operations and business logic for the redesigned Lead system
 * Lead lifecycle: < 72 hours (new → qualifying → qualified → converted → archived)
 */

import { 
  Lead, 
  LeadIntent, 
  LeadTimeline, 
  LeadStatus, 
  LeadSource,
  LeadPriority,
  LeadInteraction,
  LeadInteractionType,
  LeadInteractionDirection,
  LeadSLA,
  LeadScoreBreakdown,
  LeadRouting,
  LeadLossReason,
  LeadDetails
} from '../types/leads';
import { logger } from './logger';

// ============================================
// STORAGE KEYS
// ============================================

const LEADS_KEY = 'aaraazi_leads_v2';
const LEAD_SETTINGS_KEY = 'aaraazi_lead_settings';

// ============================================
// LEAD SETTINGS
// ============================================

export interface LeadSettings {
  autoAssignEnabled: boolean;
  defaultAgentId?: string;
  slaTargets: {
    firstContactHours: number;      // Default: 2 hours
    qualificationHours: number;     // Default: 24 hours
    conversionHours: number;        // Default: 48 hours
  };
  qualificationScoreWeights: {
    contactQuality: number;         // /20
    intentClarity: number;          // /20
    budgetRealism: number;          // /20
    timelineUrgency: number;        // /20
    sourceQuality: number;          // /20
  };
  autoArchiveAfterDays: number;     // Auto-archive converted leads after X days
}

const DEFAULT_LEAD_SETTINGS: LeadSettings = {
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
  try {
    const stored = localStorage.getItem(LEAD_SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_LEAD_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (error) {
    logger.error('Failed to load lead settings', error);
  }
  return DEFAULT_LEAD_SETTINGS;
}

export function updateLeadSettings(settings: Partial<LeadSettings>): void {
  try {
    const current = getLeadSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(LEAD_SETTINGS_KEY, JSON.stringify(updated));
    logger.info('Lead settings updated');
  } catch (error) {
    logger.error('Failed to update lead settings', error);
    throw error;
  }
}

// ============================================
// LEAD CRUD OPERATIONS
// ============================================

/**
 * Get all leads
 */
export function getLeads(): Lead[] {
  try {
    const stored = localStorage.getItem(LEADS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    logger.error('Failed to load leads', error);
    return [];
  }
}

/**
 * Get a single lead by ID
 */
export function getLeadById(leadId: string): Lead | undefined {
  const leads = getLeads();
  return leads.find(lead => lead.id === leadId);
}

/**
 * Save leads to storage
 */
function saveLeads(leads: Lead[]): void {
  try {
    localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
    logger.info(`Saved ${leads.length} leads`);
  } catch (error) {
    logger.error('Failed to save leads', error);
    throw error;
  }
}

/**
 * Create a new lead
 */
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
  try {
    const now = new Date().toISOString();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    
    // Calculate initial qualification score
    const scoreBreakdown = calculateQualificationScore({
      phoneVerified: false,
      emailVerified: false,
      email: data.email,
      intent: data.intent || 'unknown',
      timeline: data.timeline || 'unknown',
      source: data.source,
      details: data.details,
    });
    
    const totalScore = Object.values(scoreBreakdown).reduce((sum, val) => sum + val, 0);
    const priority = calculatePriority(totalScore);
    
    // Initialize SLA tracking
    const sla: LeadSLA = {
      createdAt: now,
      slaCompliant: true,
      overdueBy: 0,
    };
    
    const newLead: Lead = {
      id: `lead_${timestamp}_${random}`,
      workspaceId: data.workspaceId,
      
      // Contact info
      name: data.name,
      phone: data.phone,
      email: data.email,
      alternatePhone: data.alternatePhone,
      phoneVerified: false,
      emailVerified: false,
      
      // Qualification
      intent: data.intent || 'unknown',
      timeline: data.timeline || 'unknown',
      details: data.details,
      
      // Source
      source: data.source,
      sourceDetails: data.sourceDetails,
      campaign: data.campaign,
      referredBy: data.referredBy,
      initialMessage: data.initialMessage,
      
      // Scoring
      qualificationScore: totalScore,
      scoreBreakdown,
      priority,
      
      // Status
      status: 'new',
      
      // Interactions
      interactions: [],
      notes: '',
      
      // SLA
      sla,
      
      // Assignment
      agentId: data.agentId,
      agentName: data.agentName,
      
      // Metadata
      createdAt: now,
      updatedAt: now,
      createdBy: data.createdBy,
      version: 2,
    };
    
    const leads = getLeads();
    leads.push(newLead);
    saveLeads(leads);
    
    logger.info(`Created lead: ${newLead.id}`, { leadId: newLead.id, name: data.name });
    return newLead;
  } catch (error) {
    logger.error('Failed to create lead', error);
    throw error;
  }
}

/**
 * Update an existing lead
 */
export function updateLead(leadId: string, updates: Partial<Lead>): Lead {
  try {
    const leads = getLeads();
    const index = leads.findIndex(lead => lead.id === leadId);
    
    if (index === -1) {
      throw new Error(`Lead not found: ${leadId}`);
    }
    
    const updatedLead: Lead = {
      ...leads[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    // Recalculate score if relevant fields changed
    if (
      updates.phoneVerified !== undefined ||
      updates.emailVerified !== undefined ||
      updates.intent !== undefined ||
      updates.timeline !== undefined ||
      updates.details !== undefined
    ) {
      const scoreBreakdown = calculateQualificationScore({
        phoneVerified: updatedLead.phoneVerified,
        emailVerified: updatedLead.emailVerified,
        email: updatedLead.email,
        intent: updatedLead.intent,
        timeline: updatedLead.timeline,
        source: updatedLead.source,
        details: updatedLead.details,
      });
      updatedLead.qualificationScore = Object.values(scoreBreakdown).reduce((sum, val) => sum + val, 0);
      updatedLead.scoreBreakdown = scoreBreakdown;
      updatedLead.priority = calculatePriority(updatedLead.qualificationScore);
    }
    
    // Update SLA tracking if status changed
    if (updates.status && updates.status !== leads[index].status) {
      updatedLead.sla = updateSLATracking(updatedLead);
    }
    
    leads[index] = updatedLead;
    saveLeads(leads);
    
    logger.info(`Updated lead: ${leadId}`);
    return updatedLead;
  } catch (error) {
    logger.error('Failed to update lead', error);
    throw error;
  }
}

/**
 * Delete a lead
 */
export function deleteLead(leadId: string): void {
  try {
    const leads = getLeads();
    const filtered = leads.filter(lead => lead.id !== leadId);
    
    if (filtered.length === leads.length) {
      throw new Error(`Lead not found: ${leadId}`);
    }
    
    saveLeads(filtered);
    logger.info(`Deleted lead: ${leadId}`);
  } catch (error) {
    logger.error('Failed to delete lead', error);
    throw error;
  }
}

// ============================================
// LEAD INTERACTIONS
// ============================================

/**
 * Add an interaction to a lead
 */
export function addLeadInteraction(
  leadId: string,
  interaction: Omit<LeadInteraction, 'id' | 'timestamp'>
): Lead {
  try {
    const lead = getLeadById(leadId);
    if (!lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }
    
    const newInteraction: LeadInteraction = {
      ...interaction,
      id: `int_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      timestamp: new Date().toISOString(),
    };
    
    const updates: Partial<Lead> = {
      interactions: [...lead.interactions, newInteraction],
    };
    
    // Update SLA if this is first contact
    if (lead.interactions.length === 0 && !lead.sla.firstContactAt) {
      updates.sla = {
        ...lead.sla,
        firstContactAt: newInteraction.timestamp,
      };
    }
    
    // Auto-update status from 'new' to 'qualifying' on first interaction
    if (lead.status === 'new' && interaction.type !== 'note') {
      updates.status = 'qualifying';
    }
    
    return updateLead(leadId, updates);
  } catch (error) {
    logger.error('Failed to add interaction', error);
    throw error;
  }
}

/**
 * Update notes on a lead
 */
export function updateLeadNotes(leadId: string, notes: string): Lead {
  return updateLead(leadId, { notes });
}

// ============================================
// QUALIFICATION SCORING
// ============================================

/**
 * Calculate qualification score breakdown
 */
function calculateQualificationScore(data: {
  phoneVerified: boolean;
  emailVerified: boolean;
  email?: string;
  intent: LeadIntent;
  timeline: LeadTimeline;
  source: LeadSource;
  details?: LeadDetails;
}): LeadScoreBreakdown {
  const settings = getLeadSettings();
  const weights = settings.qualificationScoreWeights;
  
  // 1. Contact Quality (0-20)
  let contactQuality = 0;
  if (data.phoneVerified) contactQuality += 12;
  else if (data.email) contactQuality += 4; // Has phone (required) + email
  
  if (data.emailVerified) contactQuality += 8;
  else if (data.email) contactQuality += 3; // Has email but not verified
  
  contactQuality = Math.min(contactQuality, weights.contactQuality);
  
  // 2. Intent Clarity (0-20)
  let intentClarity = 0;
  const intentScores: Record<LeadIntent, number> = {
    'buying': 20,
    'selling': 20,
    'renting': 18,
    'leasing-out': 18,
    'investing': 16,
    'unknown': 0,
  };
  intentClarity = Math.min(intentScores[data.intent] || 0, weights.intentClarity);
  
  // 3. Budget Realism (0-20)
  let budgetRealism = 0;
  if (data.details) {
    if (data.intent === 'buying' && (data.details.budgetMin || data.details.budgetMax)) {
      budgetRealism = 20; // Has budget info
    } else if (data.intent === 'selling' && data.details.expectedPrice) {
      budgetRealism = 18; // Has price expectation
    } else if (data.intent === 'renting' && data.details.monthlyBudget) {
      budgetRealism = 18; // Has rental budget
    } else if (data.intent === 'leasing-out' && data.details.expectedRent) {
      budgetRealism = 18; // Has rental expectation
    } else if (data.intent === 'investing' && data.details.investmentBudget) {
      budgetRealism = 16; // Has investment budget
    }
  }
  budgetRealism = Math.min(budgetRealism, weights.budgetRealism);
  
  // 4. Timeline Urgency (0-20)
  const timelineScores: Record<LeadTimeline, number> = {
    'immediate': 20,
    'within-1-month': 18,
    'within-3-months': 14,
    'within-6-months': 10,
    'long-term': 6,
    'unknown': 0,
  };
  const timelineUrgency = Math.min(
    timelineScores[data.timeline] || 0,
    weights.timelineUrgency
  );
  
  // 5. Source Quality (0-20)
  const sourceScores: Record<LeadSource, number> = {
    'referral': 20,
    'walk-in': 18,
    'whatsapp': 16,
    'phone-call': 16,
    'website': 14,
    'email': 14,
    'zameen': 12,
    'olx': 12,
    'social-media': 10,
    'property-sign': 10,
    'event': 8,
    'coldcall': 6,
    'other': 4,
  };
  const sourceQuality = Math.min(
    sourceScores[data.source] || 0,
    weights.sourceQuality
  );
  
  return {
    contactQuality,
    intentClarity,
    budgetRealism,
    timelineUrgency,
    sourceQuality,
  };
}

/**
 * Calculate priority from total score
 */
function calculatePriority(score: number): LeadPriority {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

/**
 * Recalculate and update lead score
 */
export function recalculateLeadScore(leadId: string): Lead {
  const lead = getLeadById(leadId);
  if (!lead) {
    throw new Error(`Lead not found: ${leadId}`);
  }
  
  const scoreBreakdown = calculateQualificationScore({
    phoneVerified: lead.phoneVerified,
    emailVerified: lead.emailVerified,
    email: lead.email,
    intent: lead.intent,
    timeline: lead.timeline,
    source: lead.source,
    details: lead.details,
  });
  
  const totalScore = Object.values(scoreBreakdown).reduce((sum, val) => sum + val, 0);
  const priority = calculatePriority(totalScore);
  
  return updateLead(leadId, {
    qualificationScore: totalScore,
    scoreBreakdown,
    priority,
  });
}

// ============================================
// SLA TRACKING
// ============================================

/**
 * Update SLA tracking based on lead status changes
 */
function updateSLATracking(lead: Lead): LeadSLA {
  const now = new Date().toISOString();
  const settings = getLeadSettings();
  const sla = { ...lead.sla };
  
  // Mark when qualified
  if (lead.status === 'qualified' && !sla.qualifiedAt) {
    sla.qualifiedAt = now;
  }
  
  // Mark when converted
  if (lead.status === 'converted' && !sla.convertedAt) {
    sla.convertedAt = now;
  }
  
  // Calculate SLA compliance and overdue time
  const createdTime = new Date(sla.createdAt).getTime();
  const nowTime = new Date(now).getTime();
  const hoursElapsed = (nowTime - createdTime) / (1000 * 60 * 60);
  
  let slaCompliant = true;
  let overdueBy = 0;
  
  // Check first contact SLA (2 hours)
  if (!sla.firstContactAt && hoursElapsed > settings.slaTargets.firstContactHours) {
    slaCompliant = false;
    overdueBy = Math.max(overdueBy, hoursElapsed - settings.slaTargets.firstContactHours);
  }
  
  // Check qualification SLA (24 hours)
  if (!sla.qualifiedAt && hoursElapsed > settings.slaTargets.qualificationHours) {
    slaCompliant = false;
    overdueBy = Math.max(overdueBy, hoursElapsed - settings.slaTargets.qualificationHours);
  }
  
  // Check conversion SLA (48 hours)
  if (!sla.convertedAt && hoursElapsed > settings.slaTargets.conversionHours) {
    slaCompliant = false;
    overdueBy = Math.max(overdueBy, hoursElapsed - settings.slaTargets.conversionHours);
  }
  
  sla.slaCompliant = slaCompliant;
  sla.overdueBy = overdueBy;
  
  return sla;
}

/**
 * Get SLA status for a lead
 */
export function getLeadSLAStatus(leadId: string): {
  sla: LeadSLA;
  status: 'compliant' | 'warning' | 'overdue';
  message: string;
} {
  const lead = getLeadById(leadId);
  if (!lead) {
    throw new Error(`Lead not found: ${leadId}`);
  }
  
  const sla = updateSLATracking(lead);
  
  let status: 'compliant' | 'warning' | 'overdue' = 'compliant';
  let message = 'All SLA targets met';
  
  if (!sla.slaCompliant) {
    status = 'overdue';
    message = `Overdue by ${Math.round(sla.overdueBy || 0)} hours`;
  } else if (sla.overdueBy && sla.overdueBy > 0) {
    status = 'warning';
    message = `Approaching SLA deadline`;
  }
  
  return { sla, status, message };
}

// ============================================
// LEAD STATUS MANAGEMENT
// ============================================

/**
 * Mark lead as lost
 */
export function markLeadAsLost(
  leadId: string,
  reason: LeadLossReason,
  notes?: string
): Lead {
  return updateLead(leadId, {
    status: 'lost',
    lossReason: reason,
    lossNotes: notes,
  });
}

/**
 * Archive a lead (for converted or old lost leads)
 */
export function archiveLead(leadId: string): Lead {
  return updateLead(leadId, {
    status: 'archived',
  });
}

/**
 * Reactivate an archived lead
 */
export function reactivateLead(leadId: string): Lead {
  const lead = getLeadById(leadId);
  if (!lead) {
    throw new Error(`Lead not found: ${leadId}`);
  }
  
  // Determine appropriate status based on previous state
  const newStatus: LeadStatus = lead.routedTo ? 'converted' : 'new';
  
  return updateLead(leadId, {
    status: newStatus,
  });
}

// ============================================
// FILTERING & QUERIES
// ============================================

/**
 * Get leads by status
 */
export function getLeadsByStatus(status: LeadStatus): Lead[] {
  return getLeads().filter(lead => lead.status === status);
}

/**
 * Get leads by agent
 */
export function getLeadsByAgent(agentId: string): Lead[] {
  return getLeads().filter(lead => lead.agentId === agentId);
}

/**
 * Get leads by priority
 */
export function getLeadsByPriority(priority: LeadPriority): Lead[] {
  return getLeads().filter(lead => lead.priority === priority);
}

/**
 * Get overdue leads (SLA violated)
 */
export function getOverdueLeads(): Lead[] {
  return getLeads().filter(lead => {
    const sla = updateSLATracking(lead);
    return !sla.slaCompliant && lead.status !== 'converted' && lead.status !== 'archived';
  });
}

/**
 * Get active leads (new + qualifying + qualified)
 */
export function getActiveLeads(): Lead[] {
  return getLeads().filter(lead => 
    lead.status === 'new' || 
    lead.status === 'qualifying' || 
    lead.status === 'qualified'
  );
}

/**
 * Get leads requiring action
 * (new leads, overdue leads, qualified leads waiting for conversion)
 */
export function getLeadsRequiringAction(): Lead[] {
  const leads = getLeads();
  return leads.filter(lead => {
    if (lead.status === 'converted' || lead.status === 'archived') {
      return false;
    }
    
    // New leads without first contact
    if (lead.status === 'new' && !lead.sla.firstContactAt) {
      return true;
    }
    
    // Qualified leads waiting for conversion
    if (lead.status === 'qualified') {
      return true;
    }
    
    // Overdue leads
    const sla = updateSLATracking(lead);
    if (!sla.slaCompliant) {
      return true;
    }
    
    return false;
  });
}

// ============================================
// BULK OPERATIONS
// ============================================

/**
 * Bulk assign leads to agent
 */
export function bulkAssignLeads(leadIds: string[], agentId: string, agentName: string): void {
  const leads = getLeads();
  let updated = 0;
  
  leadIds.forEach(leadId => {
    const index = leads.findIndex(l => l.id === leadId);
    if (index !== -1) {
      leads[index] = {
        ...leads[index],
        agentId,
        agentName,
        updatedAt: new Date().toISOString(),
      };
      updated++;
    }
  });
  
  if (updated > 0) {
    saveLeads(leads);
    logger.info(`Bulk assigned ${updated} leads to agent ${agentId}`);
  }
}

/**
 * Bulk update lead status
 */
export function bulkUpdateLeadStatus(leadIds: string[], status: LeadStatus): void {
  const leads = getLeads();
  let updated = 0;
  
  leadIds.forEach(leadId => {
    const index = leads.findIndex(l => l.id === leadId);
    if (index !== -1) {
      leads[index] = {
        ...leads[index],
        status,
        sla: updateSLATracking({ ...leads[index], status }),
        updatedAt: new Date().toISOString(),
      };
      updated++;
    }
  });
  
  if (updated > 0) {
    saveLeads(leads);
    logger.info(`Bulk updated ${updated} leads to status: ${status}`);
  }
}

// ============================================
// ANALYTICS
// ============================================

/**
 * Get lead statistics
 */
export interface LeadStats {
  total: number;
  byStatus: Record<LeadStatus, number>;
  byPriority: Record<LeadPriority, number>;
  byIntent: Record<LeadIntent, number>;
  bySource: Record<string, number>;
  averageScore: number;
  slaCompliance: number; // Percentage
  conversionRate: number; // Percentage
  averageTimeToConversion: number; // Hours
}

export function getLeadStatistics(): LeadStats {
  const leads = getLeads();
  
  const stats: LeadStats = {
    total: leads.length,
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
  
  if (leads.length === 0) {
    return stats;
  }
  
  let totalScore = 0;
  let compliantCount = 0;
  let convertedCount = 0;
  let totalConversionTime = 0;
  
  leads.forEach(lead => {
    // Status
    stats.byStatus[lead.status]++;
    
    // Priority
    stats.byPriority[lead.priority]++;
    
    // Intent
    stats.byIntent[lead.intent]++;
    
    // Source
    stats.bySource[lead.source] = (stats.bySource[lead.source] || 0) + 1;
    
    // Score
    totalScore += lead.qualificationScore;
    
    // SLA compliance
    const sla = updateSLATracking(lead);
    if (sla.slaCompliant) {
      compliantCount++;
    }
    
    // Conversion tracking
    if (lead.status === 'converted' && lead.sla.convertedAt) {
      convertedCount++;
      const created = new Date(lead.createdAt).getTime();
      const converted = new Date(lead.sla.convertedAt).getTime();
      totalConversionTime += (converted - created) / (1000 * 60 * 60); // hours
    }
  });
  
  stats.averageScore = totalScore / leads.length;
  stats.slaCompliance = (compliantCount / leads.length) * 100;
  stats.conversionRate = (convertedCount / leads.length) * 100;
  stats.averageTimeToConversion = convertedCount > 0 ? totalConversionTime / convertedCount : 0;
  
  return stats;
}

// ============================================
// UTILITIES
// ============================================

/**
 * Generate lead ID
 */
export function generateLeadId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `lead_${timestamp}_${random}`;
}

/**
 * Validate lead data
 */
export function validateLeadData(data: Partial<Lead>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (data.name && data.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }
  
  if (data.phone) {
    // Basic Pakistani phone number validation
    const phoneRegex = /^(\+92|0)?[0-9]{10}$/;
    if (!phoneRegex.test(data.phone.replace(/[-\s]/g, ''))) {
      errors.push('Invalid phone number format');
    }
  }
  
  if (data.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push('Invalid email format');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
