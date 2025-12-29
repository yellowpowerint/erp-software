import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { employeesService, Employee } from '../services/employees.service';
import { theme } from '../../theme.config';
import { ModulesStackParamList } from '../navigation/types';

export default function EmployeeDirectoryScreen() {
  const navigation = useNavigation<NavigationProp<ModulesStackParamList>>();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadEmployees(1, false), 300);
    return () => clearTimeout(timer);
  }, [search, departmentFilter]);

  const loadDepartments = async () => {
    const depts = await employeesService.getDepartments();
    setDepartments(['all', ...depts]);
  };

  const loadEmployees = async (targetPage = 1, append = false) => {
    try {
      if (targetPage === 1) {
        setIsLoading(true);
        setError(null);
      }

      const res = await employeesService.searchEmployees({
        page: targetPage,
        search: search.trim() || undefined,
        department: departmentFilter !== 'all' ? departmentFilter : undefined,
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
      setIsRefreshing(false);
    }
  };

  const renderItem = ({ item }: { item: Employee }) => (
    <TouchableOpacity style={s.card} onPress={() => navigation.navigate('EmployeeProfile', { employeeId: item.id })}>
      <View style={s.cardContent}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{item.firstName[0]}{item.lastName[0]}</Text>
        </View>
        <View style={s.cardInfo}>
          <Text style={s.cardName}>{item.firstName} {item.lastName}</Text>
          <Text style={s.cardPosition}>{item.position}</Text>
          <Text style={s.cardDepartment}>{item.department}</Text>
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
          <Text style={s.title}>Employee Directory</Text>
          <TextInput style={s.searchInput} placeholder="Search..." value={search} onChangeText={setSearch} />
          <View style={s.filterChips}>
            {departments.map(dept => (
              <TouchableOpacity key={dept} style={[s.chip, departmentFilter === dept && s.chipActive]} onPress={() => setDepartmentFilter(dept)}>
                <Text style={s.chipText}>{dept}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      }
      contentContainerStyle={s.list}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); loadEmployees(1, false); }} />}
    />
  );
}

const s = StyleSheet.create({
  list: { padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  searchInput: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#ddd' },
  filterChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { backgroundColor: '#f0f0f0', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  chipActive: { backgroundColor: theme.colors.primary },
  chipText: { fontSize: 12 },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#ddd' },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontWeight: 'bold' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  cardPosition: { fontSize: 14, color: '#666' },
  cardDepartment: { fontSize: 12, color: '#999' },
});
