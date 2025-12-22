'use client';

import { useState } from 'react';

export default function InvoiceApprovalPanel(props: {
  canMatch: boolean;
  canApprove: boolean;
  canDispute: boolean;
  canPay: boolean;
  onMatch: (tolerancePercent?: number) => Promise<void>;
  onApprove: () => Promise<void>;
  onDispute: (notes: string) => Promise<void>;
  onPay: (payload: { amount: string; paymentDate: string; paymentMethod: string; reference?: string; notes?: string }) => Promise<void>;
  loading?: boolean;
}) {
  const [tolerance, setTolerance] = useState<number>(2);
  const [disputeNotes, setDisputeNotes] = useState('');

  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [reference, setReference] = useState('');
  const [payNotes, setPayNotes] = useState('');

  const payDateIso = () => {
    const d = new Date(paymentDate);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Actions</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="border rounded-lg p-4">
          <div className="text-sm font-semibold text-gray-900">Three-Way Match</div>
          <div className="mt-2">
            <label className="block text-xs text-gray-500 mb-1">Tolerance (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={tolerance}
              onChange={(e) => setTolerance(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <button
            type="button"
            disabled={!props.canMatch || !!props.loading}
            onClick={() => props.onMatch(tolerance)}
            className={`mt-3 w-full px-4 py-2 rounded-lg text-white ${
              !props.canMatch || props.loading ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            Run Match
          </button>
        </div>

        <div className="border rounded-lg p-4">
          <div className="text-sm font-semibold text-gray-900">Approve / Dispute</div>
          <button
            type="button"
            disabled={!props.canApprove || !!props.loading}
            onClick={() => props.onApprove()}
            className={`mt-3 w-full px-4 py-2 rounded-lg text-white ${
              !props.canApprove || props.loading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            Approve
          </button>

          <div className="mt-3">
            <label className="block text-xs text-gray-500 mb-1">Dispute Notes</label>
            <textarea
              value={disputeNotes}
              onChange={(e) => setDisputeNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={3}
            />
          </div>
          <button
            type="button"
            disabled={!props.canDispute || !!props.loading || disputeNotes.trim().length < 2}
            onClick={() => props.onDispute(disputeNotes.trim())}
            className={`mt-3 w-full px-4 py-2 rounded-lg text-white ${
              !props.canDispute || props.loading || disputeNotes.trim().length < 2
                ? 'bg-gray-400'
                : 'bg-yellow-600 hover:bg-yellow-700'
            }`}
          >
            Dispute
          </button>
        </div>

        <div className="border rounded-lg p-4">
          <div className="text-sm font-semibold text-gray-900">Record Payment</div>
          <div className="mt-2">
            <label className="block text-xs text-gray-500 mb-1">Amount</label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="0"
            />
          </div>
          <div className="mt-2">
            <label className="block text-xs text-gray-500 mb-1">Payment Date</label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="mt-2">
            <label className="block text-xs text-gray-500 mb-1">Method</label>
            <input
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="mt-2">
            <label className="block text-xs text-gray-500 mb-1">Reference</label>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="mt-2">
            <label className="block text-xs text-gray-500 mb-1">Notes</label>
            <input
              value={payNotes}
              onChange={(e) => setPayNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <button
            type="button"
            disabled={!props.canPay || !!props.loading || Number(amount || 0) <= 0}
            onClick={() =>
              props.onPay({
                amount: String(amount),
                paymentDate: payDateIso(),
                paymentMethod,
                reference: reference || undefined,
                notes: payNotes || undefined,
              })
            }
            className={`mt-3 w-full px-4 py-2 rounded-lg text-white ${
              !props.canPay || props.loading || Number(amount || 0) <= 0
                ? 'bg-gray-400'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            Record Payment
          </button>
        </div>
      </div>
    </div>
  );
}
