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
};
