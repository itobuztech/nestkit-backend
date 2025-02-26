import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePlanInfoInput } from './create-plan-info-input.dto';
import { CreatePlanInfoResponse } from './create-plan-info-response.dto';
import { SetMetadata, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RoleGuard } from 'src/auth/role.guard';
import { PrivilegeGroup, PrivilegeName } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Resolver()
export class CreatePlanInfoService {
  constructor(private readonly prisma: PrismaService) {}

  @Mutation(() => CreatePlanInfoResponse)
  @UseGuards(RoleGuard)
  @SetMetadata('privilegeGroup', PrivilegeGroup.SUBSCRIPTION)
  @SetMetadata('privilegeName', PrivilegeName.CREATE)
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
