import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { ModulesScreen } from '../screens/ModulesScreen';
import { ProcurementStack } from './ProcurementStack';
import type { ProcurementStackParamList } from './ProcurementStack';

export type ModulesStackParamList = {
  ModulesHome: undefined;
  ProcurementStack: NavigatorScreenParams<ProcurementStackParamList>;
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
    </Stack.Navigator>
  );
}
