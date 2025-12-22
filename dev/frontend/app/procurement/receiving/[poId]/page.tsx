'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { ArrowLeft } from 'lucide-react';
import ReceivingForm, { CreateGoodsReceiptPayload, ReceivingPoItem } from '@/components/procurement/ReceivingForm';

interface PurchaseOrderDetail {
  id: string;
  poNumber: string;
  status: string;
  deliverySite?: string | null;
  expectedDelivery: string;
  vendor: {
    id: string;
    vendorCode: string;
    companyName: string;
  };
  items: Array<{
    id: string;
    itemName: string;
    unit: string;
    quantity: string;
    receivedQty: string;
  }>;
}

function ReceiveGoodsContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const poId = String((params as any).poId);

  const [po, setPo] = useState<PurchaseOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const canAccess =
    user &&
    ['SUPER_ADMIN', 'CEO', 'CFO', 'PROCUREMENT_OFFICER', 'OPERATIONS_MANAGER', 'WAREHOUSE_MANAGER'].includes(user.role);

  const fetchPO = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/procurement/purchase-orders/${poId}`);
      setPo(res.data);
    } catch (e) {
      console.error('Failed to load PO for receiving:', e);
      alert('Purchase order not found');
      router.push('/procurement/receiving');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canAccess) return;
    fetchPO();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poId, canAccess]);

  const submit = async (payload: CreateGoodsReceiptPayload) => {
    setSubmitting(true);
    try {
      const res = await api.post('/procurement/goods-receipts', payload);
      const grnId = res.data?.id;
      alert('GRN created successfully');
      if (grnId) {
        router.push(`/procurement/goods-receipts/${grnId}`);
      } else {
        router.push('/procurement/goods-receipts');
      }
    } catch (error: any) {
      console.error('Failed to create GRN:', error);
      alert(error.response?.data?.message || 'Failed to create GRN');
    } finally {
      setSubmitting(false);
    }
  };

  if (!canAccess) {
    return (
      <DashboardLayout>
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-700">You do not have access to Receive Goods.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (loading || !po) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading purchase order...</p>
        </div>
      </DashboardLayout>
    );
  }

  const items: ReceivingPoItem[] = po.items.map((i) => ({
    id: i.id,
    itemName: i.itemName,
    unit: i.unit,
    quantity: i.quantity,
    receivedQty: i.receivedQty,
  }));

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/procurement/receiving"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Receive Goods</h1>
            <p className="text-gray-600 mt-1">
              PO: {po.poNumber} | Vendor: {po.vendor.companyName} ({po.vendor.vendorCode})
            </p>
          </div>
        </div>
      </div>

      <ReceivingForm purchaseOrderId={po.id} items={items} onSubmit={submit} submitting={submitting} />
    </DashboardLayout>
  );
}

export default function ReceiveGoodsPage() {
  return (
    <ProtectedRoute>
      <ReceiveGoodsContent />
    </ProtectedRoute>
  );
}
