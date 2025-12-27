import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { ErrorBanner } from '../components/ErrorBanner';
import { parseApiError } from '../api/errors';
import { http } from '../api/http';
import { API_BASE_URL } from '../config';
import { colors } from '../theme/colors';

type AttendanceRecord = {
  id?: string;
  employeeId?: string | null;
  date?: string | null;
  status?: string | null;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  hoursWorked?: number | null;
  employee?: {
    firstName?: string | null;
    lastName?: string | null;
    employeeId?: string | null;
  } | null;
};

function formatDate(v?: string | null) {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString();
}

function formatTime(v?: string | null) {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleTimeString();
}

export function AttendanceListScreen() {
  const [items, setItems] = useState<AttendanceRecord[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await http.get<AttendanceRecord[]>('/hr/attendance');
      setItems(res.data);
    } catch (e: any) {
      const parsed = parseApiError(e, API_BASE_URL);
      const statusPart = parsed.status ? ` (${parsed.status})` : '';
      setError(`Failed to load attendance${statusPart}: ${parsed.message}`);
      setItems(null);
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
    void load();
  }, [load]);

  return (
    <View style={styles.screen}>
      {error ? <ErrorBanner message={error} onRetry={load} /> : null}

      {loading && !items ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.muted}>Loading attendance…</Text>
        </View>
      ) : (
        <FlatList
          data={items ?? []}
          keyExtractor={(r, idx) => r.id ?? `${r.employeeId ?? 'emp'}-${r.date ?? 'date'}-${idx}`}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const name = item.employee?.firstName || item.employee?.lastName
              ? `${item.employee?.firstName ?? ''} ${item.employee?.lastName ?? ''}`.trim()
              : null;
            const empId = item.employee?.employeeId ?? item.employeeId ?? '—';
            const date = formatDate(item.date);
            const status = item.status ?? '—';

            return (
              <View style={styles.row}>
                <Text style={styles.title} numberOfLines={1}>
                  {name ? `${name} (${empId})` : `Employee: ${empId}`}
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {date}  •  Status: {status}
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  In: {formatTime(item.checkInTime)}  •  Out: {formatTime(item.checkOutTime)}
                </Text>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.muted}>No attendance records found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.secondary },
  list: { padding: 12 },
  row: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  title: { color: colors.foreground, fontSize: 15, fontWeight: '800' },
  subtitle: { color: colors.mutedForeground, fontSize: 12, marginTop: 4 },
  center: { padding: 24, alignItems: 'center', justifyContent: 'center', gap: 10 },
  muted: { color: colors.mutedForeground },
});
