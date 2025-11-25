'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Users, Plus, ArrowLeft, Filter, Star, Phone, Mail, MapPin } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

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
}

function SuppliersPageContent() {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('true');

  useEffect(() => {
    fetchSuppliers();
  }, [statusFilter]);

  const fetchSuppliers = async () => {
    try {
      const params: any = {};
      if (statusFilter !== '') params.isActive = statusFilter;
      
      const response = await api.get('/finance/suppliers', { params });
      setSuppliers(response.data);
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating?: number) => {
    if (!rating) return <span className="text-xs text-gray-400">No rating</span>;
    
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-xs text-gray-600 ml-1">({rating}/5)</span>
      </div>
    );
  };

  const canCreate = user && ['SUPER_ADMIN', 'CFO', 'PROCUREMENT_OFFICER'].includes(user.role);

  // Calculate summary stats
  const activeCount = suppliers.filter(s => s.isActive).length;
  const inactiveCount = suppliers.filter(s => !s.isActive).length;
  const avgRating = suppliers.filter(s => s.rating).reduce((sum, s) => sum + (s.rating || 0), 0) / suppliers.filter(s => s.rating).length || 0;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading suppliers...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link href="/finance" className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Finance</span>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
            <p className="text-gray-600 mt-1">Manage supplier and vendor information</p>
          </div>
          {canCreate && (
            <Link
              href="/finance/suppliers/new"
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus className="w-5 h-5" />
              <span>New Supplier</span>
            </Link>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Suppliers</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{activeCount}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inactive Suppliers</p>
              <p className="text-2xl font-bold text-gray-600 mt-1">{inactiveCount}</p>
            </div>
            <div className="bg-gray-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Rating</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{avgRating.toFixed(1)}</p>
              <p className="text-xs text-gray-500 mt-1">Out of 5 stars</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Suppliers</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Suppliers Found</h3>
            <p className="text-gray-600">Add your first supplier to get started.</p>
          </div>
        ) : (
          suppliers.map((supplier) => (
            <div
              key={supplier.id}
              className={`bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow ${
                !supplier.isActive ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{supplier.name}</h3>
                    {!supplier.isActive && (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{supplier.supplierCode}</p>
                  {renderStars(supplier.rating)}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {supplier.contactPerson && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{supplier.contactPerson}</span>
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="truncate">{supplier.email}</span>
                  </div>
                )}
                {supplier.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{supplier.phone}</span>
                  </div>
                )}
                {(supplier.city || supplier.country) && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{supplier.city ? `${supplier.city}, ` : ''}{supplier.country}</span>
                  </div>
                )}
              </div>

              {supplier.category && (
                <div className="mb-3">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                    {supplier.category}
                  </span>
                </div>
              )}

              {supplier.paymentTerms && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">Payment Terms:</p>
                  <p className="text-sm text-gray-900">{supplier.paymentTerms}</p>
                </div>
              )}

              {supplier.notes && (
                <div className="pt-3 border-t border-gray-100 mt-3">
                  <p className="text-xs text-gray-500 mb-1">Notes:</p>
                  <p className="text-sm text-gray-600 line-clamp-2">{supplier.notes}</p>
                </div>
              )}

              <div className="pt-3 border-t border-gray-100 mt-3">
                <p className="text-xs text-gray-400">
                  Added {new Date(supplier.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}

export default function SuppliersPage() {
  return (
    <ProtectedRoute>
      <SuppliersPageContent />
    </ProtectedRoute>
  );
}
