/**
 * Modules Screen - ERP Modules Grid
 * Session M0.1 - Modules tab placeholder
 * Phase 1 - Capabilities-driven module visibility
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme.config';
import { useCapabilities } from '../hooks/useCapabilities';
import { Button } from '../components';

export default function ModulesScreen() {
  const navigation = useNavigation();
  const { loaded, status, error, refresh, modules: allowedModules } = useCapabilities();
  
  const allModules = [
    { id: 'inventory', title: 'Inventory', subtitle: 'Stock management', route: 'InventorySearch' as const },
    { id: 'receiving', title: 'Receiving', subtitle: 'Goods receipt', route: 'InventorySearch' as const },
    { id: 'safety', title: 'Safety', subtitle: 'View incidents', route: 'IncidentList' as const },
    { id: 'employees', title: 'HR', subtitle: 'Employee directory', route: 'EmployeeDirectory' as const },
    { id: 'leave', title: 'Leave', subtitle: 'Leave requests', route: 'LeaveRequestsList' as const },
    { id: 'expenses', title: 'Expenses', subtitle: 'Expense claims', route: 'ExpensesList' as const },
    { id: 'projects', title: 'Projects', subtitle: 'Project tracking', route: 'ProjectsList' as const },
    { id: 'documents', title: 'Documents', subtitle: 'Document library', route: 'DocumentList' as const },
  ];
  
  const modules = useMemo(() => {
    if (!loaded) return [];
    return allModules.filter((module) => allowedModules.includes(module.id));
  }, [allowedModules, loaded]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
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
      {status === 'error' ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.errorTitle}>Unable to load permissions</Text>
          <Text style={styles.loadingText}>{error || 'Please try again.'}</Text>
          <View style={styles.retryWrap}>
            <Button title="Retry" onPress={() => refresh()} />
          </View>
        </View>
      ) : !loaded ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading modules...</Text>
        </View>
      ) : (
        <View style={styles.gridContainer}>
          {modules.map((module) => (
            <TouchableOpacity key={module.id} style={styles.moduleCard} onPress={() => (navigation as any).navigate(module.route)}>
              <Text style={styles.moduleTitle}>{module.title}</Text>
              <Text style={styles.moduleSubtitle}>{module.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    padding: theme.spacing.md,
  },
  loadingContainer: {
    flex: 1,
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.sm,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  errorTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  retryWrap: {
    marginTop: theme.spacing.lg,
    width: '100%',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
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
  moduleCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    width: '48%',
  },
  moduleTitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  moduleSubtitle: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
});
