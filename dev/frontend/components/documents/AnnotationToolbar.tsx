'use client';

import { Highlighter, MessageSquare, Square, Type } from 'lucide-react';
import { AnnotationType } from '@/types/document';

interface AnnotationToolbarProps {
  activeTool: AnnotationType;
  onChangeTool: (tool: AnnotationType) => void;
  color: string;
  onChangeColor: (color: string) => void;
  canEdit?: boolean;
}

const COLORS = ['#FDE047', '#60A5FA', '#34D399', '#F87171', '#A78BFA', '#111827'];

export default function AnnotationToolbar({
  activeTool,
  onChangeTool,
  color,
  onChangeColor,
  canEdit = true,
}: AnnotationToolbarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
      <div className="flex items-center space-x-2">
        <button
          type="button"
          disabled={!canEdit}
          onClick={() => onChangeTool('HIGHLIGHT')}
          className={`px-3 py-2 rounded border text-sm inline-flex items-center space-x-2 ${
            activeTool === 'HIGHLIGHT'
              ? 'border-blue-600 bg-blue-50 text-blue-700'
              : 'border-gray-200 hover:bg-gray-50'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title="Highlight"
        >
          <Highlighter className="h-4 w-4" />
          <span>Highlight</span>
        </button>

        <button
          type="button"
          disabled={!canEdit}
          onClick={() => onChangeTool('RECTANGLE')}
          className={`px-3 py-2 rounded border text-sm inline-flex items-center space-x-2 ${
            activeTool === 'RECTANGLE'
              ? 'border-blue-600 bg-blue-50 text-blue-700'
              : 'border-gray-200 hover:bg-gray-50'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title="Rectangle"
        >
          <Square className="h-4 w-4" />
          <span>Box</span>
        </button>

        <button
          type="button"
          disabled={!canEdit}
          onClick={() => onChangeTool('NOTE')}
          className={`px-3 py-2 rounded border text-sm inline-flex items-center space-x-2 ${
            activeTool === 'NOTE'
              ? 'border-blue-600 bg-blue-50 text-blue-700'
              : 'border-gray-200 hover:bg-gray-50'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title="Note"
        >
          <MessageSquare className="h-4 w-4" />
          <span>Note</span>
        </button>

        <button
          type="button"
          disabled={!canEdit}
          onClick={() => onChangeTool('TEXT')}
          className={`px-3 py-2 rounded border text-sm inline-flex items-center space-x-2 ${
            activeTool === 'TEXT'
              ? 'border-blue-600 bg-blue-50 text-blue-700'
              : 'border-gray-200 hover:bg-gray-50'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title="Text"
        >
          <Type className="h-4 w-4" />
          <span>Text</span>
        </button>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-500">Color</span>
        <div className="flex items-center space-x-1">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              disabled={!canEdit}
              onClick={() => onChangeColor(c)}
              className={`h-6 w-6 rounded border ${c === color ? 'border-gray-900' : 'border-gray-200'} disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
