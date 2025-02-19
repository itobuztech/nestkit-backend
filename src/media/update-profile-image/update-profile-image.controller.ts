import {
  Controller,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';

import { FileService } from '../file/file.service';
import { UpdateProfileImageService } from './update-profile-image.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import appEnv from 'src/env';
import { AccessLevel, File } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('media')
export class UpdateProfileImageController {
  constructor(
    private readonly uploadMediaService: FileService,
    private readonly updateProfileImage: UpdateProfileImageService,
  ) {}

  @Post('profile-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const workspaceId = req.currentWorkspaceId as string;
    let media: File;
    if (appEnv.isS3Enabled) {
      media = await this.uploadMediaService.uploadMedia({
        file,
        workspaceId,
        accessLevel: AccessLevel.PUBLIC,
      });
    } else {
      media = await this.uploadMediaService.saveFile({
        file,
        workspaceId,
      });
    }
    return await this.updateProfileImage.updateProfileMedia(
      media,
      req.user?.id || '',
    );
  }
}
