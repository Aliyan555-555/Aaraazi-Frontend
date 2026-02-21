/**
 * Comprehensive Task Management Types
 *
 * ERP-standard task management with advanced features:
 * - Task dependencies
 * - Recurring tasks
 * - Task templates
 * - Subtasks
 * - Time tracking
 * - Automation rules
 */

import { CRMTask } from "./crm";

/**
 * Task Priority with numeric scoring
 */
export type TaskPriority = "urgent" | "high" | "medium" | "low";

/**
 * Task Status
 */
export type TaskStatus =
  | "not-started"
  | "in-progress"
  | "waiting"
  | "completed"
  | "cancelled"
  | "overdue";

/**
 * Task Category for organization
 */
export type TaskCategory =
  | "follow-up"
  | "viewing"
  | "documentation"
  | "negotiation"
  | "inspection"
  | "meeting"
  | "administrative"
  | "marketing"
  | "financial"
  | "legal"
  | "custom";

/**
 * Entity types that tasks can be linked to
 */
export type TaskEntityType =
  | "property"
  | "lead"
  | "contact"
  | "deal"
  | "sell-cycle"
  | "purchase-cycle"
  | "rent-cycle"
  | "buyer-requirement"
  | "rent-requirement"
  | "project";

/**
 * Recurrence pattern
 */
export type RecurrencePattern =
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "quarterly"
  | "yearly";

/**
 * Recurrence configuration
 */
export interface RecurrenceConfig {
  pattern: RecurrencePattern;
  interval: number; // e.g., every 2 weeks
  endDate?: string;
  endAfterOccurrences?: number;
  daysOfWeek?: number[]; // 0-6 for Sunday-Saturday
  dayOfMonth?: number;
}

/**
 * Task reminder
 */
export interface TaskReminder {
  id: string;
  taskId: string;
  type: "email" | "notification" | "sms";
  triggerBefore: number; // minutes before due date
  sent: boolean;
  sentAt?: string;
}

/**
 * Task dependency
 */
export interface TaskDependency {
  taskId: string; // The task that depends
  dependsOnTaskId: string; // The task it depends on
  type: "finish-to-start" | "start-to-start" | "finish-to-finish";
}

/**
 * Task comment/note
 */
export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  comment: string;
  createdAt: string;
}

/**
 * Task time entry
 */
export interface TaskTimeEntry {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  startTime: string;
  endTime?: string;
  duration?: number; // minutes
  notes?: string;
  billable: boolean;
}

/**
 * Task checklist item
 */
export interface TaskChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
}

/**
 * Task attachment
 */
export interface TaskAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
}

/**
 * Enhanced Task (extends CRMTask with advanced features)
 */
export interface Task extends Omit<
  CRMTask,
  "dueDate" | "priority" | "status"
> {
  // Enhanced fields
  priority: TaskPriority;
  status: TaskStatus;
  category: TaskCategory;

  // Dates (all as ISO strings)
  dueDate: string;
  startDate?: string;
  completedAt?: string;

  // Assignment
  agentId: string; // Primary assignee
  assignedTo: string[]; // Multiple assignees
  createdBy: string;

  // Progress tracking
  progress: number; // 0-100
  estimatedMinutes?: number;
  actualMinutes?: number;

  // Entity relationships
  entityType?: TaskEntityType;
  entityId?: string;
  entityName?: string;

  // Legacy compatibility
  contactId?: string;
  propertyId?: string;
  leadId?: string;
  dealId?: string;

  // Subtasks
  parentTaskId?: string;
  hasSubtasks: boolean;

  // Recurrence
  isRecurring: boolean;
  recurrenceConfig?: RecurrenceConfig;
  recurrenceParentId?: string;

  // Checklist
  checklist: TaskChecklistItem[];

  // Dependencies
  blockedBy: string[]; // Task IDs that must complete first
  blocking: string[]; // Task IDs that are waiting for this

  // Collaboration
  watchers: string[]; // User IDs watching this task
  comments: TaskComment[];

  // Time tracking
  timeEntries: TaskTimeEntry[];

  // Attachments
  attachments: TaskAttachment[];

  // Reminders
  reminders: TaskReminder[];

  // Tags for organization
  tags: string[];

  // Template
  isTemplate: boolean;
  templateName?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
  completedBy?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
}

/**
 * Task template for quick task creation
 */
export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  estimatedMinutes?: number;
  checklist: TaskChecklistItem[];
  tags: string[];
  defaultAssignee?: string;

  // For recurring templates
  recurrenceConfig?: RecurrenceConfig;

  // Template metadata
  usageCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean; // Available to all users or just creator
}

/**
 * Task automation rule
 */
export interface TaskAutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;

  // Trigger
  trigger: {
    type:
      | "entity-created" // When property/lead/deal is created
      | "entity-status-changed" // When status changes
      | "date-based" // Specific date or X days after
      | "manual" // Manually triggered
      | "payment-overdue"; // Payment overdue trigger

    entityType?: TaskEntityType;
    statusChange?: {
      from?: string;
      to: string;
    };
    dateOffset?: number; // Days offset from trigger date
  };

  // Conditions
  conditions?: {
    field: string;
    operator:
      | "equals"
      | "not-equals"
      | "contains"
      | "greater-than"
      | "less-than";
    value: any;
  }[];

  // Action: Create task
  taskTemplate: {
    title: string;
    description: string;
    category: TaskCategory;
    priority: TaskPriority;
    dueInDays: number; // Due X days from trigger
    assignTo: "creator" | "agent" | "specific-user";
    specificUserId?: string;
    tags: string[];
    checklist?: TaskChecklistItem[];
  };

  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastTriggered?: string;
  triggerCount: number;
}

/**
 * Task filter options
 */
export interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  category?: TaskCategory[];
  assignedTo?: string[];
  entityType?: TaskEntityType[];
  entityId?: string;
  tags?: string[];
  dueDateRange?: {
    start?: string;
    end?: string;
  };
  isOverdue?: boolean;
  hasSubtasks?: boolean;
  isRecurring?: boolean;
  search?: string;
}

/**
 * Task sort options
 */
export type TaskSortField =
  | "dueDate"
  | "priority"
  | "status"
  | "createdAt"
  | "title"
  | "progress";

export interface TaskSortOptions {
  field: TaskSortField;
  direction: "asc" | "desc";
}

/**
 * Task statistics
 */
export interface TaskStats {
  total: number;
  byStatus: Record<TaskStatus, number>;
  byPriority: Record<TaskPriority, number>;
  byCategory: Record<TaskCategory, number>;
  overdue: number;
  dueToday: number;
  dueThisWeek: number;
  completionRate: number;
  avgCompletionTime: number; // in hours
  totalTimeTracked: number; // in hours
}

/**
 * Task board column (for Kanban view)
 */
export interface TaskBoardColumn {
  id: string;
  title: string;
  status: TaskStatus;
  tasks: Task[];
  limit?: number; // WIP limit
}

/**
 * Task calendar event
 */
export interface TaskCalendarEvent {
  id: string;
  taskId: string;
  title: string;
  start: Date;
  end?: Date;
  priority: TaskPriority;
  status: TaskStatus;
  assignedTo: string[];
}

/**
 * Bulk task operation
 */
export interface BulkTaskOperation {
  taskIds: string[];
  operation:
    | "update-status"
    | "update-priority"
    | "assign"
    | "add-tags"
    | "remove-tags"
    | "delete"
    | "complete"
    | "duplicate";

  payload?: {
    status?: TaskStatus;
    priority?: TaskPriority;
    assignTo?: string[];
    tags?: string[];
  };
}

/**
 * Task activity log entry
 */
export interface TaskActivity {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  action:
    | "created"
    | "updated"
    | "completed"
    | "cancelled"
    | "assigned"
    | "comment-added"
    | "attachment-added"
    | "checklist-updated"
    | "time-logged"
    | "status-changed"
    | "priority-changed";

  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];

  metadata?: any;
  timestamp: string;
}

/**
 * Task workload summary (for agent)
 */
export interface AgentWorkload {
  agentId: string;
  agentName: string;

  // Task counts
  totalTasks: number;
  overdueTasks: number;
  dueTodayTasks: number;
  dueThisWeekTasks: number;
  inProgressTasks: number;

  // Priority breakdown
  urgentTasks: number;
  highPriorityTasks: number;

  // Time metrics
  totalEstimatedHours: number;
  totalActualHours: number;
  availableHours: number;
  utilizationRate: number; // percentage

  // Completion metrics
  completedThisWeek: number;
  completionRate: number;
  avgCompletionTime: number; // hours

  // Status
  workloadStatus: "light" | "moderate" | "heavy" | "overloaded";
}
