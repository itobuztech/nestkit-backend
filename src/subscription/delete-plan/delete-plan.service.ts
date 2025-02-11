import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAppError } from 'src/shared/create-error/create-error';
import { HttpStatus, SetMetadata, UseGuards } from '@nestjs/common';
import { appConfig } from 'src/app.config';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { DeletePlanInput } from './delete-plan-input.dto';
import { DeletePlanResponse } from './delete-plan-response.dto';
import { RoleGuard } from 'src/auth/role.guard';
import { PrivilegeGroup, PrivilegeName } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Resolver()
export class DeletePlanService {
  constructor(private readonly prisma: PrismaService) {}

  @Mutation(() => DeletePlanResponse)
  @UseGuards(RoleGuard)
  @SetMetadata('privilegeGroup', PrivilegeGroup.SUBSCRIPTION)
  @SetMetadata('privilegeName', PrivilegeName.DELETE)
  async deletePlan(@Args('deletePlanInput') deletePlanInput: DeletePlanInput): Promise<DeletePlanResponse> {
    try {
      if (deletePlanInput.fromStash) {
        await this.prisma.subscriptionPlan.delete({
          where: { id: deletePlanInput.id },
        });
      } else {
        await this.prisma.subscriptionPlan.update({
          where: { id: deletePlanInput.id, deletedAt: null },
          data: { deletedAt: new Date() },
        });
      }
      return {
        message: 'Plan deleted successfully',
        success: true,
      };
    } catch (error) {
      if (error.code === appConfig.notFoundPrismaErrorCode) {
        throw new CreateAppError({
          message: 'Plan not found',
          httpStatus: HttpStatus.NOT_FOUND,
        });
      } else if (error.code === appConfig.foreignKeyConstraintsPrismaErrorCode) {
        throw new CreateAppError({
          message: 'Cannot delete plan. Invalid Plan ID',
          httpStatus: HttpStatus.BAD_REQUEST,
        });
      }
      throw error;
    }
  }
}
