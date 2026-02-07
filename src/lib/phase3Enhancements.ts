/**
 * Phase 3 Enhancement Functions
 * Property Management, Commission Management, and Lead Management improvements
 */

import { Property, Lead, Commission, CommissionSplit, Interaction, LeadScore } from '../types';

// ============================================================================
// PROPERTY MANAGEMENT ENHANCEMENTS
// ============================================================================

/**
 * Calculate days on market for a property
 */
export function calculateDaysOnMarket(property: Property): number {
  const listedDate = property.listedDate || property.createdAt;
  const endDate = property.soldDate || new Date().toISOString();
  const start = new Date(listedDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Increment property view count
 */
export function incrementPropertyViews(propertyId: string): void {
  try {
    const stored = localStorage.getItem('estate_properties');
    if (!stored) return;
    
    const properties: Property[] = JSON.parse(stored);
    const propertyIndex = properties.findIndex(p => p.id === propertyId);
    
    if (propertyIndex !== -1) {
      properties[propertyIndex].viewCount = (properties[propertyIndex].viewCount || 0) + 1;
      properties[propertyIndex].lastViewedAt = new Date().toISOString();
      localStorage.setItem('estate_properties', JSON.stringify(properties));
      
      // Dispatch event for real-time updates
      window.dispatchEvent(new CustomEvent('propertyViewUpdated', { 
        detail: { propertyId, viewCount: properties[propertyIndex].viewCount } 
      }));
    }
  } catch (error) {
    console.error('Error incrementing property views:', error);
  }
}

/**
 * Duplicate a property
 */
export function duplicateProperty(
  propertyId: string, 
  userId: string, 
  userName: string
): Property | null {
  try {
    const stored = localStorage.getItem('estate_properties');
    if (!stored) return null;
    
    const properties: Property[] = JSON.parse(stored);
    const originalProperty = properties.find(p => p.id === propertyId);
    
    if (!originalProperty) return null;
    
    const newProperty: Property = {
      ...originalProperty,
      id: `prop-${Date.now()}`,
      title: `${originalProperty.title} (Copy)`,
      status: 'available',
      isPublished: false,
      agentId: userId,
      agentName: userName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      listedDate: new Date().toISOString(),
      soldDate: undefined,
      viewCount: 0,
      lastViewedAt: undefined,
      // Reset sale-specific fields
      finalSalePrice: undefined,
      commissionEarned: undefined
    };
    
    properties.push(newProperty);
    localStorage.setItem('estate_properties', JSON.stringify(properties));
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('propertyDuplicated', { 
      detail: { originalId: propertyId, newId: newProperty.id } 
    }));
    
    return newProperty;
  } catch (error) {
    console.error('Error duplicating property:', error);
    return null;
  }
}

/**
 * Check if a property is featured (not expired)
 */
export function isPropertyFeatured(property: Property): boolean {
  if (!property.featuredUntil) return false;
  const now = new Date();
  const featuredUntil = new Date(property.featuredUntil);
  return now < featuredUntil;
}

/**
 * Check if a property listing has expired
 */
export function isPropertyExpired(property: Property): boolean {
  if (!property.expiryDate) return false;
  const now = new Date();
  const expiryDate = new Date(property.expiryDate);
  return now > expiryDate;
}

/**
 * Get properties that will expire soon (within days threshold)
 */
export function getExpiringSoonProperties(properties: Property[], daysThreshold: number = 7): Property[] {
  const now = new Date();
  const thresholdDate = new Date(now.getTime() + (daysThreshold * 24 * 60 * 60 * 1000));
  
  return properties.filter(property => {
    if (!property.expiryDate) return false;
    const expiryDate = new Date(property.expiryDate);
    return expiryDate > now && expiryDate <= thresholdDate;
  });
}

// ============================================================================
// COMMISSION MANAGEMENT ENHANCEMENTS
// ============================================================================

/**
 * Create commission with splits for team deals
 */
export function createCommissionWithSplits(
  propertyId: string,
  propertyTitle: string,
  totalAmount: number,
  splits: Array<{ agentId: string; agentName: string; percentage: number }>,
  payoutTrigger: Commission['payoutTrigger'] = 'full-payment'
): Commission[] {
  const commissions: Commission[] = [];
  const now = new Date().toISOString();
  
  splits.forEach(split => {
    const splitAmount = (totalAmount * split.percentage) / 100;
    
    const commission: Commission = {
      id: `comm-${Date.now()}-${split.agentId}`,
      agentId: split.agentId,
      agentName: split.agentName,
      propertyId: propertyId,
      propertyTitle: propertyTitle,
      amount: splitAmount,
      rate: split.percentage,
      status: 'pending',
      payoutTrigger: payoutTrigger,
      createdAt: now,
      isSplit: true,
      totalAmount: totalAmount,
      approvalStatus: 'pending-approval',
      dueDate: calculateCommissionDueDate(payoutTrigger)
    };
    
    commissions.push(commission);
  });
  
  // Save to localStorage
  try {
    const stored = localStorage.getItem('estate_commissions');
    const existingCommissions: Commission[] = stored ? JSON.parse(stored) : [];
    const updatedCommissions = [...existingCommissions, ...commissions];
    localStorage.setItem('estate_commissions', JSON.stringify(updatedCommissions));
  } catch (error) {
    console.error('Error saving commission splits:', error);
  }
  
  return commissions;
}

/**
 * Create a single commission for a property sale
 */
export function createSingleCommission(
  propertyId: string,
  propertyTitle: string,
  saleAmount: number,
  commissionRate: number,
  agentId: string,
  agentName: string,
  payoutTrigger: Commission['payoutTrigger'] = 'full-payment'
): Commission | null {
  try {
    const commissionAmount = (saleAmount * commissionRate) / 100;
    const now = new Date().toISOString();
    
    const commission: Commission = {
      id: `comm-${Date.now()}`,
      agentId: agentId,
      agentName: agentName,
      propertyId: propertyId,
      propertyTitle: propertyTitle,
      amount: commissionAmount,
      rate: commissionRate,
      status: 'pending',
      payoutTrigger: payoutTrigger,
      createdAt: now,
      isSplit: false,
      approvalStatus: 'pending-approval',
      dueDate: calculateCommissionDueDate(payoutTrigger)
    };
    
    // Save to localStorage
    const stored = localStorage.getItem('estate_commissions');
    const commissions: Commission[] = stored ? JSON.parse(stored) : [];
    commissions.push(commission);
    localStorage.setItem('estate_commissions', JSON.stringify(commissions));
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('commissionCreated', { 
      detail: { commissionId: commission.id } 
    }));
    
    return commission;
  } catch (error) {
    console.error('Error creating commission:', error);
    return null;
  }
}

/**
 * Calculate commission due date based on payout trigger
 */
function calculateCommissionDueDate(trigger: Commission['payoutTrigger']): string {
  const now = new Date();
  let daysToAdd = 30; // Default 30 days
  
  switch (trigger) {
    case 'booking':
      daysToAdd = 7; // Due in 7 days
      break;
    case '50-percent':
      daysToAdd = 14; // Due in 14 days
      break;
    case 'possession':
      daysToAdd = 30; // Due in 30 days
      break;
    case 'full-payment':
      daysToAdd = 7; // Due in 7 days after full payment
      break;
  }
  
  const dueDate = new Date(now.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
  return dueDate.toISOString();
}

/**
 * Approve a commission
 */
export function approveCommission(
  commissionId: string, 
  approvedBy: string
): boolean {
  try {
    const stored = localStorage.getItem('estate_commissions');
    if (!stored) return false;
    
    const commissions: Commission[] = JSON.parse(stored);
    const commissionIndex = commissions.findIndex(c => c.id === commissionId);
    
    if (commissionIndex === -1) return false;
    
    commissions[commissionIndex].approvalStatus = 'approved';
    commissions[commissionIndex].approvedBy = approvedBy;
    commissions[commissionIndex].approvedAt = new Date().toISOString();
    
    localStorage.setItem('estate_commissions', JSON.stringify(commissions));
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('commissionApproved', { 
      detail: { commissionId } 
    }));
    
    return true;
  } catch (error) {
    console.error('Error approving commission:', error);
    return false;
  }
}

/**
 * Reject a commission
 */
export function rejectCommission(
  commissionId: string, 
  reason: string
): boolean {
  try {
    const stored = localStorage.getItem('estate_commissions');
    if (!stored) return false;
    
    const commissions: Commission[] = JSON.parse(stored);
    const commissionIndex = commissions.findIndex(c => c.id === commissionId);
    
    if (commissionIndex === -1) return false;
    
    commissions[commissionIndex].approvalStatus = 'rejected';
    commissions[commissionIndex].rejectionReason = reason;
    
    localStorage.setItem('estate_commissions', JSON.stringify(commissions));
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('commissionRejected', { 
      detail: { commissionId, reason } 
    }));
    
    return true;
  } catch (error) {
    console.error('Error rejecting commission:', error);
    return false;
  }
}

/**
 * Override commission amount
 */
export function overrideCommission(
  commissionId: string,
  newAmount: number,
  reason: string,
  overriddenBy: string
): boolean {
  try {
    const stored = localStorage.getItem('estate_commissions');
    if (!stored) return false;
    
    const commissions: Commission[] = JSON.parse(stored);
    const commissionIndex = commissions.findIndex(c => c.id === commissionId);
    
    if (commissionIndex === -1) return false;
    
    commissions[commissionIndex].overrideAmount = newAmount;
    commissions[commissionIndex].overrideReason = reason;
    commissions[commissionIndex].overriddenBy = overriddenBy;
    commissions[commissionIndex].overriddenAt = new Date().toISOString();
    commissions[commissionIndex].amount = newAmount; // Update actual amount
    
    localStorage.setItem('estate_commissions', JSON.stringify(commissions));
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('commissionOverridden', { 
      detail: { commissionId, newAmount, reason } 
    }));
    
    return true;
  } catch (error) {
    console.error('Error overriding commission:', error);
    return false;
  }
}

/**
 * Check if commission is overdue
 */
export function updateOverdueCommissions(): number {
  try {
    const stored = localStorage.getItem('estate_commissions');
    if (!stored) return 0;
    
    const commissions: Commission[] = JSON.parse(stored);
    const now = new Date();
    let updatedCount = 0;
    
    commissions.forEach(commission => {
      if (commission.status === 'pending' && commission.dueDate) {
        const dueDate = new Date(commission.dueDate);
        const wasOverdue = commission.isOverdue;
        commission.isOverdue = now > dueDate;
        
        if (!wasOverdue && commission.isOverdue) {
          updatedCount++;
        }
      }
    });
    
    if (updatedCount > 0) {
      localStorage.setItem('estate_commissions', JSON.stringify(commissions));
    }
    
    return updatedCount;
  } catch (error) {
    console.error('Error updating overdue commissions:', error);
    return 0;
  }
}

/**
 * Get Year-to-Date commission summary for an agent
 */
export function getYTDCommissionSummary(agentId: string): {
  totalCommissions: number;
  paidCommissions: number;
  pendingCommissions: number;
  count: number;
  paidCount: number;
  pendingCount: number;
  averageCommissionRate: number;
} {
  try {
    const stored = localStorage.getItem('estate_commissions');
    if (!stored) return {
      totalCommissions: 0,
      paidCommissions: 0,
      pendingCommissions: 0,
      count: 0,
      paidCount: 0,
      pendingCount: 0,
      averageCommissionRate: 0
    };
    
    const commissions: Commission[] = JSON.parse(stored);
    const currentYear = new Date().getFullYear();
    
    const ytdCommissions = commissions.filter(c => {
      const year = new Date(c.createdAt).getFullYear();
      return year === currentYear && c.agentId === agentId;
    });
    
    const paidCommissions = ytdCommissions.filter(c => c.status === 'paid');
    const pendingCommissions = ytdCommissions.filter(c => c.status === 'pending');
    
    const totalAmount = ytdCommissions.reduce((sum, c) => sum + c.amount, 0);
    const paidAmount = paidCommissions.reduce((sum, c) => sum + c.amount, 0);
    const pendingAmount = pendingCommissions.reduce((sum, c) => sum + c.amount, 0);
    
    const averageRate = ytdCommissions.length > 0
      ? ytdCommissions.reduce((sum, c) => sum + c.rate, 0) / ytdCommissions.length
      : 0;
    
    return {
      totalCommissions: totalAmount,
      paidCommissions: paidAmount,
      pendingCommissions: pendingAmount,
      count: ytdCommissions.length,
      paidCount: paidCommissions.length,
      pendingCount: pendingCommissions.length,
      averageCommissionRate: averageRate
    };
  } catch (error) {
    console.error('Error getting YTD commission summary:', error);
    return {
      totalCommissions: 0,
      paidCommissions: 0,
      pendingCommissions: 0,
      count: 0,
      paidCount: 0,
      pendingCount: 0,
      averageCommissionRate: 0
    };
  }
}

// ============================================================================
// LEAD MANAGEMENT ENHANCEMENTS
// ============================================================================

/**
 * Check for duplicate leads by phone and email
 */
export function checkLeadDuplicates(
  phone: string,
  email?: string,
  excludeLeadId?: string
): Lead[] {
  try {
    const stored = localStorage.getItem('estate_leads');
    if (!stored) return [];
    
    const allLeads: Lead[] = JSON.parse(stored);
    
    return allLeads.filter(lead => {
      if (excludeLeadId && lead.id === excludeLeadId) return false;
      
      const phoneMatch = lead.phone === phone;
      const emailMatch = email && lead.email && 
        lead.email.toLowerCase() === email.toLowerCase();
      
      return phoneMatch || emailMatch;
    });
  } catch (error) {
    console.error('Error checking lead duplicates:', error);
    return [];
  }
}

/**
 * Calculate lead score based on various factors
 */
export function calculateLeadScore(
  lead: Lead,
  interactions: Interaction[],
  properties: Property[]
): LeadScore {
  const factors = {
    responseTime: calculateResponseTimeScore(lead, interactions),
    interestedPropertiesCount: calculateInterestScore(lead),
    budgetAlignment: calculateBudgetScore(lead, properties),
    urgency: calculateUrgencyScore(lead, interactions),
    engagement: calculateEngagementScore(interactions.filter(i => {
      // Find interactions for this lead (match by lead converted to contact)
      return i.contactId === lead.id || i.contactId === `contact_${lead.id}`;
    }))
  };

  // Weighted score calculation
  const score = Math.round(
    (factors.responseTime * 0.2) +
    (factors.interestedPropertiesCount * 0.25) +
    (factors.budgetAlignment * 0.2) +
    (factors.urgency * 0.15) +
    (factors.engagement * 0.2)
  );

  const rating: 'cold' | 'warm' | 'hot' = 
    score >= 75 ? 'hot' :
    score >= 50 ? 'warm' : 'cold';

  return {
    score,
    rating,
    factors
  };
}

function calculateResponseTimeScore(lead: Lead, interactions: Interaction[]): number {
  const leadInteractions = interactions.filter(i => 
    i.contactId === lead.id || i.contactId === `contact_${lead.id}`
  );
  
  if (leadInteractions.length === 0) return 0;

  const firstInteraction = leadInteractions.sort((a, b) => 
    new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
  )[0];

  const leadCreated = new Date(lead.createdAt).getTime();
  const firstContact = new Date(firstInteraction.completedAt).getTime();
  const hoursToContact = (firstContact - leadCreated) / (1000 * 60 * 60);

  if (hoursToContact <= 1) return 100;
  if (hoursToContact <= 2) return 80;
  if (hoursToContact <= 24) return 50;
  return 20;
}

function calculateInterestScore(lead: Lead): number {
  const interestedCount = lead.interestedProperties?.length || 0;
  if (interestedCount === 0) return 0;
  if (interestedCount === 1) return 60;
  if (interestedCount === 2) return 80;
  return 100;
}

function calculateBudgetScore(lead: Lead, properties: Property[]): number {
  // Simplified - can be enhanced with actual budget tracking
  return 75; // Default good alignment
}

function calculateUrgencyScore(lead: Lead, interactions: Interaction[]): number {
  const leadInteractions = interactions.filter(i => 
    i.contactId === lead.id || i.contactId === `contact_${lead.id}`
  );
  
  const recentInteractions = leadInteractions.filter(i => {
    const daysSince = (Date.now() - new Date(i.completedAt).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 7;
  });

  if (recentInteractions.length >= 3) return 100;
  if (recentInteractions.length >= 2) return 75;
  if (recentInteractions.length >= 1) return 50;
  return 25;
}

function calculateEngagementScore(interactions: Interaction[]): number {
  if (interactions.length === 0) return 0;
  
  const successfulInteractions = interactions.filter(
    i => i.outcome === 'successful'
  ).length;
  
  const engagementRate = (successfulInteractions / interactions.length) * 100;
  return Math.round(engagementRate);
}

/**
 * Save lead score
 */
export function saveLeadScore(leadId: string, score: LeadScore): void {
  try {
    const stored = localStorage.getItem('estate_leads');
    if (!stored) return;
    
    const leads: Lead[] = JSON.parse(stored);
    const leadIndex = leads.findIndex(l => l.id === leadId);
    
    if (leadIndex !== -1) {
      leads[leadIndex].leadScore = score;
      leads[leadIndex].lastScoredAt = new Date().toISOString();
      localStorage.setItem('estate_leads', JSON.stringify(leads));
      
      // Dispatch event
      window.dispatchEvent(new CustomEvent('leadScoreUpdated', { 
        detail: { leadId, score } 
      }));
    }
  } catch (error) {
    console.error('Error saving lead score:', error);
  }
}

/**
 * Get lead score from storage
 */
export function getLeadScore(leadId: string): LeadScore | null {
  try {
    const stored = localStorage.getItem('estate_leads');
    if (!stored) return null;
    
    const leads: Lead[] = JSON.parse(stored);
    const lead = leads.find(l => l.id === leadId);
    
    return lead?.leadScore || null;
  } catch (error) {
    console.error('Error getting lead score:', error);
    return null;
  }
}

/**
 * Get hot leads (score >= 75)
 */
export function getHotLeads(agentId?: string, userRole?: string): Lead[] {
  try {
    const stored = localStorage.getItem('estate_leads');
    if (!stored) return [];
    
    const allLeads: Lead[] = JSON.parse(stored);
    
    let filteredLeads = allLeads;
    if (userRole !== 'admin' && agentId) {
      filteredLeads = allLeads.filter(l => l.agentId === agentId);
    }
    
    return filteredLeads.filter(lead => {
      const score = lead.leadScore?.score || 0;
      return score >= 75 && lead.status !== 'converted' && lead.status !== 'not-interested';
    });
  } catch (error) {
    console.error('Error getting hot leads:', error);
    return [];
  }
}

/**
 * Bulk update lead scores
 */
export function bulkUpdateLeadScores(
  leads: Lead[],
  interactions: Interaction[],
  properties: Property[]
): number {
  let updatedCount = 0;
  
  leads.forEach(lead => {
    const score = calculateLeadScore(lead, interactions, properties);
    saveLeadScore(lead.id, score);
    updatedCount++;
  });
  
  return updatedCount;
}

// ============================================================================
// FOLLOW-UP AUTOMATION & TEMPLATES
// ============================================================================

export interface FollowUpTemplate {
  id: string;
  name: string;
  category: 'initial-contact' | 'follow-up' | 'offer-response' | 'negotiation' | 'closing' | 'post-sale';
  channel: 'email' | 'sms' | 'call' | 'whatsapp';
  subject?: string; // For emails
  body: string;
  variables: string[]; // e.g., ['leadName', 'propertyTitle', 'agentName']
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FollowUpRule {
  id: string;
  name: string;
  trigger: 'status-change' | 'time-based' | 'score-change' | 'manual';
  conditions: {
    fromStatus?: string;
    toStatus?: string;
    daysAfter?: number;
    scoreThreshold?: number;
  };
  actions: {
    createTask: boolean;
    sendTemplate?: string; // Template ID
    taskPriority: 'low' | 'medium' | 'high';
    taskTitle: string;
    taskDescription: string;
    daysUntilDue: number;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FollowUpTask {
  id: string;
  leadId: string;
  leadName: string;
  propertyId?: string;
  propertyTitle?: string;
  agentId: string;
  agentName: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  status: 'pending' | 'completed' | 'overdue';
  templateId?: string;
  ruleId?: string;
  createdBy: 'system' | 'manual';
  createdAt: string;
  completedAt?: string;
}

/**
 * Get default communication templates
 */
export function getDefaultTemplates(): FollowUpTemplate[] {
  return [
    {
      id: 'tpl-initial-1',
      name: 'Initial Contact - General Inquiry',
      category: 'initial-contact',
      channel: 'email',
      subject: 'Thank you for your interest in {{propertyTitle}}',
      body: `Dear {{leadName}},

Thank you for your interest in {{propertyTitle}}. I'm {{agentName}}, and I'll be happy to assist you.

The property is located in {{propertyAddress}} and is available for {{propertyType}}. The asking price is {{propertyPrice}}.

I'd love to schedule a viewing at your convenience. Please let me know your preferred date and time.

Best regards,
{{agentName}}
{{agencyName}}`,
      variables: ['leadName', 'propertyTitle', 'agentName', 'propertyAddress', 'propertyType', 'propertyPrice', 'agencyName'],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'tpl-followup-1',
      name: 'Follow-up - After 3 Days',
      category: 'follow-up',
      channel: 'sms',
      body: `Hi {{leadName}}, this is {{agentName}}. Just following up on the property at {{propertyAddress}}. Still interested? Let me know if you'd like to schedule a viewing. Thanks!`,
      variables: ['leadName', 'agentName', 'propertyAddress'],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'tpl-offer-1',
      name: 'Offer Response - Counteroffer',
      category: 'offer-response',
      channel: 'email',
      subject: 'Re: Your offer for {{propertyTitle}}',
      body: `Dear {{leadName}},

Thank you for your offer of {{offerAmount}} for {{propertyTitle}}.

After discussing with the owner, we'd like to propose a counteroffer of {{counterAmount}}. This reflects the property's excellent location and recent market trends.

The owner is motivated to close quickly and can be flexible on the possession date.

Please let me know your thoughts.

Best regards,
{{agentName}}`,
      variables: ['leadName', 'propertyTitle', 'offerAmount', 'counterAmount', 'agentName'],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'tpl-negotiation-1',
      name: 'Negotiation - Price Discussion',
      category: 'negotiation',
      channel: 'call',
      body: `CALL SCRIPT:
1. Greet: "Hi {{leadName}}, this is {{agentName}} from {{agencyName}}"
2. Reference: "I wanted to discuss your interest in {{propertyTitle}}"
3. Listen: Ask about their budget and requirements
4. Present: Highlight property value and comparable sales
5. Negotiate: Find middle ground between {{currentOffer}} and asking price
6. Close: Schedule next steps or final decision timeline`,
      variables: ['leadName', 'agentName', 'agencyName', 'propertyTitle', 'currentOffer'],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'tpl-closing-1',
      name: 'Closing - Final Steps',
      category: 'closing',
      channel: 'email',
      subject: 'Final steps for {{propertyTitle}} purchase',
      body: `Dear {{leadName}},

Congratulations on your decision to proceed with {{propertyTitle}}!

Here are the next steps:
1. Sign the sale agreement (attached)
2. Transfer token amount: {{tokenAmount}}
3. Schedule documentation verification
4. Final payment and possession

Please review the attached documents and let me know if you have any questions.

Looking forward to completing this transaction!

Best regards,
{{agentName}}`,
      variables: ['leadName', 'propertyTitle', 'tokenAmount', 'agentName'],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}

/**
 * Get default follow-up rules
 */
export function getDefaultFollowUpRules(): FollowUpRule[] {
  return [
    {
      id: 'rule-new-lead',
      name: 'New Lead - Initial Contact',
      trigger: 'status-change',
      conditions: {
        toStatus: 'new'
      },
      actions: {
        createTask: true,
        sendTemplate: 'tpl-initial-1',
        taskPriority: 'high',
        taskTitle: 'Contact new lead: {{leadName}}',
        taskDescription: 'Reach out to new lead within 1 hour. Send initial contact email and schedule call.',
        daysUntilDue: 0
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'rule-contacted-followup',
      name: 'Contacted - Follow-up in 3 Days',
      trigger: 'status-change',
      conditions: {
        toStatus: 'contacted'
      },
      actions: {
        createTask: true,
        sendTemplate: 'tpl-followup-1',
        taskPriority: 'medium',
        taskTitle: 'Follow up with {{leadName}}',
        taskDescription: 'Send follow-up message to gauge continued interest.',
        daysUntilDue: 3
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'rule-qualified-urgent',
      name: 'Qualified Lead - Urgent Follow-up',
      trigger: 'status-change',
      conditions: {
        toStatus: 'qualified'
      },
      actions: {
        createTask: true,
        taskPriority: 'high',
        taskTitle: 'Schedule property viewing for {{leadName}}',
        taskDescription: 'Lead is qualified. Schedule property viewing within 2 days.',
        daysUntilDue: 1
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'rule-hot-lead',
      name: 'Hot Lead Alert',
      trigger: 'score-change',
      conditions: {
        scoreThreshold: 80
      },
      actions: {
        createTask: true,
        taskPriority: 'high',
        taskTitle: '🔥 HOT LEAD: {{leadName}}',
        taskDescription: 'Lead score crossed 80. Immediate attention required. Call within 1 hour.',
        daysUntilDue: 0
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'rule-negotiation-followup',
      name: 'Negotiation - Weekly Check-in',
      trigger: 'status-change',
      conditions: {
        toStatus: 'negotiation'
      },
      actions: {
        createTask: true,
        sendTemplate: 'tpl-negotiation-1',
        taskPriority: 'high',
        taskTitle: 'Negotiation check-in: {{leadName}}',
        taskDescription: 'Follow up on negotiation. Update pricing or terms if needed.',
        daysUntilDue: 2
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}

/**
 * Create a follow-up task
 */
export function createFollowUpTask(
  leadId: string,
  leadName: string,
  agentId: string,
  agentName: string,
  taskData: {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    daysUntilDue: number;
    propertyId?: string;
    propertyTitle?: string;
    templateId?: string;
    ruleId?: string;
    createdBy?: 'system' | 'manual';
  }
): FollowUpTask {
  const now = new Date();
  const dueDate = new Date(now.getTime() + (taskData.daysUntilDue * 24 * 60 * 60 * 1000));
  
  const task: FollowUpTask = {
    id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    leadId,
    leadName,
    propertyId: taskData.propertyId,
    propertyTitle: taskData.propertyTitle,
    agentId,
    agentName,
    title: taskData.title,
    description: taskData.description,
    priority: taskData.priority,
    dueDate: dueDate.toISOString(),
    status: 'pending',
    templateId: taskData.templateId,
    ruleId: taskData.ruleId,
    createdBy: taskData.createdBy || 'manual',
    createdAt: now.toISOString()
  };
  
  // Save to localStorage
  try {
    const stored = localStorage.getItem('estate_followup_tasks');
    const tasks: FollowUpTask[] = stored ? JSON.parse(stored) : [];
    tasks.push(task);
    localStorage.setItem('estate_followup_tasks', JSON.stringify(tasks));
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('followUpTaskCreated', { 
      detail: { taskId: task.id } 
    }));
  } catch (error) {
    console.error('Error saving follow-up task:', error);
  }
  
  return task;
}

/**
 * Process follow-up rules for a lead status change
 */
export function processFollowUpRules(
  lead: Lead,
  oldStatus: string | null,
  newStatus: string,
  agentId: string,
  agentName: string
): FollowUpTask[] {
  const createdTasks: FollowUpTask[] = [];
  
  try {
    // Get active rules
    const storedRules = localStorage.getItem('estate_followup_rules');
    const rules: FollowUpRule[] = storedRules 
      ? JSON.parse(storedRules) 
      : getDefaultFollowUpRules();
    
    const activeRules = rules.filter(r => r.isActive);
    
    // Find matching rules
    const matchingRules = activeRules.filter(rule => {
      if (rule.trigger === 'status-change') {
        const matchesTo = !rule.conditions.toStatus || rule.conditions.toStatus === newStatus;
        const matchesFrom = !rule.conditions.fromStatus || rule.conditions.fromStatus === oldStatus;
        return matchesTo && matchesFrom;
      }
      return false;
    });
    
    // Create tasks for matching rules
    matchingRules.forEach(rule => {
      if (rule.actions.createTask) {
        // Replace variables in title and description
        const title = replaceTemplateVariables(rule.actions.taskTitle, lead, null);
        const description = replaceTemplateVariables(rule.actions.taskDescription, lead, null);
        
        const task = createFollowUpTask(
          lead.id,
          lead.name,
          agentId,
          agentName,
          {
            title,
            description,
            priority: rule.actions.taskPriority,
            daysUntilDue: rule.actions.daysUntilDue,
            templateId: rule.actions.sendTemplate,
            ruleId: rule.id,
            createdBy: 'system'
          }
        );
        
        createdTasks.push(task);
      }
    });
  } catch (error) {
    console.error('Error processing follow-up rules:', error);
  }
  
  return createdTasks;
}

/**
 * Check for hot lead score changes and create tasks
 */
export function processScoreBasedRules(
  lead: Lead,
  oldScore: number,
  newScore: number,
  agentId: string,
  agentName: string
): FollowUpTask[] {
  const createdTasks: FollowUpTask[] = [];
  
  try {
    const storedRules = localStorage.getItem('estate_followup_rules');
    const rules: FollowUpRule[] = storedRules 
      ? JSON.parse(storedRules) 
      : getDefaultFollowUpRules();
    
    const activeRules = rules.filter(r => r.isActive && r.trigger === 'score-change');
    
    activeRules.forEach(rule => {
      const threshold = rule.conditions.scoreThreshold || 0;
      // Trigger if score crosses threshold upward
      if (oldScore < threshold && newScore >= threshold) {
        if (rule.actions.createTask) {
          const title = replaceTemplateVariables(rule.actions.taskTitle, lead, null);
          const description = replaceTemplateVariables(rule.actions.taskDescription, lead, null);
          
          const task = createFollowUpTask(
            lead.id,
            lead.name,
            agentId,
            agentName,
            {
              title,
              description,
              priority: rule.actions.taskPriority,
              daysUntilDue: rule.actions.daysUntilDue,
              templateId: rule.actions.sendTemplate,
              ruleId: rule.id,
              createdBy: 'system'
            }
          );
          
          createdTasks.push(task);
        }
      }
    });
  } catch (error) {
    console.error('Error processing score-based rules:', error);
  }
  
  return createdTasks;
}

/**
 * Get tasks for an agent
 */
export function getFollowUpTasks(
  agentId: string,
  userRole: string,
  filters?: {
    status?: 'pending' | 'completed' | 'overdue';
    priority?: 'low' | 'medium' | 'high';
  }
): FollowUpTask[] {
  try {
    const stored = localStorage.getItem('estate_followup_tasks');
    if (!stored) return [];
    
    let tasks: FollowUpTask[] = JSON.parse(stored);
    
    // Filter by agent if not admin
    if (userRole !== 'admin') {
      tasks = tasks.filter(t => t.agentId === agentId);
    }
    
    // Update overdue status
    const now = new Date();
    tasks.forEach(task => {
      if (task.status === 'pending' && new Date(task.dueDate) < now) {
        task.status = 'overdue';
      }
    });
    
    // Apply filters
    if (filters?.status) {
      tasks = tasks.filter(t => t.status === filters.status);
    }
    if (filters?.priority) {
      tasks = tasks.filter(t => t.priority === filters.priority);
    }
    
    // Sort by due date (earliest first) and priority
    tasks.sort((a, b) => {
      // First by status (overdue, pending, completed)
      const statusOrder = { overdue: 0, pending: 1, completed: 2 };
      if (a.status !== b.status) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      // Then by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (a.priority !== b.priority) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      // Finally by due date
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
    
    return tasks;
  } catch (error) {
    console.error('Error getting follow-up tasks:', error);
    return [];
  }
}

/**
 * Complete a follow-up task
 */
export function completeFollowUpTask(taskId: string): boolean {
  try {
    const stored = localStorage.getItem('estate_followup_tasks');
    if (!stored) return false;
    
    const tasks: FollowUpTask[] = JSON.parse(stored);
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) return false;
    
    tasks[taskIndex].status = 'completed';
    tasks[taskIndex].completedAt = new Date().toISOString();
    
    localStorage.setItem('estate_followup_tasks', JSON.stringify(tasks));
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('followUpTaskCompleted', { 
      detail: { taskId } 
    }));
    
    return true;
  } catch (error) {
    console.error('Error completing follow-up task:', error);
    return false;
  }
}

/**
 * Replace template variables with actual values
 */
function replaceTemplateVariables(
  template: string,
  lead: Lead,
  property: Property | null
): string {
  let result = template;
  
  // Lead variables
  result = result.replace(/\{\{leadName\}\}/g, lead.name);
  result = result.replace(/\{\{leadPhone\}\}/g, lead.phone);
  result = result.replace(/\{\{leadEmail\}\}/g, lead.email || '');
  
  // Property variables (if property provided)
  if (property) {
    result = result.replace(/\{\{propertyTitle\}\}/g, property.title);
    result = result.replace(/\{\{propertyAddress\}\}/g, property.address);
    result = result.replace(/\{\{propertyPrice\}\}/g, property.price.toString());
    result = result.replace(/\{\{propertyType\}\}/g, property.type);
  }
  
  // Agent/Agency variables (can be enhanced with actual data)
  result = result.replace(/\{\{agentName\}\}/g, lead.agentName || 'Agent');
  result = result.replace(/\{\{agencyName\}\}/g, 'aaraazi');
  
  return result;
}

/**
 * Apply template to lead and property
 */
export function applyTemplate(
  templateId: string,
  lead: Lead,
  property?: Property
): string {
  try {
    const stored = localStorage.getItem('estate_followup_templates');
    const templates: FollowUpTemplate[] = stored 
      ? JSON.parse(stored) 
      : getDefaultTemplates();
    
    const template = templates.find(t => t.id === templateId);
    if (!template) return '';
    
    return replaceTemplateVariables(template.body, lead, property || null);
  } catch (error) {
    console.error('Error applying template:', error);
    return '';
  }
}