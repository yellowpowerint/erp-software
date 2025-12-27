import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { HrHomeScreen } from '../screens/HrHomeScreen';
import { LeaveRequestsListScreen } from '../screens/LeaveRequestsListScreen';
import { LeaveRequestDetailScreen } from '../screens/LeaveRequestDetailScreen';
import { AttendanceListScreen } from '../screens/AttendanceListScreen';
import { RecruitmentScreen } from '../screens/RecruitmentScreen';

export type HrStackParamList = {
  HrHome: undefined;
  LeaveRequestsList: undefined;
  LeaveRequestDetail: { id: string };
  AttendanceList: undefined;
  Recruitment: undefined;
};

const Stack = createNativeStackNavigator<HrStackParamList>();

export function HrStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.foreground,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.secondary },
      }}
    >
      <Stack.Screen name="HrHome" options={{ title: 'HR & Personnel' }}>
        {() => <HrHomeScreen />}
      </Stack.Screen>
      <Stack.Screen
        name="LeaveRequestsList"
        component={LeaveRequestsListScreen}
        options={{ title: 'Leave Requests' }}
      />
      <Stack.Screen
        name="LeaveRequestDetail"
        component={LeaveRequestDetailScreen}
        options={{ title: 'Leave Request Details' }}
      />
      <Stack.Screen
        name="AttendanceList"
        component={AttendanceListScreen}
        options={{ title: 'Attendance' }}
      />
      <Stack.Screen
        name="Recruitment"
        component={RecruitmentScreen}
        options={{ title: 'AI Recruitment' }}
      />
    </Stack.Navigator>
  );
}
