import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { FleetAssetsListScreen } from '../screens/FleetAssetsListScreen';
import { FuelLogsListScreen } from '../screens/FuelLogsListScreen';

export type FleetStackParamList = {
  FleetAssets: undefined;
  FuelLogs: undefined;
};

const Stack = createNativeStackNavigator<FleetStackParamList>();

export function FleetStack() {
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
        name="FleetAssets"
        component={FleetAssetsListScreen}
        options={{ title: 'Fleet Assets' }}
      />
      <Stack.Screen
        name="FuelLogs"
        component={FuelLogsListScreen}
        options={{ title: 'Fuel Logs' }}
      />
    </Stack.Navigator>
  );
}
