import { HttpStatus, UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { Request } from 'express';

import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAppError } from 'src/shared/create-error/create-error';
import { FileDeleteInput } from './delete-file.input';
import { FileService } from '../file.service';
import { AwsService } from 'src/aws/aws.service';
import { AccessLevel } from '@prisma/client';

@Resolver()
@UseGuards(JwtAuthGuard)
export class DeleteFileService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly fileService: FileService,
    private readonly awsService: AwsService,
  ) {}

  @Mutation(() => Boolean)
  async deleteFile(
    @Context('req') req: Request,
    @Args('fileDeleteInput', { nullable: true })
    fileDeleteInput: FileDeleteInput,
  ): Promise<boolean> {
    const file = await this.prismaService.file.findUnique({
      where: {
        id: fileDeleteInput.id,
        deletedAt: fileDeleteInput.fromStash ? { not: null } : null,
      },
    });

    if (!file) {
      throw new CreateAppError({
        message: 'File not found',
        httpStatus: HttpStatus.NOT_FOUND,
      });
    }

    try {
      if (fileDeleteInput.fromStash) {
        const resizedFiles = await this.prismaService.file.findMany({
          where: {
            resizeImageId: fileDeleteInput.id,
          },
        });

        await Promise.all(
          resizedFiles.map(async (file) => {
            this.removeFileFromStorage({
              fileId: file.id,
              accessLevel: file.accessLevel!,
              fileUrl: file.url,
              s3Key: file.s3Key,
            });
          }),
        );
        await this.removeFileFromStorage({
          fileId: fileDeleteInput.id,
          accessLevel: file.accessLevel!,
          fileUrl: file.url,
          s3Key: file.s3Key,
        });
      } else {
        await this.prismaService.file.update({
          where: { id: fileDeleteInput.id, deletedAt: null },
          data: { deletedAt: new Date() },
        });
      }

      return true;
    } catch (error) {
      throw new CreateAppError({
        message: error.message,
        httpStatus: HttpStatus.NOT_FOUND,
        error,
      });
    }
  }
  async removeFileFromStorage({
    fileId,
    accessLevel,
    fileUrl,
    s3Key,
  }: {
    fileId: string;
    accessLevel: AccessLevel;
    fileUrl: string | null;
    s3Key: string | null;
  }) {
    await this.prismaService.s3AccessSession.deleteMany({
      where: { fileId: fileId },
    });
    await this.prismaService.file.delete({
      where: { id: fileId },
    });
    if (s3Key) {
      await this.awsService.deleteFile(s3Key, accessLevel);
    } else {
      await this.fileService.deleteFile(fileUrl!);
    }
  }
}
