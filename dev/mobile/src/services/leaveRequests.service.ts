import { apiClient } from './api.service';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedReason?: string;
}

export interface LeaveRequestSubmit {
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface LeaveRequestSearchParams {
  page?: number;
  pageSize?: number;
  status?: string;
  employeeId?: string;
}

export interface LeaveRequestSearchResponse {
  requests: LeaveRequest[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
}

export const leaveRequestsService = {
  async submitLeaveRequest(data: LeaveRequestSubmit): Promise<LeaveRequest> {
    try {
      const response = await apiClient.post<any>('/hr/leave-requests', data);
      return {
        id: response.data.id,
        employeeId: response.data.employeeId,
        employeeName: response.data.employeeName,
        leaveType: response.data.leaveType,
        startDate: response.data.startDate,
        endDate: response.data.endDate,
        days: response.data.days,
        reason: response.data.reason,
        status: response.data.status || 'pending',
        createdAt: response.data.createdAt,
        approvedBy: response.data.approvedBy,
        approvedAt: response.data.approvedAt,
        rejectedReason: response.data.rejectedReason,
      };
    } catch (error) {
      console.error('Failed to submit leave request:', error);
      throw error;
    }
  },

  async getLeaveRequests(params: LeaveRequestSearchParams = {}): Promise<LeaveRequestSearchResponse> {
    try {
      const query = {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
        ...(params.status ? { status: params.status } : {}),
        ...(params.employeeId ? { employeeId: params.employeeId } : {}),
      };

      const response = await apiClient.get<any>('/hr/leave-requests', { params: query });

      return {
        requests: response.data.requests || [],
        page: response.data.page || 1,
        pageSize: response.data.pageSize || 20,
        totalPages: response.data.totalPages || 1,
        totalCount: response.data.totalCount || 0,
      };
    } catch (error) {
      console.error('Failed to get leave requests:', error);
      throw error;
    }
  },

  async getLeaveTypes(): Promise<string[]> {
    try {
      const response = await apiClient.get<any>('/hr/leave-types');
      return response.data.leaveTypes || ['Annual Leave', 'Sick Leave', 'Personal Leave', 'Maternity Leave', 'Paternity Leave'];
    } catch (error) {
      console.error('Failed to get leave types:', error);
      return ['Annual Leave', 'Sick Leave', 'Personal Leave', 'Maternity Leave', 'Paternity Leave'];
    }
  },
};
