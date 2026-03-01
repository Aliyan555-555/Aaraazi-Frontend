'use client';

/**
 * Task hooks powered by Zustand — replaces React Query
 */

import { useEffect } from 'react';
import { useTasksStore } from '@/stores/tasks.store';
import type {
  CreateTaskDto,
  UpdateTaskDto,
  QueryTasksDto,
} from '@/services/tasks.service';

function queryKey(query: QueryTasksDto): string {
  return JSON.stringify(query);
}

// ============================================================================
// Fetch Hooks
// ============================================================================

export function useTasks(query: QueryTasksDto = {}) {
  const key = queryKey(query);
  const data = useTasksStore((s) => s.listCache[key]);
  const isLoading = useTasksStore((s) => s.listLoading[key] ?? false);
  const error = useTasksStore((s) => s.listError[key]);
  const fetchTasks = useTasksStore((s) => s.fetchTasks);

  useEffect(() => {
    void fetchTasks(query);
  }, [key, fetchTasks]);

  return {
    data: data?.data ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    refetch: () => fetchTasks(query),
  };
}

export function useContactTasks(contactId: string) {
  return useTasks({ contactId });
}

export function useTask(id: string) {
  const data = useTasksStore((s) => s.detailCache[id]);
  const isLoading = useTasksStore((s) => s.detailLoading[id] ?? false);
  const error = useTasksStore((s) => s.detailError[id]);
  const fetchTask = useTasksStore((s) => s.fetchTask);

  useEffect(() => {
    if (id) void fetchTask(id);
  }, [id, fetchTask]);

  return {
    data,
    isLoading,
    error,
    refetch: () => fetchTask(id),
  };
}

export function useOverdueTaskCount() {
  const data = useTasksStore((s) => s.overdueCount);
  const isLoading = useTasksStore((s) => s.overdueCountLoading);
  const error = useTasksStore((s) => s.overdueCountError);
  const fetchOverdueCount = useTasksStore((s) => s.fetchOverdueCount);

  useEffect(() => {
    void fetchOverdueCount();
  }, [fetchOverdueCount]);

  return {
    data: data ?? 0,
    isLoading,
    error,
    refetch: fetchOverdueCount,
  };
}

// ============================================================================
// Mutation Hooks
// ============================================================================

export function useCreateTask() {
  const createTask = useTasksStore((s) => s.createTask);
  const createLoading = useTasksStore((s) => s.createLoading);

  return {
    mutateAsync: createTask,
    isPending: createLoading,
  };
}

export function useUpdateTask() {
  const updateTask = useTasksStore((s) => s.updateTask);
  const updateLoading = useTasksStore((s) => s.updateLoading);

  return {
    mutateAsync: ({ id, data }: { id: string; data: UpdateTaskDto }) =>
      updateTask(id, data),
    isPending: updateLoading,
  };
}

export function useDeleteTask() {
  const deleteTask = useTasksStore((s) => s.deleteTask);
  const deleteLoading = useTasksStore((s) => s.deleteLoading);

  return {
    mutateAsync: deleteTask,
    isPending: deleteLoading,
  };
}

// ============================================================================
// Keys (kept for compatibility)
// ============================================================================

export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: QueryTasksDto) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
  overdueCount: () => [...taskKeys.all, 'overdue-count'] as const,
};
