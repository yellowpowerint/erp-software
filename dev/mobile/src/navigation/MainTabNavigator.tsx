/**
 * Main Tab Navigator
 * Session M0.1 - 4-tab bottom navigation (Home, Work, Modules, More)
 */

import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import { MainTabParamList } from './types';
import { theme } from '../../theme.config';
import { useNotificationsStore } from '../store/notificationsStore';

import HomeNavigator from './HomeNavigator';
import WorkNavigator from './WorkNavigator';
import ModulesNavigator from './ModulesNavigator';
import MoreNavigator from './MoreNavigator';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const { unreadCount, fetchUnreadCount } = useNotificationsStore();

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: theme.typography.fontSize.xs,
          fontFamily: theme.typography.fontFamily.medium,
        },
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontFamily: theme.typography.fontFamily.bold,
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeNavigator}
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <TabIcon name="🏠" color={color} />,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="Work" 
        component={WorkNavigator}
        options={{
          title: 'Work',
          tabBarLabel: 'Work',
          tabBarIcon: ({ color }) => <TabIcon name="💼" color={color} />,
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="Modules" 
        component={ModulesNavigator}
        options={{
          title: 'Modules',
          tabBarLabel: 'Modules',
          tabBarIcon: ({ color }) => <TabIcon name="📋" color={color} />,
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="More" 
        component={MoreNavigator}
        options={{
          title: 'More',
          tabBarLabel: 'More',
          tabBarIcon: ({ color }) => <TabIcon name="⚙️" color={color} />,
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}

// Simple icon component (will be replaced with proper icons in M1)
function TabIcon({ name, color }: { name: string; color: string }) {
  return (
    <Text style={{ fontSize: 20, color, fontFamily: theme.typography.fontFamily.regular }}>{name}</Text>
  );
}
