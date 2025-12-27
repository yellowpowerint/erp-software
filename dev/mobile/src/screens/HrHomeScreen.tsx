import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AccessGate } from '../components/AccessGate';
import { colors } from '../theme/colors';
import type { HrStackParamList } from '../navigation/HrStack';

export function HrHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HrStackParamList>>();

  return (
    <AccessGate resource="MODULE_HR">
      <ScrollView style={styles.screen}>
        <Text style={styles.header}>HR & Personnel</Text>

        <Pressable style={styles.card} onPress={() => navigation.navigate('LeaveRequestsList')}>
          <Text style={styles.cardTitle}>Leave Requests</Text>
        </Pressable>

        <Pressable style={styles.card} onPress={() => navigation.navigate('AttendanceList')}>
          <Text style={styles.cardTitle}>Attendance</Text>
        </Pressable>

        <Pressable style={styles.card} onPress={() => navigation.navigate('Recruitment')}>
          <Text style={styles.cardTitle}>AI Recruitment</Text>
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
