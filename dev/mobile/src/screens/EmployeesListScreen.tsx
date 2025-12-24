import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { ErrorBanner } from '../components/ErrorBanner';
import { parseApiError } from '../api/errors';
import { http } from '../api/http';
import { API_BASE_URL } from '../config';

type Employee = {
  id: string;
  employeeId?: string;
  firstName?: string;
  lastName?: string;
  department?: string;
  status?: string;
};

export function EmployeesListScreen() {
  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeCount = useMemo(() => {
    if (!employees) return 0;
    return employees.filter((e) => String(e.status).toUpperCase() === 'ACTIVE').length;
  }, [employees]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await http.get<Employee[]>('/hr/employees');
      setEmployees(res.data);
    } catch (e: any) {
      const parsed = parseApiError(e, API_BASE_URL);
      const statusPart = parsed.status ? ` (${parsed.status})` : '';
      setError(`Failed to load employees${statusPart}: ${parsed.message}\nAPI: ${API_BASE_URL}`);
      setEmployees(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Employees</Text>
        <Text style={styles.meta}>{employees ? `${employees.length} total • ${activeCount} active` : '—'}</Text>
      </View>

      {error ? <ErrorBanner message={error} onRetry={load} /> : null}

      {loading && !employees ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading employees…</Text>
        </View>
      ) : (
        <FlatList
          data={employees ?? []}
          keyExtractor={(e) => e.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>
                  {[item.firstName, item.lastName].filter(Boolean).join(' ') || '—'}
                </Text>
                <Text style={styles.rowSub}>
                  {(item.employeeId ? `${item.employeeId} • ` : '') + (item.department ?? '—')}
                </Text>
              </View>
              <View style={styles.statusWrap}>
                <Text style={styles.status}>{item.status ?? '—'}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.empty}>No employees found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 16,
    backgroundColor: '#ffffff',
    gap: 12,
  },
  header: {
    gap: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },
  meta: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  loadingText: {
    color: '#6b7280',
    fontWeight: '600',
  },
  list: {
    gap: 10,
    paddingBottom: 12,
  },
  row: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111827',
  },
  rowSub: {
    marginTop: 3,
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  statusWrap: {
    alignItems: 'flex-end',
    paddingLeft: 12,
  },
  status: {
    fontSize: 12,
    fontWeight: '900',
    color: '#111827',
  },
  empty: {
    color: '#6b7280',
    fontWeight: '700',
  },
});
