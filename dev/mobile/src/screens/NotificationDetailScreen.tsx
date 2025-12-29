/**
 * Notification Detail Screen
 * Session M2.2 - Fallback detail view
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { notificationsService, Notification } from '../services/notifications.service';
import { useNotificationsStore } from '../store/notificationsStore';
import { theme } from '../../theme.config';

export default function NotificationDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { decrementUnreadCount } = useNotificationsStore();
  const { notificationId } = route.params || {};

  const [notification, setNotification] = useState<Notification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, [notificationId]);

  const load = async () => {
    if (!notificationId) {
      setError('Notification not found');
      setIsLoading(false);
      return;
    }
    try {
      setError(null);
      const result = await notificationsService.getNotificationById(notificationId);
      setNotification(result);
      if (!result.isRead) {
        await notificationsService.markAsRead(notificationId);
        decrementUnreadCount();
      }
    } catch (err) {
      console.error('Failed to load notification detail:', err);
      setError('Unable to load notification');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading notification...</Text>
      </View>
    );
  }

  if (error || !notification) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || 'Notification not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={load}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View style={styles.iconBadge}>
          <Text style={styles.icon}>{getIcon(notification.type)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{notification.title}</Text>
          <Text style={styles.timestamp}>{new Date(notification.createdAt).toLocaleString()}</Text>
        </View>
      </View>

      <Text style={styles.body}>{notification.body}</Text>

      {(notification.entityType || notification.entityId) && (
        <View style={styles.metaCard}>
          <Text style={styles.metaLabel}>Linked Item</Text>
          <Text style={styles.metaValue}>
            {notification.entityType || 'entity'} {notification.entityId || ''}
          </Text>
        </View>
      )}

      {notification.deepLink && (
        <View style={styles.metaCard}>
          <Text style={styles.metaLabel}>Deep Link</Text>
          <Text style={styles.metaValue}>{notification.deepLink}</Text>
        </View>
      )}
    </ScrollView>
  );
}

function getIcon(type: Notification['type']) {
  switch (type) {
    case 'approval':
      return '✓';
    case 'task':
      return '📋';
    case 'alert':
      return '🔔';
    case 'incident':
      return '⚠️';
    default:
      return '📬';
  }
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  errorText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  retryText: {
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.semibold,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 22,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
  },
  timestamp: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  body: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
    lineHeight: 22,
  },
  metaCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  metaLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  metaValue: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
  },
});
