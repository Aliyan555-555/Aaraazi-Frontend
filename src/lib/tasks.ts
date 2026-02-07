/**
 * Task Management Data Service
 * 
 * Handles all task-related data operations including:
 * - CRUD operations
 * - Task dependencies
 * - Recurring tasks
 * - Time tracking
 * - Task automation
 * - Workload calculations
 */

import { TaskV4, TaskTemplate, TaskAutomationRule, TaskStatus, TaskPriority, TaskCategory, TaskEntityType, AgentWorkload, RecurrenceConfig, TaskChecklistItem, TaskComment, TaskTimeEntry, TaskActivity } from '../types/tasks';
import { User } from '../types';

const STORAGE_KEY = 'aaraazi_tasks_v4';
const TEMPLATES_KEY = 'aaraazi_task_templates';
const AUTOMATION_KEY = 'aaraazi_task_automation';

/**
 * Generate unique ID
 */
function generateId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get all tasks
 */
export function getAllTasksV4(userId: string, userRole: string): TaskV4[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const allTasks: TaskV4[] = JSON.parse(data);
    
    // Filter based on user role
    if (userRole === 'admin') {
      return allTasks;
    }
    
    // Agents see only their tasks or tasks they're watching
    return allTasks.filter(task => 
      task.agentId === userId || 
      task.assignedTo.includes(userId) ||
      task.watchers.includes(userId) ||
      task.createdBy === userId
    );
  } catch (error) {
    console.error('Error loading tasks:', error);
    return [];
  }
}

/**
 * Get task by ID
 */
export function getTaskById(taskId: string): TaskV4 | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    
    const tasks: TaskV4[] = JSON.parse(data);
    return tasks.find(t => t.id === taskId) || null;
  } catch (error) {
    console.error('Error loading task:', error);
    return null;
  }
}

/**
 * Create new task
 */
export function createTask(taskData: Partial<TaskV4>, user: User): TaskV4 {
  const now = new Date().toISOString();
  
  const newTask: TaskV4 = {
    id: generateId(),
    title: taskData.title || 'New Task',
    description: taskData.description,
    agentId: taskData.agentId || user.id,
    assignedTo: taskData.assignedTo || [taskData.agentId || user.id],
    createdBy: user.id,
    dueDate: taskData.dueDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    startDate: taskData.startDate,
    completed: false,
    completedAt: undefined,
    priority: taskData.priority || 'medium',
    status: taskData.status || 'not-started',
    category: taskData.category || 'follow-up',
    progress: 0,
    estimatedMinutes: taskData.estimatedMinutes,
    actualMinutes: 0,
    entityType: taskData.entityType,
    entityId: taskData.entityId,
    entityName: taskData.entityName,
    contactId: taskData.contactId,
    propertyId: taskData.propertyId,
    leadId: taskData.leadId,
    dealId: taskData.dealId,
    parentTaskId: taskData.parentTaskId,
    hasSubtasks: false,
    isRecurring: taskData.isRecurring || false,
    recurrenceConfig: taskData.recurrenceConfig,
    recurrenceParentId: taskData.recurrenceParentId,
    checklist: taskData.checklist || [],
    blockedBy: taskData.blockedBy || [],
    blocking: taskData.blocking || [],
    watchers: taskData.watchers || [],
    comments: [],
    timeEntries: [],
    attachments: [],
    reminders: [],
    tags: taskData.tags || [],
    isTemplate: false,
    createdAt: now,
    updatedAt: now,
  };
  
  // Save to storage
  const tasks = getAllTasksV4(user.id, user.role);
  tasks.push(newTask);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  
  // Log activity
  logTaskActivity(newTask.id, user.id, user.name, 'created');
  
  return newTask;
}

/**
 * Update task
 */
export function updateTask(taskId: string, updates: Partial<TaskV4>, user: User): TaskV4 | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    
    const tasks: TaskV4[] = JSON.parse(data);
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) return null;
    
    const oldTask = tasks[taskIndex];
    const now = new Date().toISOString();
    
    // Track changes for activity log
    const changes: { field: string; oldValue: any; newValue: any }[] = [];
    
    Object.keys(updates).forEach(key => {
      if (oldTask[key as keyof TaskV4] !== updates[key as keyof TaskV4]) {
        changes.push({
          field: key,
          oldValue: oldTask[key as keyof TaskV4],
          newValue: updates[key as keyof TaskV4],
        });
      }
    });
    
    // Update task
    const updatedTask: TaskV4 = {
      ...oldTask,
      ...updates,
      updatedAt: now,
    };
    
    // Special handling for completion
    if (updates.status === 'completed' && oldTask.status !== 'completed') {
      updatedTask.completed = true;
      updatedTask.completedAt = now;
      updatedTask.completedBy = user.id;
      updatedTask.progress = 100;
      
      logTaskActivity(taskId, user.id, user.name, 'completed');
    }
    
    // Special handling for cancellation
    if (updates.status === 'cancelled' && oldTask.status !== 'cancelled') {
      updatedTask.cancelledAt = now;
      updatedTask.cancelledBy = user.id;
      
      logTaskActivity(taskId, user.id, user.name, 'cancelled');
    }
    
    tasks[taskIndex] = updatedTask;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    
    // Log changes
    if (changes.length > 0) {
      logTaskActivity(taskId, user.id, user.name, 'updated', { changes });
    }
    
    return updatedTask;
  } catch (error) {
    console.error('Error updating task:', error);
    return null;
  }
}

/**
 * Delete task
 */
export function deleteTask(taskId: string): boolean {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return false;
    
    const tasks: TaskV4[] = JSON.parse(data);
    const filtered = tasks.filter(t => t.id !== taskId && t.parentTaskId !== taskId);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting task:', error);
    return false;
  }
}

/**
 * Get subtasks
 */
export function getSubtasks(parentTaskId: string): TaskV4[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const tasks: TaskV4[] = JSON.parse(data);
    return tasks.filter(t => t.parentTaskId === parentTaskId);
  } catch (error) {
    console.error('Error loading subtasks:', error);
    return [];
  }
}

/**
 * Add comment to task
 */
export function addTaskComment(taskId: string, comment: string, user: User): TaskComment {
  const newComment: TaskComment = {
    id: generateId(),
    taskId,
    userId: user.id,
    userName: user.name,
    comment,
    createdAt: new Date().toISOString(),
  };
  
  const task = getTaskById(taskId);
  if (task) {
    task.comments.push(newComment);
    updateTask(taskId, { comments: task.comments }, user);
    
    logTaskActivity(taskId, user.id, user.name, 'comment-added', { comment: newComment });
  }
  
  return newComment;
}

/**
 * Add time entry
 */
export function addTimeEntry(taskId: string, entry: Omit<TaskTimeEntry, 'id'>, user: User): TaskTimeEntry {
  const newEntry: TaskTimeEntry = {
    id: generateId(),
    ...entry,
  };
  
  const task = getTaskById(taskId);
  if (task) {
    task.timeEntries.push(newEntry);
    
    // Update actual minutes
    const totalMinutes = task.timeEntries.reduce((sum, e) => sum + (e.duration || 0), 0);
    updateTask(taskId, { 
      timeEntries: task.timeEntries,
      actualMinutes: totalMinutes,
    }, user);
    
    logTaskActivity(taskId, user.id, user.name, 'time-logged', { entry: newEntry });
  }
  
  return newEntry;
}

/**
 * Update checklist item
 */
export function updateChecklistItem(
  taskId: string, 
  itemId: string, 
  completed: boolean,
  user: User
): boolean {
  const task = getTaskById(taskId);
  if (!task) return false;
  
  const itemIndex = task.checklist.findIndex(item => item.id === itemId);
  if (itemIndex === -1) return false;
  
  task.checklist[itemIndex].completed = completed;
  if (completed) {
    task.checklist[itemIndex].completedAt = new Date().toISOString();
    task.checklist[itemIndex].completedBy = user.id;
  } else {
    task.checklist[itemIndex].completedAt = undefined;
    task.checklist[itemIndex].completedBy = undefined;
  }
  
  // Update progress based on checklist
  const completedItems = task.checklist.filter(item => item.completed).length;
  const totalItems = task.checklist.length;
  const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : task.progress;
  
  updateTask(taskId, { 
    checklist: task.checklist,
    progress,
  }, user);
  
  logTaskActivity(taskId, user.id, user.name, 'checklist-updated');
  
  return true;
}

/**
 * Get tasks by entity
 */
export function getTasksByEntity(entityType: TaskEntityType, entityId: string): TaskV4[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const tasks: TaskV4[] = JSON.parse(data);
    return tasks.filter(t => t.entityType === entityType && t.entityId === entityId);
  } catch (error) {
    console.error('Error loading entity tasks:', error);
    return [];
  }
}

/**
 * Get overdue tasks
 */
export function getOverdueTasks(userId: string, userRole: string): TaskV4[] {
  const tasks = getAllTasksV4(userId, userRole);
  const now = new Date();
  
  return tasks.filter(task => {
    if (task.status === 'completed' || task.status === 'cancelled') return false;
    const dueDate = new Date(task.dueDate);
    return dueDate < now;
  });
}

/**
 * Calculate agent workload
 */
export function calculateAgentWorkload(agentId: string, agentName: string): AgentWorkload {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
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
      availableHours: 40, // Default 40 hours per week
      utilizationRate: 0,
      completedThisWeek: 0,
      completionRate: 0,
      avgCompletionTime: 0,
      workloadStatus: 'light',
    };
  }
  
  const allTasks: TaskV4[] = JSON.parse(data);
  const agentTasks = allTasks.filter(t => t.agentId === agentId || t.assignedTo.includes(agentId));
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(today);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);
  
  let overdue = 0;
  let dueToday = 0;
  let dueThisWeek = 0;
  let inProgress = 0;
  let urgent = 0;
  let high = 0;
  let totalEstimatedMinutes = 0;
  let totalActualMinutes = 0;
  let completedThisWeek = 0;
  let totalCompleted = 0;
  let completionTimeSum = 0;
  let completionCount = 0;
  
  agentTasks.forEach(task => {
    const dueDate = new Date(task.dueDate);
    
    // Overdue
    if (task.status !== 'completed' && task.status !== 'cancelled' && dueDate < now) {
      overdue++;
    }
    
    // Due today
    if (dueDate >= today && dueDate < new Date(today.getTime() + 24 * 60 * 60 * 1000)) {
      dueToday++;
    }
    
    // Due this week
    if (dueDate >= startOfWeek && dueDate < endOfWeek) {
      dueThisWeek++;
    }
    
    // In progress
    if (task.status === 'in-progress') {
      inProgress++;
    }
    
    // Priority
    if (task.priority === 'urgent') urgent++;
    if (task.priority === 'high') high++;
    
    // Time estimates
    if (task.estimatedMinutes) {
      totalEstimatedMinutes += task.estimatedMinutes;
    }
    if (task.actualMinutes) {
      totalActualMinutes += task.actualMinutes;
    }
    
    // Completed this week
    if (task.status === 'completed' && task.completedAt) {
      totalCompleted++;
      const completedDate = new Date(task.completedAt);
      if (completedDate >= startOfWeek && completedDate < endOfWeek) {
        completedThisWeek++;
      }
      
      // Completion time
      const created = new Date(task.createdAt);
      const completed = new Date(task.completedAt);
      completionTimeSum += (completed.getTime() - created.getTime()) / (1000 * 60 * 60); // hours
      completionCount++;
    }
  });
  
  const totalEstimatedHours = totalEstimatedMinutes / 60;
  const totalActualHours = totalActualMinutes / 60;
  const availableHours = 40; // Assuming 40 hours per week
  const utilizationRate = availableHours > 0 ? (totalEstimatedHours / availableHours) * 100 : 0;
  const completionRate = agentTasks.length > 0 ? (totalCompleted / agentTasks.length) * 100 : 0;
  const avgCompletionTime = completionCount > 0 ? completionTimeSum / completionCount : 0;
  
  // Determine workload status
  let workloadStatus: 'light' | 'moderate' | 'heavy' | 'overloaded' = 'light';
  if (utilizationRate > 100) workloadStatus = 'overloaded';
  else if (utilizationRate > 80) workloadStatus = 'heavy';
  else if (utilizationRate > 50) workloadStatus = 'moderate';
  
  return {
    agentId,
    agentName,
    totalTasks: agentTasks.length,
    overdueTasks: overdue,
    dueTodayTasks: dueToday,
    dueThisWeekTasks: dueThisWeek,
    inProgressTasks: inProgress,
    urgentTasks: urgent,
    highPriorityTasks: high,
    totalEstimatedHours,
    totalActualHours,
    availableHours,
    utilizationRate,
    completedThisWeek,
    completionRate,
    avgCompletionTime,
    workloadStatus,
  };
}

/**
 * Create recurring task instance
 */
export function createRecurringTaskInstance(parentTask: TaskV4, user: User): TaskV4 {
  if (!parentTask.recurrenceConfig) {
    throw new Error('Task is not recurring');
  }
  
  const config = parentTask.recurrenceConfig;
  const lastDueDate = new Date(parentTask.dueDate);
  let nextDueDate = new Date(lastDueDate);
  
  // Calculate next due date based on pattern
  switch (config.pattern) {
    case 'daily':
      nextDueDate.setDate(nextDueDate.getDate() + config.interval);
      break;
    case 'weekly':
      nextDueDate.setDate(nextDueDate.getDate() + (7 * config.interval));
      break;
    case 'biweekly':
      nextDueDate.setDate(nextDueDate.getDate() + (14 * config.interval));
      break;
    case 'monthly':
      nextDueDate.setMonth(nextDueDate.getMonth() + config.interval);
      break;
    case 'quarterly':
      nextDueDate.setMonth(nextDueDate.getMonth() + (3 * config.interval));
      break;
    case 'yearly':
      nextDueDate.setFullYear(nextDueDate.getFullYear() + config.interval);
      break;
  }
  
  // Check if we should create this instance
  if (config.endDate && nextDueDate > new Date(config.endDate)) {
    throw new Error('Recurrence has ended');
  }
  
  // Create new task instance
  const newTask = createTask({
    ...parentTask,
    id: undefined, // Generate new ID
    dueDate: nextDueDate.toISOString(),
    status: 'not-started',
    completed: false,
    completedAt: undefined,
    progress: 0,
    recurrenceParentId: parentTask.id,
    comments: [],
    timeEntries: [],
    attachments: [],
  }, user);
  
  return newTask;
}

/**
 * Log task activity
 */
function logTaskActivity(
  taskId: string,
  userId: string,
  userName: string,
  action: TaskActivity['action'],
  metadata?: any
): void {
  // For now, just console log
  // In production, this would save to a separate activity log
  console.log(`Task Activity: ${action}`, { taskId, userId, userName, metadata });
}

/**
 * Get task templates
 */
export function getTaskTemplates(): TaskTemplate[] {
  try {
    const data = localStorage.getItem(TEMPLATES_KEY);
    return data ? JSON.parse(data) : getDefaultTemplates();
  } catch (error) {
    console.error('Error loading templates:', error);
    return getDefaultTemplates();
  }
}

/**
 * Default task templates
 */
function getDefaultTemplates(): TaskTemplate[] {
  return [
    {
      id: 'template_follow_up',
      name: 'Follow-up Call',
      description: 'Follow up with a lead or contact',
      category: 'follow-up',
      priority: 'medium',
      estimatedMinutes: 15,
      checklist: [
        { id: '1', title: 'Review previous conversation notes', completed: false },
        { id: '2', title: 'Make the call', completed: false },
        { id: '3', title: 'Update CRM with notes', completed: false },
        { id: '4', title: 'Schedule next follow-up if needed', completed: false },
      ],
      tags: ['follow-up', 'call'],
      usageCount: 0,
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublic: true,
    },
    {
      id: 'template_property_viewing',
      name: 'Property Viewing',
      description: 'Schedule and conduct property viewing',
      category: 'viewing',
      priority: 'high',
      estimatedMinutes: 60,
      checklist: [
        { id: '1', title: 'Confirm viewing time with client', completed: false },
        { id: '2', title: 'Arrange property access', completed: false },
        { id: '3', title: 'Prepare property information', completed: false },
        { id: '4', title: 'Conduct viewing', completed: false },
        { id: '5', title: 'Collect feedback', completed: false },
        { id: '6', title: 'Send follow-up', completed: false },
      ],
      tags: ['viewing', 'property'],
      usageCount: 0,
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublic: true,
    },
    {
      id: 'template_documentation',
      name: 'Document Collection',
      description: 'Collect required documents for transaction',
      category: 'documentation',
      priority: 'high',
      estimatedMinutes: 120,
      checklist: [
        { id: '1', title: 'Request CNIC copies', completed: false },
        { id: '2', title: 'Request property documents', completed: false },
        { id: '3', title: 'Verify ownership documents', completed: false },
        { id: '4', title: 'Collect NOC if required', completed: false },
        { id: '5', title: 'Prepare file for legal review', completed: false },
      ],
      tags: ['documentation', 'legal'],
      usageCount: 0,
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublic: true,
    },
  ];
}

/**
 * Create task from template
 */
export function createTaskFromTemplate(
  templateId: string,
  overrides: Partial<TaskV4>,
  user: User
): TaskV4 {
  const templates = getTaskTemplates();
  const template = templates.find(t => t.id === templateId);
  
  if (!template) {
    throw new Error('Template not found');
  }
  
  // Update usage count
  template.usageCount++;
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  
  // Create task from template
  return createTask({
    title: template.name,
    description: template.description,
    category: template.category,
    priority: template.priority,
    estimatedMinutes: template.estimatedMinutes,
    checklist: template.checklist.map(item => ({ ...item, id: generateId() })),
    tags: template.tags,
    ...overrides,
  }, user);
}

/**
 * Get automation rules
 */
export function getAutomationRules(): TaskAutomationRule[] {
  try {
    const data = localStorage.getItem(AUTOMATION_KEY);
    if (!data) {
      // Initialize with default rules if none exist
      const defaultRules = getDefaultAutomationRules();
      localStorage.setItem(AUTOMATION_KEY, JSON.stringify(defaultRules));
      return defaultRules;
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading automation rules:', error);
    return [];
  }
}

/**
 * Save automation rules
 */
export function saveAutomationRules(rules: TaskAutomationRule[]): void {
  try {
    localStorage.setItem(AUTOMATION_KEY, JSON.stringify(rules));
  } catch (error) {
    console.error('Error saving automation rules:', error);
  }
}

/**
 * Get default automation rules for common workflows
 */
function getDefaultAutomationRules(): TaskAutomationRule[] {
  const now = new Date().toISOString();
  
  return [
    // ==================== LEAD AUTOMATION ====================
    {
      id: 'auto_lead_created_first_contact',
      name: 'First Contact - New Lead',
      description: 'Automatically create first contact task when a new lead is created',
      enabled: true,
      trigger: {
        type: 'entity-created',
        entityType: 'lead',
      },
      taskTemplate: {
        title: 'First Contact - Call Lead',
        description: 'Make initial contact with the new lead within 2 hours. Introduce yourself, understand their requirements, and build rapport.',
        category: 'follow-up',
        priority: 'urgent',
        dueInDays: 0, // Due today (within 2 hours ideally)
        assignTo: 'agent',
        tags: ['first-contact', 'lead', 'urgent'],
        checklist: [
          { id: '1', title: 'Review lead information and source', completed: false },
          { id: '2', title: 'Call the lead', completed: false },
          { id: '3', title: 'Log interaction in system', completed: false },
          { id: '4', title: 'Schedule follow-up if needed', completed: false },
        ],
      },
      createdBy: 'system',
      createdAt: now,
      updatedAt: now,
      triggerCount: 0,
    },
    {
      id: 'auto_lead_qualified_requirement',
      name: 'Send Requirements - Qualified Lead',
      description: 'Create task to send detailed requirement form when lead is qualified',
      enabled: true,
      trigger: {
        type: 'entity-status-changed',
        entityType: 'lead',
        statusChange: {
          to: 'qualified',
        },
      },
      taskTemplate: {
        title: 'Send Detailed Requirements Form',
        description: 'Lead has been qualified. Send them the detailed requirements form to capture exact specifications.',
        category: 'follow-up',
        priority: 'high',
        dueInDays: 1,
        assignTo: 'agent',
        tags: ['qualified', 'requirements'],
        checklist: [
          { id: '1', title: 'Prepare requirements form', completed: false },
          { id: '2', title: 'Send form via WhatsApp/Email', completed: false },
          { id: '3', title: 'Follow up to ensure form is filled', completed: false },
        ],
      },
      createdBy: 'system',
      createdAt: now,
      updatedAt: now,
      triggerCount: 0,
    },
    
    // ==================== DEAL AUTOMATION ====================
    {
      id: 'auto_deal_created_agreement',
      name: 'Prepare Agreement - New Deal',
      description: 'Create task to prepare sale agreement when new deal is created',
      enabled: true,
      trigger: {
        type: 'entity-created',
        entityType: 'deal',
      },
      taskTemplate: {
        title: 'Prepare Sale Agreement',
        description: 'Prepare the sale agreement document with all terms and conditions.',
        category: 'documentation',
        priority: 'high',
        dueInDays: 2,
        assignTo: 'agent',
        tags: ['deal', 'agreement', 'documentation'],
        checklist: [
          { id: '1', title: 'Gather buyer and seller information', completed: false },
          { id: '2', title: 'Draft agreement with terms', completed: false },
          { id: '3', title: 'Get legal review if needed', completed: false },
          { id: '4', title: 'Send to both parties for review', completed: false },
        ],
      },
      createdBy: 'system',
      createdAt: now,
      updatedAt: now,
      triggerCount: 0,
    },
    {
      id: 'auto_deal_documentation_stage',
      name: 'Collect Documents - Documentation Stage',
      description: 'Create document collection task when deal reaches documentation stage',
      enabled: true,
      trigger: {
        type: 'entity-status-changed',
        entityType: 'deal',
        statusChange: {
          to: 'documentation',
        },
      },
      taskTemplate: {
        title: 'Collect Required Documents',
        description: 'Collect all required documents from buyer and seller for the transaction.',
        category: 'documentation',
        priority: 'high',
        dueInDays: 3,
        assignTo: 'agent',
        tags: ['deal', 'documents', 'compliance'],
        checklist: [
          { id: '1', title: 'Collect buyer CNIC and documents', completed: false },
          { id: '2', title: 'Collect seller ownership documents', completed: false },
          { id: '3', title: 'Verify NOC if required', completed: false },
          { id: '4', title: 'Prepare file for registration', completed: false },
        ],
      },
      createdBy: 'system',
      createdAt: now,
      updatedAt: now,
      triggerCount: 0,
    },
    {
      id: 'auto_deal_payment_overdue',
      name: 'Follow Up - Payment Overdue',
      description: 'Create urgent follow-up task when deal payment is overdue',
      enabled: true,
      trigger: {
        type: 'payment-overdue',
        entityType: 'deal',
      },
      taskTemplate: {
        title: 'URGENT: Follow Up on Overdue Payment',
        description: 'Payment is overdue. Contact buyer immediately to resolve.',
        category: 'follow-up',
        priority: 'urgent',
        dueInDays: 0,
        assignTo: 'agent',
        tags: ['payment', 'overdue', 'urgent'],
      },
      createdBy: 'system',
      createdAt: now,
      updatedAt: now,
      triggerCount: 0,
    },
    
    // ==================== PROPERTY AUTOMATION ====================
    {
      id: 'auto_property_listed_viewing_prep',
      name: 'Viewing Preparation - Property Listed',
      description: 'Create viewing preparation task when property becomes available',
      enabled: true,
      trigger: {
        type: 'entity-status-changed',
        entityType: 'property',
        statusChange: {
          to: 'available',
        },
      },
      taskTemplate: {
        title: 'Prepare Property for Viewings',
        description: 'Ensure property is ready for potential buyer viewings.',
        category: 'viewing',
        priority: 'medium',
        dueInDays: 1,
        assignTo: 'agent',
        tags: ['property', 'viewing', 'preparation'],
        checklist: [
          { id: '1', title: 'Verify property access/keys', completed: false },
          { id: '2', title: 'Take high-quality photos', completed: false },
          { id: '3', title: 'Prepare property information sheet', completed: false },
          { id: '4', title: 'Notify owner of listing', completed: false },
        ],
      },
      createdBy: 'system',
      createdAt: now,
      updatedAt: now,
      triggerCount: 0,
    },
    {
      id: 'auto_property_under_offer',
      name: 'Process Offer - Property Under Offer',
      description: 'Create task to process offer when property status changes to under-offer',
      enabled: true,
      trigger: {
        type: 'entity-status-changed',
        entityType: 'property',
        statusChange: {
          to: 'under-offer',
        },
      },
      taskTemplate: {
        title: 'Process Property Offer',
        description: 'Review and process the offer on the property.',
        category: 'negotiation',
        priority: 'high',
        dueInDays: 1,
        assignTo: 'agent',
        tags: ['property', 'offer', 'negotiation'],
        checklist: [
          { id: '1', title: 'Review offer details', completed: false },
          { id: '2', title: 'Discuss with seller', completed: false },
          { id: '3', title: 'Negotiate if needed', completed: false },
          { id: '4', title: 'Finalize acceptance or rejection', completed: false },
        ],
      },
      createdBy: 'system',
      createdAt: now,
      updatedAt: now,
      triggerCount: 0,
    },
    
    // ==================== CONTACT AUTOMATION ====================
    {
      id: 'auto_contact_vip_checkin',
      name: 'Monthly Check-in - VIP Contact',
      description: 'Create monthly check-in task for VIP contacts',
      enabled: true,
      trigger: {
        type: 'entity-created',
        entityType: 'contact',
      },
      conditions: [
        {
          field: 'category',
          operator: 'equals',
          value: 'investor',
        },
      ],
      taskTemplate: {
        title: 'Monthly VIP Contact Check-in',
        description: 'Regular check-in with VIP investor contact to maintain relationship.',
        category: 'follow-up',
        priority: 'medium',
        dueInDays: 30,
        assignTo: 'agent',
        tags: ['vip', 'relationship', 'investor'],
      },
      createdBy: 'system',
      createdAt: now,
      updatedAt: now,
      triggerCount: 0,
    },
  ];
}

/**
 * Trigger automation rules
 */
export function triggerAutomation(
  trigger: TaskAutomationRule['trigger'],
  entityData: any,
  user: User
): TaskV4[] {
  const rules = getAutomationRules().filter(r => r.enabled);
  const createdTasks: TaskV4[] = [];
  
  rules.forEach(rule => {
    // Check if trigger matches
    if (rule.trigger.type !== trigger.type) return;
    if (rule.trigger.entityType && rule.trigger.entityType !== trigger.entityType) return;
    
    // Check conditions
    if (rule.conditions) {
      const allConditionsMet = rule.conditions.every(condition => {
        const value = entityData[condition.field];
        
        switch (condition.operator) {
          case 'equals':
            return value === condition.value;
          case 'not-equals':
            return value !== condition.value;
          case 'contains':
            return String(value).includes(condition.value);
          case 'greater-than':
            return Number(value) > Number(condition.value);
          case 'less-than':
            return Number(value) < Number(condition.value);
          default:
            return false;
        }
      });
      
      if (!allConditionsMet) return;
    }
    
    // Create task
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + rule.taskTemplate.dueInDays);
    
    let assignee = user.id;
    if (rule.taskTemplate.assignTo === 'specific-user' && rule.taskTemplate.specificUserId) {
      assignee = rule.taskTemplate.specificUserId;
    } else if (rule.taskTemplate.assignTo === 'agent' && entityData.agentId) {
      assignee = entityData.agentId;
    }
    
    const task = createTask({
      title: rule.taskTemplate.title,
      description: rule.taskTemplate.description,
      category: rule.taskTemplate.category,
      priority: rule.taskTemplate.priority,
      dueDate: dueDate.toISOString(),
      agentId: assignee,
      assignedTo: [assignee],
      tags: rule.taskTemplate.tags,
      checklist: rule.taskTemplate.checklist || [],
      entityType: trigger.entityType,
      entityId: entityData.id,
      entityName: entityData.name || entityData.title,
    }, user);
    
    createdTasks.push(task);
    
    // Update rule trigger count
    rule.lastTriggered = new Date().toISOString();
    rule.triggerCount++;
  });
  
  // Save updated rules
  if (createdTasks.length > 0) {
    localStorage.setItem(AUTOMATION_KEY, JSON.stringify(rules));
  }
  
  return createdTasks;
}