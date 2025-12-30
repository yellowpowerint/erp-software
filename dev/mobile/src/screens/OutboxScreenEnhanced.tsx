import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { queueService, BaseQueueItem, QueueStats } from '../services/queue.service';
import { theme } from '../../theme.config';

export default function OutboxScreenEnhanced() {
  const [queue, setQueue] = useState<BaseQueueItem[]>([]);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      loadQueue();
    }, [])
  );

  const loadQueue = async (refresh = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);
      
      const [data, queueStats] = await Promise.all([
        queueService.getQueue(),
        queueService.getQueueStats(),
      ]);
      setQueue(data);
      setStats(queueStats);
    } catch (error) {
      console.error('Failed to load queue:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const retryItem = async (id: string) => {
    try {
      setProcessingId(id);
      await queueService.resetForRetry(id);
      await loadQueue();
      Alert.alert('Success', 'Item queued for retry');
    } catch (error) {
      Alert.alert('Error', 'Failed to queue retry');
    } finally {
      setProcessingId(null);
    }
  };

  const removeItem = async (id: string) => {
    Alert.alert('Remove Item', 'Remove from queue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await queueService.removeFromQueue(id);
          await loadQueue();
        },
      },
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return theme.colors.warning;
      case 'submitting': return theme.colors.info;
      case 'retrying': return '#FF9800';
      case 'failed': return theme.colors.error;
      default: return theme.colors.textSecondary;
    }
  };

  const renderItem = ({ item }: { item: BaseQueueItem }) => {
    const timeUntil = queueService.getTimeUntilRetry(item.nextRetryAt);
    const errorGuidance = queueService.getErrorGuidance(item.errorCode, item.lastError);

    return (
      <View style={s.card}>
        <View style={s.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>{item.type.toUpperCase()}</Text>
            <Text style={s.cardSubtitle}>Created: {new Date(item.createdAt).toLocaleString()}</Text>
          </View>
          <View style={[s.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[s.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={s.cardBody}>
          <Text style={s.retryText}>Retries: {item.retryCount}/5</Text>
          {timeUntil && <Text style={s.timeText}>{timeUntil}</Text>}
          {item.lastError && (
            <>
              <Text style={s.errorText}>Error: {item.lastError}</Text>
              <Text style={s.guidanceText}>{errorGuidance}</Text>
            </>
          )}
        </View>

        <View style={s.cardActions}>
          {(item.status === 'failed' || item.status === 'retrying') && (
            <TouchableOpacity
              style={s.retryButton}
              onPress={() => retryItem(item.id)}
              disabled={processingId === item.id}
            >
              {processingId === item.id ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={s.retryButtonText}>Retry Now</Text>
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
  };

  if (isLoading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      {stats && (
        <View style={s.statsBar}>
          <Text style={s.statsText}>Total: {stats.total}</Text>
          <Text style={s.statsText}>Pending: {stats.pending}</Text>
          <Text style={s.statsText}>Failed: {stats.failed}</Text>
        </View>
      )}
      
      {queue.length === 0 ? (
        <View style={s.centered}>
          <Text style={s.emptyText}>No pending submissions</Text>
        </View>
      ) : (
        <FlatList
          data={queue}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadQueue(true)} />}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statsBar: { flexDirection: 'row', justifyContent: 'space-around', padding: 12, backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  statsText: { fontSize: 12, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.text },
  list: { padding: 16 },
  card: { backgroundColor: theme.colors.surface, borderRadius: 8, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardTitle: { fontSize: 14, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text },
  cardSubtitle: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusText: { fontSize: 10, fontFamily: theme.typography.fontFamily.bold },
  cardBody: { marginBottom: 12 },
  retryText: { fontSize: 12, color: theme.colors.textSecondary, marginBottom: 4 },
  timeText: { fontSize: 12, color: theme.colors.info, marginBottom: 4 },
  errorText: { fontSize: 12, color: theme.colors.error, marginTop: 4 },
  guidanceText: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2, fontStyle: 'italic' },
  cardActions: { flexDirection: 'row', gap: 8 },
  retryButton: { flex: 1, backgroundColor: theme.colors.primary, borderRadius: 6, padding: 10, alignItems: 'center' },
  retryButtonText: { fontSize: 14, fontFamily: theme.typography.fontFamily.semibold, color: '#fff' },
  removeButton: { flex: 1, backgroundColor: theme.colors.surface, borderRadius: 6, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.error },
  removeButtonText: { fontSize: 14, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.error },
  emptyText: { fontSize: 16, color: theme.colors.textSecondary },
});
