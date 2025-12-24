import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ErrorBanner } from '../components/ErrorBanner';
import { parseApiError } from '../api/errors';
import { http } from '../api/http';
import { API_BASE_URL } from '../config';
import { useNotifications } from '../notifications/NotificationsContext';
import type { NotificationsStackParamList } from '../navigation/NotificationsStack';

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  referenceId?: string | null;
  referenceType?: string | null;
  read: boolean;
  createdAt: string;
};

type FilterMode = 'all' | 'unread';

export function NotificationsListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<NotificationsStackParamList>>();
  const { unreadCount, refreshUnreadCount, setUnreadCount } = useNotifications();

  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = filter === 'unread' ? '?unreadOnly=true' : '';
      const res = await http.get<NotificationItem[]>(`/notifications${qs}`);
      setItems(res.data);
    } catch (e: any) {
      const parsed = parseApiError(e, API_BASE_URL);
      const statusPart = parsed.status ? ` (${parsed.status})` : '';
      setError(`Failed to load notifications${statusPart}: ${parsed.message}\nAPI: ${API_BASE_URL}`);
      setItems(null);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([load(), refreshUnreadCount()]);
    } finally {
      setRefreshing(false);
    }
  }, [load, refreshUnreadCount]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const headerMeta = useMemo(() => {
    const total = items?.length ?? 0;
    if (filter === 'unread') return `${total} unread`;
    return `${total} total • ${unreadCount} unread`;
  }, [items, filter, unreadCount]);

  const markAllRead = useCallback(async () => {
    try {
      await http.post('/notifications/mark-all-read');
      setUnreadCount(0);
      await refresh();
    } catch (e: any) {
      const parsed = parseApiError(e, API_BASE_URL);
      const statusPart = parsed.status ? ` (${parsed.status})` : '';
      setError(`Failed to mark all as read${statusPart}: ${parsed.message}\nAPI: ${API_BASE_URL}`);
    }
  }, [refresh, setUnreadCount]);

  const onOpen = useCallback(
    async (n: NotificationItem) => {
      if (!n.read) {
        try {
          await http.post(`/notifications/${n.id}/read`);
          setItems((prev) => (prev ? prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)) : prev));
          setUnreadCount(Math.max(0, unreadCount - 1));
        } catch {
          // ignore; detail view will still load
        } finally {
          refreshUnreadCount();
        }
      }

      navigation.navigate('NotificationDetail', { id: n.id });
    },
    [navigation, refreshUnreadCount, setUnreadCount, unreadCount]
  );

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.meta}>{items ? headerMeta : '—'}</Text>
        </View>

        <Pressable
          onPress={markAllRead}
          style={({ pressed }) => [styles.smallButton, pressed ? styles.smallButtonPressed : null]}
          accessibilityRole="button"
        >
          <Text style={styles.smallButtonText}>Mark all read</Text>
        </Pressable>
      </View>

      <View style={styles.filters}>
        <Pressable
          onPress={() => setFilter('all')}
          style={({ pressed }) => [
            styles.filterButton,
            filter === 'all' ? styles.filterButtonActive : null,
            pressed ? styles.filterButtonPressed : null,
          ]}
          accessibilityRole="button"
        >
          <Text style={[styles.filterText, filter === 'all' ? styles.filterTextActive : null]}>All</Text>
        </Pressable>
        <Pressable
          onPress={() => setFilter('unread')}
          style={({ pressed }) => [
            styles.filterButton,
            filter === 'unread' ? styles.filterButtonActive : null,
            pressed ? styles.filterButtonPressed : null,
          ]}
          accessibilityRole="button"
        >
          <Text style={[styles.filterText, filter === 'unread' ? styles.filterTextActive : null]}>Unread</Text>
        </Pressable>
      </View>

      {error ? <ErrorBanner message={error} onRetry={refresh} /> : null}

      {loading && !items ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading notifications…</Text>
        </View>
      ) : (
        <FlatList
          data={items ?? []}
          keyExtractor={(n) => n.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onOpen(item)}
              style={({ pressed }) => [
                styles.row,
                !item.read ? styles.rowUnread : null,
                pressed ? styles.rowPressed : null,
              ]}
              accessibilityRole="button"
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, !item.read ? styles.rowTitleUnread : null]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.rowSub} numberOfLines={2}>
                  {item.message}
                </Text>
                <Text style={styles.rowMeta}>
                  {item.type}{item.createdAt ? ` • ${String(item.createdAt).slice(0, 19).replace('T', ' ')}` : ''}
                </Text>
              </View>
              {!item.read ? <View style={styles.dot} /> : null}
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.empty}>No notifications.</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },
  meta: {
    marginTop: 2,
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
  },
  smallButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#111827',
  },
  smallButtonPressed: {
    opacity: 0.85,
  },
  smallButtonText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 12,
  },
  filters: {
    flexDirection: 'row',
    gap: 10,
  },
  filterButton: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  filterButtonPressed: {
    opacity: 0.9,
  },
  filterText: {
    fontWeight: '900',
    color: '#111827',
  },
  filterTextActive: {
    color: '#ffffff',
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
    gap: 10,
  },
  rowUnread: {
    backgroundColor: '#fff7ed',
    borderColor: '#fdba74',
  },
  rowPressed: {
    opacity: 0.85,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111827',
  },
  rowTitleUnread: {
    color: '#9a3412',
  },
  rowSub: {
    marginTop: 3,
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  rowMeta: {
    marginTop: 6,
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '700',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#f97316',
  },
  empty: {
    color: '#6b7280',
    fontWeight: '700',
  },
});
