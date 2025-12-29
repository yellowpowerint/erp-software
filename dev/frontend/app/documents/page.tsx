'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Grid, 
  List, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Tag,
  Upload,
  X,
} from 'lucide-react';
import { Document, DocumentCategory, DocumentSearchFilters } from '@/types/document';
import { useDocuments } from '@/hooks/useDocuments';
import DocumentCard from '@/components/documents/DocumentCard';
import DocumentDetailModal from '@/components/documents/DocumentDetailModal';
import DocumentUpload from '@/components/documents/DocumentUpload';
import ShareModal from '@/components/documents/ShareModal';

type ViewMode = 'grid' | 'list';
type SortField = 'name' | 'date' | 'size' | 'category';
type SortOrder = 'asc' | 'desc';

function DocumentsContent() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [sharingDocument, setSharingDocument] = useState<Document | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [showUpload, setShowUpload] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>(DocumentCategory.OTHER);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | ''>('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { 
    getDocuments, 
    searchDocuments, 
    getDocument,
    deleteDocument, 
    downloadDocument,
    batchDelete,
    batchDownload,
    batchAddTags,
    loading, 
    error 
  } = useDocuments();

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    // Read query params client-side (avoids Next.js prerender Suspense requirement)
    const params = new URLSearchParams(window.location.search);

    const category = params.get('category');
    if (category && (Object.values(DocumentCategory) as string[]).includes(category)) {
      setCategoryFilter(category as DocumentCategory);
      setShowFilters(true);
    }

    const id = params.get('id');
    if (id) {
      (async () => {
        try {
          const doc = await getDocument(id);
          setSelectedDocument(doc);
        } catch (err) {
          console.error('Failed to load shared document:', err);
        }
      })();
    }
  }, [getDocument]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [documents, searchQuery, categoryFilter, moduleFilter, fileTypeFilter, startDate, endDate, sortField, sortOrder]);

  const loadDocuments = async () => {
    try {
      const docs = await getDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...documents];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.originalName.toLowerCase().includes(query) ||
          doc.description?.toLowerCase().includes(query) ||
          doc.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter((doc) => doc.category === categoryFilter);
    }

    // Apply module filter
    if (moduleFilter) {
      filtered = filtered.filter((doc) => doc.module === moduleFilter);
    }

    // Apply file type filter
    if (fileTypeFilter) {
      filtered = filtered.filter((doc) => {
        if (fileTypeFilter === 'pdf') return doc.mimeType === 'application/pdf';
        if (fileTypeFilter === 'image') return doc.mimeType.startsWith('image/');
        if (fileTypeFilter === 'text') return doc.mimeType.startsWith('text/');
        if (fileTypeFilter === 'office') return doc.mimeType.includes('word') || doc.mimeType.includes('excel') || doc.mimeType.includes('powerpoint') || doc.mimeType.includes('spreadsheet') || doc.mimeType.includes('document');
        if (fileTypeFilter === 'archive') return doc.mimeType.includes('zip') || doc.mimeType.includes('rar') || doc.mimeType.includes('tar');
        return true;
      });
    }

    // Apply date range filter
    if (startDate) {
      filtered = filtered.filter((doc) => new Date(doc.createdAt) >= new Date(startDate));
    }
    if (endDate) {
      filtered = filtered.filter((doc) => new Date(doc.createdAt) <= new Date(endDate));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'name':
          comparison = a.originalName.localeCompare(b.originalName);
          break;
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'size':
          comparison = a.fileSize - b.fileSize;
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredDocuments(filtered);
  };

  const handleSelectDocument = (document: Document, selected: boolean) => {
    const newSelected = new Set(selectedDocuments);
    if (selected) {
      newSelected.add(document.id);
    } else {
      newSelected.delete(document.id);
    }
    setSelectedDocuments(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedDocuments.size === filteredDocuments.length) {
      setSelectedDocuments(new Set());
    } else {
      setSelectedDocuments(new Set(filteredDocuments.map((doc) => doc.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDocuments.size === 0) return;
    if (!confirm(`Delete ${selectedDocuments.size} documents?`)) return;

    try {
      const result = await batchDelete(Array.from(selectedDocuments));
      if (result.deleted.length > 0) {
        alert(`Successfully deleted ${result.deleted.length} documents`);
      }
      if (result.failed.length > 0) {
        alert(`Failed to delete ${result.failed.length} documents`);
      }
      setSelectedDocuments(new Set());
      loadDocuments();
    } catch (error) {
      console.error('Bulk delete error:', error);
      alert('Failed to delete documents');
    }
  };

  const handleBulkDownload = async () => {
    if (selectedDocuments.size === 0) return;

    try {
      const blob = await batchDownload(Array.from(selectedDocuments));
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `documents-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Bulk download error:', error);
      alert('Failed to download documents');
    }
  };

  const handleBulkTag = async () => {
    if (selectedDocuments.size === 0) return;

    const tags = prompt('Enter tags (comma-separated):');
    if (!tags) return;

    try {
      const tagArray = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
      const result = await batchAddTags(Array.from(selectedDocuments), tagArray);
      if (result.updated.length > 0) {
        alert(`Successfully tagged ${result.updated.length} documents`);
      }
      if (result.failed.length > 0) {
        alert(`Failed to tag ${result.failed.length} documents`);
      }
      loadDocuments();
    } catch (error) {
      console.error('Bulk tag error:', error);
      alert('Failed to tag documents');
    }
  };

  const clearFilters = () => {
    setCategoryFilter('');
    setModuleFilter('');
    setFileTypeFilter('');
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
  };

  const uniqueModules = Array.from(new Set(documents.map((doc) => doc.module)));

  return (
    <>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Documents & Files</h1>
          <p className="mt-2 text-gray-600">Manage and organize all your documents</p>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 space-y-4">
            {/* Top row: Search, Upload, View toggle */}
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                  showFilters ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Filter className="h-5 w-5" />
                <span>Filters</span>
              </button>

              <button
                onClick={() => setShowUpload(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Upload className="h-5 w-5" />
                <span>Upload</span>
              </button>

              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${
                    viewMode === 'grid' ? 'bg-white shadow' : 'hover:bg-gray-200'
                  }`}
                >
                  <Grid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${
                    viewMode === 'list' ? 'bg-white shadow' : 'hover:bg-gray-200'
                  }`}
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Filters panel */}
            {showFilters && (
              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value as DocumentCategory | '')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Categories</option>
                      {Object.values(DocumentCategory).map((cat) => (
                        <option key={cat} value={cat}>
                          {cat.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Module
                    </label>
                    <select
                      value={moduleFilter}
                      onChange={(e) => setModuleFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Modules</option>
                      {uniqueModules.map((module) => (
                        <option key={module} value={module}>
                          {module}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      File Type
                    </label>
                    <select
                      value={fileTypeFilter}
                      onChange={(e) => setFileTypeFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Types</option>
                      <option value="pdf">PDF</option>
                      <option value="image">Images</option>
                      <option value="text">Text Files</option>
                      <option value="office">Office Documents</option>
                      <option value="archive">Archives</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <button
                    onClick={clearFilters}
                    className="text-sm text-gray-600 hover:text-gray-900 flex items-center space-x-1"
                  >
                    <X className="h-4 w-4" />
                    <span>Clear filters</span>
                  </button>

                  <div className="flex items-center space-x-4">
                    <label className="text-sm font-medium text-gray-700">Sort by:</label>
                    <select
                      value={sortField}
                      onChange={(e) => setSortField(e.target.value as SortField)}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="date">Date</option>
                      <option value="name">Name</option>
                      <option value="size">Size</option>
                      <option value="category">Category</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                    >
                      {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Bulk actions */}
            {selectedDocuments.size > 0 && (
              <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700">
                    {selectedDocuments.size} selected
                  </span>
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {selectedDocuments.size === filteredDocuments.length ? 'Deselect all' : 'Select all'}
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleBulkTag}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center space-x-2"
                  >
                    <Tag className="h-4 w-4" />
                    <span>Add Tags</span>
                  </button>
                  <button
                    onClick={handleBulkDownload}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center space-x-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Documents grid/list */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading documents...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || categoryFilter || moduleFilter || fileTypeFilter
                ? 'Try adjusting your filters'
                : 'Get started by uploading your first document'}
            </p>
            {!searchQuery && !categoryFilter && !moduleFilter && !fileTypeFilter && (
              <button
                onClick={() => setShowUpload(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Upload Document
              </button>
            )}
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
            }
          >
            {filteredDocuments.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onView={setSelectedDocument}
                onDownload={async (doc) => {
                  try {
                    const { url, filename } = await downloadDocument(doc.id);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  } catch (error) {
                    console.error('Download error:', error);
                    alert('Failed to download document');
                  }
                }}
                onDelete={async (doc) => {
                  if (confirm('Delete this document?')) {
                    try {
                      await deleteDocument(doc.id);
                      loadDocuments();
                    } catch (error) {
                      console.error('Delete error:', error);
                      alert('Failed to delete document');
                    }
                  }
                }}
                onEdit={setSelectedDocument}
                onShare={(doc) => setSharingDocument(doc)}
                selected={selectedDocuments.has(doc.id)}
                onSelect={handleSelectDocument}
                showCheckbox={true}
              />
            ))}
          </div>
        )}
      </div>

      {/* Document detail modal */}
      {selectedDocument && (
        <DocumentDetailModal
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
          onUpdate={(updated) => {
            setDocuments(documents.map((doc) => (doc.id === updated.id ? updated : doc)));
            setSelectedDocument(updated);
          }}
          onDelete={() => {
            setDocuments(documents.filter((doc) => doc.id !== selectedDocument.id));
            setSelectedDocument(null);
          }}
        />
      )}

      {sharingDocument && (
        <ShareModal
          documentId={sharingDocument.id}
          documentName={sharingDocument.originalName}
          onClose={() => setSharingDocument(null)}
          onShared={() => {
            // keep simple: modal already copies public link when created
          }}
        />
      )}

      {/* Upload modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowUpload(false)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Upload Documents</h2>
                <button
                  onClick={() => setShowUpload(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value as DocumentCategory)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.values(DocumentCategory).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <DocumentUpload
                  module="general"
                  category={uploadCategory}
                  showCategoryPicker
                  onUploadComplete={(docs) => {
                    setShowUpload(false);
                    loadDocuments();
                  }}
                  onUploadError={(error) => {
                    console.error('Upload error:', error);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function DocumentsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <DocumentsContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
