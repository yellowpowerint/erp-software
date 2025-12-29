/**
 * Modules Stack Navigator
 * Session M1.1 - Stack navigator for Modules tab
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ModulesStackParamList } from './types';
import { theme } from '../../theme.config';

import ModulesScreen from '../screens/ModulesScreen';
import InventorySearchScreen from '../screens/InventorySearchScreen';
import InventoryDetailScreen from '../screens/InventoryDetailScreen';
import NoAccessScreen from '../screens/NoAccessScreen';
import NotFoundScreen from '../screens/NotFoundScreen';

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
      <Stack.Screen name="InventorySearch" component={InventorySearchScreen} options={{ title: 'Inventory' }} />
      <Stack.Screen name="InventoryDetail" component={InventoryDetailScreen} options={{ title: 'Item Detail' }} />
      <Stack.Screen name="NoAccess" component={NoAccessScreen} options={{ title: 'Access Denied' }} />
      <Stack.Screen name="NotFound" component={NotFoundScreen} options={{ title: 'Not Found' }} />
    </Stack.Navigator>
  );
}
