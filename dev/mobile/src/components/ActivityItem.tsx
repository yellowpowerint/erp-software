/**
 * Activity Item Component
 * Session M2.1 - Recent activity list item
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../theme.config';

interface ActivityItemProps {
  type: 'approval' | 'task' | 'incident' | 'alert';
  title: string;
  description: string;
  timestamp: string;
  status?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  onPress: () => void;
}

const TYPE_CONFIG = {
  approval: { icon: '✓', color: theme.colors.primary },
  task: { icon: '📋', color: theme.colors.info },
  incident: { icon: '⚠️', color: theme.colors.error },
  alert: { icon: '🔔', color: theme.colors.warning },
};

const PRIORITY_COLORS = {
  low: theme.colors.success,
  medium: theme.colors.warning,
  high: theme.colors.error,
  critical: '#DC2626',
};

export default function ActivityItem({ 
  type, 
  title, 
  description, 
  timestamp, 
  status, 
  priority,
  onPress 
}: ActivityItemProps) {
  const config = TYPE_CONFIG[type];
  const timeAgo = getTimeAgo(timestamp);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconContainer, { backgroundColor: config.color + '20' }]}>
        <Text style={styles.icon}>{config.icon}</Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {priority && (
            <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLORS[priority] }]}>
              <Text style={styles.priorityText}>{priority.toUpperCase()}</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.description} numberOfLines={2}>{description}</Text>
        
        <View style={styles.footer}>
          <Text style={styles.timestamp}>{timeAgo}</Text>
          {status && (
            <>
              <Text style={styles.separator}>•</Text>
              <Text style={styles.status}>{status}</Text>
            </>
          )}
        </View>
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
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text,
    marginRight: theme.spacing.xs,
  },
  priorityBadge: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  priorityText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
  },
  description: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  separator: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginHorizontal: theme.spacing.xs,
  },
  status: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
  },
});
