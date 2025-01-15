import { HttpStatus, SetMetadata, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { PrivilegeGroup, PrivilegeName, RoleType, UserType } from '@prisma/client';

import { RoleUpdateResponse } from './role-update-response.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { RoleUpdateInput } from './role-update-input.dto';
import { RoleGuard } from 'src/auth/role.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CreateAppError } from 'src/shared/create-error/create-error';
import { WorkspaceMemberShipGuard } from 'src/auth/workspace-membership.guard';
import { MemberShipValidationType } from 'src/auth/membership-validation-type.enum';

@UseGuards(JwtAuthGuard)
@Resolver()
export class RoleUpdateService {
  constructor(private prisma: PrismaService) {}

  @Mutation(() => RoleUpdateResponse)
  @UseGuards(RoleGuard)
  @SetMetadata('privilegeGroup', PrivilegeGroup.ROLE)
  @SetMetadata('privilegeName', PrivilegeName.UPDATE)

  @UseGuards(WorkspaceMemberShipGuard)
  @SetMetadata('memberShipValidationType', MemberShipValidationType.MEMBERSHIP_VALIDITY)

  async updateRole(
    @Args('roleUpdateInput') roleUpdateInput: RoleUpdateInput,
    @Context('req') req: Request,
  ): Promise<RoleUpdateResponse> {
    const role = await this.prisma.role.findFirst({
      where: {
        id: roleUpdateInput.id,
      },
    });

    if (!role) {
      throw new CreateAppError({
        message: 'Role not found',
        httpStatus: HttpStatus.NOT_FOUND,
      });
    }

    if (req.user?.userType === UserType.SUPER_ADMIN && role.type === RoleType.SUPER_ADMIN) {
      throw new CreateAppError({ message: 'This is highest level role and can not be modified' });
    }

    if (req.user?.userType !== UserType.SUPER_ADMIN && role?.type !== RoleType.CUSTOM) {
      throw new CreateAppError({ message: 'Global role can be modified by only super admin' });
    }

    const updatedRole = await this.prisma.role.update({
      where: {
        id: roleUpdateInput.id,
      },
      data: {
        title: roleUpdateInput.title,
        description: roleUpdateInput.description,
      },
    });

    // assign base privileges to the role

    await this.prisma.rolePrivilege.createMany({
      data: roleUpdateInput.createPrivileges.map((privilege) => ({
        roleId: updatedRole.id,
        privilegeId: privilege,
      })),
    });

    // remove privileges from the role
    await this.prisma.rolePrivilege.deleteMany({
      where: {
        roleId: updatedRole.id,
        privilegeId: {
          in: roleUpdateInput.removePrivileges,
        },
      },
    });

    return updatedRole;
  }
}
