/**
 * More Screen - Settings and Profile
 * Session M0.1 - More tab placeholder
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme.config';

export default function MoreScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>More</Text>
      <Text style={styles.subtitle}>Profile + Settings + Support</Text>
      
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>
          Session M1+ will implement:{'\n\n'}
          • User profile{'\n'}
          • App settings{'\n'}
          • Notifications preferences{'\n'}
          • Support and help{'\n'}
          • Sign out
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
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
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
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
