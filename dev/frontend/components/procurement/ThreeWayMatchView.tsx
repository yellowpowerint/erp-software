'use client';

export default function ThreeWayMatchView(props: {
  poNumber?: string | null;
  grnCount?: number | null;
  invoiceNumber?: string | null;
  notes?: string | null;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Three-Way Match</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4">
          <div className="text-xs text-gray-500">Purchase Order</div>
          <div className="text-sm font-semibold text-gray-900 mt-1">{props.poNumber || '-'}</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-xs text-gray-500">Goods Receipts (Accepted)</div>
          <div className="text-sm font-semibold text-gray-900 mt-1">{props.grnCount ?? 0}</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-xs text-gray-500">Invoice</div>
          <div className="text-sm font-semibold text-gray-900 mt-1">{props.invoiceNumber || '-'}</div>
        </div>
      </div>
      {props.notes ? <div className="mt-4 text-sm text-gray-700">{props.notes}</div> : null}
    </div>
  );
}
