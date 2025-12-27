import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { ProductionLogsListScreen } from '../screens/ProductionLogsListScreen';
import { ShiftsListScreen } from '../screens/ShiftsListScreen';

export type OperationsStackParamList = {
  ProductionLogs: undefined;
  Shifts: undefined;
};

const Stack = createNativeStackNavigator<OperationsStackParamList>();

export function OperationsStack() {
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
        name="ProductionLogs"
        component={ProductionLogsListScreen}
        options={{ title: 'Production Logs' }}
      />
      <Stack.Screen
        name="Shifts"
        component={ShiftsListScreen}
        options={{ title: 'Shifts' }}
      />
    </Stack.Navigator>
  );
}
