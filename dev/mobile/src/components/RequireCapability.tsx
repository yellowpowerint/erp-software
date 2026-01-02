import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from '../../theme.config';
import { useAuthStore } from '../store/authStore';
import { useCapabilities } from '../hooks/useCapabilities';
import Button from './Button';
import NoAccessScreen from '../screens/NoAccessScreen';

type RequireCapabilityProps = {
  moduleId?: string;
  anyModuleIds?: string[];
  capability?: string;
  resource?: string;
  message?: string;
  children: React.ReactNode;
};

export default function RequireCapability({
  moduleId,
  anyModuleIds,
  capability,
  resource,
  message,
  children,
}: RequireCapabilityProps) {
  const capabilitiesStatus = useAuthStore((s) => s.capabilitiesStatus);
  const capabilitiesError = useAuthStore((s) => s.capabilitiesError);
  const refreshCapabilities = useAuthStore((s) => s.refreshCapabilities);
  const { hasModule, can } = useCapabilities();

  if (capabilitiesStatus === 'error') {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Unable to load permissions</Text>
        <Text style={styles.text}>{capabilitiesError || 'Please try again.'}</Text>
        <View style={styles.actions}>
          <Button title="Retry" onPress={() => refreshCapabilities()} />
        </View>
      </View>
    );
  }

  if (capabilitiesStatus === 'loading' || capabilitiesStatus === 'idle') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.text}>Loading permissions...</Text>
      </View>
    );
  }

  if (moduleId && !hasModule(moduleId)) {
    return (
      <NoAccessScreen
        route={{
          params: {
            resource: resource || moduleId,
            message: message || 'You do not have permission to access this resource.',
          },
        }}
      />
    );
  }

  if (anyModuleIds && anyModuleIds.length > 0) {
    const allowed = anyModuleIds.some((m) => hasModule(m));
    if (!allowed) {
      return (
        <NoAccessScreen
          route={{
            params: {
              resource: resource || anyModuleIds.join(','),
              message: message || 'You do not have permission to access this resource.',
            },
          }}
        />
      );
    }
  }

  if (capability && !can(capability)) {
    return (
      <NoAccessScreen
        route={{
          params: {
            resource: resource || capability,
            message: message || 'You do not have permission to perform this action.',
          },
        }}
      />
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  errorTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  text: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  actions: {
    marginTop: theme.spacing.lg,
    width: '100%',
  },
});
