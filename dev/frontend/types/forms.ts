export enum DocumentFormDraftStatus {
  DRAFT = 'DRAFT',
  FINALIZED = 'FINALIZED',
  CANCELLED = 'CANCELLED',
}

export type DocumentFormFieldSchema = {
  name: string;
  type: string;
  required?: boolean;
  options?: string[];
};

export interface DocumentFormTemplate {
  id: string;
  documentId: string;
  documentVersion: number;
  fieldSchema: DocumentFormFieldSchema[];
  fieldCount: number;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  document?: {
    id: string;
    originalName: string;
    version: number;
  };
}

export interface DocumentFormDraft {
  id: string;
  documentId: string;
  templateId?: string | null;
  status: DocumentFormDraftStatus;
  values: Record<string, any>;
  signatureData?: string | null;
  signatureType?: string | null;
  signatureReason?: string | null;
  signatureMetadata?: any;
  outputFileUrl?: string | null;
  outputFileName?: string | null;
  outputFileSize?: number | null;
  outputDocumentVersion?: number | null;
  finalizedAt?: string | null;
  cancelledAt?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}
