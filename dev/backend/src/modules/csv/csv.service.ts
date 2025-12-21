import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExportStatus, ImportStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { StorageProvider, StorageService } from '../documents/services/storage.service';
import * as fs from 'fs/promises';
import * as mime from 'mime-types';
import { parse as json2csv } from 'json2csv';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

type ModuleKey =
  | 'inventory'
  | 'inventory_movements'
  | 'suppliers'
  | 'employees'
  | 'warehouses'
  | 'projects'
  | 'project_tasks'
  | 'assets';

type DuplicateStrategy = 'skip' | 'update' | 'error';

interface UploadPreviewRow {
  rowNumber: number;
  data: Record<string, any>;
}

export interface UploadForValidationResult {
  module?: string;
  headers: string[];
  previewRows: UploadPreviewRow[];
  totalRows: number;
}

interface ImportColumnDef {
  key: string;
  header: string;
  required?: boolean;
  type?: 'string' | 'number' | 'int' | 'boolean' | 'date' | 'enum';
  enumValues?: string[];
}

interface ImportTemplateColumns {
  columns: ImportColumnDef[];
}

@Injectable()
export class CsvService {
  private readonly logger = new Logger(CsvService.name);
  private readonly adminRoles: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.IT_MANAGER];

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly storageService: StorageService,
  ) {}

  parseJson(value: string, fieldName: string) {
    try {
      return JSON.parse(value);
    } catch {
      throw new BadRequestException(`${fieldName} must be valid JSON`);
    }
  }

  private maxPreviewRows(): number {
    const v = this.configService.get<string>('CSV_PREVIEW_ROWS', '20');
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) {
      return 20;
    }
    return Math.min(50, Math.max(5, n));
  }

  private normalizeModule(module: string): ModuleKey {
    const m = (module || '').toLowerCase().trim();
    const allowed: ModuleKey[] = [
      'inventory',
      'inventory_movements',
      'suppliers',
      'employees',
      'warehouses',
      'projects',
      'project_tasks',
      'assets',
    ];
    if (!allowed.includes(m as ModuleKey)) {
      throw new BadRequestException(`Unsupported module: ${module}`);
    }
    return m as ModuleKey;
  }

  private getDefaultTemplateForModule(module: ModuleKey): ImportTemplateColumns {
    if (module === 'inventory') {
      return {
        columns: [
          { key: 'itemCode', header: 'itemCode', required: true, type: 'string' },
          { key: 'name', header: 'name', required: true, type: 'string' },
          { key: 'description', header: 'description', required: false, type: 'string' },
          {
            key: 'category',
            header: 'category',
            required: true,
            type: 'enum',
            enumValues: [
              'CONSUMABLES',
              'EQUIPMENT',
              'SPARE_PARTS',
              'TOOLS',
              'FUEL',
              'CHEMICALS',
              'SAFETY_GEAR',
              'OFFICE_SUPPLIES',
              'OTHER',
            ],
          },
          {
            key: 'unit',
            header: 'unit',
            required: true,
            type: 'enum',
            enumValues: ['PIECES', 'KILOGRAMS', 'LITERS', 'METERS', 'BOXES', 'PALLETS', 'TONS', 'GALLONS', 'UNITS'],
          },
          { key: 'unitPrice', header: 'unitPrice', required: false, type: 'number' },
          { key: 'reorderLevel', header: 'reorderLevel', required: false, type: 'int' },
          { key: 'maxStockLevel', header: 'maxStockLevel', required: false, type: 'int' },
          { key: 'warehouseId', header: 'warehouseId', required: false, type: 'string' },
          { key: 'warehouseCode', header: 'warehouseCode', required: false, type: 'string' },
          { key: 'barcode', header: 'barcode', required: false, type: 'string' },
          { key: 'supplier', header: 'supplier', required: false, type: 'string' },
          { key: 'notes', header: 'notes', required: false, type: 'string' },
          { key: 'initialQuantity', header: 'initialQuantity', required: false, type: 'int' },
        ],
      };
    }

    if (module === 'inventory_movements') {
      return {
        columns: [
          { key: 'itemCode', header: 'itemCode', required: true, type: 'string' },
          { key: 'warehouseId', header: 'warehouseId', required: false, type: 'string' },
          { key: 'warehouseCode', header: 'warehouseCode', required: false, type: 'string' },
          {
            key: 'movementType',
            header: 'movementType',
            required: true,
            type: 'enum',
            enumValues: ['STOCK_IN', 'STOCK_OUT', 'RETURN', 'DAMAGED', 'EXPIRED', 'ADJUSTMENT'],
          },
          { key: 'quantity', header: 'quantity', required: true, type: 'int' },
          { key: 'unitPrice', header: 'unitPrice', required: false, type: 'number' },
          { key: 'reference', header: 'reference', required: false, type: 'string' },
          { key: 'notes', header: 'notes', required: false, type: 'string' },
        ],
      };
    }

    if (module === 'warehouses') {
      return {
        columns: [
          { key: 'code', header: 'code', required: true, type: 'string' },
          { key: 'name', header: 'name', required: true, type: 'string' },
          { key: 'location', header: 'location', required: true, type: 'string' },
          { key: 'description', header: 'description', required: false, type: 'string' },
          { key: 'isActive', header: 'isActive', required: false, type: 'boolean' },
        ],
      };
    }

    if (module === 'suppliers') {
      return {
        columns: [
          { key: 'name', header: 'name', required: true, type: 'string' },
          { key: 'contactPerson', header: 'contactPerson', required: false, type: 'string' },
          { key: 'email', header: 'email', required: false, type: 'string' },
          { key: 'phone', header: 'phone', required: false, type: 'string' },
          { key: 'address', header: 'address', required: false, type: 'string' },
          { key: 'city', header: 'city', required: false, type: 'string' },
          { key: 'country', header: 'country', required: false, type: 'string' },
          { key: 'taxId', header: 'taxId', required: false, type: 'string' },
          { key: 'bankAccount', header: 'bankAccount', required: false, type: 'string' },
          { key: 'paymentTerms', header: 'paymentTerms', required: false, type: 'string' },
          { key: 'category', header: 'category', required: false, type: 'string' },
          { key: 'rating', header: 'rating', required: false, type: 'int' },
          { key: 'isActive', header: 'isActive', required: false, type: 'boolean' },
          { key: 'notes', header: 'notes', required: false, type: 'string' },
        ],
      };
    }

    if (module === 'employees') {
      return {
        columns: [
          { key: 'employeeId', header: 'employeeId', required: false, type: 'string' },
          { key: 'firstName', header: 'firstName', required: true, type: 'string' },
          { key: 'lastName', header: 'lastName', required: true, type: 'string' },
          { key: 'email', header: 'email', required: true, type: 'string' },
          { key: 'phone', header: 'phone', required: false, type: 'string' },
          { key: 'dateOfBirth', header: 'dateOfBirth', required: false, type: 'date' },
          { key: 'gender', header: 'gender', required: false, type: 'string' },
          { key: 'address', header: 'address', required: false, type: 'string' },
          { key: 'city', header: 'city', required: false, type: 'string' },
          { key: 'country', header: 'country', required: false, type: 'string' },
          { key: 'department', header: 'department', required: true, type: 'string' },
          { key: 'position', header: 'position', required: true, type: 'string' },
          { key: 'employmentType', header: 'employmentType', required: false, type: 'string' },
          { key: 'status', header: 'status', required: false, type: 'string' },
          { key: 'hireDate', header: 'hireDate', required: true, type: 'date' },
          { key: 'terminationDate', header: 'terminationDate', required: false, type: 'date' },
          { key: 'salary', header: 'salary', required: false, type: 'number' },
          { key: 'supervisorId', header: 'supervisorId', required: false, type: 'string' },
          { key: 'emergencyContact', header: 'emergencyContact', required: false, type: 'string' },
          { key: 'emergencyPhone', header: 'emergencyPhone', required: false, type: 'string' },
          { key: 'notes', header: 'notes', required: false, type: 'string' },
        ],
      };
    }

    if (module === 'projects') {
      return {
        columns: [
          { key: 'projectCode', header: 'projectCode', required: true, type: 'string' },
          { key: 'name', header: 'name', required: true, type: 'string' },
          { key: 'description', header: 'description', required: false, type: 'string' },
          { key: 'status', header: 'status', required: false, type: 'string' },
          { key: 'priority', header: 'priority', required: false, type: 'string' },
          { key: 'location', header: 'location', required: false, type: 'string' },
          { key: 'startDate', header: 'startDate', required: true, type: 'date' },
          { key: 'endDate', header: 'endDate', required: false, type: 'date' },
          { key: 'estimatedBudget', header: 'estimatedBudget', required: false, type: 'number' },
          { key: 'progress', header: 'progress', required: false, type: 'int' },
          { key: 'managerId', header: 'managerId', required: false, type: 'string' },
          { key: 'notes', header: 'notes', required: false, type: 'string' },
        ],
      };
    }

    if (module === 'project_tasks') {
      return {
        columns: [
          { key: 'title', header: 'title', required: true, type: 'string' },
          { key: 'description', header: 'description', required: false, type: 'string' },
          { key: 'status', header: 'status', required: false, type: 'string' },
          { key: 'assignedTo', header: 'assignedTo', required: false, type: 'string' },
          { key: 'dueDate', header: 'dueDate', required: false, type: 'date' },
          { key: 'order', header: 'order', required: false, type: 'int' },
        ],
      };
    }

    return {
      columns: [
        { key: 'assetCode', header: 'assetCode', required: true, type: 'string' },
        { key: 'name', header: 'name', required: true, type: 'string' },
        { key: 'description', header: 'description', required: false, type: 'string' },
        { key: 'category', header: 'category', required: true, type: 'string' },
        { key: 'manufacturer', header: 'manufacturer', required: false, type: 'string' },
        { key: 'model', header: 'model', required: false, type: 'string' },
        { key: 'serialNumber', header: 'serialNumber', required: false, type: 'string' },
        { key: 'purchaseDate', header: 'purchaseDate', required: true, type: 'date' },
        { key: 'purchasePrice', header: 'purchasePrice', required: true, type: 'number' },
        { key: 'currentValue', header: 'currentValue', required: false, type: 'number' },
        { key: 'depreciationRate', header: 'depreciationRate', required: false, type: 'number' },
        { key: 'location', header: 'location', required: false, type: 'string' },
        { key: 'status', header: 'status', required: false, type: 'string' },
        { key: 'condition', header: 'condition', required: false, type: 'string' },
        { key: 'assignedTo', header: 'assignedTo', required: false, type: 'string' },
        { key: 'notes', header: 'notes', required: false, type: 'string' },
        { key: 'warrantyExpiry', header: 'warrantyExpiry', required: false, type: 'date' },
        { key: 'lastMaintenanceAt', header: 'lastMaintenanceAt', required: false, type: 'date' },
        { key: 'nextMaintenanceAt', header: 'nextMaintenanceAt', required: false, type: 'date' },
      ],
    };
  }

  private async parseCsvFromBuffer(buffer: Buffer): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
    const rows: Record<string, string>[] = [];

    return new Promise((resolve, reject) => {
      let headers: string[] = [];

      Readable.from([buffer])
        .pipe(
          csvParser({
            mapHeaders: ({ header }) => String(header ?? '').trim(),
            mapValues: ({ value }) => (typeof value === 'string' ? value.trim() : value),
            strict: false,
          }),
        )
        .on('headers', (h: string[]) => {
          headers = (h || []).map((x) => String(x || '').trim());
        })
        .on('data', (row: Record<string, any>) => {
          const record: Record<string, string> = {};
          for (const [k, v] of Object.entries(row || {})) {
            record[String(k)] = v == null ? '' : String(v);
          }
          rows.push(record);
        })
        .on('error', reject)
        .on('end', () => {
          resolve({ headers, rows });
        });
    });
  }

  async uploadForValidation(file: Express.Multer.File, module?: string): Promise<{ success: true; data: UploadForValidationResult }> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Empty file');
    }

    const mimeType = file.mimetype || (mime.lookup(file.originalname) as string) || 'text/csv';
    const parsed = await this.parseCsvFromBuffer(file.buffer);

    const previewRows: UploadPreviewRow[] = parsed.rows.slice(0, this.maxPreviewRows()).map((r, i) => ({
      rowNumber: i + 1,
      data: r,
    }));

    return {
      success: true,
      data: {
        module,
        headers: parsed.headers,
        previewRows,
        totalRows: parsed.rows.length,
      },
    };
  }

  private toBool(v: any): boolean {
    const s = String(v ?? '').trim().toLowerCase();
    if (['true', '1', 'yes', 'y'].includes(s)) return true;
    if (['false', '0', 'no', 'n', ''].includes(s)) return false;
    throw new BadRequestException(`Invalid boolean: ${v}`);
  }

  private toNumber(v: any): number {
    if (v === '' || v == null) {
      throw new BadRequestException('Missing number');
    }
    const n = Number(String(v).trim());
    if (!Number.isFinite(n)) {
      throw new BadRequestException(`Invalid number: ${v}`);
    }
    return n;
  }

  private toInt(v: any): number {
    const n = this.toNumber(v);
    if (!Number.isInteger(n)) {
      throw new BadRequestException(`Invalid integer: ${v}`);
    }
    return n;
  }

  private toDate(v: any): Date {
    const s = String(v ?? '').trim();
    if (!s) {
      throw new BadRequestException('Missing date');
    }
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) {
      throw new BadRequestException(`Invalid date: ${v}`);
    }
    return d;
  }

  private coerceValue(raw: any, def: ImportColumnDef): any {
    const v = raw == null ? '' : String(raw).trim();

    if (!def.type || def.type === 'string') {
      return v === '' ? null : v;
    }

    if (def.type === 'number') {
      return v === '' ? null : this.toNumber(v);
    }

    if (def.type === 'int') {
      return v === '' ? null : this.toInt(v);
    }

    if (def.type === 'boolean') {
      return v === '' ? null : this.toBool(v);
    }

    if (def.type === 'date') {
      return v === '' ? null : this.toDate(v);
    }

    if (def.type === 'enum') {
      if (v === '') {
        return null;
      }
      if (!def.enumValues?.includes(v)) {
        throw new BadRequestException(`Invalid enum for ${def.key}: ${v}`);
      }
      return v;
    }

    return v === '' ? null : v;
  }

  private buildDefaultMappings(headers: string[], template: ImportTemplateColumns) {
    const lowerHeaders = headers.map((h) => h.toLowerCase());

    return template.columns.map((c) => {
      const idx = lowerHeaders.indexOf(c.header.toLowerCase());
      return {
        key: c.key,
        header: c.header,
        sourceColumn: idx >= 0 ? headers[idx] : null,
        required: !!c.required,
        type: c.type,
        enumValues: c.enumValues,
      };
    });
  }

  async createImportJob(
    module: string,
    file: Express.Multer.File,
    userId: string,
    mappings?: any,
    context?: any,
  ) {
    const mod = this.normalizeModule(module);

    if (!file?.buffer?.length) {
      throw new BadRequestException('Empty file');
    }

    const mimeType = file.mimetype || (mime.lookup(file.originalname) as string) || 'text/csv';
    const upload = await this.storageService.uploadBuffer(file.buffer, file.originalname, mimeType, 'csv');

    const parsed = await this.parseCsvFromBuffer(file.buffer);

    const template = this.getDefaultTemplateForModule(mod);
    const defaultMappings = this.buildDefaultMappings(parsed.headers, template);

    const usedMappings = mappings ?? defaultMappings;

    // Basic structural validation upfront
    const missingRequired = defaultMappings
      .filter((m) => m.required)
      .filter((m) => {
        const mapped = (usedMappings || []).find((x: any) => x.key === m.key);
        return !mapped || !mapped.sourceColumn;
      })
      .map((m) => m.key);

    if (missingRequired.length > 0) {
      throw new BadRequestException(`Missing required mappings: ${missingRequired.join(', ')}`);
    }

    if (mod === 'inventory') {
      const hasWarehouseId = (usedMappings || []).some((m: any) => m?.key === 'warehouseId' && m?.sourceColumn);
      const hasWarehouseCode = (usedMappings || []).some((m: any) => m?.key === 'warehouseCode' && m?.sourceColumn);
      const hasWarehouseIdCtx = !!(context?.warehouseId && String(context.warehouseId).trim());
      const hasWarehouseCodeCtx = !!(context?.warehouseCode && String(context.warehouseCode).trim());

      if (!hasWarehouseId && !hasWarehouseCode && !hasWarehouseIdCtx && !hasWarehouseCodeCtx) {
        throw new BadRequestException('Missing required mappings: warehouseId or warehouseCode');
      }
    }

    if (mod === 'project_tasks') {
      const projectId = context?.projectId ? String(context.projectId).trim() : '';
      if (!projectId) {
        throw new BadRequestException('Missing required context: projectId');
      }
    }

    const job = await (this.prisma as any).importJob.create({
      data: {
        module: mod,
        fileName: upload.key,
        fileUrl: upload.url,
        storageProvider: upload.provider,
        originalName: file.originalname,
        totalRows: parsed.rows.length,
        mappings: usedMappings,
        context: context ?? undefined,
        status: ImportStatus.PENDING,
        createdById: userId,
      },
    });

    return job;
  }

  async getImportJob(jobId: string, userId: string) {
    const job = await (this.prisma as any).importJob.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException('Import job not found');
    }

    if (job.createdById !== userId) {
      // Allow admins to view
      const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      if (!user || !this.adminRoles.includes(user.role)) {
        throw new NotFoundException('Import job not found');
      }
    }

    return job;
  }

  async getImportJobErrors(jobId: string, userId: string) {
    const job = await this.getImportJob(jobId, userId);
    return job.errors || [];
  }

  async cancelImportJob(jobId: string, userId: string) {
    const job = await this.getImportJob(jobId, userId);
    if (job.status === ImportStatus.COMPLETED || job.status === ImportStatus.FAILED) {
      return job;
    }

    return (this.prisma as any).importJob.update({
      where: { id: job.id },
      data: { status: ImportStatus.CANCELLED, completedAt: new Date() },
    });
  }

  async listImportHistory(userId: string) {
    return (this.prisma as any).importJob.findMany({
      where: { createdById: userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async listExportHistory(userId: string) {
    return (this.prisma as any).exportJob.findMany({
      where: { createdById: userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async claimNextImportJob(): Promise<{ id: string } | null> {
    const candidates = await (this.prisma as any).importJob.findMany({
      where: { status: ImportStatus.PENDING },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });

    for (const c of candidates) {
      const updated = await (this.prisma as any).importJob.updateMany({
        where: { id: c.id, status: ImportStatus.PENDING },
        data: { status: ImportStatus.PROCESSING, startedAt: new Date() },
      });

      if (updated?.count === 1) {
        return { id: c.id };
      }
    }

    return null;
  }

  async recoverStuckImportJobs(minutes: number) {
    const threshold = new Date(Date.now() - Math.max(5, minutes) * 60_000);
    const result = await (this.prisma as any).importJob.updateMany({
      where: { status: ImportStatus.PROCESSING, startedAt: { lt: threshold } },
      data: { status: ImportStatus.PENDING, startedAt: null },
    });

    if (result?.count > 0) {
      this.logger.warn(`Recovered ${result.count} stuck import jobs`);
    }
  }

  private async readImportFile(job: any): Promise<{ buffer: Buffer; localPath?: string }> {
    if (job.storageProvider === StorageProvider.LOCAL) {
      const local = this.storageService.getLocalFilePath(job.fileName);
      const b = await fs.readFile(local);
      return { buffer: b, localPath: local };
    }

    // S3: download to temp via getLocalPath using the URL
    const localPath = await this.storageService.getLocalPath(job.fileUrl);
    if (!localPath) {
      throw new BadRequestException('Unable to resolve job file');
    }
    const b = await fs.readFile(localPath);
    return { buffer: b, localPath };
  }

  async processImportJob(jobId: string) {
    const job = await (this.prisma as any).importJob.findUnique({ where: { id: jobId } });
    if (!job) {
      return;
    }

    if (job.status !== ImportStatus.PROCESSING) {
      return;
    }

    if (job.status === ImportStatus.CANCELLED) {
      return;
    }

    const { buffer, localPath } = await this.readImportFile(job);

    try {
      const parsed = await this.parseCsvFromBuffer(buffer);
      const template = this.getDefaultTemplateForModule(this.normalizeModule(job.module));

      const mappings = Array.isArray(job.mappings) ? job.mappings : [];
      const errors: any[] = [];

      let processed = 0;
      let success = 0;

      for (let i = 0; i < parsed.rows.length; i++) {
        const row = parsed.rows[i];

        if ((await (this.prisma as any).importJob.findUnique({ where: { id: job.id }, select: { status: true } }))?.status === ImportStatus.CANCELLED) {
          await (this.prisma as any).importJob.update({
            where: { id: job.id },
            data: { completedAt: new Date() },
          });
          return;
        }

        const output: Record<string, any> = {};

        try {
          for (const c of template.columns) {
            const m = mappings.find((x: any) => x.key === c.key);
            const src = m?.sourceColumn;
            const raw = src ? row[src] : '';
            if (c.required && (raw == null || String(raw).trim() === '')) {
              throw new BadRequestException(`Missing required field: ${c.key}`);
            }
            output[c.key] = raw == null || String(raw).trim() === '' ? null : this.coerceValue(raw, c);
          }

          await this.applyImportRow(job, output);
          success++;
        } catch (e: any) {
          errors.push({
            rowNumber: i + 1,
            message: e?.message || 'Row import failed',
          });
        }

        processed++;

        if (processed % 50 === 0) {
          await (this.prisma as any).importJob.update({
            where: { id: job.id },
            data: {
              processedRows: processed,
              successRows: success,
              errorRows: errors.length,
            },
          });
        }
      }

      await (this.prisma as any).importJob.update({
        where: { id: job.id },
        data: {
          processedRows: processed,
          successRows: success,
          errorRows: errors.length,
          errors,
          status: errors.length > 0 ? ImportStatus.FAILED : ImportStatus.COMPLETED,
          completedAt: new Date(),
        },
      });
    } catch (error: any) {
      await (this.prisma as any).importJob.update({
        where: { id: job.id },
        data: {
          status: ImportStatus.FAILED,
          errors: [{ rowNumber: 0, message: error?.message || 'Import failed' }],
          completedAt: new Date(),
        },
      });
    } finally {
      if (localPath) {
        await this.storageService.cleanupTempFile(localPath);
      }
    }
  }

  private async applyImportRow(job: any, data: Record<string, any>) {
    const module = this.normalizeModule(job.module);

    const duplicateStrategy = String(job?.context?.duplicateStrategy || 'error') as DuplicateStrategy;

    if (module === 'inventory') {
      const itemCode = String(data.itemCode || '').trim();
      if (!itemCode) {
        throw new BadRequestException('Missing required field: itemCode');
      }

      const warehouseIdFromRow = data.warehouseId ? String(data.warehouseId).trim() : '';
      const warehouseCodeFromRow = data.warehouseCode ? String(data.warehouseCode).trim() : '';
      const warehouseIdFromContext = job?.context?.warehouseId ? String(job.context.warehouseId).trim() : '';
      const warehouseCodeFromContext = job?.context?.warehouseCode ? String(job.context.warehouseCode).trim() : '';
      const warehouse = warehouseIdFromRow
        ? await this.prisma.warehouse.findUnique({ where: { id: warehouseIdFromRow } })
        : warehouseCodeFromRow
          ? await this.prisma.warehouse.findUnique({ where: { code: warehouseCodeFromRow } })
          : warehouseIdFromContext
            ? await this.prisma.warehouse.findUnique({ where: { id: warehouseIdFromContext } })
            : warehouseCodeFromContext
              ? await this.prisma.warehouse.findUnique({ where: { code: warehouseCodeFromContext } })
          : null;

      if (!warehouse) {
        throw new BadRequestException('Missing required field: warehouseId/warehouseCode');
      }

      const existing = await this.prisma.stockItem.findUnique({ where: { itemCode } });
      const initialQuantity = data.initialQuantity == null ? null : Number(data.initialQuantity);
      const initialQtyInt = initialQuantity == null ? null : Math.max(0, Math.trunc(initialQuantity));

      if (existing) {
        if (duplicateStrategy === 'skip') {
          return { skipped: true };
        }
        if (duplicateStrategy === 'error') {
          throw new BadRequestException(`Duplicate itemCode: ${itemCode}`);
        }

        const updated = await this.prisma.stockItem.update({
          where: { id: existing.id },
          data: {
            name: data.name,
            description: data.description ?? undefined,
            category: data.category as any,
            unit: data.unit as any,
            unitPrice: data.unitPrice ?? undefined,
            reorderLevel: data.reorderLevel ?? 0,
            maxStockLevel: data.maxStockLevel ?? undefined,
            warehouseId: warehouse.id,
            barcode: data.barcode ?? undefined,
            supplier: data.supplier ?? undefined,
            notes: data.notes ?? undefined,
          },
        });

        if (initialQtyInt != null) {
          const previousQty = existing.currentQuantity;
          const newQty = initialQtyInt;
          const unitPrice = data.unitPrice ?? existing.unitPrice ?? undefined;

          await this.prisma.$transaction([
            this.prisma.stockMovement.create({
              data: {
                itemId: existing.id,
                warehouseId: warehouse.id,
                movementType: 'ADJUSTMENT' as any,
                quantity: newQty,
                previousQty,
                newQty,
                unitPrice,
                totalValue: (unitPrice || 0) * newQty,
                reference: 'CSV_IMPORT_UPDATE',
                notes: data.notes ?? undefined,
                performedById: job.createdById,
              },
            }),
            this.prisma.stockItem.update({
              where: { id: existing.id },
              data: { currentQuantity: newQty },
            }),
          ]);
        }

        return updated;
      }

      const created = await this.prisma.stockItem.create({
        data: {
          itemCode,
          name: data.name,
          description: data.description ?? undefined,
          category: data.category as any,
          unit: data.unit as any,
          unitPrice: data.unitPrice ?? undefined,
          reorderLevel: data.reorderLevel ?? 0,
          maxStockLevel: data.maxStockLevel ?? undefined,
          warehouseId: warehouse.id,
          barcode: data.barcode ?? undefined,
          supplier: data.supplier ?? undefined,
          notes: data.notes ?? undefined,
          currentQuantity: initialQtyInt ?? 0,
        },
      });

      if (initialQtyInt != null && initialQtyInt > 0) {
        const unitPrice = data.unitPrice ?? 0;
        await this.prisma.stockMovement.create({
          data: {
            itemId: created.id,
            warehouseId: warehouse.id,
            movementType: 'STOCK_IN' as any,
            quantity: initialQtyInt,
            previousQty: 0,
            newQty: initialQtyInt,
            unitPrice,
            totalValue: unitPrice * initialQtyInt,
            reference: 'CSV_IMPORT',
            notes: data.notes ?? undefined,
            performedById: job.createdById,
          },
        });
      }

      return created;
    }

    if (module === 'inventory_movements') {
      const itemCode = String(data.itemCode || '').trim();
      if (!itemCode) {
        throw new BadRequestException('Missing required field: itemCode');
      }

      const item = await this.prisma.stockItem.findUnique({ where: { itemCode } });
      if (!item) {
        throw new BadRequestException(`Unknown itemCode: ${itemCode}`);
      }

      const warehouseIdFromRow = data.warehouseId ? String(data.warehouseId).trim() : '';
      const warehouseCodeFromRow = data.warehouseCode ? String(data.warehouseCode).trim() : '';
      const warehouse = warehouseIdFromRow
        ? await this.prisma.warehouse.findUnique({ where: { id: warehouseIdFromRow } })
        : warehouseCodeFromRow
          ? await this.prisma.warehouse.findUnique({ where: { code: warehouseCodeFromRow } })
          : await this.prisma.warehouse.findUnique({ where: { id: item.warehouseId } });

      if (!warehouse) {
        throw new BadRequestException('Missing required field: warehouseId/warehouseCode');
      }

      const movementType = String(data.movementType || '').trim();
      const qty = Math.max(0, Math.trunc(Number(data.quantity)));
      const previousQty = item.currentQuantity;
      let newQty = previousQty;

      switch (movementType) {
        case 'STOCK_IN':
        case 'RETURN':
          newQty = previousQty + qty;
          break;
        case 'STOCK_OUT':
        case 'DAMAGED':
        case 'EXPIRED':
          if (previousQty < qty) {
            throw new BadRequestException('Insufficient stock');
          }
          newQty = previousQty - qty;
          break;
        case 'ADJUSTMENT':
          newQty = qty;
          break;
        default:
          throw new BadRequestException(`Invalid movementType: ${movementType}`);
      }

      const unitPrice = data.unitPrice ?? item.unitPrice ?? undefined;
      const totalValue = (unitPrice || 0) * qty;

      const [movement] = await this.prisma.$transaction([
        this.prisma.stockMovement.create({
          data: {
            itemId: item.id,
            warehouseId: warehouse.id,
            movementType: movementType as any,
            quantity: qty,
            previousQty,
            newQty,
            unitPrice,
            totalValue,
            reference: data.reference ?? undefined,
            notes: data.notes ?? undefined,
            performedById: job.createdById,
          },
        }),
        this.prisma.stockItem.update({ where: { id: item.id }, data: { currentQuantity: newQty } }),
      ]);

      return movement;
    }

    if (module === 'warehouses') {
      return this.prisma.warehouse.create({
        data: {
          code: data.code,
          name: data.name,
          location: data.location,
          description: data.description ?? undefined,
          isActive: data.isActive ?? true,
        },
      });
    }

    if (module === 'suppliers') {
      const email = data.email ? String(data.email).trim() : '';
      const existing = email ? await this.prisma.supplier.findFirst({ where: { email } }) : null;

      if (existing) {
        if (duplicateStrategy === 'skip') {
          return { skipped: true };
        }
        if (duplicateStrategy === 'error') {
          throw new BadRequestException(`Duplicate supplier email: ${email}`);
        }

        return this.prisma.supplier.update({
          where: { id: existing.id },
          data: {
            name: data.name ?? undefined,
            contactPerson: data.contactPerson ?? undefined,
            phone: data.phone ?? undefined,
            address: data.address ?? undefined,
            city: data.city ?? undefined,
            country: data.country ?? undefined,
            taxId: data.taxId ?? undefined,
            bankAccount: data.bankAccount ?? undefined,
            paymentTerms: data.paymentTerms ?? undefined,
            category: data.category ?? undefined,
            rating: data.rating ?? undefined,
            isActive: data.isActive ?? undefined,
            notes: data.notes ?? undefined,
          },
        });
      }

      const supplierCount = await this.prisma.supplier.count();
      const supplierCode = `SUP-${Date.now()}-${supplierCount + 1}`;
      return this.prisma.supplier.create({
        data: {
          supplierCode,
          name: data.name,
          contactPerson: data.contactPerson ?? undefined,
          email: data.email ?? undefined,
          phone: data.phone ?? undefined,
          address: data.address ?? undefined,
          city: data.city ?? undefined,
          country: data.country ?? 'Ghana',
          taxId: data.taxId ?? undefined,
          bankAccount: data.bankAccount ?? undefined,
          paymentTerms: data.paymentTerms ?? undefined,
          category: data.category ?? undefined,
          rating: data.rating ?? undefined,
          isActive: data.isActive ?? true,
          notes: data.notes ?? undefined,
        },
      });
    }

    if (module === 'employees') {
      const employeeId = data.employeeId ? String(data.employeeId).trim() : '';
      const generatedEmployeeId = employeeId || `EMP-${Date.now()}-${(await this.prisma.employee.count()) + 1}`;

      const existing = await this.prisma.employee.findUnique({ where: { employeeId: generatedEmployeeId } });
      if (existing) {
        if (duplicateStrategy === 'skip') {
          return { skipped: true };
        }
        if (duplicateStrategy === 'error') {
          throw new BadRequestException(`Duplicate employeeId: ${generatedEmployeeId}`);
        }
        return this.prisma.employee.update({
          where: { id: existing.id },
          data: {
            firstName: data.firstName ?? undefined,
            lastName: data.lastName ?? undefined,
            email: data.email ?? undefined,
            phone: data.phone ?? undefined,
            dateOfBirth: data.dateOfBirth ?? undefined,
            gender: data.gender ?? undefined,
            address: data.address ?? undefined,
            city: data.city ?? undefined,
            country: data.country ?? undefined,
            department: data.department ?? undefined,
            position: data.position ?? undefined,
            employmentType: data.employmentType ?? undefined,
            status: data.status ?? undefined,
            hireDate: data.hireDate ?? undefined,
            terminationDate: data.terminationDate ?? undefined,
            salary: data.salary ?? undefined,
            supervisorId: data.supervisorId ?? undefined,
            emergencyContact: data.emergencyContact ?? undefined,
            emergencyPhone: data.emergencyPhone ?? undefined,
            notes: data.notes ?? undefined,
          } as any,
        });
      }

      return this.prisma.employee.create({
        data: {
          employeeId: generatedEmployeeId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone ?? undefined,
          dateOfBirth: data.dateOfBirth ?? undefined,
          gender: data.gender ?? undefined,
          address: data.address ?? undefined,
          city: data.city ?? undefined,
          country: data.country ?? 'Ghana',
          department: data.department,
          position: data.position,
          employmentType: data.employmentType ?? undefined,
          status: data.status ?? undefined,
          hireDate: data.hireDate,
          terminationDate: data.terminationDate ?? undefined,
          salary: data.salary ?? undefined,
          supervisorId: data.supervisorId ?? undefined,
          emergencyContact: data.emergencyContact ?? undefined,
          emergencyPhone: data.emergencyPhone ?? undefined,
          documents: [],
          notes: data.notes ?? undefined,
        } as any,
      });
    }

    if (module === 'projects') {
      const projectCode = String(data.projectCode || '').trim();
      if (!projectCode) {
        throw new BadRequestException('Missing required field: projectCode');
      }

      const existing = await this.prisma.project.findUnique({ where: { projectCode } });
      if (existing) {
        if (duplicateStrategy === 'skip') {
          return { skipped: true };
        }
        if (duplicateStrategy === 'error') {
          throw new BadRequestException(`Duplicate projectCode: ${projectCode}`);
        }
        return this.prisma.project.update({
          where: { id: existing.id },
          data: {
            name: data.name ?? undefined,
            description: data.description ?? undefined,
            status: data.status ?? undefined,
            priority: data.priority ?? undefined,
            location: data.location ?? undefined,
            startDate: data.startDate ?? undefined,
            endDate: data.endDate ?? undefined,
            estimatedBudget: data.estimatedBudget ?? undefined,
            progress: data.progress ?? undefined,
            managerId: data.managerId ?? undefined,
            notes: data.notes ?? undefined,
          } as any,
        });
      }

      return this.prisma.project.create({
        data: {
          projectCode: data.projectCode,
          name: data.name,
          description: data.description ?? undefined,
          status: data.status ?? undefined,
          priority: data.priority ?? undefined,
          location: data.location ?? undefined,
          startDate: data.startDate,
          endDate: data.endDate ?? undefined,
          estimatedBudget: data.estimatedBudget ?? undefined,
          progress: data.progress ?? undefined,
          managerId: data.managerId ?? undefined,
          notes: data.notes ?? undefined,
        } as any,
      });
    }

    if (module === 'project_tasks') {
      const projectId = String(job?.context?.projectId || '').trim();
      if (!projectId) {
        throw new BadRequestException('Missing required context: projectId');
      }

      const project = await this.prisma.project.findUnique({ where: { id: projectId }, select: { id: true } });
      if (!project) {
        throw new BadRequestException('Invalid projectId');
      }

      return this.prisma.task.create({
        data: {
          projectId,
          title: data.title,
          description: data.description ?? undefined,
          status: (data.status as any) ?? 'PENDING',
          assignedTo: data.assignedTo ?? undefined,
          dueDate: data.dueDate ?? undefined,
          order: data.order ?? 0,
        } as any,
      });
    }

    const assetCode = String(data.assetCode || '').trim();
    if (!assetCode) {
      throw new BadRequestException('Missing required field: assetCode');
    }

    const existing = await this.prisma.asset.findUnique({ where: { assetCode } });
    if (existing) {
      if (duplicateStrategy === 'skip') {
        return { skipped: true };
      }
      if (duplicateStrategy === 'error') {
        throw new BadRequestException(`Duplicate assetCode: ${assetCode}`);
      }
      return this.prisma.asset.update({
        where: { id: existing.id },
        data: {
          name: data.name ?? undefined,
          description: data.description ?? undefined,
          category: data.category ?? undefined,
          manufacturer: data.manufacturer ?? undefined,
          model: data.model ?? undefined,
          serialNumber: data.serialNumber ?? undefined,
          purchaseDate: data.purchaseDate ?? undefined,
          purchasePrice: data.purchasePrice ?? undefined,
          currentValue: data.currentValue ?? undefined,
          depreciationRate: data.depreciationRate ?? undefined,
          location: data.location ?? undefined,
          status: data.status ?? undefined,
          condition: data.condition ?? undefined,
          assignedTo: data.assignedTo ?? undefined,
          notes: data.notes ?? undefined,
          warrantyExpiry: data.warrantyExpiry ?? undefined,
          lastMaintenanceAt: data.lastMaintenanceAt ?? undefined,
          nextMaintenanceAt: data.nextMaintenanceAt ?? undefined,
        } as any,
      });
    }

    return this.prisma.asset.create({
      data: {
        assetCode: data.assetCode,
        name: data.name,
        description: data.description ?? undefined,
        category: data.category,
        manufacturer: data.manufacturer ?? undefined,
        model: data.model ?? undefined,
        serialNumber: data.serialNumber ?? undefined,
        purchaseDate: data.purchaseDate,
        purchasePrice: data.purchasePrice,
        currentValue: data.currentValue ?? undefined,
        depreciationRate: data.depreciationRate ?? undefined,
        location: data.location ?? undefined,
        status: data.status ?? undefined,
        condition: data.condition ?? undefined,
        assignedTo: data.assignedTo ?? undefined,
        notes: data.notes ?? undefined,
        warrantyExpiry: data.warrantyExpiry ?? undefined,
        lastMaintenanceAt: data.lastMaintenanceAt ?? undefined,
        nextMaintenanceAt: data.nextMaintenanceAt ?? undefined,
      } as any,
    });
  }

  async createExportJob(module: string, filters: any, columns: string[], userId: string, fileName?: string, context?: any) {
    const mod = this.normalizeModule(module);
    if (!Array.isArray(columns) || columns.length === 0) {
      throw new BadRequestException('columns is required');
    }

    const safeFileName = (fileName || `${mod}-export-${Date.now()}.csv`).replace(/[^a-zA-Z0-9._-]/g, '_');

    const job = await (this.prisma as any).exportJob.create({
      data: {
        module: mod,
        fileName: safeFileName,
        filters: filters || {},
        columns,
        context: context ?? undefined,
        totalRows: 0,
        status: ExportStatus.PENDING,
        createdById: userId,
        storageProvider: StorageProvider.LOCAL,
      },
    });

    return job;
  }

  async getExportJob(jobId: string, userId: string) {
    const job = await (this.prisma as any).exportJob.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException('Export job not found');
    }

    if (job.createdById !== userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      if (!user || !this.adminRoles.includes(user.role)) {
        throw new NotFoundException('Export job not found');
      }
    }

    return job;
  }

  async getExportDownloadUrl(jobId: string, userId: string) {
    const job = await this.getExportJob(jobId, userId);
    if (job.status !== ExportStatus.COMPLETED || !job.fileUrl) {
      throw new BadRequestException('Export is not ready');
    }

    const provider = (job.storageProvider || StorageProvider.LOCAL) as StorageProvider;
    const key = provider === StorageProvider.S3 ? job.fileName : job.fileName;

    if (provider === StorageProvider.S3) {
      // If the stored URL is the direct S3 object URL, we need the key.
      // Here we store key in fileName.
      return this.storageService.getSignedDownloadUrl(key, provider);
    }

    return job.fileUrl;
  }

  async claimNextExportJob(): Promise<{ id: string } | null> {
    const candidates = await (this.prisma as any).exportJob.findMany({
      where: { status: ExportStatus.PENDING },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });

    for (const c of candidates) {
      const updated = await (this.prisma as any).exportJob.updateMany({
        where: { id: c.id, status: ExportStatus.PENDING },
        data: { status: ExportStatus.PROCESSING },
      });

      if (updated?.count === 1) {
        return { id: c.id };
      }
    }

    return null;
  }

  async recoverStuckExportJobs(minutes: number) {
    const threshold = new Date(Date.now() - Math.max(5, minutes) * 60_000);
    // export_jobs does not have startedAt; treat older processing jobs as stuck based on createdAt
    const result = await (this.prisma as any).exportJob.updateMany({
      where: { status: ExportStatus.PROCESSING, createdAt: { lt: threshold } },
      data: { status: ExportStatus.PENDING },
    });

    if (result?.count > 0) {
      this.logger.warn(`Recovered ${result.count} stuck export jobs`);
    }
  }

  async processExportJob(jobId: string) {
    const job = await (this.prisma as any).exportJob.findUnique({ where: { id: jobId } });
    if (!job) {
      return;
    }

    if (job.status !== ExportStatus.PROCESSING) {
      return;
    }

    try {
      const rows = await this.fetchExportRows(job, job.filters || {}, job.columns);
      const csv = json2csv(rows, { fields: job.columns });
      const buffer = Buffer.from(csv, 'utf8');

      const mimeType = 'text/csv';
      const upload = await this.storageService.uploadBuffer(buffer, job.fileName, mimeType, 'csv');

      await (this.prisma as any).exportJob.update({
        where: { id: job.id },
        data: {
          totalRows: rows.length,
          status: ExportStatus.COMPLETED,
          fileUrl: upload.url,
          fileName: upload.key,
          storageProvider: upload.provider,
          completedAt: new Date(),
        },
      });
    } catch (error: any) {
      await (this.prisma as any).exportJob.update({
        where: { id: job.id },
        data: {
          status: ExportStatus.FAILED,
          completedAt: new Date(),
        },
      });
    }
  }

  private async fetchExportRows(job: any, filters: any, columns: string[]) {
    const module = this.normalizeModule(job.module);
    const where = this.coerceFilters(module, filters);

    if (module === 'inventory') {
      const items = await this.prisma.stockItem.findMany({ where, orderBy: { createdAt: 'desc' } });
      return items.map((x) => this.pickColumns(x as any, columns));
    }

    if (module === 'inventory_movements') {
      const movements = await this.prisma.stockMovement.findMany({
        where,
        include: { item: { select: { itemCode: true, name: true } }, warehouse: { select: { code: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      });

      return movements.map((m) =>
        this.pickColumns(
          {
            ...m,
            itemCode: m.item?.itemCode,
            itemName: m.item?.name,
            warehouseCode: m.warehouse?.code,
            warehouseName: m.warehouse?.name,
          } as any,
          columns,
        ),
      );
    }

    if (module === 'warehouses') {
      const items = await this.prisma.warehouse.findMany({ where, orderBy: { createdAt: 'desc' } });
      return items.map((x) => this.pickColumns(x as any, columns));
    }

    if (module === 'suppliers') {
      const items = await this.prisma.supplier.findMany({ where, orderBy: { createdAt: 'desc' } });
      return items.map((x) => this.pickColumns(x as any, columns));
    }

    if (module === 'employees') {
      const items = await this.prisma.employee.findMany({ where, orderBy: { createdAt: 'desc' } });
      return items.map((x) => this.pickColumns(x as any, columns));
    }

    if (module === 'projects') {
      const items = await this.prisma.project.findMany({ where, orderBy: { createdAt: 'desc' } });
      return items.map((x) => this.pickColumns(x as any, columns));
    }

    if (module === 'project_tasks') {
      const projectId = String(job?.context?.projectId || '').trim();
      if (!projectId) {
        throw new BadRequestException('Missing required context: projectId');
      }

      const items = await this.prisma.task.findMany({ where: { ...where, projectId }, orderBy: { createdAt: 'desc' } });
      return items.map((x) => this.pickColumns(x as any, columns));
    }

    const items = await this.prisma.asset.findMany({ where, orderBy: { createdAt: 'desc' } });
    return items.map((x) => this.pickColumns(x as any, columns));
  }

  private pickColumns(row: any, columns: string[]) {
    const out: any = {};
    for (const c of columns) {
      out[c] = row?.[c];
    }
    return out;
  }

  private coerceFilters(module: ModuleKey, filters: any): any {
    if (!filters || typeof filters !== 'object') {
      return {};
    }

    // Keep it simple for 17.1: allow exact-match filters on known scalar fields.
    // Advanced filtering is deferred to later sessions.
    const where: any = {};
    for (const [k, v] of Object.entries(filters)) {
      if (v === undefined) {
        continue;
      }
      where[k] = v;
    }
    return where;
  }

  async getTemplates(module: string) {
    const mod = this.normalizeModule(module);
    return (this.prisma as any).importTemplate.findMany({ where: { module: mod }, orderBy: { createdAt: 'desc' } });
  }

  async createTemplate(body: { name: string; module: string; description?: string; columns: any; isDefault?: boolean }, userId: string) {
    const mod = this.normalizeModule(body.module);
    if (!body.name) {
      throw new BadRequestException('name is required');
    }

    return (this.prisma as any).importTemplate.create({
      data: {
        name: body.name,
        module: mod,
        description: body.description,
        columns: body.columns,
        isDefault: !!body.isDefault,
        createdById: userId,
      },
    });
  }

  async updateTemplate(id: string, body: { name?: string; description?: string; columns?: any; isDefault?: boolean }, userId: string) {
    const existing = await (this.prisma as any).importTemplate.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Template not found');
    }

    if (existing.createdById !== userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      if (!user || !this.adminRoles.includes(user.role)) {
        throw new NotFoundException('Template not found');
      }
    }

    return (this.prisma as any).importTemplate.update({
      where: { id },
      data: {
        name: body.name ?? undefined,
        description: body.description ?? undefined,
        columns: body.columns ?? undefined,
        isDefault: body.isDefault ?? undefined,
      },
    });
  }

  async deleteTemplate(id: string, userId: string) {
    const existing = await (this.prisma as any).importTemplate.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Template not found');
    }

    if (existing.createdById !== userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      if (!user || !this.adminRoles.includes(user.role)) {
        throw new NotFoundException('Template not found');
      }
    }

    await (this.prisma as any).importTemplate.delete({ where: { id } });
    return { deleted: true };
  }

  async getSampleTemplate(module: string): Promise<string> {
    const mod = this.normalizeModule(module);
    const template = this.getDefaultTemplateForModule(mod);
    const headers = template.columns.map((c) => c.header);

    const sampleRows = this.getSampleRowsForModule(mod);
    const csv = json2csv(sampleRows, { fields: headers });
    return csv;
  }

  private getSampleRowsForModule(module: ModuleKey): Record<string, any>[] {
    if (module === 'inventory') {
      return [
        {
          itemCode: 'SKU-001',
          name: 'Safety Helmet',
          description: 'PPE - hard hat',
          category: 'SAFETY_GEAR',
          unit: 'PIECES',
          unitPrice: 120,
          reorderLevel: 10,
          maxStockLevel: 200,
          warehouseId: '',
          warehouseCode: 'WH-MAIN',
          barcode: '1234567890123',
          supplier: 'SUP-EXAMPLE',
          notes: 'Sample inventory item',
          initialQuantity: 50,
        },
      ];
    }

    if (module === 'inventory_movements') {
      return [
        {
          itemCode: 'SKU-001',
          warehouseId: '',
          warehouseCode: 'WH-MAIN',
          movementType: 'STOCK_IN',
          quantity: 20,
          unitPrice: 120,
          reference: 'PO-1001',
          notes: 'Initial restock',
        },
      ];
    }

    if (module === 'suppliers') {
      return [
        {
          name: 'Goldline Supplies Ltd',
          contactPerson: 'Ama Mensah',
          email: 'ama.mensah@goldline.example',
          phone: '+233200000000',
          address: 'Accra Industrial Area',
          city: 'Accra',
          country: 'Ghana',
          taxId: 'GHA-TAX-001',
          bankAccount: 'GCB-000111222',
          paymentTerms: 'Net 30',
          category: 'Consumables',
          rating: 5,
          isActive: true,
          notes: 'Preferred supplier',
        },
      ];
    }

    if (module === 'employees') {
      return [
        {
          employeeId: 'EMP-0001',
          firstName: 'Kwame',
          lastName: 'Owusu',
          email: 'kwame.owusu@company.example',
          phone: '+233201111111',
          dateOfBirth: '1990-01-15',
          gender: 'Male',
          address: 'Tarkwa',
          city: 'Tarkwa',
          country: 'Ghana',
          department: 'Operations',
          position: 'Supervisor',
          employmentType: 'FULL_TIME',
          status: 'ACTIVE',
          hireDate: '2024-01-01',
          terminationDate: '',
          salary: 5000,
          supervisorId: '',
          emergencyContact: 'Akosua Owusu',
          emergencyPhone: '+233202222222',
          notes: 'Sample employee',
        },
      ];
    }

    if (module === 'projects') {
      return [
        {
          projectCode: 'PRJ-001',
          name: 'Tarkwa Pit Expansion',
          description: 'Phase 1 expansion',
          status: 'PLANNING',
          priority: 'HIGH',
          location: 'Tarkwa',
          startDate: '2025-01-01',
          endDate: '2025-06-30',
          estimatedBudget: 250000,
          progress: 0,
          managerId: '',
          notes: 'Sample project',
        },
      ];
    }

    if (module === 'project_tasks') {
      return [
        {
          title: 'Mobilize equipment',
          description: 'Move excavator to site',
          status: 'PENDING',
          assignedTo: 'EMP-0001',
          dueDate: '2025-01-10',
          order: 1,
        },
      ];
    }

    return [
      {
        assetCode: 'AST-001',
        name: 'CAT 320 Excavator',
        description: 'Heavy equipment',
        category: 'HEAVY_EQUIPMENT',
        manufacturer: 'Caterpillar',
        model: '320',
        serialNumber: 'CAT320-XYZ',
        purchaseDate: '2023-05-01',
        purchasePrice: 750000,
        currentValue: 700000,
        depreciationRate: 0.15,
        location: 'Tarkwa Site',
        status: 'ACTIVE',
        condition: 'GOOD',
        assignedTo: 'Operations',
        notes: 'Sample asset',
        warrantyExpiry: '2026-05-01',
        lastMaintenanceAt: '',
        nextMaintenanceAt: '',
      },
    ];
  }
}
