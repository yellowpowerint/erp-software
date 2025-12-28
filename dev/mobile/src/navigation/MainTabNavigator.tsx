/**
 * Main Tab Navigator
 * Session M0.1 - 4-tab bottom navigation (Home, Work, Modules, More)
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { MainTabParamList } from './types';
import { theme } from '../../theme.config';

import HomeNavigator from './HomeNavigator';
import WorkNavigator from './WorkNavigator';
import ModulesScreen from '../screens/ModulesScreen';
import MoreScreen from '../screens/MoreScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
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
          fontWeight: theme.typography.fontWeight.medium,
        },
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: theme.typography.fontWeight.bold,
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
        component={ModulesScreen}
        options={{
          title: 'Modules',
          tabBarLabel: 'Modules',
          tabBarIcon: ({ color }) => <TabIcon name="📋" color={color} />,
        }}
      />
      <Tab.Screen 
        name="More" 
        component={MoreScreen}
        options={{
          title: 'More',
          tabBarLabel: 'More',
          tabBarIcon: ({ color }) => <TabIcon name="⚙️" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

// Simple icon component (will be replaced with proper icons in M1)
function TabIcon({ name, color }: { name: string; color: string }) {
  return (
    <Text style={{ fontSize: 20, color }}>{name}</Text>
  );
}
