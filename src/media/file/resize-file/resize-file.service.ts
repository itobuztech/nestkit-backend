import { HttpStatus, UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { Request } from 'express';

import { promises as fs } from 'fs';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAppError } from 'src/shared/create-error/create-error';
import { ResizeFileInput } from './resize-file.input';
import { FileService } from '../file.service';
import GraphQLJSON from 'graphql-type-json';
import { AwsService } from 'src/aws/aws.service';
import appEnv from 'src/env';
import { AccessLevel, File } from '@prisma/client';
import { join } from 'path';

@Resolver()
@UseGuards(JwtAuthGuard)
export class ResizeFileService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly fileService: FileService,
    private readonly awsService: AwsService,
  ) {}

  @Mutation(() => GraphQLJSON)
  async resizeFile(
    @Context('req') req: Request,
    @Args('resizeFileInput', { nullable: true })
    resizeFileInput: ResizeFileInput,
  ) {
    
    const file = await this.prismaService.file.findUnique({
      where: { id: resizeFileInput.id },
    });

    if (!file) {
      throw new CreateAppError({
        message: 'File not found',
        httpStatus: HttpStatus.NOT_FOUND,
      });
    }
    const imageMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];

    if (!imageMimeTypes.includes(file.mimeType)) {
      throw new CreateAppError({
        message: 'Only Images can be resized',
      });
    }

    let filePath = null;

    // Fetching old file
    const originalFile = await this.getOldFile(file);

    // resizing image
    if (
      typeof resizeFileInput.resizeOptions.left === 'number' &&
      typeof resizeFileInput.resizeOptions.top === 'number'
    ) {
      filePath = await this.fileService.cropImage(
        file,
        resizeFileInput.resizeOptions,
        originalFile,
      );
    } else {
      filePath = await this.fileService.resizeImage(
        file,
        resizeFileInput.resizeOptions,
        originalFile,
      );
    }

    let fileUrl = filePath;
    if (appEnv.isS3Enabled && filePath) {
      fileUrl = await this.awsService.getfileUrl(filePath, file.accessLevel!);
    }

    await this.prismaService.file.deleteMany({
      where: {
        resizeImageId: file.id,
        workspaceId: file.workspaceId,
        url: fileUrl,
      },
    });

    const media = await this.prismaService.file.create({
      data: {
        resizeImageId: file.resizeImageId ? file.resizeImageId : file.id,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size,
        accessLevel: file.accessLevel,
        url: fileUrl || '',
        workspaceId: file.workspaceId,
        s3Key: appEnv.isS3Enabled ? filePath : null,
      },
    });

    // store signed url
    if (media.s3Key && media.accessLevel === AccessLevel.RESTRICTED) {
      await this.prismaService.s3AccessSession.create({
        data: {
          signedUrl: fileUrl || '',
          fileId: media.id,
          expiresAt: new Date(Date.now() + appEnv.SIGNED_URL_EXPIRY * 1000),
        },
      });
    }

    return media;
  }

  async getOldFile(file: File) {
    if (file.s3Key) {
      const s3File = await this.awsService.getUploadedFile(
        file.s3Key,
        file.accessLevel!,
      );
      return s3File;
    } else {
      const originalFilePath = join(process.cwd(), 'public', file.url);

      const buffer = await fs.readFile(originalFilePath);
      return buffer;
    }
  }
}
