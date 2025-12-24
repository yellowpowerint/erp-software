import React from 'react';
import type { LinkingOptions } from '@react-navigation/native';
import { getStateFromPath, NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../auth/AuthContext';
import { useMobileConfig } from '../config/MobileConfigContext';
import { ErrorBanner } from '../components/ErrorBanner';
import { ForceUpdateScreen } from '../screens/ForceUpdateScreen';
import { AuthStack } from './AuthStack';
import type { AuthStackParamList } from './AuthStack';
import { AppTabs } from './AppTabs';
import type { AppTabsParamList } from './AppTabs';
import { APP_SCHEME } from '../config';

type RootParamList = AuthStackParamList & AppTabsParamList;

function normalizeLegacyPath(path: string): string {
  const p0 = String(path || '').trim();
  const p = p0.startsWith('/') ? p0.slice(1) : p0;
  if (!p) return p;

  if (p.startsWith('approvals/')) {
    return `work/${p}`;
  }
  if (p.startsWith('tasks/')) {
    return `work/${p}`;
  }

  return p;
}

const linking: LinkingOptions<RootParamList> = {
  prefixes: [`${APP_SCHEME}://`],
  getStateFromPath: (path, options) => {
    const normalized = normalizeLegacyPath(path);
    return getStateFromPath(normalized, options);
  },
  config: {
    screens: {
      Home: {
        screens: {
          Home: 'home',
        },
      },
      Work: {
        screens: {
          WorkHome: 'work',
          ApprovalsList: 'work/approvals',
          ApprovalLink: 'work/approvals/:id',
          ApprovalDetail: {
            path: 'work/approvals/:type/:id',
            parse: {
              type: (v: string) => String(v || '').toUpperCase(),
            },
            stringify: {
              type: (v: any) => String(v || '').toLowerCase(),
            },
          },
          TasksList: 'work/tasks',
          TaskDetail: 'work/tasks/:id',
        },
      },
      Modules: 'modules',
      Notifications: {
        screens: {
          Notifications: 'notifications',
          NotificationDetail: 'notifications/:id',
        },
      },
      More: {
        screens: {
          MoreHome: 'more',
          NotificationPreferences: 'more/notification-preferences',
        },
      },
      Login: 'login',
    },
  },
};

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

  return (
    <NavigationContainer<RootParamList> linking={linking}>
      {token ? <AppTabs /> : <AuthStack />}
    </NavigationContainer>
  );
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
