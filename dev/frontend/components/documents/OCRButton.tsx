'use client';

import { useState } from 'react';
import { FileText, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { OCRStatus, OCRProvider } from '@/types/ocr';
import { ocrApi } from '@/lib/ocr-api';

interface OCRButtonProps {
  documentId: string;
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
  className?: string;
}

export default function OCRButton({
  documentId,
  onComplete,
  onError,
  className = '',
}: OCRButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<OCRStatus | null>(null);
  const [progress, setProgress] = useState(0);

  const handleExtractText = async () => {
    setIsProcessing(true);
    setStatus(OCRStatus.PROCESSING);
    setProgress(0);

    try {
      const result = await ocrApi.extractText(documentId, {
        provider: OCRProvider.TESSERACT_JS,
        language: 'eng',
        autoRotate: true,
        enhanceImage: true,
      });

      setStatus(OCRStatus.COMPLETED);
      setProgress(100);

      if (onComplete) {
        onComplete(result);
      }
    } catch (error: any) {
      setStatus(OCRStatus.FAILED);
      if (onError) {
        onError(error.message);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case OCRStatus.PROCESSING:
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case OCRStatus.COMPLETED:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case OCRStatus.FAILED:
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getButtonText = () => {
    switch (status) {
      case OCRStatus.PROCESSING:
        return 'Processing...';
      case OCRStatus.COMPLETED:
        return 'Text Extracted';
      case OCRStatus.FAILED:
        return 'Failed - Retry';
      default:
        return 'Extract Text';
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <button
        onClick={handleExtractText}
        disabled={isProcessing && status === OCRStatus.PROCESSING}
        className={`
          inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium
          transition-colors duration-200
          ${
            status === OCRStatus.COMPLETED
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : status === OCRStatus.FAILED
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {getStatusIcon()}
        <span>{getButtonText()}</span>
      </button>

      {isProcessing && status === OCRStatus.PROCESSING && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
