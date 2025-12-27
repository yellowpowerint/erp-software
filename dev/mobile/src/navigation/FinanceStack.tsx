import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { FinanceHomeScreen } from '../screens/FinanceHomeScreen';
import { BudgetsListScreen } from '../screens/BudgetsListScreen';
import { BudgetDetailScreen } from '../screens/BudgetDetailScreen';
import { PaymentsListScreen } from '../screens/PaymentsListScreen';
import { PaymentDetailScreen } from '../screens/PaymentDetailScreen';

export type FinanceStackParamList = {
  FinanceHome: undefined;
  BudgetsList: undefined;
  BudgetDetail: { id: string };
  PaymentsList: undefined;
  PaymentDetail: { id: string };
};

const Stack = createNativeStackNavigator<FinanceStackParamList>();

export function FinanceStack() {
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
        name="FinanceHome"
        options={{ title: 'Finance' }}
      >
        {() => <FinanceHomeScreen />}
      </Stack.Screen>
      <Stack.Screen
        name="BudgetsList"
        component={BudgetsListScreen}
        options={{ title: 'Budgets' }}
      />
      <Stack.Screen
        name="BudgetDetail"
        component={BudgetDetailScreen}
        options={{ title: 'Budget Details' }}
      />
      <Stack.Screen
        name="PaymentsList"
        component={PaymentsListScreen}
        options={{ title: 'Payments' }}
      />
      <Stack.Screen
        name="PaymentDetail"
        component={PaymentDetailScreen}
        options={{ title: 'Payment Details' }}
      />
    </Stack.Navigator>
  );
}
