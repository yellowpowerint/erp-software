import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuth } from '../auth/AuthContext';
import type { MoreStackParamList } from '../navigation/MoreStack';

export function MoreScreen() {
  const { me, signOut } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Account</Text>
        <Text style={styles.subtitle}>{me?.email ?? ''}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>

        <Pressable
          onPress={() => navigation.navigate('LeaveRequestSubmit')}
          style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
          accessibilityRole="button"
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Leave Request</Text>
            <Text style={styles.rowSubtitle}>Submit a leave request for approval</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('NotificationPreferences')}
          style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
          accessibilityRole="button"
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Notification Preferences</Text>
            <Text style={styles.rowSubtitle}>Choose how you want to receive updates</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Session</Text>
        <Pressable
          onPress={signOut}
          style={({ pressed }) => [styles.dangerRow, pressed ? styles.rowPressed : null]}
          accessibilityRole="button"
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.dangerTitle}>Logout</Text>
            <Text style={styles.dangerSubtitle}>Sign out of this device</Text>
          </View>
          <Text style={styles.chevronDanger}>›</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#ffffff',
    gap: 16,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
  },
  subtitle: {
    color: '#6b7280',
    fontWeight: '700',
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#111827',
    opacity: 0.8,
    textTransform: 'uppercase',
  },
  row: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  dangerRow: {
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff1f2',
  },
  rowPressed: {
    opacity: 0.85,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111827',
  },
  rowSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
  },
  dangerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#7f1d1d',
  },
  dangerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '700',
    color: '#991b1b',
    opacity: 0.85,
  },
  chevron: {
    color: '#9ca3af',
    fontSize: 22,
    paddingLeft: 10,
    fontWeight: '900',
  },
  chevronDanger: {
    color: '#991b1b',
    fontSize: 22,
    paddingLeft: 10,
    fontWeight: '900',
    opacity: 0.9,
  },
});
