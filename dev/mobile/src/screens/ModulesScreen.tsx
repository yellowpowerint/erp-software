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
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Modules</Text>
      <Text style={styles.subtitle}>Access ERP modules</Text>
      <TouchableOpacity style={styles.moduleCard} onPress={() => (navigation as any).navigate('InventorySearch')}>
        <Text style={styles.moduleTitle}>Inventory</Text>
        <Text style={styles.moduleSubtitle}>Stock management</Text>
      </TouchableOpacity>
      
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
