import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { StorageService } from "../documents/services/storage.service";
import { createHash } from "crypto";
import { gzipSync, gunzipSync } from "zlib";

type BackupManifest = {
  version: string;
  createdAt: string;
  models: Array<{ name: string; count: number; sha256: string }>;
};

type BackupPayload = {
  manifest: BackupManifest;
  data: Record<string, any[]>;
};

@Injectable()
export class MigrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  private async fetchModel(model: string): Promise<any[]> {
    const delegate = (this.prisma as any)[model];
    if (!delegate?.findMany) {
      throw new BadRequestException(`Unsupported model: ${model}`);
    }
    return delegate.findMany();
  }

  private sha256(buf: Buffer): string {
    return createHash("sha256").update(buf).digest("hex");
  }

  async exportFullBackup(): Promise<{
    fileUrl: string;
    fileName: string;
    size: number;
    manifest: BackupManifest;
  }> {
    // Keep scope to core ERP data; exclude binary/document blobs.
    const models: string[] = [
      "user",
      "warehouse",
      "supplier",
      "employee",
      "asset",
      "project",
      "task",
      "stockItem",
      "stockMovement",
      "productionLog",
      "shift",
      "safetyInspection",
      "safetyIncident",
      "safetyTraining",
      "invoice",
      "expense",
      "financePayment",
    ];

    const manifest: BackupManifest = {
      version: "17.3",
      createdAt: new Date().toISOString(),
      models: [],
    };

    const data: Record<string, any[]> = {};

    for (const m of models) {
      const rows = await this.fetchModel(m);
      data[m] = rows;
      const buf = Buffer.from(JSON.stringify(rows), "utf8");
      const hash = this.sha256(buf);
      manifest.models.push({ name: m, count: rows.length, sha256: hash });
    }

    const payload: BackupPayload = { manifest, data };
    const jsonBuf = Buffer.from(JSON.stringify(payload), "utf8");
    const gz = gzipSync(jsonBuf);

    const upload = await this.storageService.uploadBuffer(
      gz,
      `full-backup-${Date.now()}.json.gz`,
      "application/gzip",
      "backups",
    );

    return {
      fileUrl: upload.url,
      fileName: upload.key,
      size: gz.length,
      manifest,
    };
  }

  async validateBackupIntegrity(
    file: Express.Multer.File,
  ): Promise<{ valid: boolean; manifest?: BackupManifest; errors: string[] }> {
    if (!file?.buffer?.length) {
      throw new BadRequestException("Empty file");
    }

    const errors: string[] = [];

    let payload: BackupPayload;
    try {
      const json = gunzipSync(file.buffer).toString("utf8");
      payload = JSON.parse(json);
    } catch {
      return { valid: false, errors: ["Invalid gzip JSON backup"] };
    }

    const manifest = payload?.manifest;
    const data = payload?.data;
    if (!manifest || !data) {
      return { valid: false, errors: ["Missing manifest or data"] };
    }

    for (const m of manifest.models || []) {
      const rows = Array.isArray(data[m.name]) ? data[m.name] : null;
      if (!rows) {
        errors.push(`${m.name} missing`);
        continue;
      }
      const b = Buffer.from(JSON.stringify(rows), "utf8");
      const hash = this.sha256(b);
      if (hash !== m.sha256) {
        errors.push(`${m.name} hash mismatch`);
      }
    }

    return { valid: errors.length === 0, manifest, errors };
  }

  async importFullBackup(
    file: Express.Multer.File,
    options?: { overwrite?: boolean },
  ): Promise<{ restored: boolean; message: string }> {
    const validation = await this.validateBackupIntegrity(file);
    if (!validation.valid) {
      throw new BadRequestException(
        `Backup validation failed: ${validation.errors.join(", ")}`,
      );
    }

    const overwrite = !!options?.overwrite;
    if (!overwrite) {
      throw new BadRequestException(
        "overwrite=true required to restore backup",
      );
    }

    let payload: BackupPayload;
    try {
      const json = gunzipSync(file.buffer).toString("utf8");
      payload = JSON.parse(json);
    } catch {
      throw new BadRequestException("Invalid gzip JSON backup");
    }

    // NOTE: For production-ready safety, we only restore on explicit overwrite.
    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        'TRUNCATE TABLE "export_jobs" RESTART IDENTITY CASCADE',
      );
      await tx.$executeRawUnsafe(
        'TRUNCATE TABLE "import_jobs" RESTART IDENTITY CASCADE',
      );
      await tx.$executeRawUnsafe(
        'TRUNCATE TABLE "scheduled_export_runs" RESTART IDENTITY CASCADE',
      );
      await tx.$executeRawUnsafe(
        'TRUNCATE TABLE "scheduled_exports" RESTART IDENTITY CASCADE',
      );
      await tx.$executeRawUnsafe(
        'TRUNCATE TABLE "import_changes" RESTART IDENTITY CASCADE',
      );
      await tx.$executeRawUnsafe(
        'TRUNCATE TABLE "import_rollbacks" RESTART IDENTITY CASCADE',
      );
      await tx.$executeRawUnsafe(
        'TRUNCATE TABLE "csv_batches" RESTART IDENTITY CASCADE',
      );
      await tx.$executeRawUnsafe(
        'TRUNCATE TABLE "csv_audit_logs" RESTART IDENTITY CASCADE',
      );

      await tx.$executeRawUnsafe(
        'TRUNCATE TABLE "tasks" RESTART IDENTITY CASCADE',
      );
      await tx.$executeRawUnsafe(
        'TRUNCATE TABLE "projects" RESTART IDENTITY CASCADE',
      );
      await tx.$executeRawUnsafe(
        'TRUNCATE TABLE "stock_movements" RESTART IDENTITY CASCADE',
      );
      await tx.$executeRawUnsafe(
        'TRUNCATE TABLE "stock_items" RESTART IDENTITY CASCADE',
      );
      await tx.$executeRawUnsafe(
        'TRUNCATE TABLE "warehouses" RESTART IDENTITY CASCADE',
      );
      await tx.$executeRawUnsafe(
        'TRUNCATE TABLE "suppliers" RESTART IDENTITY CASCADE',
      );
      await tx.$executeRawUnsafe(
        'TRUNCATE TABLE "employees" RESTART IDENTITY CASCADE',
      );
      await tx.$executeRawUnsafe(
        'TRUNCATE TABLE "assets" RESTART IDENTITY CASCADE',
      );
      await tx.$executeRawUnsafe(
        'TRUNCATE TABLE "users" RESTART IDENTITY CASCADE',
      );
    });

    const restoreOrder = (payload.manifest.models || []).map((x) => x.name);
    for (const model of restoreOrder) {
      const rows = Array.isArray(payload.data?.[model])
        ? payload.data[model]
        : [];
      const delegate = (this.prisma as any)[model];
      if (!delegate?.createMany) {
        continue;
      }
      if (rows.length) {
        await delegate.createMany({ data: rows, skipDuplicates: true });
      }
    }

    return { restored: true, message: "Backup restored (overwrite)" };
  }
}
