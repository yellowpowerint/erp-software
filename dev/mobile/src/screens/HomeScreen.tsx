/**
 * Home Screen - Dashboard
 * Session M2.1 - Full dashboard with widgets, quick actions, and activity feed
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DashboardWidget, QuickActionsSheet, ActivityItem } from '../components';
import { dashboardService, DashboardData } from '../services/dashboard.service';
import { useAuthStore } from '../store/authStore';
import { theme } from '../../theme.config';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();

  const navigateToTab = (tabName: 'Home' | 'Work' | 'Modules' | 'More') => {
    const parentNav = navigation.getParent();
    if (parentNav) {
      // Switch tabs from inside the Home stack
      parentNav.navigate(tabName as never);
      return;
    }

    // Fallback (should not normally happen)
    navigation.navigate(tabName as never);
  };

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboard = async () => {
    try {
      setError(null);
      const data = await dashboardService.fetchDashboard();
      setDashboardData(data);
    } catch (err: any) {
      console.error('Failed to load dashboard:', err);
      setError('Failed to load dashboard. Pull to refresh.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadDashboard();
  };

  const quickActions = [
    { id: '1', title: 'New Incident', icon: '⚠️', color: theme.colors.error, onPress: () => navigateToTab('Work') },
    { id: '2', title: 'Submit Report', icon: '📄', color: theme.colors.info, onPress: () => navigateToTab('Work') },
    { id: '3', title: 'Request Leave', icon: '🏖️', color: theme.colors.success, onPress: () => navigateToTab('Modules') },
    { id: '4', title: 'View Schedule', icon: '📅', color: theme.colors.warning, onPress: () => navigateToTab('Work') },
    { id: '5', title: 'Equipment', icon: '🔧', color: theme.colors.primary, onPress: () => navigateToTab('Modules') },
    { id: '6', title: 'Documents', icon: '📁', color: theme.colors.secondary, onPress: () => navigateToTab('Modules') },
    { id: '7', title: 'Training', icon: '🎓', color: theme.colors.info, onPress: () => navigateToTab('Modules') },
    { id: '8', title: 'More', icon: '⋯', color: theme.colors.textSecondary, onPress: () => navigateToTab('More') },
  ];

  // Role-based visibility (simple example: hide critical alerts for non-admin)
  const userRole = user?.role || dashboardData?.userRole || 'staff';
  const canSeeAlerts = userRole !== 'guest';
  const canSeeIncidents = userRole !== 'guest';

  const greeting = dashboardService.getGreeting();
  const userName =
    (user?.firstName && user?.lastName && `${user.firstName} ${user.lastName}`) ||
    dashboardData?.userName ||
    'User';

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>{greeting},</Text>
          <Text style={styles.userName}>{userName}</Text>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.widgetsSection}>
          <DashboardWidget
            title="Pending Approvals"
            count={dashboardData?.stats.pendingApprovals || 0}
            icon="✓"
            color={theme.colors.primary}
            onPress={() => navigateToTab('Work')}
          />
          <DashboardWidget
            title="Active Tasks"
            count={dashboardData?.stats.activeTasks || 0}
            icon="📋"
            color={theme.colors.info}
            onPress={() => navigateToTab('Work')}
          />
          {canSeeAlerts && (
            <DashboardWidget
              title="Critical Alerts"
              count={dashboardData?.stats.criticalAlerts || 0}
              icon="🔔"
              color={theme.colors.error}
              onPress={() => navigation.navigate('Notifications' as never)}
            />
          )}
          {canSeeIncidents && (
            <DashboardWidget
              title="Recent Incidents"
              count={dashboardData?.stats.recentIncidents || 0}
              icon="⚠️"
              color={theme.colors.warning}
              onPress={() => navigateToTab('Work')}
            />
          )}
        </View>

        <TouchableOpacity style={styles.quickActionsButton} onPress={() => setShowQuickActions(true)}>
          <Text style={styles.quickActionsIcon}>⚡</Text>
          <Text style={styles.quickActionsText}>Quick Actions</Text>
        </TouchableOpacity>

        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
            dashboardData.recentActivity.map((item) => (
              <ActivityItem
                key={item.id}
                type={item.type}
                title={item.title}
                description={item.description}
                timestamp={item.timestamp}
                status={item.status}
                priority={item.priority}
                onPress={() => navigation.navigate('Work' as never)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No recent activity</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <QuickActionsSheet visible={showQuickActions} onClose={() => setShowQuickActions(false)} actions={quickActions} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollView: { flex: 1 },
  scrollContent: { padding: theme.spacing.md },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
  loadingText: { fontSize: theme.typography.fontSize.base, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textSecondary },
  header: { marginBottom: theme.spacing.lg },
  greeting: { fontSize: theme.typography.fontSize.lg, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textSecondary },
  userName: { fontSize: theme.typography.fontSize.xxxl, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text },
  errorBanner: { backgroundColor: theme.colors.error + '20', borderRadius: theme.borderRadius.md, padding: theme.spacing.md, marginBottom: theme.spacing.md },
  errorText: { fontSize: theme.typography.fontSize.sm, fontFamily: theme.typography.fontFamily.medium, color: theme.colors.error },
  widgetsSection: { marginBottom: theme.spacing.md },
  quickActionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md,
  },
  quickActionsIcon: { fontSize: 24, marginRight: theme.spacing.sm },
  quickActionsText: { fontSize: theme.typography.fontSize.lg, fontFamily: theme.typography.fontFamily.bold, color: '#FFFFFF' },
  activitySection: { marginBottom: theme.spacing.xl },
  sectionTitle: { fontSize: theme.typography.fontSize.lg, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text, marginBottom: theme.spacing.md },
  emptyState: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.xl, alignItems: 'center' },
  emptyStateText: { fontSize: theme.typography.fontSize.sm, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textSecondary },
});
