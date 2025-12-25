import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { http } from '../api/http';
import { parseApiError } from '../api/errors';
import { API_BASE_URL } from '../config';
import { ErrorBanner } from '../components/ErrorBanner';
import type { HomeStackParamList } from '../navigation/HomeStack';

type StockItemDetail = {
  id: string;
  itemCode: string;
  name: string;
  unit: string;
  currentQuantity: number;
  reorderLevel: number;
  warehouse: { id: string; code: string; name: string };
};

type StockMovement = {
  id: string;
  movementType: string;
  quantity: number;
  previousQty: number;
  newQty: number;
  reference?: string | null;
  notes?: string | null;
  createdAt: string;
};

type PhotoAsset = {
  uri: string;
  fileName?: string;
  mimeType?: string;
};

export function ReceiveStockScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<RouteProp<HomeStackParamList, 'ReceiveStock'>>();
  const { itemId } = route.params;

  const [detail, setDetail] = useState<StockItemDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [quantityText, setQuantityText] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<PhotoAsset | null>(null);

  const trimmedItemId = useMemo(() => String(itemId ?? '').trim(), [itemId]);

  const load = useCallback(async () => {
    if (!trimmedItemId) {
      setError('Missing inventory item id.');
      setDetail(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await http.get<StockItemDetail>(`/inventory/items/${encodeURIComponent(trimmedItemId)}`);
      setDetail(res.data);
    } catch (e: any) {
      const parsed = parseApiError(e, API_BASE_URL);
      const statusPart = parsed.status ? ` (${parsed.status})` : '';
      setError(`Failed to load item${statusPart}: ${parsed.message}\nAPI: ${API_BASE_URL}`);
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [trimmedItemId]);

  useEffect(() => {
    void load();
  }, [load]);

  const pickPhotoFromCamera = useCallback(async () => {
    try {
      const ImagePicker = require('expo-image-picker') as any;
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm?.granted) {
        Alert.alert('Camera permission required', 'Please enable camera access to take a delivery note photo.');
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
      Alert.alert('Unable to capture photo', String(e?.message || e));
    }
  }, []);

  const clearPhoto = useCallback(() => {
    setPhoto(null);
  }, []);

  const submit = useCallback(async () => {
    const qty = parseInt(quantityText, 10);
    if (!Number.isFinite(qty) || qty <= 0) {
      Alert.alert('Invalid quantity', 'Enter a valid quantity to receive.');
      return;
    }

    if (!trimmedItemId) {
      Alert.alert('Missing item', 'Missing inventory item id.');
      return;
    }

    setSubmitting(true);
    setError(null);

    let createdMovement: StockMovement | null = null;

    try {
      const movementRes = await http.post<StockMovement>('/inventory/movements', {
        itemId: trimmedItemId,
        movementType: 'STOCK_IN',
        quantity: qty,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      createdMovement = movementRes.data;

      if (photo?.uri) {
        const formData = new FormData();
        const name = photo.fileName || `delivery-note-${Date.now()}.jpg`;
        const type = photo.mimeType || 'image/jpeg';

        formData.append('file', { uri: photo.uri, name, type } as any);
        formData.append('category', 'RECEIPT');
        formData.append('module', 'inventory_movements');
        formData.append('referenceId', createdMovement.id);
        formData.append('description', 'Delivery note photo (mobile receiving)');

        await http.post('/documents/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      Alert.alert('Received', 'Stock movement recorded successfully.');
      navigation.goBack();
    } catch (e: any) {
      const parsed = parseApiError(e, API_BASE_URL);
      const statusPart = parsed.status ? ` (${parsed.status})` : '';

      if (createdMovement && photo?.uri) {
        Alert.alert(
          'Received (photo failed)',
          `Stock was received, but the delivery note photo could not be uploaded${statusPart}: ${parsed.message}`
        );
        navigation.goBack();
        return;
      }

      setError(`Failed to receive stock${statusPart}: ${parsed.message}\nAPI: ${API_BASE_URL}`);
    } finally {
      setSubmitting(false);
    }
  }, [quantityText, trimmedItemId, reference, notes, photo, navigation]);

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {error ? <ErrorBanner message={error} onRetry={load} /> : null}

      {loading && !detail ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.muted}>Loading…</Text>
        </View>
      ) : null}

      {detail ? (
        <>
          <View style={styles.card}>
            <Text style={styles.h1}>Receive Stock</Text>
            <Text style={styles.muted}>{detail.name}</Text>
            <Text style={styles.muted}>Code: {detail.itemCode}</Text>
            <Text style={styles.muted}>
              Warehouse: {detail.warehouse?.code ? `${detail.warehouse.code} • ` : ''}
              {detail.warehouse?.name ?? '—'}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.h2}>Current stock</Text>
            <Text style={styles.stockQty}>
              {detail.currentQuantity} {detail.unit}
            </Text>
            <Text style={styles.muted}>Reorder ≤ {detail.reorderLevel}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.h2}>Receiving details</Text>

            <Text style={styles.label}>Quantity received</Text>
            <TextInput
              value={quantityText}
              onChangeText={setQuantityText}
              placeholder="Enter quantity"
              keyboardType="number-pad"
              style={styles.input}
            />

            <Text style={styles.label}>Reference (optional)</Text>
            <TextInput
              value={reference}
              onChangeText={setReference}
              placeholder="Delivery note / GRN / Ref"
              autoCapitalize="characters"
              style={styles.input}
            />

            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes"
              multiline
              style={[styles.input, styles.inputMultiline]}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.h2}>Delivery note photo (optional)</Text>

            {photo?.uri ? (
              <View style={{ gap: 10 }}>
                <Image source={{ uri: photo.uri }} style={styles.photo} />
                <Pressable
                  onPress={clearPhoto}
                  style={({ pressed }) => [styles.secondaryButton, pressed ? styles.buttonPressed : null]}
                  accessibilityRole="button"
                >
                  <Text style={styles.secondaryButtonText}>Remove photo</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={pickPhotoFromCamera}
                style={({ pressed }) => [styles.secondaryButton, pressed ? styles.buttonPressed : null]}
                accessibilityRole="button"
              >
                <Text style={styles.secondaryButtonText}>Take photo</Text>
              </Pressable>
            )}
          </View>

          <Pressable
            onPress={submit}
            disabled={submitting}
            style={({ pressed }) => [
              styles.primaryButton,
              submitting ? styles.primaryButtonDisabled : null,
              pressed ? styles.buttonPressed : null,
            ]}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>{submitting ? 'Submitting…' : 'Confirm receiving'}</Text>
          </Pressable>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#ffffff', gap: 12, flexGrow: 1 },
  center: { paddingVertical: 24, alignItems: 'center', gap: 10 },
  card: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, padding: 12, backgroundColor: '#f9fafb', gap: 8 },
  h1: { fontSize: 16, fontWeight: '900', color: '#111827' },
  h2: { fontSize: 12, fontWeight: '900', color: '#111827', opacity: 0.75, textTransform: 'uppercase' },
  muted: { fontSize: 12, fontWeight: '700', color: '#6b7280' },
  stockQty: { fontSize: 22, fontWeight: '900', color: '#111827' },
  label: { fontSize: 12, fontWeight: '900', color: '#111827', opacity: 0.8 },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  inputMultiline: { minHeight: 90, textAlignVertical: 'top' },
  photo: { width: '100%', height: 220, borderRadius: 12, backgroundColor: '#e5e7eb' },
  primaryButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4f46e5',
  },
  primaryButtonDisabled: { opacity: 0.65 },
  primaryButtonText: { color: '#ffffff', fontWeight: '900', fontSize: 14 },
  secondaryButton: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  secondaryButtonText: { color: '#111827', fontWeight: '900', fontSize: 13 },
  buttonPressed: { opacity: 0.9 },
});
