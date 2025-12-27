import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';

import { ErrorBanner } from '../components/ErrorBanner';
import { parseApiError } from '../api/errors';
import { http } from '../api/http';
import { API_BASE_URL } from '../config';
import { colors } from '../theme/colors';
import type { Budget } from '../api/financeTypes';

function formatMoney(amount: number, currency?: string) {
  const c = (currency ?? 'GHS').toUpperCase();
  if (!Number.isFinite(amount)) return `${c} —`;
  return `${c} ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function BudgetDetailScreen() {
  const route = useRoute<any>();
  const id = String(route?.params?.id ?? '');

  const [item, setItem] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setError('Missing budget id');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await http.get<Budget>(`/finance/budgets/${id}`);
      setItem(res.data);
    } catch (e: any) {
      const parsed = parseApiError(e, API_BASE_URL);
      const statusPart = parsed.status ? ` (${parsed.status})` : '';
      setError(`Failed to load budget${statusPart}: ${parsed.message}`);
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
        <Text style={styles.muted}>Loading budget…</Text>
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
        <Text style={styles.muted}>Budget not found.</Text>
      </View>
    );
  }

  const spent = Number(item.spentAmount ?? 0);
  const allocated = Number(item.allocatedAmount ?? 0);
  const remaining = allocated - spent;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.h1}>{item.name}</Text>
      {item.description ? <Text style={styles.h2}>{item.description}</Text> : null}

      <View style={styles.card}>
        <Row label="Allocated" value={formatMoney(allocated, item.currency)} />
        <Row label="Spent" value={formatMoney(spent, item.currency)} />
        <Row label="Remaining" value={formatMoney(remaining, item.currency)} />
        <Row label="Category" value={item.category ?? '—'} />
        <Row label="Period" value={item.period ?? '—'} />
        <Row label="Start" value={item.startDate ? new Date(item.startDate).toLocaleDateString() : '—'} />
        <Row label="End" value={item.endDate ? new Date(item.endDate).toLocaleDateString() : '—'} />
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
