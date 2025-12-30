export interface Attachment {
  id: string;
  name: string;
  url: string;
  mimeType?: string;
  size?: number;
  uploadedAt?: string;
  uploadedBy?: string;
}
