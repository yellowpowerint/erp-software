/**
 * Modules Stack Navigator
 * Session M1.1 - Stack navigator for Modules tab
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ModulesStackParamList } from './types';
import { theme } from '../../theme.config';

import ModulesScreen from '../screens/ModulesScreen';

const Stack = createStackNavigator<ModulesStackParamList>();

export default function ModulesNavigator() {
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
      <Stack.Screen name="ModulesMain" component={ModulesScreen} options={{ title: 'Modules' }} />
    </Stack.Navigator>
  );
}
