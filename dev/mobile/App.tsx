import 'react-native-gesture-handler';

import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthProvider } from './src/auth/AuthContext';
import { MobileConfigProvider } from './src/config/MobileConfigContext';
import { OfflineBanner } from './src/components/OfflineBanner';
import { NotificationsProvider } from './src/notifications/NotificationsContext';
import { PushNotificationsProvider } from './src/push/PushNotificationsProvider';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <MobileConfigProvider>
      <AuthProvider>
        <NotificationsProvider>
          <PushNotificationsProvider>
            <SafeAreaView style={{ flex: 1 }}>
              <OfflineBanner />
              <RootNavigator />
              <StatusBar style="auto" />
            </SafeAreaView>
          </PushNotificationsProvider>
        </NotificationsProvider>
      </AuthProvider>
    </MobileConfigProvider>
  );
}
