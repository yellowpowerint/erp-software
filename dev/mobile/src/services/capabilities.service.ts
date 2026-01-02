/**
 * Capabilities Service
 * Fetches and manages user capabilities (modules + permissions)
 */

import { apiClient } from './api.service';
import { errorService } from './error.service';

export interface UserCapabilities {
  userId: string;
  role: string;
  departmentId: string | null;
  modules: string[];
  capabilities: {
    // Approvals
    canViewApprovals: boolean;
    canApprove: boolean;
    canReject: boolean;
    
    // Tasks
    canViewTasks: boolean;
    canUpdateTasks: boolean;
    canCreateTasks: boolean;
    
    // Inventory & Receiving
    canViewInventory: boolean;
    canReceiveStock: boolean;
    canAdjustStock: boolean;
    
    // Safety
    canCreateIncident: boolean;
    canViewAllIncidents: boolean;
    canCreateInspection: boolean;
    
    // Fleet
    canCreateFleetInspection: boolean;
    canLogFuel: boolean;
    canReportBreakdown: boolean;
    
    // Procurement
    canCreateRequisition: boolean;
    canViewAllRequisitions: boolean;
    
    // Documents
    canUploadDocuments: boolean;
    canShareDocuments: boolean;
    
    // HR
    canViewAllEmployees: boolean;
    canApproveLeave: boolean;
    
    // Expenses
    canApproveExpenses: boolean;
  };
}

export const capabilitiesService = {
  /**
   * Fetch user capabilities from backend
   */
  async getUserCapabilities(): Promise<UserCapabilities> {
    try {
      const response = await apiClient.get<UserCapabilities>('/mobile/capabilities');
      return response.data;
    } catch (error: any) {
      const normalized = errorService.normalize(error);
      console.error('Failed to fetch user capabilities:', {
        statusCode: normalized.statusCode,
        message: normalized.message,
      });
      throw new Error(normalized.statusCode ? `${normalized.message} (HTTP ${normalized.statusCode})` : normalized.message);
    }
  },
};
