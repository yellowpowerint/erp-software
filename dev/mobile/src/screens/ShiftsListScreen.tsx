import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import { http } from '../api/http';

type Shift = { id: string; date: string; shiftType: string; startTime: string; endTime: string; supervisor: string; crew: string[]; location: string };

export function ShiftsListScreen() {
  const [loading, setLoading] = useState(true);
  const [shifts, setShifts] = useState<Shift[]>([]);

  const fetch = useCallback(async () => {
    try {
      const res = await http.get<Shift[]>('/operations/shifts');
      setShifts(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.accent} /></View>;

  return (
    <FlatList
      data={shifts}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.shift}>{item.shiftType}</Text>
          <Text style={styles.time}>{item.startTime} - {item.endTime}</Text>
          <Text style={styles.info}>{new Date(item.date).toLocaleDateString()} • {item.location}</Text>
          {item.supervisor && <Text style={styles.supervisor}>Supervisor: {item.supervisor}</Text>}
          <Text style={styles.crew}>{item.crew.length} crew members</Text>
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
  shift: { fontSize: 16, fontWeight: '700', color: colors.foreground },
  time: { fontSize: 14, fontWeight: '600', color: colors.accent, marginTop: 4 },
  info: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  supervisor: { fontSize: 12, color: colors.foreground, marginTop: 4 },
  crew: { fontSize: 11, color: colors.mutedForeground, marginTop: 2 },
});
