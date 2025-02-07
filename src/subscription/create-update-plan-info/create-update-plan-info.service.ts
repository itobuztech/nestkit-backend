import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUpdatePlanInfoInput } from './create-update-plan-info-input.dto';
import { CreateUpdatePlanInfoResponse } from './create-update-plan-info-response.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Resolver()
export class CreateUpdatePlanInfoService {
  constructor(private readonly prisma: PrismaService) {}

  @Mutation(() => CreateUpdatePlanInfoResponse)
  async createUpdatePlanInfo(
    @Args('input') input: CreateUpdatePlanInfoInput,
  ): Promise<CreateUpdatePlanInfoResponse> {
    try {
      const { id: planInfoId, ...rest } = input;
      const planInfo = await this.prisma.subscriptionPlanInfo.upsert({
        where: { id: planInfoId || '' },
        update: {
          ...rest,
          enabled: input.enabled ?? undefined,
        },
        create: {
          ...rest,
          enabled: input.enabled ?? undefined,
        },
      });
      return {
        message: `Subscription plan info ${input.id ? 'updated' : 'created'} successfully`,
        id: planInfo.id,
      };
    } catch (error) {
      throw error;
    }
  }
}
