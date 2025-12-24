import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

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

export function NotificationDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<NotificationsStackParamList, 'NotificationDetail'>>();
  const { refreshUnreadCount } = useNotifications();

  const [item, setItem] = useState<NotificationItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await http.get<NotificationItem>(`/notifications/${route.params.id}`);
      setItem(res.data);
    } catch (e: any) {
      const parsed = parseApiError(e, API_BASE_URL);
      const statusPart = parsed.status ? ` (${parsed.status})` : '';
      setError(`Failed to load notification${statusPart}: ${parsed.message}\nAPI: ${API_BASE_URL}`);
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [route.params.id]);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = useCallback(async () => {
    if (!item || item.read) return;
    try {
      await http.post(`/notifications/${item.id}/read`);
      setItem((prev) => (prev ? { ...prev, read: true } : prev));
      await refreshUnreadCount();
    } catch (e: any) {
      const parsed = parseApiError(e, API_BASE_URL);
      Alert.alert('Failed to mark as read', parsed.message);
    }
  }, [item, refreshUnreadCount]);

  const deleteNotification = useCallback(async () => {
    if (!item) return;

    Alert.alert('Delete notification?', 'This will remove it from your inbox.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await http.post(`/notifications/${item.id}/delete`);
            await refreshUnreadCount();
            navigation.goBack();
          } catch (e: any) {
            const parsed = parseApiError(e, API_BASE_URL);
            Alert.alert('Failed to delete', parsed.message);
          }
        },
      },
    ]);
  }, [item, navigation, refreshUnreadCount]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {error ? <ErrorBanner message={error} onRetry={load} /> : null}

      {loading && !item ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      ) : null}

      {item ? (
        <View style={styles.card}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.meta}>
            {item.type} • {String(item.createdAt).slice(0, 19).replace('T', ' ')}
          </Text>

          <View style={styles.badges}>
            <View style={[styles.badge, item.read ? styles.badgeRead : styles.badgeUnread]}>
              <Text style={[styles.badgeText, item.read ? styles.badgeTextRead : styles.badgeTextUnread]}>
                {item.read ? 'READ' : 'UNREAD'}
              </Text>
            </View>
            {item.referenceType ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{String(item.referenceType).toUpperCase()}</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.message}>{item.message}</Text>

          {item.referenceId || item.referenceType ? (
            <View style={styles.reference}>
              <Text style={styles.referenceTitle}>Reference</Text>
              <Text style={styles.referenceText}>Type: {item.referenceType ?? '—'}</Text>
              <Text style={styles.referenceText}>ID: {item.referenceId ?? '—'}</Text>
            </View>
          ) : null}

          <View style={styles.actionsRow}>
            <Pressable
              onPress={markRead}
              disabled={item.read}
              style={({ pressed }) => [
                styles.button,
                item.read ? styles.buttonDisabled : styles.buttonPrimary,
                pressed ? styles.buttonPressed : null,
              ]}
              accessibilityRole="button"
            >
              <Text style={styles.buttonText}>{item.read ? 'Already read' : 'Mark as read'}</Text>
            </Pressable>

            <Pressable
              onPress={deleteNotification}
              style={({ pressed }) => [styles.button, styles.buttonDanger, pressed ? styles.buttonPressed : null]}
              accessibilityRole="button"
            >
              <Text style={styles.buttonText}>Delete</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#ffffff',
    flexGrow: 1,
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
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },
  meta: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '700',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
  },
  badgeUnread: {
    backgroundColor: '#fdba74',
  },
  badgeRead: {
    backgroundColor: '#d1fae5',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#111827',
  },
  badgeTextUnread: {
    color: '#9a3412',
  },
  badgeTextRead: {
    color: '#065f46',
  },
  message: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    lineHeight: 20,
  },
  reference: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#ffffff',
    gap: 6,
  },
  referenceTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#111827',
  },
  referenceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#111827',
  },
  buttonDanger: {
    backgroundColor: '#b91c1c',
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '900',
  },
});
