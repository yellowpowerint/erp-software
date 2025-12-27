import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AccessGate } from '../components/AccessGate';
import { colors } from '../theme/colors';
import type { FinanceStackParamList } from '../navigation/FinanceStack';

export function FinanceHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<FinanceStackParamList>>();

  return (
    <AccessGate resource="MODULE_FINANCE">
      <ScrollView style={styles.screen}>
        <Text style={styles.header}>Finance Management</Text>
        <Text style={styles.subtitle}>Manage budgets, payments, and expenses</Text>
        
        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          onPress={() => navigation.navigate('BudgetsList')}
        >
          <Text style={styles.cardTitle}>Budgets</Text>
          <Text style={styles.cardDesc}>View and manage budget allocations</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          onPress={() => navigation.navigate('PaymentsList')}
        >
          <Text style={styles.cardTitle}>Payments</Text>
          <Text style={styles.cardDesc}>Track and approve payments</Text>
        </Pressable>
      </ScrollView>
    </AccessGate>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.secondary, padding: 16 },
  header: { fontSize: 24, fontWeight: 'bold', color: colors.foreground, marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.mutedForeground, marginBottom: 24 },
  card: { backgroundColor: colors.card, padding: 20, borderRadius: 8, marginBottom: 12 },
  pressed: { opacity: 0.7 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: colors.foreground, marginBottom: 4 },
  cardDesc: { fontSize: 14, color: colors.mutedForeground },
});
