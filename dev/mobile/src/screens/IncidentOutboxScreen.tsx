import React, { useCallback } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useIncidentQueue } from '../safety/IncidentQueueContext';

export function IncidentOutboxScreen() {
  const { items, pendingCount, isFlushing, flush, removeItem, activeItemId, activeProgress } = useIncidentQueue();

  const retryAll = useCallback(async () => {
    await flush();
  }, [flush]);

  const confirmRemove = useCallback(
    async (id: string) => {
      Alert.alert('Remove queued incident?', 'This will delete it from the outbox.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => void removeItem(id) },
      ]);
    },
    [removeItem]
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.h1}>Incident Outbox</Text>
        <Text style={styles.muted}>{pendingCount} pending/failed</Text>

        <Pressable onPress={() => void retryAll()} style={({ pressed }) => [styles.primaryButton, pressed ? styles.pressed : null]}>
          <Text style={styles.primaryButtonText}>Retry now</Text>
        </Pressable>

        {isFlushing ? (
          <View style={styles.row}>
            <ActivityIndicator />
            <Text style={styles.muted}>Submitting…</Text>
          </View>
        ) : null}
      </View>

      {items.map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.title}>{item.draft.location || 'Incident'}</Text>
          <Text style={styles.muted}>Status: {item.status} • Attempts: {item.attempts}</Text>
          {isFlushing && activeItemId === item.id ? (
            <Text style={styles.muted}>Upload progress: {Math.round((activeProgress || 0) * 100)}%</Text>
          ) : null}
          {item.lastError ? <Text style={styles.errorText}>Last error: {item.lastError}</Text> : null}

          <View style={styles.footerRow}>
            <Pressable onPress={() => void retryAll()} style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]}>
              <Text style={styles.secondaryButtonText}>Retry</Text>
            </Pressable>
            <Pressable onPress={() => void confirmRemove(item.id)} style={({ pressed }) => [styles.dangerButton, pressed ? styles.pressed : null]}>
              <Text style={styles.dangerButtonText}>Remove</Text>
            </Pressable>
          </View>
        </View>
      ))}

      {items.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.muted}>No queued incidents.</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, backgroundColor: '#ffffff' },
  card: { padding: 12, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, backgroundColor: '#f9fafb', gap: 8 },
  h1: { fontSize: 18, fontWeight: '900', color: '#111827' },
  title: { fontSize: 14, fontWeight: '900', color: '#111827' },
  muted: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
  errorText: { fontSize: 12, color: '#991b1b', fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  footerRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  primaryButton: {
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#ffffff', fontWeight: '900' },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  secondaryButtonText: { color: '#111827', fontWeight: '900' },
  dangerButton: {
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
  },
  dangerButtonText: { color: '#991b1b', fontWeight: '900' },
  pressed: { opacity: 0.9 },
});
