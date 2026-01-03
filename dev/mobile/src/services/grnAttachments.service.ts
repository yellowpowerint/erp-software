import { uploadService } from './upload.service';
import { PickedMedia } from './mediaPicker.service';

export const grnAttachmentsService = {
  async uploadAttachments(grnId: string, attachments: PickedMedia[]) {
    for (const attachment of attachments) {
      await uploadService.uploadFile({
        uploadId: `${grnId}-${attachment.name}`,
        endpoint: `/procurement/goods-receipts/${grnId}/attachments`,
        method: 'POST',
        file: attachment,
        fields: {},
        retryLimit: 2,
      });
    }
  },
};
