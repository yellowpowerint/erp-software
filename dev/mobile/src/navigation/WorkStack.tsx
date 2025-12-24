import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ApprovalsListScreen } from '../screens/ApprovalsListScreen';

export type WorkStackParamList = {
  ApprovalsList: undefined;
};

const Stack = createNativeStackNavigator<WorkStackParamList>();

export function WorkStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ApprovalsList" component={ApprovalsListScreen} options={{ title: 'Approvals' }} />
    </Stack.Navigator>
  );
}
