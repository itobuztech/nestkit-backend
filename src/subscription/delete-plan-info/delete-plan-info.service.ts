import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { PrismaService } from 'src/prisma/prisma.service';
import { DeletePlanInfoInput } from './delete-plan-info-input.dto';
import { CreateAppError } from 'src/shared/create-error/create-error';
import { HttpStatus, UseGuards } from '@nestjs/common';
import { appConfig } from 'src/app.config';
import { DeletePlanInfoResponse } from './delete-plan-info-response.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Resolver()
export class DeletePlanInfoService {
  constructor(private readonly prisma: PrismaService) {}

  @Mutation(() => DeletePlanInfoResponse)
  async deletePlanInfo(
    @Args('deletePlanInfoInput') deletePlanInfoInput: DeletePlanInfoInput,
  ): Promise<DeletePlanInfoResponse> {
    try {
      if (deletePlanInfoInput.fromStash) {
        await this.prisma.subscriptionPlanInfo.delete({
          where: { id: deletePlanInfoInput.id },
        });
      } else {
        await this.prisma.subscriptionPlanInfo.update({
          where: { id: deletePlanInfoInput.id, deletedAt: null },
          data: { deletedAt: new Date() },
        });
      }
      return {
        message: 'Plan info deleted successfully',
        success: true,
      };
    } catch (error) {
      if (error.code === appConfig.notFoundPrismaErrorCode) {
        throw new CreateAppError({
          message: 'Plan info not found',
          httpStatus: HttpStatus.NOT_FOUND,
        });
      } else if (
        error.code === appConfig.foreignKeyConstraintsPrismaErrorCode
      ) {
        throw new CreateAppError({
          message: 'Cannot delete plan info due to foreign key constraint',
          httpStatus: HttpStatus.BAD_REQUEST,
        });
      }
      throw error;
    }
  }
}
