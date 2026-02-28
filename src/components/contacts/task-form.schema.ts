import { z } from 'zod';

// ============================================================================
// Enum schemas (matching backend Prisma enums)
// ============================================================================

export const TaskTypeSchema = z.enum(
  ['FOLLOW_UP', 'VIEWING', 'MEETING', 'DOCUMENT', 'CALL', 'EMAIL', 'INSPECTION', 'OTHER'],
  { required_error: 'Task type is required' },
);

export const TaskPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'], {
  required_error: 'Priority is required',
});

export const TaskStatusSchema = z.enum(
  ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE'],
  { required_error: 'Status is required' },
);

// ============================================================================
// Main Task Form Schema
// ============================================================================

export const TaskFormSchema = z.object({
  title: z
    .string({ required_error: 'Task title is required' })
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters')
    .trim(),

  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .or(z.literal('')),

  type: TaskTypeSchema,

  priority: TaskPrioritySchema,

  status: TaskStatusSchema.optional(),

  /** ISO date string YYYY-MM-DD from the date picker */
  dueDate: z
    .string({ required_error: 'Due date is required' })
    .min(1, 'Due date is required'),

  /** Agent to assign the task to (empty = assign to self) */
  assignedToId: z.string().optional().or(z.literal('')),

  propertyId: z.string().optional().or(z.literal('')),
});

// ============================================================================
// Derived types
// ============================================================================

export type TaskFormValues = z.infer<typeof TaskFormSchema>;

/** Default due date: tomorrow */
function tomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

export const taskFormDefaultValues: TaskFormValues = {
  title: '',
  description: '',
  type: 'FOLLOW_UP',
  priority: 'MEDIUM',
  status: 'PENDING',
  dueDate: tomorrowISO(),
  assignedToId: '',
  propertyId: '',
};

// ============================================================================
// Human-readable labels for dropdowns
// ============================================================================

export const TASK_TYPE_LABELS: Record<TaskFormValues['type'], string> = {
  FOLLOW_UP: 'Follow-up',
  VIEWING: 'Property Viewing',
  MEETING: 'Meeting',
  DOCUMENT: 'Document',
  CALL: 'Phone Call',
  EMAIL: 'Email',
  INSPECTION: 'Inspection',
  OTHER: 'Other',
};

export const TASK_PRIORITY_LABELS: Record<TaskFormValues['priority'], string> =
  {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    URGENT: 'Urgent',
  };

export const TASK_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  OVERDUE: 'Overdue',
};
