import { Args, Query, Resolver } from '@nestjs/graphql';
import { PrismaService } from 'src/prisma/prisma.service';
import { ListSubscriptionPlanInput } from './list-subscription-plan-input.dto';
import { Prisma } from '@prisma/client';
import { paginationInputTransformer } from 'src/shared/base-list/base-list-input-transform';
import { Order } from 'src/shared/base-list/base-list-input.dto';
import { ListSubscriptionPlanResponse } from './list-subscription-plan-response.dto';

@Resolver()
export class ListSubscriptionPlanService {
  constructor(private readonly prisma: PrismaService) {}

  @Query(() => ListSubscriptionPlanResponse)
  async listSubscriptionPlan(
    @Args('listSubscriptionPlanInput')
    listSubscriptionPlanInput: ListSubscriptionPlanInput,
  ): Promise<ListSubscriptionPlanResponse> {
    try {
      const queryObject: Prisma.SubscriptionPlanWhereInput = {
        name: {
          contains: listSubscriptionPlanInput?.name || undefined,
          mode: 'insensitive',
        },
        deletedAt: listSubscriptionPlanInput?.fromStash
          ? {
              not: {
                not: null,
              },
            }
          : null,
      };

      const subscriptionPlanCount = await this.prisma.subscriptionPlan.count({
        where: queryObject,
      });
      const paginationMeta = paginationInputTransformer({
        page: listSubscriptionPlanInput?.page,
        pageSize: listSubscriptionPlanInput?.pageSize,
        totalRowCount: subscriptionPlanCount,
      });

      let orderByQuery: any = {
        id: Order.DESC,
      };

      if (
        listSubscriptionPlanInput?.orderByField &&
        listSubscriptionPlanInput?.orderBy
      ) {
        orderByQuery = {
          [listSubscriptionPlanInput.orderByField as string]:
            listSubscriptionPlanInput.orderBy,
        };
      }

      const subscriptionPlanList = await this.prisma.subscriptionPlan.findMany({
        skip: paginationMeta.skip,
        take: paginationMeta.perPage,
        where: queryObject,
        orderBy: orderByQuery,
      });
      return {
        subscriptionPlans: subscriptionPlanList,
        pagination: {
          currentPage: paginationMeta.page,
          totalPage: paginationMeta.totalPage,
          perPage: paginationMeta.perPage,
          totalRows: subscriptionPlanCount,
        },
      };
    } catch (error) {
      throw error;
    }
  }
}
