import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { employeesService, Employee } from '../services/employees.service';
import { theme } from '../../theme.config';
import { ModulesStackParamList } from '../navigation/types';

const STATUS_FILTERS = ['all', 'active', 'inactive', 'on_leave'];

export default function EmployeeDirectoryScreen() {
  const navigation = useNavigation<NavigationProp<ModulesStackParamList>>();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadEmployees(1, false), 300);
    return () => clearTimeout(timer);
  }, [search, departmentFilter, statusFilter]);

  const loadDepartments = async () => {
    const depts = await employeesService.getDepartments();
    setDepartments(['all', ...depts]);
  };

  const loadEmployees = async (targetPage = 1, append = false) => {
    if (targetPage > 1 && isFetchingMore) return;

    try {
      if (targetPage === 1) {
        setIsLoading(true);
        setError(null);
      } else {
        setIsFetchingMore(true);
      }

      const res = await employeesService.searchEmployees({
        page: targetPage,
        search: search.trim() || undefined,
        department: departmentFilter !== 'all' ? departmentFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });

      setPage(res.page);
      setTotalPages(res.totalPages);
      setEmployees(prev => append ? [...prev, ...res.employees] : res.employees);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        navigation.navigate('NoAccess', { resource: 'employee directory' });
        return;
      }
      setError('Failed to load employees');
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadEmployees(1, false);
  };

  const loadMore = () => {
    if (isLoading || isFetchingMore || page >= totalPages) return;
    loadEmployees(page + 1, true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return theme.colors.success;
      case 'inactive': return theme.colors.textSecondary;
      case 'on_leave': return theme.colors.warning;
      default: return theme.colors.textSecondary;
    }
  };

  const renderItem = ({ item }: { item: Employee }) => (
    <TouchableOpacity style={s.card} onPress={() => navigation.navigate('EmployeeProfile', { employeeId: item.id })}>
      <View style={s.cardContent}>
        {item.profilePhoto ? (
          <Image source={{ uri: item.profilePhoto }} style={s.avatarImage} />
        ) : (
          <View style={s.avatar}>
            <Text style={s.avatarText}>{item.firstName[0]}{item.lastName[0]}</Text>
          </View>
        )}
        <View style={s.cardInfo}>
          <Text style={s.cardName}>{item.firstName} {item.lastName}</Text>
          <Text style={s.cardPosition}>{item.position}</Text>
          <Text style={s.cardDepartment}>{item.department}</Text>
        </View>
        <View style={[s.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[s.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.replace('_', ' ')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return <View style={s.centered}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
  }

  return (
    <FlatList
      data={employees}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      ListHeaderComponent={
        <View>
          <View style={s.headerRow}>
            <Text style={s.title}>Employee Directory</Text>
            <TouchableOpacity
              style={s.leaveButton}
              onPress={() => navigation.navigate('LeaveRequestsList')}
            >
              <Text style={s.leaveButtonText}>📅 Leave</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={s.searchInput}
            placeholder="Search by name, email, or ID..."
            placeholderTextColor={theme.colors.textSecondary}
            value={search}
            onChangeText={setSearch}
          />

          {departments.length > 1 && (
            <View style={s.filterBlock}>
              <Text style={s.filterLabel}>Department</Text>
              <View style={s.filterChips}>
                {departments.map(dept => (
                  <TouchableOpacity key={dept} style={[s.chip, departmentFilter === dept && s.chipActive]} onPress={() => setDepartmentFilter(dept)}>
                    <Text style={[s.chipText, departmentFilter === dept && s.chipTextActive]}>{dept}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={s.filterBlock}>
            <Text style={s.filterLabel}>Status</Text>
            <View style={s.filterChips}>
              {STATUS_FILTERS.map(status => (
                <TouchableOpacity key={status} style={[s.chip, statusFilter === status && s.chipActive]} onPress={() => setStatusFilter(status)}>
                  <Text style={[s.chipText, statusFilter === status && s.chipTextActive]}>{status.replace('_', ' ')}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      }
      contentContainerStyle={s.list}
      ListEmptyComponent={<View style={s.empty}><Text style={s.emptyText}>No employees found</Text></View>}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={isFetchingMore ? <ActivityIndicator style={{ padding: 16 }} color={theme.colors.primary} /> : null}
    />
  );
}

const s = StyleSheet.create({
  list: { padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 24, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text },
  leaveButton: { backgroundColor: theme.colors.surface, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: theme.colors.border },
  leaveButtonText: { fontSize: 14, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.primary },
  searchInput: { backgroundColor: theme.colors.surface, borderRadius: 8, padding: theme.spacing.md, marginBottom: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border, color: theme.colors.text },
  filterBlock: { marginBottom: theme.spacing.md },
  filterLabel: { fontSize: 14, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.text, marginBottom: 8 },
  filterChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: theme.colors.surface, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: theme.colors.border },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { fontSize: 12, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.text },
  chipTextActive: { color: '#fff' },
  card: { backgroundColor: theme.colors.surface, borderRadius: 8, padding: theme.spacing.md, marginBottom: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarImage: { width: 40, height: 40, borderRadius: 20, marginRight: 12, backgroundColor: theme.colors.surface },
  avatarText: { color: '#fff', fontFamily: theme.typography.fontFamily.bold },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.text, marginBottom: 2 },
  cardPosition: { fontSize: 14, color: theme.colors.textSecondary },
  cardDepartment: { fontSize: 12, color: theme.colors.textSecondary },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, marginLeft: theme.spacing.sm },
  statusText: { fontSize: 12, fontFamily: theme.typography.fontFamily.semibold, textTransform: 'capitalize' },
  empty: { padding: theme.spacing.xl, alignItems: 'center' },
  emptyText: { fontSize: 16, color: theme.colors.textSecondary },
});
