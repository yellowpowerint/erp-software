'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { ArrowLeft } from 'lucide-react';

function Inner() {
  const params = useParams();
  const id = String((params as any)?.id || '');

  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/fleet/maintenance/${id}`);
      setRecord(res.data);
    } catch (e) {
      console.error(e);
      setRecord(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) load();
  }, [id]);

  const complete = async () => {
    await api.post(`/fleet/maintenance/${id}/complete`, {});
    await load();
  };

  const cancel = async () => {
    await api.post(`/fleet/maintenance/${id}/cancel`, {});
    await load();
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link href="/fleet/maintenance" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Maintenance</span>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Maintenance Record</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {loading ? (
          <div className="text-sm text-gray-700">Loading...</div>
        ) : !record ? (
          <div className="text-sm text-gray-700">Not found.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Title</div>
                <div className="text-gray-900 font-medium">{record.title}</div>
              </div>
              <div>
                <div className="text-gray-500">Status</div>
                <div className="text-gray-900 font-medium">{record.status}</div>
              </div>
              <div>
                <div className="text-gray-500">Type</div>
                <div className="text-gray-900 font-medium">{record.type}</div>
              </div>
              <div>
                <div className="text-gray-500">Asset</div>
                <div className="text-gray-900 font-medium">
                  {record.asset?.assetCode}{record.asset?.name ? ` - ${record.asset.name}` : ''}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button onClick={complete} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                Mark Completed
              </button>
              <button onClick={cancel} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function Page() {
  return (
    <ProtectedRoute>
      <Inner />
    </ProtectedRoute>
  );
}
