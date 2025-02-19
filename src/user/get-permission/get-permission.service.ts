import { Context, Query, Resolver } from '@nestjs/graphql';
import { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { SetMetadata, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolePrivilegeResponse } from 'src/roles/get-role/role-get-response.dto';
import { orderBy, unionBy } from 'lodash';
import { PrivilegeType, RoleType } from '@prisma/client';
import { WorkspaceMemberShipGuard } from 'src/auth/workspace-membership.guard';
import { MemberShipValidationType } from 'src/auth/membership-validation-type.enum';
import { GetUserPermissionResponse } from './get-user-permission.response.dto';

@UseGuards(JwtAuthGuard)
@Resolver()
export class GetPermissionService {
  constructor(private prisma: PrismaService) {}

  @UseGuards(WorkspaceMemberShipGuard)
  @SetMetadata('memberShipValidationType', MemberShipValidationType.MEMBERSHIP_VALIDITY)

  @Query(() => GetUserPermissionResponse)
  async getUserPermission(@Context('req') req: Request): Promise<GetUserPermissionResponse> {
   
    const ownerMembership = await this.prisma.workspaceMembership.findFirst({
      where: {
        isAccepted: true,
        isOwner: true,
        userId: req.user?.id,
        deletedAt: null,
        workspaceId: req.currentWorkspaceId
      },
    });

    let adminRole = null;

    if (ownerMembership) {
      adminRole = await this.prisma.role.findFirst({
        where: {
          type: RoleType.ADMIN,
        },
      });

    }

    const roles = await this.prisma.userRole.findMany({
      where: {
        userId: req.user?.id
      },
      include: {
        role: true
      }
    });

    const transformPrivileges: RolePrivilegeResponse[] = [];

    const privileges = await this.prisma.rolePrivilege.findMany({
      where: { roleId: {
        in: adminRole ? roles.map(role => role.roleId).concat(adminRole.id) : roles.map(role => role.roleId)
      } },
      include: { privilege: true },
    });
    

    privileges.forEach((privilege) => {
      transformPrivileges.push({
        id: privilege.privilege.id,
        name: privilege.privilege.name,
        group: privilege.privilege.group,
        type: privilege.privilege.type || PrivilegeType.BASE,
      });
    });

    const rolesResponse = roles.map(role => { 
      return {
        id: role.roleId,
        title: role.role.title
      };
    });

    return  {
      roles: adminRole ? rolesResponse.concat({
        id: adminRole.id,
        title: adminRole.title
      }) : rolesResponse,

      privilege: orderBy(unionBy(transformPrivileges,  item => `${item.group}-${item.name}`), ['group'], ['asc']),
    };
  }

}
