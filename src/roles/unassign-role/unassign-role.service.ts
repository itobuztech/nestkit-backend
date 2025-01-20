import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { HttpStatus, SetMetadata, UseGuards } from '@nestjs/common';
import { Request } from 'express';

import { UnAssignRoleResponse } from './unassign-role-response.dto';
import { UnAssignRoleInput } from './unassign-role-input.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAppError } from 'src/shared/create-error/create-error';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RoleGuard } from 'src/auth/role.guard';
import { PrivilegeGroup, PrivilegeName } from '@prisma/client';
import { WorkspaceMemberShipGuard } from 'src/auth/workspace-membership.guard';
import { MemberShipValidationType } from 'src/auth/membership-validation-type.enum';

@Resolver()
@UseGuards(JwtAuthGuard)
export class UnAssignRoleService {
  constructor(private readonly prismaService: PrismaService) {}

  @Mutation(() => UnAssignRoleResponse)
  @UseGuards(RoleGuard)
  @SetMetadata('privilegeGroup', PrivilegeGroup.ROLE)
  @SetMetadata('privilegeName', PrivilegeName.UPDATE)


  @UseGuards(WorkspaceMemberShipGuard)
  @SetMetadata(
    'memberShipValidationType',
    MemberShipValidationType.MEMBERSHIP_VALIDITY,
  )
    
  async unAssignRole(
    @Args('unAssignRoleInput') assignRoleInput: UnAssignRoleInput,
    @Context('req') req: Request,
  ): Promise<UnAssignRoleResponse> {


    const userRole = await this.prismaService.userRole.findFirst({
      where: {
        userId: assignRoleInput.userId,
        roleId: assignRoleInput.roleId,
        workspaceId: req.currentWorkspaceId,
      },
    });

    if (!userRole) {
      throw new CreateAppError({
        message: 'Mentioned not assigned to the user',
        httpStatus: HttpStatus.BAD_REQUEST,
      });
    }

    await this.prismaService.userRole.delete({
      where: {
       id: userRole?.id,
      },
    });
 

    return {
      success: true,
    };
  }
}
