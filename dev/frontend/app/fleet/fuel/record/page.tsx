'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { ArrowLeft } from 'lucide-react';

function Inner() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [assetId, setAssetId] = useState('');
  const [siteLocation, setSiteLocation] = useState('');
  const [transactionType, setTransactionType] = useState('FILL_UP');
  const [fuelType, setFuelType] = useState('DIESEL');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [odometerReading, setOdometerReading] = useState('');
  const [hoursReading, setHoursReading] = useState('');
  const [fuelStation, setFuelStation] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [notes, setNotes] = useState('');

  const transactionDate = useMemo(() => new Date().toISOString(), []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId || !siteLocation || !quantity || !unitPrice) {
      alert('assetId, siteLocation, quantity and unitPrice are required');
      return;
    }

    setSaving(true);
    try {
      await api.post('/fleet/fuel', {
        assetId,
        transactionDate,
        transactionType,
        fuelType,
        quantity: quantity.trim(),
        unitPrice: unitPrice.trim(),
        odometerReading: odometerReading.trim() || undefined,
        hoursReading: hoursReading.trim() || undefined,
        fuelStation: fuelStation.trim() || undefined,
        receiptNumber: receiptNumber.trim() || undefined,
        siteLocation: siteLocation.trim(),
        notes: notes.trim() || undefined,
      });
      router.push('/fleet/fuel');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to record fuel');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link href="/fleet/fuel" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Fuel</span>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Record Fuel Transaction</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Asset ID</label>
            <input value={assetId} onChange={(e) => setAssetId(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Site Location</label>
            <input value={siteLocation} onChange={(e) => setSiteLocation(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Mining site / location" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type</label>
            <select value={transactionType} onChange={(e) => setTransactionType(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white">
              <option value="FILL_UP">Fill-up</option>
              <option value="PARTIAL_FILL">Partial Fill</option>
              <option value="EXTERNAL">External Station</option>
              <option value="TANK_DISPENSE">Site Tank Dispense</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fuel Type</label>
            <select value={fuelType} onChange={(e) => setFuelType(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white">
              <option value="DIESEL">Diesel</option>
              <option value="PETROL">Petrol</option>
              <option value="ELECTRIC">Electric</option>
              <option value="HYBRID">Hybrid</option>
              <option value="LPG">LPG</option>
              <option value="NONE">None</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity (Liters)</label>
            <input value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g. 50" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Unit Price (per liter)</label>
            <input value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g. 15.50" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Odometer Reading</label>
            <input value={odometerReading} onChange={(e) => setOdometerReading(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Optional" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hours Reading</label>
            <input value={hoursReading} onChange={(e) => setHoursReading(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Optional" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fuel Station / Site Tank</label>
            <input value={fuelStation} onChange={(e) => setFuelStation(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Optional" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Receipt Number</label>
            <input value={receiptNumber} onChange={(e) => setReceiptNumber(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Optional" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" rows={3} placeholder="Optional" />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400">
              {saving ? 'Saving...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default function Page() {
  return (
    <ProtectedRoute>
      <Inner />
    </ProtectedRoute>
  );
}
