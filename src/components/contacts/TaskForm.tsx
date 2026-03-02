/**
 * TaskForm — Professional Grade
 * React Hook Form + Zod validation + real API via useTasks hooks.
 * Mirrors the prototype flow but backed by the live /tasks endpoint.
 */

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Badge } from '../ui/badge';
import {
  Phone,
  Calendar,
  Users,
  FileText,
  Home,
  Mail,
  Eye,
  ClipboardList,
} from 'lucide-react';
import {
  TaskFormSchema,
  TaskFormValues,
  taskFormDefaultValues,
  TASK_TYPE_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
} from './task-form.schema';
import { useCreateTask, useUpdateTask } from '@/hooks/useTasks';
import type { Task } from '@/services/tasks.service';

// ============================================================================
// Props
// ============================================================================

interface TaskFormProps {
  contactId: string;
  tenantId: string;
  agencyId: string;
  /** Pass existing task for edit mode */
  task?: Task;
  onSuccess: () => void;
  onCancel: () => void;
}

// ============================================================================
// Helpers
// ============================================================================

const TYPE_ICONS: Record<TaskFormValues['type'], React.ElementType> = {
  FOLLOW_UP: Phone,
  VIEWING: Home,
  MEETING: Users,
  DOCUMENT: FileText,
  CALL: Phone,
  EMAIL: Mail,
  INSPECTION: Eye,
  OTHER: Calendar,
};

const PRIORITY_COLORS: Record<TaskFormValues['priority'], string> = {
  LOW: 'bg-gray-400',
  MEDIUM: 'bg-yellow-400',
  HIGH: 'bg-orange-400',
  URGENT: 'bg-red-500',
};

function toFormValues(task: Task): TaskFormValues {
  return {
    title: task.title,
    description: task.description ?? '',
    type: task.type as TaskFormValues['type'],
    priority: task.priority as TaskFormValues['priority'],
    status: (task.status as TaskFormValues['status']) ?? 'PENDING',
    dueDate:
      typeof task.dueDate === 'string'
        ? task.dueDate.split('T')[0]
        : new Date(task.dueDate).toISOString().split('T')[0],
    assignedToId: task.assignedToId ?? '',
    propertyId: task.propertyListingId ?? '',
  };
}

// ============================================================================
// Component
// ============================================================================

export const TaskForm: React.FC<TaskFormProps> = ({
  contactId,
  tenantId,
  agencyId,
  task,
  onSuccess,
  onCancel,
}) => {
  const isEditMode = !!task;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(TaskFormSchema),
    defaultValues: task ? toFormValues(task) : taskFormDefaultValues,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const onSubmit = async (values: TaskFormValues) => {
    if (isEditMode && task) {
      await updateTask.mutateAsync({
        id: task.id,
        data: {
          title: values.title,
          description: values.description || undefined,
          type: values.type,
          priority: values.priority,
          status: values.status,
          dueDate: new Date(values.dueDate).toISOString(),
          assignedToId: values.assignedToId || undefined,
        },
      });
    } else {
      await createTask.mutateAsync({
        title: values.title,
        description: values.description || undefined,
        type: values.type,
        priority: values.priority,
        status: values.status,
        dueDate: new Date(values.dueDate).toISOString(),
        assignedToId: values.assignedToId || undefined,
        contactId,
        tenantId,
        agencyId,
      });
    }

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Task Title <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          placeholder="What needs to be done?"
          {...register('title')}
          aria-invalid={!!errors.title}
        />
        {errors.title && (
          <p className="text-sm text-red-500">{errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Additional details about this task…"
          rows={3}
          {...register('description')}
          aria-invalid={!!errors.description}
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>

      {/* Type + Priority */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">
            Task Type <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="type" aria-invalid={!!errors.type}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.keys(TASK_TYPE_LABELS) as TaskFormValues['type'][]
                  ).map((key) => {
                    const Icon = TYPE_ICONS[key];
                    return (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {TASK_TYPE_LABELS[key]}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          />
          {errors.type && (
            <p className="text-sm text-red-500">{errors.type.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">
            Priority <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="priority"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="priority" aria-invalid={!!errors.priority}>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.keys(
                      TASK_PRIORITY_LABELS,
                    ) as TaskFormValues['priority'][]
                  ).map((key) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${PRIORITY_COLORS[key]}`}
                        />
                        {TASK_PRIORITY_LABELS[key]}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.priority && (
            <p className="text-sm text-red-500">{errors.priority.message}</p>
          )}
        </div>
      </div>

      {/* Due Date + Status (status only shown in edit mode) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dueDate">
            Due Date <span className="text-red-500">*</span>
          </Label>
          <Input
            id="dueDate"
            type="date"
            {...register('dueDate')}
            aria-invalid={!!errors.dueDate}
          />
          {errors.dueDate && (
            <p className="text-sm text-red-500">{errors.dueDate.message}</p>
          )}
        </div>

        {isEditMode && (
          <div className="space-y-2">
            <Label htmlFor="status">
              Status <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TASK_STATUS_LABELS)
                      .filter(([key]) => key !== 'OVERDUE')
                      .map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        )}
      </div>

      {/* Assigned To (optional) */}
      <div className="space-y-2">
        <Label htmlFor="assignedToId" className="flex items-center gap-1">
          <ClipboardList className="h-3.5 w-3.5" />
          Assign To
          <Badge variant="secondary" className="ml-1 text-xs font-normal">
            optional
          </Badge>
        </Label>
        <Input
          id="assignedToId"
          placeholder="Agent ID (leave blank to assign to yourself)"
          {...register('assignedToId')}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting
            ? 'Saving…'
            : isEditMode
              ? 'Update Task'
              : 'Create Task'}
        </Button>
      </div>
    </form>
  );
};

export default TaskForm;
