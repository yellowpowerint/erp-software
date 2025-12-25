import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ErrorBanner } from '../components/ErrorBanner';
import { parseApiError } from '../api/errors';
import { http } from '../api/http';
import { API_BASE_URL } from '../config';
import type { HomeStackParamList } from '../navigation/HomeStack';

type Expense = {
  id: string;
  description: string;
  amount: number;
  currency?: string;
  category?: string;
  status?: string;
  expenseDate?: string;
  project?: {
    projectCode?: string;
    name?: string;
  };
};

function formatMoney(amount: number, currency?: string) {
  const c = (currency ?? 'GHS').toUpperCase();
  if (!Number.isFinite(amount)) return `${c} —`;
  return `${c} ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function ExpensesListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList, 'Expenses'>>();

  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = useMemo(() => {
    if (!expenses) return 0;
    return expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await http.get<Expense[]>('/finance/expenses');
      setExpenses(res.data);
    } catch (e: any) {
      const parsed = parseApiError(e, API_BASE_URL);
      const statusPart = parsed.status ? ` (${parsed.status})` : '';
      setError(`Failed to load expenses${statusPart}: ${parsed.message}\nAPI: ${API_BASE_URL}`);
      setExpenses(null);
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
        <Text style={styles.title}>Expenses</Text>
        <Text style={styles.meta}>{expenses ? `${expenses.length} records • ${formatMoney(total, expenses[0]?.currency)}` : '—'}</Text>
      </View>

      {error ? <ErrorBanner message={error} onRetry={load} /> : null}

      {loading && !expenses ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading expenses…</Text>
        </View>
      ) : (
        <FlatList
          data={expenses ?? []}
          keyExtractor={(e) => e.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => navigation.navigate('ExpenseDetail', { id: item.id })}
              style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
              accessibilityRole="button"
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {item.description}
                </Text>
                <Text style={styles.rowSub}>
                  {(item.category ?? '—') + (item.status ? ` • ${item.status}` : '')}
                  {item.project?.projectCode ? ` • ${item.project.projectCode}` : ''}
                </Text>
              </View>
              <View style={styles.amountWrap}>
                <Text style={styles.amount}>{formatMoney(item.amount, item.currency)}</Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.empty}>No expenses found.</Text>
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
  amountWrap: {
    alignItems: 'flex-end',
    paddingLeft: 12,
  },
  amount: {
    fontSize: 13,
    fontWeight: '900',
    color: '#111827',
  },
  pressed: {
    opacity: 0.9,
  },
  empty: {
    color: '#6b7280',
    fontWeight: '700',
  },
});
