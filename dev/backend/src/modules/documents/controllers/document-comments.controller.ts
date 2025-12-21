import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from "@nestjs/common";
import { DocumentCommentsService } from "../services/document-comments.service";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";

@Controller("documents")
export class DocumentCommentsController {
  constructor(private readonly commentsService: DocumentCommentsService) {}

  @Get(":id/comments")
  async listComments(
    @Param("id") documentId: string,
    @CurrentUser() user: any,
  ) {
    return this.commentsService.listComments(
      documentId,
      user.userId,
      user.role,
    );
  }

  @Post(":id/comments")
  async addComment(
    @Param("id") documentId: string,
    @Body()
    body: {
      content: string;
      pageNumber?: number;
      positionX?: number;
      positionY?: number;
    },
    @CurrentUser() user: any,
  ) {
    return this.commentsService.addComment(documentId, body, user);
  }

  @Put("comments/:id")
  async updateComment(
    @Param("id") commentId: string,
    @Body() body: { content: string },
    @CurrentUser() user: any,
  ) {
    return this.commentsService.updateComment(commentId, body, user);
  }

  @Delete("comments/:id")
  async deleteComment(
    @Param("id") commentId: string,
    @CurrentUser() user: any,
  ) {
    return this.commentsService.deleteComment(commentId, user);
  }

  @Post("comments/:id/resolve")
  async resolveComment(
    @Param("id") commentId: string,
    @Body() body: { resolved?: boolean },
    @CurrentUser() user: any,
  ) {
    return this.commentsService.resolveComment(commentId, body, user);
  }

  @Post("comments/:id/reply")
  async replyToComment(
    @Param("id") commentId: string,
    @Body()
    body: {
      content: string;
      pageNumber?: number;
      positionX?: number;
      positionY?: number;
    },
    @CurrentUser() user: any,
  ) {
    return this.commentsService.replyToComment(commentId, body, user);
  }
}
