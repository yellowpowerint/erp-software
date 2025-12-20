import { useState, useCallback } from 'react';
import api from '@/lib/api';
import {
  Document,
  CreateDocumentDto,
  UpdateDocumentDto,
  DocumentSearchFilters,
  DocumentStatistics,
  UploadProgress,
  DocumentComment,
  DocumentAnnotation,
  AnnotationType,
  DocumentShare,
  DocumentViewerPresence,
  BasicUser,
} from '@/types/document';

export const useDocuments = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);

  const uploadDocument = useCallback(
    async (file: File, metadata: CreateDocumentDto): Promise<Document> => {
      setLoading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', metadata.category);
        formData.append('module', metadata.module);
        if (metadata.referenceId) formData.append('referenceId', metadata.referenceId);
        if (metadata.description) formData.append('description', metadata.description);
        if (metadata.tags) formData.append('tags', JSON.stringify(metadata.tags));

        const response = await api.post<Document>('/documents/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress([
                {
                  fileName: file.name,
                  progress,
                  status: progress === 100 ? 'success' : 'uploading',
                },
              ]);
            }
          },
        });

        return response.data;
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Failed to upload document';
        setError(errorMessage);
        setUploadProgress([
          {
            fileName: file.name,
            progress: 0,
            status: 'error',
            error: errorMessage,
          },
        ]);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const uploadMultipleDocuments = useCallback(
    async (files: File[], metadata: CreateDocumentDto): Promise<Document[]> => {
      setLoading(true);
      setError(null);

      const initialProgress: UploadProgress[] = files.map((file) => ({
        fileName: file.name,
        progress: 0,
        status: 'pending',
      }));
      setUploadProgress(initialProgress);

      try {
        const formData = new FormData();
        files.forEach((file) => {
          formData.append('files', file);
        });
        formData.append('category', metadata.category);
        formData.append('module', metadata.module);
        if (metadata.referenceId) formData.append('referenceId', metadata.referenceId);
        if (metadata.description) formData.append('description', metadata.description);
        if (metadata.tags) formData.append('tags', JSON.stringify(metadata.tags));

        const response = await api.post<Document[]>('/documents/upload-multiple', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        setUploadProgress(
          files.map((file) => ({
            fileName: file.name,
            progress: 100,
            status: 'success',
          }))
        );

        return response.data;
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Failed to upload documents';
        setError(errorMessage);
        setUploadProgress(
          files.map((file) => ({
            fileName: file.name,
            progress: 0,
            status: 'error',
            error: errorMessage,
          }))
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getDocuments = useCallback(async (filters?: DocumentSearchFilters): Promise<Document[]> => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.module) params.append('module', filters.module);
      if (filters?.referenceId) params.append('referenceId', filters.referenceId);
      if (filters?.tags) params.append('tags', filters.tags.join(','));
      if (filters?.uploadedById) params.append('uploadedById', filters.uploadedById);
      if (filters?.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters?.endDate) params.append('endDate', filters.endDate.toISOString());
      if (filters?.search) params.append('search', filters.search);

      const response = await api.get<Document[]>(`/documents?${params.toString()}`);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch documents';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getDocument = useCallback(async (id: string): Promise<Document> => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get<Document>(`/documents/${id}`);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch document';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateDocument = useCallback(
    async (id: string, data: UpdateDocumentDto): Promise<Document> => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.put<Document>(`/documents/${id}`, data);
        return response.data;
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Failed to update document';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteDocument = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await api.delete(`/documents/${id}`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete document';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadDocument = useCallback(async (id: string): Promise<{ url: string; filename: string }> => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get<{ url: string; filename: string }>(`/documents/${id}/download`);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to get download URL';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const searchDocuments = useCallback(async (query: string): Promise<Document[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get<Document[]>(`/documents/search?query=${encodeURIComponent(query)}`);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to search documents';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getMyUploads = useCallback(async (): Promise<Document[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get<Document[]>('/documents/my-uploads');
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch uploads';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getRecentDocuments = useCallback(async (limit: number = 10): Promise<Document[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get<Document[]>(`/documents/recent?limit=${limit}`);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch recent documents';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getStatistics = useCallback(async (): Promise<DocumentStatistics> => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get<DocumentStatistics>('/documents/statistics');
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch statistics';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getDocumentsByModule = useCallback(
    async (module: string, referenceId: string): Promise<Document[]> => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get<Document[]>(`/documents/by-module/${module}/${referenceId}`);
        return response.data;
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Failed to fetch documents';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const resetUploadProgress = useCallback(() => {
    setUploadProgress([]);
  }, []);

  const batchDelete = useCallback(async (documentIds: string[]): Promise<any> => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/documents/batch-delete', { documentIds });
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete documents';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const batchDownload = useCallback(async (documentIds: string[]): Promise<Blob> => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/documents/batch-download', 
        { documentIds },
        { responseType: 'blob' }
      );
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to download documents';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const batchAddTags = useCallback(async (documentIds: string[], tags: string[]): Promise<any> => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.patch('/documents/batch-tag', { documentIds, tags });
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to add tags';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getStorageUsage = useCallback(async (): Promise<any> => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/documents/storage-usage');
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch storage usage';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ===== Phase 15.3: Version Management Methods =====

  async function getVersionHistory(documentId: string) {
    try {
      const response = await api.get(`/documents/${documentId}/versions`);
      return response.data;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch version history');
      throw error;
    }
  }

  // ===== Phase 16.3: Comments =====
  async function listComments(documentId: string): Promise<DocumentComment[]> {
    try {
      const response = await api.get<DocumentComment[]>(`/documents/${documentId}/comments`);
      return response.data;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch comments');
      throw error;
    }
  }

  async function addComment(
    documentId: string,
    data: { content: string; pageNumber?: number; positionX?: number; positionY?: number },
  ): Promise<DocumentComment> {
    try {
      const response = await api.post<DocumentComment>(`/documents/${documentId}/comments`, data);
      return response.data;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to add comment');
      throw error;
    }
  }

  async function replyToComment(
    commentId: string,
    data: { content: string; pageNumber?: number; positionX?: number; positionY?: number },
  ): Promise<DocumentComment> {
    try {
      const response = await api.post<DocumentComment>(`/documents/comments/${commentId}/reply`, data);
      return response.data;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to reply to comment');
      throw error;
    }
  }

  async function updateComment(commentId: string, data: { content: string }): Promise<DocumentComment> {
    try {
      const response = await api.put<DocumentComment>(`/documents/comments/${commentId}`, data);
      return response.data;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update comment');
      throw error;
    }
  }

  async function deleteComment(commentId: string): Promise<{ success: boolean }> {
    try {
      const response = await api.delete<{ success: boolean }>(`/documents/comments/${commentId}`);
      return response.data;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete comment');
      throw error;
    }
  }

  async function resolveComment(commentId: string, resolved: boolean = true): Promise<DocumentComment> {
    try {
      const response = await api.post<DocumentComment>(`/documents/comments/${commentId}/resolve`, {
        resolved,
      });
      return response.data;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to resolve comment');
      throw error;
    }
  }

  // ===== Phase 16.3: Annotations =====
  async function listAnnotations(documentId: string): Promise<DocumentAnnotation[]> {
    try {
      const response = await api.get<DocumentAnnotation[]>(`/documents/${documentId}/annotations`);
      return response.data;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch annotations');
      throw error;
    }
  }

  async function addAnnotation(
    documentId: string,
    data: { type: AnnotationType; pageNumber: number; coordinates: any; content?: string; color?: string },
  ): Promise<DocumentAnnotation> {
    try {
      const response = await api.post<DocumentAnnotation>(`/documents/${documentId}/annotations`, data);
      return response.data;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to add annotation');
      throw error;
    }
  }

  async function updateAnnotation(
    annotationId: string,
    data: { coordinates?: any; content?: string; color?: string },
  ): Promise<DocumentAnnotation> {
    try {
      const response = await api.put<DocumentAnnotation>(`/documents/annotations/${annotationId}`, data);
      return response.data;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update annotation');
      throw error;
    }
  }

  async function deleteAnnotation(annotationId: string): Promise<{ success: boolean }> {
    try {
      const response = await api.delete<{ success: boolean }>(`/documents/annotations/${annotationId}`);
      return response.data;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete annotation');
      throw error;
    }
  }

  // ===== Phase 16.3: Sharing =====
  async function shareDocument(
    documentId: string,
    data: {
      sharedWithId?: string;
      expiresAt?: string;
      canEdit?: boolean;
      canDownload?: boolean;
      generatePublicLink?: boolean;
    },
  ): Promise<DocumentShare> {
    try {
      const response = await api.post<DocumentShare>(`/documents/${documentId}/share`, data);
      return response.data;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to share document');
      throw error;
    }
  }

  async function getSharedWithMe(): Promise<DocumentShare[]> {
    try {
      const response = await api.get<DocumentShare[]>(`/documents/shared/with-me`);
      return response.data;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch shared documents');
      throw error;
    }
  }

  async function getSharedByMe(): Promise<DocumentShare[]> {
    try {
      const response = await api.get<DocumentShare[]>(`/documents/shared/by-me`);
      return response.data;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch shared documents');
      throw error;
    }
  }

  async function revokeShare(shareId: string): Promise<{ success: boolean }> {
    try {
      const response = await api.delete<{ success: boolean }>(`/documents/shares/${shareId}`);
      return response.data;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to revoke share');
      throw error;
    }
  }

  // ===== Phase 16.3: Presence =====
  async function presenceHeartbeat(documentId: string): Promise<any> {
    try {
      const response = await api.post(`/documents/${documentId}/presence/heartbeat`);
      return response.data;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update presence');
      throw error;
    }
  }

  async function listPresenceViewers(documentId: string): Promise<DocumentViewerPresence[]> {
    try {
      const response = await api.get<DocumentViewerPresence[]>(`/documents/${documentId}/presence/viewers`);
      return response.data;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to load viewers');
      throw error;
    }
  }

  // ===== Users lookup (Share picker) =====
  async function getUsers(filters?: { role?: string; status?: string; search?: string }): Promise<BasicUser[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.role) params.append('role', filters.role);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);

      const qs = params.toString();
      const response = await api.get<BasicUser[]>(`/settings/users${qs ? `?${qs}` : ''}`);
      return response.data;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch users');
      throw error;
    }
  }

  async function getSpecificVersion(documentId: string, versionNumber: number) {
    try {
      const response = await api.get(`/documents/${documentId}/versions/${versionNumber}`);
      return response.data;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch version');
      throw error;
    }
  }

  async function uploadNewVersion(documentId: string, file: File, changeNotes?: string) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (changeNotes) {
        formData.append('changeNotes', changeNotes);
      }

      const response = await api.post(`/documents/${documentId}/versions`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to upload new version');
      throw error;
    }
  }

  async function restoreVersion(documentId: string, versionNumber: number) {
    try {
      const response = await api.post(`/documents/${documentId}/restore/${versionNumber}`);
      return response.data;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to restore version');
      throw error;
    }
  }

  // ===== Phase 15.3: PDF Generation Methods =====

  async function generateInvoicePDF(invoiceId: string, options: any = {}) {
    try {
      const response = await api.post(`/documents/generate/invoice/${invoiceId}`, options, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoiceId}.pdf`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to generate invoice PDF');
      throw error;
    }
  }

  async function generatePurchaseOrderPDF(poId: string, options: any = {}) {
    try {
      const response = await api.post(`/documents/generate/purchase-order/${poId}`, options, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `purchase-order-${poId}.pdf`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to generate purchase order PDF');
      throw error;
    }
  }

  async function generateExpenseReportPDF(expenseId: string, options: any = {}) {
    try {
      const response = await api.post(`/documents/generate/expense-report/${expenseId}`, options, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `expense-report-${expenseId}.pdf`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to generate expense report PDF');
      throw error;
    }
  }

  async function generateProjectReportPDF(projectId: string, options: any = {}) {
    try {
      const response = await api.post(`/documents/generate/project-report/${projectId}`, options, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `project-report-${projectId}.pdf`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to generate project report PDF');
      throw error;
    }
  }

  async function generateSafetyReportPDF(incidentId: string, options: any = {}) {
    try {
      const response = await api.post(`/documents/generate/safety-report/${incidentId}`, options, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `safety-report-${incidentId}.pdf`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to generate safety report PDF');
      throw error;
    }
  }

  async function compareVersions(documentId: string, fromVersion: number, toVersion: number) {
    try {
      const response = await api.get(`/documents/${documentId}/compare`, {
        params: { from: fromVersion, to: toVersion },
      });
      return response.data;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to compare versions');
      throw error;
    }
  }

  async function savePDFToLibrary(data: {
    documentType: string;
    entityId: string;
    module: string;
    referenceId?: string;
    category: string;
    description?: string;
    tags?: string[];
    data?: any;
    options?: any;
  }) {
    try {
      const response = await api.post('/documents/generate/save', data);
      return response.data;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to save PDF to library');
      throw error;
    }
  }

  async function generatePDFPreview(
    documentType: string,
    entityId: string,
    options: any = {},
    customData?: any,
  ) {
    try {
      if (documentType === 'custom') {
        const response = await api.post(
          `/documents/generate/custom`,
          { data: customData || {}, options },
          { responseType: 'blob' },
        );
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        return url;
      }

      const endpoint = (() => {
        switch (documentType) {
          case 'invoice':
            return `/documents/generate/invoice/${entityId}`;
          case 'purchase-order':
            return `/documents/generate/purchase-order/${entityId}`;
          case 'expense-report':
            return `/documents/generate/expense-report/${entityId}`;
          case 'project-report':
            return `/documents/generate/project-report/${entityId}`;
          case 'safety-report':
            return `/documents/generate/safety-report/${entityId}`;
          default:
            throw new Error('Invalid document type');
        }
      })();

      const response = await api.post(endpoint, options, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      return url;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to generate PDF preview');
      throw error;
    }
  }

  async function generateCustomPDFPreview(data: any, options: any = {}) {
    return generatePDFPreview('custom', 'custom', options, data);
  }

  // ===== Phase 15.4: Digital Signatures & Document Security =====

  async function signDocument(
    documentId: string,
    signatureData: string,
    reason?: string,
    metadata?: any,
  ) {
    try {
      const response = await api.post(`/documents/${documentId}/sign`, {
        signatureData,
        reason,
        metadata,
      });
      return response.data;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to sign document');
      throw error;
    }
  }

  async function getDocumentSignatures(documentId: string) {
    try {
      const response = await api.get(`/documents/${documentId}/signatures`);
      return response.data;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch signatures');
      throw error;
    }
  }

  async function verifySignature(documentId: string, signatureId: string) {
    try {
      const response = await api.post(`/documents/${documentId}/verify-signature`, {
        signatureId,
      });
      return response.data;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to verify signature');
      throw error;
    }
  }

  async function revokeSignature(signatureId: string, reason: string) {
    try {
      const response = await api.delete(`/documents/signatures/${signatureId}`, {
        data: { reason },
      });
      return response.data;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to revoke signature');
      throw error;
    }
  }

  async function checkSignatureRequirement(documentId: string) {
    try {
      const response = await api.get(`/documents/${documentId}/signature-requirement`);
      return response.data;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to check signature requirement');
      throw error;
    }
  }

  async function setDocumentSecurity(
    documentId: string,
    securitySettings: {
      isPasswordProtected?: boolean;
      password?: string;
      hasWatermark?: boolean;
      watermarkText?: string;
      isEncrypted?: boolean;
      expiresAt?: string;
      maxDownloads?: number;
      requireSignature?: boolean;
      allowPrint?: boolean;
      allowCopy?: boolean;
    },
  ) {
    try {
      const response = await api.post(`/documents/${documentId}/security`, securitySettings);
      return response.data;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to set security settings');
      throw error;
    }
  }

  async function getDocumentSecurity(documentId: string) {
    try {
      const response = await api.get(`/documents/${documentId}/security`);
      return response.data;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch security settings');
      throw error;
    }
  }

  async function removeDocumentSecurity(documentId: string) {
    try {
      const response = await api.delete(`/documents/${documentId}/security`);
      return response.data;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to remove security settings');
      throw error;
    }
  }

  async function verifyDocumentPassword(documentId: string, password: string) {
    try {
      const response = await api.post(`/documents/${documentId}/verify-password`, { password });
      return response.data;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to verify password');
      throw error;
    }
  }

  async function checkDocumentAccess(documentId: string) {
    try {
      const response = await api.get(`/documents/${documentId}/check-access`);
      return response.data;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to check document access');
      throw error;
    }
  }

  async function logDocumentAccess(
    documentId: string,
    action: 'VIEWED' | 'DOWNLOADED' | 'EDITED' | 'DELETED' | 'SHARED' | 'SIGNED',
    metadata?: any,
  ) {
    try {
      const response = await api.post(`/documents/${documentId}/log-access`, {
        action,
        metadata,
      });
      return response.data;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to log access');
      throw error;
    }
  }

  async function getDocumentAccessLogs(
    documentId: string,
    filters?: {
      action?: string;
      userId?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    try {
      const params = new URLSearchParams();
      if (filters?.action) params.append('action', filters.action);
      if (filters?.userId) params.append('userId', filters.userId);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(
        `/documents/${documentId}/access-log?${params.toString()}`,
      );
      return response.data;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch access logs');
      throw error;
    }
  }

  async function getMyAccessLogs(filters?: {
    action?: string;
    startDate?: string;
    endDate?: string;
  }) {
    try {
      const params = new URLSearchParams();
      if (filters?.action) params.append('action', filters.action);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(
        `/documents/access-log/my-activity?${params.toString()}`,
      );
      return response.data;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch my access logs');
      throw error;
    }
  }

  return {
    loading,
    error,
    uploadProgress,
    uploadDocument,
    uploadMultipleDocuments,
    getDocuments,
    getDocument,
    updateDocument,
    deleteDocument,
    downloadDocument,
    searchDocuments,
    getMyUploads,
    getRecentDocuments,
    getStatistics,
    getDocumentsByModule,
    getStorageUsage,
    batchDelete,
    batchDownload,
    batchAddTags,
    resetUploadProgress,
    getVersionHistory,
    getSpecificVersion,
    uploadNewVersion,
    restoreVersion,
    compareVersions,
    generateInvoicePDF,
    generatePurchaseOrderPDF,
    generateExpenseReportPDF,
    generateProjectReportPDF,
    generateSafetyReportPDF,
    savePDFToLibrary,
    generatePDFPreview,
    generateCustomPDFPreview,
    signDocument,
    getDocumentSignatures,
    verifySignature,
    revokeSignature,
    checkSignatureRequirement,
    setDocumentSecurity,
    getDocumentSecurity,
    removeDocumentSecurity,
    verifyDocumentPassword,
    checkDocumentAccess,
    logDocumentAccess,
    getDocumentAccessLogs,
    getMyAccessLogs,

    // Phase 16.3
    listComments,
    addComment,
    replyToComment,
    updateComment,
    deleteComment,
    resolveComment,
    listAnnotations,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    shareDocument,
    getSharedWithMe,
    getSharedByMe,
    revokeShare,
    presenceHeartbeat,
    listPresenceViewers,
    getUsers,
  };
};
