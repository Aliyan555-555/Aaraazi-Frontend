/**
 * Notification Integration - V3.0
 * Helper functions to integrate notifications with existing features
 */

import {
  notifyOfferReceived,
  notifyPropertyMatch,
  notifyFollowUpReminder,
  notifyRelistingOpportunity,
  notifyCommissionEarned,
  notifyLeadStatusChange,
  notifyOfferStatusChange,
  createNotification,
} from './notifications';
import { Property, Lead, BuyerRequirement } from '../types';
import { SellCycleOffer } from '../types/cycles';

// ============================================================
// SELL CYCLE NOTIFICATIONS
// ============================================================

/**
 * Call this when a new offer is added to a sell cycle
 */
export function triggerOfferReceivedNotification(
  agentId: string,
  data: {
    propertyAddress: string;
    sellCycleId: string;
    buyerName: string;
    offerAmount: number;
    offerId: string;
  }
): void {
  notifyOfferReceived(agentId, data);
}

/**
 * Call this when an offer status changes
 */
export function triggerOfferStatusChangeNotification(
  buyerId: string,
  data: {
    propertyAddress: string;
    status: 'accepted' | 'rejected' | 'countered';
    sellCycleId: string;
    offerId: string;
  }
): void {
  notifyOfferStatusChange(buyerId, data);
}

// ============================================================
// PROPERTY MATCHING NOTIFICATIONS
// ============================================================

/**
 * Call this when a new property matches a buyer requirement
 */
export function triggerPropertyMatchNotification(
  agentId: string,
  data: {
    buyerRequirementId: string;
    buyerName: string;
    propertyAddress: string;
    propertyId: string;
    matchScore: number;
  }
): void {
  // Only notify for high-quality matches (>= 70%)
  if (data.matchScore >= 70) {
    notifyPropertyMatch(agentId, data);
  }
}

// ============================================================
// LEAD NOTIFICATIONS
// ============================================================

/**
 * Call this when a lead status changes
 */
export function triggerLeadStatusChangeNotification(
  agentId: string,
  data: {
    leadId: string;
    leadName: string;
    oldStatus: string;
    newStatus: string;
  }
): void {
  notifyLeadStatusChange(agentId, data);
}

/**
 * Call this when a follow-up is due
 */
export function triggerFollowUpReminderNotification(
  agentId: string,
  data: {
    leadId: string;
    leadName: string;
    leadContact: string;
    dueDate: string;
  }
): void {
  notifyFollowUpReminder(agentId, data);
}

/**
 * Check for leads with upcoming follow-ups and send reminders
 */
export function checkAndTriggerFollowUpReminders(agentId: string, leads: Lead[]): void {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  leads.forEach(lead => {
    if (lead.followUpDate) {
      const followUpDate = new Date(lead.followUpDate);
      followUpDate.setHours(0, 0, 0, 0);

      // Notify if follow-up is today or overdue
      if (followUpDate <= tomorrow && lead.status !== 'Closed') {
        triggerFollowUpReminderNotification(agentId, {
          leadId: lead.id,
          leadName: lead.name,
          leadContact: lead.contact,
          dueDate: lead.followUpDate,
        });
      }
    }
  });
}

// ============================================================
// PROPERTY LIFECYCLE NOTIFICATIONS
// ============================================================

/**
 * Call this when a property becomes eligible for re-listing
 */
export function triggerRelistingOpportunityNotification(
  agentId: string,
  data: {
    propertyId: string;
    propertyAddress: string;
    soldDate: string;
  }
): void {
  notifyRelistingOpportunity(agentId, data);
}

/**
 * Call this when a property status changes
 */
export function triggerPropertyStatusChangeNotification(
  agentId: string,
  data: {
    propertyId: string;
    propertyAddress: string;
    oldStatus: string;
    newStatus: string;
  }
): void {
  createNotification({
    userId: agentId,
    type: 'PROPERTY_STATUS_CHANGE',
    priority: 'MEDIUM',
    title: 'Property Status Updated',
    message: `${data.propertyAddress} status changed from ${data.oldStatus} to ${data.newStatus}`,
    entityType: 'property',
    entityId: data.propertyId,
    actionLabel: 'View Property',
    actionType: 'navigate',
    actionData: { propertyId: data.propertyId },
    metadata: { oldStatus: data.oldStatus, newStatus: data.newStatus },
  });
}

// ============================================================
// FINANCIAL NOTIFICATIONS
// ============================================================

/**
 * Call this when commission is earned from a transaction
 */
export function triggerCommissionEarnedNotification(
  agentId: string,
  data: {
    amount: number;
    propertyAddress: string;
    transactionId: string;
    transactionType: 'sale' | 'rent';
  }
): void {
  notifyCommissionEarned(agentId, data);
}

/**
 * Call this when a payment is due
 */
export function triggerPaymentDueNotification(
  userId: string,
  data: {
    amount: number;
    dueDate: string;
    description: string;
    entityId?: string;
  }
): void {
  createNotification({
    userId,
    type: 'PAYMENT_DUE',
    priority: 'HIGH',
    title: 'Payment Due',
    message: `Payment of PKR ${data.amount.toLocaleString()} due on ${new Date(data.dueDate).toLocaleDateString()}`,
    actionLabel: 'View Details',
    actionType: 'navigate',
    metadata: { amount: data.amount, dueDate: data.dueDate, description: data.description },
  });
}

// ============================================================
// VIEWING NOTIFICATIONS
// ============================================================

/**
 * Call this when a viewing is scheduled
 */
export function triggerViewingScheduledNotification(
  agentId: string,
  data: {
    propertyAddress: string;
    viewingDate: string;
    clientName: string;
    propertyId: string;
  }
): void {
  createNotification({
    userId: agentId,
    type: 'VIEWING_SCHEDULED',
    priority: 'MEDIUM',
    title: 'Viewing Scheduled',
    message: `${data.clientName} scheduled a viewing for ${data.propertyAddress} on ${new Date(data.viewingDate).toLocaleDateString()}`,
    entityType: 'property',
    entityId: data.propertyId,
    actionLabel: 'View Details',
    actionType: 'navigate',
    metadata: { viewingDate: data.viewingDate, clientName: data.clientName },
  });
}

/**
 * Call this when viewing feedback is received
 */
export function triggerViewingFeedbackNotification(
  agentId: string,
  data: {
    propertyAddress: string;
    clientName: string;
    feedback: string;
    propertyId: string;
  }
): void {
  createNotification({
    userId: agentId,
    type: 'VIEWING_FEEDBACK_RECEIVED',
    priority: 'MEDIUM',
    title: 'Viewing Feedback Received',
    message: `${data.clientName} provided feedback for ${data.propertyAddress}`,
    entityType: 'property',
    entityId: data.propertyId,
    actionLabel: 'View Feedback',
    actionType: 'navigate',
    metadata: { clientName: data.clientName, feedback: data.feedback },
  });
}

// ============================================================
// BUYER REQUIREMENT NOTIFICATIONS
// ============================================================

/**
 * Call this when a buyer requirement status changes
 */
export function triggerRequirementStatusChangeNotification(
  agentId: string,
  data: {
    requirementId: string;
    buyerName: string;
    oldStatus: string;
    newStatus: string;
  }
): void {
  createNotification({
    userId: agentId,
    type: 'REQUIREMENT_STATUS_CHANGE',
    priority: 'MEDIUM',
    title: 'Requirement Status Updated',
    message: `${data.buyerName}'s requirement moved from ${data.oldStatus} to ${data.newStatus}`,
    entityType: 'buyerRequirement',
    entityId: data.requirementId,
    actionLabel: 'View Requirement',
    actionType: 'navigate',
    metadata: { oldStatus: data.oldStatus, newStatus: data.newStatus },
  });
}

// ============================================================
// SYSTEM NOTIFICATIONS
// ============================================================

/**
 * Call this to send a general system alert
 */
export function triggerSystemAlertNotification(
  userId: string,
  data: {
    title: string;
    message: string;
    priority?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  }
): void {
  createNotification({
    userId,
    type: 'SYSTEM_ALERT',
    priority: data.priority || 'MEDIUM',
    title: data.title,
    message: data.message,
  });
}

// ============================================================
// BATCH NOTIFICATION HELPERS
// ============================================================

/**
 * Send welcome notifications to new users
 */
export function sendWelcomeNotifications(userId: string): void {
  createNotification({
    userId,
    type: 'SYSTEM_ALERT',
    priority: 'LOW',
    title: 'Welcome to aaraazi!',
    message: 'Get started by exploring the dashboard and managing your real estate portfolio.',
  });
}

/**
 * Check and send daily summary notifications
 */
export function sendDailySummaryNotification(
  userId: string,
  data: {
    newLeads: number;
    newOffers: number;
    upcomingFollowUps: number;
    newMatches: number;
  }
): void {
  const summary = [];
  if (data.newLeads > 0) summary.push(`${data.newLeads} new leads`);
  if (data.newOffers > 0) summary.push(`${data.newOffers} new offers`);
  if (data.upcomingFollowUps > 0) summary.push(`${data.upcomingFollowUps} follow-ups due`);
  if (data.newMatches > 0) summary.push(`${data.newMatches} new matches`);

  if (summary.length > 0) {
    createNotification({
      userId,
      type: 'SYSTEM_ALERT',
      priority: 'LOW',
      title: 'Daily Summary',
      message: `You have ${summary.join(', ')} today.`,
    });
  }
}
