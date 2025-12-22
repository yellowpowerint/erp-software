'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { ArrowLeft, Save } from 'lucide-react';

function NewFleetAssetContent() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    assetCode: '',
    name: '',
    type: 'HEAVY_MACHINERY',
    category: 'Excavator',

    registrationNo: '',
    serialNumber: '',
    engineNumber: '',
    chassisNumber: '',

    make: '',
    model: '',
    year: new Date().getFullYear().toString(),
    capacity: '',
    fuelType: 'DIESEL',
    tankCapacity: '',

    purchaseDate: '',
    purchasePrice: '',
    vendor: '',
    warrantyExpiry: '',

    currentLocation: '',
    operatorId: '',
    currentOperator: '',

    currentOdometer: '',
    currentHours: '',

    depreciationMethod: 'STRAIGHT_LINE',
    usefulLifeYears: '10',
    salvageValue: '0',

    insuranceProvider: '',
    insurancePolicyNo: '',
    insuranceExpiry: '',
    insurancePremium: '',

    miningPermit: '',
    permitExpiry: '',
    safetyInspection: '',
    nextInspectionDue: '',
    emissionsCert: '',
    emissionsExpiry: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.type || !formData.category || !formData.make || !formData.model || !formData.year || !formData.currentLocation) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        assetCode: formData.assetCode.trim() ? formData.assetCode.trim() : undefined,
        name: formData.name,
        type: formData.type,
        category: formData.category,

        registrationNo: formData.registrationNo || undefined,
        serialNumber: formData.serialNumber || undefined,
        engineNumber: formData.engineNumber || undefined,
        chassisNumber: formData.chassisNumber || undefined,

        make: formData.make,
        model: formData.model,
        year: parseInt(formData.year, 10),
        capacity: formData.capacity || undefined,
        fuelType: formData.fuelType,
        tankCapacity: formData.tankCapacity || undefined,

        purchaseDate: formData.purchaseDate ? new Date(formData.purchaseDate).toISOString() : undefined,
        purchasePrice: formData.purchasePrice || undefined,
        vendor: formData.vendor || undefined,
        warrantyExpiry: formData.warrantyExpiry ? new Date(formData.warrantyExpiry).toISOString() : undefined,

        currentLocation: formData.currentLocation,
        operatorId: formData.operatorId || undefined,
        currentOperator: formData.currentOperator || undefined,

        currentOdometer: formData.currentOdometer || undefined,
        currentHours: formData.currentHours || undefined,

        depreciationMethod: formData.depreciationMethod || undefined,
        usefulLifeYears: formData.usefulLifeYears ? parseInt(formData.usefulLifeYears, 10) : undefined,
        salvageValue: formData.salvageValue || undefined,

        insuranceProvider: formData.insuranceProvider || undefined,
        insurancePolicyNo: formData.insurancePolicyNo || undefined,
        insuranceExpiry: formData.insuranceExpiry ? new Date(formData.insuranceExpiry).toISOString() : undefined,
        insurancePremium: formData.insurancePremium || undefined,

        miningPermit: formData.miningPermit || undefined,
        permitExpiry: formData.permitExpiry ? new Date(formData.permitExpiry).toISOString() : undefined,
        safetyInspection: formData.safetyInspection ? new Date(formData.safetyInspection).toISOString() : undefined,
        nextInspectionDue: formData.nextInspectionDue ? new Date(formData.nextInspectionDue).toISOString() : undefined,
        emissionsCert: formData.emissionsCert || undefined,
        emissionsExpiry: formData.emissionsExpiry ? new Date(formData.emissionsExpiry).toISOString() : undefined,
      };

      const res = await api.post('/fleet/assets', payload);
      router.push(`/fleet/assets/${res.data.id}`);
    } catch (err: any) {
      console.error('Failed to create fleet asset:', err);
      alert(err.response?.data?.message || 'Failed to create fleet asset');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <Link href="/fleet/assets" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Fleet Assets</span>
        </Link>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Register Fleet Asset</h1>
            <p className="text-gray-600 mt-1">Add vehicles, heavy machinery, and mining equipment to the fleet registry</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Asset Code (optional)</label>
                  <input
                    value={formData.assetCode}
                    onChange={(e) => setFormData({ ...formData, assetCode: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Leave blank to auto-generate"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Asset Name *</label>
                  <input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., CAT 320D Excavator"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="VEHICLE">Vehicle</option>
                    <option value="HEAVY_MACHINERY">Heavy Machinery</option>
                    <option value="DRILLING_EQUIPMENT">Drilling Equipment</option>
                    <option value="PROCESSING_EQUIPMENT">Processing Equipment</option>
                    <option value="SUPPORT_EQUIPMENT">Support Equipment</option>
                    <option value="TRANSPORT">Transport</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <input
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Excavator, Dump Truck, Drill Rig, ..."
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Identification</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Registration No</label>
                  <input
                    value={formData.registrationNo}
                    onChange={(e) => setFormData({ ...formData, registrationNo: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Serial Number</label>
                  <input
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Engine Number</label>
                  <input
                    value={formData.engineNumber}
                    onChange={(e) => setFormData({ ...formData, engineNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Chassis Number</label>
                  <input
                    value={formData.chassisNumber}
                    onChange={(e) => setFormData({ ...formData, chassisNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Specifications</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Make *</label>
                  <input
                    required
                    value={formData.make}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Model *</label>
                  <input
                    required
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Year *</label>
                  <input
                    required
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
                  <input
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Load capacity, engine power, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fuel Type *</label>
                  <select
                    value={formData.fuelType}
                    onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="DIESEL">Diesel</option>
                    <option value="PETROL">Petrol</option>
                    <option value="ELECTRIC">Electric</option>
                    <option value="HYBRID">Hybrid</option>
                    <option value="LPG">LPG</option>
                    <option value="NONE">None</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tank Capacity (L)</label>
                  <input
                    value={formData.tankCapacity}
                    onChange={(e) => setFormData({ ...formData, tankCapacity: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., 350"
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Location & Readings</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Location *</label>
                  <input
                    required
                    value={formData.currentLocation}
                    onChange={(e) => setFormData({ ...formData, currentLocation: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Site/Warehouse"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Odometer (km)</label>
                  <input
                    value={formData.currentOdometer}
                    onChange={(e) => setFormData({ ...formData, currentOdometer: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Hours</label>
                  <input
                    value={formData.currentHours}
                    onChange={(e) => setFormData({ ...formData, currentHours: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Acquisition & Depreciation</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Date</label>
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Price (₵)</label>
                  <input
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="150000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Useful Life (years)</label>
                  <input
                    type="number"
                    value={formData.usefulLifeYears}
                    onChange={(e) => setFormData({ ...formData, usefulLifeYears: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Salvage Value (₵)</label>
                  <input
                    value={formData.salvageValue}
                    onChange={(e) => setFormData({ ...formData, salvageValue: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Compliance</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mining Permit</label>
                  <input
                    value={formData.miningPermit}
                    onChange={(e) => setFormData({ ...formData, miningPermit: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Permit Expiry</label>
                  <input
                    type="date"
                    value={formData.permitExpiry}
                    onChange={(e) => setFormData({ ...formData, permitExpiry: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Next Inspection Due</label>
                  <input
                    type="date"
                    value={formData.nextInspectionDue}
                    onChange={(e) => setFormData({ ...formData, nextInspectionDue: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Emissions Expiry</label>
                  <input
                    type="date"
                    value={formData.emissionsExpiry}
                    onChange={(e) => setFormData({ ...formData, emissionsExpiry: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
              >
                <Save className="w-5 h-5" />
                <span>{submitting ? 'Creating...' : 'Create Asset'}</span>
              </button>
              <Link
                href="/fleet/assets"
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function NewFleetAssetPage() {
  return (
    <ProtectedRoute>
      <NewFleetAssetContent />
    </ProtectedRoute>
  );
}
