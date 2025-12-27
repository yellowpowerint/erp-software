import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ErrorBanner } from '../components/ErrorBanner';
import { parseApiError } from '../api/errors';
import { http } from '../api/http';
import { colors } from '../theme/colors';
import type { FinanceStackParamList } from '../navigation/FinanceStack';
import type { Budget } from '../api/financeTypes';

export function BudgetsListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<FinanceStackParamList>>();
  const [budgets, setBudgets] = useState<Budget[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await http.get<Budget[]>('/finance/budgets');
      setBudgets(res.data);
    } catch (e: any) {
      setError(parseApiError(e).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={styles.screen}>
      {error ? <ErrorBanner message={error} onRetry={load} /> : null}
      {loading && !budgets ? <ActivityIndicator size="large" /> : (
        <FlatList
          data={budgets ?? []}
          keyExtractor={(b) => b.id}
          renderItem={({ item }) => (
            <Pressable onPress={() => navigation.navigate('BudgetDetail', { id: item.id })} style={styles.row}>
              <Text style={styles.title}>{item.name}</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.secondary },
  row: { padding: 16, backgroundColor: colors.card, marginBottom: 8 },
  title: { fontSize: 16, fontWeight: '600', color: colors.foreground },
});
