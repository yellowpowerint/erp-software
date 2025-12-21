import { useCallback, useState } from 'react';
import api from '@/lib/api';
import type {
  ColumnMapping,
  CsvModule,
  CsvUploadValidationResult,
  CsvAuditLog,
  CsvBatch,
  CsvStatsResult,
  ExportPreviewResult,
  ExportJob,
  BackupExportResult,
  BackupImportResult,
  BackupValidateResult,
  ImportJob,
  ImportTemplate,
  ScheduledExport,
  ScheduledExportRun,
} from '@/types/csv';

export const useCSV = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadCSV = useCallback(async (file: File, module?: CsvModule): Promise<CsvUploadValidationResult> => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (module) {
        formData.append('module', module);
      }

      const res = await api.post('/csv/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      return res.data.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to upload CSV';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const previewExport = useCallback(async (module: CsvModule, payload: { columns: string[]; filters?: any; limit?: number; context?: any }): Promise<ExportPreviewResult> => {
    const res = await api.post(`/csv/export/${module}/preview`, payload);
    return res.data.data;
  }, []);

  const startImport = useCallback(
    async (
      module: CsvModule,
      file: File,
      mappings?: ColumnMapping[],
      context?: any,
    ): Promise<ImportJob> => {
      setLoading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('file', file);
        if (mappings) {
          formData.append('mappings', JSON.stringify(mappings));
        }
        if (context) {
          formData.append('context', JSON.stringify(context));
        }

        const res = await api.post(`/csv/import/${module}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        return res.data.data;
      } catch (err: any) {
        const msg = err.response?.data?.message || 'Failed to start import';
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const getImportJob = useCallback(async (jobId: string): Promise<ImportJob> => {
    const res = await api.get(`/csv/import/${jobId}`);
    return res.data.data;
  }, []);

  const getImportErrors = useCallback(async (jobId: string): Promise<any[]> => {
    const res = await api.get(`/csv/import/${jobId}/errors`);
    return res.data.data;
  }, []);

  const cancelImport = useCallback(async (jobId: string): Promise<ImportJob> => {
    const res = await api.post(`/csv/import/${jobId}/cancel`);
    return res.data.data;
  }, []);

  const startExport = useCallback(
    async (
      module: CsvModule,
      columns: string[],
      filters?: any,
      fileName?: string,
      context?: any,
    ): Promise<ExportJob> => {
      setLoading(true);
      setError(null);

      try {
        const res = await api.post(`/csv/export/${module}`, { columns, filters, fileName, context });
        return res.data.data;
      } catch (err: any) {
        const msg = err.response?.data?.message || 'Failed to start export';
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const getExportJob = useCallback(async (jobId: string): Promise<ExportJob> => {
    const res = await api.get(`/csv/export/${jobId}`);
    return res.data.data;
  }, []);

  const getExportDownloadUrl = useCallback(async (jobId: string): Promise<string> => {
    // Backend redirects, but in browser we just navigate to it.
    return `/api/csv/export/${jobId}/download`;
  }, []);

  const downloadExport = useCallback(async (jobId: string, suggestedFileName?: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.get(`/csv/export/${jobId}/download`, {
        responseType: 'blob',
      });

      const blob = new Blob([res.data], { type: 'text/csv' });
      const fallback = suggestedFileName || `export-${jobId}.csv`;
      const fileName = fallback.endsWith('.csv') ? fallback : `${fallback}.csv`;
      return { blob, fileName };
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to download export';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const listTemplates = useCallback(async (module: CsvModule): Promise<ImportTemplate[]> => {
    const res = await api.get(`/csv/templates/${module}`);
    return res.data.data;
  }, []);

  const createTemplate = useCallback(async (payload: Partial<ImportTemplate> & { name: string; module: CsvModule; columns: any }): Promise<ImportTemplate> => {
    const res = await api.post('/csv/templates', payload);
    return res.data.data;
  }, []);

  const updateTemplate = useCallback(async (id: string, payload: Partial<ImportTemplate>): Promise<ImportTemplate> => {
    const res = await api.put(`/csv/templates/${id}`, payload);
    return res.data.data;
  }, []);

  const deleteTemplate = useCallback(async (id: string): Promise<{ deleted: boolean }> => {
    const res = await api.delete(`/csv/templates/${id}`);
    return res.data.data;
  }, []);

  const listImportHistory = useCallback(async (): Promise<ImportJob[]> => {
    const res = await api.get('/csv/history/imports');
    return res.data.data;
  }, []);

  const listExportHistory = useCallback(async (): Promise<ExportJob[]> => {
    const res = await api.get('/csv/history/exports');
    return res.data.data;
  }, []);

  const getAuditTrail = useCallback(async (jobId: string): Promise<CsvAuditLog[]> => {
    const res = await api.get(`/csv/audit/${jobId}`);
    return res.data.data;
  }, []);

  const rollbackImport = useCallback(async (jobId: string): Promise<{ rolledBack: boolean }> => {
    const res = await api.post(`/csv/rollback/${jobId}`);
    return res.data.data;
  }, []);

  const getCsvStats = useCallback(async (): Promise<CsvStatsResult> => {
    const res = await api.get('/csv/stats');
    return res.data.data;
  }, []);

  const exportFullBackup = useCallback(async (): Promise<BackupExportResult> => {
    const res = await api.post('/csv/backup/export');
    return res.data.data;
  }, []);

  const validateBackup = useCallback(async (file: File): Promise<BackupValidateResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/csv/backup/validate', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data.data;
  }, []);

  const importBackup = useCallback(async (file: File, overwrite: boolean): Promise<BackupImportResult> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('overwrite', overwrite ? 'true' : 'false');
    const res = await api.post('/csv/backup/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data.data;
  }, []);

  const createScheduledExport = useCallback(async (payload: {
    name: string;
    module: CsvModule;
    filters?: any;
    columns: string[];
    context?: any;
    schedule: string;
    recipients: string[];
    format?: string;
    isActive?: boolean;
  }): Promise<ScheduledExport> => {
    const res = await api.post('/csv/scheduled-exports', payload);
    return res.data.data;
  }, []);

  const listScheduledExports = useCallback(async (): Promise<ScheduledExport[]> => {
    const res = await api.get('/csv/scheduled-exports');
    return res.data.data;
  }, []);

  const setScheduledExportActive = useCallback(async (id: string, isActive: boolean): Promise<ScheduledExport> => {
    const res = await api.post(`/csv/scheduled-exports/${id}/active`, { isActive });
    return res.data.data;
  }, []);

  const getScheduledExportRuns = useCallback(async (id: string): Promise<ScheduledExportRun[]> => {
    const res = await api.get(`/csv/scheduled-exports/${id}/runs`);
    return res.data.data;
  }, []);

  const batchImport = useCallback(async (files: File[], entries: Array<{ module: CsvModule; mappings?: any; context?: any }>): Promise<{ batch: CsvBatch; jobs: ImportJob[] }> => {
    const formData = new FormData();
    for (const f of files) {
      formData.append('files', f);
    }
    formData.append('entries', JSON.stringify(entries));
    const res = await api.post('/csv/batch/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data.data;
  }, []);

  const getBatch = useCallback(async (batchId: string): Promise<CsvBatch> => {
    const res = await api.get(`/csv/batch/${batchId}`);
    return res.data.data;
  }, []);

  const scheduleImport = useCallback(async (jobId: string, scheduledTime: string): Promise<ImportJob> => {
    const res = await api.post('/csv/schedule', { jobId, scheduledTime });
    return res.data.data;
  }, []);

  const getSampleTemplateUrl = useCallback((module: CsvModule): string => {
    return `${process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3001/api')}/csv/templates/${module}/sample`;
  }, []);

  return {
    loading,
    error,
    uploadCSV,
    startImport,
    getImportJob,
    getImportErrors,
    cancelImport,
    startExport,
    previewExport,
    getExportJob,
    getExportDownloadUrl,
    downloadExport,
    listTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    listImportHistory,
    listExportHistory,
    getAuditTrail,
    rollbackImport,
    getCsvStats,
    exportFullBackup,
    validateBackup,
    importBackup,
    createScheduledExport,
    listScheduledExports,
    setScheduledExportActive,
    getScheduledExportRuns,
    batchImport,
    getBatch,
    scheduleImport,
    getSampleTemplateUrl,
  };
};
