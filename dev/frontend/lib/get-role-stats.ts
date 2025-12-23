import { UserRole } from '@/types/auth';
import { ClipboardCheck, Package, DollarSign, Users, TrendingUp, HardHat, Shield, FileText } from 'lucide-react';

interface StatCard {
  name: string;
  value: string;
  icon: any;
  color: string;
  change: string;
  key?: string;
}

export function getRoleBasedStats(role: UserRole): StatCard[] {
  const baseStats: Record<string, StatCard[]> = {
    [UserRole.CEO]: [
      {
        name: 'Pending Approvals',
        value: '--',
        icon: ClipboardCheck,
        color: 'bg-blue-500',
        change: 'Across the system',
        key: 'pendingApprovals',
      },
      {
        name: 'Monthly Production',
        value: '--',
        icon: HardHat,
        color: 'bg-green-500',
        change: 'Month-to-date',
        key: 'mtdProduction',
      },
      {
        name: 'MTD Expenses',
        value: '--',
        icon: DollarSign,
        color: 'bg-orange-500',
        change: 'Month-to-date',
        key: 'mtdExpenses',
      },
      {
        name: 'Active Employees',
        value: '--',
        icon: Users,
        color: 'bg-purple-500',
        change: 'Currently active',
        key: 'activeEmployees',
      },
    ],
    [UserRole.CFO]: [
      {
        name: 'Pending Invoices',
        value: '--',
        icon: FileText,
        color: 'bg-blue-500',
        change: 'Awaiting approval',
        key: 'pendingInvoices',
      },
      {
        name: 'Pending Payments',
        value: '--',
        icon: DollarSign,
        color: 'bg-orange-500',
        change: 'Awaiting processing',
        key: 'pendingPayments',
      },
      {
        name: 'MTD Expenses',
        value: '--',
        icon: TrendingUp,
        color: 'bg-green-500',
        change: 'Month-to-date',
        key: 'mtdExpenses',
      },
      {
        name: 'Pending Approvals',
        value: '--',
        icon: ClipboardCheck,
        color: 'bg-red-500',
        change: 'Across the system',
        key: 'pendingApprovals',
      },
    ],
    [UserRole.ACCOUNTANT]: [
      {
        name: 'Pending Invoices',
        value: '--',
        icon: FileText,
        color: 'bg-blue-500',
        change: 'Awaiting approval',
        key: 'pendingInvoices',
      },
      {
        name: 'Payments Pending',
        value: '--',
        icon: DollarSign,
        color: 'bg-orange-500',
        change: 'Awaiting processing',
        key: 'pendingPayments',
      },
      {
        name: 'Pending Expenses',
        value: '--',
        icon: ClipboardCheck,
        color: 'bg-green-500',
        change: 'Awaiting approval',
        key: 'pendingExpenses',
      },
      {
        name: 'Pending Approvals',
        value: '--',
        icon: ClipboardCheck,
        color: 'bg-red-500',
        change: 'Across the system',
        key: 'pendingApprovals',
      },
    ],
    [UserRole.OPERATIONS_MANAGER]: [
      {
        name: 'Active Projects',
        value: '--',
        icon: HardHat,
        color: 'bg-purple-500',
        change: 'In progress',
        key: 'activeProjects',
      },
      {
        name: 'Monthly Production',
        value: '--',
        icon: TrendingUp,
        color: 'bg-green-500',
        change: 'Month-to-date',
        key: 'mtdProduction',
      },
      {
        name: 'Open Incidents',
        value: '--',
        icon: Shield,
        color: 'bg-blue-500',
        change: 'Requires attention',
        key: 'openIncidents',
      },
      {
        name: 'Pending Approvals',
        value: '--',
        icon: Users,
        color: 'bg-orange-500',
        change: 'Across the system',
        key: 'pendingApprovals',
      },
    ],
    [UserRole.WAREHOUSE_MANAGER]: [
      {
        name: 'Low Stock Items',
        value: '--',
        icon: Package,
        color: 'bg-red-500',
        change: 'Below threshold',
        key: 'lowStockItems',
      },
      {
        name: 'Total Items',
        value: '--',
        icon: Package,
        color: 'bg-blue-500',
        change: 'All stock items',
        key: 'totalStockItems',
      },
      {
        name: 'Out of Stock',
        value: '--',
        icon: DollarSign,
        color: 'bg-green-500',
        change: 'Requires reorder',
        key: 'outOfStockItems',
      },
      {
        name: 'Pending Requisitions',
        value: '--',
        icon: ClipboardCheck,
        color: 'bg-orange-500',
        change: 'Awaiting approval',
        key: 'pendingRequisitions',
      },
    ],
    [UserRole.SAFETY_OFFICER]: [
      {
        name: 'Open Incidents',
        value: '--',
        icon: Shield,
        color: 'bg-red-500',
        change: 'Requires attention',
        key: 'openIncidents',
      },
      {
        name: 'Pending Approvals',
        value: '--',
        icon: ClipboardCheck,
        color: 'bg-green-500',
        change: 'Across the system',
        key: 'pendingApprovals',
      },
      {
        name: 'Active Projects',
        value: '--',
        icon: HardHat,
        color: 'bg-orange-500',
        change: 'In progress',
        key: 'activeProjects',
      },
      {
        name: 'Low Stock Items',
        value: '--',
        icon: Package,
        color: 'bg-blue-500',
        change: 'Below threshold',
        key: 'lowStockItems',
      },
    ],
    [UserRole.PROCUREMENT_OFFICER]: [
      {
        name: 'Pending Purchase Requests',
        value: '--',
        icon: ClipboardCheck,
        color: 'bg-blue-500',
        change: 'Awaiting approval',
        key: 'pendingPurchaseRequests',
      },
      {
        name: 'Pending Requisitions',
        value: '--',
        icon: FileText,
        color: 'bg-orange-500',
        change: 'Awaiting approval',
        key: 'pendingRequisitions',
      },
      {
        name: 'Pending Invoices',
        value: '--',
        icon: FileText,
        color: 'bg-purple-500',
        change: 'Awaiting approval',
        key: 'pendingInvoices',
      },
      {
        name: 'Pending Approvals',
        value: '--',
        icon: DollarSign,
        color: 'bg-green-500',
        change: 'Across the system',
        key: 'pendingApprovals',
      },
    ],
  };

  // Default stats for roles not specifically defined
  const defaultStats: StatCard[] = [
    {
      name: 'Pending Approvals',
      value: '--',
      icon: ClipboardCheck,
      color: 'bg-blue-500',
      change: 'Across the system',
      key: 'pendingApprovals',
    },
    {
      name: 'Active Projects',
      value: '--',
      icon: Package,
      color: 'bg-orange-500',
      change: 'In progress',
      key: 'activeProjects',
    },
    {
      name: 'Open Incidents',
      value: '--',
      icon: Users,
      color: 'bg-purple-500',
      change: 'Requires attention',
      key: 'openIncidents',
    },
    {
      name: 'Low Stock Items',
      value: '--',
      icon: DollarSign,
      color: 'bg-green-500',
      change: 'Below threshold',
      key: 'lowStockItems',
    },
  ];

  return baseStats[role] || defaultStats;
}
