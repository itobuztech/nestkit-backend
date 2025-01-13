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
    private prismaService: PrismaService,
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
    if (file.s3Key) {
      if (
        !file.s3Url ||
        (file.accessLevel === AccessLevel.RESTRICTED &&
          (await this.isUrlExpired(file)))
      ) {
        const fileUrl = await this.awsService.getfileUrl(
          file.s3Key!,
          file.accessLevel!,
        );

        await this.prismaService.file.update({
          where: {
            workspaceId: req.currentWorkspaceId,
            id: getFileInput.id,
            deletedAt: getFileInput.fromStash ? { not: null } : null,
          },
          data: {
            s3Url: fileUrl,
          },
        });

        if (file.accessLevel === AccessLevel.RESTRICTED) {
          await this.prismaService.s3AccessSession.upsert({
            where: {
              fileId_signedUrl: {
                fileId: file.id,
                signedUrl: file.s3Url ?? fileUrl,
              },
            },
            update: {
              expiresAt: new Date(Date.now() + appEnv.SIGNED_URL_EXPIRY * 1000),
            },
            create: {
              signedUrl: fileUrl,
              fileId: file.id,
              expiresAt: new Date(Date.now() + appEnv.SIGNED_URL_EXPIRY * 1000),
            },
          });
        }
        file.s3Url = fileUrl;
      }
    }

    return file;
  }

  async isUrlExpired(file: File) {
    const fileExpiryData = await this.prismaService.s3AccessSession.findUnique({
      where: {
        fileId_signedUrl: {
          fileId: file.id,
          signedUrl: file.s3Url!,
        },
      },
    });

    return !fileExpiryData || fileExpiryData.expiresAt < new Date();
  }
}
