import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ErrorBanner } from '../components/ErrorBanner';
import { useIncidentQueue, type IncidentDraft } from '../safety/IncidentQueueContext';

type PhotoAsset = { uri: string; fileName?: string; mimeType?: string };

const INCIDENT_TYPES: { label: string; value: IncidentDraft['type'] }[] = [
  { label: 'Injury', value: 'INJURY' },
  { label: 'Near miss', value: 'NEAR_MISS' },
  { label: 'Equipment damage', value: 'EQUIPMENT_DAMAGE' },
  { label: 'Environmental', value: 'ENVIRONMENTAL' },
  { label: 'Security', value: 'SECURITY' },
  { label: 'Fire', value: 'FIRE' },
  { label: 'Chemical spill', value: 'CHEMICAL_SPILL' },
  { label: 'Other', value: 'OTHER' },
];

const INCIDENT_SEVERITIES: { label: string; value: IncidentDraft['severity'] }[] = [
  { label: 'Minor', value: 'MINOR' },
  { label: 'Moderate', value: 'MODERATE' },
  { label: 'Serious', value: 'SERIOUS' },
  { label: 'Critical', value: 'CRITICAL' },
  { label: 'Fatal', value: 'FATAL' },
];

function newDraft(): IncidentDraft {
  return {
    type: 'OTHER',
    severity: 'MINOR',
    location: '',
    incidentDate: new Date().toISOString(),
    description: '',
    injuries: '',
    witnessesText: '',
    oshaReportable: false,
    notes: '',
    photos: [],
  };
}

export function IncidentCaptureScreen() {
  const { isBooting, draft, saveDraft, enqueueFromDraft, flush, pendingCount, isFlushing } = useIncidentQueue();
  const [form, setForm] = useState<IncidentDraft>(() => newDraft());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (draft) setForm(draft);
  }, [draft]);

  const update = useCallback(
    async (next: IncidentDraft) => {
      setForm(next);
      await saveDraft(next);
    },
    [saveDraft]
  );

  const canQueue = useMemo(() => Boolean(form.location.trim() && form.description.trim() && form.incidentDate.trim()), [form]);

  const pickPhotoFromCamera = useCallback(async () => {
    try {
      const ImagePicker = require('expo-image-picker') as any;
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm?.granted) {
        Alert.alert('Camera permission required', 'Please enable camera access to capture an incident photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });

      if (result?.canceled) return;
      const asset = Array.isArray(result?.assets) ? result.assets[0] : null;
      if (!asset?.uri) return;

      const photo: PhotoAsset = { uri: asset.uri, fileName: asset.fileName, mimeType: asset.mimeType };
      await update({ ...form, photos: [...(form.photos ?? []), photo] });
    } catch (e: any) {
      Alert.alert('Unable to capture photo', String(e?.message || e));
    }
  }, [form, update]);

  const removePhoto = useCallback(
    async (uri: string) => {
      await update({ ...form, photos: (form.photos ?? []).filter((p) => p.uri !== uri) });
    },
    [form, update]
  );

  const clear = useCallback(async () => {
    await saveDraft(null);
    setForm(newDraft());
  }, [saveDraft]);

  const queue = useCallback(async () => {
    setError(null);
    if (!canQueue) {
      Alert.alert('Missing details', 'Please complete location, date/time, and description.');
      return;
    }

    try {
      await enqueueFromDraft(form, { clearDraft: true });
      await flush();
      setForm(newDraft());
      Alert.alert('Queued', 'Incident saved and queued for submission.');
    } catch (e: any) {
      setError(String(e?.message || e));
    }
  }, [canQueue, enqueueFromDraft, flush, form]);

  if (isBooting) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.muted}>Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {error ? <ErrorBanner message={error} onRetry={() => setError(null)} /> : null}

      <View style={styles.card}>
        <Text style={styles.h1}>Incident Capture</Text>
        <Text style={styles.muted}>Draft saves automatically. Outbox: {pendingCount}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Type</Text>
        <View style={styles.chips}>
          {INCIDENT_TYPES.map((t) => (
            <Pressable
              key={t.value}
              onPress={() => void update({ ...form, type: t.value })}
              style={({ pressed }) => [styles.chip, form.type === t.value ? styles.chipActive : null, pressed ? styles.pressed : null]}
              accessibilityRole="button"
            >
              <Text style={[styles.chipText, form.type === t.value ? styles.chipTextActive : null]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Severity</Text>
        <View style={styles.chips}>
          {INCIDENT_SEVERITIES.map((s) => (
            <Pressable
              key={s.value}
              onPress={() => void update({ ...form, severity: s.value })}
              style={({ pressed }) => [styles.chip, form.severity === s.value ? styles.chipActive : null, pressed ? styles.pressed : null]}
              accessibilityRole="button"
            >
              <Text style={[styles.chipText, form.severity === s.value ? styles.chipTextActive : null]}>{s.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Location</Text>
        <TextInput value={form.location} onChangeText={(t) => void update({ ...form, location: t })} style={styles.input} />

        <Text style={styles.label}>Incident date/time (ISO)</Text>
        <TextInput value={form.incidentDate} onChangeText={(t) => void update({ ...form, incidentDate: t })} style={styles.input} />

        <Text style={styles.label}>Description</Text>
        <TextInput
          value={form.description}
          onChangeText={(t) => void update({ ...form, description: t })}
          style={[styles.input, styles.multiline]}
          multiline
        />

        <Text style={styles.label}>Injuries (optional)</Text>
        <TextInput
          value={form.injuries ?? ''}
          onChangeText={(t) => void update({ ...form, injuries: t })}
          style={[styles.input, styles.multiline]}
          multiline
        />

        <Text style={styles.label}>Witnesses (comma separated)</Text>
        <TextInput
          value={form.witnessesText ?? ''}
          onChangeText={(t) => void update({ ...form, witnessesText: t })}
          style={styles.input}
        />

        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          value={form.notes ?? ''}
          onChangeText={(t) => void update({ ...form, notes: t })}
          style={[styles.input, styles.multiline]}
          multiline
        />

        <Pressable
          onPress={() => void update({ ...form, oshaReportable: !form.oshaReportable })}
          style={({ pressed }) => [styles.toggle, pressed ? styles.pressed : null]}
        >
          <Text style={styles.toggleText}>{form.oshaReportable ? 'OSHA reportable: YES' : 'OSHA reportable: NO'}</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Photos (optional)</Text>
        <Pressable onPress={() => void pickPhotoFromCamera()} style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]}>
          <Text style={styles.secondaryButtonText}>Capture photo</Text>
        </Pressable>

        {(form.photos ?? []).map((p) => (
          <View key={p.uri} style={{ gap: 10, marginTop: 10 }}>
            <Image source={{ uri: p.uri }} style={styles.photo} />
            <Pressable onPress={() => void removePhoto(p.uri)} style={({ pressed }) => [styles.dangerButton, pressed ? styles.pressed : null]}>
              <Text style={styles.dangerButtonText}>Remove photo</Text>
            </Pressable>
          </View>
        ))}
      </View>

      <View style={styles.footerRow}>
        <Pressable
          onPress={() => void queue()}
          disabled={!canQueue}
          style={({ pressed }) => [styles.primaryButton, !canQueue ? styles.disabled : null, pressed ? styles.pressed : null]}
        >
          <Text style={styles.primaryButtonText}>{isFlushing ? 'Submitting…' : 'Save & Queue'}</Text>
        </Pressable>

        <Pressable onPress={() => void clear()} style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]}>
          <Text style={styles.secondaryButtonText}>Clear draft</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, backgroundColor: '#ffffff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#ffffff' },
  card: { padding: 12, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, backgroundColor: '#f9fafb', gap: 8 },
  h1: { fontSize: 18, fontWeight: '900', color: '#111827' },
  muted: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '800', color: '#111827' },
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
  toggle: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 10, backgroundColor: '#ffffff' },
  toggleText: { fontWeight: '800', color: '#111827' },
  pressed: { opacity: 0.9 },
  footerRow: { flexDirection: 'row', gap: 10, paddingBottom: 14 },
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
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: { color: '#111827', fontWeight: '900' },
  disabled: { opacity: 0.55 },
  dangerButton: {
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButtonText: { color: '#991b1b', fontWeight: '900' },
  photo: { width: '100%', height: 180, borderRadius: 12, backgroundColor: '#e5e7eb' },
});
