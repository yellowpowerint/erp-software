'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { ArrowLeft } from 'lucide-react';
import DiscrepancyAlert from '@/components/procurement/DiscrepancyAlert';
import InvoiceApprovalPanel from '@/components/procurement/InvoiceApprovalPanel';
import PaymentSchedule from '@/components/procurement/PaymentSchedule';
import ThreeWayMatchView from '@/components/procurement/ThreeWayMatchView';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  totalPrice: string;
  poItemId?: string | null;
}

interface InvoicePayment {
  id: string;
  amount: string;
  paymentDate: string;
  paymentMethod: string;
  reference?: string | null;
  notes?: string | null;
  processedBy?: {
    firstName: string;
    lastName: string;
    role: string;
  } | null;
}

interface ProcurementInvoiceDetail {
  id: string;
  invoiceNumber: string;
  vendorId: string;
  vendor: {
    id: string;
    vendorCode: string;
    companyName: string;
    email?: string | null;
    phone?: string | null;
  };
  purchaseOrderId?: string | null;
  purchaseOrder?: {
    id: string;
    poNumber: string;
    totalAmount: string;
    currency: string;
    items: Array<{
      id: string;
      itemName: string;
      quantity: string;
      unitPrice: string;
      receivedQty: string;
    }>;
  } | null;

  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  currency: string;

  invoiceDate: string;
  dueDate: string;

  matchStatus: string;
  matchedAt?: string | null;
  priceVariance?: string | null;
  quantityVariance?: string | null;
  discrepancyNotes?: string | null;

  approvedForPayment: boolean;
  approvedAt?: string | null;

  paymentStatus: string;
  paidAmount: string;
  paidAt?: string | null;

  items: InvoiceItem[];
  payments: InvoicePayment[];

  createdAt: string;
  updatedAt: string;
}

function ProcurementInvoiceDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const invoiceId = String((params as any).id);

  const [inv, setInv] = useState<ProcurementInvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const isVendor = user?.role === 'VENDOR';

  const canMatch =
    user && ['SUPER_ADMIN', 'CEO', 'CFO', 'ACCOUNTANT', 'PROCUREMENT_OFFICER'].includes(user.role);
  const canApprove = user && ['SUPER_ADMIN', 'CEO', 'CFO', 'ACCOUNTANT'].includes(user.role);
  const canDispute =
    user && ['SUPER_ADMIN', 'CEO', 'CFO', 'ACCOUNTANT', 'PROCUREMENT_OFFICER'].includes(user.role);
  const canPay = user && ['SUPER_ADMIN', 'CEO', 'CFO', 'ACCOUNTANT'].includes(user.role);

  const fetchInvoice = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/procurement/invoices/${invoiceId}`);
      setInv(res.data);
    } catch (e) {
      console.error('Failed to fetch invoice:', e);
      alert('Invoice not found');
      router.push('/procurement/invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  const totals = useMemo(() => {
    if (!inv) return { subtotal: 0, tax: 0, total: 0, paid: 0, remaining: 0 };
    const subtotal = Number(inv.subtotal || 0);
    const tax = Number(inv.taxAmount || 0);
    const total = Number(inv.totalAmount || 0);
    const paid = Number(inv.paidAmount || 0);
    const remaining = Math.max(0, total - paid);
    return { subtotal, tax, total, paid, remaining };
  }, [inv]);

  const runMatch = async (tolerancePercent?: number) => {
    if (!inv) return;
    setActionLoading(true);
    try {
      await api.post(`/procurement/invoices/${inv.id}/match`, {
        tolerancePercent: tolerancePercent ?? 2,
      });
      await fetchInvoice();
      alert('Matching completed');
    } catch (error: any) {
      console.error('Failed to match invoice:', error);
      alert(error.response?.data?.message || 'Failed to match invoice');
    } finally {
      setActionLoading(false);
    }
  };

  const approve = async () => {
    if (!inv) return;
    if (!window.confirm('Approve this invoice for payment?')) return;
    setActionLoading(true);
    try {
      await api.post(`/procurement/invoices/${inv.id}/approve`, {});
      await fetchInvoice();
      alert('Invoice approved for payment');
    } catch (error: any) {
      console.error('Failed to approve invoice:', error);
      alert(error.response?.data?.message || 'Failed to approve invoice');
    } finally {
      setActionLoading(false);
    }
  };

  const dispute = async (notes: string) => {
    if (!inv) return;
    setActionLoading(true);
    try {
      await api.post(`/procurement/invoices/${inv.id}/dispute`, { notes });
      await fetchInvoice();
      alert('Invoice disputed');
    } catch (error: any) {
      console.error('Failed to dispute invoice:', error);
      alert(error.response?.data?.message || 'Failed to dispute invoice');
    } finally {
      setActionLoading(false);
    }
  };

  const pay = async (payload: {
    amount: string;
    paymentDate: string;
    paymentMethod: string;
    reference?: string;
    notes?: string;
  }) => {
    if (!inv) return;
    setActionLoading(true);
    try {
      await api.post(`/procurement/invoices/${inv.id}/pay`, payload);
      await fetchInvoice();
      alert('Payment recorded');
    } catch (error: any) {
      console.error('Failed to record payment:', error);
      alert(error.response?.data?.message || 'Failed to record payment');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !inv) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading invoice...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/procurement/invoices"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invoice {inv.invoiceNumber}</h1>
            <p className="text-gray-600 mt-1">
              Vendor: {inv.vendor.companyName} ({inv.vendor.vendorCode})
              {inv.purchaseOrder?.poNumber ? ` | PO: ${inv.purchaseOrder.poNumber}` : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-gray-500">Invoice Date</div>
              <div className="text-sm font-medium text-gray-900">{new Date(inv.invoiceDate).toLocaleDateString()}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Due Date</div>
              <div className="text-sm font-medium text-gray-900">{new Date(inv.dueDate).toLocaleDateString()}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Total</div>
              <div className="text-sm font-semibold text-gray-900">
                {inv.currency} {totals.total.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Paid</div>
              <div className="text-sm font-semibold text-gray-900">
                {inv.currency} {totals.paid.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Remaining</div>
              <div className="text-sm font-semibold text-gray-900">
                {inv.currency} {totals.remaining.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Payment Status</div>
              <div className="text-sm font-medium text-gray-900">{inv.paymentStatus}</div>
            </div>
          </div>
        </div>

        <PaymentSchedule
          dueDate={inv.dueDate}
          paymentStatus={inv.paymentStatus}
          currency={inv.currency}
          totalAmount={inv.totalAmount}
          paidAmount={inv.paidAmount}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <DiscrepancyAlert
          matchStatus={inv.matchStatus}
          priceVariance={inv.priceVariance}
          quantityVariance={inv.quantityVariance}
          notes={inv.discrepancyNotes}
        />
        <ThreeWayMatchView
          poNumber={inv.purchaseOrder?.poNumber || null}
          grnCount={null}
          invoiceNumber={inv.invoiceNumber}
          notes={inv.discrepancyNotes || null}
        />
      </div>

      {!isVendor ? (
        <div className="mb-6">
          <InvoiceApprovalPanel
            canMatch={!!canMatch}
            canApprove={!!canApprove}
            canDispute={!!canDispute}
            canPay={!!canPay}
            onMatch={runMatch}
            onApprove={approve}
            onDispute={dispute}
            onPay={pay}
            loading={actionLoading}
          />
        </div>
      ) : null}

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Lines</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Line Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inv.items.map((it) => (
                <tr key={it.id}>
                  <td className="px-6 py-4 text-sm text-gray-900">{it.description}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">{Number(it.quantity || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">{Number(it.unitPrice || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">{Number(it.totalPrice || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-end">
          <div className="text-right">
            <div className="text-sm text-gray-600">Subtotal: {inv.currency} {totals.subtotal.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Tax: {inv.currency} {totals.tax.toFixed(2)}</div>
            <div className="text-lg font-semibold text-gray-900">Total: {inv.currency} {totals.total.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Payments</h2>
        {inv.payments.length === 0 ? (
          <p className="text-sm text-gray-600">No payments recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Processed By</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inv.payments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">{new Date(p.paymentDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{p.paymentMethod}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{p.reference || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {p.processedBy ? `${p.processedBy.firstName} ${p.processedBy.lastName}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">
                      {inv.currency} {Number(p.amount || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function ProcurementInvoiceDetailPage() {
  return (
    <ProtectedRoute>
      <ProcurementInvoiceDetailContent />
    </ProtectedRoute>
  );
}
