import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { grnService, PurchaseOrder } from '../services/grn.service';
import { theme } from '../../theme.config';

export default function POListScreen() {
  const navigation = useNavigation<any>();
  const [pos, setPOs] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    grnService.getPOsForReceiving({ status: 'APPROVED,SENT,PARTIALLY_RECEIVED' })
      .then(r => {
        console.log('[POList] Response:', r);
        const items = Array.isArray(r) ? r : (r.items || []);
        setPOs(items);
      })
      .catch(e => {
        console.error('[POList] Error:', e);
        setError(e?.response?.data?.message || e?.message || 'Failed to load purchase orders');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
  
  if (error) return (
    <View style={styles.centered}>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => {
        setLoading(true);
        setError(null);
        grnService.getPOsForReceiving({ status: 'APPROVED,SENT,PARTIALLY_RECEIVED' })
          .then(r => {
            const items = Array.isArray(r) ? r : (r.items || []);
            setPOs(items);
          })
          .catch(e => setError(e?.response?.data?.message || e?.message || 'Failed to load purchase orders'))
          .finally(() => setLoading(false));
      }}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
  
  if (pos.length === 0) return (
    <View style={styles.centered}>
      <Text style={styles.emptyText}>No purchase orders available for receiving</Text>
    </View>
  );

  return (
    <FlatList
      style={styles.container}
      data={pos}
      keyExtractor={i => i.id}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ReceiveGoods', { poId: item.id })}>
          <View style={styles.row}>
            <Text style={styles.poNumber}>{item.poNumber}</Text>
            <Text style={styles.status}>{item.status}</Text>
          </View>
          <Text style={styles.vendor}>{item.vendor?.companyName || item.vendorName}</Text>
          <Text style={styles.amount}>{item.currency} {Number(item.totalAmount).toFixed(2)}</Text>
          <Text style={styles.meta}>{item._count?.items || item.itemsCount || 0} items</Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { backgroundColor: theme.colors.surface, margin: 12, padding: 16, borderRadius: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  poNumber: { fontSize: 16, fontWeight: 'bold', color: theme.colors.text },
  status: { fontSize: 12, color: theme.colors.primary },
  vendor: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 4 },
  amount: { fontSize: 14, fontWeight: '600', color: theme.colors.text, marginBottom: 4 },
  meta: { fontSize: 12, color: theme.colors.textSecondary },
  errorText: { fontSize: 16, color: theme.colors.error, textAlign: 'center', marginBottom: 16 },
  emptyText: { fontSize: 16, color: theme.colors.textSecondary, textAlign: 'center' },
  retryButton: { backgroundColor: theme.colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
