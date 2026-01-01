/**
 * Config Gate Provider
 * Session M1.4 - App configuration gate with version and maintenance checks
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { configService, MobileConfig } from '../services/config.service';
import ForceUpdateScreen from '../screens/ForceUpdateScreen';
import MaintenanceScreen from '../screens/MaintenanceScreen';
import { theme } from '../../theme.config';
import Constants from 'expo-constants';

interface ConfigGateProps {
  children: React.ReactNode;
}

const APP_VERSION = Constants.expoConfig?.version || '1.0.0';

export default function ConfigGate({ children }: ConfigGateProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState<MobileConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const fetchedConfig = await configService.fetchConfig();
      setConfig(fetchedConfig);
    } catch (err: any) {
      console.error('Config gate error:', err);
      setError(err.message || 'Failed to load configuration');
      
      const cachedConfig = await configService.getCachedConfig();
      if (cachedConfig) {
        setConfig(cachedConfig);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>⛏️</Text>
        </View>
        <Text style={styles.loadingTitle}>Mining ERP</Text>
        <ActivityIndicator size="large" color={theme.colors.primary} style={styles.spinner} />
        <Text style={styles.loadingText}>Loading configuration...</Text>
      </View>
    );
  }

  if (error && !config) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Configuration Error</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <Text style={styles.errorHint}>
          Please check your internet connection and try again.
        </Text>
      </View>
    );
  }

  if (!config) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>No Configuration</Text>
        <Text style={styles.errorMessage}>
          Unable to load app configuration.
        </Text>
      </View>
    );
  }

  if (config.maintenance.enabled) {
    return <MaintenanceScreen message={config.maintenance.message} />;
  }

  const minimumVersion = config.minimumVersions.android;
  const isSupported = configService.isVersionSupported(APP_VERSION, minimumVersion);
  if (!isSupported || config.forceUpdateMessage) {
    return (
      <ForceUpdateScreen
        currentVersion={APP_VERSION}
        minimumVersion={minimumVersion}
      />
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  logoText: {
    fontSize: 40,
  },
  loadingTitle: {
    fontSize: theme.typography.fontSize.xxl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xl,
  },
  spinner: {
    marginBottom: theme.spacing.md,
  },
  loadingText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.xl,
  },
  errorIcon: {
    fontSize: 60,
    marginBottom: theme.spacing.lg,
  },
  errorTitle: {
    fontSize: theme.typography.fontSize.xxl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  errorHint: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
