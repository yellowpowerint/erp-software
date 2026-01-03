import { queueService, BaseQueueItem } from './queue.service';
import { approvalActionsService } from './approvalActions.service';
import { taskActionsService } from './taskActions.service';
import NetInfo from '@react-native-community/netinfo';

export const queueProcessorService = {
  /**
   * Process all queued items (approvals, tasks, incidents, expenses, etc.)
   */
  async processAllQueues(): Promise<{
    total: { processed: number; failed: number; skipped: number };
    byType: Record<string, { processed: number; failed: number; skipped: number }>;
  }> {
    const netState = await NetInfo.fetch();
    
    if (!netState.isConnected) {
      console.log('[QUEUE_PROCESSOR] Offline, skipping queue processing');
      return {
        total: { processed: 0, failed: 0, skipped: 0 },
        byType: {},
      };
    }

    console.log('[QUEUE_PROCESSOR] Processing all queues...');

    const results = {
      total: { processed: 0, failed: 0, skipped: 0 },
      byType: {} as Record<string, { processed: number; failed: number; skipped: number }>,
    };

    // Process approval actions
    try {
      const approvalResult = await approvalActionsService.processQueue();
      results.byType.approval_action = approvalResult;
      results.total.processed += approvalResult.processed;
      results.total.failed += approvalResult.failed;
      results.total.skipped += approvalResult.skipped;
      console.log('[QUEUE_PROCESSOR] Approval actions:', approvalResult);
    } catch (error) {
      console.error('[QUEUE_PROCESSOR] Error processing approval actions:', error);
    }

    // Process task updates
    try {
      const taskResult = await taskActionsService.processQueue();
      results.byType.task_update = taskResult;
      results.total.processed += taskResult.processed;
      results.total.failed += taskResult.failed;
      results.total.skipped += taskResult.skipped;
      console.log('[QUEUE_PROCESSOR] Task updates:', taskResult);
    } catch (error) {
      console.error('[QUEUE_PROCESSOR] Error processing task updates:', error);
    }

    // Note: Other queue types (incidents, expenses, leave, documents) are processed
    // by their respective services independently. They each call queueService.processQueue
    // with their own processor functions. We don't process them here to avoid double-processing.

    console.log('[QUEUE_PROCESSOR] Total results:', results.total);
    return results;
  },

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    return await queueService.getQueueStats();
  },

  /**
   * Clear completed items from queue
   */
  async clearCompleted() {
    return await queueService.clearCompleted();
  },
};
