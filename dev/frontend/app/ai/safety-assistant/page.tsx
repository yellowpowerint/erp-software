'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Brain, ArrowLeft, AlertTriangle, Shield, Camera, FileText, CheckCircle, X, AlertCircle as AlertCircleIcon } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface SafetyIncident {
  id: string;
  incidentNumber: string;
  type: string;
  severity: string;
  status: string;
  location: string;
  incidentDate: string;
  reportedBy: string;
  description: string;
  oshaReportable: boolean;
}

interface IncidentAnalysis {
  analysis: {
    summary: string;
    hazardsIdentified: string[];
    affectedAreas: string[];
    immediateActions: string[];
  };
  rootCause: {
    analysis: string;
    contributingFactors: string[];
    recommendations: string[];
  };
  correctiveActions: string[];
  oshaReportable: boolean;
  oshaReport: string | null;
}

interface SafetyStats {
  totalIncidents: number;
  openIncidents: number;
  oshaReportable: number;
  incidentsByType: Array<{ type: string; count: number }>;
  incidentsBySeverity: Array<{ severity: string; count: number }>;
}

function SafetyAssistantContent() {
  const [stats, setStats] = useState<SafetyStats | null>(null);
  const [incidents, setIncidents] = useState<SafetyIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReportForm, setShowReportForm] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<{ incident: SafetyIncident; analysis: IncidentAnalysis } | null>(null);
  
  // Report Form State
  const [reportForm, setReportForm] = useState({
    type: 'INJURY',
    severity: 'MINOR',
    location: '',
    incidentDate: new Date().toISOString().slice(0, 16),
    reportedBy: 'current-user',
    description: '',
    injuries: '',
    witnesses: '',
    photoUrls: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, incidentsRes] = await Promise.all([
        api.get('/ai/safety/stats'),
        api.get('/ai/safety/incidents'),
      ]);
      setStats(statsRes.data);
      setIncidents(incidentsRes.data);
    } catch (error) {
      console.error('Failed to fetch safety data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReportIncident = async () => {
    setSubmitting(true);
    try {
      const response = await api.post('/ai/safety/report-incident', {
        ...reportForm,
        incidentDate: new Date(reportForm.incidentDate),
        witnesses: reportForm.witnesses.split(',').map(w => w.trim()).filter(w => w),
        photoUrls: reportForm.photoUrls.split(',').map(u => u.trim()).filter(u => u),
      });

      // Show analysis results
      setSelectedIncident(response.data);
      
      // Reset form and close modal
      setReportForm({
        type: 'INJURY',
        severity: 'MINOR',
        location: '',
        incidentDate: new Date().toISOString().slice(0, 16),
        reportedBy: 'current-user',
        description: '',
        injuries: '',
        witnesses: '',
        photoUrls: '',
      });
      setShowReportForm(false);
      
      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Failed to report incident:', error);
      alert('Failed to report incident. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      MINOR: 'bg-blue-100 text-blue-800 border-blue-300',
      MODERATE: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      SERIOUS: 'bg-orange-100 text-orange-800 border-orange-300',
      CRITICAL: 'bg-red-100 text-red-800 border-red-300',
      FATAL: 'bg-purple-100 text-purple-800 border-purple-300',
    };
    return colors[severity] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      INJURY: 'bg-red-100 text-red-800',
      NEAR_MISS: 'bg-yellow-100 text-yellow-800',
      EQUIPMENT_DAMAGE: 'bg-orange-100 text-orange-800',
      ENVIRONMENTAL: 'bg-green-100 text-green-800',
      SECURITY: 'bg-purple-100 text-purple-800',
      FIRE: 'bg-red-100 text-red-800',
      CHEMICAL_SPILL: 'bg-pink-100 text-pink-800',
      OTHER: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading safety data...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link href="/ai" className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to AI Intelligence</span>
        </Link>
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-indigo-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Safety Assistant</h1>
                <p className="text-gray-600 mt-1">Incident analysis and OSHA report generation</p>
              </div>
            </div>
            <button
              onClick={() => setShowReportForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Report Incident</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-5 h-5 text-gray-500" />
              <span className="text-2xl font-bold text-gray-900">{stats.totalIncidents}</span>
            </div>
            <p className="text-xs text-gray-600">Total Incidents</p>
          </div>

          <div className="bg-yellow-50 rounded-lg shadow p-4 border border-yellow-200">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <span className="text-2xl font-bold text-yellow-600">{stats.openIncidents}</span>
            </div>
            <p className="text-xs text-yellow-700 font-medium">Open Incidents</p>
          </div>

          <div className="bg-red-50 rounded-lg shadow p-4 border border-red-200">
            <div className="flex items-center justify-between mb-2">
              <Shield className="w-5 h-5 text-red-600" />
              <span className="text-2xl font-bold text-red-600">{stats.oshaReportable}</span>
            </div>
            <p className="text-xs text-red-700 font-medium">OSHA Reportable</p>
          </div>

          {stats.incidentsByType.slice(0, 2).map((item, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="w-5 h-5 text-gray-500" />
                <span className="text-2xl font-bold text-gray-900">{item.count}</span>
              </div>
              <p className="text-xs text-gray-600">{item.type.replace('_', ' ')}</p>
            </div>
          ))}
        </div>
      )}

      {/* Recent Incidents */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Incidents</h2>
        </div>

        {incidents.length === 0 ? (
          <div className="p-12 text-center">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Incidents Reported</h3>
            <p className="text-gray-600 mb-4">Report incidents to enable AI analysis and safety recommendations</p>
            <button
              onClick={() => setShowReportForm(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Report First Incident</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {incidents.slice(0, 10).map((incident) => (
              <div key={incident.id} className="p-6 hover:bg-gray-50 cursor-pointer" onClick={async () => {
                try {
                  const response = await api.get(`/ai/safety/incidents/${incident.id}`);
                  const analysisRes = await api.post(`/ai/safety/analyze/${incident.id}`);
                  setSelectedIncident({
                    incident: response.data,
                    analysis: analysisRes.data,
                  });
                } catch (error) {
                  console.error('Failed to load incident details:', error);
                }
              }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <AlertTriangle className="w-5 h-5 text-gray-400" />
                      <span className="font-mono text-sm text-gray-600">{incident.incidentNumber}</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getTypeColor(incident.type)}`}>
                        {incident.type.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded border ${getSeverityColor(incident.severity)}`}>
                        {incident.severity}
                      </span>
                      {incident.oshaReportable && (
                        <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800">
                          OSHA REPORTABLE
                        </span>
                      )}
                    </div>
                    <p className="text-gray-800 mb-2">{incident.description.substring(0, 200)}{incident.description.length > 200 && '...'}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Location: {incident.location}</span>
                      <span>Date: {new Date(incident.incidentDate).toLocaleDateString()}</span>
                      <span>Reported by: {incident.reportedBy}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report Form Modal */}
      {showReportForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Report Safety Incident</h3>
              <button onClick={() => setShowReportForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Incident Type *</label>
                  <select
                    value={reportForm.type}
                    onChange={(e) => setReportForm({ ...reportForm, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  >
                    <option value="INJURY">Injury</option>
                    <option value="NEAR_MISS">Near Miss</option>
                    <option value="EQUIPMENT_DAMAGE">Equipment Damage</option>
                    <option value="ENVIRONMENTAL">Environmental</option>
                    <option value="SECURITY">Security</option>
                    <option value="FIRE">Fire</option>
                    <option value="CHEMICAL_SPILL">Chemical Spill</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Severity *</label>
                  <select
                    value={reportForm.severity}
                    onChange={(e) => setReportForm({ ...reportForm, severity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  >
                    <option value="MINOR">Minor</option>
                    <option value="MODERATE">Moderate</option>
                    <option value="SERIOUS">Serious</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="FATAL">Fatal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                  <input
                    type="text"
                    value={reportForm.location}
                    onChange={(e) => setReportForm({ ...reportForm, location: e.target.value })}
                    placeholder="e.g., Mining Pit A, Section 3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Incident Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={reportForm.incidentDate}
                    onChange={(e) => setReportForm({ ...reportForm, incidentDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  value={reportForm.description}
                  onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                  rows={4}
                  placeholder="Describe what happened in detail..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Injuries/Illnesses (if any)</label>
                <textarea
                  value={reportForm.injuries}
                  onChange={(e) => setReportForm({ ...reportForm, injuries: e.target.value })}
                  rows={2}
                  placeholder="Describe any injuries or illnesses..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Witnesses (comma-separated)</label>
                <input
                  type="text"
                  value={reportForm.witnesses}
                  onChange={(e) => setReportForm({ ...reportForm, witnesses: e.target.value })}
                  placeholder="John Doe, Jane Smith"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Camera className="w-4 h-4 inline mr-1" />
                  Photo URLs (comma-separated)
                </label>
                <input
                  type="text"
                  value={reportForm.photoUrls}
                  onChange={(e) => setReportForm({ ...reportForm, photoUrls: e.target.value })}
                  placeholder="https://example.com/photo1.jpg, https://example.com/photo2.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
                <p className="text-xs text-gray-500 mt-1">Paste photo URLs or upload to a service first</p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-600">
                <AlertCircleIcon className="w-4 h-4 inline mr-1" />
                AI analysis will be generated immediately
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowReportForm(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleReportIncident}
                  disabled={submitting || !reportForm.description || !reportForm.location}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      <span>Report & Analyze</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Result Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-red-500 to-orange-600 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Brain className="w-6 h-6" />
                <div>
                  <h3 className="text-lg font-semibold">AI Safety Analysis</h3>
                  <p className="text-sm text-red-100">{selectedIncident.incident.incidentNumber}</p>
                </div>
              </div>
              <button onClick={() => setSelectedIncident(null)} className="text-white hover:text-gray-200">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Incident Details */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Incident Details</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getTypeColor(selectedIncident.incident.type)}`}>
                      {selectedIncident.incident.type.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded border ${getSeverityColor(selectedIncident.incident.severity)}`}>
                      {selectedIncident.incident.severity}
                    </span>
                    {selectedIncident.analysis.oshaReportable && (
                      <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800">
                        OSHA REPORTABLE
                      </span>
                    )}
                  </div>
                  <p className="text-gray-800">{selectedIncident.incident.description}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div>Location: {selectedIncident.incident.location}</div>
                    <div>Date: {new Date(selectedIncident.incident.incidentDate).toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* AI Analysis Summary */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Brain className="w-5 h-5 mr-2 text-indigo-600" />
                  AI Analysis Summary
                </h4>
                <div className="bg-indigo-50 rounded-lg p-4">
                  <p className="text-gray-800">{selectedIncident.analysis.analysis.summary}</p>
                </div>
              </div>

              {/* Hazards Identified */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Hazards Identified:</h4>
                <div className="space-y-2">
                  {selectedIncident.analysis.analysis.hazardsIdentified.map((hazard, index) => (
                    <div key={index} className="flex items-start space-x-2 bg-red-50 p-3 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-800">{hazard}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Immediate Actions */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Immediate Actions Required:</h4>
                <div className="space-y-2">
                  {selectedIncident.analysis.analysis.immediateActions.map((action, index) => (
                    <div key={index} className="flex items-start space-x-2 bg-yellow-50 p-3 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-800">{action}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Root Cause Analysis */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Root Cause Analysis</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <p className="text-gray-800">{selectedIncident.analysis.rootCause.analysis}</p>
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">Contributing Factors:</h5>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                      {selectedIncident.analysis.rootCause.contributingFactors.map((factor, index) => (
                        <li key={index}>{factor}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Corrective Actions */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Corrective Actions</h4>
                <div className="space-y-2">
                  {selectedIncident.analysis.correctiveActions.map((action, index) => (
                    <div key={index} className="flex items-start space-x-3 bg-green-50 p-3 rounded-lg">
                      <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs">
                        {index + 1}
                      </span>
                      <span className="text-sm text-gray-800">{action}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* OSHA Report */}
              {selectedIncident.analysis.oshaReport && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-red-600" />
                    OSHA Incident Report
                  </h4>
                  <div className="bg-white border-2 border-red-300 rounded-lg p-4">
                    <pre className="text-xs text-gray-800 whitespace-pre-wrap font-mono">
                      {selectedIncident.analysis.oshaReport}
                    </pre>
                  </div>
                  <p className="text-xs text-red-600 mt-2">
                    * This AI-generated report must be reviewed by qualified safety personnel before submission to OSHA.
                  </p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedIncident(null)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function SafetyAssistantPage() {
  return (
    <ProtectedRoute>
      <SafetyAssistantContent />
    </ProtectedRoute>
  );
}
