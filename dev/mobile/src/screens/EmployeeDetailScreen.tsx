import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import { http } from '../api/http';
import { parseApiError } from '../api/errors';
import { API_BASE_URL } from '../config';
import { ErrorBanner } from '../components/ErrorBanner';
import type { HomeStackParamList } from '../navigation/HomeStack';

type EmployeeDetail = {
  id: string;
  employeeId?: string;
  firstName?: string;
  lastName?: string;
  department?: string;
  position?: string;
  status?: string;
  email?: string;
  phone?: string | null;
  hireDate?: string;
  salary?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

function formatDate(value: string | undefined | null) {
  const s = String(value ?? '').trim();
  if (!s) return '—';
  return s.slice(0, 10);
}

function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return `GHS ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function EmployeeDetailScreen() {
  const route = useRoute<RouteProp<HomeStackParamList, 'EmployeeDetail'>>();
  const { id } = route.params;

  const [detail, setDetail] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedId = useMemo(() => String(id ?? '').trim(), [id]);

  const load = useCallback(async () => {
    if (!trimmedId) {
      setError('Missing employee id.');
      setDetail(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await http.get<EmployeeDetail>(`/hr/employees/${encodeURIComponent(trimmedId)}`);
      setDetail(res.data);
    } catch (e: any) {
      const parsed = parseApiError(e, API_BASE_URL);
      const statusPart = parsed.status ? ` (${parsed.status})` : '';
      setError(`Failed to load employee${statusPart}: ${parsed.message}\nAPI: ${API_BASE_URL}`);
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [trimmedId]);

  useEffect(() => {
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const fullName = useMemo(() => {
    if (!detail) return '—';
    return [detail.firstName, detail.lastName].filter(Boolean).join(' ') || '—';
  }, [detail]);

  const showsSensitive = useMemo(() => {
    if (!detail) return false;
    return detail.salary !== undefined;
  }, [detail]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {error ? <ErrorBanner message={error} onRetry={load} /> : null}

      {loading && !detail ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.muted}>Loading employee…</Text>
        </View>
      ) : null}

      {detail ? (
        <>
          <View style={styles.card}>
            <Text style={styles.h1}>{fullName}</Text>
            <Text style={styles.muted}>{detail.employeeId ? `Employee ID: ${detail.employeeId}` : 'Employee ID: —'}</Text>
            <Text style={styles.muted}>Department: {detail.department ?? '—'}</Text>
            <Text style={styles.muted}>Position: {detail.position ?? '—'}</Text>
            <Text style={styles.muted}>Status: {detail.status ?? '—'}</Text>
            {!showsSensitive ? <Text style={styles.note}>Some fields may be hidden based on your access.</Text> : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.h2}>Contact</Text>
            <Text style={styles.body}>Email: {detail.email ?? '—'}</Text>
            <Text style={styles.body}>Phone: {(detail.phone ?? '').trim() || '—'}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.h2}>Employment</Text>
            <Text style={styles.body}>Hire date: {formatDate(detail.hireDate)}</Text>
            <Text style={styles.body}>Salary: {formatMoney(detail.salary)}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.h2}>System</Text>
            <Text style={styles.body}>Created: {formatDate(detail.createdAt)}</Text>
            <Text style={styles.body}>Updated: {formatDate(detail.updatedAt)}</Text>
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#ffffff', gap: 12, flexGrow: 1 },
  center: { paddingVertical: 24, alignItems: 'center', gap: 10 },
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#f9fafb',
    gap: 8,
  },
  h1: { fontSize: 16, fontWeight: '900', color: '#111827' },
  h2: { fontSize: 12, fontWeight: '900', color: '#111827', opacity: 0.75, textTransform: 'uppercase' },
  body: { fontSize: 13, fontWeight: '800', color: '#111827' },
  muted: { fontSize: 12, fontWeight: '700', color: '#6b7280' },
  note: { fontSize: 12, fontWeight: '700', color: '#6b7280' },
});
