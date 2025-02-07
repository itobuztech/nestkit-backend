import { HttpStatus, UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RoleGuard } from 'src/auth/role.guard';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUpdateSubscriptionPlanInput } from './create-update-subscription-plan-input.dto';
import { appConfig } from 'src/app.config';
import { CreateAppError } from 'src/shared/create-error/create-error';
import { CreateUpdateSubscriptionPlanResponse } from './create-update-subscription-plan-response.dto';

@UseGuards(JwtAuthGuard)
@Resolver()
export class CreateUpdateSubscriptionPlanService {
  constructor(private readonly prisma: PrismaService) {}

  @UseGuards(RoleGuard)
  @Mutation(() => CreateUpdateSubscriptionPlanResponse)
  async createUpdateSubscriptionPlan(
    @Args('input')
    input: CreateUpdateSubscriptionPlanInput,
  ): Promise<CreateUpdateSubscriptionPlanResponse> {
    try {
      const { id: planId, ...rest } = input;
      const plan = await this.prisma.subscriptionPlan.upsert({
        where: { id: planId || '' },
        update: {
          ...rest,
          isActive: input.isActive ?? undefined,
          currency: input.currency ?? undefined,
        },
        create: {
          ...rest,
          isActive: input.isActive ?? undefined,
          currency: input.currency ?? undefined,
        },
      });
      return {
        message: `Plan ${input.id ? 'updated' : 'created'} successfully`,
        id: plan.id,
      };
    } catch (error) {
      if (error.code === appConfig.uniqueConstraintsPrismaErrorCode) {
        throw new CreateAppError({
          message: 'Plan name already exists',
          httpStatus: HttpStatus.CONFLICT,
        });
      }
      throw error;
    }
  }
}
