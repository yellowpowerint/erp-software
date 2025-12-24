import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ApprovalsListScreen } from '../screens/ApprovalsListScreen';
import { ApprovalDetailScreen } from '../screens/ApprovalDetailScreen';

type ApprovalType = 'INVOICE' | 'PURCHASE_REQUEST' | 'IT_REQUEST' | 'PAYMENT_REQUEST';

export type WorkStackParamList = {
  ApprovalsList: undefined;
  ApprovalDetail: { type: ApprovalType; id: string };
};

const Stack = createNativeStackNavigator<WorkStackParamList>();

export function WorkStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ApprovalsList" component={ApprovalsListScreen} options={{ title: 'Approvals' }} />
      <Stack.Screen name="ApprovalDetail" component={ApprovalDetailScreen} options={{ title: 'Approval Detail' }} />
    </Stack.Navigator>
  );
}
