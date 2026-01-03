import NetInfo from '@react-native-community/netinfo';
import { cacheService } from './cache.service';
import { approvalsService } from './approvals.service';
import { tasksService } from './tasks.service';

export interface DeepLinkResult {
  success: boolean;
  data?: any;
  fromCache: boolean;
  error?: string;
  offline: boolean;
}

/**
 * Deep Link Offline Fallback Service
 * Handles deep links when offline by checking cache first
 */
export const deepLinkOfflineService = {
  /**
   * Fetch approval with offline fallback
   * 1. Check if online - if yes, fetch normally
   * 2. If offline, check cache for approval detail
   * 3. If no cache, return offline error with helpful message
   */
  async fetchApproval(approvalId: string, approvalType: string, userId?: string): Promise<DeepLinkResult> {
    const netState = await NetInfo.fetch();
    
    // Try online fetch first
    if (netState.isConnected) {
      try {
        const data = await approvalsService.getApprovalDetail(approvalType, approvalId);
        // Cache the result for future offline access
        await cacheService.set(`/approvals/${approvalType}/${approvalId}`, data, userId ? { userId } : undefined);
        return {
          success: true,
          data,
          fromCache: false,
          offline: false,
        };
      } catch (error: any) {
        console.error('[DEEP_LINK] Failed to fetch approval online:', error);
        // Fall through to cache check
      }
    }

    // Try cache fallback
    console.log('[DEEP_LINK] Offline or fetch failed, checking cache for approval');
    const cached = await cacheService.get(`/approvals/${approvalType}/${approvalId}`, userId ? { userId } : undefined);
    
    if (cached) {
      return {
        success: true,
        data: cached,
        fromCache: true,
        offline: true,
      };
    }

    // No cache available
    return {
      success: false,
      fromCache: false,
      offline: true,
      error: 'This approval is not available offline. Please connect to the internet to view it.',
    };
  },

  /**
   * Fetch task with offline fallback
   * 1. Check if online - if yes, fetch normally
   * 2. If offline, check cache for task detail
   * 3. If no cache, return offline error with helpful message
   */
  async fetchTask(taskId: string, userId?: string): Promise<DeepLinkResult> {
    const netState = await NetInfo.fetch();
    
    // Try online fetch first
    if (netState.isConnected) {
      try {
        const data = await tasksService.getTaskDetail(taskId);
        // Cache the result for future offline access
        await cacheService.set(`/tasks/${taskId}`, data, userId ? { userId } : undefined);
        return {
          success: true,
          data,
          fromCache: false,
          offline: false,
        };
      } catch (error: any) {
        console.error('[DEEP_LINK] Failed to fetch task online:', error);
        // Fall through to cache check
      }
    }

    // Try cache fallback
    console.log('[DEEP_LINK] Offline or fetch failed, checking cache for task');
    const cached = await cacheService.get(`/tasks/${taskId}`, userId ? { userId } : undefined);
    
    if (cached) {
      return {
        success: true,
        data: cached,
        fromCache: true,
        offline: true,
      };
    }

    // No cache available
    return {
      success: false,
      fromCache: false,
      offline: true,
      error: 'This task is not available offline. Please connect to the internet to view it.',
    };
  },

  /**
   * Check if an approval is available offline (in cache)
   */
  async isApprovalCached(approvalId: string, approvalType: string, userId?: string): Promise<boolean> {
    const cached = await cacheService.get(`/approvals/${approvalType}/${approvalId}`, userId ? { userId } : undefined);
    return !!cached;
  },

  /**
   * Check if a task is available offline (in cache)
   */
  async isTaskCached(taskId: string, userId?: string): Promise<boolean> {
    const cached = await cacheService.get(`/tasks/${taskId}`, userId ? { userId } : undefined);
    return !!cached;
  },

  /**
   * Pre-cache approval details for offline access
   * Useful when user views an approval - cache it for future deep links
   */
  async cacheApproval(approvalId: string, approvalType: string, data: any, userId?: string): Promise<void> {
    await cacheService.set(`/approvals/${approvalType}/${approvalId}`, data, userId ? { userId } : undefined);
  },

  /**
   * Pre-cache task details for offline access
   * Useful when user views a task - cache it for future deep links
   */
  async cacheTask(taskId: string, data: any, userId?: string): Promise<void> {
    await cacheService.set(`/tasks/${taskId}`, data, userId ? { userId } : undefined);
  },
};
