/**
 * Action Detection Utilities
 * 
 * Detects items that need attention and prioritizes them.
 * 
 * ACTION TYPES:
 * 1. Overdue Follow-ups - CRM tasks past due date
 * 2. Stale Leads - Leads not contacted in 7+ days
 * 3. Inactive Properties - Properties without active cycles
 * 4. Expiring Offers - Offers expiring in next 48 hours
 * 5. Upcoming Appointments - Meetings in next 24 hours
 * 
 * PRIORITY LEVELS:
 * - critical (red) - Overdue, urgent action required
 * - high (orange) - Needs attention today
 * - medium (yellow) - Should handle soon
 * - low (blue) - Can wait, but good to handle
 */

import { SellCycle, Property, Contact } from '../../../types';
import { LeadV4 } from '../../../types/leads';
import { TaskV4 } from '../../../types/tasks';

export type ActionPriority = 'critical' | 'high' | 'medium' | 'low';
export type ActionType = 
  | 'overdue-task'
  | 'stale-lead'
  | 'inactive-property'
  | 'expiring-offer'
  | 'upcoming-appointment'
  | 'new-lead';

export interface DashboardAction {
  id: string;
  type: ActionType;
  priority: ActionPriority;
  title: string;
  description: string;
  timestamp: string;
  daysOverdue?: number;
  entityId: string;
  entityType: 'task' | 'lead' | 'property' | 'offer' | 'appointment';
  actionLabel: string; // "Complete", "View", "Follow Up", etc.
  actionRoute: string; // Navigation route
}

/**
 * Calculate days between two dates
 */
function daysBetween(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Detect overdue CRM tasks
 */
export function detectOverdueTasks(tasks: TaskV4[]): DashboardAction[] {
  const now = new Date();
  const actions: DashboardAction[] = [];

  tasks.forEach(task => {
    // Skip completed tasks
    if (task.status === 'completed') return;

    const dueDate = new Date(task.dueDate);
    if (dueDate < now) {
      const daysOverdue = daysBetween(dueDate, now);
      
      let priority: ActionPriority = 'high';
      if (daysOverdue > 3) priority = 'critical';
      else if (daysOverdue > 1) priority = 'high';
      else priority = 'medium';

      actions.push({
        id: `task-${task.id}`,
        type: 'overdue-task',
        priority,
        title: `Overdue: ${task.title}`,
        description: task.description || 'Task is overdue',
        timestamp: task.dueDate,
        daysOverdue,
        entityId: task.id,
        entityType: 'task',
        actionLabel: 'Complete',
        actionRoute: `contacts/${task.contactId}`,
      });
    }
  });

  return actions;
}

/**
 * Detect stale leads (not contacted in 7+ days)
 */
export function detectStaleLeads(leads: LeadV4[]): DashboardAction[] {
  const now = new Date();
  const actions: DashboardAction[] = [];

  leads.forEach(lead => {
    // Only check active leads (not converted, lost, or archived)
    if (['converted', 'lost', 'archived'].includes(lead.status)) return;

    // Check last interaction
    const lastInteraction = lead.interactions && lead.interactions.length > 0
      ? lead.interactions[lead.interactions.length - 1]
      : null;

    const lastContactDate = lastInteraction 
      ? new Date(lastInteraction.timestamp)
      : new Date(lead.createdAt);

    const daysSinceContact = daysBetween(lastContactDate, now);

    // Stale if no contact in 7+ days for new leads, 14+ days for qualifying
    const staleThreshold = lead.status === 'new' ? 7 : 14;

    if (daysSinceContact >= staleThreshold) {
      let priority: ActionPriority = 'medium';
      if (daysSinceContact > 21) priority = 'critical';
      else if (daysSinceContact > 14) priority = 'high';

      actions.push({
        id: `lead-${lead.id}`,
        type: 'stale-lead',
        priority,
        title: `Stale Lead: ${lead.name}`,
        description: `No contact in ${daysSinceContact} days`,
        timestamp: lastContactDate.toISOString(),
        daysOverdue: daysSinceContact,
        entityId: lead.id,
        entityType: 'lead',
        actionLabel: 'Follow Up',
        actionRoute: `leads/${lead.id}`,
      });
    }
  });

  return actions;
}

/**
 * Detect inactive properties (no active cycles)
 */
export function detectInactiveProperties(
  properties: Property[],
  sellCycles: SellCycle[]
): DashboardAction[] {
  const actions: DashboardAction[] = [];
  const now = new Date();

  // Build a map of properties with active cycles
  const propertiesWithActiveCycles = new Set<string>();
  sellCycles.forEach(cycle => {
    if (['listed', 'offer-received', 'under-contract'].includes(cycle.status)) {
      propertiesWithActiveCycles.add(cycle.propertyId);
    }
  });

  properties.forEach(property => {
    // Only check available properties
    if (property.status !== 'available') return;

    // Skip if already has active cycle
    if (propertiesWithActiveCycles.has(property.id)) return;

    // Calculate days since property was created
    const createdDate = new Date(property.createdAt);
    const daysInactive = daysBetween(createdDate, now);

    // Flag if inactive for 7+ days
    if (daysInactive >= 7) {
      let priority: ActionPriority = 'low';
      if (daysInactive > 30) priority = 'medium';
      if (daysInactive > 60) priority = 'high';

      actions.push({
        id: `property-${property.id}`,
        type: 'inactive-property',
        priority,
        title: `Inactive: ${property.address || 'Property'}`,
        description: `No active sell cycle for ${daysInactive} days`,
        timestamp: property.createdAt,
        daysOverdue: daysInactive,
        entityId: property.id,
        entityType: 'property',
        actionLabel: 'Create Cycle',
        actionRoute: `properties/${property.id}`,
      });
    }
  });

  return actions;
}

/**
 * Detect expiring offers (expires in next 48 hours)
 */
export function detectExpiringOffers(sellCycles: SellCycle[]): DashboardAction[] {
  const actions: DashboardAction[] = [];
  const now = new Date();
  const next48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  sellCycles.forEach(cycle => {
    // Only check active cycles with offers
    if (!['listed', 'offer-received'].includes(cycle.status)) return;
    if (!cycle.offers || cycle.offers.length === 0) return;

    cycle.offers.forEach(offer => {
      // Skip accepted/rejected offers
      if (['accepted', 'rejected', 'withdrawn'].includes(offer.status)) return;

      // Check if offer has expiration
      if (!offer.expiresAt) return;

      const expiresAt = new Date(offer.expiresAt);
      
      // Check if expires in next 48 hours
      if (expiresAt <= next48Hours && expiresAt > now) {
        const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        let priority: ActionPriority = 'high';
        if (hoursUntilExpiry < 24) priority = 'critical';

        actions.push({
          id: `offer-${offer.id}`,
          type: 'expiring-offer',
          priority,
          title: `Expiring: Offer on ${cycle.propertyAddress || 'Property'}`,
          description: `Expires in ${Math.round(hoursUntilExpiry)} hours`,
          timestamp: offer.expiresAt,
          entityId: offer.id,
          entityType: 'offer',
          actionLabel: 'Review',
          actionRoute: `sell-cycles/${cycle.id}`,
        });
      }
    });
  });

  return actions;
}

/**
 * Detect upcoming appointments (next 24 hours)
 */
export function detectUpcomingAppointments(tasks: TaskV4[]): DashboardAction[] {
  const actions: DashboardAction[] = [];
  const now = new Date();
  const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  tasks.forEach(task => {
    // Skip completed tasks
    if (task.status === 'completed') return;

    // Only check meeting/call types
    if (!['meeting', 'call', 'site-visit'].includes(task.type)) return;

    const dueDate = new Date(task.dueDate);
    
    // Check if due in next 24 hours
    if (dueDate >= now && dueDate <= next24Hours) {
      const hoursUntil = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      let priority: ActionPriority = 'medium';
      if (hoursUntil < 2) priority = 'high';
      
      actions.push({
        id: `appointment-${task.id}`,
        type: 'upcoming-appointment',
        priority,
        title: `Upcoming: ${task.title}`,
        description: `In ${Math.round(hoursUntil)} hours`,
        timestamp: task.dueDate,
        entityId: task.id,
        entityType: 'appointment',
        actionLabel: 'Prepare',
        actionRoute: `contacts/${task.contactId}`,
      });
    }
  });

  return actions;
}

/**
 * Detect new leads (created in last 24 hours, not yet contacted)
 */
export function detectNewLeads(leads: LeadV4[]): DashboardAction[] {
  const actions: DashboardAction[] = [];
  const now = new Date();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  leads.forEach(lead => {
    // Only check new leads
    if (lead.status !== 'new') return;

    const createdDate = new Date(lead.createdAt);
    
    // Check if created in last 24 hours
    if (createdDate >= last24Hours) {
      // Check if first contact made
      const hasContact = lead.sla?.firstContactAt !== undefined;
      
      if (!hasContact) {
        const hoursOld = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
        
        let priority: ActionPriority = 'high';
        if (hoursOld > 2) priority = 'critical'; // SLA breach
        
        actions.push({
          id: `new-lead-${lead.id}`,
          type: 'new-lead',
          priority,
          title: `New Lead: ${lead.name}`,
          description: `Received ${Math.round(hoursOld)} hours ago`,
          timestamp: lead.createdAt,
          entityId: lead.id,
          entityType: 'lead',
          actionLabel: 'Contact',
          actionRoute: `leads/${lead.id}`,
        });
      }
    }
  });

  return actions;
}

/**
 * Priority scoring for sorting
 */
function getPriorityScore(priority: ActionPriority): number {
  switch (priority) {
    case 'critical': return 4;
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
    default: return 0;
  }
}

/**
 * Detect all actions and return sorted by priority
 */
export function detectAllActions(
  tasks: TaskV4[],
  leads: LeadV4[],
  properties: Property[],
  sellCycles: SellCycle[]
): DashboardAction[] {
  const allActions: DashboardAction[] = [
    ...detectOverdueTasks(tasks),
    ...detectStaleLeads(leads),
    ...detectInactiveProperties(properties, sellCycles),
    ...detectExpiringOffers(sellCycles),
    ...detectUpcomingAppointments(tasks),
    ...detectNewLeads(leads),
  ];

  // Sort by priority (critical first), then by timestamp (oldest first)
  allActions.sort((a, b) => {
    const priorityDiff = getPriorityScore(b.priority) - getPriorityScore(a.priority);
    if (priorityDiff !== 0) return priorityDiff;
    
    // Same priority - sort by timestamp (oldest first)
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });

  return allActions;
}

/**
 * Get action summary counts
 */
export function getActionSummary(actions: DashboardAction[]) {
  return {
    total: actions.length,
    critical: actions.filter(a => a.priority === 'critical').length,
    high: actions.filter(a => a.priority === 'high').length,
    medium: actions.filter(a => a.priority === 'medium').length,
    low: actions.filter(a => a.priority === 'low').length,
    byType: {
      overdueTasks: actions.filter(a => a.type === 'overdue-task').length,
      staleLeads: actions.filter(a => a.type === 'stale-lead').length,
      inactiveProperties: actions.filter(a => a.type === 'inactive-property').length,
      expiringOffers: actions.filter(a => a.type === 'expiring-offer').length,
      upcomingAppointments: actions.filter(a => a.type === 'upcoming-appointment').length,
      newLeads: actions.filter(a => a.type === 'new-lead').length,
    },
  };
}