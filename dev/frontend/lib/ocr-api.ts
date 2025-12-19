import api from './api';
import { OCRProvider, OCRResult, InvoiceData, ReceiptData, ContractData, OCRConfiguration } from '@/types/ocr';

export const ocrApi = {
  async extractText(
    documentId: string,
    options?: {
      language?: string;
      provider?: OCRProvider;
      autoRotate?: boolean;
      enhanceImage?: boolean;
    }
  ): Promise<OCRResult> {
    const response = await api.post(`/documents/ocr/${documentId}/extract-text`, options || {});
    return response.data.data;
  },

  async parseInvoice(documentId: string): Promise<InvoiceData> {
    const response = await api.post(`/documents/ocr/${documentId}/parse-invoice`);
    return response.data.data;
  },

  async parseReceipt(documentId: string): Promise<ReceiptData> {
    const response = await api.post(`/documents/ocr/${documentId}/parse-receipt`);
    return response.data.data;
  },

  async parseContract(documentId: string): Promise<ContractData> {
    const response = await api.post(`/documents/ocr/${documentId}/parse-contract`);
    return response.data.data;
  },

  async getExtractedText(documentId: string): Promise<string> {
    const response = await api.get(`/documents/ocr/${documentId}/extracted-text`);
    return response.data.data.text;
  },

  async batchOCR(
    documentIds: string[],
    options?: {
      language?: string;
      provider?: OCRProvider;
    }
  ): Promise<{ jobsCreated: number; jobs: Array<{ jobId: string; documentId: string }> }> {
    const response = await api.post('/documents/ocr/batch-ocr', {
      documentIds,
      ...options,
    });
    return response.data.data;
  },

  async getJobStatus(jobId: string): Promise<any> {
    const response = await api.get(`/documents/ocr/jobs/${jobId}`);
    return response.data.data;
  },

  async getDocumentOCRJobs(documentId: string): Promise<any[]> {
    const response = await api.get(`/documents/ocr/${documentId}/ocr-jobs`);
    return response.data.data;
  },

  async cancelJob(jobId: string): Promise<void> {
    await api.delete(`/documents/ocr/jobs/${jobId}`);
  },

  async getExtractedData(documentId: string, type?: string): Promise<any[]> {
    const params = type ? { type } : {};
    const response = await api.get(`/documents/ocr/${documentId}/extracted-data`, { params });
    return response.data.data;
  },

  async validateExtractedData(
    extractedDataId: string,
    correctedFields?: any,
    notes?: string
  ): Promise<any> {
    const response = await api.patch(`/documents/ocr/extracted-data/${extractedDataId}/validate`, {
      correctedFields,
      notes,
    });
    return response.data.data;
  },

  async getConfiguration(): Promise<OCRConfiguration> {
    const response = await api.get('/documents/ocr/configuration');
    return response.data.data;
  },

  async updateConfiguration(config: Partial<OCRConfiguration>): Promise<OCRConfiguration> {
    const response = await api.patch('/documents/ocr/configuration', config);
    return response.data.data;
  },

  async updateExtractedText(documentId: string, text: string): Promise<void> {
    await api.patch(`/documents/${documentId}/extracted-text`, { extractedText: text });
  },
};
