import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { SetMetadata, UseGuards } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RoleGuard } from 'src/auth/role.guard';
import { Prisma, PrivilegeGroup, PrivilegeName } from '@prisma/client';
import { WorkspaceMemberShipGuard } from 'src/auth/workspace-membership.guard';
import { MemberShipValidationType } from 'src/auth/membership-validation-type.enum';
import { paginationInputTransformer } from 'src/shared/base-list/base-list-input-transform';
import { GetUserForAssignInput } from './get-available-user-for-assign-input.dto';
import { GetUserForAssignResponse } from './get-available-user-for-assign-response.dto';

@Resolver()
@UseGuards(JwtAuthGuard)
export class GetUserForAssignService {
  constructor(private readonly prismaService: PrismaService) {}

  @Mutation(() => GetUserForAssignResponse)
  @UseGuards(RoleGuard)
  @SetMetadata('privilegeGroup', PrivilegeGroup.ROLE)
  @SetMetadata('privilegeName', PrivilegeName.UPDATE)

  @UseGuards(WorkspaceMemberShipGuard)
  @SetMetadata(
    'memberShipValidationType',
    MemberShipValidationType.MEMBERSHIP_VALIDITY,
  )
  async getUsersForAssign(
    @Args('assignRoleUserInput') assignRoleUserInput: GetUserForAssignInput,
  ): Promise<GetUserForAssignResponse> {
    // Get Users which is not assigned Yet 

    const queryObject: Prisma.UserWhereInput = {
      name: {
        contains: assignRoleUserInput.search,
        mode: 'insensitive',
      },
      // Ensure user doesn't already have this role
      roles: {
        none: {
          roleId: assignRoleUserInput.roleId,
          deletedAt: null,
        }
      }
    };

    const userCount = await this.prismaService.user.count({
      where: queryObject,
    });

    const paginationMeta = paginationInputTransformer({
      page: assignRoleUserInput?.page,
      pageSize: assignRoleUserInput?.pageSize,
      totalRowCount: userCount,
    });


    const user = await this.prismaService.user.findMany({
      where: queryObject,
      skip: paginationMeta.skip,
      take: paginationMeta.perPage,
    });
   
    const users = user.map((role) => {
      return {
        id: role.id,
        name: role.name || '',
        email: role.email
      }
    });

    return {
      users,
      pagination: {
        currentPage: paginationMeta.page,
        totalPage: paginationMeta.totalPage,
        perPage: paginationMeta.perPage,
        totalRows: userCount,
      },
    };
  }
}
