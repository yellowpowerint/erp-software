import axios, { AxiosError } from 'axios';
import { apiService } from './api.service';
import NetInfo from '@react-native-community/netinfo';

export type UploadStatus = 'idle' | 'uploading' | 'success' | 'failed' | 'canceled';

export interface UploadFile {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
}

export interface UploadRequest {
  uploadId: string;
  endpoint: string;
  method?: 'POST' | 'PUT';
  file: UploadFile;
  fields?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
  allowedMimeTypes?: string[];
  maxSizeBytes?: number;
  retryLimit?: number;
  onProgress?: (progress: number) => void;
  onStatusChange?: (status: UploadStatus) => void;
}

export interface UploadResult {
  status: UploadStatus;
  data?: unknown;
  error?: string;
}

const activeControllers = new Map<string, AbortController>();

const DEFAULT_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const DEFAULT_MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const DEFAULT_RETRY_LIMIT = 2; // total attempts = retryLimit + 1

function validateFile(file: UploadFile, allowedMimeTypes: string[], maxSizeBytes: number) {
  if (!file.uri || !file.name || !file.mimeType) {
    throw new Error('Invalid file: uri, name, and mimeType are required.');
  }
  if (!allowedMimeTypes.includes(file.mimeType)) {
    throw new Error(`Unsupported file type: ${file.mimeType}`);
  }
  if (file.size && file.size > maxSizeBytes) {
    throw new Error(`File too large. Max allowed is ${(maxSizeBytes / (1024 * 1024)).toFixed(1)}MB.`);
  }
}

function buildFormData(file: UploadFile, fields?: Record<string, string | number | boolean>) {
  const formData = new FormData();
  Object.entries(fields || {}).forEach(([key, value]) => {
    formData.append(key, String(value));
  });

  formData.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.mimeType,
  } as any);

  return formData;
}

function toErrorMessage(error: unknown): string {
  if (axios.isCancel(error)) {
    return 'Upload canceled';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Upload failed';
}

function getResponseMessage(error: AxiosError): string | undefined {
  const data = error.response?.data;
  if (!data) return undefined;

  if (typeof data === 'string') return data;
  if (typeof data === 'object' && 'message' in data) {
    const maybeMessage = (data as any).message;
    return typeof maybeMessage === 'string' ? maybeMessage : undefined;
  }
  return undefined;
}

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const uploadService = {
  cancelUpload(uploadId: string) {
    const controller = activeControllers.get(uploadId);
    if (controller) {
      controller.abort();
      activeControllers.delete(uploadId);
    }
  },

  async uploadFile(request: UploadRequest): Promise<UploadResult> {
    const {
      uploadId,
      endpoint,
      method = 'POST',
      file,
      fields,
      headers,
      allowedMimeTypes = DEFAULT_ALLOWED_MIME_TYPES,
      maxSizeBytes = DEFAULT_MAX_SIZE_BYTES,
      retryLimit = DEFAULT_RETRY_LIMIT,
      onProgress,
      onStatusChange,
    } = request;

    if (activeControllers.has(uploadId)) {
      throw new Error('Upload already in progress for this ID.');
    }

    validateFile(file, allowedMimeTypes, maxSizeBytes);

    const net = await NetInfo.fetch();
    if (!net.isConnected) {
      throw new Error('No internet connection. Please reconnect and try again.');
    }

    const client = apiService.getClient();
    let lastError: string | undefined;

    for (let attempt = 0; attempt <= retryLimit; attempt += 1) {
      const controller = new AbortController();
      activeControllers.set(uploadId, controller);
      onStatusChange?.('uploading');
      onProgress?.(0);

      try {
        const formData = buildFormData(file, fields);

        const response = await client.request({
          url: endpoint,
          method,
          data: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
            'Idempotency-Key': uploadId,
            'X-Upload-Id': uploadId,
            ...headers,
          },
          signal: controller.signal,
          onUploadProgress: progressEvent => {
            if (progressEvent.total) {
              const percent = Math.min(100, Math.round((progressEvent.loaded / progressEvent.total) * 100));
              onProgress?.(percent);
            } else if (progressEvent.progress) {
              const percent = Math.min(100, Math.round(progressEvent.progress * 100));
              onProgress?.(percent);
            }
          },
        });

        activeControllers.delete(uploadId);
        onProgress?.(100);
        onStatusChange?.('success');
        return { status: 'success', data: response.data };
      } catch (error: unknown) {
        activeControllers.delete(uploadId);

        if (axios.isCancel(error)) {
          onStatusChange?.('canceled');
          return { status: 'canceled' };
        }

        const axiosError = error as AxiosError;
        lastError = getResponseMessage(axiosError) || toErrorMessage(error);
        const isLastAttempt = attempt >= retryLimit;
        if (isLastAttempt) {
          onStatusChange?.('failed');
          return { status: 'failed', error: lastError };
        }

        const backoffMs = 800 * Math.pow(2, attempt);
        await wait(backoffMs);
      }
    }

    return { status: 'failed', error: lastError };
  },
};
