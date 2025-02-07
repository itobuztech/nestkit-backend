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
import { AccessLevel, File } from '@prisma/client';
import appEnv from 'src/env';

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
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: appEnv.MAX_FILE_SIZE,
    },
    fileFilter: (req, file, callback) => {
      if (appEnv.ALLOWED_MIME_TYPES.split(',').includes(file.mimetype)) {
        callback(null, true);
      } else {
        callback(new Error('Invalid file type'), false);
      }
    },
  }))
  async uploadFile(
    @Body('accessLevel') accessLevel: AccessLevel,
    @UploadedFile() file: Express.Multer.File,
    @Req()
    req: Request,
  ) {
    const workspaceId = req.currentWorkspaceId as string;
    let media: File;
    if (appEnv.isS3Enabled) {
      media = await this.uploadMediaService.uploadMedia({
        file,
        workspaceId,
        accessLevel,
      });
    } else {
      media = await this.uploadMediaService.saveFile({
        file,
        workspaceId,
        accessLevel,
      });
    }

    return media;
  }
}
