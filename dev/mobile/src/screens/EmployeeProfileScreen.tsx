import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { employeesService, EmployeeDetail } from '../services/employees.service';
import { theme } from '../../theme.config';
import { ModulesStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';

type EmployeeProfileRouteProp = RouteProp<ModulesStackParamList, 'EmployeeProfile'>;

export default function EmployeeProfileScreen() {
  const route = useRoute<EmployeeProfileRouteProp>();
  const navigation = useNavigation();
  const user = useAuthStore(state => state.user);
  const { employeeId } = route.params;
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEmployee();
  }, [employeeId]);

  const loadEmployee = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const data = await employeesService.getEmployeeProfile(employeeId);
      setEmployee(data);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        (navigation as any).navigate('NoAccess', { 
          resource: 'employee profile', 
          message: 'You do not have permission to view this profile' 
        });
        return;
      }
      if (err?.response?.status === 404) {
        (navigation as any).navigate('NotFound', { 
          resource: 'employee', 
          message: 'This employee was not found' 
        });
        return;
      }
      setError('Failed to load employee profile');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const canViewSensitiveFields = () => {
    return user?.role === 'admin' || user?.role === 'hr_manager';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return theme.colors.success;
      case 'inactive': return theme.colors.textSecondary;
      case 'on_leave': return theme.colors.warning;
      default: return theme.colors.textSecondary;
    }
  };

  if (isLoading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error || !employee) {
    return (
      <View style={s.centered}>
        <Text style={s.errorText}>{error || 'Employee not found'}</Text>
        <TouchableOpacity style={s.retryButton} onPress={() => loadEmployee()}>
          <Text style={s.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={s.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => loadEmployee(true)}
          tintColor={theme.colors.primary}
        />
      }
    >
      <View style={s.header}>
        <View style={s.avatarLarge}>
          <Text style={s.avatarLargeText}>
            {employee.firstName[0]}{employee.lastName[0]}
          </Text>
        </View>
        <Text style={s.name}>{employee.firstName} {employee.lastName}</Text>
        <Text style={s.position}>{employee.position}</Text>
        <View style={[s.statusBadge, { backgroundColor: getStatusColor(employee.status) + '20' }]}>
          <Text style={[s.statusText, { color: getStatusColor(employee.status) }]}>
            {employee.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Contact Information</Text>
        <View style={s.detailRow}>
          <Text style={s.detailLabel}>Email:</Text>
          <Text style={s.detailValue}>{employee.email}</Text>
        </View>
        {employee.phone && (
          <View style={s.detailRow}>
            <Text style={s.detailLabel}>Phone:</Text>
            <Text style={s.detailValue}>{employee.phone}</Text>
          </View>
        )}
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Employment Details</Text>
        <View style={s.detailRow}>
          <Text style={s.detailLabel}>Employee ID:</Text>
          <Text style={s.detailValue}>{employee.employeeId}</Text>
        </View>
        <View style={s.detailRow}>
          <Text style={s.detailLabel}>Department:</Text>
          <Text style={s.detailValue}>{employee.department}</Text>
        </View>
        <View style={s.detailRow}>
          <Text style={s.detailLabel}>Hire Date:</Text>
          <Text style={s.detailValue}>{new Date(employee.hireDate).toLocaleDateString()}</Text>
        </View>
        {employee.manager && (
          <View style={s.detailRow}>
            <Text style={s.detailLabel}>Manager:</Text>
            <Text style={s.detailValue}>{employee.manager}</Text>
          </View>
        )}
      </View>

      {canViewSensitiveFields() && (
        <>
          {employee.salary && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Compensation</Text>
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Salary:</Text>
                <Text style={s.detailValue}>${employee.salary.toLocaleString()}</Text>
              </View>
            </View>
          )}

          {(employee.dateOfBirth || employee.nationalId || employee.address) && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Personal Information</Text>
              {employee.dateOfBirth && (
                <View style={s.detailRow}>
                  <Text style={s.detailLabel}>Date of Birth:</Text>
                  <Text style={s.detailValue}>{new Date(employee.dateOfBirth).toLocaleDateString()}</Text>
                </View>
              )}
              {employee.nationalId && (
                <View style={s.detailRow}>
                  <Text style={s.detailLabel}>National ID:</Text>
                  <Text style={s.detailValue}>{employee.nationalId}</Text>
                </View>
              )}
              {employee.address && (
                <View style={s.detailRow}>
                  <Text style={s.detailLabel}>Address:</Text>
                  <Text style={s.detailValue}>{employee.address}</Text>
                </View>
              )}
            </View>
          )}

          {(employee.bankAccount || employee.emergencyContact) && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Additional Information</Text>
              {employee.bankAccount && (
                <View style={s.detailRow}>
                  <Text style={s.detailLabel}>Bank Account:</Text>
                  <Text style={s.detailValue}>{employee.bankAccount}</Text>
                </View>
              )}
              {employee.emergencyContact && (
                <View style={s.detailRow}>
                  <Text style={s.detailLabel}>Emergency Contact:</Text>
                  <Text style={s.detailValue}>{employee.emergencyContact}</Text>
                </View>
              )}
            </View>
          )}
        </>
      )}

      {employee.reports && employee.reports.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Direct Reports ({employee.reports.length})</Text>
          {employee.reports.map(report => (
            <TouchableOpacity
              key={report.id}
              style={s.reportCard}
              onPress={() => (navigation as any).navigate('EmployeeProfile', { employeeId: report.id })}
            >
              <Text style={s.reportName}>{report.firstName} {report.lastName}</Text>
              <Text style={s.reportPosition}>{report.position}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
  header: { padding: theme.spacing.lg, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  avatarLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: theme.spacing.md },
  avatarLargeText: { fontSize: 32, fontFamily: theme.typography.fontFamily.bold, color: '#fff' },
  name: { fontSize: 24, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text, marginBottom: 4 },
  position: { fontSize: 16, color: theme.colors.textSecondary, marginBottom: theme.spacing.sm },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
  statusText: { fontSize: 12, fontFamily: theme.typography.fontFamily.bold },
  section: { padding: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  sectionTitle: { fontSize: 18, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text, marginBottom: theme.spacing.sm },
  detailRow: { flexDirection: 'row', marginBottom: 8 },
  detailLabel: { fontSize: 14, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.textSecondary, width: 140 },
  detailValue: { fontSize: 14, color: theme.colors.text, flex: 1 },
  reportCard: { backgroundColor: theme.colors.surface, borderRadius: 8, padding: theme.spacing.md, marginBottom: theme.spacing.sm, borderWidth: 1, borderColor: theme.colors.border },
  reportName: { fontSize: 14, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.text },
  reportPosition: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  errorText: { fontSize: 16, color: theme.colors.error, marginBottom: theme.spacing.md },
  retryButton: { backgroundColor: theme.colors.primary, borderRadius: 8, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md },
  retryButtonText: { fontSize: 16, fontFamily: theme.typography.fontFamily.bold, color: '#fff' },
});
