import { HttpStatus, UseGuards } from '@nestjs/common';
import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { Request } from 'express';

import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAppError } from 'src/shared/create-error/create-error';
import { GetFileInput } from './get-file.input';
import { GetFileResponse } from './get-file-response.dto';
import { AwsService } from 'src/aws/aws.service';
import { AccessLevel, File } from '@prisma/client';
import appEnv from 'src/env';

@Resolver()
@UseGuards(JwtAuthGuard)
export class GetFileService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly awsService: AwsService,
  ) {}

  @Query(() => GetFileResponse, { nullable: true })
  async getFile(
    @Context('req') req: Request,
    @Args('getFileInput', { nullable: true }) getFileInput: GetFileInput,
  ) {
    const file = await this.prismaService.file.findFirst({
      where: {
        workspaceId: req.currentWorkspaceId,
        id: getFileInput.id,
        deletedAt: getFileInput.fromStash ? { not: null } : null,
      },
      include: {
        resizeImages: true,
      },
    });

    if (!file) {
      throw new CreateAppError({
        message: 'File not found',
        httpStatus: HttpStatus.NOT_FOUND,
      });
    }

    file.url = await this.updateFileUrl(file); // update file url if stored in s3 and url is expired

    if (file.resizeImages.length) {
      await Promise.all(
        file.resizeImages.map(async (resizedFiles) => {
          resizedFiles.url = await this.updateFileUrl(resizedFiles);
        }),
      );
    }

    return file;
  }

  async isUrlExpired(file: File) {
    const fileExpiryData = await this.prismaService.s3AccessSession.findUnique({
      where: {
        fileId_signedUrl: {
          fileId: file.id,
          signedUrl: file.url,
        },
      },
    });

    return !fileExpiryData || fileExpiryData.expiresAt < new Date();
  }

  async updateFileUrl(file: File) {
    if (file.s3Key) {
      // checking if url is expired
      if (
        file.accessLevel === AccessLevel.RESTRICTED &&
        (await this.isUrlExpired(file))
      ) {
        const fileUrl = await this.awsService.getfileUrl(
          file.s3Key,
          file.accessLevel,
        );

        await this.prismaService.s3AccessSession.upsert({
          where: {
            fileId_signedUrl: {
              fileId: file.id,
              signedUrl: file.url,
            },
          },
          update: {
            signedUrl: fileUrl,
            expiresAt: new Date(Date.now() + appEnv.AWS_SIGNED_URL_EXPIRY * 1000),
          },
          create: {
            signedUrl: fileUrl,
            fileId: file.id,
            expiresAt: new Date(Date.now() + appEnv.AWS_SIGNED_URL_EXPIRY * 1000),
          },
        });

        await this.prismaService.file.update({
          where: {
            id: file.id,
          },
          data: {
            url: fileUrl,
          },
        });

        return fileUrl;
      }
    }

    return `${appEnv.BACKEND_URL}/${file.url}`;
  }
}
