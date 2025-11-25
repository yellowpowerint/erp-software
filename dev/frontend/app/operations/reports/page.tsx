'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { BarChart3, TrendingUp, Truck, Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface ProductionReport {
  totalLogs: number;
  totalProduction: number;
  byActivity: Array<{ activity: string; totalQuantity: number; count: number }>;
  byShift: Array<{ shift: string; totalQuantity: number; count: number }>;
  dailyProduction: Array<{ date: string; quantity: number; count: number }>;
}

interface EquipmentReport {
  totalEquipment: number;
  equipment: Array<{
    equipment: string;
    usageCount: number;
    totalProduction: number;
    lastUsed: string;
  }>;
}

interface ShiftPerformanceReport {
  totalShifts: number;
  byShiftType: Array<{
    shiftType: string;
    totalShifts: number;
    totalProduction: number;
    avgProduction: number;
  }>;
}

interface ProjectProgress {
  projectCode: string;
  name: string;
  status: string;
  progress: number;
  productionLogs: number;
  totalProduction: number;
  fieldReports: number;
  criticalReports: number;
  milestones: number;
  tasks: number;
}

function OperationsReportsContent() {
  const [productionReport, setProductionReport] = useState<ProductionReport | null>(null);
  const [equipmentReport, setEquipmentReport] = useState<EquipmentReport | null>(null);
  const [shiftReport, setShiftReport] = useState<ShiftPerformanceReport | null>(null);
  const [projectsReport, setProjectsReport] = useState<ProjectProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(30);

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRange);
      const endDate = new Date();

      const params = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      };

      const [production, equipment, shifts, projects] = await Promise.all([
        api.get('/operations/reports/production', { params }),
        api.get('/operations/reports/equipment-utilization', { params }),
        api.get('/operations/reports/shift-performance', { params }),
        api.get('/operations/reports/project-progress'),
      ]);

      setProductionReport(production.data);
      setEquipmentReport(equipment.data);
      setShiftReport(shifts.data);
      setProjectsReport(projects.data);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading reports...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link href="/operations" className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Operations</span>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Operations Reports</h1>
            <p className="text-gray-600 mt-1">Analytics and insights for production operations</p>
          </div>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
            <option value="60">Last 60 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Production Summary */}
      {productionReport && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Production</p>
                <p className="text-2xl font-bold text-indigo-600 mt-1">{productionReport.totalProduction.toFixed(1)}</p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-lg">
                <BarChart3 className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Logs</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{productionReport.totalLogs}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Per Day</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {(productionReport.totalProduction / dateRange).toFixed(1)}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Production by Activity */}
      {productionReport && productionReport.byActivity.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Production by Activity</h2>
          <div className="space-y-3">
            {productionReport.byActivity.map((activity) => {
              const percentage = (activity.totalQuantity / productionReport.totalProduction) * 100;
              return (
                <div key={activity.activity} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {activity.activity.toLowerCase()}
                    </span>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-gray-900">{activity.totalQuantity.toFixed(1)}</span>
                      <span className="text-xs text-gray-500 ml-2">({activity.count} logs)</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Equipment Utilization */}
      {equipmentReport && equipmentReport.equipment.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Equipment Utilization ({equipmentReport.totalEquipment} Units)
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage Count</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Production</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Used</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {equipmentReport.equipment.slice(0, 10).map((equip) => (
                  <tr key={equip.equipment} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{equip.equipment}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{equip.usageCount}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{equip.totalProduction.toFixed(1)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(equip.lastUsed).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Shift Performance */}
      {shiftReport && shiftReport.byShiftType.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Shift Performance ({shiftReport.totalShifts} Shifts)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {shiftReport.byShiftType.map((shift) => (
              <div key={shift.shiftType} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-semibold text-gray-900">{shift.shiftType}</h3>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Total Shifts: {shift.totalShifts}</p>
                  <p className="text-sm text-gray-600">Total Production: {shift.totalProduction.toFixed(1)}</p>
                  <p className="text-sm font-semibold text-gray-900">
                    Avg: {shift.avgProduction.toFixed(1)} per shift
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Project Progress */}
      {projectsReport.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Projects Progress</h2>
          <div className="space-y-4">
            {projectsReport.map((project) => (
              <div key={project.projectCode} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{project.name}</h3>
                    <p className="text-xs text-gray-600">{project.projectCode}</p>
                  </div>
                  <span className="text-sm font-semibold text-indigo-600">{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div
                    className="bg-indigo-600 h-2 rounded-full"
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Production:</span>
                    <p className="font-semibold text-gray-900">{project.totalProduction.toFixed(0)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Logs:</span>
                    <p className="font-semibold text-gray-900">{project.productionLogs}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Reports:</span>
                    <p className="font-semibold text-gray-900">{project.fieldReports}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Critical:</span>
                    <p className="font-semibold text-red-600">{project.criticalReports}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Milestones:</span>
                    <p className="font-semibold text-gray-900">{project.milestones}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Tasks:</span>
                    <p className="font-semibold text-gray-900">{project.tasks}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function OperationsReportsPage() {
  return (
    <ProtectedRoute>
      <OperationsReportsContent />
    </ProtectedRoute>
  );
}
