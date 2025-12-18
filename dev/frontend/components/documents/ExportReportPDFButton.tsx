'use client';

import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import GenerateDocumentModal from './GenerateDocumentModal';
import PdfPreviewModal, { SaveToLibraryData } from './PdfPreviewModal';
import { useDocuments } from '@/hooks/useDocuments';

interface ExportReportPDFButtonProps {
  title: string;
  reportData: any;
  module?: string;
  category?: string;
  referenceId?: string;
  buttonText?: string;
}

export default function ExportReportPDFButton({
  title,
  reportData,
  module = 'reports',
  category = 'AUDIT_DOCUMENT',
  referenceId = 'report',
  buttonText = 'Export as PDF',
}: ExportReportPDFButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [lastOptions, setLastOptions] = useState<any>(null);

  const { generateCustomPDFPreview, savePDFToLibrary } = useDocuments();

  useEffect(() => {
    return () => {
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleGenerate = async (options: any) => {
    setLastOptions(options);

    const customData = {
      title,
      sections: [
        {
          title: 'Report Data',
          content: JSON.stringify(reportData, null, 2),
        },
      ],
    };

    const url = await generateCustomPDFPreview(customData, options);

    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(url);
    setPreviewOpen(true);
    return url;
  };

  const handleRegenerate = () => {
    setPreviewOpen(false);
    setIsModalOpen(true);
  };

  const handleSaveToLibrary = async (saveData: SaveToLibraryData) => {
    await savePDFToLibrary({
      documentType: 'custom',
      entityId: referenceId,
      module: saveData.module || module,
      category: saveData.category || category,
      description: saveData.description || title,
      tags: saveData.tags || ['report', 'generated', 'pdf'],
      options: lastOptions || {},
      data: {
        title,
        sections: [
          {
            title: 'Report Data',
            content: JSON.stringify(reportData, null, 2),
          },
        ],
      },
    });
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
      >
        <FileText className="w-4 h-4" />
        <span>{buttonText}</span>
      </button>

      <GenerateDocumentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        documentType="custom"
        entityId={referenceId}
        onGenerate={handleGenerate}
        initialOptions={lastOptions || undefined}
      />

      {previewUrl && (
        <PdfPreviewModal
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
          pdfUrl={previewUrl}
          documentType="custom"
          entityId={referenceId}
          onSaveToLibrary={handleSaveToLibrary}
          onRegenerate={handleRegenerate}
        />
      )}
    </>
  );
}
