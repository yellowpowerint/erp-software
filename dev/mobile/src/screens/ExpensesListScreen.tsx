import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation, NavigationProp, useFocusEffect } from '@react-navigation/native';
import { expensesService, Expense, ExpenseSearchResponse } from '../services/expenses.service';
import { theme } from '../../theme.config';
import { ModulesStackParamList } from '../navigation/types';

export default function ExpensesListScreen() {
  const navigation = useNavigation<NavigationProp<ModulesStackParamList>>();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  useFocusEffect(
    React.useCallback(() => {
      loadExpenses();
    }, [statusFilter])
  );

  const loadExpenses = async () => {
    try {
      setIsLoading(true);
      const res: ExpenseSearchResponse = await expensesService.getExpenses({
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setExpenses(res.expenses);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        navigation.navigate('NoAccess', { resource: 'expenses' });
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return theme.colors.success;
      case 'rejected': return theme.colors.error;
      case 'pending': return theme.colors.warning;
      default: return theme.colors.textSecondary;
    }
  };

  const renderItem = ({ item }: { item: Expense }) => (
    <TouchableOpacity
      style={s.card}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('ExpenseDetail', { expenseId: item.id })}
    >
      <View style={s.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.cardCategory}>{item.category}</Text>
          <Text style={s.cardEmployee}>{item.employeeName}</Text>
        </View>
        <View>
          <Text style={s.cardAmount}>${item.amount.toFixed(2)}</Text>
          <View style={[s.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[s.statusText, { color: getStatusColor(item.status) }]}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>
      <Text style={s.cardDate}>{new Date(item.date).toLocaleDateString()}</Text>
      <Text style={s.cardDescription} numberOfLines={2}>{item.description}</Text>
      {item.receiptUrl && <Text style={s.cardReceipt}>📎 Receipt attached</Text>}
    </TouchableOpacity>
  );

  if (isLoading) {
    return <View style={s.centered}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
  }

  return (
    <FlatList
      data={expenses}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      ListHeaderComponent={
        <View>
          <View style={s.header}>
            <Text style={s.title}>Expenses</Text>
            <TouchableOpacity style={s.newButton} onPress={() => navigation.navigate('ExpenseSubmit')}>
              <Text style={s.newButtonText}>+ New</Text>
            </TouchableOpacity>
          </View>
          <View style={s.filterChips}>
            {['all', 'pending', 'approved', 'rejected'].map(status => (
              <TouchableOpacity key={status} style={[s.chip, statusFilter === status && s.chipActive]} onPress={() => setStatusFilter(status)}>
                <Text style={[s.chipText, statusFilter === status && s.chipTextActive]}>{status}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      }
      contentContainerStyle={s.list}
      ListEmptyComponent={<View style={s.empty}><Text style={s.emptyText}>No expenses found</Text></View>}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); loadExpenses(); }} />}
    />
  );
}

const s = StyleSheet.create({
  list: { padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text },
  newButton: { backgroundColor: theme.colors.primary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  newButtonText: { color: '#fff', fontFamily: theme.typography.fontFamily.bold },
  filterChips: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  chip: { backgroundColor: theme.colors.surface, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: theme.colors.border },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { fontSize: 12, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.text },
  chipTextActive: { color: '#fff' },
  card: { backgroundColor: theme.colors.surface, borderRadius: 8, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border },
  cardHeader: { flexDirection: 'row', marginBottom: 8 },
  cardCategory: { fontSize: 16, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.text },
  cardEmployee: { fontSize: 14, color: theme.colors.textSecondary },
  cardAmount: { fontSize: 18, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.primary, textAlign: 'right' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginTop: 4, alignSelf: 'flex-end' },
  statusText: { fontSize: 10, fontFamily: theme.typography.fontFamily.bold },
  cardDate: { fontSize: 12, color: theme.colors.textSecondary, marginBottom: 4 },
  cardDescription: { fontSize: 14, color: theme.colors.text },
  cardReceipt: { fontSize: 12, color: theme.colors.primary, marginTop: 8 },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 16, color: theme.colors.textSecondary },
});
