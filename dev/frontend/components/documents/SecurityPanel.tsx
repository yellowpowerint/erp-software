'use client';

import { useState, useEffect } from 'react';
import { Shield, Lock, Calendar, Download, FileText, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

interface SecuritySettings {
  isPasswordProtected: boolean;
  hasWatermark: boolean;
  watermarkText?: string;
  isEncrypted: boolean;
  expiresAt?: string;
  maxDownloads?: number;
  downloadCount: number;
  requireSignature: boolean;
  allowPrint: boolean;
  allowCopy: boolean;
}

interface SecurityPanelProps {
  documentId: string;
  currentSecurity?: SecuritySettings | null;
  onUpdate: (settings: Partial<SecuritySettings>) => Promise<void>;
  canEdit?: boolean;
}

export default function SecurityPanel({
  documentId,
  currentSecurity,
  onUpdate,
  canEdit = true,
}: SecurityPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [settings, setSettings] = useState<Partial<SecuritySettings>>({
    isPasswordProtected: false,
    hasWatermark: false,
    watermarkText: '',
    isEncrypted: false,
    expiresAt: undefined,
    maxDownloads: undefined,
    requireSignature: false,
    allowPrint: true,
    allowCopy: true,
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (currentSecurity) {
      setSettings({
        isPasswordProtected: currentSecurity.isPasswordProtected,
        hasWatermark: currentSecurity.hasWatermark,
        watermarkText: currentSecurity.watermarkText || '',
        isEncrypted: currentSecurity.isEncrypted,
        expiresAt: currentSecurity.expiresAt,
        maxDownloads: currentSecurity.maxDownloads,
        requireSignature: currentSecurity.requireSignature,
        allowPrint: currentSecurity.allowPrint,
        allowCopy: currentSecurity.allowCopy,
      });
    }
  }, [currentSecurity]);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const updateData: any = { ...settings };
      
      if (settings.isPasswordProtected && password) {
        updateData.password = password;
      }

      await onUpdate(updateData);
      setSuccess(true);
      setIsEditing(false);
      setPassword('');
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update security settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (currentSecurity) {
      setSettings({
        isPasswordProtected: currentSecurity.isPasswordProtected,
        hasWatermark: currentSecurity.hasWatermark,
        watermarkText: currentSecurity.watermarkText || '',
        isEncrypted: currentSecurity.isEncrypted,
        expiresAt: currentSecurity.expiresAt,
        maxDownloads: currentSecurity.maxDownloads,
        requireSignature: currentSecurity.requireSignature,
        allowPrint: currentSecurity.allowPrint,
        allowCopy: currentSecurity.allowCopy,
      });
    }
    setPassword('');
    setIsEditing(false);
    setError(null);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Document Security</h3>
        </div>
        {canEdit && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Edit Settings
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-2">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700">Security settings updated successfully</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Password Protection */}
        <div className="border-b border-gray-200 pb-4">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="passwordProtected"
              checked={settings.isPasswordProtected}
              onChange={(e) => setSettings({ ...settings, isPasswordProtected: e.target.checked })}
              disabled={!isEditing}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <div className="flex-1">
              <label htmlFor="passwordProtected" className="flex items-center space-x-2 font-medium text-gray-900">
                <Lock className="h-4 w-4" />
                <span>Password Protection</span>
              </label>
              <p className="text-sm text-gray-600 mt-1">
                Require a password to view or download this document
              </p>
              {settings.isPasswordProtected && isEditing && (
                <div className="mt-3 relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Watermark */}
        <div className="border-b border-gray-200 pb-4">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="watermark"
              checked={settings.hasWatermark}
              onChange={(e) => setSettings({ ...settings, hasWatermark: e.target.checked })}
              disabled={!isEditing}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <div className="flex-1">
              <label htmlFor="watermark" className="flex items-center space-x-2 font-medium text-gray-900">
                <FileText className="h-4 w-4" />
                <span>Add Watermark</span>
              </label>
              <p className="text-sm text-gray-600 mt-1">
                Add a watermark to the document
              </p>
              {settings.hasWatermark && isEditing && (
                <input
                  type="text"
                  value={settings.watermarkText || ''}
                  onChange={(e) => setSettings({ ...settings, watermarkText: e.target.value })}
                  placeholder="Enter watermark text (e.g., CONFIDENTIAL)"
                  className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
            </div>
          </div>
        </div>

        {/* Encryption */}
        <div className="border-b border-gray-200 pb-4">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="encrypted"
              checked={settings.isEncrypted}
              onChange={(e) => setSettings({ ...settings, isEncrypted: e.target.checked })}
              disabled={!isEditing}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <div className="flex-1">
              <label htmlFor="encrypted" className="flex items-center space-x-2 font-medium text-gray-900">
                <Shield className="h-4 w-4" />
                <span>Encrypt Document</span>
              </label>
              <p className="text-sm text-gray-600 mt-1">
                Encrypt the document for additional security
              </p>
            </div>
          </div>
        </div>

        {/* Expiration Date */}
        <div className="border-b border-gray-200 pb-4">
          <label className="flex items-center space-x-2 font-medium text-gray-900 mb-2">
            <Calendar className="h-4 w-4" />
            <span>Expiration Date</span>
          </label>
          <p className="text-sm text-gray-600 mb-3">
            Set when access to this document should expire
          </p>
          <input
            type="datetime-local"
            value={settings.expiresAt ? new Date(settings.expiresAt).toISOString().slice(0, 16) : ''}
            onChange={(e) => setSettings({ ...settings, expiresAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
            disabled={!isEditing}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>

        {/* Download Limit */}
        <div className="border-b border-gray-200 pb-4">
          <label className="flex items-center space-x-2 font-medium text-gray-900 mb-2">
            <Download className="h-4 w-4" />
            <span>Download Limit</span>
          </label>
          <p className="text-sm text-gray-600 mb-3">
            Maximum number of times this document can be downloaded
          </p>
          <input
            type="number"
            value={settings.maxDownloads || ''}
            onChange={(e) => setSettings({ ...settings, maxDownloads: e.target.value ? parseInt(e.target.value) : undefined })}
            placeholder="Unlimited"
            min="1"
            disabled={!isEditing}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
          {currentSecurity && currentSecurity.maxDownloads && (
            <p className="text-sm text-gray-600 mt-2">
              Downloads: {currentSecurity.downloadCount} / {currentSecurity.maxDownloads}
            </p>
          )}
        </div>

        {/* Signature Requirement */}
        <div className="border-b border-gray-200 pb-4">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="requireSignature"
              checked={settings.requireSignature}
              onChange={(e) => setSettings({ ...settings, requireSignature: e.target.checked })}
              disabled={!isEditing}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <div className="flex-1">
              <label htmlFor="requireSignature" className="font-medium text-gray-900">
                Require Signature
              </label>
              <p className="text-sm text-gray-600 mt-1">
                Users must sign this document before accessing it
              </p>
            </div>
          </div>
        </div>

        {/* Document Permissions */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Document Permissions</h4>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="allowPrint"
                checked={settings.allowPrint}
                onChange={(e) => setSettings({ ...settings, allowPrint: e.target.checked })}
                disabled={!isEditing}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="flex-1">
                <label htmlFor="allowPrint" className="font-medium text-gray-900">
                  Allow Printing
                </label>
                <p className="text-sm text-gray-600">
                  Users can print this document
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="allowCopy"
                checked={settings.allowCopy}
                onChange={(e) => setSettings({ ...settings, allowCopy: e.target.checked })}
                disabled={!isEditing}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="flex-1">
                <label htmlFor="allowCopy" className="font-medium text-gray-900">
                  Allow Copy
                </label>
                <p className="text-sm text-gray-600">
                  Users can copy content from this document
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      )}
    </div>
  );
}
