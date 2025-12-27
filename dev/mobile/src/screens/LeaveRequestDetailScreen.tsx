import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';

import { ErrorBanner } from '../components/ErrorBanner';
import { parseApiError } from '../api/errors';
import { http } from '../api/http';
import { API_BASE_URL } from '../config';
import { colors } from '../theme/colors';

type LeaveRequest = {
  id: string;
  status?: string | null;
  leaveType?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  reason?: string | null;
  notes?: string | null;
  createdAt?: string | null;
  employee?: {
    firstName?: string | null;
    lastName?: string | null;
    employeeId?: string | null;
    department?: string | null;
  } | null;
};

export function LeaveRequestDetailScreen() {
  const route = useRoute<any>();
  const id = String(route?.params?.id ?? '');

  const [item, setItem] = useState<LeaveRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setError('Missing leave request id');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await http.get<LeaveRequest>(`/hr/leave-requests/${id}`);
      setItem(res.data);
    } catch (e: any) {
      const parsed = parseApiError(e, API_BASE_URL);
      const statusPart = parsed.status ? ` (${parsed.status})` : '';
      setError(`Failed to load leave request${statusPart}: ${parsed.message}`);
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !item) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.muted}>Loading leave request…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.screen}>
        <ErrorBanner message={error} onRetry={load} />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Leave request not found.</Text>
      </View>
    );
  }

  const employeeName = item.employee?.firstName || item.employee?.lastName
    ? `${item.employee?.firstName ?? ''} ${item.employee?.lastName ?? ''}`.trim()
    : '—';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.h1}>{item.leaveType ?? 'Leave Request'}</Text>
      <Text style={styles.h2}>{item.status ?? '—'}</Text>

      <View style={styles.card}>
        <Row label="Employee" value={employeeName} />
        <Row label="Employee ID" value={item.employee?.employeeId ?? '—'} />
        <Row label="Department" value={item.employee?.department ?? '—'} />
        <Row label="Start" value={item.startDate ? new Date(item.startDate).toLocaleDateString() : '—'} />
        <Row label="End" value={item.endDate ? new Date(item.endDate).toLocaleDateString() : '—'} />
        <Row label="Reason" value={item.reason ?? '—'} />
        <Row label="Notes" value={item.notes ?? '—'} />
        <Row label="Created" value={item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'} />
      </View>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.secondary },
  content: { padding: 12 },
  h1: { color: colors.foreground, fontSize: 18, fontWeight: '900' },
  h2: { color: colors.mutedForeground, fontSize: 13, marginTop: 4, marginBottom: 12 },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  label: { color: colors.mutedForeground, fontSize: 12, fontWeight: '700' },
  value: { color: colors.foreground, fontSize: 12, fontWeight: '800', flexShrink: 1, textAlign: 'right' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  muted: { color: colors.mutedForeground },
});
