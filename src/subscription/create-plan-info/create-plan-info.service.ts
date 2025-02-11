import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePlanInfoInput } from './create-plan-info-input.dto';
import { CreatePlanInfoResponse } from './create-plan-info-response.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Resolver()
export class CreatePlanInfoService {
  constructor(private readonly prisma: PrismaService) {}

  @Mutation(() => CreatePlanInfoResponse)
  async createPlanInfo(@Args('input') input: CreatePlanInfoInput): Promise<CreatePlanInfoResponse> {
    try {
      const planInfo = await this.prisma.subscriptionPlanInfo.create({
        data: {
          ...input,
          enabled: input.enabled ?? undefined,
        },
      });
      return {
        message: `Subscription plan info created successfully`,
        id: planInfo.id,
      };
    } catch (error) {
      throw error;
    }
  }
}
