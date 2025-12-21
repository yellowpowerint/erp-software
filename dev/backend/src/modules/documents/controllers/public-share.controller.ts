import {
  Controller,
  Get,
  Param,
  Res,
  StreamableFile,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { Response } from "express";
import { Public } from "../../../common/decorators/public.decorator";
import { DocumentSharingService } from "../services/document-sharing.service";
import { StorageProvider, StorageService } from "../services/storage.service";
import * as fs from "fs";
import * as mime from "mime-types";

@Controller("share")
export class PublicShareController {
  constructor(
    private readonly sharingService: DocumentSharingService,
    private readonly storageService: StorageService,
  ) {}

  @Public()
  @Get(":shareToken")
  async getShare(@Param("shareToken") shareToken: string) {
    const share = await this.sharingService.getShareByToken(shareToken);

    return {
      shareId: share.id,
      documentId: share.documentId,
      documentName: share.document.originalName,
      canDownload: share.canDownload,
      canEdit: share.canEdit,
      expiresAt: share.expiresAt,
      sharedBy: share.sharedBy,
      file: {
        mimeType: share.document.mimeType,
        downloadUrl: `/api/share/${shareToken}/file`,
      },
    };
  }

  @Public()
  @Get(":shareToken/file")
  async downloadSharedFile(
    @Param("shareToken") shareToken: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const share = await this.sharingService.getShareByToken(shareToken);

    if (!share.canDownload) {
      throw new ForbiddenException("Download not allowed for this share");
    }

    const doc = share.document;

    const provider = doc.fileUrl.includes("s3.amazonaws.com")
      ? StorageProvider.S3
      : StorageProvider.LOCAL;

    if (provider === StorageProvider.S3) {
      const url = await this.storageService.getSignedDownloadUrl(
        doc.fileName,
        StorageProvider.S3,
        3600,
      );
      res.redirect(url);
      return;
    }

    const filePath = this.storageService.getLocalFilePath(doc.fileName);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException("File not found");
    }

    const mimeType =
      mime.lookup(doc.originalName) || "application/octet-stream";
    res.set({
      "Content-Type": mimeType,
      "Content-Disposition": `attachment; filename="${doc.originalName.replace(/[^\w.-]/g, "_")}"`,
    });

    return new StreamableFile(fs.createReadStream(filePath));
  }
}
