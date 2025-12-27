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
import { OperationsStack } from './OperationsStack';
import type { OperationsStackParamList } from './OperationsStack';
import { FinanceStack } from './FinanceStack';
import type { FinanceStackParamList } from './FinanceStack';
import { HrStack } from './HrStack';
import type { HrStackParamList } from './HrStack';
import { AiStack } from './AiStack';
import type { AiStackParamList } from './AiStack';

export type ModulesStackParamList = {
  ModulesHome: undefined;
  ProcurementStack: NavigatorScreenParams<ProcurementStackParamList>;
  FleetStack: NavigatorScreenParams<FleetStackParamList>;
  ReportsStack: NavigatorScreenParams<ReportsStackParamList>;
  OperationsStack: NavigatorScreenParams<OperationsStackParamList>;
  FinanceStack: NavigatorScreenParams<FinanceStackParamList>;
  HrStack: NavigatorScreenParams<HrStackParamList>;
  AiStack: NavigatorScreenParams<AiStackParamList>;
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
      <Stack.Screen
        name="OperationsStack"
        component={OperationsStack}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FinanceStack"
        component={FinanceStack}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="HrStack"
        component={HrStack}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AiStack"
        component={AiStack}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
