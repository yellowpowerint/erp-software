import { http } from '../api/http';

import type { DocumentItem, EffectiveDocumentPermissions } from './types';

type SuccessEnvelope<T> = { success: boolean; data: T };

function unwrap<T>(value: any): T {
  if (value && typeof value === 'object' && 'success' in value && 'data' in value) {
    return (value as SuccessEnvelope<T>).data;
  }
  return value as T;
}

export async function listDocuments(params?: {
  category?: string;
  module?: string;
  referenceId?: string;
  tags?: string[];
  uploadedById?: string;
  search?: string;
}): Promise<DocumentItem[]> {
  const qs: string[] = [];
  if (params?.category) qs.push(`category=${encodeURIComponent(params.category)}`);
  if (params?.module) qs.push(`module=${encodeURIComponent(params.module)}`);
  if (params?.referenceId) qs.push(`referenceId=${encodeURIComponent(params.referenceId)}`);
  if (params?.uploadedById) qs.push(`uploadedById=${encodeURIComponent(params.uploadedById)}`);
  if (params?.search) qs.push(`search=${encodeURIComponent(params.search)}`);
  if (params?.tags && params.tags.length > 0) qs.push(`tags=${encodeURIComponent(params.tags.join(','))}`);

  const path = `/documents${qs.length > 0 ? `?${qs.join('&')}` : ''}`;
  const res = await http.get<DocumentItem[]>(path);
  return res.data;
}

export async function getDocument(id: string): Promise<DocumentItem> {
  const res = await http.get<DocumentItem>(`/documents/${encodeURIComponent(id)}`);
  return res.data;
}

export async function getMyDocumentPermissions(id: string): Promise<EffectiveDocumentPermissions> {
  const res = await http.get<SuccessEnvelope<EffectiveDocumentPermissions>>(
    `/documents/${encodeURIComponent(id)}/my-permissions`
  );
  return unwrap<EffectiveDocumentPermissions>(res.data);
}

export async function getDocumentDownloadUrl(id: string): Promise<{ url: string; filename: string }> {
  const res = await http.get<{ url: string; filename: string }>(`/documents/${encodeURIComponent(id)}/download`);
  return res.data;
}

export async function getDocumentsByModule(module: string, referenceId: string): Promise<DocumentItem[]> {
  const m = String(module ?? '').trim();
  const r = String(referenceId ?? '').trim();
  if (!m || !r) return [];
  const res = await http.get<DocumentItem[]>(
    `/documents/by-module/${encodeURIComponent(m)}/${encodeURIComponent(r)}`
  );
  return res.data;
}
