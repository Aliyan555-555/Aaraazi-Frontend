import { Lead, Property, Contact } from '../types';
import { getProperties } from './data';
import { getContacts } from './data';

/**
 * Lead Scoring & Qualification System
 * Intelligent lead prioritization based on multiple factors
 */

export interface LeadScore {
  leadId: string;
  totalScore: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D'; // A: Hot, B: Warm, C: Cold, D: Dead
  factors: {
    budgetAlignment: number;
    responseSpeed: number;
    engagementLevel: number;
    timelineUrgency: number;
    propertyFit: number;
  };
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  estimatedCloseDate?: string;
  nextAction: string;
}

export interface LeadNurturingStep {
  day: number;
  action: string;
  channel: 'email' | 'phone' | 'whatsapp' | 'meeting';
  template?: string;
  completed?: boolean;
}

export interface LeadNurturingWorkflow {
  leadId: string;
  workflowType: 'hot-lead' | 'warm-lead' | 'cold-lead' | 'long-term';
  steps: LeadNurturingStep[];
  currentStep: number;
  startDate: string;
  completionRate: number;
}

// ============================================================================
// LEAD SCORING
// ============================================================================

/**
 * Calculate comprehensive lead score
 */
export function calculateLeadScore(lead: Lead): LeadScore {
  const budgetAlignment = scoreBudgetAlignment(lead);
  const responseSpeed = scoreResponseSpeed(lead);
  const engagementLevel = scoreEngagementLevel(lead);
  const timelineUrgency = scoreTimelineUrgency(lead);
  const propertyFit = scorePropertyFit(lead);

  const totalScore = Math.round(
    budgetAlignment * 0.3 +
    responseSpeed * 0.2 +
    engagementLevel * 0.25 +
    timelineUrgency * 0.15 +
    propertyFit * 0.1
  );

  const grade = getLeadGrade(totalScore);
  const priority = getLeadPriority(grade, timelineUrgency);
  const recommendation = getRecommendation(grade, lead);
  const nextAction = getNextAction(grade, lead);
  const estimatedCloseDate = estimateCloseDate(grade, timelineUrgency);

  return {
    leadId: lead.id,
    totalScore,
    grade,
    factors: {
      budgetAlignment,
      responseSpeed,
      engagementLevel,
      timelineUrgency,
      propertyFit
    },
    recommendation,
    priority,
    estimatedCloseDate,
    nextAction
  };
}

/**
 * Score budget alignment (0-100)
 */
function scoreBudgetAlignment(lead: Lead): number {
  if (!lead.budget || !lead.interestedProperties || lead.interestedProperties.length === 0) {
    return 50; // Neutral score if no data
  }

  const properties = getProperties();
  const interestedProps = properties.filter((p: Property) => 
    lead.interestedProperties?.includes(p.id)
  );

  if (interestedProps.length === 0) return 50;

  const budget = lead.budget;
  let alignmentScores: number[] = [];

  interestedProps.forEach((prop: Property) => {
    const propertyPrice = prop.price || 0;
    if (propertyPrice === 0) {
      alignmentScores.push(50);
      return;
    }

    const ratio = budget / propertyPrice;

    if (ratio >= 0.9 && ratio <= 1.1) {
      // Perfect match (90-110% of price)
      alignmentScores.push(100);
    } else if (ratio >= 0.8 && ratio < 0.9) {
      // Slightly under budget
      alignmentScores.push(80);
    } else if (ratio > 1.1 && ratio <= 1.3) {
      // Comfortably above budget
      alignmentScores.push(90);
    } else if (ratio > 1.3) {
      // Well above budget (may be looking for cheaper)
      alignmentScores.push(70);
    } else if (ratio >= 0.7 && ratio < 0.8) {
      // Under budget but possible
      alignmentScores.push(60);
    } else {
      // Significantly misaligned
      alignmentScores.push(30);
    }
  });

  return Math.round(alignmentScores.reduce((sum, score) => sum + score, 0) / alignmentScores.length);
}

/**
 * Score response speed (0-100)
 */
function scoreResponseSpeed(lead: Lead): number {
  if (!lead.lastContactDate) {
    return 50; // Neutral if no contact yet
  }

  const createdDate = new Date(lead.createdAt);
  const contactDate = new Date(lead.lastContactDate);
  const hoursDiff = (contactDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60);

  if (hoursDiff < 1) return 100; // Contacted within 1 hour
  if (hoursDiff < 4) return 90; // Within 4 hours
  if (hoursDiff < 24) return 75; // Same day
  if (hoursDiff < 48) return 60; // Within 2 days
  if (hoursDiff < 72) return 40; // Within 3 days
  return 20; // More than 3 days
}

/**
 * Score engagement level (0-100)
 */
function scoreEngagementLevel(lead: Lead): number {
  let score = 0;

  // Status-based scoring
  switch (lead.status) {
    case 'new':
      score += 20;
      break;
    case 'contacted':
      score += 40;
      break;
    case 'qualified':
      score += 60;
      break;
    case 'negotiation':
      score += 80;
      break;
    case 'converted':
      score += 100;
      break;
    case 'lost':
      score += 0;
      break;
  }

  // Number of interactions (from notes/follow-ups)
  const interactions = (lead.notes?.split('\n').length || 0) + (lead.followUpDate ? 1 : 0);
  const interactionBonus = Math.min(30, interactions * 5);
  score += interactionBonus;

  // Multiple interested properties bonus
  const propertyBonus = Math.min(10, (lead.interestedProperties?.length || 0) * 5);
  score += propertyBonus;

  return Math.min(100, score);
}

/**
 * Score timeline urgency (0-100)
 */
function scoreTimelineUrgency(lead: Lead): number {
  if (!lead.followUpDate) {
    return 50; // Neutral if no timeline
  }

  const today = new Date();
  const followUpDate = new Date(lead.followUpDate);
  const daysUntilFollowUp = Math.ceil((followUpDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilFollowUp < 0) {
    // Overdue follow-up
    return 100;
  } else if (daysUntilFollowUp === 0) {
    // Due today
    return 95;
  } else if (daysUntilFollowUp <= 2) {
    // Due within 2 days
    return 85;
  } else if (daysUntilFollowUp <= 7) {
    // Due within a week
    return 70;
  } else if (daysUntilFollowUp <= 14) {
    // Due within 2 weeks
    return 50;
  } else if (daysUntilFollowUp <= 30) {
    // Due within a month
    return 30;
  } else {
    // More than a month away
    return 10;
  }
}

/**
 * Score property fit (0-100)
 */
function scorePropertyFit(lead: Lead): number {
  if (!lead.interestedProperties || lead.interestedProperties.length === 0) {
    return 50; // Neutral if no properties linked
  }

  const properties = getProperties();
  const interestedProps = properties.filter((p: Property) => 
    lead.interestedProperties?.includes(p.id)
  );

  if (interestedProps.length === 0) return 50;

  let fitScore = 0;

  // Check if properties are available
  const availableCount = interestedProps.filter((p: Property) => p.status === 'available').length;
  fitScore += (availableCount / interestedProps.length) * 60;

  // Check if properties are published
  const publishedCount = interestedProps.filter((p: Property) => p.isPublished).length;
  fitScore += (publishedCount / interestedProps.length) * 20;

  // Bonus for multiple property interest
  if (interestedProps.length > 1) {
    fitScore += 20;
  } else {
    fitScore += 10;
  }

  return Math.round(Math.min(100, fitScore));
}

/**
 * Get lead grade from score
 */
function getLeadGrade(score: number): 'A' | 'B' | 'C' | 'D' {
  if (score >= 80) return 'A'; // Hot lead
  if (score >= 60) return 'B'; // Warm lead
  if (score >= 40) return 'C'; // Cold lead
  return 'D'; // Dead lead
}

/**
 * Get lead priority
 */
function getLeadPriority(grade: 'A' | 'B' | 'C' | 'D', timelineScore: number): 'high' | 'medium' | 'low' {
  if (grade === 'A' || timelineScore >= 85) return 'high';
  if (grade === 'B' || timelineScore >= 50) return 'medium';
  return 'low';
}

/**
 * Get recommendation based on grade
 */
function getRecommendation(grade: 'A' | 'B' | 'C' | 'D', lead: Lead): string {
  switch (grade) {
    case 'A':
      return 'Hot lead! Contact immediately. Schedule property viewing within 24 hours.';
    case 'B':
      return 'Warm lead. Follow up within 48 hours. Send property details and pricing.';
    case 'C':
      return 'Cold lead. Add to nurturing campaign. Follow up weekly.';
    case 'D':
      return 'Low priority. Consider automated follow-up or mark as lost.';
  }
}

/**
 * Get next action
 */
function getNextAction(grade: 'A' | 'B' | 'C' | 'D', lead: Lead): string {
  if (lead.status === 'converted') return 'Close deal and collect commission';
  if (lead.status === 'lost') return 'Archive or attempt re-engagement';
  
  switch (grade) {
    case 'A':
      if (lead.status === 'new') return 'Call immediately to qualify';
      if (lead.status === 'contacted') return 'Schedule property viewing';
      if (lead.status === 'qualified') return 'Send pricing proposal';
      if (lead.status === 'negotiation') return 'Close the deal';
      return 'Contact immediately';
    case 'B':
      if (lead.status === 'new') return 'Contact within 24 hours';
      if (lead.status === 'contacted') return 'Send property details';
      return 'Follow up on interest level';
    case 'C':
      return 'Add to email nurturing campaign';
    case 'D':
      return 'Review and consider archiving';
  }
}

/**
 * Estimate close date based on grade and timeline
 */
function estimateCloseDate(grade: 'A' | 'B' | 'C' | 'D', timelineScore: number): string | undefined {
  const today = new Date();
  let daysToClose = 0;

  switch (grade) {
    case 'A':
      daysToClose = 14; // 2 weeks
      break;
    case 'B':
      daysToClose = 30; // 1 month
      break;
    case 'C':
      daysToClose = 60; // 2 months
      break;
    case 'D':
      return undefined; // Unlikely to close
  }

  // Adjust based on timeline urgency
  if (timelineScore >= 85) {
    daysToClose = Math.max(7, Math.round(daysToClose * 0.5));
  } else if (timelineScore >= 50) {
    daysToClose = Math.round(daysToClose * 0.75);
  }

  const closeDate = new Date(today);
  closeDate.setDate(closeDate.getDate() + daysToClose);
  return closeDate.toISOString();
}

// ============================================================================
// LEAD NURTURING WORKFLOWS
// ============================================================================

/**
 * Create nurturing workflow based on lead score
 */
export function createNurturingWorkflow(lead: Lead, leadScore: LeadScore): LeadNurturingWorkflow {
  const workflowType = getWorkflowType(leadScore.grade);
  const steps = getWorkflowSteps(workflowType);

  return {
    leadId: lead.id,
    workflowType,
    steps,
    currentStep: 0,
    startDate: new Date().toISOString(),
    completionRate: 0
  };
}

/**
 * Get workflow type from lead grade
 */
function getWorkflowType(grade: 'A' | 'B' | 'C' | 'D'): LeadNurturingWorkflow['workflowType'] {
  switch (grade) {
    case 'A':
      return 'hot-lead';
    case 'B':
      return 'warm-lead';
    case 'C':
      return 'cold-lead';
    case 'D':
      return 'long-term';
  }
}

/**
 * Get workflow steps based on type
 */
function getWorkflowSteps(workflowType: LeadNurturingWorkflow['workflowType']): LeadNurturingStep[] {
  const workflows: { [key: string]: LeadNurturingStep[] } = {
    'hot-lead': [
      {
        day: 0,
        action: 'Initial phone call to qualify and build rapport',
        channel: 'phone',
        template: 'hot-lead-initial-call'
      },
      {
        day: 1,
        action: 'Send property details and pricing via WhatsApp',
        channel: 'whatsapp',
        template: 'property-details-share'
      },
      {
        day: 2,
        action: 'Schedule property viewing',
        channel: 'phone',
        template: 'viewing-schedule'
      },
      {
        day: 3,
        action: 'Conduct property viewing and answer questions',
        channel: 'meeting',
        template: 'viewing-checklist'
      },
      {
        day: 5,
        action: 'Follow up after viewing - address concerns',
        channel: 'phone',
        template: 'post-viewing-followup'
      },
      {
        day: 7,
        action: 'Send formal proposal and negotiate terms',
        channel: 'email',
        template: 'formal-proposal'
      },
      {
        day: 10,
        action: 'Final negotiation and closing',
        channel: 'meeting',
        template: 'closing-meeting'
      }
    ],
    'warm-lead': [
      {
        day: 0,
        action: 'Initial contact via phone or WhatsApp',
        channel: 'phone',
        template: 'warm-lead-initial'
      },
      {
        day: 2,
        action: 'Send property details and high-quality images',
        channel: 'email',
        template: 'property-showcase'
      },
      {
        day: 5,
        action: 'Follow up on property interest',
        channel: 'phone',
        template: 'interest-followup'
      },
      {
        day: 10,
        action: 'Offer virtual tour or schedule viewing',
        channel: 'whatsapp',
        template: 'tour-offer'
      },
      {
        day: 15,
        action: 'Share market insights and pricing rationale',
        channel: 'email',
        template: 'market-insights'
      },
      {
        day: 21,
        action: 'Check timeline and budget confirmation',
        channel: 'phone',
        template: 'qualification-check'
      },
      {
        day: 30,
        action: 'Final follow-up or move to long-term nurturing',
        channel: 'email',
        template: 'final-warmup'
      }
    ],
    'cold-lead': [
      {
        day: 0,
        action: 'Send welcome email with property listings',
        channel: 'email',
        template: 'cold-lead-welcome'
      },
      {
        day: 7,
        action: 'Share market trends and investment insights',
        channel: 'email',
        template: 'market-newsletter'
      },
      {
        day: 14,
        action: 'Send new listings matching their criteria',
        channel: 'whatsapp',
        template: 'new-listings'
      },
      {
        day: 30,
        action: 'Check-in call to reassess needs',
        channel: 'phone',
        template: 'monthly-checkin'
      },
      {
        day: 60,
        action: 'Share success stories and testimonials',
        channel: 'email',
        template: 'social-proof'
      },
      {
        day: 90,
        action: 'Final engagement attempt or archive',
        channel: 'phone',
        template: 'final-attempt'
      }
    ],
    'long-term': [
      {
        day: 0,
        action: 'Add to monthly newsletter list',
        channel: 'email',
        template: 'newsletter-signup'
      },
      {
        day: 30,
        action: 'Send monthly market update',
        channel: 'email',
        template: 'monthly-market-update'
      },
      {
        day: 60,
        action: 'Share seasonal property highlights',
        channel: 'email',
        template: 'seasonal-highlights'
      },
      {
        day: 90,
        action: 'Quarterly check-in and needs assessment',
        channel: 'phone',
        template: 'quarterly-checkin'
      }
    ]
  };

  return workflows[workflowType] || workflows['long-term'];
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Score multiple leads at once
 */
export function scoreMultipleLeads(leads: Lead[]): LeadScore[] {
  return leads.map(lead => calculateLeadScore(lead));
}

/**
 * Get prioritized lead list
 */
export function getPrioritizedLeads(leads: Lead[]): Array<Lead & { score: LeadScore }> {
  const scoredLeads = leads.map(lead => ({
    ...lead,
    score: calculateLeadScore(lead)
  }));

  return scoredLeads.sort((a, b) => b.score.totalScore - a.score.totalScore);
}

/**
 * Get leads by grade
 */
export function getLeadsByGrade(leads: Lead[], grade: 'A' | 'B' | 'C' | 'D'): Lead[] {
  const scoredLeads = scoreMultipleLeads(leads);
  const targetLeadIds = scoredLeads
    .filter(score => score.grade === grade)
    .map(score => score.leadId);
  
  return leads.filter(lead => targetLeadIds.includes(lead.id));
}

/**
 * Get overdue follow-ups
 */
export function getOverdueFollowUps(leads: Lead[]): Lead[] {
  const today = new Date();
  return leads.filter(lead => {
    if (!lead.followUpDate) return false;
    const followUpDate = new Date(lead.followUpDate);
    return followUpDate < today && lead.status !== 'converted' && lead.status !== 'lost';
  });
}

/**
 * Get leads requiring action today
 */
export function getTodayActionLeads(leads: Lead[]): Lead[] {
  const today = new Date().toISOString().split('T')[0];
  return leads.filter(lead => {
    if (!lead.followUpDate) return false;
    const followUpDate = lead.followUpDate.split('T')[0];
    return followUpDate === today && lead.status !== 'converted' && lead.status !== 'lost';
  });
}