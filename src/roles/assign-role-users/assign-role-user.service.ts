import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { SetMetadata, UseGuards } from '@nestjs/common';

import { AssignRoleUserResponse } from './assign-role-user-response.dto';
import { AssignRoleUserInput } from './assign-role-user-input.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RoleGuard } from 'src/auth/role.guard';
import { Prisma, PrivilegeGroup, PrivilegeName } from '@prisma/client';
import { WorkspaceMemberShipGuard } from 'src/auth/workspace-membership.guard';
import { MemberShipValidationType } from 'src/auth/membership-validation-type.enum';
import { paginationInputTransformer } from 'src/shared/base-list/base-list-input-transform';

@Resolver()
@UseGuards(JwtAuthGuard)
export class AssignRoleUserService {
  constructor(private readonly prismaService: PrismaService) {}

  @Mutation(() => AssignRoleUserResponse)
  @UseGuards(RoleGuard)
  @SetMetadata('privilegeGroup', PrivilegeGroup.ROLE)
  @SetMetadata('privilegeName', PrivilegeName.UPDATE)
  @UseGuards(WorkspaceMemberShipGuard)
  @SetMetadata(
    'memberShipValidationType',
    MemberShipValidationType.MEMBERSHIP_VALIDITY,
  )
  async getAssignUsers(
    @Args('assignRoleUserInput') assignRoleUserInput: AssignRoleUserInput,
  ): Promise<AssignRoleUserResponse> {
    const queryObject: Prisma.UserRoleWhereInput = {
      roleId: assignRoleUserInput.roleId,
      deletedAt: null,
      user: {
        name: {
          contains: assignRoleUserInput.search,
          mode: 'insensitive', 
        },
      },
    };

    const postCount = await this.prismaService.userRole.count({
      where: queryObject,
    });

    const paginationMeta = paginationInputTransformer({
      page: assignRoleUserInput?.page,
      pageSize: assignRoleUserInput?.pageSize,
      totalRowCount: postCount,
    });


    const userRole = await this.prismaService.userRole.findMany({
      where: queryObject,
      skip: paginationMeta.skip,
      take: paginationMeta.perPage,
      include: {
        user: true,
      },
    });
   
    const users = userRole.map((role) => {
      return {
        id: role.user.id,
        name: role.user.name || '',
        email: role.user.email
      }
    });

    return {
      users,
      pagination: {
        currentPage: paginationMeta.page,
        totalPage: paginationMeta.totalPage,
        perPage: paginationMeta.perPage,
        totalRows: postCount,
      },
    };
  }
}
