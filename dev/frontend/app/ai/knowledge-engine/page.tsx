'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Brain, ArrowLeft, BookOpen, Search, Send, FileText, Upload, Plus, X } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface Document {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  category: string;
  tags: string[];
  createdAt: string;
}

interface QAResponse {
  answer: string;
  sources: Array<{
    id: string;
    title: string;
    type: string;
    excerpt: string;
  }>;
  confidence: number;
  relatedQuestions: string[];
}

interface KnowledgeStats {
  totalDocuments: number;
  activeDocuments: number;
  documentsByType: Array<{
    type: string;
    count: number;
  }>;
}

function KnowledgeEngineContent() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<KnowledgeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'documents' | 'qa'>('qa');
  
  // Q&A State
  const [question, setQuestion] = useState('');
  const [qaResponse, setQaResponse] = useState<QAResponse | null>(null);
  const [askingQuestion, setAskingQuestion] = useState(false);
  
  // Upload State
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    type: 'MANUAL',
    content: '',
    category: '',
    tags: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [docsRes, statsRes] = await Promise.all([
        api.get('/ai/knowledge/documents'),
        api.get('/ai/knowledge/stats'),
      ]);
      setDocuments(docsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch knowledge base data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) return;

    setAskingQuestion(true);
    setQaResponse(null);

    try {
      const response = await api.post('/ai/knowledge/ask', { question });
      setQaResponse(response.data);
    } catch (error) {
      console.error('Failed to ask question:', error);
      setQaResponse({
        answer: 'Sorry, I encountered an error while processing your question. Please try again.',
        sources: [],
        confidence: 0,
        relatedQuestions: [],
      });
    } finally {
      setAskingQuestion(false);
    }
  };

  const handleUploadDocument = async () => {
    try {
      await api.post('/ai/knowledge/documents', {
        ...uploadForm,
        tags: uploadForm.tags.split(',').map(t => t.trim()).filter(t => t),
        uploadedBy: 'current-user', // This should come from auth context
      });
      
      alert('Document uploaded successfully!');
      setShowUploadForm(false);
      setUploadForm({
        title: '',
        description: '',
        type: 'MANUAL',
        content: '',
        category: '',
        tags: '',
      });
      fetchData();
    } catch (error) {
      console.error('Failed to upload document:', error);
      alert('Failed to upload document. Please try again.');
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      MANUAL: 'bg-blue-100 text-blue-800',
      SOP: 'bg-green-100 text-green-800',
      POLICY: 'bg-purple-100 text-purple-800',
      PROCEDURE: 'bg-yellow-100 text-yellow-800',
      REGULATION: 'bg-red-100 text-red-800',
      TRAINING: 'bg-indigo-100 text-indigo-800',
      REPORT: 'bg-gray-100 text-gray-800',
      OTHER: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || colors.OTHER;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-orange-600';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading knowledge base...</p>
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
              <BookOpen className="w-8 h-8 text-indigo-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mining Knowledge Engine</h1>
                <p className="text-gray-600 mt-1">AI-powered document search and Q&A system</p>
              </div>
            </div>
            <button
              onClick={() => setShowUploadForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Document</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-5 h-5 text-gray-500" />
              <span className="text-2xl font-bold text-gray-900">{stats.totalDocuments}</span>
            </div>
            <p className="text-xs text-gray-600">Total Documents</p>
          </div>

          <div className="bg-green-50 rounded-lg shadow p-4 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-5 h-5 text-green-600" />
              <span className="text-2xl font-bold text-green-600">{stats.activeDocuments}</span>
            </div>
            <p className="text-xs text-green-700 font-medium">Active Documents</p>
          </div>

          {stats.documentsByType.slice(0, 2).map((item, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-2">
                <FileText className="w-5 h-5 text-gray-500" />
                <span className="text-2xl font-bold text-gray-900">{item.count}</span>
              </div>
              <p className="text-xs text-gray-600">{item.type}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('qa')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'qa'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Brain className="w-5 h-5" />
                <span>Ask Questions</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'documents'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Documents ({documents.length})</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Q&A Tab */}
      {activeTab === 'qa' && (
        <div className="space-y-6">
          {/* Question Input */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ask a question about mining operations, safety, procedures, or regulations
              </label>
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
                  placeholder="e.g., What safety equipment is required for underground operations?"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  onClick={handleAskQuestion}
                  disabled={askingQuestion || !question.trim()}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {askingQuestion ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Thinking...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Ask</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Sample Questions */}
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-2">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  'What safety equipment is required?',
                  'How often is equipment maintenance needed?',
                  'What are the operational procedures?',
                  'What regulations must we comply with?',
                ].map((sample, index) => (
                  <button
                    key={index}
                    onClick={() => setQuestion(sample)}
                    className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Answer Display */}
          {qaResponse && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Brain className="w-6 h-6" />
                    <h3 className="text-lg font-semibold">AI Answer</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">Confidence:</span>
                    <span className={`text-lg font-bold ${qaResponse.confidence >= 80 ? '' : 'text-yellow-200'}`}>
                      {qaResponse.confidence}%
                    </span>
                  </div>
                </div>
                <p className="text-indigo-100 text-sm">Based on our knowledge base documents</p>
              </div>

              <div className="p-6">
                <p className="text-gray-800 leading-relaxed mb-6">{qaResponse.answer}</p>

                {/* Sources */}
                {qaResponse.sources.length > 0 && (
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Source Documents:</h4>
                    <div className="space-y-3">
                      {qaResponse.sources.map((source) => (
                        <div key={source.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-medium text-gray-900">{source.title}</h5>
                            <span className={`px-2 py-1 text-xs font-medium rounded ${getTypeColor(source.type)}`}>
                              {source.type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 italic">&quot;{source.excerpt}&quot;</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Related Questions */}
                {qaResponse.relatedQuestions.length > 0 && (
                  <div className="border-t border-gray-200 pt-6 mt-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Related Questions:</h4>
                    <div className="space-y-2">
                      {qaResponse.relatedQuestions.map((relQ, index) => (
                        <button
                          key={index}
                          onClick={() => setQuestion(relQ)}
                          className="w-full text-left px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 text-sm"
                        >
                          {relQ}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Knowledge Base Documents</h2>
          </div>

          {documents.length === 0 ? (
            <div className="p-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents Yet</h3>
              <p className="text-gray-600 mb-4">Upload documents to build your knowledge base</p>
              <button
                onClick={() => setShowUploadForm(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4" />
                <span>Upload First Document</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {documents.map((doc) => (
                <div key={doc.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <h3 className="text-lg font-semibold text-gray-900">{doc.title}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getTypeColor(doc.type)}`}>
                          {doc.type}
                        </span>
                      </div>
                      {doc.description && (
                        <p className="text-sm text-gray-600 ml-8">{doc.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="ml-8 flex items-center space-x-4 text-xs text-gray-500">
                    {doc.category && (
                      <span className="flex items-center space-x-1">
                        <span>Category:</span>
                        <span className="font-medium text-gray-700">{doc.category}</span>
                      </span>
                    )}
                    <span>
                      {new Date(doc.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    {doc.tags && doc.tags.length > 0 && (
                      <div className="flex items-center space-x-1">
                        {doc.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upload Form Modal */}
      {showUploadForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Upload Document</h3>
              <button onClick={() => setShowUploadForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select
                    value={uploadForm.type}
                    onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="MANUAL">Manual</option>
                    <option value="SOP">SOP</option>
                    <option value="POLICY">Policy</option>
                    <option value="PROCEDURE">Procedure</option>
                    <option value="REGULATION">Regulation</option>
                    <option value="TRAINING">Training</option>
                    <option value="REPORT">Report</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={uploadForm.category}
                    onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                    placeholder="e.g., Safety, Operations"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                <textarea
                  value={uploadForm.content}
                  onChange={(e) => setUploadForm({ ...uploadForm, content: e.target.value })}
                  rows={10}
                  placeholder="Paste or type the document content here..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={uploadForm.tags}
                  onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                  placeholder="safety, equipment, training"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3 border-t border-gray-200">
              <button
                onClick={() => setShowUploadForm(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadDocument}
                disabled={!uploadForm.title || !uploadForm.content}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Upload Document
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function KnowledgeEnginePage() {
  return (
    <ProtectedRoute>
      <KnowledgeEngineContent />
    </ProtectedRoute>
  );
}
