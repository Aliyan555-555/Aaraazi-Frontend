/**
 * Task Management Data Service (STUB)
 *
 * Stub implementation - no persistence, no localStorage.
 * All exports return empty/minimal values for compatibility.
 */

import {
  Task,
  TaskTemplate,
  TaskAutomationRule,
  TaskEntityType,
  TaskComment,
  TaskTimeEntry,
  AgentWorkload,
} from "../types/tasks";
import { User } from "../types";

export type { Task } from "../types/tasks";

function minimalTask(overrides: Partial<Task> = {}): Task {
  const now = new Date().toISOString();
  return {
    id: overrides.id ?? "stub",
    title: overrides.title ?? "Stub Task",
    description: overrides.description,
    agentId: overrides.agentId ?? "",
    assignedTo: overrides.assignedTo ?? [],
    createdBy: overrides.createdBy ?? "",
    dueDate: overrides.dueDate ?? now,
    completed: false,
    priority: "medium",
    status: "not-started",
    category: "follow-up",
    progress: 0,
    hasSubtasks: false,
    isRecurring: false,
    checklist: [],
    blockedBy: [],
    blocking: [],
    watchers: [],
    comments: [],
    timeEntries: [],
    attachments: [],
    reminders: [],
    tags: [],
    isTemplate: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function getAllTasks(_userId: string, _userRole: string): Task[] {
  return [];
}

export function getTaskById(_taskId: string): Task | null {
  return null;
}

export function createTask(
  taskData: Partial<Task>,
  user: User,
): Task {
  return minimalTask({
    ...taskData,
    agentId: taskData.agentId ?? user.id,
    assignedTo: taskData.assignedTo ?? [taskData.agentId ?? user.id],
    createdBy: user.id,
  });
}

export function updateTask(
  _taskId: string,
  updates: Partial<Task>,
  user: User,
): Task | null {
  return minimalTask({ ...updates, createdBy: user.id });
}

export function deleteTask(_taskId: string): boolean {
  return false;
}

export function getSubtasks(_parentTaskId: string): Task[] {
  return [];
}

export function addTaskComment(
  _taskId: string,
  comment: string,
  user: User,
): TaskComment {
  return {
    id: "stub",
    taskId: "",
    userId: user.id,
    userName: user.name,
    comment,
    createdAt: new Date().toISOString(),
  };
}

export function addTimeEntry(
  _taskId: string,
  entry: Omit<TaskTimeEntry, "id">,
  user: User,
): TaskTimeEntry {
  return {
    id: "stub",
    taskId: "",
    userId: user.id,
    userName: user.name,
    startTime: entry.startTime,
    endTime: entry.endTime,
    duration: entry.duration,
    notes: entry.notes,
    billable: entry.billable ?? false,
  };
}

export function updateChecklistItem(
  _taskId: string,
  _itemId: string,
  _completed: boolean,
  _user: User,
): boolean {
  return false;
}

export function getTasksByEntity(
  _entityType: TaskEntityType,
  _entityId: string,
): Task[] {
  return [];
}

export function getOverdueTasks(_userId: string, _userRole: string): Task[] {
  return [];
}

export function calculateAgentWorkload(
  agentId: string,
  agentName: string,
): AgentWorkload {
  return {
    agentId,
    agentName,
    totalTasks: 0,
    overdueTasks: 0,
    dueTodayTasks: 0,
    dueThisWeekTasks: 0,
    inProgressTasks: 0,
    urgentTasks: 0,
    highPriorityTasks: 0,
    totalEstimatedHours: 0,
    totalActualHours: 0,
    availableHours: 0,
    utilizationRate: 0,
    completedThisWeek: 0,
    completionRate: 0,
    avgCompletionTime: 0,
    workloadStatus: "light",
  };
}

export function createRecurringTaskInstance(
  parentTask: Task,
  user: User,
): Task {
  return minimalTask({
    ...parentTask,
    id: "stub",
    recurrenceParentId: parentTask.id,
    status: "not-started",
    completed: false,
    progress: 0,
    comments: [],
    timeEntries: [],
    attachments: [],
    createdBy: user.id,
  });
}

export function getTaskTemplates(): TaskTemplate[] {
  return [];
}

export function createTaskFromTemplate(
  _templateId: string,
  overrides: Partial<Task>,
  user: User,
): Task {
  return minimalTask({ ...overrides, createdBy: user.id });
}

export function getAutomationRules(): TaskAutomationRule[] {
  return [];
}

export function saveAutomationRules(_rules: TaskAutomationRule[]): void {
  // no-op
}

export function triggerAutomation(
  _trigger: TaskAutomationRule["trigger"],
  _entityData: unknown,
  _user: User,
): Task[] {
  return [];
}
