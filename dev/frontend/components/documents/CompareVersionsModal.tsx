'use client';

import { useState, useEffect } from 'react';
import { X, FileText, User, Clock, Download } from 'lucide-react';
import { format } from 'date-fns';
import dynamic from 'next/dynamic';

const PdfViewerClient = dynamic(() => import('./PdfViewerClient'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full">Loading PDF viewer...</div>,
});

interface DocumentVersion {
  id: string;
  versionNumber: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedById: string;
  uploadedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  changeNotes?: string;
  createdAt: string;
}

interface CompareVersionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  fromVersion: DocumentVersion;
  toVersion: DocumentVersion;
  differences: {
    fileName: boolean;
    fileSize: boolean;
    uploadedBy: boolean;
    changeNotes: boolean;
  };
}

export default function CompareVersionsModal({
  isOpen,
  onClose,
  documentId,
  fromVersion,
  toVersion,
  differences,
}: CompareVersionsModalProps) {
  const [activeView, setActiveView] = useState<'metadata' | 'preview'>('metadata');

  if (!isOpen) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const isPDF = (fileName: string) => fileName.toLowerCase().endsWith('.pdf');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black opacity-50" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full p-6 max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Compare Versions: v{fromVersion.versionNumber} vs v{toVersion.versionNumber}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex space-x-2 mb-4 border-b border-gray-200">
            <button
              onClick={() => setActiveView('metadata')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeView === 'metadata'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Metadata Comparison
            </button>
            {isPDF(fromVersion.fileName) && isPDF(toVersion.fileName) && (
              <button
                onClick={() => setActiveView('preview')}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  activeView === 'preview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Side-by-Side Preview
              </button>
            )}
          </div>

          <div className="flex-1 overflow-auto">
            {activeView === 'metadata' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-3">Version {fromVersion.versionNumber}</h3>
                    
                    <div className="space-y-2 text-sm">
                      <div className={differences.fileName ? 'bg-yellow-100 p-2 rounded' : ''}>
                        <span className="font-medium">File Name:</span>
                        <p className="text-gray-700 mt-1">{fromVersion.fileName}</p>
                      </div>

                      <div className={differences.fileSize ? 'bg-yellow-100 p-2 rounded' : ''}>
                        <span className="font-medium">File Size:</span>
                        <p className="text-gray-700 mt-1">{formatFileSize(fromVersion.fileSize)}</p>
                      </div>

                      <div className={differences.uploadedBy ? 'bg-yellow-100 p-2 rounded' : ''}>
                        <div className="flex items-center space-x-2 mt-1">
                          <User className="h-4 w-4" />
                          <span className="text-gray-700">
                            {fromVersion.uploadedBy.firstName} {fromVersion.uploadedBy.lastName}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Clock className="h-4 w-4" />
                          <span className="text-gray-700">
                            {format(new Date(fromVersion.createdAt), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                      </div>

                      {fromVersion.changeNotes && (
                        <div className={differences.changeNotes ? 'bg-yellow-100 p-2 rounded' : ''}>
                          <span className="font-medium">Change Notes:</span>
                          <p className="text-gray-700 mt-1">{fromVersion.changeNotes}</p>
                        </div>
                      )}
                    </div>

                    <a
                      href={fromVersion.fileUrl}
                      download={fromVersion.fileName}
                      className="mt-4 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download v{fromVersion.versionNumber}</span>
                    </a>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                    <h3 className="font-semibold text-green-900 mb-3">Version {toVersion.versionNumber}</h3>
                    
                    <div className="space-y-2 text-sm">
                      <div className={differences.fileName ? 'bg-yellow-100 p-2 rounded' : ''}>
                        <span className="font-medium">File Name:</span>
                        <p className="text-gray-700 mt-1">{toVersion.fileName}</p>
                      </div>

                      <div className={differences.fileSize ? 'bg-yellow-100 p-2 rounded' : ''}>
                        <span className="font-medium">File Size:</span>
                        <p className="text-gray-700 mt-1">{formatFileSize(toVersion.fileSize)}</p>
                      </div>

                      <div className={differences.uploadedBy ? 'bg-yellow-100 p-2 rounded' : ''}>
                        <div className="flex items-center space-x-2 mt-1">
                          <User className="h-4 w-4" />
                          <span className="text-gray-700">
                            {toVersion.uploadedBy.firstName} {toVersion.uploadedBy.lastName}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Clock className="h-4 w-4" />
                          <span className="text-gray-700">
                            {format(new Date(toVersion.createdAt), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                      </div>

                      {toVersion.changeNotes && (
                        <div className={differences.changeNotes ? 'bg-yellow-100 p-2 rounded' : ''}>
                          <span className="font-medium">Change Notes:</span>
                          <p className="text-gray-700 mt-1">{toVersion.changeNotes}</p>
                        </div>
                      )}
                    </div>

                    <a
                      href={toVersion.fileUrl}
                      download={toVersion.fileName}
                      className="mt-4 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download v{toVersion.versionNumber}</span>
                    </a>
                  </div>
                </div>

                {Object.values(differences).some(d => d) && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> Highlighted fields indicate differences between versions.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeView === 'preview' && isPDF(fromVersion.fileName) && isPDF(toVersion.fileName) && (
              <div className="grid grid-cols-2 gap-4 h-[600px]">
                <div className="border-2 border-blue-200 rounded-lg overflow-hidden">
                  <div className="bg-blue-100 px-4 py-2 border-b border-blue-200">
                    <h4 className="font-semibold text-blue-900">Version {fromVersion.versionNumber}</h4>
                  </div>
                  <div className="h-[calc(100%-40px)] overflow-auto">
                    <PdfViewerClient fileUrl={fromVersion.fileUrl} />
                  </div>
                </div>

                <div className="border-2 border-green-200 rounded-lg overflow-hidden">
                  <div className="bg-green-100 px-4 py-2 border-b border-green-200">
                    <h4 className="font-semibold text-green-900">Version {toVersion.versionNumber}</h4>
                  </div>
                  <div className="h-[calc(100%-40px)] overflow-auto">
                    <PdfViewerClient fileUrl={toVersion.fileUrl} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
