import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { OCRStatus } from '@prisma/client';
import * as crypto from 'crypto';
import axios from 'axios';

interface WebhookPayload {
  event: 'ocr.completed' | 'ocr.failed';
  jobId: string;
  documentId: string;
  status: OCRStatus;
  confidence?: number;
  extractedText?: string;
  errorMessage?: string;
  timestamp: string;
}

@Injectable()
export class OCRWebhookService {
  private readonly logger = new Logger(OCRWebhookService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Send webhook notification for OCR completion
   */
  async notifyOCRComplete(
    jobId: string,
    documentId: string,
    status: OCRStatus,
    confidence?: number,
    extractedText?: string,
    errorMessage?: string,
  ): Promise<void> {
    try {
      const config = await this.getOCRConfiguration();

      // Check if notifications are enabled
      if (status === OCRStatus.COMPLETED && !config.notifyOnCompletion) {
        return;
      }
      if (status === OCRStatus.FAILED && !config.notifyOnFailure) {
        return;
      }

      // Get webhook URLs from config
      const webhookUrls = config.webhookUrls || [];
      if (webhookUrls.length === 0) {
        return;
      }

      const payload: WebhookPayload = {
        event: status === OCRStatus.COMPLETED ? 'ocr.completed' : 'ocr.failed',
        jobId,
        documentId,
        status,
        confidence,
        extractedText: status === OCRStatus.COMPLETED ? extractedText : undefined,
        errorMessage: status === OCRStatus.FAILED ? errorMessage : undefined,
        timestamp: new Date().toISOString(),
      };

      // Send to all configured webhook URLs
      for (const url of webhookUrls) {
        this.sendWebhook(url, payload, config.webhookSecret).catch((error) => {
          this.logger.error(`Failed to send webhook to ${url}:`, error.message);
        });
      }
    } catch (error) {
      this.logger.error('Failed to send webhook notification', error);
    }
  }

  /**
   * Send webhook HTTP request
   */
  private async sendWebhook(
    url: string,
    payload: WebhookPayload,
    secret?: string,
  ): Promise<void> {
    try {
      const headers: any = {
        'Content-Type': 'application/json',
        'User-Agent': 'Mining-ERP-OCR-Webhook/1.0',
      };

      // Add signature if secret is configured
      if (secret) {
        const signature = this.generateSignature(payload, secret);
        headers['X-OCR-Signature'] = signature;
      }

      const response = await axios.post(url, payload, {
        headers,
        timeout: 10000, // 10 second timeout
      });

      this.logger.log(`Webhook sent to ${url}: ${response.status}`);
    } catch (error) {
      this.logger.error(`Webhook failed for ${url}:`, error.message);
      throw error;
    }
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  private generateSignature(payload: WebhookPayload, secret: string): string {
    const payloadString = JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payloadString);
    return `sha256=${hmac.digest('hex')}`;
  }

  /**
   * Get OCR configuration
   */
  private async getOCRConfiguration() {
    const config = await this.prisma.oCRConfiguration.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    const envUrlsRaw = process.env.OCR_WEBHOOK_URLS || '';
    const envUrls = envUrlsRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const envSecret = process.env.OCR_WEBHOOK_SECRET;

    return {
      notifyOnCompletion: config?.notifyOnCompletion ?? true,
      notifyOnFailure: config?.notifyOnFailure ?? true,
      webhookUrls: envUrls,
      webhookSecret: envSecret,
    };
  }
}
