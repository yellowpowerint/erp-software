import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { NavigatorScreenParams } from '@react-navigation/native';

import { useMobileConfig } from '../config/MobileConfigContext';
import { HomeStack } from './HomeStack';
import type { HomeStackParamList } from './HomeStack';
import { PlaceholderScreen } from '../screens/PlaceholderScreen';

export type AppTabsParamList = {
  Home: NavigatorScreenParams<HomeStackParamList> | undefined;
  Work: undefined;
  Modules: undefined;
  Notifications: undefined;
  More: undefined;
};

const Tab = createBottomTabNavigator<AppTabsParamList>();

export function AppTabs() {
  const { config } = useMobileConfig();
  const flags = config?.featureFlags;

  return (
    <Tab.Navigator>
      {flags?.home !== false ? <Tab.Screen name="Home" component={HomeStack} options={{ headerShown: false }} /> : null}
      {flags?.work !== false ? <Tab.Screen name="Work" children={() => <PlaceholderScreen title="Work" />} /> : null}
      {flags?.modules !== false ? (
        <Tab.Screen name="Modules" children={() => <PlaceholderScreen title="Modules" />} />
      ) : null}
      {flags?.notifications !== false ? (
        <Tab.Screen name="Notifications" children={() => <PlaceholderScreen title="Notifications" />} />
      ) : null}
      {flags?.more !== false ? <Tab.Screen name="More" children={() => <PlaceholderScreen title="More" />} /> : null}
    </Tab.Navigator>
  );
}
