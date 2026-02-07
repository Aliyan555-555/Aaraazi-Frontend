/**
 * Notification Types - V3.0
 * Type definitions for the notification system
 */

export type NotificationType =
  // Offer & Transaction Notifications
  | 'OFFER_RECEIVED'
  | 'OFFER_ACCEPTED'
  | 'OFFER_REJECTED'
  | 'COUNTER_OFFER_RECEIVED'
  | 'OFFER_WITHDRAWN'
  
  // Property & Cycle Notifications
  | 'NEW_PROPERTY_MATCH'
  | 'PROPERTY_STATUS_CHANGE'
  | 'RELISTING_OPPORTUNITY'
  | 'PROPERTY_PRICE_CHANGE'
  
  // Lead Notifications
  | 'NEW_LEAD_ASSIGNED'
  | 'LEAD_STATUS_CHANGE'
  | 'LEAD_CONVERTED'
  | 'FOLLOW_UP_REMINDER'
  
  // Viewing Notifications
  | 'VIEWING_SCHEDULED'
  | 'VIEWING_FEEDBACK_RECEIVED'
  | 'VIEWING_REMINDER'
  
  // Financial Notifications
  | 'COMMISSION_EARNED'
  | 'PAYMENT_DUE'
  | 'PAYMENT_RECEIVED'
  | 'BUDGET_ALERT'
  
  // Document Notifications
  | 'DOCUMENT_UPLOADED'
  | 'DOCUMENT_APPROVAL_NEEDED'
  | 'DOCUMENT_APPROVED'
  | 'DOCUMENT_REJECTED'
  
  // Buyer Requirement Notifications
  | 'REQUIREMENT_MATCHED'
  | 'REQUIREMENT_STATUS_CHANGE'
  
  // Deal Management Notifications
  | 'DEAL_CREATED'
  | 'DEAL_PAYMENT_UPDATED'
  | 'DEAL_DOCUMENT_UPLOADED'
  | 'DEAL_STAGE_UPDATED'
  | 'DEAL_COMPLETED'
  | 'DEAL_CANCELLED'
  
  // System Notifications
  | 'SYSTEM_ALERT'
  | 'USER_ADDED'
  | 'PERMISSION_CHANGE'
  | 'WORKSPACE_INVITATION';

export type NotificationPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type EntityType = 
  | 'property' 
  | 'sellCycle' 
  | 'buyCycle'
  | 'rentCycle'
  | 'buyerRequirement' 
  | 'rentRequirement'
  | 'property-match'
  | 'lead' 
  | 'transaction'
  | 'document'
  | 'viewing'
  | 'user'
  | 'workspace'
  | 'deal';

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  archived: boolean;
  
  // User association
  userId: string;
  workspaceId?: string;
  
  // Entity linking (for deep navigation)
  entityType?: EntityType;
  entityId?: string;
  
  // Quick actions
  actionLabel?: string;
  actionType?: 'navigate' | 'accept' | 'reject' | 'approve' | 'view';
  actionData?: Record<string, any>;
  
  // Additional context
  metadata?: Record<string, any>;
  
  // Grouping
  groupKey?: string; // For grouping similar notifications
}

export interface NotificationGroup {
  key: string;
  type: NotificationType;
  count: number;
  latestTimestamp: string;
  notifications: Notification[];
  title: string;
  summary: string;
}

export interface NotificationPreferences {
  userId: string;
  
  // Notification type preferences
  enabledTypes: NotificationType[];
  
  // Priority preferences
  mutedPriorities: NotificationPriority[];
  
  // Channel preferences (future)
  enableInApp: boolean;
  enableEmail: boolean;
  enableSMS: boolean;
  
  // Grouping preferences
  groupSimilar: boolean;
  
  // Auto-cleanup
  autoArchiveAfterDays: number;
  maxNotifications: number;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byCriticality: Record<NotificationPriority, number>;
  byType: Record<NotificationType, number>;
  todayCount: number;
  thisWeekCount: number;
}