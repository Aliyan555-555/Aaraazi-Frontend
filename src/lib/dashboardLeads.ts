/**
 * Leads Data Access Layer
 * 
 * Wrapper around the leads.ts file to provide consistent API for
 * dashboard and other current components.
 * 
 * This file maps the old Lead type to DashboardLead type and provides
 * role-based filtering.
 */

import { Lead } from '../types';
import { DashboardLead } from '../types/leads';
import { getLeads } from './leads';

/**
 * Get all Leads with role-based filtering
 * 
 * @param userId - User ID (optional, for filtering)
 * @param userRole - User role (admin or agent)
 * @returns Array of DashboardLead objects
 */
export function getDashboardLeads(userId?: string, userRole?: string): DashboardLead[] {
  // Get all leads from the old system
  const allLeads = getLeads();
  
  // Filter by user role
  let filteredLeads = allLeads;
  
  if (userRole === 'agent' && userId) {
    // Agents see only their own leads
    filteredLeads = allLeads.filter(lead => lead.agentId === userId);
  }
  // Admins see all leads
  
  // Map old Lead type to new DashboardLead type
  return filteredLeads.map(lead => mapLeadToDashboardLead(lead));
}

/**
 * Get a single lead by ID
 */
export function getDashboardLeadById(leadId: string): DashboardLead | undefined {
  const allLeads = getLeads();
  const lead = allLeads.find(l => l.id === leadId);
  
  if (!lead) return undefined;
  
  return mapLeadToDashboardLead(lead);
}

/**
 * Map old Lead type to new DashboardLead type
 * 
 * This function bridges the gap between the old and new lead types.
 * The DashboardLead type has more fields and different structure.
 */
function mapLeadToDashboardLead(lead: Lead): DashboardLead {
  // Map the old lead to the new DashboardLead structure
  const dashboardLead: DashboardLead = {
    // Core fields
    id: lead.id,
    contactId: lead.contactId || '', // May not exist in old leads
    agentId: lead.agentId,
    
    // Status and stage
    stage: mapStatusToStage(lead.status),
    priority: lead.priority || 'medium',
    
    // Property interest (if exists)
    propertyId: lead.propertyId,
    
    // Source and intent
    source: lead.source || 'direct',
    intent: mapStatusToIntent(lead.status),
    
    // Budget/requirements (may not exist in old leads)
    budgetMin: (lead as any).budgetMin,
    budgetMax: (lead as any).budgetMax,
    preferredLocations: (lead as any).preferredLocations || [],
    propertyType: (lead as any).propertyType,
    
    // Communication
    lastContactDate: lead.lastContactDate,
    nextFollowUpDate: lead.nextFollowUpDate,
    
    // Timestamps
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt || lead.createdAt,
    
    // Activity tracking
    lastActivityDate: lead.lastContactDate,
    
    // Conversion status
    conversionStatus: mapStatusToConversionStatus(lead.status),
    convertedToContactId: lead.contactId,
    
    // Additional fields that may exist
    tags: (lead as any).tags || [],
    notes: lead.notes || '',
  };
  
  return dashboardLead;
}

/**
 * Map old lead status to new stage
 */
function mapStatusToStage(status: string): DashboardLead['stage'] {
  switch (status) {
    case 'new':
      return 'new';
    case 'contacted':
      return 'contacted';
    case 'qualified':
      return 'qualified';
    case 'negotiation':
      return 'negotiation';
    case 'proposal':
      return 'proposal';
    case 'closed-won':
      return 'closed-won';
    case 'closed-lost':
      return 'closed-lost';
    case 'disqualified':
      return 'disqualified';
    default:
      return 'new';
  }
}

/**
 * Map status to intent
 */
function mapStatusToIntent(status: string): DashboardLead['intent'] {
  if (status === 'closed-won' || status === 'negotiation') {
    return 'buy';
  }
  return 'buy'; // Default
}

/**
 * Map status to conversion status
 */
function mapStatusToConversionStatus(status: string): DashboardLead['conversionStatus'] {
  if (status === 'closed-won') {
    return 'converted';
  }
  if (status === 'closed-lost' || status === 'disqualified') {
    return 'lost';
  }
  return 'pending';
}
