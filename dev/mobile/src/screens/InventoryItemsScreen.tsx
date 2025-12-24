import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ErrorBanner } from '../components/ErrorBanner';
import { parseApiError } from '../api/errors';
import { http } from '../api/http';
import { API_BASE_URL } from '../config';
import type { HomeStackParamList } from '../navigation/HomeStack';

type StockItem = {
  id: string;
  itemCode?: string;
  name: string;
  category?: string;
  unit?: string;
  currentQuantity: number;
  reorderLevel: number;
  warehouse?: {
    id: string;
    code: string;
    name: string;
  };
};

type CategoryFilter = 'ALL' | string;

export function InventoryItemsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList, 'InventoryItems'>>();
  const [items, setItems] = useState<StockItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL');

  const lowStockCount = useMemo(() => {
    if (!items) return 0;
    return items.filter((i) => i.currentQuantity <= i.reorderLevel).length;
  }, [items]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const parts: string[] = [];
      const q = search.trim();
      if (q.length > 0) parts.push(`search=${encodeURIComponent(q)}`);
      if (lowStockOnly) parts.push('lowStock=true');
      if (categoryFilter !== 'ALL') parts.push(`category=${encodeURIComponent(categoryFilter)}`);
      const qs = parts.length ? `?${parts.join('&')}` : '';

      const res = await http.get<StockItem[]>(`/inventory/items${qs}`);
      setItems(res.data);
    } catch (e: any) {
      const parsed = parseApiError(e, API_BASE_URL);
      const statusPart = parsed.status ? ` (${parsed.status})` : '';
      setError(`Failed to load inventory${statusPart}: ${parsed.message}\nAPI: ${API_BASE_URL}`);
      setItems(null);
    } finally {
      setLoading(false);
    }
  }, [search, lowStockOnly, categoryFilter]);

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

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const i of items ?? []) {
      const c = String(i.category ?? '').trim();
      if (c) set.add(c);
    }
    return ['ALL', ...Array.from(set).sort()] as CategoryFilter[];
  }, [items]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Inventory Items</Text>
        <Text style={styles.meta}>{items ? `${items.length} items • ${lowStockCount} low stock` : '—'}</Text>
      </View>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search by code, name, barcode, supplier…"
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.search}
      />

      <View style={styles.filtersRow}>
        <Pressable
          onPress={() => setLowStockOnly(false)}
          style={({ pressed }) => [
            styles.filterButton,
            !lowStockOnly ? styles.filterButtonActive : null,
            pressed ? styles.filterButtonPressed : null,
          ]}
          accessibilityRole="button"
        >
          <Text style={[styles.filterText, !lowStockOnly ? styles.filterTextActive : null]}>All</Text>
        </Pressable>
        <Pressable
          onPress={() => setLowStockOnly(true)}
          style={({ pressed }) => [
            styles.filterButton,
            lowStockOnly ? styles.filterButtonActive : null,
            pressed ? styles.filterButtonPressed : null,
          ]}
          accessibilityRole="button"
        >
          <Text style={[styles.filterText, lowStockOnly ? styles.filterTextActive : null]}>Low stock</Text>
        </Pressable>
      </View>

      <View style={styles.filtersWrap}>
        {categories.map((c) => (
          <Pressable
            key={c}
            onPress={() => setCategoryFilter(c)}
            style={({ pressed }) => [
              styles.chip,
              categoryFilter === c ? styles.chipActive : null,
              pressed ? styles.filterButtonPressed : null,
            ]}
            accessibilityRole="button"
          >
            <Text style={[styles.chipText, categoryFilter === c ? styles.chipTextActive : null]}>{c}</Text>
          </Pressable>
        ))}
      </View>

      {error ? <ErrorBanner message={error} onRetry={load} /> : null}

      {loading && !items ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading inventory…</Text>
        </View>
      ) : (
        <FlatList
          data={items ?? []}
          keyExtractor={(i) => i.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const isLow = item.currentQuantity <= item.reorderLevel;
            return (
              <Pressable
                onPress={() => navigation.navigate('InventoryItemDetail', { id: item.id })}
                style={({ pressed }) => [styles.row, pressed ? { opacity: 0.9 } : null]}
                accessibilityRole="button"
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.rowSub} numberOfLines={2}>
                    {item.itemCode ? `${item.itemCode} • ` : ''}
                    {item.warehouse?.code ? `${item.warehouse.code} • ` : ''}
                    {item.category ?? '—'}
                  </Text>
                </View>
                <View style={styles.qtyWrap}>
                  <Text style={[styles.qty, isLow ? styles.qtyLow : null]}>
                    {item.currentQuantity} {item.unit ?? ''}
                  </Text>
                  <Text style={styles.reorder}>Reorder ≤ {item.reorderLevel}</Text>
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.empty}>No items found.</Text>
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
  search: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f9fafb',
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 10,
  },
  filterButton: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  filterButtonPressed: {
    opacity: 0.9,
  },
  filterText: {
    fontWeight: '900',
    color: '#111827',
    fontSize: 12,
  },
  filterTextActive: {
    color: '#ffffff',
  },
  filtersWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  chipActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#111827',
  },
  chipTextActive: {
    color: '#ffffff',
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
  qtyWrap: {
    alignItems: 'flex-end',
    paddingLeft: 12,
  },
  qty: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111827',
  },
  qtyLow: {
    color: '#b91c1c',
  },
  reorder: {
    marginTop: 2,
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '700',
  },
  empty: {
    color: '#6b7280',
    fontWeight: '700',
  },
});
