'use client';

import { useState } from 'react';

export interface InspectionPayload {
  overallResult: string;
  qualityScore?: number;
  visualCheck?: boolean;
  quantityCheck?: boolean;
  specCheck?: boolean;
  documentCheck?: boolean;
  safetyCheck?: boolean;
  findings?: string;
  recommendations?: string;
  photos?: string[];
}

export default function InspectionChecklist(props: {
  onSubmit: (payload: InspectionPayload) => Promise<void>;
  submitting?: boolean;
}) {
  const [overallResult, setOverallResult] = useState('PASSED');
  const [qualityScore, setQualityScore] = useState<number | ''>('');

  const [visualCheck, setVisualCheck] = useState(false);
  const [quantityCheck, setQuantityCheck] = useState(false);
  const [specCheck, setSpecCheck] = useState(false);
  const [documentCheck, setDocumentCheck] = useState(false);
  const [safetyCheck, setSafetyCheck] = useState(false);

  const [findings, setFindings] = useState('');
  const [recommendations, setRecommendations] = useState('');

  const submit = async () => {
    await props.onSubmit({
      overallResult,
      qualityScore: qualityScore === '' ? undefined : Number(qualityScore),
      visualCheck,
      quantityCheck,
      specCheck,
      documentCheck,
      safetyCheck,
      findings: findings || undefined,
      recommendations: recommendations || undefined,
      photos: [],
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Inspection</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Overall Result</label>
          <select
            value={overallResult}
            onChange={(e) => setOverallResult(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="PASSED">PASSED</option>
            <option value="PASSED_WITH_NOTES">PASSED_WITH_NOTES</option>
            <option value="FAILED">FAILED</option>
            <option value="PENDING_REVIEW">PENDING_REVIEW</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quality Score (1-100)</label>
          <input
            value={qualityScore}
            onChange={(e) => setQualityScore(e.target.value === '' ? '' : Number(e.target.value))}
            type="number"
            min={1}
            max={100}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={visualCheck} onChange={(e) => setVisualCheck(e.target.checked)} />
          Visual Check
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={quantityCheck} onChange={(e) => setQuantityCheck(e.target.checked)} />
          Quantity Check
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={specCheck} onChange={(e) => setSpecCheck(e.target.checked)} />
          Spec Check
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={documentCheck} onChange={(e) => setDocumentCheck(e.target.checked)} />
          Document Check
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={safetyCheck} onChange={(e) => setSafetyCheck(e.target.checked)} />
          Safety Check
        </label>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Findings</label>
        <textarea
          value={findings}
          onChange={(e) => setFindings(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          rows={3}
        />
      </div>

      <div className="mt-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Recommendations</label>
        <textarea
          value={recommendations}
          onChange={(e) => setRecommendations(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          rows={3}
        />
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={submit}
          disabled={!!props.submitting}
          className={`px-4 py-2 rounded-lg text-white ${
            props.submitting ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {props.submitting ? 'Submitting...' : 'Submit Inspection'}
        </button>
      </div>
    </div>
  );
}
