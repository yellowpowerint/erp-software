import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { http } from '../api/http';

type DashboardData = {
  inventory: { total: number; lowStock: number };
  assets: { total: number; active: number };
  projects: { total: number; active: number };
  finance: { totalBudgets: number; totalExpenses: number };
  hr: { total: number; active: number };
  safety: { pendingInspections: number; upcomingTrainings: number };
};

export function ReportsDashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  const fetch = useCallback(async () => {
    try {
      const res = await http.get<DashboardData>('/reports/dashboard');
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.accent} /></View>;
  if (!data) return <View style={styles.center}><Text style={styles.error}>No data</Text></View>;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={false} onRefresh={fetch} />}>
      <View style={styles.grid}>
        <View style={styles.card}>
          <Ionicons name="cube" size={24} color={colors.accent} />
          <Text style={styles.cardTitle}>Inventory</Text>
          <Text style={styles.cardValue}>{data.inventory.total}</Text>
          <Text style={styles.cardSubtext}>{data.inventory.lowStock} low stock</Text>
        </View>
        <View style={styles.card}>
          <Ionicons name="business" size={24} color={colors.accent} />
          <Text style={styles.cardTitle}>Assets</Text>
          <Text style={styles.cardValue}>{data.assets.total}</Text>
          <Text style={styles.cardSubtext}>{data.assets.active} active</Text>
        </View>
        <View style={styles.card}>
          <Ionicons name="construct" size={24} color={colors.accent} />
          <Text style={styles.cardTitle}>Projects</Text>
          <Text style={styles.cardValue}>{data.projects.total}</Text>
          <Text style={styles.cardSubtext}>{data.projects.active} active</Text>
        </View>
        <View style={styles.card}>
          <Ionicons name="cash" size={24} color={colors.accent} />
          <Text style={styles.cardTitle}>Finance</Text>
          <Text style={styles.cardValue}>{data.finance.totalExpenses}</Text>
          <Text style={styles.cardSubtext}>{data.finance.totalBudgets} budgets</Text>
        </View>
        <View style={styles.card}>
          <Ionicons name="people" size={24} color={colors.accent} />
          <Text style={styles.cardTitle}>HR</Text>
          <Text style={styles.cardValue}>{data.hr.total}</Text>
          <Text style={styles.cardSubtext}>{data.hr.active} active</Text>
        </View>
        <View style={styles.card}>
          <Ionicons name="shield-checkmark" size={24} color={colors.accent} />
          <Text style={styles.cardTitle}>Safety</Text>
          <Text style={styles.cardValue}>{data.safety.pendingInspections}</Text>
          <Text style={styles.cardSubtext}>{data.safety.upcomingTrainings} trainings</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.secondary },
  container: { flex: 1, backgroundColor: colors.secondary },
  grid: { padding: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { backgroundColor: colors.card, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border, width: '47%', alignItems: 'center' },
  cardTitle: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginTop: 8 },
  cardValue: { fontSize: 24, fontWeight: '700', color: colors.foreground, marginTop: 4 },
  cardSubtext: { fontSize: 11, color: colors.mutedForeground, marginTop: 2 },
  error: { fontSize: 14, color: colors.destructive },
});
