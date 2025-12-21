'use client';

import { useState, useEffect } from 'react';
import { X, Download, Trash2, Edit, Save, Tag, Clock, Upload, FileText, Share2 } from 'lucide-react';
import { Document, UpdateDocumentDto, DocumentCategory } from '@/types/document';
import { useDocuments } from '@/hooks/useDocuments';
import { formatFileSize } from '@/lib/utils/file';
import { format } from 'date-fns';
import DocumentViewer from './DocumentViewer';
import VersionHistory from './VersionHistory';
import SecurityPanel from './SecurityPanel';
import AccessLog from './AccessLog';
import OCRButton from './OCRButton';
import ExtractedTextViewer from './ExtractedTextViewer';
import CommentsPanel from './CommentsPanel';
import ShareModal from './ShareModal';
import CollaborativeViewer from './CollaborativeViewer';
import DocumentAiInsightsPanel from './DocumentAiInsightsPanel';
import DocumentDuplicateAlert from './DocumentDuplicateAlert';
import DocumentQaPanel from './DocumentQaPanel';
import PermissionEditor from './PermissionEditor';
import ConvertToPdfPanel from './ConvertToPdfPanel';
import FillableFormsPanel from './FillableFormsPanel';

interface DocumentDetailModalProps {
  document: Document;
  onClose: () => void;
  onUpdate?: (document: Document) => void;
  onDelete?: (document: Document) => void;
}

export default function DocumentDetailModal({
  document,
  onClose,
  onUpdate,
  onDelete,
}: DocumentDetailModalProps) {
  const isPdf = document.mimeType === 'application/pdf';

  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(document.description || '');
  const [tags, setTags] = useState<string[]>(document.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [category, setCategory] = useState(document.category);
  const [showShare, setShowShare] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'preview' | 'details' | 'ai' | 'versions' | 'security' | 'access-log' | 'ocr' | 'comments' | 'annotations' | 'permissions'
  >('preview');
  const [versions, setVersions] = useState<any[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [uploadingVersion, setUploadingVersion] = useState(false);
  const [security, setSecurity] = useState<any>(null);
  const [loadingSecurity, setLoadingSecurity] = useState(false);
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [loadingAccessLogs, setLoadingAccessLogs] = useState(false);
  const [ocrResult, setOCRResult] = useState<any>(null);

  const { 
    updateDocument, 
    getDocument,
    downloadDocument, 
    deleteDocument, 
    getVersionHistory,
    restoreVersion,
    uploadNewVersion,
    compareVersions,
    getDocumentSecurity,
    setDocumentSecurity,
    getDocumentAccessLogs,
    loading 
  } = useDocuments();

  const refreshDocument = async () => {
    const updated = await getDocument(document.id);
    onUpdate?.(updated);
  };

  const handleSave = async () => {
    try {
      const updateData: UpdateDocumentDto = {
        description: description.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        category,
      };

      const updated = await updateDocument(document.id, updateData);
      onUpdate?.(updated);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update document:', error);
    }
  };

  const handleDownload = async () => {
    try {
      const { url, filename } = await downloadDocument(document.id);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = filename;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download document:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await deleteDocument(document.id);
      onDelete?.(document);
      onClose();
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  useEffect(() => {
    if (activeTab === 'versions') {
      loadVersionHistory();
    }
    if (activeTab === 'security') {
      loadSecurity();
    }
    if (activeTab === 'access-log') {
      loadAccessLogs();
    }
  }, [activeTab]);

  const loadVersionHistory = async () => {
    setLoadingVersions(true);
    try {
      const versionData = await getVersionHistory(document.id);
      setVersions(versionData);
    } catch (error) {
      console.error('Failed to load version history:', error);
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleRestoreVersion = async (versionNumber: number) => {
    try {
      const updated = await restoreVersion(document.id, versionNumber);
      onUpdate?.(updated);
      await loadVersionHistory();
      alert(`Version ${versionNumber} restored successfully!`);
    } catch (error) {
      console.error('Failed to restore version:', error);
      alert('Failed to restore version. Please try again.');
    }
  };

  const handleDownloadVersion = async (version: any) => {
    try {
      const link = window.document.createElement('a');
      link.href = version.fileUrl;
      link.download = version.fileName;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download version:', error);
    }
  };

  const loadSecurity = async () => {
    setLoadingSecurity(true);
    try {
      const securityData = await getDocumentSecurity(document.id);
      setSecurity(securityData);
    } catch (error) {
      console.error('Failed to load security settings:', error);
    } finally {
      setLoadingSecurity(false);
    }
  };

  const handleUpdateSecurity = async (settings: any) => {
    await setDocumentSecurity(document.id, settings);
    await loadSecurity();
  };

  const loadAccessLogs = async () => {
    setLoadingAccessLogs(true);
    try {
      const logs = await getDocumentAccessLogs(document.id);
      setAccessLogs(logs);
    } catch (error) {
      console.error('Failed to load access logs:', error);
    } finally {
      setLoadingAccessLogs(false);
    }
  };

  const handleUploadNewVersion = async () => {
    const input = window.document.createElement('input');
    input.type = 'file';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const changeNotes = prompt('Enter change notes for this version (optional):');
      
      setUploadingVersion(true);
      try {
        const updated = await uploadNewVersion(document.id, file, changeNotes || undefined);
        onUpdate?.(updated);
        await loadVersionHistory();
        alert('New version uploaded successfully!');
      } catch (error) {
        console.error('Failed to upload new version:', error);
        alert('Failed to upload new version. Please try again.');
      } finally {
        setUploadingVersion(false);
      }
    };
    input.click();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />

        <div className="absolute inset-y-0 right-0 max-w-full flex">
          <div className="w-screen max-w-6xl">
            <div className="h-full flex flex-col bg-white shadow-xl">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 truncate max-w-2xl">{document.originalName}</h2>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleDownload}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={() => setShowShare(true)}
                      disabled={loading}
                      className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 disabled:opacity-50 flex items-center space-x-2"
                    >
                      <Share2 className="h-4 w-4" />
                      <span>Share</span>
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={loading}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete</span>
                    </button>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <DocumentDuplicateAlert documentId={document.id} />

                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-b border-gray-200">
                  {(
                    [
                      ['preview', 'Preview'],
                      ['details', 'Details'],
                      ['ai', 'AI'],
                      ['versions', 'Version History'],
                      ['security', 'Security'],
                      ['access-log', 'Access Log'],
                      ['ocr', 'OCR & Text'],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key as any)}
                      className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === key
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}

                  {isPdf && (
                    <button
                      onClick={() => setActiveTab('annotations')}
                      className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'annotations'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Annotations
                    </button>
                  )}

                  <button
                    onClick={() => setActiveTab('permissions')}
                    className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'permissions'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Permissions
                  </button>

                  <button
                    onClick={() => setActiveTab('comments')}
                    className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'comments'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Comments
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto">
                {activeTab === 'preview' && (
                  <DocumentViewer document={document} onDownload={handleDownload} />
                )}

                {activeTab === 'details' && (
                  <div className="p-6 space-y-6">
                    {document.mimeType !== 'application/pdf' && (
                      <ConvertToPdfPanel
                        documentId={document.id}
                        mimeType={document.mimeType}
                        onConverted={refreshDocument}
                      />
                    )}

                    {document.mimeType === 'application/pdf' && (
                      <FillableFormsPanel
                        documentId={document.id}
                        onFinalized={refreshDocument}
                      />
                    )}

                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">Document Details</h3>
                      {!isEditing ? (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center space-x-2"
                        >
                          <Edit className="h-4 w-4" />
                          <span>Edit</span>
                        </button>
                      ) : (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setIsEditing(false);
                              setDescription(document.description || '');
                              setTags(document.tags || []);
                              setCategory(document.category);
                            }}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSave}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                          >
                            <Save className="h-4 w-4" />
                            <span>Save</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">File Name</label>
                        <p className="text-sm text-gray-900">{document.originalName}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">File Size</label>
                        <p className="text-sm text-gray-900">{formatFileSize(document.fileSize)}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">File Type</label>
                        <p className="text-sm text-gray-900">{document.mimeType}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        {isEditing ? (
                          <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {Object.values(DocumentCategory).map((cat) => (
                              <option key={cat} value={cat}>
                                {cat.replace(/_/g, ' ')}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-sm text-gray-900">{document.category.replace(/_/g, ' ')}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Uploaded By</label>
                        <p className="text-sm text-gray-900">
                          {document.uploadedBy.firstName} {document.uploadedBy.lastName}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Upload Date</label>
                        <p className="text-sm text-gray-900">{format(new Date(document.createdAt), 'PPpp')}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Module</label>
                        <p className="text-sm text-gray-900 capitalize">{document.module}</p>
                      </div>

                      {document.referenceId && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Reference ID</label>
                          <p className="text-sm text-gray-900 font-mono">{document.referenceId}</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      {isEditing ? (
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Add a description..."
                        />
                      ) : (
                        <p className="text-sm text-gray-900">{document.description || 'No description'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                      {isEditing ? (
                        <div>
                          <div className="flex space-x-2 mb-2">
                            <input
                              type="text"
                              value={tagInput}
                              onChange={(e) => setTagInput(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                              placeholder="Add tag..."
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button onClick={addTag} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
                              Add
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                              >
                                <Tag className="h-3 w-3 mr-1" />
                                {tag}
                                <button
                                  onClick={() => removeTag(tag)}
                                  className="ml-2 text-blue-600 hover:text-blue-800"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {document.tags && document.tags.length > 0 ? (
                            document.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                              >
                                <Tag className="h-3 w-3 mr-1" />
                                {tag}
                              </span>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500">No tags</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'ai' && (
                  <div>
                    <DocumentAiInsightsPanel documentId={document.id} />
                    <div className="border-t border-gray-200" />
                    <DocumentQaPanel documentId={document.id} />
                  </div>
                )}

                {activeTab === 'versions' && (
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-medium text-gray-900">Version History</h3>
                      <button
                        onClick={handleUploadNewVersion}
                        disabled={uploadingVersion}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        <Upload className="h-4 w-4" />
                        <span>{uploadingVersion ? 'Uploading...' : 'Upload New Version'}</span>
                      </button>
                    </div>

                    {loadingVersions ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
                      </div>
                    ) : (
                      <VersionHistory
                        documentId={document.id}
                        versions={versions}
                        currentVersion={document.version}
                        onRestore={handleRestoreVersion}
                        onDownloadVersion={handleDownloadVersion}
                        onCompare={(fromVersion, toVersion) =>
                          compareVersions(document.id, fromVersion, toVersion)
                        }
                      />
                    )}
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="p-6">
                    {loadingSecurity ? (
                      <div className="flex items-center justify-center h-64">
                        <div className="text-gray-500">Loading security settings...</div>
                      </div>
                    ) : (
                      <SecurityPanel
                        documentId={document.id}
                        currentSecurity={security}
                        onUpdate={handleUpdateSecurity}
                        canEdit={true}
                      />
                    )}
                  </div>
                )}

                {activeTab === 'access-log' && (
                  <div className="p-6">
                    {loadingAccessLogs ? (
                      <div className="flex items-center justify-center h-64">
                        <div className="text-gray-500">Loading access logs...</div>
                      </div>
                    ) : (
                      <AccessLog
                        documentId={document.id}
                        logs={accessLogs}
                        onRefresh={loadAccessLogs}
                        showFilters={true}
                      />
                    )}
                  </div>
                )}

                {activeTab === 'ocr' && (
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">OCR & Text</h3>
                      <OCRButton
                        documentId={document.id}
                        onComplete={(result) => setOCRResult(result)}
                        onError={(msg) => alert(msg)}
                      />
                    </div>

                    {(ocrResult?.text || document.metadata?.extractedText) ? (
                      <ExtractedTextViewer
                        documentId={document.id}
                        extractedText={ocrResult?.text || document.metadata?.extractedText}
                      />
                    ) : (
                      <p className="text-sm text-gray-600">Run OCR to extract and view searchable text for this document.</p>
                    )}
                  </div>
                )}

                {activeTab === 'comments' && <CommentsPanel documentId={document.id} />}

                {activeTab === 'annotations' && isPdf && <CollaborativeViewer document={document} />}

                {activeTab === 'permissions' && <PermissionEditor documentId={document.id} />}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showShare && (
        <ShareModal
          documentId={document.id}
          documentName={document.originalName}
          onClose={() => setShowShare(false)}
        />
      )}
    </>
  );
}

