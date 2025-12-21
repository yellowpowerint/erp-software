import { Controller, Get, Post, Delete, Body, Param } from "@nestjs/common";
import { DocumentSharingService } from "../services/document-sharing.service";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";

@Controller("documents")
export class DocumentSharingController {
  constructor(private readonly sharingService: DocumentSharingService) {}

  @Post(":id/share")
  async shareDocument(
    @Param("id") documentId: string,
    @Body()
    body: {
      sharedWithId?: string;
      expiresAt?: string;
      canEdit?: boolean;
      canDownload?: boolean;
      generatePublicLink?: boolean;
    },
    @CurrentUser() user: any,
  ) {
    return this.sharingService.shareDocument(documentId, body, user);
  }

  @Get("shared/with-me")
  async sharedWithMe(@CurrentUser() user: any) {
    return this.sharingService.getSharedWithMe(user.userId);
  }

  @Get("shared/by-me")
  async sharedByMe(@CurrentUser() user: any) {
    return this.sharingService.getSharedByMe(user.userId);
  }

  @Delete("shares/:id")
  async revokeShare(@Param("id") shareId: string, @CurrentUser() user: any) {
    return this.sharingService.revokeShare(shareId, user);
  }
}
