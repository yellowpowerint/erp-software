import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ErrorBanner } from '../components/ErrorBanner';
import { QuickActionsSheet, type QuickAction } from '../components/QuickActionsSheet';
import { parseApiError } from '../api/errors';
import { http } from '../api/http';
import { API_BASE_URL } from '../config';
import { useAuth } from '../auth/AuthContext';
import type { HomeStackParamList } from '../navigation/HomeStack';

type DashboardResponse = {
  inventory: { total: number; lowStock: number };
  assets: { total: number; active: number };
  projects: { total: number; active: number };
  finance: { totalBudgets: number; totalExpenses: number };
  hr: { total: number; active: number };
  safety: { pendingInspections: number; upcomingTrainings: number };
};

type WidgetKey =
  | 'inventory'
  | 'assets'
  | 'projects'
  | 'expenses'
  | 'employees'
  | 'inspections'
  | 'trainings';

type Widget = {
  key: WidgetKey;
  title: string;
  value: string;
  subtitle: string;
  route: Exclude<keyof HomeStackParamList, 'InventoryItemDetail' | 'ReceiveStock'>;
};

export function HomeScreen() {
  const { me, signOut } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await http.get<DashboardResponse>('/reports/dashboard');
      setDashboard(res.data);
    } catch (e: any) {
      const parsed = parseApiError(e, API_BASE_URL);
      const statusPart = parsed.status ? ` (${parsed.status})` : '';
      setError(`Failed to load dashboard${statusPart}: ${parsed.message}\nAPI: ${API_BASE_URL}`);
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await loadDashboard();
    })();
  }, [loadDashboard]);

  const widgets = useMemo<Widget[]>(() => {
    if (!dashboard) return [];

    const base: Widget[] = [
      {
        key: 'inventory',
        title: 'Inventory',
        value: String(dashboard.inventory.total ?? 0),
        subtitle: `${dashboard.inventory.lowStock ?? 0} low stock`,
        route: 'InventoryItems',
      },
      {
        key: 'projects',
        title: 'Projects',
        value: String(dashboard.projects.active ?? 0),
        subtitle: `${dashboard.projects.total ?? 0} total`,
        route: 'Projects',
      },
      {
        key: 'assets',
        title: 'Assets',
        value: String(dashboard.assets.active ?? 0),
        subtitle: `${dashboard.assets.total ?? 0} total`,
        route: 'Assets',
      },
      {
        key: 'expenses',
        title: 'Expenses',
        value: String(dashboard.finance.totalExpenses ?? 0),
        subtitle: `${dashboard.finance.totalBudgets ?? 0} budgets`,
        route: 'Expenses',
      },
      {
        key: 'employees',
        title: 'Employees',
        value: String(dashboard.hr.active ?? 0),
        subtitle: `${dashboard.hr.total ?? 0} total`,
        route: 'Employees',
      },
      {
        key: 'inspections',
        title: 'Inspections',
        value: String(dashboard.safety.pendingInspections ?? 0),
        subtitle: 'pending',
        route: 'SafetyInspections',
      },
      {
        key: 'trainings',
        title: 'Trainings',
        value: String(dashboard.safety.upcomingTrainings ?? 0),
        subtitle: 'upcoming',
        route: 'SafetyTrainings',
      },
    ];

    const role = me?.role;
    if (!role) return base;

    const roleToKeys: Record<string, WidgetKey[]> = {
      SUPER_ADMIN: ['inventory', 'projects', 'assets', 'expenses', 'employees', 'inspections', 'trainings'],
      CEO: ['projects', 'assets', 'inventory', 'expenses', 'employees', 'inspections', 'trainings'],
      CFO: ['expenses', 'projects', 'assets'],
      ACCOUNTANT: ['expenses', 'projects'],
      PROCUREMENT_OFFICER: ['inventory', 'projects'],
      OPERATIONS_MANAGER: ['projects', 'assets', 'inventory'],
      HR_MANAGER: ['employees'],
      SAFETY_OFFICER: ['inspections', 'trainings'],
      WAREHOUSE_MANAGER: ['inventory', 'assets'],
      EMPLOYEE: ['projects', 'inventory'],
      IT_MANAGER: ['projects', 'assets'],
      DEPARTMENT_HEAD: ['projects', 'expenses', 'inventory'],
    };

    const allowed = roleToKeys[role] ?? base.map((w) => w.key);
    return base.filter((w) => allowed.includes(w.key));
  }, [dashboard, me?.role]);

  const quickActions = useMemo<QuickAction[]>(() => {
    const actions: QuickAction[] = widgets.map((w) => ({
      key: w.key,
      title: `Open ${w.title}`,
      subtitle: w.subtitle,
      onPress: () => navigation.navigate(w.route),
    }));

    if (
      me?.role &&
      [
        'SUPER_ADMIN',
        'SAFETY_OFFICER',
        'OPERATIONS_MANAGER',
        'DEPARTMENT_HEAD',
        'EMPLOYEE',
      ].includes(me.role)
    ) {
      actions.push({
        key: 'incident_capture',
        title: 'Report incident',
        subtitle: 'Offline-first capture',
        onPress: () => navigation.navigate('IncidentCapture'),
      });
    }

    actions.push({
      key: 'logout',
      title: 'Logout',
      subtitle: me?.email,
      onPress: signOut,
    });

    return actions;
  }, [widgets, navigation, signOut, me?.email, me?.role]);

  return (
    <>
      <QuickActionsSheet
        visible={isActionsOpen}
        onClose={() => setIsActionsOpen(false)}
        actions={quickActions}
      />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.h1}>Hello{me?.firstName ? `, ${me.firstName}` : ''}</Text>
            <Text style={styles.meta}>{me?.role ?? 'Unknown'} • {me?.email ?? ''}</Text>
          </View>

          <Pressable
            onPress={() => setIsActionsOpen(true)}
            style={({ pressed }) => [styles.quickButton, pressed ? styles.quickButtonPressed : null]}
            accessibilityRole="button"
          >
            <Text style={styles.quickButtonText}>Quick Actions</Text>
          </Pressable>
        </View>

        {error ? <ErrorBanner message={error} onRetry={loadDashboard} /> : null}

        {loading && !dashboard ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>Loading dashboard…</Text>
          </View>
        ) : null}

        <View style={styles.grid}>
          {widgets.map((w) => (
            <Pressable
              key={w.key}
              onPress={() => navigation.navigate(w.route)}
              style={({ pressed }) => [styles.widgetCard, pressed ? styles.widgetCardPressed : null]}
              accessibilityRole="button"
            >
              <Text style={styles.widgetTitle}>{w.title}</Text>
              <Text style={styles.widgetValue}>{w.value}</Text>
              <Text style={styles.widgetSub}>{w.subtitle}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.footerRow}>
          <Pressable
            onPress={loadDashboard}
            style={({ pressed }) => [styles.secondaryButton, pressed ? styles.secondaryButtonPressed : null]}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryButtonText}>Refresh</Text>
          </Pressable>
          <Pressable
            onPress={signOut}
            style={({ pressed }) => [styles.dangerButton, pressed ? styles.dangerButtonPressed : null]}
            accessibilityRole="button"
          >
            <Text style={styles.dangerButtonText}>Logout</Text>
          </Pressable>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
    backgroundColor: '#ffffff',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  h1: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  meta: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  quickButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#111827',
  },
  quickButtonPressed: {
    opacity: 0.85,
  },
  quickButtonText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 12,
  },
  loadingBlock: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#6b7280',
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  widgetCard: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 12,
    backgroundColor: '#f9fafb',
    gap: 6,
  },
  widgetCardPressed: {
    opacity: 0.85,
  },
  widgetTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
  },
  widgetValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
  },
  widgetSub: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
  },
  footerRow: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonPressed: {
    opacity: 0.85,
  },
  secondaryButtonText: {
    color: '#111827',
    fontWeight: '900',
    fontSize: 14,
  },
  dangerButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#7f1d1d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButtonPressed: {
    opacity: 0.85,
  },
  dangerButtonText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 14,
  },
});
