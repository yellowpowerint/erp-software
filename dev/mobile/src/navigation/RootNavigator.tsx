import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../auth/AuthContext';
import { useMobileConfig } from '../config/MobileConfigContext';
import { ErrorBanner } from '../components/ErrorBanner';
import { ForceUpdateScreen } from '../screens/ForceUpdateScreen';
import { AuthStack } from './AuthStack';
import { AppTabs } from './AppTabs';

export function RootNavigator() {
  const { isBooting, token } = useAuth();
  const {
    isBooting: isConfigBooting,
    error: configError,
    refresh: refreshConfig,
    isUpdateRequired,
    installedVersion,
    requiredVersion,
    config,
  } = useMobileConfig();

  if (isConfigBooting || isBooting) {
    return (
      <View style={styles.bootContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (configError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Unable to load app configuration</Text>
        <ErrorBanner
          message={configError}
          onRetry={async () => {
            await refreshConfig();
          }}
        />
      </View>
    );
  }

  if (isUpdateRequired && requiredVersion && config) {
    return (
      <ForceUpdateScreen
        installedVersion={installedVersion}
        requiredVersion={requiredVersion}
        iosUrl={config.storeUrls.ios}
        androidUrl={config.storeUrls.android}
      />
    );
  }

  return <NavigationContainer>{token ? <AppTabs /> : <AuthStack />}</NavigationContainer>;
}

const styles = StyleSheet.create({
  bootContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    gap: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
});
