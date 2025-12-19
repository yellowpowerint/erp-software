export enum OCRProvider {
  TESSERACT_JS = 'TESSERACT_JS',
  GOOGLE_VISION = 'GOOGLE_VISION',
  AWS_TEXTRACT = 'AWS_TEXTRACT',
}

export enum OCRStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum ExtractedDataType {
  INVOICE = 'INVOICE',
  RECEIPT = 'RECEIPT',
  CONTRACT = 'CONTRACT',
  GENERAL_TEXT = 'GENERAL_TEXT',
  STRUCTURED_DATA = 'STRUCTURED_DATA',
}

export interface OCRJob {
  id: string;
  documentId: string;
  provider: OCRProvider;
  status: OCRStatus;
  priority: number;
  startedAt?: string;
  completedAt?: string;
  processingTime?: number;
  extractedText?: string;
  confidence?: number;
  pageCount?: number;
  errorMessage?: string;
  language: string;
  autoRotate: boolean;
  enhanceImage: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  extractedData?: ExtractedDocumentData[];
}

export interface ExtractedDocumentData {
  id: string;
  ocrJobId: string;
  documentId: string;
  dataType: ExtractedDataType;
  extractedFields: any;
  confidence?: number;
  
  // Invoice fields
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  supplierName?: string;
  supplierAddress?: string;
  totalAmount?: number;
  taxAmount?: number;
  currency?: string;
  
  // Receipt fields
  vendorName?: string;
  receiptNumber?: string;
  receiptDate?: string;
  receiptAmount?: number;
  paymentMethod?: string;
  
  // Contract fields
  contractNumber?: string;
  contractDate?: string;
  partyNames?: string[];
  contractValue?: number;
  startDate?: string;
  endDate?: string;
  
  // General fields
  entities?: any;
  keyPhrases?: string[];
  
  // Validation
  isValidated: boolean;
  validatedById?: string;
  validatedAt?: string;
  correctedFields?: any;
  correctionNotes?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface OCRConfiguration {
  id?: string;
  defaultProvider: OCRProvider;
  autoOCREnabled: boolean;
  autoOCRCategories: string[];
  maxConcurrentJobs: number;
  defaultLanguage: string;
  confidenceThreshold: number;
  tesseractConfig?: any;
  googleVisionConfig?: any;
  awsTextractConfig?: any;
  autoCreateInvoice: boolean;
  autoCreateExpense: boolean;
  autoCreateContract: boolean;
  notifyOnCompletion: boolean;
  notifyOnFailure: boolean;
  retainRawText: boolean;
  retainExtractedData: boolean;
  updatedById?: string;
  updatedAt?: string;
}

export interface InvoiceData {
  invoiceNumber?: string;
  invoiceDate?: Date;
  dueDate?: Date;
  supplierName?: string;
  supplierAddress?: string;
  totalAmount?: number;
  taxAmount?: number;
  currency?: string;
  lineItems?: Array<{
    description: string;
    quantity?: number;
    unitPrice?: number;
    amount?: number;
  }>;
}

export interface ReceiptData {
  vendorName?: string;
  receiptNumber?: string;
  receiptDate?: Date;
  receiptAmount?: number;
  paymentMethod?: string;
  items?: Array<{
    description: string;
    amount?: number;
  }>;
}

export interface ContractData {
  contractNumber?: string;
  contractDate?: Date;
  partyNames?: string[];
  contractValue?: number;
  startDate?: Date;
  endDate?: Date;
  terms?: string[];
}

export interface OCRResult {
  text: string;
  confidence: number;
  pageCount?: number;
  processingTime: number;
}
