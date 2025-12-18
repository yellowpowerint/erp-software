'use client';

import { useState } from 'react';
import { Clock, Download, RotateCcw, User, FileText, GitCompare } from 'lucide-react';
import { format } from 'date-fns';
import CompareVersionsModal from './CompareVersionsModal';

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

interface VersionHistoryProps {
  documentId: string;
  versions: DocumentVersion[];
  currentVersion: number;
  onRestore: (versionNumber: number) => Promise<void>;
  onDownloadVersion: (version: DocumentVersion) => Promise<void>;
  onCompare: (fromVersion: number, toVersion: number) => Promise<any>;
}

export default function VersionHistory({
  documentId,
  versions,
  currentVersion,
  onRestore,
  onDownloadVersion,
  onCompare,
}: VersionHistoryProps) {
  const [restoringVersion, setRestoringVersion] = useState<number | null>(null);
  const [selectedVersions, setSelectedVersions] = useState<number[]>([]);
  const [compareData, setCompareData] = useState<any>(null);
  const [showCompareModal, setShowCompareModal] = useState(false);

  const handleRestore = async (versionNumber: number) => {
    if (!confirm(`Are you sure you want to restore version ${versionNumber}? This will create a new version with the content from version ${versionNumber}.`)) {
      return;
    }

    setRestoringVersion(versionNumber);
    try {
      await onRestore(versionNumber);
    } finally {
      setRestoringVersion(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleVersionSelect = (versionNumber: number) => {
    if (selectedVersions.includes(versionNumber)) {
      setSelectedVersions(selectedVersions.filter(v => v !== versionNumber));
    } else if (selectedVersions.length < 2) {
      setSelectedVersions([...selectedVersions, versionNumber]);
    } else {
      setSelectedVersions([selectedVersions[1], versionNumber]);
    }
  };

  const handleCompare = async () => {
    if (selectedVersions.length !== 2) return;
    
    const [from, to] = selectedVersions.sort((a, b) => a - b);
    try {
      const result = await onCompare(from, to);
      setCompareData(result);
      setShowCompareModal(true);
    } catch (error) {
      console.error('Failed to compare versions:', error);
      alert('Failed to compare versions. Please try again.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Version History</h3>
        <div className="flex items-center space-x-3">
          {selectedVersions.length === 2 && (
            <button
              onClick={handleCompare}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <GitCompare className="h-4 w-4" />
              <span>Compare Selected</span>
            </button>
          )}
          <span className="text-sm text-gray-500">
            Current: Version {currentVersion}
          </span>
        </div>
      </div>

      {selectedVersions.length > 0 && (
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-sm text-purple-800">
            <strong>Compare Mode:</strong> {selectedVersions.length === 1 ? 'Select one more version to compare' : `Comparing versions ${selectedVersions.join(' and ')}`}
          </p>
        </div>
      )}

      {versions.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 text-sm">No version history available</p>
          <p className="text-gray-500 text-xs mt-1">
            Upload a new version to start tracking changes
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {versions.map((version) => (
            <div
              key={version.id}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedVersions.includes(version.versionNumber)
                  ? 'border-purple-500 bg-purple-50'
                  : version.versionNumber === currentVersion
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <input
                      type="checkbox"
                      checked={selectedVersions.includes(version.versionNumber)}
                      onChange={() => handleVersionSelect(version.versionNumber)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <span className="font-semibold text-gray-900">
                      Version {version.versionNumber}
                    </span>
                    {version.versionNumber === currentVersion && (
                      <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                        Current
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>
                        {version.uploadedBy.firstName} {version.uploadedBy.lastName}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>{format(new Date(version.createdAt), 'MMM d, yyyy h:mm a')}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>{formatFileSize(version.fileSize)}</span>
                    </div>

                    {version.changeNotes && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                        <span className="font-medium">Notes:</span> {version.changeNotes}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col space-y-2 ml-4">
                  <button
                    onClick={() => onDownloadVersion(version)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Download this version"
                  >
                    <Download className="h-4 w-4" />
                  </button>

                  {version.versionNumber !== currentVersion && (
                    <button
                      onClick={() => handleRestore(version.versionNumber)}
                      disabled={restoringVersion === version.versionNumber}
                      className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Restore this version"
                    >
                      {restoringVersion === version.versionNumber ? (
                        <div className="animate-spin h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Restoring a previous version will create a new version with the content from the selected version. The current version will be preserved in the history.
        </p>
      </div>

      {compareData && (
        <CompareVersionsModal
          isOpen={showCompareModal}
          onClose={() => {
            setShowCompareModal(false);
            setSelectedVersions([]);
          }}
          documentId={documentId}
          fromVersion={compareData.from}
          toVersion={compareData.to}
          differences={compareData.differences}
        />
      )}
    </div>
  );
}
