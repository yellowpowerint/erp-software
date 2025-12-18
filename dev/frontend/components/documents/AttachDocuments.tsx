'use client';

import { useState } from 'react';
import { Paperclip, X } from 'lucide-react';
import { DocumentCategory } from '@/types/document';
import DocumentUpload from './DocumentUpload';

interface AttachDocumentsProps {
  module: string;
  referenceId?: string;
  category?: DocumentCategory;
  onUploadComplete?: () => void;
  buttonText?: string;
  buttonClassName?: string;
}

export default function AttachDocuments({
  module,
  referenceId,
  category = DocumentCategory.OTHER,
  onUploadComplete,
  buttonText = 'Attach Documents',
  buttonClassName = 'px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center space-x-2',
}: AttachDocumentsProps) {
  const [showUpload, setShowUpload] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowUpload(true)}
        className={buttonClassName}
      >
        <Paperclip className="h-4 w-4" />
        <span>{buttonText}</span>
      </button>

      {showUpload && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div 
              className="fixed inset-0 bg-black opacity-50" 
              onClick={() => setShowUpload(false)} 
            />
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Attach Documents</h2>
                <button
                  onClick={() => setShowUpload(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <DocumentUpload
                module={module}
                referenceId={referenceId}
                category={category}
                onUploadComplete={(docs) => {
                  setShowUpload(false);
                  onUploadComplete?.();
                }}
                onUploadError={(error) => {
                  console.error('Upload error:', error);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
