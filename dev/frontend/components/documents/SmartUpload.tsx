'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { ExtractedDataType, InvoiceData, ReceiptData, OCRProvider } from '@/types/ocr';
import api from '@/lib/api';
import { ocrApi } from '@/lib/ocr-api';

interface SmartUploadProps {
  onInvoiceExtracted?: (data: InvoiceData) => void;
  onReceiptExtracted?: (data: ReceiptData) => void;
  onUploadComplete?: (documentId: string) => void;
  acceptedTypes?: string[];
  maxSize?: number;
}

export default function SmartUpload({
  onInvoiceExtracted,
  onReceiptExtracted,
  onUploadComplete,
  acceptedTypes = ['image/*', 'application/pdf'],
  maxSize = 10 * 1024 * 1024, // 10MB
}: SmartUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [dataType, setDataType] = useState<ExtractedDataType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Upload file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'INVOICE'); // Default category
      formData.append('module', 'finance');

      const uploadResponse = await api.post('/documents/upload', formData);

      const docId = uploadResponse.data.data.id;
      setDocumentId(docId);
      setUploadProgress(50);

      // Detect document type and perform OCR
      setIsProcessing(true);
      const detectedType = await detectDocumentType(file.name);
      setDataType(detectedType);

      // Extract text using authenticated API
      await ocrApi.extractText(docId, {
        provider: OCRProvider.TESSERACT_JS,
        language: 'eng',
      });

      setUploadProgress(75);

      // Parse based on detected type
      let parseData;
      if (detectedType === ExtractedDataType.INVOICE) {
        parseData = await ocrApi.parseInvoice(docId);
      } else if (detectedType === ExtractedDataType.RECEIPT) {
        parseData = await ocrApi.parseReceipt(docId);
      }

      if (parseData) {
        setExtractedData(parseData);
        setUploadProgress(100);

        // Notify parent components
        if (detectedType === ExtractedDataType.INVOICE && onInvoiceExtracted) {
          onInvoiceExtracted(parseData);
        } else if (detectedType === ExtractedDataType.RECEIPT && onReceiptExtracted) {
          onReceiptExtracted(parseData);
        }
      }

      if (onUploadComplete) {
        onUploadComplete(docId);
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
    }
  }, [onInvoiceExtracted, onReceiptExtracted, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize,
    multiple: false,
  });

  const detectDocumentType = async (fileName: string): Promise<ExtractedDataType> => {
    const lowerName = fileName.toLowerCase();
    if (lowerName.includes('invoice') || lowerName.includes('inv')) {
      return ExtractedDataType.INVOICE;
    } else if (lowerName.includes('receipt') || lowerName.includes('rcpt')) {
      return ExtractedDataType.RECEIPT;
    }
    return ExtractedDataType.INVOICE; // Default
  };

  const handleUseData = () => {
    if (extractedData && dataType === ExtractedDataType.INVOICE && onInvoiceExtracted) {
      onInvoiceExtracted(extractedData);
    } else if (extractedData && dataType === ExtractedDataType.RECEIPT && onReceiptExtracted) {
      onReceiptExtracted(extractedData);
    }
  };

  return (
    <div className="w-full">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}
          ${isUploading || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} disabled={isUploading || isProcessing} />
        
        <div className="flex flex-col items-center gap-3">
          {isUploading || isProcessing ? (
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
          ) : (
            <Upload className="h-12 w-12 text-gray-400" />
          )}

          <div>
            <p className="text-lg font-medium text-gray-900">
              {isUploading
                ? 'Uploading...'
                : isProcessing
                ? 'Processing with OCR...'
                : isDragActive
                ? 'Drop file here'
                : 'Upload Invoice or Receipt'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {isUploading || isProcessing
                ? 'Please wait while we process your document'
                : 'Drag & drop or click to select (PDF, JPG, PNG)'}
            </p>
          </div>

          {(isUploading || isProcessing) && (
            <div className="w-full max-w-xs">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">{uploadProgress}%</p>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Upload Failed</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Extracted Data Preview */}
      {extractedData && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-green-900">
                {dataType === ExtractedDataType.INVOICE ? 'Invoice' : 'Receipt'} Data Extracted
              </p>
              
              <div className="mt-3 space-y-2">
                {dataType === ExtractedDataType.INVOICE && (
                  <>
                    {extractedData.invoiceNumber && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Invoice #:</span> {extractedData.invoiceNumber}
                      </p>
                    )}
                    {extractedData.supplierName && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Supplier:</span> {extractedData.supplierName}
                      </p>
                    )}
                    {extractedData.totalAmount && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Total:</span>{' '}
                        {extractedData.currency || 'GHS'} {extractedData.totalAmount.toFixed(2)}
                      </p>
                    )}
                  </>
                )}

                {dataType === ExtractedDataType.RECEIPT && (
                  <>
                    {extractedData.vendorName && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Vendor:</span> {extractedData.vendorName}
                      </p>
                    )}
                    {extractedData.receiptAmount && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Amount:</span> GHS {extractedData.receiptAmount.toFixed(2)}
                      </p>
                    )}
                  </>
                )}
              </div>

              <button
                onClick={handleUseData}
                className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                Use This Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
