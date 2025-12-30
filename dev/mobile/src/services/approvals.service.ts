/**
 * Approvals Service
 * Session M3.1 - Fetch approvals list with filters and pagination
 */

import { apiClient } from './api.service';
import { uploadService } from './upload.service';
import { Attachment } from '../types/attachment';

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
  history?: Array<{
    id: string;
    action: string;
    actorName: string;
    timestamp: string;
    comment?: string;
  }>;
  attachments?: Attachment[];
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
    return normalizeApproval(response.data);
  },

  async approveApproval(type: string, id: string, comment?: string): Promise<void> {
    await apiClient.post(`/approvals/item/${type}/${id}/approve`, { comment });
  },

  async rejectApproval(type: string, id: string, reason: string): Promise<void> {
    await apiClient.post(`/approvals/item/${type}/${id}/reject`, { reason });
  },

  async uploadAttachment(params: {
    type: string;
    id: string;
    file: { uri: string; name: string; mimeType: string; size?: number };
    metadata?: Record<string, string | number | boolean>;
    onProgress?: (p: number) => void;
  }): Promise<Attachment> {
    const uploadId = `${params.id}-${Date.now()}`;
    const result = await uploadService.uploadFile({
      uploadId,
      endpoint: `/approvals/item/${params.type}/${params.id}/attachments`,
      method: 'POST',
      file: {
        uri: params.file.uri,
        name: params.file.name,
        mimeType: params.file.mimeType,
        size: params.file.size,
      },
      fields: {
        uploadId,
        ...params.metadata,
      },
      allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
      maxSizeBytes: 10 * 1024 * 1024,
      retryLimit: 2,
      onProgress: params.onProgress,
    });

    if (result.status !== 'success') {
      throw new Error(result.error || 'Failed to upload attachment');
    }

    const data = (result.data as any) || {};
    return normalizeAttachment(data.attachment || data);
  },
};

function normalizeAttachment(att: any): Attachment {
  return {
    id: att.id || att._id || att.attachmentId || att.key || String(Math.random()),
    name: att.name || att.filename || att.title || 'Attachment',
    url: att.url || att.downloadUrl || att.link,
    mimeType: att.mimeType || att.contentType,
    size: att.size ?? att.bytes ?? att.length,
    uploadedAt: att.uploadedAt || att.createdAt || att.created,
    uploadedBy: att.uploadedBy || att.owner,
  };
}

function normalizeApproval(data: ApprovalDetail): ApprovalDetail {
  return {
    ...data,
    attachments: (data.attachments || []).map(normalizeAttachment),
  };
}
