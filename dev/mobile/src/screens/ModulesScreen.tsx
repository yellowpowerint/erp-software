import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, Pressable, RefreshControl } from 'react-native';
import { colors } from '../theme/colors';
import { useAuth } from '../auth/AuthContext';
import { canAccessOptional } from '../access/rbac';
import type { MobileResource } from '../access/rbac';

type Module = {
  id: string;
  name: string;
  description: string;
  icon: string;
  route?: string;
  resource?: MobileResource;
};

const modules: Module[] = [
  { id: 'inventory', name: 'Inventory', description: 'Manage stock and items', icon: '📦', resource: 'MODULE_INVENTORY' },
  { id: 'projects', name: 'Projects', description: 'Track project progress', icon: '🏗️', resource: 'MODULE_PROJECTS' },
  { id: 'assets', name: 'Assets', description: 'Asset management', icon: '🏭', resource: 'MODULE_ASSETS' },
  { id: 'expenses', name: 'Expenses', description: 'Budget and expenses', icon: '💰', resource: 'MODULE_EXPENSES' },
  { id: 'employees', name: 'Employees', description: 'HR management', icon: '👥', resource: 'MODULE_EMPLOYEES' },
  { id: 'inspections', name: 'Inspections', description: 'Safety inspections', icon: '🔍', resource: 'MODULE_SAFETY_INSPECTIONS' },
  { id: 'trainings', name: 'Trainings', description: 'Training programs', icon: '📚', resource: 'MODULE_SAFETY_TRAININGS' },
  { id: 'vendors', name: 'Vendors', description: 'Vendor management', icon: '🤝' },
  { id: 'procurement', name: 'Procurement', description: 'Purchase orders', icon: '🛒' },
  { id: 'maintenance', name: 'Maintenance', description: 'Equipment maintenance', icon: '🔧' },
  { id: 'reports', name: 'Reports', description: 'Analytics and reports', icon: '📊' },
  { id: 'documents', name: 'Documents', description: 'Document management', icon: '📄', resource: 'MODULE_DOCUMENTS' },
];

export function ModulesScreen() {
  const { me } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const visibleModules = modules.filter((m) => m.resource && canAccessOptional(me?.role, m.resource));

  const handleModulePress = (module: Module) => {
    if (!module.resource || !canAccessOptional(me?.role, module.resource)) {
      Alert.alert('Access Denied', 'You do not have permission to access this module.');
      return;
    }
    // Navigation will be implemented per module
    console.log('Module pressed:', module.name);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh - in real app, this would reload module data
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.accent}
          colors={[colors.accent]}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Modules</Text>
        <Text style={styles.subtitle}>Access all ERP modules</Text>
      </View>

      {visibleModules.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No modules available</Text>
          <Text style={styles.emptyStateSubtitle}>Your role does not have access to any modules.</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {visibleModules.map((module) => (
            <Pressable
              key={module.id}
              style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
              ]}
              onPress={() => handleModulePress(module)}
            >
              <Text style={styles.icon}>{module.icon}</Text>
              <Text style={styles.moduleName}>{module.name}</Text>
              <Text style={styles.moduleDescription}>{module.description}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.secondary,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.foreground,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  icon: {
    fontSize: 36,
    marginBottom: 8,
  },
  moduleName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 4,
    textAlign: 'center',
  },
  moduleDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
