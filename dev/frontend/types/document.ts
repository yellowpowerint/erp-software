export enum DocumentCategory {
  INVOICE = 'INVOICE',
  RECEIPT = 'RECEIPT',
  PURCHASE_ORDER = 'PURCHASE_ORDER',
  QUOTATION = 'QUOTATION',
  CONTRACT = 'CONTRACT',
  SAFETY_REPORT = 'SAFETY_REPORT',
  INCIDENT_REPORT = 'INCIDENT_REPORT',
  COMPLIANCE_DOC = 'COMPLIANCE_DOC',
  PROJECT_REPORT = 'PROJECT_REPORT',
  HR_DOCUMENT = 'HR_DOCUMENT',
  PAYROLL = 'PAYROLL',
  TAX_FORM = 'TAX_FORM',
  AUDIT_DOCUMENT = 'AUDIT_DOCUMENT',
  TRAINING_MATERIAL = 'TRAINING_MATERIAL',
  CERTIFICATE = 'CERTIFICATE',
  EQUIPMENT_MANUAL = 'EQUIPMENT_MANUAL',
  OTHER = 'OTHER',
}

export interface DocumentMetadata {
  id: string;
  documentId: string;
  pageCount?: number;
  author?: string;
  title?: string;
  subject?: string;
  keywords: string[];
  createdDate?: string;
  modifiedDate?: string;
  extractedText?: string;
}

export interface DocumentPermission {
  id: string;
  documentId: string;
  role: string;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedById: string;
  uploadedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  changeNotes?: string;
  createdAt: string;
}

export interface Document {
  id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;
  category: DocumentCategory;
  module: string;
  referenceId?: string;
  description?: string;
  tags: string[];
  version: number;
  isLatest: boolean;
  uploadedById: string;
  uploadedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  metadata?: DocumentMetadata;
  permissions?: DocumentPermission[];
  versions?: DocumentVersion[];
}

export interface CreateDocumentDto {
  category: DocumentCategory;
  module: string;
  referenceId?: string;
  description?: string;
  tags?: string[];
}

export interface UpdateDocumentDto {
  description?: string;
  tags?: string[];
  category?: DocumentCategory;
}

export interface DocumentSearchFilters {
  category?: DocumentCategory;
  module?: string;
  referenceId?: string;
  tags?: string[];
  uploadedById?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export interface DocumentStatistics {
  totalDocuments: number;
  totalSize: number;
  totalSizeMB: number;
  categoryCounts: Record<string, number>;
  recentUploads: Document[];
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}
