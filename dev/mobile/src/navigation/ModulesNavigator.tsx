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
import ExpensesListScreen from '../screens/ExpensesListScreen';
import ExpenseSubmitScreen from '../screens/ExpenseSubmitScreen';
import ExpenseDetailScreen from '../screens/ExpenseDetailScreen';
import ProjectsListScreen from '../screens/ProjectsListScreen';
import ProjectDetailScreen from '../screens/ProjectDetailScreen';
import DocumentListScreen from '../screens/DocumentListScreen';
import DocumentUploadScreen from '../screens/DocumentUploadScreen';
import DocumentViewerScreen from '../screens/DocumentViewerScreen';
import OutboxScreenEnhanced from '../screens/OutboxScreenEnhanced';
import POListScreen from '../screens/POListScreen';
import ReceiveGoodsScreen from '../screens/ReceiveGoodsScreen';
import FleetHomeScreen from '../screens/FleetHomeScreen';
import FleetInspectionScreen from '../screens/FleetInspectionScreen';
import ReportBreakdownScreen from '../screens/ReportBreakdownScreen';
import LogFuelScreen from '../screens/LogFuelScreen';
import NoAccessScreen from '../screens/NoAccessScreen';
import NotFoundScreen from '../screens/NotFoundScreen';
import { RequireCapability } from '../components';

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
      <Stack.Screen
        name="InventorySearch"
        component={() => (
          <RequireCapability anyModuleIds={['inventory', 'receiving']} capability="canViewInventory" resource="inventory">
            <InventorySearchScreen />
          </RequireCapability>
        )}
        options={{ title: 'Inventory' }}
      />
      <Stack.Screen
        name="InventoryDetail"
        component={() => (
          <RequireCapability anyModuleIds={['inventory', 'receiving']} capability="canViewInventory" resource="inventory">
            <InventoryDetailScreen />
          </RequireCapability>
        )}
        options={{ title: 'Item Detail' }}
      />
      <Stack.Screen
        name="ReceiveStock"
        component={() => (
          <RequireCapability moduleId="receiving" capability="canReceiveStock" resource="receiving">
            <ReceiveStockScreen />
          </RequireCapability>
        )}
        options={{ title: 'Receive Stock' }}
      />
      <Stack.Screen
        name="IncidentCapture"
        component={() => (
          <RequireCapability moduleId="safety" capability="canCreateIncident" resource="safety">
            <IncidentCaptureScreen />
          </RequireCapability>
        )}
        options={{ title: 'Report Incident' }}
      />
      <Stack.Screen
        name="IncidentList"
        component={() => (
          <RequireCapability moduleId="safety" resource="safety">
            <IncidentListScreen />
          </RequireCapability>
        )}
        options={{ title: 'Incidents' }}
      />
      <Stack.Screen
        name="IncidentDetail"
        component={() => (
          <RequireCapability moduleId="safety" resource="safety">
            <IncidentDetailScreen />
          </RequireCapability>
        )}
        options={{ title: 'Incident Detail' }}
      />
      <Stack.Screen
        name="EmployeeDirectory"
        component={() => (
          <RequireCapability moduleId="employees" resource="employees">
            <EmployeeDirectoryScreen />
          </RequireCapability>
        )}
        options={{ title: 'Employees' }}
      />
      <Stack.Screen
        name="EmployeeProfile"
        component={() => (
          <RequireCapability moduleId="employees" resource="employees">
            <EmployeeProfileScreen />
          </RequireCapability>
        )}
        options={{ title: 'Employee Profile' }}
      />
      <Stack.Screen
        name="LeaveRequestsList"
        component={() => (
          <RequireCapability moduleId="leave" resource="leave">
            <LeaveRequestsListScreen />
          </RequireCapability>
        )}
        options={{ title: 'Leave Requests' }}
      />
      <Stack.Screen
        name="LeaveRequest"
        component={() => (
          <RequireCapability moduleId="leave" resource="leave">
            <LeaveRequestScreen />
          </RequireCapability>
        )}
        options={{ title: 'Request Leave' }}
      />
      <Stack.Screen
        name="ExpensesList"
        component={() => (
          <RequireCapability moduleId="expenses" resource="expenses">
            <ExpensesListScreen />
          </RequireCapability>
        )}
        options={{ title: 'Expenses' }}
      />
      <Stack.Screen
        name="ExpenseSubmit"
        component={() => (
          <RequireCapability moduleId="expenses" resource="expenses">
            <ExpenseSubmitScreen />
          </RequireCapability>
        )}
        options={{ title: 'Submit Expense' }}
      />
      <Stack.Screen
        name="ExpenseDetail"
        component={() => (
          <RequireCapability moduleId="expenses" resource="expenses">
            <ExpenseDetailScreen />
          </RequireCapability>
        )}
        options={{ title: 'Expense Detail' }}
      />
      <Stack.Screen
        name="ProjectsList"
        component={() => (
          <RequireCapability moduleId="projects" resource="projects">
            <ProjectsListScreen />
          </RequireCapability>
        )}
        options={{ title: 'Projects' }}
      />
      <Stack.Screen
        name="ProjectDetail"
        component={() => (
          <RequireCapability moduleId="projects" resource="projects">
            <ProjectDetailScreen />
          </RequireCapability>
        )}
        options={{ title: 'Project Detail' }}
      />
      <Stack.Screen
        name="DocumentList"
        component={() => (
          <RequireCapability moduleId="documents" resource="documents">
            <DocumentListScreen />
          </RequireCapability>
        )}
        options={{ title: 'Documents' }}
      />
      <Stack.Screen
        name="DocumentUpload"
        component={() => (
          <RequireCapability moduleId="documents" capability="canUploadDocuments" resource="documents">
            <DocumentUploadScreen />
          </RequireCapability>
        )}
        options={{ title: 'Upload Document' }}
      />
      <Stack.Screen
        name="DocumentViewer"
        component={() => (
          <RequireCapability moduleId="documents" resource="documents">
            <DocumentViewerScreen />
          </RequireCapability>
        )}
        options={{ title: 'View Document' }}
      />
      <Stack.Screen name="Outbox" component={OutboxScreenEnhanced} options={{ title: 'Outbox' }} />
      <Stack.Screen
        name="POList"
        component={() => (
          <RequireCapability moduleId="receiving" capability="canReceiveStock" resource="warehouse">
            <POListScreen />
          </RequireCapability>
        )}
        options={{ title: 'Purchase Orders' }}
      />
      <Stack.Screen
        name="ReceiveGoods"
        component={() => (
          <RequireCapability moduleId="receiving" capability="canReceiveStock" resource="warehouse">
            <ReceiveGoodsScreen />
          </RequireCapability>
        )}
        options={{ title: 'Receive Goods' }}
      />
      <Stack.Screen
        name="FleetHome"
        component={() => (
          <RequireCapability moduleId="fleet" resource="fleet">
            <FleetHomeScreen />
          </RequireCapability>
        )}
        options={{ title: 'Fleet Operations' }}
      />
      <Stack.Screen
        name="FleetInspection"
        component={() => (
          <RequireCapability moduleId="fleet" capability="canCreateFleetInspection" resource="fleet">
            <FleetInspectionScreen />
          </RequireCapability>
        )}
        options={{ title: 'Pre-Start Inspection' }}
      />
      <Stack.Screen
        name="ReportBreakdown"
        component={() => (
          <RequireCapability moduleId="fleet" capability="canReportBreakdown" resource="fleet">
            <ReportBreakdownScreen />
          </RequireCapability>
        )}
        options={{ title: 'Report Breakdown' }}
      />
      <Stack.Screen
        name="LogFuel"
        component={() => (
          <RequireCapability moduleId="fleet" capability="canLogFuel" resource="fleet">
            <LogFuelScreen />
          </RequireCapability>
        )}
        options={{ title: 'Log Fuel' }}
      />
      <Stack.Screen name="NoAccess" component={NoAccessScreen} options={{ title: 'Access Denied' }} />
      <Stack.Screen name="NotFound" component={NotFoundScreen} options={{ title: 'Not Found' }} />
    </Stack.Navigator>
  );
}
