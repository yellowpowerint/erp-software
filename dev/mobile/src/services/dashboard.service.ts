/**
 * Dashboard Service
 * Session M2.1 - Home dashboard data fetching
 */

import { apiClient } from './api.service';

export interface DashboardStats {
  pendingApprovals: number;
  activeTasks: number;
  criticalAlerts: number;
  recentIncidents: number;
}

export interface ActivityItem {
  id: string;
  type: 'approval' | 'task' | 'incident' | 'alert';
  title: string;
  description: string;
  timestamp: string;
  status?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface DashboardData {
  stats: DashboardStats;
  recentActivity: ActivityItem[];
  userName: string;
  userRole: string;
}

export const dashboardService = {
  /**
   * Fetch dashboard data
   */
  async fetchDashboard(): Promise<DashboardData> {
    try {
      const response = await apiClient.get<any>('/reports/dashboard');
      
      return {
        stats: {
          pendingApprovals: response.data.pendingApprovals || 0,
          activeTasks: response.data.activeTasks || 0,
          criticalAlerts: response.data.criticalAlerts || 0,
          recentIncidents: response.data.recentIncidents || 0,
        },
        recentActivity: this.mapActivity(response.data.recentActivity || []),
        userName: response.data.userName || 'User',
        userRole: response.data.userRole || 'Staff',
      };
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
      throw error;
    }
  },

  /**
   * Map backend activity to frontend format
   */
  mapActivity(items: any[]): ActivityItem[] {
    return items.map((item: any) => ({
      id: item.id || String(Math.random()),
      type: item.type || 'task',
      title: item.title || 'Activity',
      description: item.description || '',
      timestamp: item.timestamp || new Date().toISOString(),
      status: item.status,
      priority: item.priority,
    }));
  },

  /**
   * Get greeting based on time of day
   */
  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  },
};
