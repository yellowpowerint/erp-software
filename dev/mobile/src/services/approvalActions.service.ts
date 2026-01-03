import { queueService, BaseQueueItem } from './queue.service';
import { approvalsService } from './approvals.service';
import { generateUUID } from '../utils/uuid';
import NetInfo from '@react-native-community/netinfo';

export interface ApprovalActionData {
  approvalId: string;
  approvalType: string;
  action: 'approve' | 'reject';
  comment?: string;
}

export const approvalActionsService = {
  /**
   * Queue an approval action (approve/reject)
   * Will execute immediately if online, or queue for later if offline
   */
  async queueApprovalAction(data: ApprovalActionData): Promise<{ queued: boolean; error?: string }> {
    const netState = await NetInfo.fetch();
    
    // Try to execute immediately if online
    if (netState.isConnected) {
      try {
        await this.executeApprovalAction(data);
        return { queued: false };
      } catch (error: any) {
        // If it's a network error, queue it
        if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network')) {
          console.log('[APPROVAL_ACTIONS] Network error, queuing action');
        } else {
          // Other errors (validation, conflict, etc.) should not be queued
          throw error;
        }
      }
    }

    // Queue for later
    console.log('[APPROVAL_ACTIONS] Offline, queuing action');
    await queueService.addToQueue({
      id: generateUUID(),
      type: 'approval_action',
      data,
    });

    return { queued: true };
  },

  /**
   * Execute an approval action
   */
  async executeApprovalAction(data: ApprovalActionData): Promise<void> {
    const { approvalId, approvalType, action, comment } = data;

    if (action === 'approve') {
      await approvalsService.approveApproval(approvalType, approvalId, comment);
    } else {
      await approvalsService.rejectApproval(approvalType, approvalId, comment || 'Rejected');
    }
  },

  /**
   * Process queued approval actions
   */
  async processQueue(): Promise<{ processed: number; failed: number; skipped: number }> {
    return await queueService.processQueue(async (item: BaseQueueItem) => {
      if (item.type !== 'approval_action') return;
      
      const data = item.data as ApprovalActionData;
      await this.executeApprovalAction(data);
    });
  },

  /**
   * Get pending approval actions from queue
   */
  async getPendingActions(): Promise<BaseQueueItem[]> {
    return await queueService.getQueueByType('approval_action');
  },

  /**
   * Check if an approval has a pending action in the queue
   */
  async hasPendingAction(approvalId: string): Promise<boolean> {
    const queue = await this.getPendingActions();
    return queue.some(item => {
      const data = item.data as ApprovalActionData;
      return data.approvalId === approvalId && 
        (item.status === 'pending' || item.status === 'retrying' || item.status === 'submitting');
    });
  },

  /**
   * Get pending action for a specific approval
   */
  async getPendingAction(approvalId: string): Promise<BaseQueueItem | null> {
    const queue = await this.getPendingActions();
    return queue.find(item => {
      const data = item.data as ApprovalActionData;
      return data.approvalId === approvalId && 
        (item.status === 'pending' || item.status === 'retrying' || item.status === 'submitting');
    }) || null;
  },

  /**
   * Remove pending action for a specific approval
   */
  async removePendingAction(approvalId: string): Promise<void> {
    const action = await this.getPendingAction(approvalId);
    if (action) {
      await queueService.removeFromQueue(action.id);
    }
  },
};
