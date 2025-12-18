'use client';

import { useState } from 'react';
import { Download, Eye, Trash2, MoreVertical, Tag, Edit, Share2 } from 'lucide-react';
import { Document } from '@/types/document';
import { formatFileSize, getFileIcon } from '@/lib/utils/file';
import { format } from 'date-fns';

interface DocumentCardProps {
  document: Document;
  onView?: (document: Document) => void;
  onDownload?: (document: Document) => void;
  onDelete?: (document: Document) => void;
  onEdit?: (document: Document) => void;
  onShare?: (document: Document) => void;
  selected?: boolean;
  onSelect?: (document: Document, selected: boolean) => void;
  showCheckbox?: boolean;
}

export default function DocumentCard({
  document,
  onView,
  onDownload,
  onDelete,
  onEdit,
  onShare,
  selected = false,
  onSelect,
  showCheckbox = false,
}: DocumentCardProps) {
  const [showActions, setShowActions] = useState(false);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSelect?.(document, e.target.checked);
  };

  return (
    <div
      className={`relative group bg-white border rounded-lg p-4 hover:shadow-md transition-shadow ${
        selected ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200'
      }`}
    >
      {/* Checkbox for bulk selection */}
      {showCheckbox && (
        <div className="absolute top-3 left-3 z-10">
          <input
            type="checkbox"
            checked={selected}
            onChange={handleCheckboxChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>
      )}

      {/* Actions menu */}
      <div className="absolute top-3 right-3">
        <button
          onClick={() => setShowActions(!showActions)}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <MoreVertical className="h-5 w-5 text-gray-500" />
        </button>

        {showActions && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-20">
            {onView && (
              <button
                onClick={() => {
                  onView(document);
                  setShowActions(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <Eye className="h-4 w-4" />
                <span>View Details</span>
              </button>
            )}
            {onDownload && (
              <button
                onClick={() => {
                  onDownload(document);
                  setShowActions(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => {
                  onEdit(document);
                  setShowActions(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <Edit className="h-4 w-4" />
                <span>Edit Metadata</span>
              </button>
            )}
            {onShare && (
              <button
                onClick={() => {
                  onShare(document);
                  setShowActions(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => {
                  onDelete(document);
                  setShowActions(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* File icon and info */}
      <div className={`flex items-start space-x-3 ${showCheckbox ? 'ml-6' : ''}`}>
        <div className="text-4xl flex-shrink-0">
          {getFileIcon(document.mimeType)}
        </div>

        <div className="flex-1 min-w-0">
          <h3
            className="text-sm font-medium text-gray-900 truncate cursor-pointer hover:text-blue-600"
            onClick={() => onView?.(document)}
            title={document.originalName}
          >
            {document.originalName}
          </h3>

          <p className="text-xs text-gray-500 mt-1">
            {formatFileSize(document.fileSize)}
          </p>

          <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
            <span>{document.uploadedBy.firstName} {document.uploadedBy.lastName}</span>
            <span>•</span>
            <span>{format(new Date(document.createdAt), 'MMM d, yyyy')}</span>
          </div>

          {/* Category badge */}
          <div className="mt-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
              {document.category.replace(/_/g, ' ')}
            </span>
          </div>

          {/* Tags */}
          {document.tags && document.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {document.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </span>
              ))}
              {document.tags.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{document.tags.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Description preview */}
          {document.description && (
            <p className="text-xs text-gray-600 mt-2 line-clamp-2">
              {document.description}
            </p>
          )}
        </div>
      </div>

      {/* Quick actions on hover */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {onView && (
          <button
            onClick={() => onView(document)}
            className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors flex items-center justify-center space-x-1"
          >
            <Eye className="h-3 w-3" />
            <span>View</span>
          </button>
        )}
        {onDownload && (
          <button
            onClick={() => onDownload(document)}
            className="flex-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors flex items-center justify-center space-x-1"
          >
            <Download className="h-3 w-3" />
            <span>Download</span>
          </button>
        )}
      </div>
    </div>
  );
}
