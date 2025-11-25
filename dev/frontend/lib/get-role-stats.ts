import { UserRole } from '@/types/auth';
import { ClipboardCheck, Package, DollarSign, Users, TrendingUp, HardHat, Shield, FileText } from 'lucide-react';

interface StatCard {
  name: string;
  value: string;
  icon: any;
  color: string;
  change: string;
}

export function getRoleBasedStats(role: UserRole): StatCard[] {
  const baseStats: Record<string, StatCard[]> = {
    [UserRole.CEO]: [
      {
        name: 'Pending Approvals',
        value: '12',
        icon: ClipboardCheck,
        color: 'bg-blue-500',
        change: '+2 from yesterday',
      },
      {
        name: 'Monthly Production',
        value: '5,500 tons',
        icon: HardHat,
        color: 'bg-green-500',
        change: '+8% from last month',
      },
      {
        name: 'Total Expenses',
        value: '₵83,231',
        icon: DollarSign,
        color: 'bg-orange-500',
        change: '+12% from last month',
      },
      {
        name: 'Active Employees',
        value: '156',
        icon: Users,
        color: 'bg-purple-500',
        change: '2 new this week',
      },
    ],
    [UserRole.CFO]: [
      {
        name: 'Pending Approvals',
        value: '8',
        icon: ClipboardCheck,
        color: 'bg-blue-500',
        change: '4 invoices, 4 payments',
      },
      {
        name: 'Monthly Revenue',
        value: '₵125,450',
        icon: TrendingUp,
        color: 'bg-green-500',
        change: '+15% from last month',
      },
      {
        name: 'Total Expenses',
        value: '₵83,231',
        icon: DollarSign,
        color: 'bg-orange-500',
        change: '+12% from last month',
      },
      {
        name: 'Outstanding Invoices',
        value: '23',
        icon: FileText,
        color: 'bg-red-500',
        change: '₵45,000 total',
      },
    ],
    [UserRole.ACCOUNTANT]: [
      {
        name: 'Invoices to Process',
        value: '15',
        icon: FileText,
        color: 'bg-blue-500',
        change: '5 urgent',
      },
      {
        name: 'Payments Pending',
        value: '8',
        icon: DollarSign,
        color: 'bg-orange-500',
        change: '₵28,500 total',
      },
      {
        name: 'Monthly Processed',
        value: '156',
        icon: ClipboardCheck,
        color: 'bg-green-500',
        change: '+12 from last month',
      },
      {
        name: 'Outstanding',
        value: '₵45,000',
        icon: TrendingUp,
        color: 'bg-red-500',
        change: '23 invoices',
      },
    ],
    [UserRole.OPERATIONS_MANAGER]: [
      {
        name: 'Active Projects',
        value: '7',
        icon: HardHat,
        color: 'bg-purple-500',
        change: '2 behind schedule',
      },
      {
        name: 'Daily Production',
        value: '185 tons',
        icon: TrendingUp,
        color: 'bg-green-500',
        change: 'Target: 180 tons',
      },
      {
        name: 'Equipment Online',
        value: '24/28',
        icon: Package,
        color: 'bg-blue-500',
        change: '4 under maintenance',
      },
      {
        name: 'Active Shifts',
        value: '3',
        icon: Users,
        color: 'bg-orange-500',
        change: '52 workers today',
      },
    ],
    [UserRole.WAREHOUSE_MANAGER]: [
      {
        name: 'Low Stock Items',
        value: '8',
        icon: Package,
        color: 'bg-red-500',
        change: '3 critical',
      },
      {
        name: 'Total Items',
        value: '1,245',
        icon: Package,
        color: 'bg-blue-500',
        change: '+15 this week',
      },
      {
        name: 'Stock Value',
        value: '₵245,000',
        icon: DollarSign,
        color: 'bg-green-500',
        change: '+5% from last month',
      },
      {
        name: 'Pending Orders',
        value: '12',
        icon: ClipboardCheck,
        color: 'bg-orange-500',
        change: '₵18,500 total',
      },
    ],
    [UserRole.SAFETY_OFFICER]: [
      {
        name: 'Open Incidents',
        value: '3',
        icon: Shield,
        color: 'bg-red-500',
        change: '1 critical',
      },
      {
        name: 'Days Without Incident',
        value: '12',
        icon: Shield,
        color: 'bg-green-500',
        change: 'Goal: 30 days',
      },
      {
        name: 'Inspections Due',
        value: '5',
        icon: ClipboardCheck,
        color: 'bg-orange-500',
        change: '2 overdue',
      },
      {
        name: 'Training Pending',
        value: '18',
        icon: Users,
        color: 'bg-blue-500',
        change: '4 employees',
      },
    ],
    [UserRole.PROCUREMENT_OFFICER]: [
      {
        name: 'Purchase Requests',
        value: '9',
        icon: ClipboardCheck,
        color: 'bg-blue-500',
        change: '4 pending approval',
      },
      {
        name: 'Active Orders',
        value: '15',
        icon: Package,
        color: 'bg-orange-500',
        change: '₵65,000 total',
      },
      {
        name: 'Suppliers',
        value: '42',
        icon: Users,
        color: 'bg-purple-500',
        change: '3 new this month',
      },
      {
        name: 'Monthly Spend',
        value: '₵125,000',
        icon: DollarSign,
        color: 'bg-green-500',
        change: '+8% from last month',
      },
    ],
  };

  // Default stats for roles not specifically defined
  const defaultStats: StatCard[] = [
    {
      name: 'My Tasks',
      value: '5',
      icon: ClipboardCheck,
      color: 'bg-blue-500',
      change: '2 due today',
    },
    {
      name: 'Notifications',
      value: '8',
      icon: Package,
      color: 'bg-orange-500',
      change: '3 unread',
    },
    {
      name: 'Team Members',
      value: '12',
      icon: Users,
      color: 'bg-purple-500',
      change: 'In your department',
    },
    {
      name: 'This Month',
      value: '₵12,450',
      icon: DollarSign,
      color: 'bg-green-500',
      change: 'Your department',
    },
  ];

  return baseStats[role] || defaultStats;
}
