import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { incidentsService, QueuedIncident } from '../services/incidents.service';
import { theme } from '../../theme.config';

export default function OutboxScreen() {
  const [queue, setQueue] = useState<QueuedIncident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      loadQueue();
    }, [])
  );

  const loadQueue = async () => {
    try {
      setIsLoading(true);
      const data = await incidentsService.getQueue();
      setQueue(data);
    } catch (error) {
      console.error('Failed to load queue:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const retryItem = async (id: string) => {
    try {
      setProcessingId(id);
      await incidentsService.retryQueueItem(id);
      await loadQueue();
      Alert.alert('Success', 'Incident submitted successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit incident. Will retry automatically.');
    } finally {
      setProcessingId(null);
    }
  };

  const removeItem = async (id: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this incident from the queue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await incidentsService.removeFromQueue(id);
            await loadQueue();
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return theme.colors.warning;
      case 'submitting': return theme.colors.info;
      case 'failed': return theme.colors.error;
      default: return theme.colors.textSecondary;
    }
  };

  const getStatusText = (item: QueuedIncident) => {
    if (item.status === 'failed') {
      return `Failed (${item.retryCount}/3 retries)`;
    }
    return item.status.charAt(0).toUpperCase() + item.status.slice(1);
  };

  const renderItem = ({ item }: { item: QueuedIncident }) => (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.cardTitle}>{item.type}</Text>
          <Text style={s.cardSubtitle}>{item.location}</Text>
        </View>
        <View style={[s.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[s.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusText(item)}
          </Text>
        </View>
      </View>

      <View style={s.cardBody}>
        <Text style={s.cardDescription} numberOfLines={2}>{item.description}</Text>
        <Text style={s.cardDate}>Date: {new Date(item.date).toLocaleDateString()}</Text>
        <Text style={s.cardSeverity}>Severity: {item.severity}</Text>
        {item.photoUris.length > 0 && (
          <Text style={s.cardPhotos}>{item.photoUris.length} photo(s) attached</Text>
        )}
        {item.lastError && (
          <Text style={s.errorText}>Error: {item.lastError}</Text>
        )}
      </View>

      <View style={s.cardActions}>
        {item.status === 'failed' && (
          <TouchableOpacity
            style={s.retryButton}
            onPress={() => retryItem(item.id)}
            disabled={processingId === item.id}
          >
            {processingId === item.id ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Text style={s.retryButtonText}>Retry</Text>
            )}
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={s.removeButton}
          onPress={() => removeItem(item.id)}
          disabled={processingId === item.id}
        >
          <Text style={s.removeButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (queue.length === 0) {
    return (
      <View style={s.centered}>
        <Text style={s.emptyText}>No pending submissions</Text>
        <Text style={s.emptySubtext}>Incidents will appear here when offline</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <Text style={s.title}>Outbox</Text>
      <Text style={s.subtitle}>{queue.length} pending submission(s)</Text>
      <FlatList
        data={queue}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.md },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
  title: { fontSize: 24, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: theme.spacing.lg },
  list: { paddingBottom: theme.spacing.lg },
  card: { backgroundColor: theme.colors.surface, borderRadius: 8, padding: theme.spacing.md, marginBottom: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.spacing.sm },
  cardTitle: { fontSize: 16, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.text },
  cardSubtitle: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusText: { fontSize: 10, fontFamily: theme.typography.fontFamily.bold, textTransform: 'uppercase' },
  cardBody: { marginBottom: theme.spacing.sm },
  cardDescription: { fontSize: 14, color: theme.colors.text, marginBottom: 4 },
  cardDate: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 4 },
  cardSeverity: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  cardPhotos: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  errorText: { fontSize: 12, color: theme.colors.error, marginTop: 4, fontStyle: 'italic' },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: theme.spacing.sm },
  retryButton: { flex: 1, backgroundColor: theme.colors.primary, borderRadius: 6, padding: 10, alignItems: 'center' },
  retryButtonText: { fontSize: 14, fontFamily: theme.typography.fontFamily.semibold, color: '#fff' },
  removeButton: { flex: 1, backgroundColor: theme.colors.surface, borderRadius: 6, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.error },
  removeButtonText: { fontSize: 14, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.error },
  emptyText: { fontSize: 18, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.text, marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: theme.colors.textSecondary },
});
