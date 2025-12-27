import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { AiHomeScreen } from '../screens/AiHomeScreen';
import { DashboardInsightsScreen } from '../screens/DashboardInsightsScreen';
import { AiAdvisorsScreen } from '../screens/AiAdvisorsScreen';

export type AiStackParamList = {
  AiHome: undefined;
  DashboardInsights: undefined;
  AiAdvisors: undefined;
};

const Stack = createNativeStackNavigator<AiStackParamList>();

export function AiStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.foreground,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.secondary },
      }}
    >
      <Stack.Screen name="AiHome" options={{ title: 'AI Intelligence' }}>
        {() => <AiHomeScreen />}
      </Stack.Screen>
      <Stack.Screen
        name="DashboardInsights"
        component={DashboardInsightsScreen}
        options={{ title: 'Dashboard Insights' }}
      />
      <Stack.Screen
        name="AiAdvisors"
        component={AiAdvisorsScreen}
        options={{ title: 'AI Advisors' }}
      />
    </Stack.Navigator>
  );
}
