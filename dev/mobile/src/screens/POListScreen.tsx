import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { grnService, PurchaseOrder } from '../services/grn.service';
import { theme } from '../../theme.config';

export default function POListScreen() {
  const navigation = useNavigation<any>();
  const [pos, setPOs] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    grnService.getPOsForReceiving({ status: 'APPROVED,SENT,PARTIALLY_RECEIVED' })
      .then(r => setPOs(r.items || []))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;

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
          <Text style={styles.vendor}>{item.vendorName}</Text>
          <Text style={styles.amount}>{item.currency} {item.totalAmount.toFixed(2)}</Text>
          <Text style={styles.meta}>{item.receivedItemsCount}/{item.itemsCount} items received</Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: theme.colors.surface, margin: 12, padding: 16, borderRadius: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  poNumber: { fontSize: 16, fontWeight: 'bold', color: theme.colors.text },
  status: { fontSize: 12, color: theme.colors.primary },
  vendor: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 4 },
  amount: { fontSize: 14, fontWeight: '600', color: theme.colors.text, marginBottom: 4 },
  meta: { fontSize: 12, color: theme.colors.textSecondary },
});
