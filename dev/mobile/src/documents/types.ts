export type DocumentPermission = {
  role: string;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  canSign?: boolean;
};

export type DocumentUser = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

export type DocumentItem = {
  id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;
  category: string;
  module: string;
  referenceId?: string | null;
  description?: string | null;
  tags?: string[];
  uploadedById?: string;
  uploadedBy?: DocumentUser;
  createdAt?: string;
  updatedAt?: string;
  permissions?: DocumentPermission[];
  metadata?: any;
};

export type EffectiveDocumentPermissions = {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  canSign: boolean;
  canDownload: boolean;
};
