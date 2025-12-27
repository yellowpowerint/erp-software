import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../auth/AuthContext';
import { canAccessOptional } from '../access/rbac';
import { useMobileConfig } from '../config/MobileConfigContext';
import { HomeStack } from './HomeStack';
import type { HomeStackParamList } from './HomeStack';
import { ModulesScreen } from '../screens/ModulesScreen';
import { WorkStack } from './WorkStack';
import type { WorkStackParamList } from './WorkStack';
import { NotificationsStack } from './NotificationsStack';
import type { NotificationsStackParamList } from './NotificationsStack';
import { MoreStack } from './MoreStack';
import type { MoreStackParamList } from './MoreStack';
import { useNotifications } from '../notifications/NotificationsContext';
import { colors } from '../theme/colors';

export type AppTabsParamList = {
  Home: NavigatorScreenParams<HomeStackParamList> | undefined;
  Work: NavigatorScreenParams<WorkStackParamList> | undefined;
  Modules: undefined;
  Notifications: NavigatorScreenParams<NotificationsStackParamList> | undefined;
  More: NavigatorScreenParams<MoreStackParamList> | undefined;
};

const Tab = createBottomTabNavigator<AppTabsParamList>();

export function AppTabs() {
  const { me } = useAuth();
  const { config } = useMobileConfig();
  const flags = config?.featureFlags;
  const { unreadCount } = useNotifications();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      {flags?.home !== false && canAccessOptional(me?.role, 'TAB_HOME') ? (
        <Tab.Screen
          name="Home"
          component={HomeStack}
          options={{
            headerShown: false,
            tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
          }}
        />
      ) : null}
      {flags?.work !== false && canAccessOptional(me?.role, 'TAB_WORK') ? (
        <Tab.Screen
          name="Work"
          component={WorkStack}
          options={{
            headerShown: false,
            tabBarIcon: ({ color, size }) => <Ionicons name="briefcase" size={size} color={color} />,
          }}
        />
      ) : null}
      {flags?.modules !== false && canAccessOptional(me?.role, 'TAB_MODULES') ? (
        <Tab.Screen
          name="Modules"
          component={ModulesScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Ionicons name="apps" size={size} color={color} />,
          }}
        />
      ) : null}
      {flags?.notifications !== false && canAccessOptional(me?.role, 'TAB_NOTIFICATIONS') ? (
        <Tab.Screen
          name="Notifications"
          component={NotificationsStack}
          options={{
            headerShown: false,
            tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
            tabBarIcon: ({ color, size }) => <Ionicons name="notifications" size={size} color={color} />,
          }}
        />
      ) : null}
      {flags?.more !== false && canAccessOptional(me?.role, 'TAB_MORE') ? (
        <Tab.Screen
          name="More"
          component={MoreStack}
          options={{
            headerShown: false,
            tabBarIcon: ({ color, size }) => <Ionicons name="ellipsis-horizontal" size={size} color={color} />,
          }}
        />
      ) : null}
    </Tab.Navigator>
  );
}
