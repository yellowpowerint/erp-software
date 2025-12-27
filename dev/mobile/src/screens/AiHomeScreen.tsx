import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AccessGate } from '../components/AccessGate';
import { colors } from '../theme/colors';
import type { AiStackParamList } from '../navigation/AiStack';

export function AiHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AiStackParamList>>();

  return (
    <AccessGate resource="MODULE_AI">
      <ScrollView style={styles.screen}>
        <Text style={styles.header}>AI Intelligence</Text>

        <Pressable style={styles.card} onPress={() => navigation.navigate('DashboardInsights')}>
          <Text style={styles.cardTitle}>Dashboard Insights</Text>
        </Pressable>

        <Pressable style={styles.card} onPress={() => navigation.navigate('AiAdvisors')}>
          <Text style={styles.cardTitle}>AI Advisors</Text>
        </Pressable>
      </ScrollView>
    </AccessGate>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.secondary, padding: 16 },
  header: { fontSize: 22, fontWeight: '800', color: colors.foreground, marginBottom: 12 },
  card: { backgroundColor: colors.card, padding: 16, borderRadius: 8, marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.foreground },
});
