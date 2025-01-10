import {
  Body,
  Controller,
  Post,
  Req,
  SetMetadata,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';

import { FileService } from '../file.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { WorkspaceMemberShipGuard } from 'src/auth/workspace-membership.guard';
import { MemberShipValidationType } from 'src/auth/membership-validation-type.enum';
import { AccessLevel } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('media')
export class UploadMediaController {
  constructor(private readonly uploadMediaService: FileService) {}

  @UseGuards(WorkspaceMemberShipGuard)
  @SetMetadata(
    'memberShipValidationType',
    MemberShipValidationType.MEMBERSHIP_VALIDITY,
  )
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Body('accessLevel') accessLevel: AccessLevel,
    @UploadedFile() file: Express.Multer.File,
    @Req()
    req: Request,
  ) {
    const workspaceId = req.currentWorkspaceId as string;
    const filePath = await this.uploadMediaService.saveFile(file);
    const media = await this.uploadMediaService.uploadMedia({
      file: { ...file, path: filePath },
      workspaceId,
      accessLevel,
    });
    return media;
  }
}
