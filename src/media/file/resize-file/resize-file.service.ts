import { HttpStatus, Req, UseGuards } from '@nestjs/common';
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
import { File } from '@prisma/client';
import { join } from 'path';

@Resolver()
@UseGuards(JwtAuthGuard)
export class ResizeFileService {
  constructor(
    private prismaService: PrismaService,
    private fileService: FileService,
    private awsService: AwsService,
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

    let filePath = '';

    const oldFileBuffer = await this.getOldFile(file);

    if (
      resizeFileInput.resizeOptions.left &&
      resizeFileInput.resizeOptions.top
    ) {
      filePath = await this.fileService.cropImage(
        file,
        resizeFileInput.resizeOptions,
        oldFileBuffer,
      );
    } else {
      filePath = await this.fileService.resizeImage(
        file,
        resizeFileInput.resizeOptions,
        oldFileBuffer,
      );
    }

    await this.prismaService.file.deleteMany({
      where: {
        resizeImageId: file.id,
        workspaceId: file.workspaceId,
        url: filePath,
      },
    });

    const media = await this.prismaService.file.create({
      data: {
        resizeImageId: file.id,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size,
        url: appEnv.isS3Enabled ? null : filePath,
        workspaceId: file.workspaceId,
        s3Key: appEnv.isS3Enabled ? filePath : null,
      },
    });

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
      const originalFilePath = join(process.cwd(), 'public', file.url!);

      const buffer = await fs.readFile(originalFilePath);
      return buffer;
    }
  }
}
