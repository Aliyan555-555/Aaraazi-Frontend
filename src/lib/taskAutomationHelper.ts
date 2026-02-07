/**
 * Task Automation Helper
 * 
 * Centralized utilities for triggering task automation across all modules
 * Provides consistent patterns for lead, deal, property, and contact workflows
 */

import { triggerAutomation } from './tasks';
import { User } from '../types';
import { toast } from 'sonner';

/**
 * Trigger automation and show toast notification
 */
function triggerWithNotification(
  trigger: Parameters<typeof triggerAutomation>[0],
  entityData: Parameters<typeof triggerAutomation>[1],
  user: User,
  showToast: boolean = false
): number {
  const createdTasks = triggerAutomation(trigger, entityData, user);
  
  if (showToast && createdTasks.length > 0) {
    toast.info(`${createdTasks.length} automated task${createdTasks.length > 1 ? 's' : ''} created`, {
      duration: 3000,
    });
  }
  
  return createdTasks.length;
}

/**
 * Lead Automation Helpers
 */
export const leadAutomation = {
  /**
   * Trigger when a new lead is created
   */
  onLeadCreated: (lead: any, user: User, showToast = false) => {
    return triggerWithNotification(
      {
        type: 'entity-created',
        entityType: 'lead',
      },
      lead,
      user,
      showToast
    );
  },

  /**
   * Trigger when lead status changes
   */
  onLeadStatusChanged: (lead: any, newStatus: string, user: User, showToast = false) => {
    return triggerWithNotification(
      {
        type: 'entity-status-changed',
        entityType: 'lead',
        statusChange: {
          to: newStatus,
        },
      },
      { ...lead, status: newStatus },
      user,
      showToast
    );
  },
};

/**
 * Deal Automation Helpers
 */
export const dealAutomation = {
  /**
   * Trigger when a new deal is created
   */
  onDealCreated: (deal: any, user: User, showToast = false) => {
    return triggerWithNotification(
      {
        type: 'entity-created',
        entityType: 'deal',
      },
      deal,
      user,
      showToast
    );
  },

  /**
   * Trigger when deal stage changes
   */
  onDealStageChanged: (deal: any, newStage: string, user: User, showToast = false) => {
    return triggerWithNotification(
      {
        type: 'entity-status-changed',
        entityType: 'deal',
        statusChange: {
          to: newStage,
        },
      },
      { ...deal, stage: newStage },
      user,
      showToast
    );
  },

  /**
   * Trigger when payment is overdue
   */
  onPaymentOverdue: (deal: any, user: User, showToast = false) => {
    return triggerWithNotification(
      {
        type: 'payment-overdue',
        entityType: 'deal',
      },
      deal,
      user,
      showToast
    );
  },
};

/**
 * Property Automation Helpers
 */
export const propertyAutomation = {
  /**
   * Trigger when property status changes
   */
  onPropertyStatusChanged: (property: any, newStatus: string, user: User, showToast = false) => {
    return triggerWithNotification(
      {
        type: 'entity-status-changed',
        entityType: 'property',
        statusChange: {
          to: newStatus,
        },
      },
      { ...property, status: newStatus },
      user,
      showToast
    );
  },
};

/**
 * Contact Automation Helpers
 */
export const contactAutomation = {
  /**
   * Trigger when a new contact is created
   */
  onContactCreated: (contact: any, user: User, showToast = false) => {
    return triggerWithNotification(
      {
        type: 'entity-created',
        entityType: 'contact',
      },
      contact,
      user,
      showToast
    );
  },
};
