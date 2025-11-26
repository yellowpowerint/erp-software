'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { TrendingUp, ArrowLeft, Sparkles, X, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface Application {
  id: string;
  status: string;
  appliedAt: string;
  aiScreened: boolean;
  aiScore?: number;
  aiRecommendation?: string;
  aiStrengths?: string[];
  aiWeaknesses?: string[];
  overallScore?: number;
  rank?: number;
  candidate: {
    candidateId: string;
    firstName: string;
    lastName: string;
    email: string;
    skills?: string[];
    yearsExperience?: number;
    aiSkillMatch?: number;
    aiExperienceMatch?: number;
    aiCultureFit?: number;
  };
  jobPosting: {
    jobId: string;
    title: string;
    department: string;
  };
}

function CandidateScreeningPageContent() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [screening, setScreening] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await api.get('/hr/recruitment/applications');
      setApplications(response.data);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScreenCandidate = async (applicationId: string) => {
    setScreening(applicationId);
    try {
      const response = await api.post('/hr/recruitment/screen-candidate', {
        applicationId,
        jobRequirements: 'Mining industry experience required',
      });

      alert(`AI Screening complete! Score: ${response.data.aiScore.toFixed(1)}/100`);
      fetchApplications();
    } catch (error) {
      console.error('Failed to screen candidate:', error);
      alert('Failed to screen candidate');
    } finally {
      setScreening(null);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      SUBMITTED: 'bg-blue-100 text-blue-800',
      SCREENING: 'bg-yellow-100 text-yellow-800',
      SHORTLISTED: 'bg-green-100 text-green-800',
      INTERVIEW_SCHEDULED: 'bg-purple-100 text-purple-800',
      INTERVIEWED: 'bg-indigo-100 text-indigo-800',
      OFFERED: 'bg-emerald-100 text-emerald-800',
      ACCEPTED: 'bg-teal-100 text-teal-800',
      REJECTED: 'bg-red-100 text-red-800',
      WITHDRAWN: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 65) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link href="/hr/recruitment" className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Recruitment</span>
        </Link>
        <div className="flex items-center space-x-3">
          <TrendingUp className="w-8 h-8 text-yellow-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Candidate Screening</h1>
            <p className="text-gray-600">AI-powered candidate evaluation and ranking</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 mb-6 border border-yellow-200">
        <div className="flex items-center">
          <Sparkles className="w-5 h-5 text-yellow-600 mr-3" />
          <div>
            <p className="text-sm font-medium text-yellow-900">AI Screening Available</p>
            <p className="text-xs text-yellow-700">Click &quot;Screen with AI&quot; to analyze candidate fit using machine learning</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {applications.map((app) => (
              <div key={app.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {app.candidate.firstName} {app.candidate.lastName}
                      </h3>
                      <span className="text-sm text-gray-500">({app.candidate.candidateId})</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(app.status)}`}>
                        {app.status.replace('_', ' ')}
                      </span>
                      {app.aiScreened && (
                        <span className="flex items-center px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-800">
                          <Sparkles className="w-3 h-3 mr-1" />
                          AI Screened
                        </span>
                      )}
                      {app.rank && (
                        <span className="px-2 py-1 text-xs font-medium rounded bg-indigo-100 text-indigo-800">
                          Rank #{app.rank}
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-gray-600 space-y-2">
                      <div className="flex items-center space-x-4">
                        <span>Position: <span className="font-medium">{app.jobPosting.title}</span></span>
                        <span>Department: {app.jobPosting.department}</span>
                        <span>Job ID: <span className="font-mono">{app.jobPosting.jobId}</span></span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span>Applied: {new Date(app.appliedAt).toLocaleDateString()}</span>
                        <span>Email: {app.candidate.email}</span>
                        {app.candidate.yearsExperience && (
                          <span>Experience: {app.candidate.yearsExperience} years</span>
                        )}
                      </div>

                      {app.candidate.skills && app.candidate.skills.length > 0 && (
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-700">Skills:</span>
                          <div className="flex flex-wrap gap-1">
                            {app.candidate.skills.map((skill, idx) => (
                              <span key={idx} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {app.aiScreened && app.aiScore && (
                        <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-purple-900">AI Analysis</span>
                            <span className={`text-lg font-bold ${getScoreColor(app.aiScore)}`}>
                              {app.aiScore.toFixed(1)}/100
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-4 mb-2">
                            {app.candidate.aiSkillMatch && (
                              <div>
                                <div className="text-xs text-gray-600">Skill Match</div>
                                <div className="text-sm font-medium text-gray-900">
                                  {app.candidate.aiSkillMatch.toFixed(0)}%
                                </div>
                              </div>
                            )}
                            {app.candidate.aiExperienceMatch && (
                              <div>
                                <div className="text-xs text-gray-600">Experience Match</div>
                                <div className="text-sm font-medium text-gray-900">
                                  {app.candidate.aiExperienceMatch.toFixed(0)}%
                                </div>
                              </div>
                            )}
                            {app.candidate.aiCultureFit && (
                              <div>
                                <div className="text-xs text-gray-600">Culture Fit</div>
                                <div className="text-sm font-medium text-gray-900">
                                  {app.candidate.aiCultureFit.toFixed(0)}%
                                </div>
                              </div>
                            )}
                          </div>
                          {app.aiRecommendation && (
                            <p className="text-xs text-gray-700 italic">{app.aiRecommendation}</p>
                          )}
                          <button
                            onClick={() => setSelectedApp(app)}
                            className="mt-2 text-xs text-purple-600 hover:text-purple-700 font-medium"
                          >
                            View Full Analysis →
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ml-4">
                    {!app.aiScreened ? (
                      <button
                        onClick={() => handleScreenCandidate(app.id)}
                        disabled={screening === app.id}
                        className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>{screening === app.id ? 'Screening...' : 'Screen with AI'}</span>
                      </button>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <button className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && applications.length === 0 && (
          <div className="text-center py-12">
            <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications</h3>
            <p className="text-gray-600">Applications will appear here when candidates apply</p>
          </div>
        )}
      </div>

      {/* Full Analysis Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">AI Screening Analysis</h2>
                <p className="text-sm text-purple-100">
                  {selectedApp.candidate.firstName} {selectedApp.candidate.lastName}
                </p>
              </div>
              <button onClick={() => setSelectedApp(null)} className="text-white hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Overall Score */}
              <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900">Overall AI Score</span>
                  <span className={`text-3xl font-bold ${getScoreColor(selectedApp.aiScore!)}`}>
                    {selectedApp.aiScore!.toFixed(1)}/100
                  </span>
                </div>
              </div>

              {/* Score Breakdown */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Score Breakdown</h3>
                <div className="space-y-3">
                  {selectedApp.candidate.aiSkillMatch && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700">Skill Match</span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedApp.candidate.aiSkillMatch.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${selectedApp.candidate.aiSkillMatch}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  {selectedApp.candidate.aiExperienceMatch && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700">Experience Match</span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedApp.candidate.aiExperienceMatch.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${selectedApp.candidate.aiExperienceMatch}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  {selectedApp.candidate.aiCultureFit && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700">Culture Fit</span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedApp.candidate.aiCultureFit.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${selectedApp.candidate.aiCultureFit}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Recommendation */}
              {selectedApp.aiRecommendation && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Recommendation</h3>
                  <p className="text-gray-700 bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                    {selectedApp.aiRecommendation}
                  </p>
                </div>
              )}

              {/* Strengths */}
              {selectedApp.aiStrengths && selectedApp.aiStrengths.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Strengths</h3>
                  <div className="space-y-2">
                    {selectedApp.aiStrengths.map((strength, idx) => (
                      <div key={idx} className="flex items-start space-x-2 bg-green-50 p-3 rounded-lg border border-green-200">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                        <span className="text-sm text-gray-700">{strength}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Weaknesses */}
              {selectedApp.aiWeaknesses && selectedApp.aiWeaknesses.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Areas for Consideration</h3>
                  <div className="space-y-2">
                    {selectedApp.aiWeaknesses.map((weakness, idx) => (
                      <div key={idx} className="flex items-start space-x-2 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                        <XCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                        <span className="text-sm text-gray-700">{weakness}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function CandidateScreeningPage() {
  return (
    <ProtectedRoute>
      <CandidateScreeningPageContent />
    </ProtectedRoute>
  );
}
