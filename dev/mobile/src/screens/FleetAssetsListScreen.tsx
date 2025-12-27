import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { http } from '../api/http';

type FleetAsset = { id: string; assetCode: string; name: string; type: string; status: string; currentLocation: string };

export function FleetAssetsListScreen() {
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<FleetAsset[]>([]);

  const fetch = useCallback(async () => {
    try {
      const res = await http.get<{ data: FleetAsset[] }>('/fleet/assets');
      setAssets(res.data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.accent} /></View>;

  return (
    <FlatList
      data={assets}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.code}>{item.assetCode}</Text>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.info}>{item.type} • {item.status}</Text>
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
  code: { fontSize: 13, fontWeight: '600', color: colors.accent },
  name: { fontSize: 16, fontWeight: '700', color: colors.foreground, marginTop: 4 },
  info: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
});
