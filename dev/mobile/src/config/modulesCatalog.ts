import React from 'react';
import { Ionicons } from '@expo/vector-icons';

import type { MobileResource } from '../access/rbac';
import type { AppTabsParamList } from '../navigation/AppTabs';

export type ModuleCatalogItem = {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  resource: MobileResource;
  enabled: boolean;
  target?: {
    tab: keyof AppTabsParamList;
    screen?: string;
    params?: any;
  };
};

export const MODULE_CATALOG: ModuleCatalogItem[] = [
  { id: 'dashboard', name: 'Dashboard', description: 'Overview and KPIs', icon: 'speedometer', resource: 'TAB_HOME', enabled: true, target: { tab: 'Home', screen: 'Home' } },
  { id: 'approvals', name: 'Approvals & Workflows', description: 'Review and approve requests', icon: 'checkbox', resource: 'MODULE_APPROVALS', enabled: true, target: { tab: 'Work', screen: 'ApprovalsList' } },
  { id: 'inventory', name: 'Inventory', description: 'Manage stock and items', icon: 'cube', resource: 'MODULE_INVENTORY', enabled: true, target: { tab: 'Home', screen: 'InventoryItems' } },
  { id: 'projects', name: 'Projects', description: 'Track project progress', icon: 'construct', resource: 'MODULE_PROJECTS', enabled: true, target: { tab: 'Home', screen: 'Projects' } },
  { id: 'assets', name: 'Assets', description: 'Asset management', icon: 'business', resource: 'MODULE_ASSETS', enabled: true, target: { tab: 'Home', screen: 'Assets' } },
  { id: 'expenses', name: 'Expenses', description: 'View expenses', icon: 'card', resource: 'MODULE_EXPENSES', enabled: true, target: { tab: 'Home', screen: 'Expenses' } },
  { id: 'employees', name: 'Employees', description: 'Staff directory', icon: 'people', resource: 'MODULE_EMPLOYEES', enabled: true, target: { tab: 'Home', screen: 'Employees' } },
  { id: 'fleet', name: 'Fleet Management', description: 'Vehicles, fuel, and maintenance', icon: 'car', resource: 'MODULE_FLEET', enabled: false },
  { id: 'operations', name: 'Operations', description: 'Operations planning and tracking', icon: 'analytics', resource: 'MODULE_OPERATIONS', enabled: false },
  { id: 'finance', name: 'Finance', description: 'Financial management', icon: 'cash', resource: 'MODULE_FINANCE', enabled: false },
  { id: 'procurement', name: 'Procurement', description: 'Purchase orders and vendors', icon: 'cart', resource: 'MODULE_PROCUREMENT', enabled: true, target: { tab: 'Modules', screen: 'PurchaseOrders' } },
  { id: 'hr', name: 'HR & Personnel', description: 'Human resources management', icon: 'person-add', resource: 'MODULE_HR', enabled: false },
  { id: 'safety', name: 'Safety & Compliance', description: 'Safety inspections and trainings', icon: 'shield-checkmark', resource: 'MODULE_SAFETY', enabled: true, target: { tab: 'Home', screen: 'SafetyInspections' } },
  { id: 'reports', name: 'Reports & Analytics', description: 'Business intelligence and reports', icon: 'bar-chart', resource: 'MODULE_REPORTS', enabled: false },
  { id: 'ai', name: 'AI Intelligence', description: 'AI-powered insights', icon: 'sparkles', resource: 'MODULE_AI', enabled: false },
  { id: 'documents', name: 'Documents & Files', description: 'Document management', icon: 'document-text', resource: 'MODULE_DOCUMENTS', enabled: true, target: { tab: 'More', screen: 'Documents' } },
  { id: 'settings', name: 'Settings', description: 'System configuration', icon: 'settings', resource: 'MODULE_SETTINGS', enabled: false },
];
