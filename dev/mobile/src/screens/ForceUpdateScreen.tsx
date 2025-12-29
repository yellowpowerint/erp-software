/**
 * Force Update Screen
 * Session M1.4 - Blocks app usage when update is required
 */

import React from 'react';
import { View, Text, StyleSheet, Linking, Platform } from 'react-native';
import { Button } from '../components';
import { theme } from '../../theme.config';

interface ForceUpdateScreenProps {
  currentVersion: string;
  minimumVersion: string;
}

export default function ForceUpdateScreen({ currentVersion, minimumVersion }: ForceUpdateScreenProps) {
  const handleUpdate = () => {
    const storeUrl = Platform.select({
      ios: 'https://apps.apple.com/app/mining-erp/id123456789',
      android: 'https://play.google.com/store/apps/details?id=com.yellowpower.miningerp',
    });

    if (storeUrl) {
      Linking.openURL(storeUrl);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🔄</Text>
        </View>

        <Text style={styles.title}>Update Required</Text>
        
        <Text style={styles.message}>
          A new version of Mining ERP is available. Please update to continue using the app.
        </Text>

        <View style={styles.versionInfo}>
          <View style={styles.versionRow}>
            <Text style={styles.versionLabel}>Current Version:</Text>
            <Text style={styles.versionValue}>{currentVersion}</Text>
          </View>
          <View style={styles.versionRow}>
            <Text style={styles.versionLabel}>Required Version:</Text>
            <Text style={styles.versionValue}>{minimumVersion}</Text>
          </View>
        </View>

        <Button
          title="Update Now"
          onPress={handleUpdate}
          fullWidth
          style={styles.updateButton}
        />

        <Text style={styles.footer}>
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
    backgroundColor: theme.colors.primary + '20',
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
  },
  versionInfo: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  versionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  versionLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
  },
  versionValue: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text,
  },
  updateButton: {
    marginBottom: theme.spacing.lg,
  },
  footer: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xl,
  },
});
