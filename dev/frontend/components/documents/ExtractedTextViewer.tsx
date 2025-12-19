'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, Download, Eye, EyeOff, Edit2, Save, X } from 'lucide-react';
import { ocrApi } from '@/lib/ocr-api';

interface ExtractedTextViewerProps {
  documentId: string;
  extractedText?: string;
  confidence?: number;
  onClose?: () => void;
  showOriginal?: boolean;
}

export default function ExtractedTextViewer({
  documentId,
  extractedText: initialText,
  confidence,
  onClose,
  showOriginal = false,
}: ExtractedTextViewerProps) {
  const [extractedText, setExtractedText] = useState(initialText || '');
  const [isLoading, setIsLoading] = useState(!initialText);
  const [copied, setCopied] = useState(false);
  const [showConfidence, setShowConfidence] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!initialText) {
      fetchExtractedText();
    }
  }, [documentId, initialText]);

  const fetchExtractedText = async () => {
    try {
      const text = await ocrApi.getExtractedText(documentId);
      setExtractedText(text);
    } catch (error) {
      console.error('Failed to fetch extracted text:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setEditedText(extractedText);
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await ocrApi.updateExtractedText(documentId, editedText);
      setExtractedText(editedText);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save extracted text:', error);
      alert('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedText('');
  };

  const startEditing = () => {
    setEditedText(extractedText);
    setIsEditing(true);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([extractedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extracted-text-${documentId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Extracted Text</h3>
            {confidence !== undefined && showConfidence && (
              <p className="text-sm text-gray-600 mt-1">
                Confidence: {confidence.toFixed(2)}%
                <span
                  className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                    confidence >= 90
                      ? 'bg-green-100 text-green-800'
                      : confidence >= 70
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {confidence >= 90 ? 'High' : confidence >= 70 ? 'Medium' : 'Low'}
                </span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfidence(!showConfidence)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title={showConfidence ? 'Hide confidence' : 'Show confidence'}
            >
              {showConfidence ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>

            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {extractedText ? (
          <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800">
              {extractedText}
            </pre>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No extracted text available
          </div>
        )}
      </div>

      {/* Character count */}
      <div className="border-t border-gray-200 px-4 py-2 bg-gray-50 rounded-b-lg">
        <p className="text-xs text-gray-600">
          {extractedText.length.toLocaleString()} characters
          {' • '}
          {extractedText.split(/\s+/).filter(Boolean).length.toLocaleString()} words
          {' • '}
          {extractedText.split('\n').length.toLocaleString()} lines
        </p>
      </div>
    </div>
  );
}
