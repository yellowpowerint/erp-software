import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { http } from '../api/http';
import { parseApiError } from '../api/errors';
import { API_BASE_URL } from '../config';

type Vendor = {
  id: string;
  vendorCode: string;
  companyName: string;
  status: string;
  email: string;
  rating: string | null;
  isPreferred: boolean;
};

export function VendorsListScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  const fetchVendors = useCallback(async () => {
    try {
      setError(null);
      const res = await http.get<Vendor[]>('/procurement/vendors');
      setVendors(res.data);
    } catch (err) {
      setError(parseApiError(err, API_BASE_URL).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchVendors(); }, [fetchVendors]);

  const renderVendor = useCallback(({ item }: { item: Vendor }) => (
    <Pressable style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.vendorCode}>{item.vendorCode}</Text>
          <Text style={styles.companyName}>{item.companyName}</Text>
        </View>
        {item.isPreferred && <Ionicons name="star" size={20} color="#f59e0b" />}
      </View>
      <Text style={styles.email}>{item.email}</Text>
      <Text style={styles.status}>Status: {item.status}</Text>
    </Pressable>
  ), []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.accent} /></View>;
  if (error) return <View style={styles.center}><Text style={styles.errorText}>{error}</Text></View>;

  return (
    <FlatList
      data={vendors}
      renderItem={renderVendor}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.secondary },
  list: { padding: 16, backgroundColor: colors.secondary },
  card: { backgroundColor: colors.card, padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  vendorCode: { fontSize: 13, fontWeight: '600', color: colors.accent },
  companyName: { fontSize: 16, fontWeight: '700', color: colors.foreground, marginTop: 4 },
  email: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  status: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  errorText: { color: colors.destructive, fontSize: 14 },
});
