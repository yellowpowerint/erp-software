import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import { http } from '../api/http';

type ProductionLog = { id: string; date: string; shiftType: string; activityType: string; quantity: number; unit: string; location: string; project?: { projectCode: string; name: string } };

export function ProductionLogsListScreen() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<ProductionLog[]>([]);

  const fetch = useCallback(async () => {
    try {
      const res = await http.get<ProductionLog[]>('/operations/production-logs');
      setLogs(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.accent} /></View>;

  return (
    <FlatList
      data={logs}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.activity}>{item.activityType}</Text>
          <Text style={styles.quantity}>{item.quantity} {item.unit}</Text>
          <Text style={styles.info}>{item.shiftType} • {new Date(item.date).toLocaleDateString()}</Text>
          {item.project && <Text style={styles.project}>{item.project.projectCode} - {item.project.name}</Text>}
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
  activity: { fontSize: 14, fontWeight: '600', color: colors.foreground },
  quantity: { fontSize: 18, fontWeight: '700', color: colors.accent, marginTop: 4 },
  info: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  project: { fontSize: 11, color: colors.mutedForeground, marginTop: 4 },
});
