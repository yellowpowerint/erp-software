/**
 * Modules Screen - ERP Modules Grid
 * Session M0.1 - Modules tab placeholder
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme.config';

export default function ModulesScreen() {
  const navigation = useNavigation();
  const modules = [
    { id: 'inventory', title: 'Inventory', subtitle: 'Stock management', route: 'InventorySearch' as const, available: true },
    { id: 'safety', title: 'Safety', subtitle: 'View incidents', route: 'IncidentList' as const, available: true },
    { id: 'hr', title: 'HR', subtitle: 'Employee directory', route: 'EmployeeDirectory' as const, available: true },
    { id: 'finance', title: 'Finance', subtitle: 'Expenses', route: 'ExpensesList' as const, available: true },
    { id: 'projects', title: 'Projects', subtitle: 'Project tracking', route: 'ProjectsList' as const, available: true },
    { id: 'documents', title: 'Documents', subtitle: 'Document library', route: 'DocumentList' as const, available: true },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Modules</Text>
          <Text style={styles.subtitle}>Access ERP modules</Text>
        </View>
        <TouchableOpacity 
          style={styles.outboxButton} 
          onPress={() => (navigation as any).navigate('Outbox')}
        >
          <Text style={styles.outboxButtonText}>📋 Outbox</Text>
        </TouchableOpacity>
      </View>
      {modules.map((module) => (
        module.available ? (
          <TouchableOpacity key={module.id} style={styles.moduleCard} onPress={() => (navigation as any).navigate(module.route)}>
            <Text style={styles.moduleTitle}>{module.title}</Text>
            <Text style={styles.moduleSubtitle}>{module.subtitle}</Text>
          </TouchableOpacity>
        ) : null
      ))}
      
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>
          Session M4 will implement:{'\n\n'}
          • Inventory module{'\n'}
          • Safety module{'\n'}
          • HR module{'\n'}
          • Finance module{'\n'}
          • Projects module{'\n'}
          • Documents module
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
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
    marginBottom: theme.spacing.sm,
  },
  outboxButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  outboxButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.primary,
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
  moduleCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  moduleTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  moduleSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
});
