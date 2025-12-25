import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ErrorBanner } from '../components/ErrorBanner';
import { http } from '../api/http';
import { parseApiError } from '../api/errors';
import { API_BASE_URL } from '../config';
import type { HomeStackParamList } from '../navigation/HomeStack';

type Employee = {
  id: string;
  employeeId?: string;
  firstName?: string;
  lastName?: string;
  department?: string;
  position?: string;
  status?: string;
};

export function EmployeesListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList, 'Employees'>>();
  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const activeCount = useMemo(() => {
    if (!employees) return 0;
    return employees.filter((e) => String(e.status).toUpperCase() === 'ACTIVE').length;
  }, [employees]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = searchQuery.trim();
      const qs = q.length ? `?search=${encodeURIComponent(q)}` : '';
      const res = await http.get<Employee[]>(`/hr/employees${qs}`);
      setEmployees(res.data);
    } catch (e: any) {
      const parsed = parseApiError(e, API_BASE_URL);
      const statusPart = parsed.status ? ` (${parsed.status})` : '';
      setError(`Failed to load employees${statusPart}: ${parsed.message}\nAPI: ${API_BASE_URL}`);
      setEmployees(null);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 350);
    return () => clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Employees</Text>
        <Text style={styles.meta}>{employees ? `${employees.length} total • ${activeCount} active` : '—'}</Text>
      </View>

      <TextInput
        value={searchInput}
        onChangeText={setSearchInput}
        placeholder="Search by name, ID, email, department…"
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.search}
      />

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
            <Pressable
              onPress={() => navigation.navigate('EmployeeDetail', { id: item.id })}
              style={({ pressed }) => [styles.row, pressed ? { opacity: 0.9 } : null]}
              accessibilityRole="button"
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>
                  {[item.firstName, item.lastName].filter(Boolean).join(' ') || '—'}
                </Text>
                <Text style={styles.rowSub}>
                  {[
                    item.employeeId ? String(item.employeeId) : '',
                    item.department ?? '',
                    item.position ?? '',
                  ]
                    .map((p) => String(p).trim())
                    .filter(Boolean)
                    .join(' • ') || '—'}
                </Text>
              </View>
              <View style={styles.statusWrap}>
                <Text style={styles.status}>{item.status ?? '—'}</Text>
              </View>
            </Pressable>
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
  search: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f9fafb',
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
