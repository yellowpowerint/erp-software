import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

import { useIncidentQueue } from '../safety/IncidentQueueContext';
import { useExpenseReceiptQueue } from '../finance/ExpenseReceiptQueueContext';

function formatDateTime(value: string | null | undefined) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

function isPermanentHttpStatus(status: number) {
  return status >= 400 && status < 500 && status !== 408 && status !== 429;
}

function summarizeGuidance(lastStatus?: number, lastError?: string) {
  if (lastStatus === 401) return 'Session expired. Please log in again and retry.';
  if (lastStatus === 403) return 'Permission denied. If this is unexpected, contact an admin.';
  if (lastStatus === 404) return 'Target not found. The record may have been deleted. Remove and re-create if needed.';
  if (lastStatus === 409) return 'Conflict: this item may already exist. Remove it or re-capture if needed.';
  if (lastStatus === 413) return 'Attachment too large. Remove and upload a smaller file.';
  if (lastStatus === 422) return 'Validation failed. Remove and re-create with corrected details.';
  if (lastStatus && isPermanentHttpStatus(lastStatus)) return 'Permanent error. Remove this item and try again from the form.';

  const msg = String(lastError || '').toLowerCase();
  if (msg.includes('network') || msg.includes('offline')) return 'Network issue. It will retry automatically when online.';
  if (msg.includes('timeout')) return 'Timeout. It will retry automatically.';
  return 'Temporary error. You can retry now or wait for automatic retry.';
}

export function OutboxScreen() {
  const incident = useIncidentQueue();
  const receipts = useExpenseReceiptQueue();

  const totalPending = useMemo(() => incident.pendingCount + receipts.pendingCount, [incident.pendingCount, receipts.pendingCount]);

  const isFlushing = incident.isFlushing || receipts.isFlushing;

  const retryAll = useCallback(async () => {
    const net = await NetInfo.fetch();
    const offline = net.isConnected === false || net.isInternetReachable === false;
    if (offline) {
      Alert.alert('Offline', 'Connect to the internet to retry queued items.');
      return;
    }

    await Promise.all([incident.flush(), receipts.flush()]);
  }, [incident, receipts]);

  const confirmRemoveAll = useCallback(() => {
    if (totalPending <= 0) return;
    Alert.alert('Clear outbox?', 'This will delete all queued items from this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            for (const item of [...incident.items]) {
              await incident.removeItem(item.id);
            }
            for (const item of [...receipts.items]) {
              await receipts.removeItem(item.id);
            }
          })();
        },
      },
    ]);
  }, [incident, receipts, totalPending]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.h1}>Outbox</Text>
        <Text style={styles.muted}>{totalPending} pending/failed</Text>

        <View style={styles.buttonRow}>
          <Pressable
            onPress={() => void retryAll()}
            style={({ pressed }) => [styles.primaryButton, pressed ? styles.pressed : null]}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>Retry now</Text>
          </Pressable>

          <Pressable
            onPress={confirmRemoveAll}
            disabled={totalPending <= 0}
            style={({ pressed }) => [styles.dangerButton, totalPending <= 0 ? styles.disabled : null, pressed ? styles.pressed : null]}
            accessibilityRole="button"
          >
            <Text style={styles.dangerButtonText}>Clear</Text>
          </Pressable>
        </View>

        {isFlushing ? (
          <View style={styles.row}>
            <ActivityIndicator />
            <Text style={styles.muted}>Processing…</Text>
          </View>
        ) : null}

        <Text style={styles.help}>
          Queued items are stored on this device and will retry automatically when you are back online.
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Incidents</Text>
        <Text style={styles.sectionMeta}>{incident.pendingCount}</Text>
      </View>

      {incident.items.map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.title}>{item.draft.location || 'Incident'}</Text>
          <Text style={styles.muted}>Status: {item.status} • Attempts: {item.attempts}</Text>
          <Text style={styles.muted}>Created: {formatDateTime(item.createdAt)}</Text>
          {item.nextAttemptAt ? <Text style={styles.muted}>Next retry: {formatDateTime(item.nextAttemptAt)}</Text> : null}
          {incident.isFlushing && incident.activeItemId === item.id ? (
            <Text style={styles.muted}>Progress: {Math.round((incident.activeProgress || 0) * 100)}%</Text>
          ) : null}
          {item.lastError ? <Text style={styles.errorText}>Last error: {item.lastError}</Text> : null}
          <Text style={styles.guidance}>{summarizeGuidance(item.lastStatus, item.lastError)}</Text>

          <View style={styles.footerRow}>
            <Pressable
              onPress={() => void incident.retryItem(item.id)}
              style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryButtonText}>Retry</Text>
            </Pressable>
            <Pressable
              onPress={() =>
                Alert.alert('Remove queued incident?', 'This will delete it from the outbox.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Remove', style: 'destructive', onPress: () => void incident.removeItem(item.id) },
                ])
              }
              style={({ pressed }) => [styles.dangerButton, pressed ? styles.pressed : null]}
              accessibilityRole="button"
            >
              <Text style={styles.dangerButtonText}>Remove</Text>
            </Pressable>
          </View>
        </View>
      ))}

      {incident.items.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.muted}>No queued incidents.</Text>
        </View>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Receipts</Text>
        <Text style={styles.sectionMeta}>{receipts.pendingCount}</Text>
      </View>

      {receipts.items.map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.title}>Expense: {item.expenseId}</Text>
          <Text style={styles.muted}>Status: {item.status} • Attempts: {item.attempts}</Text>
          <Text style={styles.muted}>Created: {formatDateTime(item.createdAt)}</Text>
          {item.nextAttemptAt ? <Text style={styles.muted}>Next retry: {formatDateTime(item.nextAttemptAt)}</Text> : null}
          {receipts.isFlushing && receipts.activeItemId === item.id ? (
            <Text style={styles.muted}>Progress: {Math.round((receipts.activeProgress || 0) * 100)}%</Text>
          ) : null}
          {item.lastError ? <Text style={styles.errorText}>Last error: {item.lastError}</Text> : null}
          <Text style={styles.guidance}>{summarizeGuidance(item.lastStatus, item.lastError)}</Text>

          <View style={styles.footerRow}>
            <Pressable
              onPress={() => void receipts.retryItem(item.id)}
              style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryButtonText}>Retry</Text>
            </Pressable>
            <Pressable
              onPress={() =>
                Alert.alert('Remove queued receipt?', 'This will delete it from the outbox.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Remove', style: 'destructive', onPress: () => void receipts.removeItem(item.id) },
                ])
              }
              style={({ pressed }) => [styles.dangerButton, pressed ? styles.pressed : null]}
              accessibilityRole="button"
            >
              <Text style={styles.dangerButtonText}>Remove</Text>
            </Pressable>
          </View>
        </View>
      ))}

      {receipts.items.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.muted}>No queued receipts.</Text>
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
  help: { fontSize: 12, color: '#374151', fontWeight: '700' },
  guidance: { fontSize: 12, color: '#111827', fontWeight: '700' },
  errorText: { fontSize: 12, color: '#991b1b', fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  sectionTitle: { fontSize: 13, fontWeight: '900', color: '#111827', opacity: 0.8, textTransform: 'uppercase' },
  sectionMeta: { fontSize: 12, fontWeight: '900', color: '#6b7280' },
  buttonRow: { flexDirection: 'row', gap: 10 },
  footerRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  primaryButton: {
    flex: 1,
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
  disabled: { opacity: 0.6 },
});
