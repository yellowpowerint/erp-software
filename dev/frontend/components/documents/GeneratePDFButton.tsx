'use client';

import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import GenerateDocumentModal from './GenerateDocumentModal';
import PdfPreviewModal, { SaveToLibraryData } from './PdfPreviewModal';
import { useDocuments } from '@/hooks/useDocuments';

interface GeneratePDFButtonProps {
  documentType: 'invoice' | 'purchase-order' | 'expense-report' | 'project-report' | 'safety-report';
  entityId: string;
  buttonText?: string;
  buttonClassName?: string;
  variant?: 'primary' | 'secondary' | 'outline';
}

export default function GeneratePDFButton({
  documentType,
  entityId,
  buttonText,
  buttonClassName,
  variant = 'secondary',
}: GeneratePDFButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [lastOptions, setLastOptions] = useState<any>(null);
  const {
    generatePDFPreview,
    savePDFToLibrary,
  } = useDocuments();

  useEffect(() => {
    return () => {
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleGenerate = async (options: any) => {
    try {
      setLastOptions(options);

      const url = await generatePDFPreview(documentType, entityId, options);

      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
      }

      setPreviewUrl(url);
      setPreviewOpen(true);
      return url;
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      throw error;
    }
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
  };

  const handleRegenerate = () => {
    setPreviewOpen(false);
    setIsModalOpen(true);
  };

  const handleSaveToLibrary = async (saveData: SaveToLibraryData) => {
    await savePDFToLibrary({
      documentType,
      entityId,
      module: saveData.module,
      category: saveData.category,
      description: saveData.description,
      tags: saveData.tags,
      options: lastOptions || {},
    });
  };

  const getDefaultButtonText = () => {
    switch (documentType) {
      case 'invoice':
        return 'Generate Invoice PDF';
      case 'purchase-order':
        return 'Generate PO PDF';
      case 'expense-report':
        return 'Generate Expense PDF';
      case 'project-report':
        return 'Generate Report PDF';
      case 'safety-report':
        return 'Generate Safety PDF';
      default:
        return 'Generate PDF';
    }
  };

  const getButtonClasses = () => {
    if (buttonClassName) return buttonClassName;

    const baseClasses = 'px-4 py-2 rounded-lg transition-colors flex items-center space-x-2';
    
    switch (variant) {
      case 'primary':
        return `${baseClasses} bg-blue-600 text-white hover:bg-blue-700`;
      case 'secondary':
        return `${baseClasses} bg-gray-100 text-gray-700 hover:bg-gray-200`;
      case 'outline':
        return `${baseClasses} border-2 border-blue-600 text-blue-600 hover:bg-blue-50`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-700 hover:bg-gray-200`;
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={getButtonClasses()}
      >
        <FileText className="h-4 w-4" />
        <span>{buttonText || getDefaultButtonText()}</span>
      </button>

      <GenerateDocumentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        documentType={documentType}
        entityId={entityId}
        onGenerate={handleGenerate}
        initialOptions={lastOptions || undefined}
      />

      {previewUrl && (
        <PdfPreviewModal
          isOpen={previewOpen}
          onClose={handleClosePreview}
          pdfUrl={previewUrl}
          documentType={documentType}
          entityId={entityId}
          onSaveToLibrary={handleSaveToLibrary}
          onRegenerate={handleRegenerate}
        />
      )}
    </>
  );
}
