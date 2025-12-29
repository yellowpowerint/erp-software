/**
 * Notification Item Component
 * Session M2.2 - Notification list item
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../theme.config';

interface NotificationItemProps {
  id: string;
  title: string;
  body: string;
  type: 'approval' | 'task' | 'alert' | 'incident' | 'general';
  isRead: boolean;
  createdAt: string;
  onPress: () => void;
}

const TYPE_CONFIG = {
  approval: { icon: '✓', color: theme.colors.primary },
  task: { icon: '📋', color: theme.colors.info },
  alert: { icon: '🔔', color: theme.colors.warning },
  incident: { icon: '⚠️', color: theme.colors.error },
  general: { icon: '📬', color: theme.colors.textSecondary },
};

export default function NotificationItem({
  title,
  body,
  type,
  isRead,
  createdAt,
  onPress,
}: NotificationItemProps) {
  const config = TYPE_CONFIG[type];
  const timeAgo = getTimeAgo(createdAt);

  return (
    <TouchableOpacity
      style={[styles.container, !isRead && styles.unread]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: config.color + '20' }]}>
        <Text style={styles.icon}>{config.icon}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, !isRead && styles.titleUnread]} numberOfLines={1}>
            {title}
          </Text>
          {!isRead && <View style={styles.unreadDot} />}
        </View>

        <Text style={styles.body} numberOfLines={2}>
          {body}
        </Text>

        <Text style={styles.timestamp}>{timeAgo}</Text>
      </View>
    </TouchableOpacity>
  );
}

function getTimeAgo(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return time.toLocaleDateString();
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  unread: {
    backgroundColor: theme.colors.primary + '08',
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  title: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
    marginRight: theme.spacing.xs,
  },
  titleUnread: {
    fontFamily: theme.typography.fontFamily.bold,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  body: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    lineHeight: 18,
  },
  timestamp: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
});
