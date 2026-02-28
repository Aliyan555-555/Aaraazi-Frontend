/**
 * Tasks API Service
 * Type-safe client for task CRUD — module-wise, contact/deal scoped.
 */

import { apiClient } from '@/lib/api/client';

// ============================================================================
// Types
// ============================================================================

export type TaskType =
  | 'FOLLOW_UP'
  | 'VIEWING'
  | 'MEETING'
  | 'DOCUMENT'
  | 'CALL'
  | 'EMAIL'
  | 'INSPECTION'
  | 'OTHER';

export type TaskStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'OVERDUE';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type RelatedEntityType =
  | 'CONTACT'
  | 'LEAD'
  | 'PROPERTY_LISTING'
  | 'DEAL'
  | 'LEASE'
  | 'REQUIREMENT'
  | 'PROPERTY';

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  completedAt?: string | null;
  assignedToId: string;
  relatedToType?: RelatedEntityType | null;
  contactId?: string | null;
  dealId?: string | null;
  leadId?: string | null;
  propertyListingId?: string | null;
  tenantId: string;
  agencyId: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  assignedTo?: { id: string; name: string; email: string };
  contact?: { id: string; name: string; phone: string } | null;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  type: TaskType;
  priority: TaskPriority;
  status?: TaskStatus;
  dueDate: string;
  assignedToId?: string;
  relatedToType?: RelatedEntityType;
  contactId?: string;
  dealId?: string;
  leadId?: string;
  propertyListingId?: string;
  tenantId: string;
  agencyId: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  type?: TaskType;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string;
  assignedToId?: string;
}

export interface QueryTasksDto {
  type?: TaskType;
  status?: TaskStatus;
  priority?: TaskPriority;
  contactId?: string;
  leadId?: string;
  dealId?: string;
  assignedToId?: string;
  page?: number;
  limit?: number;
  sortOrder?: 'asc' | 'desc';
}

export interface TasksListResponse {
  data: Task[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ============================================================================
// Service
// ============================================================================

class TasksService {
  private readonly baseUrl = '/tasks';

  async create(dto: CreateTaskDto): Promise<Task> {
    const response = await apiClient.post<Task>(this.baseUrl, dto);
    return response.data;
  }

  async findAll(query: QueryTasksDto = {}): Promise<TasksListResponse> {
    const response = await apiClient.get<TasksListResponse>(this.baseUrl, {
      params: query,
    });
    return response.data;
  }

  async findOne(id: string): Promise<Task> {
    const response = await apiClient.get<Task>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async update(id: string, dto: UpdateTaskDto): Promise<Task> {
    const response = await apiClient.put<Task>(`${this.baseUrl}/${id}`, dto);
    return response.data;
  }

  async remove(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }

  async getOverdueCount(): Promise<number> {
    const response = await apiClient.get<{ count: number }>(
      `${this.baseUrl}/overdue/count`,
    );
    return response.data.count;
  }
}

export const tasksService = new TasksService();
export default tasksService;
