/**
 * Mining ERP Mobile App
 * Session M1.2 - App entry point with auth, navigation, deep linking, and Inter fonts
 * Yellow Power International
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import RootNavigator from './src/navigation/RootNavigator';
import AuthProvider from './src/providers/AuthProvider';
import ConfigGate from './src/providers/ConfigGate';
import { ErrorBoundary, OfflineBanner } from './src/components';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from './theme.config';

import { initSentry } from './src/config/sentry.config';

initSentry();

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <ConfigGate>
        <AuthProvider>
          <OfflineBanner />
          <RootNavigator />
          <StatusBar style="auto" />
        </AuthProvider>
      </ConfigGate>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
  },
});
