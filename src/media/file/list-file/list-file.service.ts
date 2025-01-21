import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { Request } from 'express';
import { UseGuards } from '@nestjs/common';
import { AccessLevel, Prisma } from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';
import { ListMediaInput } from './list-file.input.dto';
import { ListMediaResponse } from './list-file.response.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { paginationInputTransformer } from 'src/shared/base-list/base-list-input-transform';
import { Order } from 'src/shared/base-list/base-list-input.dto';
import { AwsService } from 'src/aws/aws.service';
import { GetFileService } from '../get-file/get-file.service';
import appEnv from 'src/env';

@UseGuards(JwtAuthGuard)
@Resolver()
export class ListMediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly awsService: AwsService,
    private readonly getFileService: GetFileService,
  ) {}

  @Query(() => ListMediaResponse)
  async listMedia(
    @Context('req') req: Request,
    @Args('listMediaInput', { nullable: true }) listMediaInput: ListMediaInput,
  ): Promise<ListMediaResponse> {
    const currentWorkspaceId = req.currentWorkspaceId;

    let queryObject: Prisma.FileWhereInput = {
      resizeImageId: null,
      workspaceId: {
        equals: currentWorkspaceId,
      },
      deletedAt: listMediaInput?.fromStash
        ? {
            not: {
              not: null,
            },
          }
        : null,
    };

    queryObject = {
      ...queryObject,
    };

    const fileCount = await this.prisma.file.count({
      where: queryObject,
    });

    const paginationMeta = paginationInputTransformer({
      page: listMediaInput?.page,
      pageSize: listMediaInput?.pageSize,
      totalRowCount: fileCount,
    });

    let orderByQuery: any = {
      id: Order.DESC,
    };

    if (listMediaInput?.orderByField && listMediaInput?.orderBy) {
      orderByQuery = {
        [listMediaInput.orderByField as string]: listMediaInput.orderBy,
      };
    }

    const files = await this.prisma.file.findMany({
      skip: paginationMeta.skip,
      take: paginationMeta.perPage,
      orderBy: orderByQuery,
      where: queryObject,
    });

    const updatedFiles = await Promise.all(
      files.map(async (file) => {
        if (
          file.accessLevel === AccessLevel.RESTRICTED &&
          (await this.getFileService.isUrlExpired(file))
        ) {
          const fileUrl = await this.awsService.getfileUrl(
            file.s3Key!,
            file.accessLevel!,
          );

          // Update file URL and return the updated file
          await this.prisma.file.update({
            where: {
              workspaceId: req.currentWorkspaceId,
              id: file.id,
            },
            data: {
              url: fileUrl,
            },
          });

          // Upsert the session
          await this.prisma.s3AccessSession.upsert({
            where: {
              fileId_signedUrl: {
                fileId: file.id,
                signedUrl: file.url,
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

          file.url = fileUrl;
        }

        return file;
      }),
    );

    return {
      file: updatedFiles,
      pagination: {
        currentPage: paginationMeta.page,
        totalPage: paginationMeta.totalPage,
        perPage: paginationMeta.perPage,
        totalRows: fileCount,
      },
    };
  }
}
