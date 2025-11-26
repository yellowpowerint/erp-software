'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Brain, ArrowLeft, TrendingUp, AlertTriangle, CheckCircle, Target, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface Project {
  id: string;
  projectCode: string;
  name: string;
  status: string;
  progress: number;
}

interface ProjectSummary {
  projectId: string;
  projectName: string;
  projectCode: string;
  status: string;
  progress: number;
  overallHealth: string;
  summary: string;
  insights: string[];
  recommendations: string[];
  risks: Array<{ level: string; description: string }>;
  nextSteps: string[];
  statistics: {
    milestones: { completed: number; total: number; percentage: number };
    tasks: { completed: number; total: number; percentage: number };
    budget: { estimated: number; actual: number; expenses: number; variance: number };
    production: { totalProduction: number; recentLogs: number };
    reports: { criticalIssues: number };
  };
}

function ProjectSummariesContent() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [summary, setSummary] = useState<ProjectSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/projects');
      const items: Project[] = response.data || [];
      setProjects(items);
      if (items.length > 0) {
        setSelectedProject(items[0].id);
        fetchSummary(items[0].id);
      } else {
        setSummary(null);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      setError('Failed to load projects. Please try again later.');
      setProjects([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async (projectId: string) => {
    setAnalyzing(true);
    setError(null);
    try {
      const response = await api.get(`/ai/project-summary/${projectId}`);
      setSummary(response.data);
    } catch (error) {
      console.error('Failed to fetch project summary:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId);
    fetchSummary(projectId);
  };

  const getHealthColor = (health: string) => {
    const colors: any = {
      EXCELLENT: 'bg-green-100 text-green-800 border-green-200',
      GOOD: 'bg-blue-100 text-blue-800 border-blue-200',
      FAIR: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      AT_RISK: 'bg-orange-100 text-orange-800 border-orange-200',
      CRITICAL: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[health] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getRiskColor = (level: string) => {
    const colors: any = {
      LOW: 'bg-green-100 text-green-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      HIGH: 'bg-red-100 text-red-800',
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading projects...</p>
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
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <Brain className="w-8 h-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900">AI Project Summaries</h1>
            </div>
            <p className="text-gray-600 mt-1">AI-powered project analysis and recommendations</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Project Selector */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Project</label>
        {projects.length === 0 ? (
          <p className="text-sm text-gray-600">
            No projects found. Create a project first to generate AI summaries.
          </p>
        ) : (
          <select
            value={selectedProject}
            onChange={(e) => handleProjectChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name} ({project.projectCode}) - {project.progress}%
              </option>
            ))}
          </select>
        )}
      </div>

      {analyzing && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Analyzing project with AI...</p>
        </div>
      )}

      {!analyzing && summary && (
        <>
          {/* Health Status */}
          <div className={`rounded-lg shadow p-6 mb-6 border-2 ${getHealthColor(summary.overallHealth)}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold mb-1">{summary.projectName}</h2>
                <p className="text-sm opacity-75">{summary.projectCode}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium mb-1">Project Health</p>
                <p className="text-2xl font-bold">{summary.overallHealth.replace('_', ' ')}</p>
              </div>
            </div>
            <div className="w-full bg-white bg-opacity-50 rounded-full h-3">
              <div
                className="bg-current h-3 rounded-full transition-all"
                style={{ width: `${summary.progress}%` }}
              ></div>
            </div>
            <p className="text-sm mt-2 font-medium">{summary.progress}% Complete</p>
          </div>

          {/* AI Summary */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow p-6 mb-6 text-white">
            <div className="flex items-start space-x-3">
              <Lightbulb className="w-8 h-8 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold mb-2">AI Analysis</h3>
                <p className="text-indigo-100">{summary.summary}</p>
              </div>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-2">Milestones</p>
              <p className="text-2xl font-bold text-indigo-600">
                {summary.statistics.milestones.completed}/{summary.statistics.milestones.total}
              </p>
              <p className="text-xs text-gray-500 mt-1">{summary.statistics.milestones.percentage}% Complete</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-2">Tasks</p>
              <p className="text-2xl font-bold text-blue-600">
                {summary.statistics.tasks.completed}/{summary.statistics.tasks.total}
              </p>
              <p className="text-xs text-gray-500 mt-1">{summary.statistics.tasks.percentage}% Complete</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-2">Budget Status</p>
              <p className="text-2xl font-bold text-green-600">
                {summary.statistics.budget.actual.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                of {summary.statistics.budget.estimated.toLocaleString()} allocated
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-2">Production</p>
              <p className="text-2xl font-bold text-purple-600">
                {summary.statistics.production.totalProduction.toFixed(0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">{summary.statistics.production.recentLogs} recent logs</p>
            </div>
          </div>

          {/* Insights */}
          {summary.insights.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Brain className="w-5 h-5 mr-2 text-indigo-600" />
                Key Insights
              </h3>
              <div className="space-y-2">
                {summary.insights.map((insight, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risks */}
          {summary.risks.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                Risk Assessment
              </h3>
              <div className="space-y-2">
                {summary.risks.map((risk, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${getRiskColor(risk.level)}`}>
                      {risk.level}
                    </span>
                    <p className="text-sm text-gray-700 flex-1">{risk.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {summary.recommendations.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                Recommendations
              </h3>
              <div className="space-y-2">
                {summary.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next Steps */}
          {summary.nextSteps.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-indigo-600" />
                Suggested Next Steps
              </h3>
              <ol className="space-y-2">
                {summary.nextSteps.map((step, index) => (
                  <li key={index} className="flex items-start space-x-3 p-3 bg-indigo-50 rounded-lg">
                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </span>
                    <p className="text-sm text-gray-700 flex-1">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </>
      )}

      {!analyzing && !summary && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Project Selected</h3>
          <p className="text-gray-600">Select a project to generate AI-powered analysis.</p>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function ProjectSummariesPage() {
  return (
    <ProtectedRoute>
      <ProjectSummariesContent />
    </ProtectedRoute>
  );
}
