export enum DocumentFinalizeStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export type FinalizeRedaction = {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type FinalizeJobOptions = {
  fileName?: string;
  cleanup?: {
    rasterize?: boolean;
    density?: number;
    jpegQuality?: number;
    grayscale?: boolean;
    sharpen?: boolean;
    normalize?: boolean;
  };
  redactions?: FinalizeRedaction[];
  security?: {
    hasWatermark?: boolean;
    watermarkText?: string;
    allowPrint?: boolean;
    allowCopy?: boolean;
    isPasswordProtected?: boolean;
    password?: string;
  };
};

export interface DocumentFinalizeJob {
  id: string;
  documentId: string;
  status: DocumentFinalizeStatus;
  options: FinalizeJobOptions;
  outputFileUrl?: string | null;
  outputFileName?: string | null;
  outputFileSize?: number | null;
  outputFileHash?: string | null;
  integritySealId?: string | null;
  errorMessage?: string | null;
  attempts: number;
  maxAttempts: number;
  startedAt?: string | null;
  completedAt?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}
