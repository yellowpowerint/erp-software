import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { http } from '../api/http';
import { parseApiError } from '../api/errors';
import { API_BASE_URL } from '../config';
import { ErrorBanner } from '../components/ErrorBanner';
import type { HomeStackParamList } from '../navigation/HomeStack';

type Warehouse = {
  id: string;
  code: string;
  name: string;
  location?: string | null;
};

type StockMovement = {
  id: string;
  movementType: string;
  quantity: number;
  previousQty: number;
  newQty: number;
  unitPrice: number | null;
  totalValue: number | null;
  reference?: string | null;
  notes?: string | null;
  createdAt: string;
};

type StockItemDetail = {
  id: string;
  itemCode: string;
  name: string;
  description?: string | null;
  category: string;
  unit: string;
  unitPrice: number | null;
  reorderLevel: number;
  maxStockLevel: number | null;
  currentQuantity: number;
  barcode?: string | null;
  supplier?: string | null;
  notes?: string | null;
  warehouse: Warehouse;
  movements?: StockMovement[];
  createdAt: string;
  updatedAt: string;
};

function formatMoney(value: number | null) {
  if (value === null || !Number.isFinite(value)) return '—';
  return `GHS ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function InventoryItemDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<RouteProp<HomeStackParamList, 'InventoryItemDetail'>>();
  const { id } = route.params;

  const [detail, setDetail] = useState<StockItemDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedId = useMemo(() => String(id ?? '').trim(), [id]);

  const load = useCallback(async () => {
    if (!trimmedId) {
      setError('Missing inventory item id.');
      setDetail(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await http.get<StockItemDetail>(`/inventory/items/${encodeURIComponent(trimmedId)}`);
      setDetail(res.data);
    } catch (e: any) {
      const parsed = parseApiError(e, API_BASE_URL);
      const statusPart = parsed.status ? ` (${parsed.status})` : '';
      setError(`Failed to load item${statusPart}: ${parsed.message}\nAPI: ${API_BASE_URL}`);
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [trimmedId]);

  useEffect(() => {
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const isLowStock = useMemo(() => {
    if (!detail) return false;
    return detail.currentQuantity <= detail.reorderLevel;
  }, [detail]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {error ? <ErrorBanner message={error} onRetry={load} /> : null}

      {loading && !detail ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.muted}>Loading item…</Text>
        </View>
      ) : null}

      {detail ? (
        <>
          <View style={styles.card}>
            <Text style={styles.h1}>{detail.name}</Text>
            <Text style={styles.muted}>Code: {detail.itemCode}</Text>
            <Text style={styles.muted}>Category: {detail.category}</Text>
            <Text style={styles.muted}>Warehouse: {detail.warehouse?.code ? `${detail.warehouse.code} • ` : ''}{detail.warehouse?.name ?? '—'}</Text>
            <Pressable
              onPress={() => navigation.navigate('ReceiveStock', { itemId: detail.id })}
              style={({ pressed }) => [styles.primaryButton, pressed ? styles.primaryButtonPressed : null]}
              accessibilityRole="button"
            >
              <Text style={styles.primaryButtonText}>Receive stock</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <Text style={styles.h2}>Stock</Text>
            <Text style={[styles.stockQty, isLowStock ? styles.lowStock : null]}>
              {detail.currentQuantity} {detail.unit}
            </Text>
            <Text style={styles.muted}>Reorder level: {detail.reorderLevel}</Text>
            <Text style={styles.muted}>Max stock: {detail.maxStockLevel ?? '—'}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.h2}>Commercial</Text>
            <Text style={styles.body}>Unit price: {formatMoney(detail.unitPrice)}</Text>
            <Text style={styles.muted}>Supplier: {(detail.supplier ?? '').trim() || '—'}</Text>
            <Text style={styles.muted}>Barcode: {(detail.barcode ?? '').trim() || '—'}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.h2}>Description</Text>
            <Text style={styles.body}>{(detail.description ?? '').trim() || '—'}</Text>
            {(detail.notes ?? '').trim() ? <Text style={styles.muted}>Notes: {String(detail.notes).trim()}</Text> : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.h2}>Recent movements</Text>
            {detail.movements?.length ? (
              detail.movements.slice(0, 10).map((m) => (
                <View key={m.id} style={styles.movementRow}>
                  <Text style={styles.body}>{m.movementType} • Qty {m.quantity} • {m.previousQty} → {m.newQty}</Text>
                  <Text style={styles.muted}>{String(m.createdAt).slice(0, 19).replace('T', ' ')}</Text>
                  {m.reference ? <Text style={styles.muted}>Ref: {m.reference}</Text> : null}
                </View>
              ))
            ) : (
              <Text style={styles.muted}>No movements recorded.</Text>
            )}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#ffffff', gap: 12, flexGrow: 1 },
  center: { paddingVertical: 24, alignItems: 'center', gap: 10 },
  card: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, padding: 12, backgroundColor: '#f9fafb', gap: 8 },
  h1: { fontSize: 16, fontWeight: '900', color: '#111827' },
  h2: { fontSize: 12, fontWeight: '900', color: '#111827', opacity: 0.75, textTransform: 'uppercase' },
  body: { fontSize: 13, fontWeight: '800', color: '#111827' },
  muted: { fontSize: 12, fontWeight: '700', color: '#6b7280' },
  stockQty: { fontSize: 22, fontWeight: '900', color: '#111827' },
  lowStock: { color: '#b91c1c' },
  movementRow: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 10, backgroundColor: '#fff', gap: 6 },
  primaryButton: {
    marginTop: 10,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4f46e5',
  },
  primaryButtonPressed: { opacity: 0.9 },
  primaryButtonText: { color: '#ffffff', fontWeight: '900', fontSize: 13 },
});
