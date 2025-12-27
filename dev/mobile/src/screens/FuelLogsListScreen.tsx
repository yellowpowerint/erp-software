import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import { http } from '../api/http';

type FuelRecord = { id: string; transactionDate: string; quantity: string; totalCost: string; fuelType: string; asset: { assetCode: string; name: string } };

export function FuelLogsListScreen() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<FuelRecord[]>([]);

  const fetch = useCallback(async () => {
    try {
      const res = await http.get<{ data: FuelRecord[] }>('/fleet/fuel');
      setRecords(res.data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.accent} /></View>;

  return (
    <FlatList
      data={records}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.asset}>{item.asset.assetCode} - {item.asset.name}</Text>
          <Text style={styles.amount}>{parseFloat(item.quantity).toFixed(2)}L • ${parseFloat(item.totalCost).toFixed(2)}</Text>
          <Text style={styles.info}>{item.fuelType} • {new Date(item.transactionDate).toLocaleDateString()}</Text>
        </View>
      )}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={false} onRefresh={fetch} />}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.secondary },
  list: { padding: 16, backgroundColor: colors.secondary },
  card: { backgroundColor: colors.card, padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  asset: { fontSize: 14, fontWeight: '600', color: colors.foreground },
  amount: { fontSize: 16, fontWeight: '700', color: colors.accent, marginTop: 4 },
  info: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
});
