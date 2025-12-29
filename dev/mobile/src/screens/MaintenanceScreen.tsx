/**
 * Maintenance Screen
 * Session M1.4 - Displayed when app is in maintenance mode
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from '../../theme.config';

interface MaintenanceScreenProps {
  message?: string;
}

export default function MaintenanceScreen({ message }: MaintenanceScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🔧</Text>
        </View>

        <Text style={styles.title}>Under Maintenance</Text>
        
        <Text style={styles.message}>
          {message || 'We are currently performing scheduled maintenance. Please check back shortly.'}
        </Text>

        <ActivityIndicator 
          size="large" 
          color={theme.colors.primary} 
          style={styles.spinner}
        />

        <Text style={styles.footer}>
          Thank you for your patience
        </Text>
        
        <Text style={styles.company}>
          Yellow Power International
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.warning + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },
  icon: {
    fontSize: 50,
  },
  title: {
    fontSize: theme.typography.fontSize.xxxl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  message: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
  },
  spinner: {
    marginBottom: theme.spacing.xl,
  },
  footer: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  company: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
});
