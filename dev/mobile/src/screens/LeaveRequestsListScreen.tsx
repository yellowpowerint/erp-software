import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation, NavigationProp, useFocusEffect } from '@react-navigation/native';
import { leaveRequestsService, LeaveRequest } from '../services/leaveRequests.service';
import { theme } from '../../theme.config';
import { ModulesStackParamList } from '../navigation/types';

export default function LeaveRequestsListScreen() {
  const navigation = useNavigation<NavigationProp<ModulesStackParamList>>();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  useFocusEffect(
    React.useCallback(() => {
      loadRequests();
    }, [statusFilter])
  );

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const res = await leaveRequestsService.getLeaveRequests({
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setRequests(res.requests);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        navigation.navigate('NoAccess', { resource: 'leave requests' });
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return theme.colors.success;
      case 'rejected': return theme.colors.error;
      case 'pending': return theme.colors.warning;
      default: return theme.colors.textSecondary;
    }
  };

  const renderItem = ({ item }: { item: LeaveRequest }) => (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.cardTitle}>{item.leaveType}</Text>
          <Text style={s.cardEmployee}>{item.employeeName}</Text>
        </View>
        <View style={[s.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[s.statusText, { color: getStatusColor(item.status) }]}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={s.cardDates}>{new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()} ({item.days} days)</Text>
      <Text style={s.cardReason} numberOfLines={2}>{item.reason}</Text>
    </View>
  );

  if (isLoading) {
    return <View style={s.centered}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
  }

  return (
    <FlatList
      data={requests}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      ListHeaderComponent={
        <View>
          <View style={s.header}>
            <Text style={s.title}>Leave Requests</Text>
            <TouchableOpacity style={s.newButton} onPress={() => navigation.navigate('LeaveRequest')}>
              <Text style={s.newButtonText}>+ New</Text>
            </TouchableOpacity>
          </View>
          <View style={s.filterChips}>
            {['all', 'pending', 'approved', 'rejected'].map(status => (
              <TouchableOpacity key={status} style={[s.chip, statusFilter === status && s.chipActive]} onPress={() => setStatusFilter(status)}>
                <Text style={s.chipText}>{status}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      }
      contentContainerStyle={s.list}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); loadRequests(); }} />}
    />
  );
}

const s = StyleSheet.create({
  list: { padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold' },
  newButton: { backgroundColor: theme.colors.primary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  newButtonText: { color: '#fff', fontWeight: 'bold' },
  filterChips: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  chip: { backgroundColor: '#f0f0f0', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  chipActive: { backgroundColor: theme.colors.primary },
  chipText: { fontSize: 12 },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#ddd' },
  cardHeader: { flexDirection: 'row', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardEmployee: { fontSize: 14, color: '#666' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  cardDates: { fontSize: 14, color: '#666', marginBottom: 8 },
  cardReason: { fontSize: 14, color: '#333' },
});
