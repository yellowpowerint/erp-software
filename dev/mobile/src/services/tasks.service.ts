/**
 * Tasks Service
 * Session M3.3 - Fetch tasks list with filters and pagination
 */

import { apiClient } from './api.service';
import { uploadService } from './upload.service';

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  assignedToName?: string;
  assignedToId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TasksListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: TaskStatus;
  mine?: boolean;
}

export interface TasksListResponse {
  items: Task[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface TaskDetail {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  assignedToName?: string;
  assignedToId?: string;
  assignedByName?: string;
  assignedById?: string;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
  comments?: Array<{
    id: string;
    authorName: string;
    content: string;
    createdAt: string;
  }>;
  attachments?: Array<{
    id: string;
    filename: string;
    url: string;
    size?: number;
    uploadedAt?: string;
  }>;
}

const DEFAULT_PAGE_SIZE = 20;

export const tasksService = {
  async getTasks(params: TasksListParams = {}): Promise<TasksListResponse> {
    const query = {
      page: params.page ?? 1,
      pageSize: params.pageSize ?? DEFAULT_PAGE_SIZE,
      ...(params.search ? { search: params.search } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.mine !== undefined ? { mine: params.mine } : {}),
    };

    const response = await apiClient.get<TasksListResponse>('/tasks', { params: query });
    return response.data;
  },

  async getTaskDetail(id: string): Promise<TaskDetail> {
    const response = await apiClient.get<TaskDetail>(`/tasks/${id}`);
    return response.data;
  },

  async uploadAttachment(
    taskId: string,
    uri: string,
    filename: string,
    mimeType: string,
  ): Promise<any> {
    const uploadId = `task-${taskId}-${Date.now()}`;
    
    const result = await uploadService.uploadFile({
      uploadId,
      endpoint: `/tasks/${taskId}/attachments`,
      file: { uri, name: filename, mimeType },
    });

    if (result.status !== 'success') {
      throw new Error(result.error || 'Upload failed');
    }

    return result.data;
  },
};
