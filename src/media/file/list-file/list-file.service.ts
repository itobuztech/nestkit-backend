import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { Request } from 'express';
import { UseGuards } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';
import { ListMediaInput } from './list-file.input.dto';
import { ListMediaResponse } from './list-file.response.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { paginationInputTransformer } from 'src/shared/base-list/base-list-input-transform';
import { Order } from 'src/shared/base-list/base-list-input.dto';
import { AwsService } from 'src/aws/aws.service';
import { GetFileService } from '../get-file/get-file.service';

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
        file.url = await this.getFileService.updateFileUrl(file);
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
