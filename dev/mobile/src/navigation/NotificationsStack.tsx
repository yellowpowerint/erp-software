import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { NotificationsListScreen } from '../screens/NotificationsListScreen';
import { NotificationDetailScreen } from '../screens/NotificationDetailScreen';

export type NotificationsStackParamList = {
  Notifications: undefined;
  NotificationDetail: { id: string };
};

const Stack = createNativeStackNavigator<NotificationsStackParamList>();

export function NotificationsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Notifications" component={NotificationsListScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="NotificationDetail" component={NotificationDetailScreen} options={{ title: 'Notification' }} />
    </Stack.Navigator>
  );
}
