import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { http } from '../api/http';
import { parseApiError } from '../api/errors';
import { API_BASE_URL } from '../config';
import { ErrorBanner } from '../components/ErrorBanner';
import { useAuth } from '../auth/AuthContext';

type LeaveType = 'ANNUAL' | 'SICK' | 'PERSONAL' | 'MATERNITY' | 'PATERNITY' | 'STUDY' | 'EMERGENCY';

const LEAVE_TYPES: { value: LeaveType; label: string }[] = [
  { value: 'ANNUAL', label: 'Annual' },
  { value: 'SICK', label: 'Sick' },
  { value: 'PERSONAL', label: 'Personal' },
  { value: 'MATERNITY', label: 'Maternity' },
  { value: 'PATERNITY', label: 'Paternity' },
  { value: 'STUDY', label: 'Study' },
  { value: 'EMERGENCY', label: 'Emergency' },
];

function isIsoDateOnly(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}

function computeTotalDaysInclusive(startDate: string, endDate: string) {
  if (!isIsoDateOnly(startDate) || !isIsoDateOnly(endDate)) return null;

  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

  const diffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const total = diffDays + 1;
  if (total <= 0) return null;
  return total;
}

export function LeaveRequestSubmitScreen() {
  const { me } = useAuth();
  const [leaveType, setLeaveType] = useState<LeaveType>('ANNUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [employeeIdOverride, setEmployeeIdOverride] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalDaysPreview = useMemo(() => computeTotalDaysInclusive(startDate, endDate), [startDate, endDate]);

  const isHr = useMemo(() => me?.role === 'SUPER_ADMIN' || me?.role === 'HR_MANAGER', [me?.role]);

  const canSubmit = useMemo(() => {
    const r = reason.trim();
    const totalDays = computeTotalDaysInclusive(startDate, endDate);
    return Boolean(r.length >= 2 && totalDays && leaveType);
  }, [reason, startDate, endDate, leaveType]);

  const submit = useCallback(async () => {
    setError(null);

    if (!isIsoDateOnly(startDate) || !isIsoDateOnly(endDate)) {
      Alert.alert('Invalid date', 'Use YYYY-MM-DD for both start and end date.');
      return;
    }

    const totalDays = computeTotalDaysInclusive(startDate, endDate);
    if (!totalDays) {
      Alert.alert('Invalid date range', 'End date must be the same or after the start date.');
      return;
    }

    const reasonTrimmed = reason.trim();
    if (reasonTrimmed.length < 2) {
      Alert.alert('Reason required', 'Please enter a reason (min 2 characters).');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        leaveType,
        startDate,
        endDate,
        reason: reasonTrimmed,
      };

      const employeeId = employeeIdOverride.trim();
      if (isHr && employeeId.length > 0) {
        payload.employeeId = employeeId;
      }

      const res = await http.post('/hr/leave-requests', payload);

      setStartDate('');
      setEndDate('');
      setReason('');
      setEmployeeIdOverride('');

      Alert.alert('Submitted', `Leave request submitted successfully.\nStatus: ${res.data?.status ?? 'PENDING'}`);
    } catch (e: any) {
      const parsed = parseApiError(e, API_BASE_URL);
      const statusPart = parsed.status ? ` (${parsed.status})` : '';
      setError(`Failed to submit leave request${statusPart}: ${parsed.message}\nAPI: ${API_BASE_URL}`);
    } finally {
      setSubmitting(false);
    }
  }, [startDate, endDate, reason, leaveType, employeeIdOverride, isHr]);

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {error ? <ErrorBanner message={error} onRetry={() => setError(null)} /> : null}

      <View style={styles.card}>
        <Text style={styles.h1}>Leave Request</Text>
        <Text style={styles.muted}>Submit a leave request for approval.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Leave type</Text>
        <View style={styles.chips}>
          {LEAVE_TYPES.map((t) => (
            <Pressable
              key={t.value}
              onPress={() => setLeaveType(t.value)}
              style={({ pressed }) => [styles.chip, leaveType === t.value ? styles.chipActive : null, pressed ? styles.pressed : null]}
              accessibilityRole="button"
            >
              <Text style={[styles.chipText, leaveType === t.value ? styles.chipTextActive : null]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Start date (YYYY-MM-DD)</Text>
        <TextInput
          value={startDate}
          onChangeText={setStartDate}
          placeholder="2025-01-15"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />

        <Text style={styles.label}>End date (YYYY-MM-DD)</Text>
        <TextInput
          value={endDate}
          onChangeText={setEndDate}
          placeholder="2025-01-16"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />

        <Text style={styles.meta}>{totalDaysPreview ? `Total days: ${totalDaysPreview}` : 'Total days: —'}</Text>

        <Text style={styles.label}>Reason</Text>
        <TextInput value={reason} onChangeText={setReason} style={[styles.input, styles.multiline]} multiline />

        {isHr ? (
          <>
            <Text style={styles.label}>Employee ID (optional)</Text>
            <Text style={styles.muted}>
              HR-only: Paste an employee UUID to submit on behalf of another employee.
            </Text>
            <TextInput
              value={employeeIdOverride}
              onChangeText={setEmployeeIdOverride}
              placeholder="e.g. 3b5c0f84-..."
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
          </>
        ) : null}
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={() => void submit()}
          disabled={!canSubmit || submitting}
          style={({ pressed }) => [styles.primaryButton, !canSubmit || submitting ? styles.disabled : null, pressed ? styles.pressed : null]}
        >
          {submitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryButtonText}>Submit</Text>}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, backgroundColor: '#ffffff' },
  card: { padding: 12, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, backgroundColor: '#f9fafb', gap: 8 },
  h1: { fontSize: 18, fontWeight: '900', color: '#111827' },
  muted: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '800', color: '#111827' },
  meta: { fontSize: 12, fontWeight: '700', color: '#6b7280' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#ffffff',
  },
  chipActive: { backgroundColor: '#111827', borderColor: '#111827' },
  chipText: { fontSize: 12, fontWeight: '900', color: '#111827' },
  chipTextActive: { color: '#ffffff' },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    fontWeight: '700',
    color: '#111827',
  },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  pressed: { opacity: 0.9 },
  footer: { paddingBottom: 14 },
  primaryButton: {
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#ffffff', fontWeight: '900' },
  disabled: { opacity: 0.55 },
});
