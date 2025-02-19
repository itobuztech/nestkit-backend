import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdatePlanInfoInput } from './update-plan-info-input.dto';
import { UpdatePlanInfoResponse } from './update-plan-info-response.dto';
import { HttpStatus, SetMetadata, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { appConfig } from 'src/app.config';
import { CreateAppError } from 'src/shared/create-error/create-error';
import { RoleGuard } from 'src/auth/role.guard';
import { PrivilegeGroup, PrivilegeName } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Resolver()
export class UpdatePlanInfoService {
  constructor(private readonly prisma: PrismaService) {}

  @Mutation(() => UpdatePlanInfoResponse)
  @UseGuards(RoleGuard)
  @SetMetadata('privilegeGroup', PrivilegeGroup.SUBSCRIPTION)
  @SetMetadata('privilegeName', PrivilegeName.UPDATE)
  async updatePlanInfo(@Args('input') input: UpdatePlanInfoInput): Promise<UpdatePlanInfoResponse> {
    try {
      const { id: planInfoId, ...rest } = input;
      const planInfo = await this.prisma.subscriptionPlanInfo.update({
        where: { id: planInfoId || '' },
        data: {
          ...rest,
          enabled: input.enabled ?? undefined,
        },
      });
      return {
        message: `Subscription plan info updated successfully`,
        id: planInfo.id,
      };
    } catch (error) {
      if (error.code === appConfig.notFoundPrismaErrorCode) {
        throw new CreateAppError({
          message: 'Plan info not found',
          httpStatus: HttpStatus.NOT_FOUND,
        });
      }
      throw error;
    }
  }
}
