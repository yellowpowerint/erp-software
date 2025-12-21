export enum DocumentAuditPackageStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export type AuditPackageSpec = {
  sections: Array<{
    title: string;
    documents: Array<{ documentId: string; label?: string }>;
  }>;
};

export interface DocumentAuditPackageJob {
  id: string;
  status: DocumentAuditPackageStatus;
  title: string;
  spec: AuditPackageSpec;
  outputDocumentId?: string | null;
  errorMessage?: string | null;
  attempts: number;
  maxAttempts: number;
  startedAt?: string | null;
  completedAt?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}
