import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { HomeScreen } from '../screens/HomeScreen';
import { PlaceholderScreen } from '../screens/PlaceholderScreen';

export type AppTabsParamList = {
  Home: undefined;
  Work: undefined;
  Modules: undefined;
  Notifications: undefined;
  More: undefined;
};

const Tab = createBottomTabNavigator<AppTabsParamList>();

export function AppTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Work" children={() => <PlaceholderScreen title="Work" />} />
      <Tab.Screen name="Modules" children={() => <PlaceholderScreen title="Modules" />} />
      <Tab.Screen name="Notifications" children={() => <PlaceholderScreen title="Notifications" />} />
      <Tab.Screen name="More" children={() => <PlaceholderScreen title="More" />} />
    </Tab.Navigator>
  );
}
