import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { DocumentAnnotationsService } from '../services/document-annotations.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AnnotationType } from '@prisma/client';

@Controller('documents')
export class DocumentAnnotationsController {
  constructor(private readonly annotationsService: DocumentAnnotationsService) {}

  @Get(':id/annotations')
  async listAnnotations(@Param('id') documentId: string, @CurrentUser() user: any) {
    return this.annotationsService.listAnnotations(documentId, user.userId, user.role);
  }

  @Post(':id/annotations')
  async addAnnotation(
    @Param('id') documentId: string,
    @Body()
    body: {
      type: AnnotationType;
      pageNumber: number;
      coordinates: any;
      content?: string;
      color?: string;
    },
    @CurrentUser() user: any,
  ) {
    return this.annotationsService.addAnnotation(documentId, body, user);
  }

  @Put('annotations/:id')
  async updateAnnotation(
    @Param('id') annotationId: string,
    @Body() body: { coordinates?: any; content?: string; color?: string },
    @CurrentUser() user: any,
  ) {
    return this.annotationsService.updateAnnotation(annotationId, body, user);
  }

  @Delete('annotations/:id')
  async deleteAnnotation(@Param('id') annotationId: string, @CurrentUser() user: any) {
    return this.annotationsService.deleteAnnotation(annotationId, user);
  }
}
