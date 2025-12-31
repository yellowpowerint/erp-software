'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, Download, FileDown } from 'lucide-react';
import type { CsvModule, ExportJob } from '@/types/csv';
import { useCSV } from '@/hooks/useCSV';

function defaultColumnsForModule(module: CsvModule): string[] {
  if (module === 'inventory') {
    return [
      'itemCode',
      'name',
      'category',
      'unit',
      'unitPrice',
      'reorderLevel',
      'maxStockLevel',
      'warehouseId',
      'supplier',
      'barcode',
      'notes',
      'currentQuantity',
      'createdAt',
    ];
  }

  if (module === 'inventory_movements') {
    return [
      'itemCode',
      'itemName',
      'warehouseCode',
      'movementType',
      'quantity',
      'previousQty',
      'newQty',
      'unitPrice',
      'totalValue',
      'reference',
      'notes',
      'createdAt',
    ];
  }

  if (module === 'suppliers') {
    return ['supplierCode', 'name', 'contactPerson', 'email', 'phone', 'city', 'country', 'category', 'rating', 'isActive', 'createdAt'];
  }

  if (module === 'employees') {
    return ['employeeId', 'firstName', 'lastName', 'email', 'phone', 'department', 'position', 'employmentType', 'status', 'hireDate', 'salary', 'createdAt'];
  }

  if (module === 'projects') {
    return ['projectCode', 'name', 'status', 'priority', 'location', 'startDate', 'endDate', 'estimatedBudget', 'actualCost', 'progress', 'managerId', 'createdAt'];
  }

  if (module === 'project_tasks') {
    return ['title', 'description', 'status', 'assignedTo', 'dueDate', 'order', 'createdAt'];
  }

  if (module === 'hr_attendance') {
    return ['employeeId', 'employeeName', 'department', 'date', 'status', 'checkIn', 'checkOut', 'workHours', 'notes', 'createdAt'];
  }

  if (module === 'hr_leave_requests') {
    return ['employeeId', 'employeeName', 'department', 'leaveType', 'startDate', 'endDate', 'totalDays', 'reason', 'status', 'approvedAt', 'createdAt'];
  }

  if (module === 'hr_performance_reviews') {
    return ['employeeId', 'employeeName', 'department', 'reviewPeriod', 'reviewDate', 'reviewerId', 'reviewerName', 'overallRating', 'technicalSkills', 'communication', 'teamwork', 'productivity', 'leadership', 'strengths', 'areasForImprovement', 'goals', 'createdAt'];
  }

  return ['assetCode', 'name', 'category', 'manufacturer', 'model', 'serialNumber', 'purchaseDate', 'purchasePrice', 'currentValue', 'depreciationRate', 'location', 'status', 'condition', 'assignedTo', 'notes', 'createdAt'];
}

export default function ExportModal(props: {
  open: boolean;
  onClose: () => void;
  module: CsvModule;
  title: string;
  defaultFilters?: any;
  context?: any;
}) {
  const { open, onClose, module, title, defaultFilters, context } = props;

  const { loading, error, startExport, getExportJob, downloadExport, getSampleTemplateUrl } = useCSV();

  const [columnsText, setColumnsText] = useState('');
  const [filtersText, setFiltersText] = useState('');
  const [job, setJob] = useState<ExportJob | null>(null);

  const defaultCols = useMemo(() => defaultColumnsForModule(module), [module]);

  useEffect(() => {
    if (!open) {
      setColumnsText('');
      setFiltersText('');
      setJob(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setColumnsText(defaultCols.join(','));
    setFiltersText(JSON.stringify(defaultFilters || {}, null, 2));
  }, [open, defaultCols, defaultFilters]);

  useEffect(() => {
    if (!job?.id) return;

    const t = setInterval(async () => {
      try {
        const next = await getExportJob(job.id);
        setJob(next);
        if (['COMPLETED', 'FAILED'].includes(next.status)) {
          clearInterval(t);
        }
      } catch {
        // ignore
      }
    }, 2000);

    return () => clearInterval(t);
  }, [job?.id]);

  const start = async () => {
    const cols = columnsText
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    let filters: any = {};
    try {
      filters = filtersText ? JSON.parse(filtersText) : {};
    } catch {
      throw new Error('filters must be valid JSON');
    }

    const created = await startExport(module, cols, filters, undefined, context);
    setJob(created);
  };

  const download = async () => {
    if (!job) return;
    const { blob, fileName } = await downloadExport(job.id, job.fileName);
    const url = URL.createObjectURL(blob);

    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-600">Choose columns and filters, then generate an export.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <a
              href={getSampleTemplateUrl(module)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Sample CSV
            </a>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Columns (comma-separated)</label>
            <input
              value={columnsText}
              onChange={(e) => setColumnsText(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filters (JSON)</label>
            <textarea
              value={filtersText}
              onChange={(e) => setFiltersText(e.target.value)}
              rows={5}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
            />
          </div>

          {error ? <div className="text-sm text-red-600">{error}</div> : null}

          {job ? (
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">Export Job</div>
                <div className="text-xs text-gray-500">{job.id}</div>
              </div>
              <div className="mt-2 text-sm text-gray-700">
                Status: <span className="font-medium">{job.status}</span>
              </div>
              <div className="mt-1 text-sm text-gray-700">Rows: {job.totalRows}</div>

              {job.status === 'COMPLETED' ? (
                <button
                  onClick={download}
                  className="mt-3 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  Download CSV
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">
            Close
          </button>
          <button
            onClick={start}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            Generate Export
          </button>
        </div>
      </div>
    </div>
  );
}
