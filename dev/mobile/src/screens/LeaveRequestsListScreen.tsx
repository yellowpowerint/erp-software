import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ErrorBanner } from '../components/ErrorBanner';
import { parseApiError } from '../api/errors';
import { http } from '../api/http';
import { API_BASE_URL } from '../config';
import { colors } from '../theme/colors';
import type { HrStackParamList } from '../navigation/HrStack';

type LeaveRequest = {
  id: string;
  status?: string | null;
  leaveType?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  reason?: string | null;
  createdAt?: string | null;
  employee?: {
    id?: string;
    firstName?: string | null;
    lastName?: string | null;
    employeeId?: string | null;
  } | null;
};

function formatRange(start?: string | null, end?: string | null) {
  const s = start ? new Date(start).toLocaleDateString() : '—';
  const e = end ? new Date(end).toLocaleDateString() : '—';
  return `${s} → ${e}`;
}

export function LeaveRequestsListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HrStackParamList, 'LeaveRequestsList'>>();

  const [items, setItems] = useState<LeaveRequest[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await http.get<LeaveRequest[]>('/hr/leave-requests');
      setItems(res.data);
    } catch (e: any) {
      const parsed = parseApiError(e, API_BASE_URL);
      const statusPart = parsed.status ? ` (${parsed.status})` : '';
      setError(`Failed to load leave requests${statusPart}: ${parsed.message}`);
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
    void load();
  }, [load]);

  return (
    <View style={styles.screen}>
      {error ? <ErrorBanner message={error} onRetry={load} /> : null}

      {loading && !items ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.muted}>Loading leave requests…</Text>
        </View>
      ) : (
        <FlatList
          data={items ?? []}
          keyExtractor={(r) => r.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const employeeName = item.employee?.firstName || item.employee?.lastName
              ? `${item.employee?.firstName ?? ''} ${item.employee?.lastName ?? ''}`.trim()
              : null;

            return (
              <Pressable
                onPress={() => navigation.navigate('LeaveRequestDetail', { id: item.id })}
                style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
                accessibilityRole="button"
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.title} numberOfLines={1}>
                    {item.leaveType ?? 'Leave Request'}
                  </Text>
                  <Text style={styles.subtitle} numberOfLines={1}>
                    {item.status ? `Status: ${item.status}` : 'Status: —'}
                    {item.startDate || item.endDate ? `  •  ${formatRange(item.startDate, item.endDate)}` : ''}
                  </Text>
                  {employeeName ? <Text style={styles.subtitle} numberOfLines={1}>{employeeName}</Text> : null}
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.muted}>No leave requests found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.secondary },
  list: { padding: 12 },
  row: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  pressed: { opacity: 0.7 },
  title: { color: colors.foreground, fontSize: 15, fontWeight: '800' },
  subtitle: { color: colors.mutedForeground, fontSize: 12, marginTop: 4 },
  center: { padding: 24, alignItems: 'center', justifyContent: 'center', gap: 10 },
  muted: { color: colors.mutedForeground },
});
