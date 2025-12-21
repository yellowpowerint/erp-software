export enum DocumentConversionProvider {
  LOCAL = 'LOCAL',
  CLOUDCONVERT = 'CLOUDCONVERT',
}

export enum DocumentConversionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface DocumentConversionJob {
  id: string;
  documentId: string;
  provider: DocumentConversionProvider;
  status: DocumentConversionStatus;
  inputMimeType: string;
  outputFileUrl?: string | null;
  outputFileName?: string | null;
  outputFileSize?: number | null;
  errorMessage?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  processingTime?: number | null;
  attempts: number;
  maxAttempts: number;
  options?: any;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}
