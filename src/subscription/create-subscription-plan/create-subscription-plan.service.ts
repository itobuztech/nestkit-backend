import { HttpStatus, UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RoleGuard } from 'src/auth/role.guard';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSubscriptionPlanInput } from './create-subscription-plan-input.dto';
import { appConfig } from 'src/app.config';
import { CreateAppError } from 'src/shared/create-error/create-error';
import { CreateSubscriptionPlanResponse } from './create-subscription-plan-response.dto';

@UseGuards(JwtAuthGuard)
@Resolver()
export class CreateSubscriptionPlanService {
  constructor(private readonly prisma: PrismaService) {}

  @UseGuards(RoleGuard)
  @Mutation(() => CreateSubscriptionPlanResponse)
  async createSubscriptionPlan(
    @Args('input')
    input: CreateSubscriptionPlanInput,
  ): Promise<CreateSubscriptionPlanResponse> {
    try {
      const plan = await this.prisma.subscriptionPlan.create({
        data: {
          ...input,
          isActive: input.isActive === null ? undefined : input.isActive,
          currency: input.currency ? input.currency : undefined,
        },
      });
      return {
        message: 'Plan created successfully',
        id: plan.id,
      };
    } catch (error) {
      if (error.code === appConfig.uniqueConstraintsPrismaErrorCode) {
        throw new CreateAppError({
          message: 'Plan already exists',
          httpStatus: HttpStatus.CONFLICT,
        });
      }
      throw error;
    }
  }
}
