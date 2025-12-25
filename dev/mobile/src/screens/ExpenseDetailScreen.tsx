import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import { http } from '../api/http';
import { parseApiError } from '../api/errors';
import { API_BASE_URL } from '../config';
import { ErrorBanner } from '../components/ErrorBanner';
import { AttachmentsCard } from '../components/AttachmentsCard';
import type { HomeStackParamList } from '../navigation/HomeStack';

type ExpenseDetail = {
  id: string;
  expenseNumber?: string;
  category?: string;
  description: string;
  amount: number;
  currency?: string;
  status?: string;
  expenseDate?: string;
  notes?: string | null;
  receipt?: string | null;
  project?: {
    id?: string;
    projectCode?: string;
    name?: string;
  };
  submittedBy?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  approvedBy?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  createdAt?: string;
  updatedAt?: string;
};

function formatMoney(amount: number, currency?: string) {
  const c = (currency ?? 'GHS').toUpperCase();
  if (!Number.isFinite(amount)) return `${c} —`;
  return `${c} ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

export function ExpenseDetailScreen() {
  const route = useRoute<RouteProp<HomeStackParamList, 'ExpenseDetail'>>();
  const id = route.params?.id;
  const trimmedId = useMemo(() => String(id ?? '').trim(), [id]);

  const [detail, setDetail] = useState<ExpenseDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noAccess, setNoAccess] = useState(false);

  const load = useCallback(async () => {
    if (!trimmedId) {
      setError('Missing expense id.');
      setDetail(null);
      setNoAccess(false);
      return;
    }

    setLoading(true);
    setError(null);
    setNoAccess(false);

    try {
      const res = await http.get<ExpenseDetail>(`/finance/expenses/${encodeURIComponent(trimmedId)}`);
      setDetail(res.data);
    } catch (e: any) {
      const parsed = parseApiError(e, API_BASE_URL);
      if (parsed.status === 403) {
        setNoAccess(true);
        setDetail(null);
        setError(null);
        return;
      }
      const statusPart = parsed.status ? ` (${parsed.status})` : '';
      setError(`Failed to load expense${statusPart}: ${parsed.message}\nAPI: ${API_BASE_URL}`);
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [trimmedId]);

  useEffect(() => {
    void load();
  }, [load]);

  const openReceipt = useCallback(async () => {
    const url = String(detail?.receipt ?? '').trim();
    if (!url) return;
    try {
      const ok = await Linking.canOpenURL(url);
      if (!ok) {
        Alert.alert('Unable to open', 'This receipt link cannot be opened on this device.');
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to open', 'Failed to open receipt link.');
    }
  }, [detail?.receipt]);

  if (loading && !detail && !noAccess && !error) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.muted}>Loading expense…</Text>
      </View>
    );
  }

  if (noAccess) {
    return (
      <View style={styles.center}>
        <Text style={styles.noAccessTitle}>No access</Text>
        <Text style={styles.muted}>You do not have permission to view this expense.</Text>
        <Pressable onPress={() => void load()} style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]}>
          <Text style={styles.secondaryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {error ? <ErrorBanner message={error} onRetry={load} /> : null}

      {detail ? (
        <>
          <View style={styles.card}>
            <Text style={styles.h1}>{detail.expenseNumber || 'Expense'}</Text>
            <Text style={styles.meta}>{(detail.category ?? '—') + (detail.status ? ` • ${detail.status}` : '')}</Text>
            <Text style={styles.meta}>Amount: {formatMoney(detail.amount, detail.currency)}</Text>
            <Text style={styles.meta}>Date: {formatDateTime(detail.expenseDate)}</Text>
            <Text style={styles.meta}>Project: {detail.project?.projectCode ?? '—'}</Text>
            <Text style={styles.meta}>Updated: {formatDateTime(detail.updatedAt)}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.body}>{detail.description}</Text>
            {detail.notes ? (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Notes</Text>
                <Text style={styles.body}>{detail.notes}</Text>
              </>
            ) : null}

            {detail.receipt ? (
              <Pressable onPress={() => void openReceipt()} style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]}>
                <Text style={styles.secondaryButtonText}>Open receipt</Text>
              </Pressable>
            ) : null}
          </View>

          <AttachmentsCard
            title="Attachments"
            module="finance_expenses"
            referenceId={detail.id}
            upload={{
              category: 'RECEIPT',
              description: 'Expense attachment (mobile)',
            }}
          />
        </>
      ) : (
        <View style={styles.center}>
          <Text style={styles.muted}>Expense not loaded.</Text>
          <Pressable onPress={() => void load()} style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]}>
            <Text style={styles.secondaryButtonText}>Retry</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#ffffff',
    gap: 12,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 12,
    backgroundColor: '#ffffff',
  },
  muted: {
    color: '#6b7280',
    fontWeight: '700',
    textAlign: 'center',
  },
  noAccessTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#f9fafb',
    gap: 6,
  },
  h1: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },
  meta: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#111827',
    textTransform: 'uppercase',
    opacity: 0.8,
  },
  body: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 18,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  secondaryButtonText: {
    color: '#111827',
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.9,
  },
});
