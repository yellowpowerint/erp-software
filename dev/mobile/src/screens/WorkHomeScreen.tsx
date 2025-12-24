import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { WorkStackParamList } from '../navigation/WorkStack';

export function WorkHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<WorkStackParamList, 'WorkHome'>>();

  const cards = useMemo(
    () => [
      {
        key: 'approvals',
        title: 'Approvals',
        description: 'Review approval requests and take action.',
        onPress: () => navigation.navigate('ApprovalsList'),
      },
      {
        key: 'tasks',
        title: 'Tasks',
        description: 'View your tasks with status and due dates.',
        onPress: () => navigation.navigate('TasksList'),
      },
    ],
    [navigation]
  );

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Work</Text>
        <Text style={styles.meta}>Approvals and tasks</Text>
      </View>

      <View style={styles.grid}>
        {cards.map((c) => (
          <Pressable
            key={c.key}
            onPress={c.onPress}
            style={({ pressed }) => [styles.card, pressed ? styles.cardPressed : null]}
            accessibilityRole="button"
          >
            <Text style={styles.cardTitle}>{c.title}</Text>
            <Text style={styles.cardDesc}>{c.description}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 16,
    backgroundColor: '#ffffff',
    gap: 12,
  },
  header: {
    gap: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },
  meta: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
  },
  grid: {
    gap: 10,
  },
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#f9fafb',
    gap: 6,
  },
  cardPressed: {
    opacity: 0.9,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111827',
  },
  cardDesc: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
});
