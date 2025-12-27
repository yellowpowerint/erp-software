import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ErrorBanner } from '../components/ErrorBanner';
import { parseApiError } from '../api/errors';
import { http } from '../api/http';
import { API_BASE_URL } from '../config';
import { colors } from '../theme/colors';
import type { FinanceStackParamList } from '../navigation/FinanceStack';
import type { Payment } from '../api/financeTypes';

function formatMoney(amount: number, currency?: string) {
  const c = (currency ?? 'GHS').toUpperCase();
  if (!Number.isFinite(amount)) return `${c} —`;
  return `${c} ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function PaymentsListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<FinanceStackParamList, 'PaymentsList'>>();

  const [items, setItems] = useState<Payment[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await http.get<Payment[]>('/finance/payments');
      setItems(res.data);
    } catch (e: any) {
      const parsed = parseApiError(e, API_BASE_URL);
      const statusPart = parsed.status ? ` (${parsed.status})` : '';
      setError(`Failed to load payments${statusPart}: ${parsed.message}`);
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
          <Text style={styles.muted}>Loading payments…</Text>
        </View>
      ) : (
        <FlatList
          data={items ?? []}
          keyExtractor={(p) => p.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => navigation.navigate('PaymentDetail', { id: item.id })}
              style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
              accessibilityRole="button"
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.description || item.paymentNumber || 'Payment'}
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {item.status ? `Status: ${item.status}` : 'Status: —'}
                  {item.paymentDate ? `  •  ${new Date(item.paymentDate).toLocaleDateString()}` : ''}
                </Text>
              </View>
              <Text style={styles.amount}>{formatMoney(Number(item.amount), item.currency)}</Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.muted}>No payments found.</Text>
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
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  pressed: { opacity: 0.7 },
  title: { color: colors.foreground, fontSize: 15, fontWeight: '800' },
  subtitle: { color: colors.mutedForeground, fontSize: 12, marginTop: 2 },
  amount: { color: colors.foreground, fontSize: 13, fontWeight: '800' },
  center: { padding: 24, alignItems: 'center', justifyContent: 'center', gap: 10 },
  muted: { color: colors.mutedForeground },
});
