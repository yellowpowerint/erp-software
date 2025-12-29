/**
 * Modules Stack Navigator
 * Session M1.1 - Stack navigator for Modules tab
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ModulesStackParamList } from './types';
import { theme } from '../../theme.config';

import ModulesScreen from '../screens/ModulesScreen';
import InventorySearchScreen from '../screens/InventorySearchScreen';
import InventoryDetailScreen from '../screens/InventoryDetailScreen';
import ReceiveStockScreen from '../screens/ReceiveStockScreen';
import IncidentCaptureScreen from '../screens/IncidentCaptureScreen';
import IncidentListScreen from '../screens/IncidentListScreen';
import IncidentDetailScreen from '../screens/IncidentDetailScreen';
import EmployeeDirectoryScreen from '../screens/EmployeeDirectoryScreen';
import EmployeeProfileScreen from '../screens/EmployeeProfileScreen';
import LeaveRequestsListScreen from '../screens/LeaveRequestsListScreen';
import LeaveRequestScreen from '../screens/LeaveRequestScreen';
import OutboxScreen from '../screens/OutboxScreen';
import NoAccessScreen from '../screens/NoAccessScreen';
import NotFoundScreen from '../screens/NotFoundScreen';

const Stack = createStackNavigator<ModulesStackParamList>();

export default function ModulesNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontFamily: theme.typography.fontFamily.bold,
        },
      }}
    >
      <Stack.Screen name="ModulesMain" component={ModulesScreen} options={{ title: 'Modules' }} />
      <Stack.Screen name="InventorySearch" component={InventorySearchScreen} options={{ title: 'Inventory' }} />
      <Stack.Screen name="InventoryDetail" component={InventoryDetailScreen} options={{ title: 'Item Detail' }} />
      <Stack.Screen name="ReceiveStock" component={ReceiveStockScreen} options={{ title: 'Receive Stock' }} />
      <Stack.Screen name="IncidentCapture" component={IncidentCaptureScreen} options={{ title: 'Report Incident' }} />
      <Stack.Screen name="IncidentList" component={IncidentListScreen} options={{ title: 'Incidents' }} />
      <Stack.Screen name="IncidentDetail" component={IncidentDetailScreen} options={{ title: 'Incident Detail' }} />
      <Stack.Screen name="EmployeeDirectory" component={EmployeeDirectoryScreen} options={{ title: 'Employees' }} />
      <Stack.Screen name="EmployeeProfile" component={EmployeeProfileScreen} options={{ title: 'Employee Profile' }} />
      <Stack.Screen name="LeaveRequestsList" component={LeaveRequestsListScreen} options={{ title: 'Leave Requests' }} />
      <Stack.Screen name="LeaveRequest" component={LeaveRequestScreen} options={{ title: 'Request Leave' }} />
      <Stack.Screen name="Outbox" component={OutboxScreen} options={{ title: 'Outbox' }} />
      <Stack.Screen name="NoAccess" component={NoAccessScreen} options={{ title: 'Access Denied' }} />
      <Stack.Screen name="NotFound" component={NotFoundScreen} options={{ title: 'Not Found' }} />
    </Stack.Navigator>
  );
}
