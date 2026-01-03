import NetInfo from '@react-native-community/netinfo';
import { queueService } from './queue.service';
import { grnService, CreateGRNDto } from './grn.service';
import { grnAttachmentsService } from './grnAttachments.service';
import { PickedMedia } from './mediaPicker.service';

export const grnActionsService = {
  async submitGRN(dto: CreateGRNDto, attachments?: PickedMedia[]): Promise<{ success: boolean; queued?: boolean; grnId?: string; error?: string }> {
    const netState = await NetInfo.fetch();

    if (netState.isConnected) {
      try {
        const result = await grnService.createGRN(dto);
        console.log('[GRN] Submitted successfully:', result.id);
        return { success: true, grnId: result.id };
      } catch (error: any) {
        console.error('[GRN] Submission failed:', error);
        if (error.response?.status >= 500 || !error.response) {
          await this.queueGRN(dto, attachments);
          return { success: true, queued: true };
        }
        return { success: false, error: error.response?.data?.message || 'Failed to submit GRN' };
      }
    } else {
      await this.queueGRN(dto, attachments);
      return { success: true, queued: true };
    }
  },

  async queueGRN(dto: CreateGRNDto, attachments?: PickedMedia[]): Promise<void> {
    await queueService.addToQueue({
      id: `grn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'grn_submission',
      data: { dto, attachments },
    });
    console.log('[GRN] Queued for offline submission with attachments');
  },

  async processQueue(): Promise<void> {
    const items = await queueService.getQueue();
    const grnItems = items.filter((item: any) => item.type === 'grn_submission');

    for (const item of grnItems) {
      if (!queueService.isReadyForRetry(item)) continue;

      try {
        await queueService.updateQueueItem(item.id, { status: 'submitting' });
        const { dto, attachments } = item.data;
        const result = await grnService.createGRN(dto);
        
        if (attachments && attachments.length > 0) {
          try {
            await grnAttachmentsService.uploadAttachments(result.id, attachments);
            console.log('[GRN] Attachments uploaded for queued GRN:', result.id);
          } catch (attachError) {
            console.error('[GRN] Failed to upload attachments for queued GRN:', attachError);
          }
        }
        
        await queueService.removeFromQueue(item.id);
        console.log('[GRN] Queue item processed:', result.id);
      } catch (error: any) {
        const status = error.response?.status;
        if (status === 409 || status === 400) {
          await queueService.updateQueueItem(item.id, { status: 'conflict', lastError: error.response?.data?.message });
        } else if (item.retryCount >= 5) {
          await queueService.markAsFailed(item.id, 'Max retries exceeded');
        } else {
          await queueService.markAsFailed(item.id, error.message);
        }
      }
    }
  },
};
