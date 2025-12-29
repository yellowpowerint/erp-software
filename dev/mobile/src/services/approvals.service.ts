/**
 * Approvals Service
 * Session M3.1 - Fetch approvals list with filters and pagination
 */

import { apiClient } from './api.service';

export type ApprovalType = 'INVOICE' | 'PURCHASE_REQUEST' | 'IT_REQUEST' | 'PAYMENT_REQUEST';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface Approval {
  id: string;
  type: ApprovalType;
  status: ApprovalStatus;
  title?: string;
  description?: string;
  amount?: number;
  currency?: string;
  requesterName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApprovalsListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: ApprovalType;
  status?: ApprovalStatus;
}

export interface ApprovalsListResponse {
  items: Approval[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const DEFAULT_PAGE_SIZE = 20;

export interface ApprovalDetail {
  id: string;
  type: ApprovalType;
  status: ApprovalStatus;
  title: string;
  description?: string;
  amount?: number;
  currency?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  requesterName?: string;
  requesterId?: string;
  createdAt: string;
  updatedAt?: string;
  lineItems?: Array<{
    id: string;
    description: string;
    quantity?: number;
    unitPrice?: number;
    total?: number;
  }>;
  attachments?: Array<{
    id: string;
    filename: string;
    url: string;
    size?: number;
    uploadedAt?: string;
  }>;
  history?: Array<{
    id: string;
    action: string;
    actorName: string;
    timestamp: string;
    comment?: string;
  }>;
  comments?: Array<{
    id: string;
    authorName: string;
    content: string;
    createdAt: string;
  }>;
}

export const approvalsService = {
  async getApprovals(params: ApprovalsListParams = {}): Promise<ApprovalsListResponse> {
    const query = {
      page: params.page ?? 1,
      pageSize: params.pageSize ?? DEFAULT_PAGE_SIZE,
      ...(params.search ? { search: params.search } : {}),
      ...(params.type ? { type: params.type } : {}),
      ...(params.status ? { status: params.status } : {}),
    };

    const response = await apiClient.get<ApprovalsListResponse>('/approvals', { params: query });
    return response.data;
  },

  async getApprovalDetail(type: string, id: string): Promise<ApprovalDetail> {
    const response = await apiClient.get<ApprovalDetail>(`/approvals/item/${type}/${id}`);
    return response.data;
  },

  async approveApproval(type: string, id: string, comment?: string): Promise<void> {
    await apiClient.post(`/approvals/item/${type}/${id}/approve`, { comment });
  },

  async rejectApproval(type: string, id: string, reason: string): Promise<void> {
    await apiClient.post(`/approvals/item/${type}/${id}/reject`, { reason });
  },
};
