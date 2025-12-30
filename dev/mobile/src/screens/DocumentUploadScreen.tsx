import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { theme } from '../../theme.config';
import { Button, Card } from '../components';
import { mediaPickerService, PickedMedia } from '../services/mediaPicker.service';
import { documentsService } from '../services/documents.service';
import { UploadStatus } from '../services/upload.service';
import NetInfo from '@react-native-community/netinfo';

const formatBytes = (bytes?: number) => {
  if (!bytes) return 'Unknown';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${sizes[i]}`;
};

export default function DocumentUploadScreen() {
  const [file, setFile] = useState<PickedMedia | null>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const disableActions = isUploading;

  const statusText = useMemo(() => {
    switch (status) {
      case 'uploading':
        return 'Uploading...';
      case 'success':
        return 'Upload complete';
      case 'failed':
        return error || 'Upload failed';
      case 'canceled':
        return 'Upload canceled';
      default:
        return 'Ready to upload';
    }
  }, [status, error]);

  const pick = async (source: 'camera' | 'library' | 'document') => {
    try {
      setError(undefined);
      let media: PickedMedia | null = null;
      if (source === 'camera') {
        media = await mediaPickerService.pickFromCamera();
      } else if (source === 'library') {
        media = await mediaPickerService.pickFromLibrary();
      } else {
        media = await mediaPickerService.pickDocument();
      }
      if (media) {
        setFile(media);
        setStatus('idle');
        setProgress(0);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to select file');
      Alert.alert('Error', err?.message || 'Failed to select file');
    }
  };

  const cancelUpload = () => {
    if (file) {
      documentsService.cancel(file.uri);
      setIsUploading(false);
      setStatus('canceled');
    }
  };

  const startUpload = async () => {
    if (!file) {
      Alert.alert('Select a file', 'Choose a photo or PDF before uploading.');
      return;
    }

    const net = await NetInfo.fetch();
    if (!net.isConnected) {
      Alert.alert('Offline', 'No connection. Please reconnect and try again.');
      return;
    }

    setIsUploading(true);
    setStatus('uploading');
    setProgress(0);
    setError(undefined);

    const result = await documentsService.uploadDocument(
      {
        uploadId: file.uri,
        fileUri: file.uri,
        fileName: file.name,
        mimeType: file.mimeType,
        size: file.size,
        metadata: { source: 'mobile-app' },
      },
      {
        onProgress: setProgress,
        onStatusChange: setStatus,
      }
    );

    setIsUploading(false);

    if (result.status === 'failed') {
      setError(result.error);
      Alert.alert('Upload failed', result.error || 'Please try again.');
    } else if (result.status === 'success') {
      Alert.alert('Success', 'File uploaded successfully.');
    }
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>Upload Document</Text>
      <Text style={s.subtitle}>Capture or pick a file to upload</Text>

      <View style={s.actionsRow}>
        <Button title="Camera" variant="secondary" size="small" onPress={() => pick('camera')} disabled={disableActions} />
        <Button title="Library" variant="primary" size="small" onPress={() => pick('library')} disabled={disableActions} />
        <Button title="PDF/Doc" variant="outline" size="small" onPress={() => pick('document')} disabled={disableActions} />
      </View>

      {file ? (
        <Card>
          <View style={s.fileRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.fileName}>{file.name}</Text>
              <Text style={s.fileMeta}>{file.mimeType}</Text>
              <Text style={s.fileMeta}>{formatBytes(file.size)}</Text>
            </View>
            <TouchableOpacity onPress={() => setFile(null)} disabled={disableActions}>
              <Text style={s.clearText}>Clear</Text>
            </TouchableOpacity>
          </View>

          <View style={s.progressContainer}>
            <View style={s.progressBarOuter}>
              <View style={[s.progressBarInner, { width: `${progress}%` }]} />
            </View>
            <View style={s.progressMeta}>
              <Text style={s.statusText}>{statusText}</Text>
              <Text style={s.statusText}>{progress}%</Text>
            </View>
          </View>

          {error && <Text style={s.errorText}>{error}</Text>}

          <View style={s.uploadActions}>
            <Button
              title={status === 'failed' ? 'Retry Upload' : 'Start Upload'}
              onPress={startUpload}
              loading={isUploading}
              disabled={isUploading}
              fullWidth
            />
            {isUploading && (
              <Button
                title="Cancel"
                variant="ghost"
                onPress={cancelUpload}
                disabled={!isUploading}
                fullWidth
                style={{ marginTop: theme.spacing.sm }}
              />
            )}
          </View>
        </Card>
      ) : (
        <Card>
          <Text style={s.placeholderText}>No file selected. Choose camera, library, or PDF.</Text>
        </Card>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
  },
  subtitle: {
    marginTop: 4,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  fileName: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text,
  },
  fileMeta: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  clearText: {
    color: theme.colors.error,
    fontFamily: theme.typography.fontFamily.semibold,
  },
  progressContainer: {
    marginTop: theme.spacing.md,
  },
  progressBarOuter: {
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  progressBarInner: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  progressMeta: {
    marginTop: theme.spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  errorText: {
    marginTop: theme.spacing.sm,
    color: theme.colors.error,
    fontSize: theme.typography.fontSize.sm,
  },
  uploadActions: {
    marginTop: theme.spacing.md,
  },
  placeholderText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
});
