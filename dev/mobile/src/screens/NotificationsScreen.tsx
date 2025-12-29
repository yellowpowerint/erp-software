/**
 * Notifications Screen
 * Session M2.2 - In-app notification inbox with pagination and deep links
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NotificationItem } from '../components';
import { notificationsService, Notification } from '../services/notifications.service';
import { useNotificationsStore } from '../store/notificationsStore';
import { theme } from '../../theme.config';

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const { fetchUnreadCount, decrementUnreadCount, clearUnreadCount } = useNotificationsStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async (pageNum = 1, append = false) => {
    try {
      setError(null);
      const response = await notificationsService.getNotifications(pageNum, 20);
      
      if (append) {
        setNotifications((prev) => [...prev, ...response.notifications]);
      } else {
        setNotifications(response.notifications);
      }
      
      setPage(pageNum);
      setHasMore(response.hasMore);
      
      if (pageNum === 1) {
        fetchUnreadCount();
      }
    } catch (err: any) {
      console.error('Failed to load notifications:', err);
      setError('Failed to load notifications. Pull to refresh.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadNotifications(1, false);
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      setIsLoadingMore(true);
      loadNotifications(page + 1, true);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    try {
      if (!notification.isRead) {
        await notificationsService.markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
        );
        decrementUnreadCount();
      }

      const deepLink = notificationsService.parseDeepLink(notification);
      if (deepLink) {
        const parentNav = navigation.getParent();
        if (parentNav && deepLink.screen) {
          if (deepLink.params) {
            (parentNav.navigate as any)(deepLink.screen, deepLink.params);
          } else {
            (parentNav.navigate as any)(deepLink.screen);
          }
        }
      }
    } catch (err) {
      console.error('Failed to handle notification tap:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      clearUnreadCount();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Notifications</Text>
      {notifications.some((n) => !n.isRead) && (
        <TouchableOpacity onPress={handleMarkAllAsRead}>
          <Text style={styles.markAllButton}>Mark all read</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>📭</Text>
        <Text style={styles.emptyText}>No notifications</Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationItem
            id={item.id}
            title={item.title}
            body={item.body}
            type={item.type}
            isRead={item.isRead}
            createdAt={item.createdAt}
            onPress={() => handleNotificationPress(item)}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  errorBanner: {
    backgroundColor: theme.colors.error + '20',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.error,
  },
  errorText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.error,
    textAlign: 'center',
  },
  listContent: {
    padding: theme.spacing.md,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
  },
  markAllButton: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.primary,
  },
  footer: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.md,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
});
