'use client';

import { useMemo, useState } from 'react';

export interface ReceivingPoItem {
  id: string;
  itemName: string;
  unit: string;
  quantity: string;
  receivedQty?: string;
}

export interface CreateGoodsReceiptPayload {
  purchaseOrderId: string;
  warehouseId?: string;
  siteLocation: string;
  deliveryNote?: string;
  carrierName?: string;
  vehicleNumber?: string;
  driverName?: string;
  notes?: string;
  items: Array<{
    poItemId: string;
    receivedQty: string;
    condition?: string;
    notes?: string;
  }>;
}

export default function ReceivingForm(props: {
  purchaseOrderId: string;
  items: ReceivingPoItem[];
  onSubmit: (payload: CreateGoodsReceiptPayload) => Promise<void>;
  submitting?: boolean;
}) {
  const [siteLocation, setSiteLocation] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [carrierName, setCarrierName] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [notes, setNotes] = useState('');

  const [lines, setLines] = useState(
    props.items.map((i) => ({
      poItemId: i.id,
      itemName: i.itemName,
      unit: i.unit,
      orderedQty: String(i.quantity ?? '0'),
      alreadyReceivedQty: String(i.receivedQty ?? '0'),
      receivedQty: '',
      condition: 'GOOD',
      notes: '',
    }))
  );

  const remainingByLine = useMemo(() => {
    return lines.map((l) => {
      const ordered = Number(l.orderedQty || 0);
      const received = Number(l.alreadyReceivedQty || 0);
      const remaining = Math.max(0, ordered - received);
      return remaining;
    });
  }, [lines]);

  const canSubmit = useMemo(() => {
    const anyQty = lines.some((l) => Number(l.receivedQty || 0) > 0);
    return anyQty && siteLocation.trim().length >= 2;
  }, [lines, siteLocation]);

  const setLine = (idx: number, patch: Partial<(typeof lines)[number]>) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const autofillRemaining = () => {
    setLines((prev) =>
      prev.map((l, idx) => {
        const remaining = remainingByLine[idx];
        return {
          ...l,
          receivedQty: String(remaining || ''),
        };
      })
    );
  };

  const submit = async () => {
    if (!canSubmit) return;

    const items = lines
      .filter((l) => Number(l.receivedQty || 0) > 0)
      .map((l) => ({
        poItemId: l.poItemId,
        receivedQty: String(l.receivedQty),
        condition: l.condition || undefined,
        notes: l.notes || undefined,
      }));

    await props.onSubmit({
      purchaseOrderId: props.purchaseOrderId,
      siteLocation: siteLocation.trim(),
      deliveryNote: deliveryNote || undefined,
      carrierName: carrierName || undefined,
      vehicleNumber: vehicleNumber || undefined,
      driverName: driverName || undefined,
      notes: notes || undefined,
      items,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Receive Goods (Create GRN)</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Site Location</label>
          <input
            value={siteLocation}
            onChange={(e) => setSiteLocation(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="e.g. Main Warehouse / Site A"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Note</label>
          <input
            value={deliveryNote}
            onChange={(e) => setDeliveryNote(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Optional"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Carrier Name</label>
          <input
            value={carrierName}
            onChange={(e) => setCarrierName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Optional"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
          <input
            value={vehicleNumber}
            onChange={(e) => setVehicleNumber(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Optional"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name</label>
          <input
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Optional"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="flex justify-end mb-3">
        <button
          type="button"
          onClick={autofillRemaining}
          className="px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
        >
          Autofill Remaining
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Ordered</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Previously Received</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Remaining</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Receive Now</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Condition</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {lines.map((l, idx) => (
              <tr key={l.poItemId}>
                <td className="px-4 py-3 text-sm text-gray-900">{l.itemName}</td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right">{Number(l.orderedQty || 0).toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right">
                  {Number(l.alreadyReceivedQty || 0).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right">{remainingByLine[idx].toFixed(2)}</td>
                <td className="px-4 py-3">
                  <input
                    value={l.receivedQty}
                    onChange={(e) => setLine(idx, { receivedQty: e.target.value })}
                    className="w-28 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-right"
                    placeholder="0"
                  />
                </td>
                <td className="px-4 py-3">
                  <select
                    value={l.condition}
                    onChange={(e) => setLine(idx, { condition: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="GOOD">GOOD</option>
                    <option value="DAMAGED">DAMAGED</option>
                    <option value="DEFECTIVE">DEFECTIVE</option>
                    <option value="WRONG_ITEM">WRONG_ITEM</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          disabled={!canSubmit || !!props.submitting}
          onClick={submit}
          className={`px-4 py-2 rounded-lg text-white ${
            !canSubmit || props.submitting ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {props.submitting ? 'Submitting...' : 'Create GRN'}
        </button>
      </div>
    </div>
  );
}
