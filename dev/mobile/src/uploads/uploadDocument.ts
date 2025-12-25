import { http } from '../api/http';

import type { LocalFile } from './types';

export type UploadDocumentInput = {
  file: LocalFile;
  category: string;
  module: string;
  referenceId?: string;
  description?: string;
  tags?: string[];
  clientUploadId?: string;
};

export type UploadDocumentOptions = {
  onProgress?: (progress: number) => void;
};

export async function uploadDocument<T = any>(
  input: UploadDocumentInput,
  options?: UploadDocumentOptions,
): Promise<T> {
  const form = new FormData();

  const name = input.file.fileName || `upload-${Date.now()}.jpg`;
  const type = input.file.mimeType || 'application/octet-stream';

  form.append('file', { uri: input.file.uri, name, type } as any);
  form.append('category', input.category);
  form.append('module', input.module);

  if (input.referenceId) form.append('referenceId', input.referenceId);
  if (input.description) form.append('description', input.description);

  if (input.tags && input.tags.length > 0) {
    form.append('tags', JSON.stringify(input.tags));
  }

  if (input.clientUploadId) {
    form.append('clientUploadId', input.clientUploadId);
  }

  const res = await http.post<T>('/documents/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt: any) => {
      const total = typeof evt?.total === 'number' ? evt.total : 0;
      const loaded = typeof evt?.loaded === 'number' ? evt.loaded : 0;
      if (total > 0) {
        options?.onProgress?.(Math.max(0, Math.min(1, loaded / total)));
      }
    },
  });

  options?.onProgress?.(1);
  return res.data;
}
