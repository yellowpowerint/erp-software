/**
 * Auth Provider
 * Session M1.2 - Session bootstrap and auth state management
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { notificationPreferencesService } from '../services/notificationPreferences.service';
import { theme } from '../../theme.config';

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const isLoading = useAuthStore((state) => state.isLoading);
  const hasBootstrapped = useRef(false);

  useEffect(() => {
    if (hasBootstrapped.current) return;
    
    hasBootstrapped.current = true;
    
    const initializeAuth = async () => {
      await useAuthStore.getState().bootstrap();
      
      // Preload notification preferences on app start
      if (useAuthStore.getState().isAuthenticated) {
        notificationPreferencesService.getPreferences().catch((err) => {
          console.error('Failed to preload notification preferences:', err);
        });
      }
    };
    
    initializeAuth();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>⛏️</Text>
        </View>
        <Text style={styles.loadingTitle}>Mining ERP</Text>
        <ActivityIndicator size="large" color={theme.colors.primary} style={styles.spinner} />
        <Text style={styles.loadingText}>Loading your session...</Text>
      </View>
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
});
