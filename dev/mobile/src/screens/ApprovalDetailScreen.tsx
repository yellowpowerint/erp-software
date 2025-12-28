/**
 * Approval Detail Screen
 * Session M0.1 - Deep link target for approvals
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../theme.config';

export default function ApprovalDetailScreen({ route, navigation }: any) {
  const { approvalId } = route.params;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Approval Detail</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>PENDING</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.label}>Approval ID</Text>
        <Text style={styles.value}>{approvalId}</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.label}>Deep Link Route</Text>
        <Text style={styles.valueCode}>miningerp://work/approvals/{approvalId}</Text>
      </View>

      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>
          Session M3 will implement:{'\n\n'}
          • Full approval details{'\n'}
          • Approve/Reject buttons{'\n'}
          • Comment functionality{'\n'}
          • Approval history{'\n'}
          • Attachments viewer
        </Text>
      </View>

      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>← Back to Work</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  badge: {
    backgroundColor: theme.colors.warning,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  value: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeight.medium,
  },
  valueCode: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text,
    fontFamily: 'monospace',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  placeholder: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  placeholderText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  backButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});
