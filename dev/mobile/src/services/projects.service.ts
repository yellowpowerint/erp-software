import { apiClient } from './api.service';

export interface Project {
  id: string;
  name: string;
  code: string;
  description: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  currency: string;
  progress: number;
  managerId: string;
  managerName: string;
  clientName?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDetail extends Project {
  milestones: Milestone[];
  tasks: ProjectTask[];
  team: TeamMember[];
}

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  progress: number;
  order: number;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  milestoneId?: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  assigneeId?: string;
  assigneeName?: string;
  dueDate?: string;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  userId: string;
  userName: string;
  role: string;
  joinedAt: string;
}

export interface ProjectSearchParams {
  page?: number;
  pageSize?: number;
  status?: string;
  priority?: string;
  search?: string;
}

export interface ProjectSearchResponse {
  projects: Project[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
}

export const projectsService = {
  async getProjects(params: ProjectSearchParams = {}): Promise<ProjectSearchResponse> {
    try {
      const query = {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
        ...(params.status ? { status: params.status } : {}),
        ...(params.priority ? { priority: params.priority } : {}),
        ...(params.search ? { search: params.search } : {}),
      };

      const response = await apiClient.get<any>('/operations/projects', { params: query });

      return {
        projects: response.data.projects || [],
        page: response.data.page || 1,
        pageSize: response.data.pageSize || 20,
        totalPages: response.data.totalPages || 1,
        totalCount: response.data.totalCount || 0,
      };
    } catch (error) {
      console.error('Failed to get projects:', error);
      throw error;
    }
  },

  async getProjectDetail(projectId: string): Promise<ProjectDetail> {
    try {
      const response = await apiClient.get<any>(`/operations/projects/${projectId}`);

      return {
        id: response.data.id,
        name: response.data.name,
        code: response.data.code,
        description: response.data.description,
        status: response.data.status,
        priority: response.data.priority,
        startDate: response.data.startDate,
        endDate: response.data.endDate,
        budget: response.data.budget,
        spent: response.data.spent,
        currency: response.data.currency || 'USD',
        progress: response.data.progress || 0,
        managerId: response.data.managerId,
        managerName: response.data.managerName,
        clientName: response.data.clientName,
        location: response.data.location,
        createdAt: response.data.createdAt,
        updatedAt: response.data.updatedAt,
        milestones: response.data.milestones || [],
        tasks: response.data.tasks || [],
        team: response.data.team || [],
      };
    } catch (error) {
      console.error('Failed to get project detail:', error);
      throw error;
    }
  },
};
