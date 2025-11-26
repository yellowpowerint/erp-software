'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Brain, ArrowLeft, AlertTriangle, Wrench, TrendingUp, Calendar, DollarSign, Activity } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface MaintenancePrediction {
  assetId: string;
  assetCode: string;
  name: string;
  category: string;
  condition: string;
  riskScore: number;
  riskLevel: string;
  daysUntilMaintenance: number;
  lastMaintenanceAt: string | null;
  nextMaintenanceAt: string | null;
  recommendations: string[];
  maintenanceFrequency: number;
  totalMaintenanceCost: number;
  maintenanceCount: number;
  urgency: string;
}

interface PredictionData {
  predictions: MaintenancePrediction[];
  summary: string;
  statistics: {
    totalAssets: number;
    criticalRisk: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
    overdueMaintenances: number;
  };
}

function MaintenancePredictorContent() {
  const [data, setData] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    try {
      const response = await api.get('/ai/maintenance-predictor');
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch maintenance predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'EXCELLENT':
        return 'bg-green-100 text-green-800';
      case 'GOOD':
        return 'bg-blue-100 text-blue-800';
      case 'FAIR':
        return 'bg-yellow-100 text-yellow-800';
      case 'POOR':
        return 'bg-orange-100 text-orange-800';
      case 'CRITICAL':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskProgressColor = (riskScore: number) => {
    if (riskScore >= 70) return 'bg-red-600';
    if (riskScore >= 50) return 'bg-orange-500';
    if (riskScore >= 30) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not scheduled';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Analyzing equipment and predicting maintenance needs...</p>
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
          <div className="flex items-center space-x-3">
            <Wrench className="w-8 h-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">AI Maintenance Predictor</h1>
          </div>
          <p className="text-gray-600 mt-1">Predictive maintenance analysis and breakdown risk assessment</p>
        </div>
      </div>

      {data && (
        <>
          {/* Summary Alert */}
          <div className={`rounded-lg p-6 mb-6 ${
            data.statistics.criticalRisk > 0 
              ? 'bg-red-50 border-2 border-red-300'
              : data.statistics.highRisk > 0
              ? 'bg-orange-50 border-2 border-orange-300'
              : 'bg-green-50 border-2 border-green-300'
          }`}>
            <div className="flex items-start space-x-3">
              <AlertTriangle className={`w-6 h-6 flex-shrink-0 mt-1 ${
                data.statistics.criticalRisk > 0 
                  ? 'text-red-600'
                  : data.statistics.highRisk > 0
                  ? 'text-orange-600'
                  : 'text-green-600'
              }`} />
              <div>
                <h2 className={`text-lg font-semibold mb-1 ${
                  data.statistics.criticalRisk > 0 
                    ? 'text-red-900'
                    : data.statistics.highRisk > 0
                    ? 'text-orange-900'
                    : 'text-green-900'
                }`}>
                  {data.summary}
                </h2>
                <p className={`text-sm ${
                  data.statistics.criticalRisk > 0 
                    ? 'text-red-700'
                    : data.statistics.highRisk > 0
                    ? 'text-orange-700'
                    : 'text-green-700'
                }`}>
                  Based on AI analysis of {data.statistics.totalAssets} equipment items
                </p>
              </div>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-5 h-5 text-gray-500" />
                <span className="text-2xl font-bold text-gray-900">{data.statistics.totalAssets}</span>
              </div>
              <p className="text-xs text-gray-600">Total Assets</p>
            </div>

            <div className="bg-red-50 rounded-lg shadow p-4 border border-red-200">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="text-2xl font-bold text-red-600">{data.statistics.criticalRisk}</span>
              </div>
              <p className="text-xs text-red-700 font-medium">Critical Risk</p>
            </div>

            <div className="bg-orange-50 rounded-lg shadow p-4 border border-orange-200">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <span className="text-2xl font-bold text-orange-600">{data.statistics.highRisk}</span>
              </div>
              <p className="text-xs text-orange-700 font-medium">High Risk</p>
            </div>

            <div className="bg-yellow-50 rounded-lg shadow p-4 border border-yellow-200">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span className="text-2xl font-bold text-yellow-600">{data.statistics.mediumRisk}</span>
              </div>
              <p className="text-xs text-yellow-700 font-medium">Medium Risk</p>
            </div>

            <div className="bg-green-50 rounded-lg shadow p-4 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-2xl font-bold text-green-600">{data.statistics.lowRisk}</span>
              </div>
              <p className="text-xs text-green-700 font-medium">Low Risk</p>
            </div>

            <div className="bg-purple-50 rounded-lg shadow p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <span className="text-2xl font-bold text-purple-600">{data.statistics.overdueMaintenances}</span>
              </div>
              <p className="text-xs text-purple-700 font-medium">Overdue</p>
            </div>
          </div>

          {/* Equipment List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Brain className="w-5 h-5 mr-2 text-indigo-600" />
                Equipment Breakdown Risk Assessment
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Sorted by risk score (highest risk first)
              </p>
            </div>

            <div className="divide-y divide-gray-200">
              {data.predictions.map((prediction) => (
                <div key={prediction.assetId} className="p-6 hover:bg-gray-50 transition-colors">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{prediction.name}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded border ${getRiskColor(prediction.riskLevel)}`}>
                          {prediction.riskLevel} RISK
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getConditionColor(prediction.condition)}`}>
                          {prediction.condition}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="font-mono">{prediction.assetCode}</span>
                        <span className="capitalize">{prediction.category.toLowerCase()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">{prediction.riskScore}%</div>
                      <div className="text-xs text-gray-500">Risk Score</div>
                    </div>
                  </div>

                  {/* Risk Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Breakdown Risk</span>
                      <span>{prediction.riskScore}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${getRiskProgressColor(prediction.riskScore)}`}
                        style={{ width: `${prediction.riskScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-start space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-gray-500">Last Maintenance</div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatDate(prediction.lastMaintenanceAt)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-gray-500">Next Maintenance</div>
                        <div className={`text-sm font-medium ${
                          prediction.daysUntilMaintenance < 0 ? 'text-red-600' : 'text-gray-900'
                        }`}>
                          {prediction.daysUntilMaintenance < 0 
                            ? `${Math.abs(prediction.daysUntilMaintenance)} days overdue`
                            : prediction.daysUntilMaintenance === 9999
                            ? 'Not scheduled'
                            : `In ${prediction.daysUntilMaintenance} days`
                          }
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2">
                      <Wrench className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-gray-500">Maintenance History</div>
                        <div className="text-sm font-medium text-gray-900">
                          {prediction.maintenanceCount} times
                          {prediction.maintenanceFrequency > 0 && 
                            ` (~${prediction.maintenanceFrequency} days)`
                          }
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2">
                      <DollarSign className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-gray-500">Total Cost</div>
                        <div className="text-sm font-medium text-gray-900">
                          GHS {prediction.totalMaintenanceCost.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Recommendations */}
                  {prediction.recommendations.length > 0 && (
                    <div className="bg-indigo-50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-indigo-900 mb-2 flex items-center">
                        <Brain className="w-4 h-4 mr-1" />
                        AI Recommendations
                      </h4>
                      <ul className="space-y-1">
                        {prediction.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm text-indigo-800 flex items-start">
                            <span className="mr-2">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {data.predictions.length === 0 && (
              <div className="p-12 text-center">
                <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Equipment Found</h3>
                <p className="text-gray-600">No active equipment to analyze at this time.</p>
              </div>
            )}
          </div>
        </>
      )}

      {!data && !loading && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Predictions Available</h3>
          <p className="text-gray-600">Maintenance predictions will appear as equipment data becomes available.</p>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function MaintenancePredictorPage() {
  return (
    <ProtectedRoute>
      <MaintenancePredictorContent />
    </ProtectedRoute>
  );
}
