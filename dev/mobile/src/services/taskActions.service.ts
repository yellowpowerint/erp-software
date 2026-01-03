import { queueService, BaseQueueItem } from './queue.service';
import { tasksService, TaskStatus } from './tasks.service';
import { generateUUID } from '../utils/uuid';
import NetInfo from '@react-native-community/netinfo';

export interface TaskUpdateData {
  taskId: string;
  status?: TaskStatus;
  comment?: string;
  assignedToId?: string;
}

export const taskActionsService = {
  /**
   * Queue a task update (status change, comment, assignment)
   * Will execute immediately if online, or queue for later if offline
   */
  async queueTaskUpdate(data: TaskUpdateData): Promise<{ queued: boolean; error?: string }> {
    const netState = await NetInfo.fetch();
    
    // Try to execute immediately if online
    if (netState.isConnected) {
      try {
        await this.executeTaskUpdate(data);
        return { queued: false };
      } catch (error: any) {
        // If it's a network error, queue it
        if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network')) {
          console.log('[TASK_ACTIONS] Network error, queuing update');
        } else {
          // Other errors (validation, not found, etc.) should not be queued
          throw error;
        }
      }
    }

    // Queue for later
    console.log('[TASK_ACTIONS] Offline, queuing update');
    await queueService.addToQueue({
      id: generateUUID(),
      type: 'task_update',
      data,
    });

    return { queued: true };
  },

  /**
   * Execute a task update
   */
  async executeTaskUpdate(data: TaskUpdateData): Promise<void> {
    const { taskId, status, comment, assignedToId } = data;

    // Update task status if provided
    if (status) {
      await tasksService.updateTaskStatus(taskId, status);
    }

    // Add comment if provided
    if (comment) {
      await tasksService.addTaskComment(taskId, comment);
    }

    // Update assignment if provided
    if (assignedToId) {
      await tasksService.updateTaskAssignment(taskId, assignedToId);
    }
  },

  /**
   * Process queued task updates
   */
  async processQueue(): Promise<{ processed: number; failed: number; skipped: number }> {
    return await queueService.processQueue(async (item: BaseQueueItem) => {
      if (item.type !== 'task_update') return;
      
      const data = item.data as TaskUpdateData;
      await this.executeTaskUpdate(data);
    });
  },

  /**
   * Get pending task updates from queue
   */
  async getPendingUpdates(): Promise<BaseQueueItem[]> {
    return await queueService.getQueueByType('task_update');
  },

  /**
   * Check if a task has a pending update in the queue
   */
  async hasPendingUpdate(taskId: string): Promise<boolean> {
    const queue = await this.getPendingUpdates();
    return queue.some(item => {
      const data = item.data as TaskUpdateData;
      return data.taskId === taskId && 
        (item.status === 'pending' || item.status === 'retrying' || item.status === 'submitting');
    });
  },

  /**
   * Get pending updates for a specific task
   */
  async getPendingUpdatesForTask(taskId: string): Promise<BaseQueueItem[]> {
    const queue = await this.getPendingUpdates();
    return queue.filter(item => {
      const data = item.data as TaskUpdateData;
      return data.taskId === taskId && 
        (item.status === 'pending' || item.status === 'retrying' || item.status === 'submitting');
    });
  },

  /**
   * Remove pending updates for a specific task
   */
  async removePendingUpdates(taskId: string): Promise<void> {
    const updates = await this.getPendingUpdatesForTask(taskId);
    for (const update of updates) {
      await queueService.removeFromQueue(update.id);
    }
  },
};
