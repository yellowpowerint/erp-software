'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface SiteModalProps {
  open: boolean;
  onClose: () => void;
  site?: {
    id: string;
    siteCode: string;
    name: string;
    type: string;
    status: string;
    location: string;
    address?: string;
    coordinates?: string;
    area?: number;
    areaUnit: string;
    description?: string;
    managerId?: string;
    managerName?: string;
    contactPhone?: string;
    contactEmail?: string;
    operatingHours?: string;
    establishedDate?: string;
    closedDate?: string;
    notes?: string;
  } | null;
  onSave: (data: any) => Promise<void>;
}

export default function SiteModal({ open, onClose, site, onSave }: SiteModalProps) {
  const [formData, setFormData] = useState({
    siteCode: '',
    name: '',
    type: 'MINING',
    status: 'ACTIVE',
    location: '',
    address: '',
    coordinates: '',
    area: '',
    areaUnit: 'hectares',
    description: '',
    managerId: '',
    managerName: '',
    contactPhone: '',
    contactEmail: '',
    operatingHours: '',
    establishedDate: '',
    closedDate: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (site) {
      setFormData({
        siteCode: site.siteCode,
        name: site.name,
        type: site.type,
        status: site.status,
        location: site.location,
        address: site.address || '',
        coordinates: site.coordinates || '',
        area: site.area?.toString() || '',
        areaUnit: site.areaUnit || 'hectares',
        description: site.description || '',
        managerId: site.managerId || '',
        managerName: site.managerName || '',
        contactPhone: site.contactPhone || '',
        contactEmail: site.contactEmail || '',
        operatingHours: site.operatingHours || '',
        establishedDate: site.establishedDate ? site.establishedDate.split('T')[0] : '',
        closedDate: site.closedDate ? site.closedDate.split('T')[0] : '',
        notes: site.notes || '',
      });
    } else {
      setFormData({
        siteCode: '',
        name: '',
        type: 'MINING',
        status: 'ACTIVE',
        location: '',
        address: '',
        coordinates: '',
        area: '',
        areaUnit: 'hectares',
        description: '',
        managerId: '',
        managerName: '',
        contactPhone: '',
        contactEmail: '',
        operatingHours: '',
        establishedDate: '',
        closedDate: '',
        notes: '',
      });
    }
    setError('');
  }, [site, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload: any = {
        ...formData,
        area: formData.area ? parseFloat(formData.area) : undefined,
      };

      if (!payload.establishedDate) delete payload.establishedDate;
      if (!payload.closedDate) delete payload.closedDate;

      await onSave(payload);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save site');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {site ? 'Edit Site' : 'Create New Site'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.siteCode}
                onChange={(e) => setFormData({ ...formData, siteCode: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., SITE-001"
                required
                disabled={!!site}
              />
              {site && (
                <p className="text-xs text-gray-500 mt-1">Site code cannot be changed</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., Tarkwa Mining Site"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              >
                <option value="MINING">Mining</option>
                <option value="CONSTRUCTION">Construction</option>
                <option value="CLEANING">Cleaning</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="EXPLORATION">Exploration</option>
                <option value="PROCESSING">Processing</option>
                <option value="STORAGE">Storage</option>
                <option value="OFFICE">Office</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="UNDER_DEVELOPMENT">Under Development</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="CLOSED">Closed</option>
                <option value="PLANNED">Planned</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., Tarkwa, Western Region"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Full address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Coordinates (GPS)
              </label>
              <input
                type="text"
                value={formData.coordinates}
                onChange={(e) => setFormData({ ...formData, coordinates: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., 5.3037° N, 1.9756° W"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Area
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  step="0.01"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="0.00"
                />
                <select
                  value={formData.areaUnit}
                  onChange={(e) => setFormData({ ...formData, areaUnit: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="hectares">Hectares</option>
                  <option value="acres">Acres</option>
                  <option value="sq_km">Sq. Km</option>
                  <option value="sq_m">Sq. Meters</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site Manager Name
              </label>
              <input
                type="text"
                value={formData.managerName}
                onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Manager's full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Phone
              </label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="+233 XX XXX XXXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Email
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="site@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Operating Hours
              </label>
              <input
                type="text"
                value={formData.operatingHours}
                onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., 24/7 or Mon-Fri 8AM-5PM"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Established Date
              </label>
              <input
                type="date"
                value={formData.establishedDate}
                onChange={(e) => setFormData({ ...formData, establishedDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {formData.status === 'CLOSED' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Closed Date
                </label>
                <input
                  type="date"
                  value={formData.closedDate}
                  onChange={(e) => setFormData({ ...formData, closedDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Brief description of the site"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Additional notes"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
              disabled={loading}
            >
              {loading ? 'Saving...' : site ? 'Update Site' : 'Create Site'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
