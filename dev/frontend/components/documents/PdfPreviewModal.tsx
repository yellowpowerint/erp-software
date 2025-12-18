'use client';

import { useState } from 'react';
import { X, Download, Save, RotateCcw, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

const PdfViewerClient = dynamic(() => import('./PdfViewerClient'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full">Loading PDF viewer...</div>,
});

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  documentType: string;
  entityId: string;
  onSaveToLibrary: (saveData: SaveToLibraryData) => Promise<void>;
  onRegenerate: () => void;
}

export interface SaveToLibraryData {
  module: string;
  category: string;
  description?: string;
  tags?: string[];
}

export default function PdfPreviewModal({
  isOpen,
  onClose,
  pdfUrl,
  documentType,
  entityId,
  onSaveToLibrary,
  onRegenerate,
}: PdfPreviewModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveData, setSaveData] = useState<SaveToLibraryData>({
    module: getDefaultModule(documentType),
    category: getDefaultCategory(documentType),
    description: `Generated ${documentType} PDF`,
    tags: [documentType, 'generated', 'pdf'],
  });

  if (!isOpen) return null;

  function getDefaultModule(type: string): string {
    switch (type) {
      case 'invoice':
        return 'finance';
      case 'purchase-order':
        return 'procurement';
      case 'expense-report':
        return 'finance';
      case 'project-report':
        return 'projects';
      case 'safety-report':
        return 'safety';
      default:
        return 'general';
    }
  }

  function getDefaultCategory(type: string): string {
    switch (type) {
      case 'invoice':
        return 'INVOICE';
      case 'purchase-order':
        return 'PURCHASE_ORDER';
      case 'expense-report':
        return 'PAYROLL';
      case 'project-report':
        return 'PROJECT_REPORT';
      case 'safety-report':
        return 'SAFETY_REPORT';
      default:
        return 'OTHER';
    }
  }

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${documentType}-${entityId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveToLibrary(saveData);
      alert('PDF saved to document library successfully!');
      onClose();
    } catch (error) {
      console.error('Failed to save PDF:', error);
      alert('Failed to save PDF to library. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black opacity-50" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">PDF Preview</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={onRegenerate}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Regenerate</span>
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </button>
              <button
                onClick={() => setShowSaveForm(!showSaveForm)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>Save to Library</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {showSaveForm && (
            <div className="p-6 bg-gray-50 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Save to Document Library</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Module
                  </label>
                  <input
                    type="text"
                    value={saveData.module}
                    onChange={(e) => setSaveData({ ...saveData, module: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={saveData.category}
                    onChange={(e) => setSaveData({ ...saveData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="INVOICE">Invoice</option>
                    <option value="PURCHASE_ORDER">Purchase Order</option>
                    <option value="PAYROLL">Payroll/Expense</option>
                    <option value="PROJECT_REPORT">Project Report</option>
                    <option value="SAFETY_REPORT">Safety Report</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={saveData.description}
                    onChange={(e) => setSaveData({ ...saveData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={saveData.tags?.join(', ')}
                    onChange={(e) => setSaveData({ ...saveData, tags: e.target.value.split(',').map(t => t.trim()) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={() => setShowSaveForm(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-auto p-6">
            <div className="h-full min-h-[600px]">
              <PdfViewerClient fileUrl={pdfUrl} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
