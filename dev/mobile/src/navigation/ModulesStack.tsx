import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { ModulesScreen } from '../screens/ModulesScreen';
import { ProcurementStack } from './ProcurementStack';
import type { ProcurementStackParamList } from './ProcurementStack';
import { FleetStack } from './FleetStack';
import type { FleetStackParamList } from './FleetStack';
import { ReportsStack } from './ReportsStack';
import type { ReportsStackParamList } from './ReportsStack';

export type ModulesStackParamList = {
  ModulesHome: undefined;
  ProcurementStack: NavigatorScreenParams<ProcurementStackParamList>;
  FleetStack: NavigatorScreenParams<FleetStackParamList>;
  ReportsStack: NavigatorScreenParams<ReportsStackParamList>;
};

const Stack = createNativeStackNavigator<ModulesStackParamList>();

export function ModulesStack() {
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
        name="ModulesHome"
        component={ModulesScreen}
        options={{ title: 'Modules' }}
      />
      <Stack.Screen
        name="ProcurementStack"
        component={ProcurementStack}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FleetStack"
        component={FleetStack}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ReportsStack"
        component={ReportsStack}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
