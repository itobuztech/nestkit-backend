import { HttpStatus, UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateSubscriptionPlanInput } from './update-subscription-plan-input.dto';
import { appConfig } from 'src/app.config';
import { CreateAppError } from 'src/shared/create-error/create-error';
import { UpdateSubscriptionPlanResponse } from './update-subscription-plan-response.dto';

@UseGuards(JwtAuthGuard)
@Resolver()
export class UpdateSubscriptionPlanService {
  constructor(private readonly prisma: PrismaService) {}

  @Mutation(() => UpdateSubscriptionPlanResponse)
  async updateSubscriptionPlan(
    @Args('input')
    input: UpdateSubscriptionPlanInput,
  ): Promise<UpdateSubscriptionPlanResponse> {
    try {
      const { id: planId, ...rest } = input;
      const plan = await this.prisma.subscriptionPlan.update({
        where: { id: planId || '' },
        data: {
          ...rest,
          isActive: input.isActive ?? undefined,
          currency: input.currency ?? undefined,
        },
      });
      return {
        message: `Plan updated successfully`,
        id: plan.id,
      };
    } catch (error) {
      if (error.code === appConfig.uniqueConstraintsPrismaErrorCode) {
        throw new CreateAppError({
          message: 'Plan name already exists',
          httpStatus: HttpStatus.CONFLICT,
        });
      } else if (error.code === appConfig.notFoundPrismaErrorCode) {
        throw new CreateAppError({
          message: 'Plan not found',
          httpStatus: HttpStatus.NOT_FOUND,
        });
      }
      throw error;
    }
  }
}
