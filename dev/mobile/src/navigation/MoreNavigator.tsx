/**
 * More Stack Navigator
 * Session M1.1 - Stack navigator for More tab
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { MoreStackParamList } from './types';
import { theme } from '../../theme.config';

import MoreScreen from '../screens/MoreScreen';
import NotificationPreferencesScreen from '../screens/NotificationPreferencesScreen';

const Stack = createStackNavigator<MoreStackParamList>();

export default function MoreNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontFamily: theme.typography.fontFamily.bold,
        },
      }}
    >
      <Stack.Screen name="MoreMain" component={MoreScreen} options={{ title: 'More' }} />
      <Stack.Screen
        name="NotificationPreferences"
        component={NotificationPreferencesScreen}
        options={{ title: 'Notification Preferences' }}
      />
    </Stack.Navigator>
  );
}
