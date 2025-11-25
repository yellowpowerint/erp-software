'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ArrowLeft, Star, Phone, Mail, MapPin, CreditCard, Calendar, User, FileText } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface Payment {
  id: string;
  paymentNumber: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentDate: string;
  status: string;
  description: string;
}

interface Supplier {
  id: string;
  supplierCode: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country: string;
  taxId?: string;
  bankAccount?: string;
  paymentTerms?: string;
  category?: string;
  rating?: number;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  payments: Payment[];
}

function SupplierDetailContent() {
  const params = useParams();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSupplier();
  }, []);

  const fetchSupplier = async () => {
    try {
      const response = await api.get(`/finance/suppliers/${params.id}`);
      setSupplier(response.data);
    } catch (error) {
      console.error('Failed to fetch supplier:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating?: number) => {
    if (!rating) return <span className="text-sm text-gray-400">No rating</span>;
    
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-2">({rating}/5)</span>
      </div>
    );
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      PROCESSING: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading supplier details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!supplier) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Supplier not found</p>
        </div>
      </DashboardLayout>
    );
  }

  const totalPayments = supplier.payments.reduce((sum, p) => p.status === 'COMPLETED' ? sum + p.amount : sum, 0);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link
          href="/finance/suppliers"
          className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Suppliers</span>
        </Link>
      </div>

      {/* Supplier Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{supplier.name}</h1>
              {!supplier.isActive && (
                <span className="px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800">
                  Inactive
                </span>
              )}
              {supplier.category && (
                <span className="px-3 py-1 text-sm font-semibold rounded-full bg-indigo-100 text-indigo-800">
                  {supplier.category}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mb-3">{supplier.supplierCode}</p>
            {renderStars(supplier.rating)}
          </div>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {supplier.contactPerson && (
            <div className="flex items-start space-x-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Contact Person</p>
                <p className="text-sm font-medium text-gray-900">{supplier.contactPerson}</p>
              </div>
            </div>
          )}

          {supplier.email && (
            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <a href={`mailto:${supplier.email}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                  {supplier.email}
                </a>
              </div>
            </div>
          )}

          {supplier.phone && (
            <div className="flex items-start space-x-3">
              <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <a href={`tel:${supplier.phone}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                  {supplier.phone}
                </a>
              </div>
            </div>
          )}

          {(supplier.address || supplier.city || supplier.country) && (
            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Location</p>
                <p className="text-sm font-medium text-gray-900">
                  {supplier.address && <span>{supplier.address}<br /></span>}
                  {supplier.city && <span>{supplier.city}, </span>}
                  {supplier.country}
                </p>
              </div>
            </div>
          )}

          {supplier.taxId && (
            <div className="flex items-start space-x-3">
              <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Tax ID</p>
                <p className="text-sm font-medium text-gray-900">{supplier.taxId}</p>
              </div>
            </div>
          )}

          {supplier.bankAccount && (
            <div className="flex items-start space-x-3">
              <CreditCard className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Bank Account</p>
                <p className="text-sm font-medium text-gray-900">{supplier.bankAccount}</p>
              </div>
            </div>
          )}

          {supplier.paymentTerms && (
            <div className="flex items-start space-x-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Payment Terms</p>
                <p className="text-sm font-medium text-gray-900">{supplier.paymentTerms}</p>
              </div>
            </div>
          )}
        </div>

        {supplier.notes && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-2">Notes</p>
            <p className="text-sm text-gray-900">{supplier.notes}</p>
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
            <p className="text-sm text-gray-600 mt-1">
              {supplier.payments.length} payment{supplier.payments.length !== 1 ? 's' : ''} • Total: GHS {totalPayments.toLocaleString()}
            </p>
          </div>
        </div>

        {supplier.payments.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No payment history</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {supplier.payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                      {payment.paymentNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(payment.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {payment.currency} {payment.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                      {payment.paymentMethod.replace('_', ' ').toLowerCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {payment.description}
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

export default function SupplierDetailPage() {
  return (
    <ProtectedRoute>
      <SupplierDetailContent />
    </ProtectedRoute>
  );
}
