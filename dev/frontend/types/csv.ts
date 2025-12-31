export type CsvModule =
  | 'inventory'
  | 'inventory_movements'
  | 'suppliers'
  | 'employees'
  | 'warehouses'
  | 'projects'
  | 'project_tasks'
  | 'assets'
  | 'fleet_assets'
  | 'fleet_fuel'
  | 'fleet_maintenance'
  | 'fleet_inspections'
  | 'fleet_assignments'
  | 'fleet_breakdowns'
  | 'hr_attendance'
  | 'hr_leave_requests'
  | 'hr_performance_reviews';

export type ImportStatus = 'PENDING' | 'VALIDATING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type ExportStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface ExportPreviewResult {
  totalRows: number;
  previewRows: Record<string, any>[];
  estimatedSizeBytes: number;
}

export interface CsvAuditLog {
  id: string;
  jobType: string;
  jobId?: string | null;
  action: string;
  details?: any;
  createdById?: string | null;
  createdAt: string;
}

export interface CsvStatsResult {
  imports: Array<{ status: string; count: number }>;
  exports: Array<{ status: string; count: number }>;
}

export interface CsvUploadPreviewRow {
  rowNumber: number;
  data: Record<string, any>;
}

export interface CsvUploadValidationResult {
  module?: string;
  headers: string[];
  previewRows: CsvUploadPreviewRow[];
  totalRows: number;
}

export interface ColumnMapping {
  key: string;
  header: string;
  sourceColumn: string | null;
  required: boolean;
  type?: string;
  enumValues?: string[];
}

export interface ImportJob {
  id: string;
  module: string;
  fileName: string;
  fileUrl: string;
  storageProvider: string;
  originalName: string;
  totalRows: number;
  processedRows: number;
  successRows: number;
  errorRows: number;
  status: ImportStatus;
  errors?: any[];
  warnings?: any[];
  mappings?: any;
  context?: any;
  scheduledAt?: string | null;
  batchId?: string | null;
  createdById: string;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
}

export interface ExportJob {
  id: string;
  module: string;
  fileName: string;
  storageProvider: string;
  filters?: any;
  columns: string[];
  context?: any;
  totalRows: number;
  status: ExportStatus;
  fileUrl?: string | null;
  expiresAt?: string | null;
  createdById: string;
  completedAt?: string | null;
  createdAt: string;
}

export interface ImportTemplate {
  id: string;
  name: string;
  module: string;
  description?: string | null;
  columns: any;
  isDefault: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface CsvBatch {
  id: string;
  status: string;
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  createdById: string;
  createdAt: string;
  jobs?: ImportJob[];
}

export interface BackupExportResult {
  fileUrl: string;
  fileName: string;
  size: number;
  manifest: any;
}

export interface BackupValidateResult {
  valid: boolean;
  manifest?: any;
  errors: string[];
}

export interface BackupImportResult {
  restored: boolean;
  message: string;
}

export interface ScheduledExport {
  id: string;
  name: string;
  module: string;
  filters?: any;
  columns: string[];
  context?: any;
  schedule: string;
  recipients: string[];
  format: string;
  isActive: boolean;
  lastRunAt?: string | null;
  nextRunAt?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledExportRun {
  id: string;
  scheduledExportId: string;
  exportJobId?: string | null;
  status: string;
  errorMessage?: string | null;
  sentAt?: string | null;
  createdAt: string;
}
