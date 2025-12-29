/**
 * Work Stack Navigator
 * Session M0.1 - Work tab with deep link support
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { WorkStackParamList } from './types';
import { theme } from '../../theme.config';

import WorkScreen from '../screens/WorkScreen';
import ApprovalDetailScreen from '../screens/ApprovalDetailScreen';
import TaskDetailScreen from '../screens/TaskDetailScreen';
import NoAccessScreen from '../screens/NoAccessScreen';
import NotFoundScreen from '../screens/NotFoundScreen';

const Stack = createStackNavigator<WorkStackParamList>();

export default function WorkNavigator() {
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
        component={WorkScreen}
        options={{ title: 'Work' }}
      />
      <Stack.Screen 
        name="ApprovalDetail" 
        component={ApprovalDetailScreen}
        options={{ title: 'Approval' }}
      />
      <Stack.Screen 
        name="TaskDetail" 
        component={TaskDetailScreen}
        options={{ title: 'Task' }}
      />
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
