import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { createDownloadResumable } from 'expo-file-system/legacy';
import type { DownloadProgressData, FileSystemNetworkTaskProgressCallback } from 'expo-file-system/legacy';

import { ErrorBanner } from '../components/ErrorBanner';
import { parseApiError } from '../api/errors';
import { API_BASE_URL } from '../config';
import type { MoreStackParamList } from '../navigation/MoreStack';
import { getDocument, getDocumentDownloadUrl, getMyDocumentPermissions } from '../documents/api';
import { ensureCacheDirReady, getDocumentCachePath } from '../documents/fileCache';
import type { DocumentItem, EffectiveDocumentPermissions } from '../documents/types';

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

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

export function DocumentViewerScreen() {
  const route = useRoute<RouteProp<MoreStackParamList, 'DocumentViewer'>>();
  const id = route.params?.id;

  const trimmedId = useMemo(() => String(id ?? '').trim(), [id]);

  const [doc, setDoc] = useState<DocumentItem | null>(null);
  const [perms, setPerms] = useState<EffectiveDocumentPermissions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noAccess, setNoAccess] = useState(false);

  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [cachedUri, setCachedUri] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!trimmedId) {
      setError('Missing document id.');
      setDoc(null);
      setPerms(null);
      setNoAccess(false);
      return;
    }

    setLoading(true);
    setError(null);
    setNoAccess(false);

    try {
      const [d, p] = await Promise.all([getDocument(trimmedId), getMyDocumentPermissions(trimmedId)]);
      setDoc(d);
      setPerms(p);
    } catch (e: any) {
      const parsed = parseApiError(e, API_BASE_URL);
      if (parsed.status === 403) {
        setNoAccess(true);
        setDoc(null);
        setPerms(null);
        setError(null);
        return;
      }
      const statusPart = parsed.status ? ` (${parsed.status})` : '';
      setError(`Failed to load document${statusPart}: ${parsed.message}\nAPI: ${API_BASE_URL}`);
      setDoc(null);
      setPerms(null);
    } finally {
      setLoading(false);
    }
  }, [trimmedId]);

  useEffect(() => {
    void load();
  }, [load]);

  const downloadToCache = useCallback(async () => {
    if (!doc) return;
    if (!perms?.canDownload) {
      Alert.alert('No permission', 'You do not have permission to download this document.');
      return;
    }

    setDownloading(true);
    setProgress(0);

    try {
      await ensureCacheDirReady();

      const { url } = await getDocumentDownloadUrl(doc.id);
      const target = getDocumentCachePath({ id: doc.id, mimeType: doc.mimeType, filename: doc.originalName });

      const callback: FileSystemNetworkTaskProgressCallback<DownloadProgressData> = (evt) => {
        const total = typeof evt?.totalBytesExpectedToWrite === 'number' ? evt.totalBytesExpectedToWrite : 0;
        const written = typeof evt?.totalBytesWritten === 'number' ? evt.totalBytesWritten : 0;
        if (total > 0) {
          setProgress(Math.max(0, Math.min(1, written / total)));
        }
      };

      const task = createDownloadResumable(url, target, {}, callback);
      const res = await task.downloadAsync();
      if (!res?.uri) {
        throw new Error('Download failed: missing local uri');
      }

      setProgress(1);
      setCachedUri(res.uri);
      return res.uri;
    } finally {
      setDownloading(false);
    }
  }, [doc, perms?.canDownload]);

  const openDocument = useCallback(async () => {
    if (!doc) return;

    try {
      let uri = cachedUri;
      if (!uri && String(doc.mimeType ?? '').toLowerCase().includes('pdf')) {
        uri = (await downloadToCache()) ?? null;
      }

      const toOpen = uri ?? doc.fileUrl;
      const can = await Linking.canOpenURL(toOpen);
      if (!can) {
        Alert.alert('Cannot open', 'No compatible app found to open this file.');
        return;
      }
      await Linking.openURL(toOpen);
    } catch (e: any) {
      Alert.alert('Open failed', String(e?.message || e));
    }
  }, [doc, cachedUri, downloadToCache]);

  const shareDocument = useCallback(async () => {
    if (!doc) return;
    if (!perms?.canShare) {
      Alert.alert('No permission', 'You do not have permission to share this document.');
      return;
    }

    try {
      let shareUrl: string | null = null;
      if (perms?.canDownload) {
        const { url } = await getDocumentDownloadUrl(doc.id);
        shareUrl = url;
      } else {
        shareUrl = doc.fileUrl;
      }

      await Share.share({
        message: shareUrl,
        title: doc.originalName || 'Document',
      });
    } catch (e: any) {
      Alert.alert('Share failed', String(e?.message || e));
    }
  }, [doc, perms]);

  if (loading && !doc && !noAccess && !error) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.muted}>Loading document…</Text>
      </View>
    );
  }

  if (noAccess) {
    return (
      <View style={styles.center}>
        <Text style={styles.noAccessTitle}>No access</Text>
        <Text style={styles.muted}>You do not have permission to view this document.</Text>
        <Pressable onPress={() => void load()} style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]}>
          <Text style={styles.secondaryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {error ? <ErrorBanner message={error} onRetry={load} /> : null}

      {doc ? (
        <>
          <View style={styles.card}>
            <Text style={styles.h1} numberOfLines={2}>
              {doc.originalName || doc.fileName}
            </Text>
            <Text style={styles.meta}>{doc.category ?? '—'} • {doc.module ?? '—'}</Text>
            <Text style={styles.meta}>Size: {formatSize(doc.fileSize)} • Type: {doc.mimeType ?? '—'}</Text>
            <Text style={styles.meta}>Uploaded: {formatDateTime(doc.createdAt)}</Text>
            <Text style={styles.meta}>Updated: {formatDateTime(doc.updatedAt)}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Actions</Text>

            <Pressable onPress={() => void openDocument()} style={({ pressed }) => [styles.primaryButton, pressed ? styles.pressed : null]}>
              <Text style={styles.primaryButtonText}>Open</Text>
            </Pressable>

            {perms?.canDownload ? (
              <Pressable
                onPress={() => void downloadToCache()}
                style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]}
                disabled={downloading}
              >
                <Text style={styles.secondaryButtonText}>{downloading ? `Downloading… ${Math.round(progress * 100)}%` : 'Download for offline'}</Text>
              </Pressable>
            ) : null}

            {perms?.canShare ? (
              <Pressable onPress={() => void shareDocument()} style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]}>
                <Text style={styles.secondaryButtonText}>Share</Text>
              </Pressable>
            ) : null}

            {!perms?.canShare && !perms?.canDownload ? (
              <Text style={styles.muted}>Sharing and download are restricted for this document.</Text>
            ) : null}
          </View>

          {perms ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Permissions</Text>
              <Text style={styles.body}>View: {perms.canView ? 'YES' : 'NO'}</Text>
              <Text style={styles.body}>Download: {perms.canDownload ? 'YES' : 'NO'}</Text>
              <Text style={styles.body}>Share: {perms.canShare ? 'YES' : 'NO'}</Text>
            </View>
          ) : null}
        </>
      ) : (
        <View style={styles.center}>
          <Text style={styles.muted}>Document not loaded.</Text>
          <Pressable onPress={() => void load()} style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]}>
            <Text style={styles.secondaryButtonText}>Retry</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#ffffff',
    gap: 12,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 12,
    backgroundColor: '#ffffff',
  },
  muted: {
    color: '#6b7280',
    fontWeight: '700',
    textAlign: 'center',
  },
  noAccessTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#f9fafb',
    gap: 6,
  },
  h1: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },
  meta: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#111827',
    textTransform: 'uppercase',
    opacity: 0.8,
  },
  body: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 18,
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '900',
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
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.9,
  },
});
