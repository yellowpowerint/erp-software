/**
 * Work Screen - Approvals and Tasks List
 * Session M0.1 - Work tab placeholder
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../theme.config';

export default function WorkScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Work</Text>
      <Text style={styles.subtitle}>Approvals + Tasks</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Approvals</Text>
        <TouchableOpacity 
          style={styles.card}
          onPress={() => navigation.navigate('ApprovalDetail', { approvalId: 'demo-123' })}
        >
          <Text style={styles.cardText}>Tap to test deep link: Approval Detail</Text>
          <Text style={styles.cardSubtext}>miningerp://work/approvals/demo-123</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tasks</Text>
        <TouchableOpacity 
          style={styles.card}
          onPress={() => navigation.navigate('TaskDetail', { taskId: 'task-456' })}
        >
          <Text style={styles.cardText}>Tap to test deep link: Task Detail</Text>
          <Text style={styles.cardSubtext}>miningerp://work/tasks/task-456</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>
          Session M3 will implement:{'\n\n'}
          • Approvals list with filters{'\n'}
          • Tasks list with status{'\n'}
          • Approve/reject actions{'\n'}
          • Comments and history
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  cardText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  cardSubtext: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  placeholder: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
