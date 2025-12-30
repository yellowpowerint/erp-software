import { uploadService, UploadResult, UploadStatus } from './upload.service';
import * as FileSystem from 'expo-file-system';
import { apiClient } from './api.service';

export type DocumentKind = 'photo' | 'image' | 'pdf' | 'other';

export interface DocumentUploadParams {
  uploadId?: string;
  fileUri: string;
  fileName: string;
  mimeType: string;
  size?: number;
  metadata?: Record<string, string | number | boolean>;
}

export interface DocumentUploadState {
  uploadId: string;
  status: UploadStatus;
  progress: number;
  error?: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  url?: string;
  thumbnailUrl?: string;
  uploadedBy?: string;
  createdAt?: string;
}

const ENDPOINT = '/documents/upload';
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const documentsService = {
  async listDocuments(search?: string): Promise<DocumentItem[]> {
    const response = await apiClient.get<any>('/documents', { params: search ? { search } : undefined });
    return (response.data?.documents || response.data || []).map((doc: any) => normalizeDocument(doc));
  },

  async getDocumentDetail(id: string): Promise<DocumentItem> {
    const res = await apiClient.get<any>(`/documents/${id}`);
    return normalizeDocument(res.data || {});
  },

  async downloadDocument(url: string, filename: string): Promise<{ localUri: string }> {
    const fileUri = `${FileSystem.cacheDirectory}${filename}`;
    const downloadResumable = FileSystem.createDownloadResumable(url, fileUri);
    const result = await downloadResumable.downloadAsync();
    return { localUri: result?.uri ?? fileUri };
  },

  async uploadDocument(
    params: DocumentUploadParams,
    callbacks: {
      onProgress?: (progress: number) => void;
      onStatusChange?: (status: UploadStatus) => void;
    } = {}
  ): Promise<UploadResult> {
    return uploadService.uploadFile({
      uploadId: params.uploadId ?? params.fileUri,
      endpoint: ENDPOINT,
      method: 'POST',
      file: {
        uri: params.fileUri,
        name: params.fileName,
        mimeType: params.mimeType,
        size: params.size,
      },
      fields: {
        uploadId: params.uploadId ?? params.fileUri,
        ...params.metadata,
      },
      allowedMimeTypes: ALLOWED_TYPES,
      maxSizeBytes: MAX_SIZE_BYTES,
      retryLimit: 2,
      onProgress: callbacks.onProgress,
      onStatusChange: callbacks.onStatusChange,
    });
  },

  cancel(uploadId: string) {
    uploadService.cancelUpload(uploadId);
  },
};

function normalizeDocument(doc: any): DocumentItem {
  return {
    id: doc.id || doc._id || String(doc.documentId || doc.key || Math.random()),
    name: doc.name || doc.filename || doc.title || 'Untitled',
    mimeType: doc.mimeType || doc.contentType || 'application/octet-stream',
    size: doc.size ?? doc.bytes ?? doc.length,
    url: doc.url || doc.downloadUrl || doc.link,
    thumbnailUrl: doc.thumbnailUrl || doc.previewUrl,
    uploadedBy: doc.uploadedBy || doc.owner || doc.userName,
    createdAt: doc.createdAt || doc.uploadedAt || doc.created,
  };
}
