import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { MoreScreen } from '../screens/MoreScreen';
import { NotificationPreferencesScreen } from '../screens/NotificationPreferencesScreen';

export type MoreStackParamList = {
  MoreHome: undefined;
  NotificationPreferences: undefined;
};

const Stack = createNativeStackNavigator<MoreStackParamList>();

export function MoreStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MoreHome" component={MoreScreen} options={{ title: 'More' }} />
      <Stack.Screen
        name="NotificationPreferences"
        component={NotificationPreferencesScreen}
        options={{ title: 'Notification Preferences' }}
      />
    </Stack.Navigator>
  );
}
