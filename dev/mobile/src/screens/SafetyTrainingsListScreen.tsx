import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ErrorBanner } from '../components/ErrorBanner';
import { parseApiError } from '../api/errors';
import { http } from '../api/http';
import { API_BASE_URL } from '../config';
import type { HomeStackParamList } from '../navigation/HomeStack';
import { useIncidentQueue } from '../safety/IncidentQueueContext';

type SafetyTraining = {
  id: string;
  type?: string;
  status?: string;
  scheduledDate?: string;
};

export function SafetyTrainingsListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const { pendingCount } = useIncidentQueue();
  const [items, setItems] = useState<SafetyTraining[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upcomingCount = useMemo(() => {
    if (!items) return 0;
    return items.filter((i) => String(i.status).toUpperCase() === 'SCHEDULED').length;
  }, [items]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await http.get<SafetyTraining[]>('/safety/trainings');
      setItems(res.data);
    } catch (e: any) {
      const parsed = parseApiError(e, API_BASE_URL);
      const statusPart = parsed.status ? ` (${parsed.status})` : '';
      setError(`Failed to load trainings${statusPart}: ${parsed.message}\nAPI: ${API_BASE_URL}`);
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
    load();
  }, [load]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Safety Trainings</Text>
        <Text style={styles.meta}>{items ? `${items.length} records • ${upcomingCount} upcoming` : '—'}</Text>
        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => navigation.navigate('IncidentCapture')}
            style={({ pressed }) => [styles.primaryButton, pressed ? styles.primaryButtonPressed : null]}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>Report incident</Text>
          </Pressable>
          <Pressable
            onPress={() => (navigation.getParent() as any)?.navigate('More', { screen: 'Outbox' })}
            style={({ pressed }) => [styles.secondaryButton, pressed ? styles.secondaryButtonPressed : null]}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryButtonText}>Outbox ({pendingCount})</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('SafetyIncidents')}
            style={({ pressed }) => [styles.secondaryButton, pressed ? styles.secondaryButtonPressed : null]}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryButtonText}>Incidents</Text>
          </Pressable>
        </View>
      </View>

      {error ? <ErrorBanner message={error} onRetry={load} /> : null}

      {loading && !items ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading trainings…</Text>
        </View>
      ) : (
        <FlatList
          data={items ?? []}
          keyExtractor={(i) => i.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{item.type ?? 'Training'}</Text>
                <Text style={styles.rowSub}>
                  {(item.status ?? '—') + (item.scheduledDate ? ` • ${String(item.scheduledDate).slice(0, 10)}` : '')}
                </Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.empty}>No trainings found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 16,
    backgroundColor: '#ffffff',
    gap: 12,
  },
  header: {
    gap: 2,
  },
  actionsRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },
  meta: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  loadingText: {
    color: '#6b7280',
    fontWeight: '600',
  },
  list: {
    gap: 10,
    paddingBottom: 12,
  },
  row: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111827',
  },
  rowSub: {
    marginTop: 3,
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  empty: {
    color: '#6b7280',
    fontWeight: '700',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonPressed: {
    opacity: 0.9,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '900',
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  secondaryButtonPressed: {
    opacity: 0.9,
  },
  secondaryButtonText: {
    color: '#111827',
    fontWeight: '900',
  },
});
