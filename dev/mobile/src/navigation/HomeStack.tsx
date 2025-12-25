import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HomeScreen } from '../screens/HomeScreen';
import { InventoryItemsScreen } from '../screens/InventoryItemsScreen';
import { InventoryItemDetailScreen } from '../screens/InventoryItemDetailScreen';
import { ReceiveStockScreen } from '../screens/ReceiveStockScreen';
import { AssetsListScreen } from '../screens/AssetsListScreen';
import { ProjectsListScreen } from '../screens/ProjectsListScreen';
import { ExpensesListScreen } from '../screens/ExpensesListScreen';
import { EmployeesListScreen } from '../screens/EmployeesListScreen';
import { SafetyInspectionsListScreen } from '../screens/SafetyInspectionsListScreen';
import { SafetyTrainingsListScreen } from '../screens/SafetyTrainingsListScreen';
import { IncidentCaptureScreen } from '../screens/IncidentCaptureScreen';
import { IncidentOutboxScreen } from '../screens/IncidentOutboxScreen';

export type HomeStackParamList = {
  Home: undefined;
  InventoryItems: undefined;
  InventoryItemDetail: { id: string };
  ReceiveStock: { itemId: string };
  Assets: undefined;
  Projects: undefined;
  Expenses: undefined;
  Employees: undefined;
  SafetyInspections: undefined;
  SafetyTrainings: undefined;
  IncidentCapture: undefined;
  IncidentOutbox: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Stack.Screen name="InventoryItems" component={InventoryItemsScreen} options={{ title: 'Inventory' }} />
      <Stack.Screen name="InventoryItemDetail" component={InventoryItemDetailScreen} options={{ title: 'Item' }} />
      <Stack.Screen name="ReceiveStock" component={ReceiveStockScreen} options={{ title: 'Receive stock' }} />
      <Stack.Screen name="Assets" component={AssetsListScreen} options={{ title: 'Assets' }} />
      <Stack.Screen name="Projects" component={ProjectsListScreen} options={{ title: 'Projects' }} />
      <Stack.Screen name="Expenses" component={ExpensesListScreen} options={{ title: 'Expenses' }} />
      <Stack.Screen name="Employees" component={EmployeesListScreen} options={{ title: 'Employees' }} />
      <Stack.Screen
        name="SafetyInspections"
        component={SafetyInspectionsListScreen}
        options={{ title: 'Inspections' }}
      />
      <Stack.Screen
        name="SafetyTrainings"
        component={SafetyTrainingsListScreen}
        options={{ title: 'Trainings' }}
      />
      <Stack.Screen
        name="IncidentCapture"
        component={IncidentCaptureScreen}
        options={{ title: 'Report incident' }}
      />
      <Stack.Screen name="IncidentOutbox" component={IncidentOutboxScreen} options={{ title: 'Incident outbox' }} />
    </Stack.Navigator>
  );
}
