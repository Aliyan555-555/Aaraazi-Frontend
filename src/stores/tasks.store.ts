'use client';

/**
 * Tasks Zustand Store — replaces React Query useTasks
 */

import { create } from 'zustand';
import { tasksService } from '@/services/tasks.service';
import type {
  CreateTaskDto,
  UpdateTaskDto,
  QueryTasksDto,
} from '@/services/tasks.service';
import type { Task, TasksListResponse } from '@/services/tasks.service';
import { toast } from 'sonner';

// ============================================================================
// State
// ============================================================================

interface TasksState {
  listCache: Record<string, TasksListResponse>;
  listLoading: Record<string, boolean>;
  listError: Record<string, string | null>;

  detailCache: Record<string, Task>;
  detailLoading: Record<string, boolean>;
  detailError: Record<string, string | null>;

  overdueCount: number | null;
  overdueCountLoading: boolean;
  overdueCountError: string | null;

  createLoading: boolean;
  updateLoading: boolean;
  deleteLoading: boolean;
}

function queryKey(query: QueryTasksDto): string {
  return JSON.stringify(query);
}

interface TasksActions {
  fetchTasks: (query?: QueryTasksDto) => Promise<TasksListResponse>;
  fetchTask: (id: string) => Promise<Task>;
  fetchOverdueCount: () => Promise<number>;

  createTask: (data: CreateTaskDto) => Promise<Task>;
  updateTask: (id: string, data: UpdateTaskDto) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;

  invalidateLists: () => void;
  removeDetail: (id: string) => void;
}

// ============================================================================
// Store
// ============================================================================

export const useTasksStore = create<TasksState & TasksActions>((set, get) => ({
  listCache: {},
  listLoading: {},
  listError: {},
  detailCache: {},
  detailLoading: {},
  detailError: {},
  overdueCount: null,
  overdueCountLoading: false,
  overdueCountError: null,
  createLoading: false,
  updateLoading: false,
  deleteLoading: false,

  fetchTasks: async (query: QueryTasksDto = {}) => {
    const key = queryKey(query);
    set((s) => ({ listLoading: { ...s.listLoading, [key]: true }, listError: { ...s.listError, [key]: null } }));
    try {
      const data = await tasksService.findAll(query);
      set((s) => ({ listCache: { ...s.listCache, [key]: data }, listLoading: { ...s.listLoading, [key]: false } }));
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch tasks';
      set((s) => ({ listError: { ...s.listError, [key]: msg }, listLoading: { ...s.listLoading, [key]: false } }));
      throw err;
    }
  },

  fetchTask: async (id: string) => {
    set((s) => ({ detailLoading: { ...s.detailLoading, [id]: true }, detailError: { ...s.detailError, [id]: null } }));
    try {
      const data = await tasksService.findOne(id);
      set((s) => ({ detailCache: { ...s.detailCache, [id]: data }, detailLoading: { ...s.detailLoading, [id]: false } }));
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch task';
      set((s) => ({ detailError: { ...s.detailError, [id]: msg }, detailLoading: { ...s.detailLoading, [id]: false } }));
      throw err;
    }
  },

  fetchOverdueCount: async () => {
    set({ overdueCountLoading: true, overdueCountError: null });
    try {
      const count = await tasksService.getOverdueCount();
      set({ overdueCount: count, overdueCountLoading: false });
      return count;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch overdue count';
      set({ overdueCountError: msg, overdueCountLoading: false });
      throw err;
    }
  },

  createTask: async (data: CreateTaskDto) => {
    set({ createLoading: true });
    try {
      const created = await tasksService.create(data);
      get().invalidateLists();
      get().fetchOverdueCount();
      set((s) => ({ detailCache: { ...s.detailCache, [created.id]: created }, createLoading: false }));
      toast.success('Task created successfully');
      return created;
    } catch (err) {
      set({ createLoading: false });
      console.error('Failed to create task:', err);
      toast.error('Failed to create task');
      throw err;
    }
  },

  updateTask: async (id: string, data: UpdateTaskDto) => {
    set({ updateLoading: true });
    try {
      const updated = await tasksService.update(id, data);
      get().invalidateLists();
      get().fetchOverdueCount();
      set((s) => ({ detailCache: { ...s.detailCache, [id]: updated }, updateLoading: false }));
      toast.success('Task updated successfully');
      return updated;
    } catch (err) {
      set({ updateLoading: false });
      console.error('Failed to update task:', err);
      toast.error('Failed to update task');
      throw err;
    }
  },

  deleteTask: async (id: string) => {
    set({ deleteLoading: true });
    try {
      await tasksService.remove(id);
      get().removeDetail(id);
      get().invalidateLists();
      get().fetchOverdueCount();
      set({ deleteLoading: false });
      toast.success('Task cancelled');
    } catch (err) {
      set({ deleteLoading: false });
      console.error('Failed to cancel task:', err);
      toast.error('Failed to cancel task');
      throw err;
    }
  },

  invalidateLists: () => set({ listCache: {}, listError: {} }),

  removeDetail: (id: string) => {
    set((s) => {
      const { [id]: _, ...rest } = s.detailCache;
      return { detailCache: rest };
    });
  },
}));
