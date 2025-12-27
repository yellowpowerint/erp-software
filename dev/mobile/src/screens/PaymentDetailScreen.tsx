import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';

import { ErrorBanner } from '../components/ErrorBanner';
import { parseApiError } from '../api/errors';
import { http } from '../api/http';
import { API_BASE_URL } from '../config';
import { colors } from '../theme/colors';
import type { Payment } from '../api/financeTypes';

function formatMoney(amount: number, currency?: string) {
  const c = (currency ?? 'GHS').toUpperCase();
  if (!Number.isFinite(amount)) return `${c} —`;
  return `${c} ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function PaymentDetailScreen() {
  const route = useRoute<any>();
  const id = String(route?.params?.id ?? '');

  const [item, setItem] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setError('Missing payment id');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await http.get<Payment>(`/finance/payments/${id}`);
      setItem(res.data);
    } catch (e: any) {
      const parsed = parseApiError(e, API_BASE_URL);
      const statusPart = parsed.status ? ` (${parsed.status})` : '';
      setError(`Failed to load payment${statusPart}: ${parsed.message}`);
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
        <Text style={styles.muted}>Loading payment…</Text>
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
        <Text style={styles.muted}>Payment not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.h1}>{item.paymentNumber ?? 'Payment'}</Text>
      <Text style={styles.h2}>{item.description}</Text>

      <View style={styles.card}>
        <Row label="Amount" value={formatMoney(Number(item.amount), item.currency)} />
        <Row label="Status" value={item.status ?? '—'} />
        <Row label="Method" value={item.paymentMethod ?? '—'} />
        <Row label="Date" value={item.paymentDate ? new Date(item.paymentDate).toLocaleString() : '—'} />
        <Row label="Supplier" value={item.supplier?.name ?? '—'} />
        <Row label="Project" value={item.project?.name ?? item.project?.projectCode ?? '—'} />
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
