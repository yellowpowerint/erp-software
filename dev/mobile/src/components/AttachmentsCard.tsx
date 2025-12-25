import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { ErrorBanner } from './ErrorBanner';
import { parseApiError } from '../api/errors';
import { API_BASE_URL } from '../config';
import { pickImageFromCamera, pickImageFromLibrary } from '../uploads/imagePicker';
import { uploadDocument } from '../uploads/uploadDocument';
import { getDocumentsByModule } from '../documents/api';
import type { DocumentItem } from '../documents/types';

type Props = {
  title?: string;
  module: string;
  referenceId: string;
  upload?: {
    category: string;
    description?: string;
    tags?: string[];
  };
};

function formatSize(bytes: number) {
  const b = Number(bytes) || 0;
  if (b <= 0) return '0 B';
  const kb = b / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(1)} GB`;
}

export function AttachmentsCard(props: Props) {
  const navigation = useNavigation<any>();

  const title = props.title ?? 'Attachments';
  const trimmedModule = useMemo(() => String(props.module ?? '').trim(), [props.module]);
  const trimmedRef = useMemo(() => String(props.referenceId ?? '').trim(), [props.referenceId]);

  const [items, setItems] = useState<DocumentItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const canUpload = Boolean(props.upload && trimmedModule && trimmedRef);

  const openDocument = useCallback(
    (id: string) => {
      const docId = String(id || '').trim();
      if (!docId) return;

      navigation.navigate('More', {
        screen: 'DocumentViewer',
        params: { id: docId },
      });
    },
    [navigation]
  );

  const load = useCallback(async () => {
    if (!trimmedModule || !trimmedRef) {
      setItems([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const docs = await getDocumentsByModule(trimmedModule, trimmedRef);
      setItems(Array.isArray(docs) ? docs : []);
    } catch (e: any) {
      const parsed = parseApiError(e, API_BASE_URL);
      const statusPart = parsed.status ? ` (${parsed.status})` : '';
      setError(`Failed to load attachments${statusPart}: ${parsed.message}`);
      setItems(null);
    } finally {
      setLoading(false);
    }
  }, [trimmedModule, trimmedRef]);

  useEffect(() => {
    void load();
  }, [load]);

  const doUpload = useCallback(
    async (source: 'camera' | 'library') => {
      if (!canUpload || !props.upload) return;

      try {
        const picked = source === 'camera' ? await pickImageFromCamera() : await pickImageFromLibrary();
        if (!picked.ok) {
          if ('permissionDenied' in picked) {
            Alert.alert(
              source === 'camera' ? 'Camera permission required' : 'Photo library permission required',
              source === 'camera'
                ? 'Please enable camera access to capture a photo attachment.'
                : 'Please enable photo library access to attach a photo.'
            );
          }
          return;
        }

        setUploading(true);
        setUploadProgress(0);

        await uploadDocument({
          file: picked.file,
          category: props.upload.category,
          module: trimmedModule,
          referenceId: trimmedRef,
          description: props.upload.description,
          tags: props.upload.tags,
        }, {
          onProgress: (p) => setUploadProgress(p),
        });

        await load();
      } catch (e: any) {
        Alert.alert('Upload failed', String(e?.message || e));
      } finally {
        setUploading(false);
      }
    },
    [canUpload, load, props.upload, trimmedModule, trimmedRef]
  );

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{title}</Text>

      {error ? <ErrorBanner message={error} onRetry={load} /> : null}

      {loading ? (
        <View style={styles.centerRow}>
          <ActivityIndicator />
          <Text style={styles.muted}>Loading…</Text>
        </View>
      ) : null}

      {!loading && items && items.length === 0 ? <Text style={styles.muted}>No attachments.</Text> : null}

      {!loading && items && items.length > 0 ? (
        <View style={{ gap: 8 }}>
          {items.map((d) => (
            <Pressable
              key={d.id}
              onPress={() => openDocument(d.id)}
              style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
              accessibilityRole="button"
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {d.originalName || d.fileName}
                </Text>
                <Text style={styles.rowSubtitle} numberOfLines={1}>
                  {d.mimeType || '—'} • {formatSize(d.fileSize)}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {canUpload ? (
        <View style={{ gap: 10, marginTop: 8 }}>
          {uploading ? <Text style={styles.muted}>Uploading… {Math.round(uploadProgress * 100)}%</Text> : null}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              onPress={() => void doUpload('camera')}
              disabled={uploading}
              style={({ pressed }) => [styles.secondaryButton, { flex: 1 }, pressed ? styles.pressed : null, uploading ? styles.disabled : null]}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryButtonText}>Capture</Text>
            </Pressable>
            <Pressable
              onPress={() => void doUpload('library')}
              disabled={uploading}
              style={({ pressed }) => [styles.secondaryButton, { flex: 1 }, pressed ? styles.pressed : null, uploading ? styles.disabled : null]}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryButtonText}>Choose</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#f9fafb',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#111827',
    textTransform: 'uppercase',
    opacity: 0.8,
  },
  muted: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '700',
  },
  centerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  row: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#111827',
  },
  rowSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
  },
  chevron: {
    color: '#6b7280',
    fontWeight: '900',
    fontSize: 18,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  secondaryButtonText: {
    color: '#111827',
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.6,
  },
});
