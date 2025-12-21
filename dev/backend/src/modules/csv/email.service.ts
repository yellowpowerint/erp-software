import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";

export type EmailAttachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {}

  private createTransport() {
    const host = this.configService.get<string>("SMTP_HOST");
    const port = Number(this.configService.get<string>("SMTP_PORT", "587"));
    const user = this.configService.get<string>("SMTP_USER");
    const pass = this.configService.get<string>("SMTP_PASS");
    const secure =
      this.configService.get<string>("SMTP_SECURE", "false") === "true";

    if (!host || !user || !pass) {
      throw new Error("SMTP is not configured (SMTP_HOST/SMTP_USER/SMTP_PASS)");
    }

    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
  }

  async sendEmail(opts: {
    to: string[];
    subject: string;
    text: string;
    attachments?: EmailAttachment[];
  }) {
    const from =
      this.configService.get<string>("SMTP_FROM") ||
      this.configService.get<string>("SMTP_USER");
    if (!from) {
      throw new Error("SMTP_FROM or SMTP_USER must be configured");
    }

    const transport = this.createTransport();

    const info = await transport.sendMail({
      from,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      attachments: (opts.attachments || []).map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
    });

    this.logger.log(`Email sent: ${info.messageId}`);
    return info;
  }
}
