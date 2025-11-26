'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Brain, TrendingUp, AlertTriangle, CheckCircle, ArrowRight, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface DashboardInsights {
  summary: string;
  insights: string[];
  metrics: {
    activeProjects: number;
    pendingExpenses: number;
    overbudgetCount: number;
    assetsInMaintenance: number;
  };
}

function AiDashboardContent() {
  const [insights, setInsights] = useState<DashboardInsights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const response = await api.get('/ai/dashboard-insights');
      setInsights(response.data);
    } catch (error) {
      console.error('Failed to fetch AI insights:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Generating AI insights...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <Brain className="w-8 h-8 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">AI Intelligence</h1>
        </div>
        <p className="text-gray-600">Smart insights and recommendations powered by AI</p>
      </div>

      {/* AI Summary */}
      {insights && (
        <>
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 mb-6 text-white">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <Lightbulb className="w-12 h-12" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-2">AI Summary</h2>
                <p className="text-indigo-100 text-lg">{insights.summary}</p>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Projects</p>
                  <p className="text-2xl font-bold text-indigo-600 mt-1">{insights.metrics.activeProjects}</p>
                </div>
                <div className="bg-indigo-100 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Expenses</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-1">{insights.metrics.pendingExpenses}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Over Budget</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{insights.metrics.overbudgetCount}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Assets in Maintenance</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">{insights.metrics.assetsInMaintenance}</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* AI Insights */}
          {insights.insights.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Brain className="w-5 h-5 mr-2 text-indigo-600" />
                AI-Generated Insights
              </h2>
              <div className="space-y-3">
                {insights.insights.map((insight, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-indigo-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href="/ai/project-summaries"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Project Summaries</h3>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Get AI-powered analysis of your projects including health scores, risks, and recommendations.
              </p>
              <div className="flex items-center space-x-2 text-indigo-600 text-sm font-medium">
                <Brain className="w-4 h-4" />
                <span>View AI Analysis</span>
              </div>
            </Link>

            <Link
              href="/ai/procurement-advisor"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Procurement Advisor</h3>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Smart purchasing recommendations, supplier analysis, and cost-saving opportunities.
              </p>
              <div className="flex items-center space-x-2 text-indigo-600 text-sm font-medium">
                <Brain className="w-4 h-4" />
                <span>Get Recommendations</span>
              </div>
            </Link>

            <Link
              href="/ai/maintenance-predictor"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Maintenance Predictor</h3>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Predictive maintenance analysis and breakdown risk assessment for heavy equipment.
              </p>
              <div className="flex items-center space-x-2 text-indigo-600 text-sm font-medium">
                <Brain className="w-4 h-4" />
                <span>View Predictions</span>
              </div>
            </Link>

            <Link
              href="/ai/knowledge-engine"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Knowledge Engine</h3>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
              </div>
              <p className="text-sm text-gray-600 mb-4">
                AI-powered document search and Q&A system for mining manuals, SOPs, and regulations.
              </p>
              <div className="flex items-center space-x-2 text-indigo-600 text-sm font-medium">
                <Brain className="w-4 h-4" />
                <span>Ask Questions</span>
              </div>
            </Link>
          </div>
        </>
      )}

      {!insights && !loading && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Insights Available</h3>
          <p className="text-gray-600">AI insights will appear here as data becomes available.</p>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function AiDashboardPage() {
  return (
    <ProtectedRoute>
      <AiDashboardContent />
    </ProtectedRoute>
  );
}
