import { Controller, Get, Post, Param } from '@nestjs/common';
import { DocumentPresenceService } from '../services/document-presence.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller('documents')
export class DocumentPresenceController {
  constructor(private readonly presenceService: DocumentPresenceService) {}

  @Post(':id/presence/heartbeat')
  async heartbeat(@Param('id') documentId: string, @CurrentUser() user: any) {
    return this.presenceService.heartbeat(documentId, user.userId, user.role);
  }

  @Get(':id/presence/viewers')
  async viewers(@Param('id') documentId: string, @CurrentUser() user: any) {
    return this.presenceService.listViewers(documentId, user.userId, user.role);
  }
}
