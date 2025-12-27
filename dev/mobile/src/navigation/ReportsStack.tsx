import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { ReportsDashboardScreen } from '../screens/ReportsDashboardScreen';

export type ReportsStackParamList = {
  ReportsDashboard: undefined;
};

const Stack = createNativeStackNavigator<ReportsStackParamList>();

export function ReportsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.foreground,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.secondary },
      }}
    >
      <Stack.Screen
        name="ReportsDashboard"
        component={ReportsDashboardScreen}
        options={{ title: 'Reports & Analytics' }}
      />
    </Stack.Navigator>
  );
}
