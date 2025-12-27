import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { PurchaseOrdersListScreen } from '../screens/PurchaseOrdersListScreen';
import { VendorsListScreen } from '../screens/VendorsListScreen';

export type ProcurementStackParamList = {
  PurchaseOrders: undefined;
  Vendors: undefined;
};

const Stack = createNativeStackNavigator<ProcurementStackParamList>();

export function ProcurementStack() {
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
        name="PurchaseOrders"
        component={PurchaseOrdersListScreen}
        options={{ title: 'Purchase Orders' }}
      />
      <Stack.Screen
        name="Vendors"
        component={VendorsListScreen}
        options={{ title: 'Vendors' }}
      />
    </Stack.Navigator>
  );
}
