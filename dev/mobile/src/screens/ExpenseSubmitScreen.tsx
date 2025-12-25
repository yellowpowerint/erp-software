import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { http } from '../api/http';
import { parseApiError } from '../api/errors';
import { API_BASE_URL } from '../config';
import { ErrorBanner } from '../components/ErrorBanner';
import { useExpenseReceiptQueue, type ReceiptPhoto } from '../finance/ExpenseReceiptQueueContext';

type ExpenseCategory =
  | 'OPERATIONS'
  | 'MAINTENANCE'
  | 'SALARIES'
  | 'SUPPLIES'
  | 'UTILITIES'
  | 'FUEL'
  | 'EQUIPMENT'
  | 'TRAVEL'
  | 'PROFESSIONAL_SERVICES'
  | 'TRAINING'
  | 'INSURANCE'
  | 'OTHER';

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'OPERATIONS', label: 'Operations' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'SALARIES', label: 'Salaries' },
  { value: 'SUPPLIES', label: 'Supplies' },
  { value: 'UTILITIES', label: 'Utilities' },
  { value: 'FUEL', label: 'Fuel' },
  { value: 'EQUIPMENT', label: 'Equipment' },
  { value: 'TRAVEL', label: 'Travel' },
  { value: 'PROFESSIONAL_SERVICES', label: 'Professional services' },
  { value: 'TRAINING', label: 'Training' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'OTHER', label: 'Other' },
];

function isIsoDateOnly(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}

type CreateExpenseResponse = {
  id: string;
  status?: string;
};

export function ExpenseSubmitScreen() {
  const { enqueue, flush } = useExpenseReceiptQueue();

  const [category, setCategory] = useState<ExpenseCategory>('OPERATIONS');
  const [projectId, setProjectId] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [description, setDescription] = useState('');
  const [amountText, setAmountText] = useState('');
  const [currency, setCurrency] = useState('GHS');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<ReceiptPhoto | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    const amt = Number(amountText);
    return Boolean(
      description.trim().length >= 2 &&
        Number.isFinite(amt) &&
        amt > 0 &&
        isIsoDateOnly(expenseDate) &&
        category
    );
  }, [amountText, description, expenseDate, category]);

  const pickReceiptFromCamera = useCallback(async () => {
    try {
      const ImagePicker = require('expo-image-picker') as any;
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm?.granted) {
        Alert.alert('Camera permission required', 'Please enable camera access to capture a receipt photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });

      if (result?.canceled) return;
      const asset = Array.isArray(result?.assets) ? result.assets[0] : null;
      if (!asset?.uri) return;

      setPhoto({
        uri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
      });
    } catch (e: any) {
      Alert.alert('Unable to capture receipt', String(e?.message || e));
    }
  }, []);

  const clearPhoto = useCallback(() => {
    setPhoto(null);
  }, []);

  const submit = useCallback(async () => {
    setError(null);

    if (!isIsoDateOnly(expenseDate)) {
      Alert.alert('Invalid date', 'Use YYYY-MM-DD for expense date.');
      return;
    }

    const desc = description.trim();
    if (desc.length < 2) {
      Alert.alert('Description required', 'Please enter a description (min 2 characters).');
      return;
    }

    const amt = Number(amountText);
    if (!Number.isFinite(amt) || amt <= 0) {
      Alert.alert('Invalid amount', 'Enter a valid amount greater than 0.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        category,
        description: desc,
        amount: amt,
        currency: currency.trim() || 'GHS',
        expenseDate,
        notes: notes.trim() || undefined,
      };

      const pid = projectId.trim();
      if (pid.length > 0) {
        payload.projectId = pid;
      }

      const res = await http.post<CreateExpenseResponse>('/finance/expenses', payload);
      const expenseId = res.data?.id;
      if (!expenseId) {
        throw new Error('Expense created but missing id in response');
      }

      if (photo?.uri) {
        await enqueue(expenseId, photo);
        await flush();
      }

      setProjectId('');
      setExpenseDate('');
      setDescription('');
      setAmountText('');
      setCurrency('GHS');
      setNotes('');
      setPhoto(null);

      const status = res.data?.status ?? 'PENDING';
      if (photo?.uri) {
        Alert.alert('Submitted', `Expense submitted successfully.\nStatus: ${status}\nReceipt upload will retry automatically if needed.`);
      } else {
        Alert.alert('Submitted', `Expense submitted successfully.\nStatus: ${status}`);
      }
    } catch (e: any) {
      const parsed = parseApiError(e, API_BASE_URL);
      const statusPart = parsed.status ? ` (${parsed.status})` : '';
      setError(`Failed to submit expense${statusPart}: ${parsed.message}\nAPI: ${API_BASE_URL}`);
    } finally {
      setSubmitting(false);
    }
  }, [amountText, category, currency, description, enqueue, expenseDate, flush, notes, photo, projectId]);

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {error ? <ErrorBanner message={error} onRetry={() => setError(null)} /> : null}

      <View style={styles.card}>
        <Text style={styles.h1}>Submit Expense</Text>
        <Text style={styles.muted}>Capture an expense and optionally attach a receipt photo.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Category</Text>
        <View style={styles.chips}>
          {CATEGORIES.map((c) => (
            <Pressable
              key={c.value}
              onPress={() => setCategory(c.value)}
              style={({ pressed }) => [styles.chip, category === c.value ? styles.chipActive : null, pressed ? styles.pressed : null]}
              accessibilityRole="button"
            >
              <Text style={[styles.chipText, category === c.value ? styles.chipTextActive : null]}>{c.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Expense date (YYYY-MM-DD)</Text>
        <TextInput
          value={expenseDate}
          onChangeText={setExpenseDate}
          placeholder="2025-01-15"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput value={description} onChangeText={setDescription} style={[styles.input, styles.multiline]} multiline />

        <Text style={styles.label}>Amount</Text>
        <TextInput
          value={amountText}
          onChangeText={setAmountText}
          placeholder="0.00"
          keyboardType="decimal-pad"
          style={styles.input}
        />

        <Text style={styles.label}>Currency</Text>
        <TextInput value={currency} onChangeText={setCurrency} placeholder="GHS" autoCapitalize="characters" style={styles.input} />

        <Text style={styles.label}>Project ID (optional)</Text>
        <Text style={styles.muted}>Paste a project UUID if the expense is tied to a project.</Text>
        <TextInput
          value={projectId}
          onChangeText={setProjectId}
          placeholder="e.g. 3b5c0f84-..."
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />

        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput value={notes} onChangeText={setNotes} style={[styles.input, styles.multilineSmall]} multiline />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Receipt photo (optional)</Text>
        <Text style={styles.muted}>Receipt uploads will retry automatically if the network is unstable.</Text>

        {photo?.uri ? (
          <View style={styles.receiptRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title} numberOfLines={1}>
                {photo.fileName || 'Receipt photo selected'}
              </Text>
              <Text style={styles.muted} numberOfLines={1}>
                {photo.uri}
              </Text>
            </View>

            <Pressable onPress={clearPhoto} style={({ pressed }) => [styles.dangerButton, pressed ? styles.pressed : null]}>
              <Text style={styles.dangerButtonText}>Remove</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => void pickReceiptFromCamera()} style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]}>
            <Text style={styles.secondaryButtonText}>Capture receipt</Text>
          </Pressable>
        )}
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
  title: { fontSize: 13, fontWeight: '900', color: '#111827' },
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
  multilineSmall: { minHeight: 70, textAlignVertical: 'top' },
  receiptRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  footer: { paddingBottom: 14 },
  primaryButton: {
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#ffffff', fontWeight: '900' },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 12,
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
  disabled: { opacity: 0.55 },
});
