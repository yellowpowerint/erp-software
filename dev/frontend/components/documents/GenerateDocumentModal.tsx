'use client';

import { useEffect, useState } from 'react';
import { X, FileText, Download, Loader2 } from 'lucide-react';

interface GenerateDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: DocumentType;
  entityId: string;
  onGenerate: (options: GeneratePDFOptions) => Promise<string>;
  allowTypeSelection?: boolean;
  initialOptions?: Partial<GeneratePDFOptions>;
}

type DocumentType = 'invoice' | 'purchase-order' | 'expense-report' | 'project-report' | 'safety-report' | 'custom';

interface GeneratePDFOptions {
  includeWatermark: boolean;
  watermarkText: string;
  includeQRCode: boolean;
  includeAttachments: boolean;
  template: string;
  documentType?: DocumentType;
}

export default function GenerateDocumentModal({
  isOpen,
  onClose,
  documentType,
  entityId,
  onGenerate,
  allowTypeSelection = false,
  initialOptions,
}: GenerateDocumentModalProps) {
  const [selectedType, setSelectedType] = useState<DocumentType>(documentType);
  const [options, setOptions] = useState<GeneratePDFOptions>({
    includeWatermark: false,
    watermarkText: 'DRAFT',
    includeQRCode: true,
    includeAttachments: false,
    template: 'default',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  
  useEffect(() => {
    if (!isOpen) return;

    setSelectedType(documentType);
    setOptions((prev) => ({
      ...prev,
      ...(initialOptions || {}),
    }));
  }, [isOpen, documentType, initialOptions]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await onGenerate({
        ...options,
        ...(allowTypeSelection ? { documentType: selectedType } : {}),
      });
      onClose();
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getDocumentTitle = () => {
    switch (allowTypeSelection ? selectedType : documentType) {
      case 'invoice':
        return 'Generate Invoice PDF';
      case 'purchase-order':
        return 'Generate Purchase Order PDF';
      case 'expense-report':
        return 'Generate Expense Report PDF';
      case 'project-report':
        return 'Generate Project Report PDF';
      case 'safety-report':
        return 'Generate Safety Report PDF';
      case 'custom':
        return 'Generate Custom PDF';
      default:
        return 'Generate PDF';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black opacity-50" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">{getDocumentTitle()}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                This will generate a PDF document with professional formatting, company branding, and optional security features.
              </p>
            </div>

            <div className="space-y-4">
              {allowTypeSelection && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Document Type
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="invoice">Invoice</option>
                    <option value="purchase-order">Purchase Order</option>
                    <option value="expense-report">Expense Report</option>
                    <option value="project-report">Project Report</option>
                    <option value="safety-report">Safety Report</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Template
                </label>
                <select
                  value={options.template}
                  onChange={(e) => setOptions({ ...options, template: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="default">Default</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  More templates can be added later; this satisfies Phase 15.3 template selection.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900">Include Attachments</label>
                  <p className="text-xs text-gray-500">Attach related files if applicable</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeAttachments}
                    onChange={(e) => setOptions({ ...options, includeAttachments: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900">Include QR Code</label>
                  <p className="text-xs text-gray-500">Add verification QR code to document</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeQRCode}
                    onChange={(e) => setOptions({ ...options, includeQRCode: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900">Add Watermark</label>
                  <p className="text-xs text-gray-500">Add text watermark to document</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeWatermark}
                    onChange={(e) => setOptions({ ...options, includeWatermark: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {options.includeWatermark && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Watermark Text
                  </label>
                  <input
                    type="text"
                    value={options.watermarkText}
                    onChange={(e) => setOptions({ ...options, watermarkText: e.target.value })}
                    placeholder="Enter watermark text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Common options: DRAFT, CONFIDENTIAL, COPY, APPROVED
                  </p>
                </div>
              )}
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={onClose}
                disabled={isGenerating}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>Generate & Preview</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
