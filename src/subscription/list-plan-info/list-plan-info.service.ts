import { Args, Query, Resolver } from '@nestjs/graphql';
import { PrismaService } from 'src/prisma/prisma.service';
import { ListPlanInfoInput } from './list-plan-info-input.dto';
import { Prisma } from '@prisma/client';
import { paginationInputTransformer } from 'src/shared/base-list/base-list-input-transform';
import { Order } from 'src/shared/base-list/base-list-input.dto';
import { ListPlanInfoResponse } from './list-plan-info-response.dto';

@Resolver()
export class ListPlanInfoService {
  constructor(private readonly prisma: PrismaService) {}

  @Query(() => ListPlanInfoResponse)
  async listPlanInfo(
    @Args('listPlanInfoInput') listPlanInfoInput: ListPlanInfoInput,
  ): Promise<ListPlanInfoResponse> {
    try {
      const queryObject: Prisma.SubscriptionPlanInfoWhereInput = {
        planId: listPlanInfoInput?.planId,
        title: {
          contains: listPlanInfoInput?.title || undefined,
          mode: 'insensitive',
        },
        deletedAt: listPlanInfoInput?.fromStash
          ? {
              not: {
                not: null,
              },
            }
          : null,
      };

      const planInfoCount = await this.prisma.subscriptionPlanInfo.count({
        where: queryObject,
      });

      const paginationMeta = paginationInputTransformer({
        page: listPlanInfoInput?.page,
        pageSize: listPlanInfoInput?.pageSize,
        totalRowCount: planInfoCount,
      });

      let orderByQuery: any = {
        id: Order.DESC,
      };

      if (listPlanInfoInput?.orderByField && listPlanInfoInput?.orderBy) {
        orderByQuery = {
          [listPlanInfoInput.orderByField as string]: listPlanInfoInput.orderBy,
        };
      }

      const planInfoList = await this.prisma.subscriptionPlanInfo.findMany({
        skip: paginationMeta.skip,
        take: paginationMeta.perPage,
        where: queryObject,
        orderBy: orderByQuery,
      });
      return {
        planInfoList,
        pagination: {
          currentPage: paginationMeta.page,
          totalPage: paginationMeta.totalPage,
          perPage: paginationMeta.perPage,
          totalRows: planInfoCount,
        },
      };
    } catch (error) {
      throw error;
    }
  }
}
