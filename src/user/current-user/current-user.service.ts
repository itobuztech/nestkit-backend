import { Context, Query, Resolver } from '@nestjs/graphql';
import { RoleType } from '@prisma/client';
import { UseGuards } from '@nestjs/common';
import { Request } from 'express';

import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolePrivilegeResponse } from 'src/roles/get-role/role-get-response.dto';
import { CurrentUserResponse } from './current-user.response.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@UseGuards(JwtAuthGuard)
@Resolver()
export class CurrentUserService {
  constructor(private prisma: PrismaService) {}


  @Query(() => CurrentUserResponse)
  async currentUser(@Context('req') req: Request): Promise<CurrentUserResponse> {
    
    const user = await this.prisma.user.findFirst({ 
      where: {
        id: req.jwt.userId
      },
      include: {
        session: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const ownerMembership = await this.prisma.workspaceMembership.findFirst({
      where: {
        isAccepted: true,
        isOwner: true,
        userId: user.id,
        deletedAt: null,
        workspaceId: req.currentWorkspaceId
      },
    });

    let adminRoleId = null;

    if (ownerMembership) {
      const adminRole = await this.prisma.role.findFirst({
        where: {
          type: RoleType.ADMIN,
        }
      });

      adminRoleId = adminRole?.id;
    }

    const roles = await this.prisma.userRole.findMany({
      where: {
        userId: user.id
      }
    });

    const transformPrivileges: RolePrivilegeResponse[] = [];

    const privileges = await this.prisma.rolePrivilege.findMany({
      where: { roleId: {
        in: adminRoleId ? roles.map(role => role.roleId).concat(adminRoleId) : roles.map(role => role.roleId)
      } },
      include: { privilege: true },
    });
    

    privileges.forEach((privilege) => {
      transformPrivileges.push({
        id: privilege.privilege.id,
        name: privilege.privilege.name,
        group: privilege.privilege.group,
        type: privilege.privilege.type || '',
      });
    });

    const membership = await this.prisma.workspaceMembership.findMany({
      where: {
        userId: req?.user?.id,
        isAccepted: true,
        deletedAt: null,
      },
      include: {
        workspace: true
      }
    });

    const workspace = membership.map(m => m.workspace);


    return  {
      ...user,
      sessionCount: user.session.length,
      workspace,
    };
  }

}
