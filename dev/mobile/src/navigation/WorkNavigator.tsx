/**
 * Work Stack Navigator
 * Session M0.1 - Work tab with deep link support
 */

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { WorkStackParamList } from './types';
import { theme } from '../../theme.config';

import WorkScreen from '../screens/WorkScreen';
import TasksListScreen from '../screens/TasksListScreen';
import ApprovalDetailScreen from '../screens/ApprovalDetailScreen';
import TaskDetailScreen from '../screens/TaskDetailScreen';
import DocumentViewerScreen from '../screens/DocumentViewerScreen';
import NoAccessScreen from '../screens/NoAccessScreen';
import NotFoundScreen from '../screens/NotFoundScreen';
import { useCapabilities } from '../hooks/useCapabilities';
import { Button, RequireCapability } from '../components';

const Stack = createStackNavigator<WorkStackParamList>();

export default function WorkNavigator() {
  function WorkEntry() {
    const { status, error, refresh, hasModule } = useCapabilities();

    if (status === 'loading' || status === 'idle') {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.text}>Loading permissions...</Text>
        </View>
      );
    }

    if (status === 'error') {
      return (
        <View style={styles.centered}>
          <Text style={styles.title}>Unable to load permissions</Text>
          <Text style={styles.text}>{error || 'Please try again.'}</Text>
          <View style={styles.buttonWrap}>
            <Button title="Retry" onPress={() => refresh()} />
          </View>
        </View>
      );
    }

    if (hasModule('approvals')) {
      return (
        <RequireCapability moduleId="approvals" capability="canViewApprovals" resource="approvals">
          <WorkScreen />
        </RequireCapability>
      );
    }

    return (
      <RequireCapability moduleId="tasks" capability="canViewTasks" resource="tasks">
        <TasksListScreen />
      </RequireCapability>
    );
  }

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
      <Stack.Screen 
        name="WorkList" 
        component={WorkEntry}
        options={{ title: 'Work' }}
      />
      <Stack.Screen 
        name="TasksList" 
        component={() => (
          <RequireCapability moduleId="tasks" capability="canViewTasks" resource="tasks">
            <TasksListScreen />
          </RequireCapability>
        )}
        options={{ title: 'Tasks' }}
      />
      <Stack.Screen 
        name="ApprovalDetail" 
        component={() => (
          <RequireCapability moduleId="approvals" capability="canViewApprovals" resource="approval">
            <ApprovalDetailScreen />
          </RequireCapability>
        )}
        options={{ title: 'Approval' }}
      />
      <Stack.Screen 
        name="TaskDetail" 
        component={() => (
          <RequireCapability moduleId="tasks" capability="canViewTasks" resource="task">
            <TaskDetailScreen />
          </RequireCapability>
        )}
        options={{ title: 'Task' }}
      />
      <Stack.Screen name="DocumentViewer" component={DocumentViewerScreen} options={{ title: 'View Document' }} />
      <Stack.Screen 
        name="NoAccess" 
        component={NoAccessScreen}
        options={{ title: 'Access Denied' }}
      />
      <Stack.Screen 
        name="NotFound" 
        component={NotFoundScreen}
        options={{ title: 'Not Found' }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  text: {
    marginTop: theme.spacing.sm,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  buttonWrap: {
    marginTop: theme.spacing.lg,
    width: '100%',
  },
});
