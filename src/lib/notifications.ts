/**
 * Notification Service - V3.0
 * Comprehensive notification management system
 */

import {
  Notification,
  NotificationType,
  NotificationPriority,
  EntityType,
  NotificationPreferences,
  NotificationStats,
  NotificationGroup,
} from "../types/notifications";

const STORAGE_KEY = "estatemanager_notifications";
const PREFERENCES_KEY = "estatemanager_notification_preferences";
const MAX_NOTIFICATIONS = 200; // Maximum notifications to store
const AUTO_ARCHIVE_DAYS = 30; // Auto-archive notifications older than 30 days

// ============================================================
// CRUD OPERATIONS
// ============================================================

export function getNotifications(userId: string): Notification[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const allNotifications: Notification[] = JSON.parse(stored);

    // Filter by user and not archived
    const userNotifications = allNotifications.filter(
      (n) => n.userId === userId && !n.archived,
    );

    // Sort by timestamp (newest first)
    return userNotifications.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  } catch (error) {
    console.error("Error loading notifications:", error);
    return [];
  }
}

export function getNotificationById(id: string): Notification | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const allNotifications: Notification[] = JSON.parse(stored);
    return allNotifications.find((n) => n.id === id) || null;
  } catch (error) {
    console.error("Error getting notification:", error);
    return null;
  }
}

export function createNotification(
  notification: Omit<Notification, "id" | "timestamp" | "read" | "archived">,
): Notification {
  try {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false,
      archived: false,
    };

    const stored = localStorage.getItem(STORAGE_KEY);
    const allNotifications: Notification[] = stored ? JSON.parse(stored) : [];

    // Add new notification
    allNotifications.push(newNotification);

    // Trim to max notifications (keep most recent)
    const trimmed = allNotifications
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, MAX_NOTIFICATIONS);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));

    return newNotification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

export function markAsRead(notificationId: string): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    const allNotifications: Notification[] = JSON.parse(stored);
    const notification = allNotifications.find((n) => n.id === notificationId);

    if (notification) {
      notification.read = true;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allNotifications));
    }
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
}

export function markAllAsRead(userId: string): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    const allNotifications: Notification[] = JSON.parse(stored);

    allNotifications.forEach((notification) => {
      if (notification.userId === userId && !notification.read) {
        notification.read = true;
      }
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(allNotifications));
  } catch (error) {
    console.error("Error marking all as read:", error);
  }
}

export function archiveNotification(notificationId: string): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    const allNotifications: Notification[] = JSON.parse(stored);
    const notification = allNotifications.find((n) => n.id === notificationId);

    if (notification) {
      notification.archived = true;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allNotifications));
    }
  } catch (error) {
    console.error("Error archiving notification:", error);
  }
}

export function deleteNotification(notificationId: string): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    const allNotifications: Notification[] = JSON.parse(stored);
    const filtered = allNotifications.filter((n) => n.id !== notificationId);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error deleting notification:", error);
  }
}

export function bulkArchive(notificationIds: string[]): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    const allNotifications: Notification[] = JSON.parse(stored);

    notificationIds.forEach((id) => {
      const notification = allNotifications.find((n) => n.id === id);
      if (notification) {
        notification.archived = true;
      }
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(allNotifications));
  } catch (error) {
    console.error("Error bulk archiving:", error);
  }
}

export function bulkDelete(notificationIds: string[]): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    const allNotifications: Notification[] = JSON.parse(stored);
    const filtered = allNotifications.filter(
      (n) => !notificationIds.includes(n.id),
    );

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error bulk deleting:", error);
  }
}

// ============================================================
// AUTO-CLEANUP
// ============================================================

export function autoCleanupOldNotifications(): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    const allNotifications: Notification[] = JSON.parse(stored);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - AUTO_ARCHIVE_DAYS);

    allNotifications.forEach((notification) => {
      const notificationDate = new Date(notification.timestamp);
      if (notificationDate < cutoffDate && !notification.archived) {
        notification.archived = true;
      }
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(allNotifications));
  } catch (error) {
    console.error("Error auto-cleaning notifications:", error);
  }
}

// ============================================================
// STATISTICS & ANALYTICS
// ============================================================

export function getNotificationStats(userId: string): NotificationStats {
  const notifications = getNotifications(userId);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const stats: NotificationStats = {
    total: notifications.length,
    unread: notifications.filter((n) => !n.read).length,
    byCriticality: {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    },
    byType: {} as Record<NotificationType, number>,
    todayCount: 0,
    thisWeekCount: 0,
  };

  notifications.forEach((notification) => {
    // Count by priority
    stats.byCriticality[notification.priority]++;

    // Count by type
    if (!stats.byType[notification.type]) {
      stats.byType[notification.type] = 0;
    }
    stats.byType[notification.type]++;

    // Count by time period
    const notifDate = new Date(notification.timestamp);
    if (notifDate >= todayStart) {
      stats.todayCount++;
    }
    if (notifDate >= weekStart) {
      stats.thisWeekCount++;
    }
  });

  return stats;
}

// ============================================================
// GROUPING & FILTERING
// ============================================================

export function groupNotifications(
  notifications: Notification[],
): NotificationGroup[] {
  const groups: Record<string, NotificationGroup> = {};

  notifications.forEach((notification) => {
    const groupKey = notification.groupKey || notification.id;

    if (!groups[groupKey]) {
      groups[groupKey] = {
        key: groupKey,
        type: notification.type,
        count: 0,
        latestTimestamp: notification.timestamp,
        notifications: [],
        title: notification.title,
        summary: notification.message,
      };
    }

    groups[groupKey].count++;
    groups[groupKey].notifications.push(notification);

    // Update latest timestamp
    if (
      new Date(notification.timestamp) >
      new Date(groups[groupKey].latestTimestamp)
    ) {
      groups[groupKey].latestTimestamp = notification.timestamp;
    }
  });

  return Object.values(groups).sort(
    (a, b) =>
      new Date(b.latestTimestamp).getTime() -
      new Date(a.latestTimestamp).getTime(),
  );
}

export function filterNotifications(
  notifications: Notification[],
  filters: {
    types?: NotificationType[];
    priorities?: NotificationPriority[];
    readStatus?: "all" | "read" | "unread";
    dateRange?: "today" | "week" | "month" | "all";
    entityType?: EntityType;
  },
): Notification[] {
  let filtered = [...notifications];

  // Filter by type
  if (filters.types && filters.types.length > 0) {
    filtered = filtered.filter((n) => filters.types!.includes(n.type));
  }

  // Filter by priority
  if (filters.priorities && filters.priorities.length > 0) {
    filtered = filtered.filter((n) => filters.priorities!.includes(n.priority));
  }

  // Filter by read status
  if (filters.readStatus === "read") {
    filtered = filtered.filter((n) => n.read);
  } else if (filters.readStatus === "unread") {
    filtered = filtered.filter((n) => !n.read);
  }

  // Filter by date range
  if (filters.dateRange) {
    const now = new Date();
    let cutoffDate: Date;

    switch (filters.dateRange) {
      case "today":
        cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffDate = new Date(0);
    }

    filtered = filtered.filter((n) => new Date(n.timestamp) >= cutoffDate);
  }

  // Filter by entity type
  if (filters.entityType) {
    filtered = filtered.filter((n) => n.entityType === filters.entityType);
  }

  return filtered;
}

// ============================================================
// NOTIFICATION PREFERENCES
// ============================================================

export function getNotificationPreferences(
  userId: string,
): NotificationPreferences {
  try {
    const stored = localStorage.getItem(PREFERENCES_KEY);
    if (!stored) {
      return getDefaultPreferences(userId);
    }

    const allPreferences: NotificationPreferences[] = JSON.parse(stored);
    const userPrefs = allPreferences.find((p) => p.userId === userId);

    return userPrefs || getDefaultPreferences(userId);
  } catch (error) {
    console.error("Error loading notification preferences:", error);
    return getDefaultPreferences(userId);
  }
}

export function updateNotificationPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>,
): void {
  try {
    const stored = localStorage.getItem(PREFERENCES_KEY);
    const allPreferences: NotificationPreferences[] = stored
      ? JSON.parse(stored)
      : [];

    const existingIndex = allPreferences.findIndex((p) => p.userId === userId);
    const updated: NotificationPreferences = {
      ...(existingIndex >= 0
        ? allPreferences[existingIndex]
        : getDefaultPreferences(userId)),
      ...preferences,
      userId,
    };

    if (existingIndex >= 0) {
      allPreferences[existingIndex] = updated;
    } else {
      allPreferences.push(updated);
    }

    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(allPreferences));
  } catch (error) {
    console.error("Error updating notification preferences:", error);
  }
}

function getDefaultPreferences(userId: string): NotificationPreferences {
  return {
    userId,
    enabledTypes: [
      "OFFER_RECEIVED",
      "OFFER_ACCEPTED",
      "OFFER_REJECTED",
      "COUNTER_OFFER_RECEIVED",
      "NEW_PROPERTY_MATCH",
      "LEAD_STATUS_CHANGE",
      "FOLLOW_UP_REMINDER",
      "VIEWING_SCHEDULED",
      "COMMISSION_EARNED",
      "PAYMENT_DUE",
    ],
    mutedPriorities: [],
    enableInApp: true,
    enableEmail: false,
    enableSMS: false,
    groupSimilar: true,
    autoArchiveAfterDays: 30,
    maxNotifications: 200,
  };
}

// ============================================================
// SMART NOTIFICATION GENERATORS
// ============================================================

export function notifyOfferReceived(
  userId: string,
  data: {
    propertyAddress: string;
    sellCycleId: string;
    buyerName: string;
    offerAmount: number;
    offerId: string;
  },
): Notification {
  return createNotification({
    userId,
    type: "OFFER_RECEIVED",
    priority: "HIGH",
    title: "New Offer Received",
    message: `${data.buyerName} made an offer of PKR ${data.offerAmount.toLocaleString()} on ${data.propertyAddress}`,
    entityType: "sellCycle",
    entityId: data.sellCycleId,
    actionLabel: "View Offer",
    actionType: "navigate",
    actionData: { sellCycleId: data.sellCycleId },
    metadata: { offerId: data.offerId, buyerName: data.buyerName },
    groupKey: `offers_${data.sellCycleId}`,
  });
}

export function notifyPropertyMatch(
  userId: string,
  data: {
    buyerRequirementId: string;
    buyerName: string;
    propertyAddress: string;
    propertyId: string;
    matchScore: number;
  },
): Notification {
  return createNotification({
    userId,
    type: "NEW_PROPERTY_MATCH",
    priority: "MEDIUM",
    title: "New Property Match Found",
    message: `Found a ${data.matchScore}% match for ${data.buyerName}'s requirements: ${data.propertyAddress}`,
    entityType: "buyerRequirement",
    entityId: data.buyerRequirementId,
    actionLabel: "View Match",
    actionType: "navigate",
    actionData: { buyerRequirementId: data.buyerRequirementId },
    metadata: { propertyId: data.propertyId, matchScore: data.matchScore },
    groupKey: `matches_${data.buyerRequirementId}`,
  });
}

export function notifyFollowUpReminder(
  userId: string,
  data: {
    leadId: string;
    leadName: string;
    leadContact: string;
    dueDate: string;
  },
): Notification {
  return createNotification({
    userId,
    type: "FOLLOW_UP_REMINDER",
    priority: "HIGH",
    title: "Follow-up Reminder",
    message: `Time to follow up with ${data.leadName} (${data.leadContact})`,
    entityType: "lead",
    entityId: data.leadId,
    actionLabel: "View Lead",
    actionType: "navigate",
    actionData: { leadId: data.leadId },
    metadata: { dueDate: data.dueDate },
  });
}

export function notifyRelistingOpportunity(
  userId: string,
  data: {
    propertyId: string;
    propertyAddress: string;
    soldDate: string;
  },
): Notification {
  return createNotification({
    userId,
    type: "RELISTING_OPPORTUNITY",
    priority: "MEDIUM",
    title: "Re-listing Opportunity",
    message: `${data.propertyAddress} is eligible for re-listing`,
    entityType: "property",
    entityId: data.propertyId,
    actionLabel: "View Property",
    actionType: "navigate",
    actionData: { propertyId: data.propertyId },
    metadata: { soldDate: data.soldDate },
  });
}

export function notifyCommissionEarned(
  userId: string,
  data: {
    amount: number;
    propertyAddress: string;
    transactionId: string;
    transactionType: "sale" | "rent";
  },
): Notification {
  return createNotification({
    userId,
    type: "COMMISSION_EARNED",
    priority: "HIGH",
    title: "Commission Earned",
    message: `You earned PKR ${data.amount.toLocaleString()} commission from ${data.propertyAddress}`,
    entityType: "transaction",
    entityId: data.transactionId,
    actionLabel: "View Details",
    actionType: "navigate",
    actionData: { transactionId: data.transactionId },
    metadata: { amount: data.amount, transactionType: data.transactionType },
  });
}

export function notifyLeadStatusChange(
  userId: string,
  data: {
    leadId: string;
    leadName: string;
    oldStatus: string;
    newStatus: string;
  },
): Notification {
  const priority = data.newStatus === "Closed" ? "HIGH" : "MEDIUM";

  return createNotification({
    userId,
    type: "LEAD_STATUS_CHANGE",
    priority,
    title: "Lead Status Updated",
    message: `${data.leadName} moved from ${data.oldStatus} to ${data.newStatus}`,
    entityType: "lead",
    entityId: data.leadId,
    actionLabel: "View Lead",
    actionType: "navigate",
    actionData: { leadId: data.leadId },
    metadata: { oldStatus: data.oldStatus, newStatus: data.newStatus },
  });
}

export function notifyOfferStatusChange(
  userId: string,
  data: {
    propertyAddress: string;
    status: "accepted" | "rejected" | "countered";
    sellCycleId: string;
    offerId: string;
  },
): Notification {
  const titles = {
    accepted: "Offer Accepted",
    rejected: "Offer Rejected",
    countered: "Counter Offer Received",
  };

  const messages = {
    accepted: `Your offer on ${data.propertyAddress} has been accepted!`,
    rejected: `Your offer on ${data.propertyAddress} was rejected`,
    countered: `You received a counter offer on ${data.propertyAddress}`,
  };

  return createNotification({
    userId,
    type:
      data.status === "accepted"
        ? "OFFER_ACCEPTED"
        : data.status === "rejected"
          ? "OFFER_REJECTED"
          : "COUNTER_OFFER_RECEIVED",
    priority: data.status === "accepted" ? "CRITICAL" : "HIGH",
    title: titles[data.status],
    message: messages[data.status],
    entityType: "sellCycle",
    entityId: data.sellCycleId,
    actionLabel: "View Details",
    actionType: "navigate",
    actionData: { sellCycleId: data.sellCycleId },
    metadata: { offerId: data.offerId, status: data.status },
  });
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

export function getUnreadCount(userId: string): number {
  const notifications = getNotifications(userId);
  return notifications.filter((n) => !n.read).length;
}

export function getRelativeTime(timestamp: string): string {
  const now = new Date();
  const notifTime = new Date(timestamp);
  const diffMs = now.getTime() - notifTime.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return notifTime.toLocaleDateString();
}

export function getPriorityColor(priority: NotificationPriority): string {
  const colors = {
    CRITICAL: "text-red-600 bg-red-50 border-red-200",
    HIGH: "text-orange-600 bg-orange-50 border-orange-200",
    MEDIUM: "text-blue-600 bg-blue-50 border-blue-200",
    LOW: "text-gray-600 bg-gray-50 border-gray-200",
  };
  return colors[priority];
}

export function getTypeIcon(type: NotificationType): string {
  // Return icon name from lucide-react
  const icons: Record<NotificationType, string> = {
    OFFER_RECEIVED: "DollarSign",
    OFFER_ACCEPTED: "CheckCircle",
    OFFER_REJECTED: "XCircle",
    COUNTER_OFFER_RECEIVED: "RefreshCw",
    OFFER_WITHDRAWN: "Undo",
    NEW_PROPERTY_MATCH: "Home",
    PROPERTY_STATUS_CHANGE: "Activity",
    RELISTING_OPPORTUNITY: "RotateCcw",
    PROPERTY_PRICE_CHANGE: "TrendingUp",
    NEW_LEAD_ASSIGNED: "UserPlus",
    LEAD_STATUS_CHANGE: "GitBranch",
    LEAD_CONVERTED: "Trophy",
    FOLLOW_UP_REMINDER: "Bell",
    VIEWING_SCHEDULED: "Calendar",
    VIEWING_FEEDBACK_RECEIVED: "MessageSquare",
    VIEWING_REMINDER: "Clock",
    COMMISSION_EARNED: "Coins",
    PAYMENT_DUE: "AlertCircle",
    PAYMENT_RECEIVED: "CheckCircle",
    BUDGET_ALERT: "AlertTriangle",
    DOCUMENT_UPLOADED: "FileText",
    DOCUMENT_APPROVAL_NEEDED: "FileCheck",
    DOCUMENT_APPROVED: "FileCheck",
    DOCUMENT_REJECTED: "FileX",
    REQUIREMENT_MATCHED: "Target",
    REQUIREMENT_STATUS_CHANGE: "Activity",
    DEAL_CREATED: "Briefcase",
    DEAL_PAYMENT_UPDATED: "CreditCard",
    DEAL_DOCUMENT_UPLOADED: "FileText",
    DEAL_STAGE_UPDATED: "Layer",
    DEAL_COMPLETED: "CheckCircle",
    DEAL_CANCELLED: "XCircle",
    SYSTEM_ALERT: "Info",
    USER_ADDED: "UserPlus",
    PERMISSION_CHANGE: "Shield",
    WORKSPACE_INVITATION: "Mail",
  };

  return icons[type] || "Bell";
}
