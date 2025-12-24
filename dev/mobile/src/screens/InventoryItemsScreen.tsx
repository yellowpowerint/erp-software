import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { ErrorBanner } from '../components/ErrorBanner';
import { parseApiError } from '../api/errors';
import { http } from '../api/http';
import { API_BASE_URL } from '../config';

type StockItem = {
  id: string;
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

export function InventoryItemsScreen() {
  const [items, setItems] = useState<StockItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lowStockCount = useMemo(() => {
    if (!items) return 0;
    return items.filter((i) => i.currentQuantity <= i.reorderLevel).length;
  }, [items]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await http.get<StockItem[]>('/inventory/items');
      setItems(res.data);
    } catch (e: any) {
      const parsed = parseApiError(e, API_BASE_URL);
      const statusPart = parsed.status ? ` (${parsed.status})` : '';
      setError(`Failed to load inventory${statusPart}: ${parsed.message}\nAPI: ${API_BASE_URL}`);
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
    load();
  }, [load]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Inventory Items</Text>
        <Text style={styles.meta}>{items ? `${items.length} items • ${lowStockCount} low stock` : '—'}</Text>
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
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{item.name}</Text>
                  <Text style={styles.rowSub}>
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
              </View>
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
