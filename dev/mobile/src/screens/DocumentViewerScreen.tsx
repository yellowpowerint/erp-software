import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Image, ScrollView, Linking } from 'react-native';
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import * as Sharing from 'expo-sharing';
import { documentsService } from '../services/documents.service';
import { ModulesStackParamList } from '../navigation/types';
import { theme } from '../../theme.config';
import { Button, Card } from '../components';

type ViewerRoute = RouteProp<ModulesStackParamList, 'DocumentViewer'>;

const LARGE_FILE_BYTES = 20 * 1024 * 1024; // 20MB threshold

export default function DocumentViewerScreen() {
  const route = useRoute<ViewerRoute>();
  const { documentId, url: initialUrl, name: initialName } = route.params || {};
  const navigation = useNavigation<NavigationProp<ModulesStackParamList>>();

  const [name, setName] = useState(initialName || 'Document');
  const [url, setUrl] = useState<string | undefined>(initialUrl);
  const [mimeType, setMimeType] = useState<string | undefined>(undefined);
  const [size, setSize] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(!!documentId);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [localUri, setLocalUri] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!documentId) return;
      try {
        setIsLoading(true);
        const doc = await documentsService.getDocumentDetail(documentId);
        setName(doc.name || 'Document');
        setMimeType(doc.mimeType);
        setSize(doc.size);
        setUrl(doc.url);
      } catch (err: any) {
        console.error('Failed to load document detail', err);
        const status = err?.response?.status;
        if (status === 403) {
          navigation.navigate('NoAccess', { resource: 'Document' });
          return;
        }
        if (status === 404) {
          navigation.navigate('NotFound', { resource: 'Document' });
          return;
        }
        setError(err?.message || 'Failed to load document.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [documentId]);

  const isImage = useMemo(() => mimeType?.startsWith('image/'), [mimeType]);
  const isPdf = useMemo(() => mimeType === 'application/pdf' || (url && url.toLowerCase().endsWith('.pdf')), [mimeType, url]);
  const viewerUrl = localUri || url;

  const handleDownload = async () => {
    if (!url) {
      Alert.alert('No URL', 'This document has no download URL.');
      return;
    }
    try {
      setIsDownloading(true);
      const filename = name || 'document';
      const res = await documentsService.downloadDocument(url, filename);
      setLocalUri(res.localUri);
      Alert.alert('Downloaded', 'File cached for offline viewing.');
    } catch (err: any) {
      Alert.alert('Download failed', err?.message || 'Could not download document.');
    } finally {
      setIsDownloading(false);
    }
  };

  const openExternal = async () => {
    const target = localUri || url;
    if (!target) {
      Alert.alert('No URL', 'This document has no URL to open.');
      return;
    }
    try {
      const canOpen = await Linking.canOpenURL(target);
      if (!canOpen) {
        Alert.alert('Cannot open', 'No application available to open this file.');
        return;
      }
      await Linking.openURL(target);
    } catch (err: any) {
      Alert.alert('Open failed', err?.message || 'Could not open the document.');
    }
  };

  const shareDocument = async () => {
    const sharingAvailable = await Sharing.isAvailableAsync();
    if (!sharingAvailable) {
      return openExternal();
    }
    let targetUri = localUri || url;
    try {
      setIsSharing(true);
      if (!targetUri) {
        if (!url) {
          Alert.alert('No URL', 'This document has no URL to share.');
          return;
        }
        const filename = name || 'document';
        const res = await documentsService.downloadDocument(url, filename);
        targetUri = res.localUri;
        setLocalUri(res.localUri);
      }
      await Sharing.shareAsync(targetUri);
    } catch (err: any) {
      Alert.alert('Share failed', err?.message || 'Could not share the document.');
    } finally {
      setIsSharing(false);
    }
  };

  const guardLargeFile = () => {
    if (size && size > LARGE_FILE_BYTES) {
      Alert.alert(
        'Large file',
        `This file is ${formatBytes(size)}. Continue to load?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Load', onPress: () => setError(null) },
        ]
      );
      return true;
    }
    return false;
  };

  const renderViewer = () => {
    if (!viewerUrl) {
      return <Text style={s.helperText}>No document URL available.</Text>;
    }

    if (isPdf) {
      if (guardLargeFile()) {
        // Large file guard will prompt; keep UI simple after prompt
      }
      return (
        <View style={s.viewerBox}>
          <WebView
            source={{ uri: viewerUrl }}
            startInLoadingState
            renderLoading={() => <ActivityIndicator style={{ marginTop: theme.spacing.lg }} color={theme.colors.primary} />}
            onError={(syntheticEvent) => {
              console.error('PDF render error', syntheticEvent.nativeEvent);
              setError('Failed to render PDF. Try downloading instead.');
            }}
          />
        </View>
      );
    }

    if (isImage) {
      return (
        <View style={s.viewerBox}>
          <ScrollView maximumZoomScale={3} minimumZoomScale={1} contentContainerStyle={{ alignItems: 'center' }}>
            <Image source={{ uri: viewerUrl }} style={s.image} resizeMode="contain" />
          </ScrollView>
        </View>
      );
    }

    return (
      <Text style={s.helperText}>
        Unsupported type: {mimeType || 'unknown'}. Try downloading to open externally.
      </Text>
    );
  };

  if (isLoading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={s.helperText}>Loading document...</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <Card style={{ marginBottom: theme.spacing.md }}>
        <Text style={s.title}>{name}</Text>
        <Text style={s.meta}>{mimeType || 'Unknown type'} • {formatBytes(size)}</Text>
      </Card>

      <Card style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
        {renderViewer()}
      </Card>

      {error && <Text style={s.errorText}>{error}</Text>}

      <View style={s.actions}>
        <Button title="Download" onPress={handleDownload} loading={isDownloading} disabled={isDownloading} />
        <Button title="Share / Open" variant="outline" onPress={shareDocument} loading={isSharing} disabled={isSharing} style={{ marginTop: theme.spacing.sm }} />
        {localUri ? (
          <Text style={s.helperText}>Cached: {localUri}</Text>
        ) : null}
      </View>
    </View>
  );
}

function formatBytes(bytes?: number) {
  if (!bytes) return 'Unknown size';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${sizes[i]}`;
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  meta: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  viewerBox: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    minHeight: 300,
  },
  image: {
    width: '100%',
    height: 500,
    backgroundColor: theme.colors.surface,
  },
  helperText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.base,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  errorText: {
    marginTop: theme.spacing.sm,
    color: theme.colors.error,
    fontSize: theme.typography.fontSize.sm,
  },
  actions: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
});
