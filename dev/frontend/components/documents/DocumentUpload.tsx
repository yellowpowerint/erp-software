'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { DocumentCategory, CreateDocumentDto, UploadProgress } from '@/types/document';
import { useDocuments } from '@/hooks/useDocuments';
import { formatFileSize, getFileIcon, validateFile } from '@/lib/utils/file';

interface DocumentUploadProps {
  module: string;
  referenceId?: string;
  category: DocumentCategory;
  showCategoryPicker?: boolean;
  onUploadComplete?: (documents: any[]) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  allowedTypes?: string[];
}

export default function DocumentUpload({
  module,
  referenceId,
  category,
  showCategoryPicker = false,
  onUploadComplete,
  onUploadError,
  maxFiles = 10,
  maxSizeMB = 10,
  allowedTypes = [],
}: DocumentUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>(category);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const { uploadDocument, uploadMultipleDocuments, uploadProgress } = useDocuments();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const validFiles: File[] = [];
      const errors: string[] = [];

      acceptedFiles.forEach((file) => {
        const validation = validateFile(file, { maxSizeMB, allowedTypes });
        if (validation.valid) {
          validFiles.push(file);
        } else {
          errors.push(`${file.name}: ${validation.error}`);
        }
      });

      if (errors.length > 0) {
        onUploadError?.(errors.join('\n'));
      }

      if (validFiles.length + files.length > maxFiles) {
        onUploadError?.(`Maximum ${maxFiles} files allowed`);
        return;
      }

      setFiles((prev) => [...prev, ...validFiles]);
    },
    [files, maxFiles, maxSizeMB, allowedTypes, onUploadError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    maxSize: maxSizeMB * 1024 * 1024,
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags((prev) => [...prev, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);

    try {
      const metadata: CreateDocumentDto = {
        category: selectedCategory,
        module,
        referenceId,
        description: description.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
      };

      let uploadedDocuments;

      if (files.length === 1) {
        const doc = await uploadDocument(files[0], metadata);
        uploadedDocuments = [doc];
      } else {
        uploadedDocuments = await uploadMultipleDocuments(files, metadata);
      }

      onUploadComplete?.(uploadedDocuments);
      
      // Reset form
      setFiles([]);
      setDescription('');
      setSelectedCategory(category);
      setTags([]);
    } catch (error: any) {
      onUploadError?.(error.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const getProgressStatus = (fileName: string): UploadProgress | undefined => {
    return uploadProgress.find((p) => p.fileName === fileName);
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        {isDragActive ? (
          <p className="text-blue-600 font-medium">Drop files here...</p>
        ) : (
          <div>
            <p className="text-gray-600 font-medium mb-2">
              Drag & drop files here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              Maximum {maxFiles} files, up to {maxSizeMB}MB each
            </p>
          </div>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium text-gray-900">Selected Files ({files.length})</h3>
          <div className="space-y-2">
            {files.map((file, index) => {
              const progress = getProgressStatus(file.name);
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <span className="text-2xl">{getFileIcon(file.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      {progress && (
                        <div className="mt-1">
                          {progress.status === 'uploading' && (
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-blue-600 h-1.5 rounded-full transition-all"
                                style={{ width: `${progress.progress}%` }}
                              />
                            </div>
                          )}
                          {progress.status === 'success' && (
                            <div className="flex items-center text-green-600 text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Uploaded
                            </div>
                          )}
                          {progress.status === 'error' && (
                            <div className="flex items-center text-red-600 text-xs">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {progress.error || 'Failed'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {!uploading && (
                    <button
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Metadata */}
      {files.length > 0 && (
        <div className="space-y-4">
          {showCategoryPicker && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as DocumentCategory)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={uploading}
              >
                {Object.values(DocumentCategory).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for these documents..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              disabled={uploading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (Optional)
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add tags..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={uploading}
              />
              <button
                onClick={addTag}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                disabled={uploading}
              >
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {tag}
                    {!uploading && (
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
            uploading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {uploading ? 'Uploading...' : `Upload ${files.length} File${files.length > 1 ? 's' : ''}`}
        </button>
      )}
    </div>
  );
}
