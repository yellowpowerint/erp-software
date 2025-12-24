import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { WorkHomeScreen } from '../screens/WorkHomeScreen';
import { ApprovalsListScreen } from '../screens/ApprovalsListScreen';
import { ApprovalLinkScreen } from '../screens/ApprovalLinkScreen';
import { ApprovalDetailScreen } from '../screens/ApprovalDetailScreen';
import { TasksListScreen } from '../screens/TasksListScreen';
import { TaskDetailScreen } from '../screens/TaskDetailScreen';

type ApprovalType = 'INVOICE' | 'PURCHASE_REQUEST' | 'IT_REQUEST' | 'PAYMENT_REQUEST';

export type WorkStackParamList = {
  WorkHome: undefined;
  ApprovalsList: undefined;
  ApprovalLink: { id: string };
  ApprovalDetail: { type: ApprovalType; id: string };
  TasksList: undefined;
  TaskDetail: { id: string };
};

const Stack = createNativeStackNavigator<WorkStackParamList>();

export function WorkStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="WorkHome" component={WorkHomeScreen} options={{ title: 'Work' }} />
      <Stack.Screen name="ApprovalsList" component={ApprovalsListScreen} options={{ title: 'Approvals' }} />
      <Stack.Screen name="ApprovalLink" component={ApprovalLinkScreen} options={{ title: 'Approval' }} />
      <Stack.Screen name="ApprovalDetail" component={ApprovalDetailScreen} options={{ title: 'Approval Detail' }} />
      <Stack.Screen name="TasksList" component={TasksListScreen} options={{ title: 'Tasks' }} />
      <Stack.Screen name="TaskDetail" component={TaskDetailScreen} options={{ title: 'Task' }} />
    </Stack.Navigator>
  );
}
