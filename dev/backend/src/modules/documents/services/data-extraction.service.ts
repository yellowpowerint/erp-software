import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { ExtractedDataType } from "@prisma/client";

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

@Injectable()
export class DataExtractionService {
  private readonly logger = new Logger(DataExtractionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Parse invoice data from extracted text
   */
  async parseInvoice(
    ocrJobId: string,
    documentId: string,
    extractedText: string,
  ): Promise<InvoiceData> {
    this.logger.log(`Parsing invoice data for document ${documentId}`);

    const invoiceData: InvoiceData = {};
    const lines = extractedText.split("\n").map((line) => line.trim());

    // Extract invoice number
    invoiceData.invoiceNumber = this.extractInvoiceNumber(lines);

    // Extract dates
    const dates = this.extractDates(extractedText);
    if (dates.length > 0) {
      invoiceData.invoiceDate = dates[0];
      if (dates.length > 1) {
        invoiceData.dueDate = dates[1];
      }
    }

    // Extract supplier name (usually at the top)
    invoiceData.supplierName = this.extractSupplierName(lines);

    // Extract amounts
    const amounts = this.extractAmounts(extractedText);
    if (amounts.length > 0) {
      invoiceData.totalAmount = amounts[amounts.length - 1]; // Last amount is usually total

      // Try to identify tax amount
      const taxAmount = this.extractTaxAmount(extractedText);
      if (taxAmount) {
        invoiceData.taxAmount = taxAmount;
      }
    }

    // Extract currency
    invoiceData.currency = this.extractCurrency(extractedText) || "GHS";

    // Extract line items
    invoiceData.lineItems = this.extractLineItems(lines);

    // Calculate confidence
    const confidence = this.calculateConfidence(invoiceData);

    // Store extracted data
    await this.storeExtractedData(
      ocrJobId,
      documentId,
      ExtractedDataType.INVOICE,
      invoiceData,
      confidence,
    );

    return invoiceData;
  }

  /**
   * Parse receipt data from extracted text
   */
  async parseReceipt(
    ocrJobId: string,
    documentId: string,
    extractedText: string,
  ): Promise<ReceiptData> {
    this.logger.log(`Parsing receipt data for document ${documentId}`);

    const receiptData: ReceiptData = {};
    const lines = extractedText.split("\n").map((line) => line.trim());

    // Extract vendor name (usually at the top)
    receiptData.vendorName = this.extractVendorName(lines);

    // Extract receipt number
    receiptData.receiptNumber = this.extractReceiptNumber(lines);

    // Extract date
    const dates = this.extractDates(extractedText);
    if (dates.length > 0) {
      receiptData.receiptDate = dates[0];
    }

    // Extract total amount
    const amounts = this.extractAmounts(extractedText);
    if (amounts.length > 0) {
      receiptData.receiptAmount = amounts[amounts.length - 1];
    }

    // Extract payment method
    receiptData.paymentMethod = this.extractPaymentMethod(extractedText);

    // Extract items
    receiptData.items = this.extractReceiptItems(lines);

    // Calculate confidence
    const confidence = this.calculateConfidence(receiptData);

    // Store extracted data
    await this.storeExtractedData(
      ocrJobId,
      documentId,
      ExtractedDataType.RECEIPT,
      receiptData,
      confidence,
    );

    return receiptData;
  }

  /**
   * Parse contract data from extracted text
   */
  async parseContract(
    ocrJobId: string,
    documentId: string,
    extractedText: string,
  ): Promise<ContractData> {
    this.logger.log(`Parsing contract data for document ${documentId}`);

    const contractData: ContractData = {};

    // Extract contract number
    contractData.contractNumber = this.extractContractNumber(extractedText);

    // Extract dates
    const dates = this.extractDates(extractedText);
    if (dates.length > 0) {
      contractData.contractDate = dates[0];
      if (dates.length > 1) {
        contractData.startDate = dates[1];
      }
      if (dates.length > 2) {
        contractData.endDate = dates[2];
      }
    }

    // Extract party names
    contractData.partyNames = this.extractPartyNames(extractedText);

    // Extract contract value
    const amounts = this.extractAmounts(extractedText);
    if (amounts.length > 0) {
      contractData.contractValue = Math.max(...amounts);
    }

    // Extract key terms
    contractData.terms = this.extractContractTerms(extractedText);

    // Calculate confidence
    const confidence = this.calculateConfidence(contractData);

    // Store extracted data
    await this.storeExtractedData(
      ocrJobId,
      documentId,
      ExtractedDataType.CONTRACT,
      contractData,
      confidence,
    );

    return contractData;
  }

  /**
   * Extract invoice number from text lines
   */
  private extractInvoiceNumber(lines: string[]): string | undefined {
    const patterns = [
      /invoice\s*#?\s*:?\s*([A-Z0-9\-]+)/i,
      /inv\s*#?\s*:?\s*([A-Z0-9\-]+)/i,
      /bill\s*#?\s*:?\s*([A-Z0-9\-]+)/i,
      /#\s*([A-Z0-9\-]{5,})/i,
    ];

    for (const line of lines) {
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          return match[1].trim();
        }
      }
    }

    return undefined;
  }

  /**
   * Extract dates from text
   */
  private extractDates(text: string): Date[] {
    const dates: Date[] = [];

    // Common date patterns
    const patterns = [
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/g, // DD/MM/YYYY or MM/DD/YYYY
      /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/g, // YYYY-MM-DD
      /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})/gi,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        try {
          let date: Date;

          if (
            match[0].includes("Jan") ||
            match[0].includes("Feb") ||
            match[0].includes("Mar")
          ) {
            // Month name format
            date = new Date(match[0]);
          } else if (match[1].length === 4) {
            // YYYY-MM-DD
            date = new Date(
              parseInt(match[1]),
              parseInt(match[2]) - 1,
              parseInt(match[3]),
            );
          } else {
            // DD/MM/YYYY (assuming European format for Ghana)
            const day = parseInt(match[1]);
            const month = parseInt(match[2]) - 1;
            const year = parseInt(match[3]);
            date = new Date(year < 100 ? 2000 + year : year, month, day);
          }

          if (!isNaN(date.getTime())) {
            dates.push(date);
          }
        } catch (error) {
          // Skip invalid dates
        }
      }
    }

    return dates;
  }

  /**
   * Extract amounts from text
   */
  private extractAmounts(text: string): number[] {
    const amounts: number[] = [];

    // Patterns for amounts with currency symbols
    const patterns = [
      /(?:GHS|₵|GH₵)\s*([0-9,]+\.?\d*)/gi,
      /([0-9,]+\.?\d*)\s*(?:GHS|₵|GH₵)/gi,
      /\$\s*([0-9,]+\.?\d*)/g,
      /([0-9,]+\.\d{2})/g, // Decimal amounts
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const amountStr = match[1].replace(/,/g, "");
        const amount = parseFloat(amountStr);
        if (!isNaN(amount) && amount > 0) {
          amounts.push(amount);
        }
      }
    }

    return amounts;
  }

  /**
   * Extract supplier name
   */
  private extractSupplierName(lines: string[]): string | undefined {
    // Supplier name is usually in the first few lines
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      if (
        line.length > 3 &&
        line.length < 100 &&
        !line.match(/invoice|bill|receipt/i)
      ) {
        // Skip lines with common keywords
        if (!line.match(/date|total|amount|tax|phone|email|address/i)) {
          return line;
        }
      }
    }
    return undefined;
  }

  /**
   * Extract tax amount
   */
  private extractTaxAmount(text: string): number | undefined {
    const patterns = [
      /(?:VAT|tax|GST)\s*:?\s*(?:GHS|₵)?\s*([0-9,]+\.?\d*)/gi,
      /([0-9,]+\.?\d*)\s*(?:VAT|tax|GST)/gi,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const amountStr = match[1].replace(/,/g, "");
        const amount = parseFloat(amountStr);
        if (!isNaN(amount)) {
          return amount;
        }
      }
    }

    return undefined;
  }

  /**
   * Extract currency
   */
  private extractCurrency(text: string): string | undefined {
    if (text.match(/GHS|₵|GH₵/i)) return "GHS";
    if (text.match(/\$/)) return "USD";
    if (text.match(/€/)) return "EUR";
    if (text.match(/£/)) return "GBP";
    return undefined;
  }

  /**
   * Extract line items from invoice
   */
  private extractLineItems(lines: string[]): Array<any> {
    const items: Array<any> = [];

    // Look for lines that might be items (contain description and amount)
    for (const line of lines) {
      const amounts = this.extractAmounts(line);
      if (amounts.length > 0 && line.length > 10) {
        // This line might be an item
        const description = line.replace(/[0-9,]+\.?\d*/g, "").trim();
        if (description.length > 3) {
          items.push({
            description,
            amount: amounts[amounts.length - 1],
          });
        }
      }
    }

    return items.slice(0, 20); // Limit to 20 items
  }

  /**
   * Extract vendor name from receipt
   */
  private extractVendorName(lines: string[]): string | undefined {
    return this.extractSupplierName(lines);
  }

  /**
   * Extract receipt number
   */
  private extractReceiptNumber(lines: string[]): string | undefined {
    const patterns = [
      /receipt\s*#?\s*:?\s*([A-Z0-9\-]+)/i,
      /ref\s*#?\s*:?\s*([A-Z0-9\-]+)/i,
      /transaction\s*#?\s*:?\s*([A-Z0-9\-]+)/i,
    ];

    for (const line of lines) {
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          return match[1].trim();
        }
      }
    }

    return undefined;
  }

  /**
   * Extract payment method
   */
  private extractPaymentMethod(text: string): string | undefined {
    const methods = [
      "cash",
      "card",
      "credit",
      "debit",
      "mobile money",
      "momo",
      "bank transfer",
    ];

    for (const method of methods) {
      if (text.toLowerCase().includes(method)) {
        return method.toUpperCase();
      }
    }

    return undefined;
  }

  /**
   * Extract receipt items
   */
  private extractReceiptItems(lines: string[]): Array<any> {
    return this.extractLineItems(lines);
  }

  /**
   * Extract contract number
   */
  private extractContractNumber(text: string): string | undefined {
    const patterns = [
      /contract\s*#?\s*:?\s*([A-Z0-9\-]+)/i,
      /agreement\s*#?\s*:?\s*([A-Z0-9\-]+)/i,
      /ref\s*#?\s*:?\s*([A-Z0-9\-]+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  /**
   * Extract party names from contract
   */
  private extractPartyNames(text: string): string[] {
    const parties: string[] = [];

    // Look for common patterns
    const patterns = [
      /between\s+([A-Z][A-Za-z\s&]+)\s+and\s+([A-Z][A-Za-z\s&]+)/i,
      /party\s+(?:1|one|first)\s*:?\s*([A-Z][A-Za-z\s&]+)/i,
      /party\s+(?:2|two|second)\s*:?\s*([A-Z][A-Za-z\s&]+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        for (let i = 1; i < match.length; i++) {
          if (match[i] && match[i].length > 3) {
            parties.push(match[i].trim());
          }
        }
      }
    }

    return [...new Set(parties)]; // Remove duplicates
  }

  /**
   * Extract contract terms
   */
  private extractContractTerms(text: string): string[] {
    const terms: string[] = [];

    // Look for numbered or bulleted terms
    const lines = text.split("\n");
    for (const line of lines) {
      if (line.match(/^\s*[\d\.\)]+\s+/) || line.match(/^\s*[-•]\s+/)) {
        const term = line.replace(/^\s*[\d\.\)\-•]+\s+/, "").trim();
        if (term.length > 10) {
          terms.push(term);
        }
      }
    }

    return terms.slice(0, 10); // Limit to 10 terms
  }

  /**
   * Calculate confidence score based on extracted fields
   */
  private calculateConfidence(data: any): number {
    const fields = Object.keys(data);
    const filledFields = fields.filter((key) => {
      const value = data[key];
      return value !== undefined && value !== null && value !== "";
    });

    const confidence = (filledFields.length / fields.length) * 100;
    return Math.round(confidence * 100) / 100;
  }

  /**
   * Store extracted data in database
   */
  private async storeExtractedData(
    ocrJobId: string,
    documentId: string,
    dataType: ExtractedDataType,
    data: any,
    confidence: number,
  ): Promise<void> {
    try {
      await this.prisma.extractedDocumentData.create({
        data: {
          ocrJobId,
          documentId,
          dataType,
          extractedFields: data,
          confidence,
          // Map specific fields based on type
          ...(dataType === ExtractedDataType.INVOICE && {
            invoiceNumber: data.invoiceNumber,
            invoiceDate: data.invoiceDate,
            dueDate: data.dueDate,
            supplierName: data.supplierName,
            supplierAddress: data.supplierAddress,
            totalAmount: data.totalAmount,
            taxAmount: data.taxAmount,
            currency: data.currency,
          }),
          ...(dataType === ExtractedDataType.RECEIPT && {
            vendorName: data.vendorName,
            receiptNumber: data.receiptNumber,
            receiptDate: data.receiptDate,
            receiptAmount: data.receiptAmount,
            paymentMethod: data.paymentMethod,
          }),
          ...(dataType === ExtractedDataType.CONTRACT && {
            contractNumber: data.contractNumber,
            contractDate: data.contractDate,
            partyNames: data.partyNames,
            contractValue: data.contractValue,
            startDate: data.startDate,
            endDate: data.endDate,
          }),
        },
      });

      this.logger.log(
        `Stored extracted ${dataType} data with confidence ${confidence}%`,
      );
    } catch (error) {
      this.logger.error("Failed to store extracted data", error);
      throw error;
    }
  }

  /**
   * Get extracted data for a document
   */
  async getExtractedData(documentId: string, dataType?: ExtractedDataType) {
    const where: any = { documentId };
    if (dataType) {
      where.dataType = dataType;
    }

    return this.prisma.extractedDocumentData.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        ocrJob: true,
      },
    });
  }

  /**
   * Validate and correct extracted data
   */
  async validateExtractedData(
    extractedDataId: string,
    userId: string,
    correctedFields?: any,
    notes?: string,
  ) {
    return this.prisma.extractedDocumentData.update({
      where: { id: extractedDataId },
      data: {
        isValidated: true,
        validatedById: userId,
        validatedAt: new Date(),
        correctedFields: correctedFields || undefined,
        correctionNotes: notes,
      },
    });
  }
}
