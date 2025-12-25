import 'react-native-gesture-handler';

import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthProvider } from './src/auth/AuthContext';
import { MobileConfigProvider } from './src/config/MobileConfigContext';
import { OfflineBanner } from './src/components/OfflineBanner';
import { NotificationsProvider } from './src/notifications/NotificationsContext';
import { NotificationPreferencesProvider } from './src/settings/NotificationPreferencesContext';
import { PushNotificationsProvider } from './src/push/PushNotificationsProvider';
import { RootNavigator } from './src/navigation/RootNavigator';
import { IncidentQueueProvider } from './src/safety/IncidentQueueContext';
import { ExpenseReceiptQueueProvider } from './src/finance/ExpenseReceiptQueueContext';

export default function App() {
  return (
    <MobileConfigProvider>
      <AuthProvider>
        <NotificationsProvider>
          <NotificationPreferencesProvider>
            <PushNotificationsProvider>
              <IncidentQueueProvider>
                <ExpenseReceiptQueueProvider>
                  <SafeAreaView style={{ flex: 1 }}>
                    <OfflineBanner />
                    <RootNavigator />
                    <StatusBar style="auto" />
                  </SafeAreaView>
                </ExpenseReceiptQueueProvider>
              </IncidentQueueProvider>
            </PushNotificationsProvider>
          </NotificationPreferencesProvider>
        </NotificationsProvider>
      </AuthProvider>
    </MobileConfigProvider>
  );
}
