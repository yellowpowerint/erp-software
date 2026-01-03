import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export type QueueItemType = 
  | 'incident' 
  | 'expense' 
  | 'leave_request' 
  | 'document_upload'
  | 'approval_action'
  | 'task_update'
  | 'grn_submission';
export type QueueItemStatus = 'pending' | 'submitting' | 'failed' | 'retrying' | 'conflict';

export interface BaseQueueItem {
  id: string;
  type: QueueItemType;
  status: QueueItemStatus;
  retryCount: number;
  lastError?: string;
  errorCode?: string;
  createdAt: string;
  lastAttemptAt?: string;
  nextRetryAt?: string;
  data: any;
}

export interface QueueStats {
  total: number;
  pending: number;
  failed: number;
  submitting: number;
  retrying: number;
  conflict: number;
}

const QUEUE_KEY = '@unified_queue';
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000; // 1 second
const MAX_DELAY_MS = 300000; // 5 minutes

export const queueService = {
  /**
   * Calculate exponential backoff delay
   */
  calculateBackoffDelay(retryCount: number): number {
    const delay = Math.min(BASE_DELAY_MS * Math.pow(2, retryCount), MAX_DELAY_MS);
    // Add jitter (±20%)
    const jitter = delay * 0.2 * (Math.random() - 0.5);
    return Math.floor(delay + jitter);
  },

  /**
   * Get next retry time based on exponential backoff
   */
  getNextRetryTime(retryCount: number): Date {
    const delay = this.calculateBackoffDelay(retryCount);
    return new Date(Date.now() + delay);
  },

  /**
   * Check if item is ready for retry based on exponential backoff
   */
  isReadyForRetry(item: BaseQueueItem): boolean {
    if (!item.nextRetryAt) return true;
    return new Date(item.nextRetryAt) <= new Date();
  },

  /**
   * Get all queue items
   */
  async getQueue(): Promise<BaseQueueItem[]> {
    try {
      const data = await AsyncStorage.getItem(QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load queue:', error);
      return [];
    }
  },

  /**
   * Get queue items by type
   */
  async getQueueByType(type: QueueItemType): Promise<BaseQueueItem[]> {
    const queue = await this.getQueue();
    return queue.filter(item => item.type === type);
  },

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<QueueStats> {
    const queue = await this.getQueue();
    return {
      total: queue.length,
      pending: queue.filter(item => item.status === 'pending').length,
      failed: queue.filter(item => item.status === 'failed').length,
      submitting: queue.filter(item => item.status === 'submitting').length,
      retrying: queue.filter(item => item.status === 'retrying').length,
      conflict: queue.filter(item => item.status === 'conflict').length,
    };
  },

  /**
   * Add item to queue
   */
  async addToQueue(item: Omit<BaseQueueItem, 'status' | 'retryCount' | 'createdAt'>): Promise<void> {
    try {
      const queue = await this.getQueue();
      const queueItem: BaseQueueItem = {
        ...item,
        status: 'pending',
        retryCount: 0,
        createdAt: new Date().toISOString(),
      };
      queue.push(queueItem);
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to add to queue:', error);
      throw error;
    }
  },

  /**
   * Update queue item
   */
  async updateQueueItem(id: string, updates: Partial<BaseQueueItem>): Promise<void> {
    try {
      const queue = await this.getQueue();
      const index = queue.findIndex(item => item.id === id);
      if (index !== -1) {
        queue[index] = { ...queue[index], ...updates };
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      }
    } catch (error) {
      console.error('Failed to update queue item:', error);
    }
  },

  /**
   * Remove item from queue
   */
  async removeFromQueue(id: string): Promise<void> {
    try {
      const queue = await this.getQueue();
      const filtered = queue.filter(item => item.id !== id);
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to remove from queue:', error);
    }
  },

  /**
   * Mark item as failed with exponential backoff
   */
  async markAsFailed(id: string, error: string, errorCode?: string): Promise<void> {
    const queue = await this.getQueue();
    const item = queue.find(q => q.id === id);
    if (!item) return;

    // Check if this is a conflict error (409 or approval already processed)
    const isConflict = errorCode === '409' || 
      error.toLowerCase().includes('already approved') ||
      error.toLowerCase().includes('already rejected') ||
      error.toLowerCase().includes('already processed');

    if (isConflict) {
      await this.updateQueueItem(id, {
        status: 'conflict',
        lastError: error,
        errorCode,
        lastAttemptAt: new Date().toISOString(),
      });
      return;
    }

    const retryCount = item.retryCount + 1;
    const nextRetryAt = retryCount < MAX_RETRIES 
      ? this.getNextRetryTime(retryCount).toISOString()
      : undefined;

    await this.updateQueueItem(id, {
      status: retryCount < MAX_RETRIES ? 'retrying' : 'failed',
      retryCount,
      lastError: error,
      errorCode,
      lastAttemptAt: new Date().toISOString(),
      nextRetryAt,
    });
  },

  /**
   * Reset item for manual retry
   */
  async resetForRetry(id: string): Promise<void> {
    await this.updateQueueItem(id, {
      status: 'pending',
      retryCount: 0,
      lastError: undefined,
      errorCode: undefined,
      nextRetryAt: undefined,
    });
  },

  /**
   * Process queue with exponential backoff
   */
  async processQueue(
    processor: (item: BaseQueueItem) => Promise<void>
  ): Promise<{ processed: number; failed: number; skipped: number }> {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      console.log('No internet connection, skipping queue processing');
      return { processed: 0, failed: 0, skipped: 0 };
    }

    const queue = await this.getQueue();
    const processableItems = queue.filter(
      item => (item.status === 'pending' || item.status === 'retrying') && this.isReadyForRetry(item)
    );

    let processed = 0;
    let failed = 0;
    let skipped = 0;

    for (const item of processableItems) {
      if (item.retryCount >= MAX_RETRIES) {
        skipped++;
        continue;
      }

      try {
        await this.updateQueueItem(item.id, { 
          status: 'submitting',
          lastAttemptAt: new Date().toISOString(),
        });
        
        await processor(item);
        await this.removeFromQueue(item.id);
        processed++;
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error?.message || 'Submission failed';
        const errorCode = error?.response?.status?.toString() || error?.code;
        
        await this.markAsFailed(item.id, errorMessage, errorCode);
        failed++;
      }
    }

    return { processed, failed, skipped };
  },

  /**
   * Get human-readable error guidance
   */
  getErrorGuidance(errorCode?: string, lastError?: string): string {
    if (!errorCode && !lastError) return 'Unknown error occurred';

    switch (errorCode) {
      case '400':
        return 'Invalid data. Please check the form and try again.';
      case '401':
        return 'Session expired. Please log in again.';
      case '403':
        return 'You do not have permission to perform this action.';
      case '404':
        return 'Resource not found. It may have been deleted.';
      case '409':
        return 'This item was already processed by someone else.';
      case '413':
        return 'File too large. Please reduce the file size and try again.';
      case '422':
        return 'Validation failed. Please check your input.';
      case '500':
      case '502':
      case '503':
        return 'Server error. Will retry automatically.';
      case 'NETWORK_ERROR':
      case 'ECONNABORTED':
        return 'Network error. Check your connection.';
      case 'TIMEOUT':
        return 'Request timed out. Will retry automatically.';
      default:
        return lastError || 'An error occurred. Will retry automatically.';
    }
  },

  /**
   * Format time until next retry
   */
  getTimeUntilRetry(nextRetryAt?: string): string | null {
    if (!nextRetryAt) return null;

    const now = new Date();
    const retryTime = new Date(nextRetryAt);
    const diffMs = retryTime.getTime() - now.getTime();

    if (diffMs <= 0) return 'Ready to retry';

    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `Retry in ${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `Retry in ${minutes}m ${seconds % 60}s`;
    return `Retry in ${seconds}s`;
  },

  /**
   * Clear all completed items
   */
  async clearCompleted(): Promise<number> {
    const queue = await this.getQueue();
    const activeItems = queue.filter(item => 
      item.status !== 'failed' || item.retryCount < MAX_RETRIES
    );
    const removedCount = queue.length - activeItems.length;
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(activeItems));
    return removedCount;
  },
};
