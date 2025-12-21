export type CsvModule =
  | 'inventory'
  | 'inventory_movements'
  | 'suppliers'
  | 'employees'
  | 'warehouses'
  | 'projects'
  | 'project_tasks'
  | 'assets';

export type ImportStatus = 'PENDING' | 'VALIDATING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type ExportStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

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
