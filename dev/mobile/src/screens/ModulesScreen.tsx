import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, Pressable, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { useAuth } from '../auth/AuthContext';
import { useMobileConfig } from '../config/MobileConfigContext';
import { canAccessOptional } from '../access/rbac';
import type { ModulesStackParamList } from '../navigation/ModulesStack';
import { MODULE_CATALOG } from '../config/modulesCatalog';
import type { ModuleCatalogItem } from '../config/modulesCatalog';

type NavigationProp = NativeStackNavigationProp<ModulesStackParamList>;

export function ModulesScreen() {
  const { me, refreshMe } = useAuth();
  const { refresh: refreshConfig } = useMobileConfig();
  const navigation = useNavigation<NavigationProp>();
  const [refreshing, setRefreshing] = useState(false);

  const visibleModules = MODULE_CATALOG.filter((m) => canAccessOptional(me?.role, m.resource));

  const handleModulePress = useCallback((module: ModuleCatalogItem) => {
    if (!canAccessOptional(me?.role, module.resource)) {
      Alert.alert('Access Denied', 'You do not have permission to access this module.');
      return;
    }

    if (!module.enabled) {
      Alert.alert('Coming Soon', `${module.name} is not yet available on mobile.`);
      return;
    }

    if (module.target) {
      if (module.target.tab === 'Modules' && module.target.screen) {
        // Navigate within ModulesStack
        if (module.target.screen === 'PurchaseOrders') {
          navigation.navigate('ProcurementStack', { screen: 'PurchaseOrders' });
        } else if (module.target.screen === 'FleetAssets') {
          navigation.navigate('FleetStack', { screen: 'FleetAssets' });
        } else if (module.target.screen === 'ReportsDashboard') {
          navigation.navigate('ReportsStack', { screen: 'ReportsDashboard' });
        } else if (module.target.screen === 'ProductionLogs') {
          navigation.navigate('OperationsStack', { screen: 'ProductionLogs' });
        }
      } else {
        // Navigate to other tabs
        const rootNav = navigation.getParent();
        if (rootNav && module.target.screen) {
          rootNav.navigate(module.target.tab as any, { screen: module.target.screen, params: module.target.params } as any);
        } else if (rootNav) {
          rootNav.navigate(module.target.tab as any);
        }
      }
    }
  }, [me?.role, navigation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refreshMe(),
        refreshConfig(),
      ]);
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshMe, refreshConfig]);

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
              <View style={styles.iconContainer}>
                <Ionicons name={module.icon} size={32} color={module.enabled ? colors.accent : colors.mutedForeground} />
                {!module.enabled && (
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonText}>Soon</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.moduleName, !module.enabled && styles.moduleNameDisabled]}>{module.name}</Text>
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
  iconContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  comingSoonBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  comingSoonText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.background,
  },
  moduleNameDisabled: {
    color: colors.mutedForeground,
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
