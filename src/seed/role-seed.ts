import {
  Prisma,
  PrismaClient,
  PrivilegeGroup,
  PrivilegeName,
  PrivilegeType,
  RoleType,
} from '@prisma/client';

const prismaClient = new PrismaClient();

export async function roleSeed() {
  // Delete all privilege and roles
  await prismaClient.privilege.deleteMany();
  await prismaClient.role.deleteMany();

  // create privileges data
  const privilegeData: Prisma.PrivilegeCreateManyInput | Prisma.PrivilegeCreateManyInput[] = [];
  const models = [PrivilegeGroup.POST, PrivilegeGroup.USER, PrivilegeGroup.ROLE, PrivilegeGroup.WORKSPACE, PrivilegeGroup.MEMBERSHIP, PrivilegeGroup.MEDIA];
  models.forEach((model) => {
    [PrivilegeName.CREATE, PrivilegeName.DELETE, PrivilegeName.UPDATE, PrivilegeName.READ].forEach((name) => {
      privilegeData.push({
        name,
        group: model,
        type: PrivilegeType.BASE,
      });
    });
  });

  // Create privileges
  await prismaClient.privilege.createMany({
    data: privilegeData,
  });

  // Create roles
  const rolesData: Prisma.RoleCreateManyInput | Prisma.RoleCreateManyInput[] = [];
 
  rolesData.push({
    type: RoleType.SUPER_ADMIN,
    title: "Super Admin Role",
  });
  rolesData.push({
    type: RoleType.ADMIN,
    title: "Workspace Admin Role",
  });
  rolesData.push({
    type: RoleType.USER,
    title: "User Role",
  });
  
  await prismaClient.role.createMany({
    data: rolesData
  });

  //  find base privileges
  const superAdminPrivileges = await prismaClient.privilege.findMany({
    where: {
      type: PrivilegeType.BASE,
    },
  });


  // find super admin role
  const superAdminRole = await prismaClient.role.findFirst({
    where: {
      type: RoleType.SUPER_ADMIN,
    },
  });
  
  if (superAdminRole) {
    // Attach all privileges to super admin role
    await prismaClient.rolePrivilege.createMany({
      data: superAdminPrivileges.map((privilege) => ({
        roleId: superAdminRole.id,
        privilegeId: privilege.id,
      })),
    });
  }


  // find admin role
  const adminRole = await prismaClient.role.findFirst({
    where: {
      type: RoleType.ADMIN,
    },
  });
  

  const adminRolePrivileges = await prismaClient.privilege.findMany({
    where: {
      type: PrivilegeType.BASE,
      group: {
        notIn: [PrivilegeGroup.SUBSCRIPTION],
      },
      NOT: {
        OR: [
          { name: PrivilegeName.CREATE },
          { name: PrivilegeName.UPDATE },
          { name: PrivilegeName.DELETE },
        ]
      }
    },
  });

  if (adminRole) {
    // Attach all privileges to admin role
    await prismaClient.rolePrivilege.createMany({
      data: adminRolePrivileges.map((privilege) => ({
        roleId: adminRole.id,
        privilegeId: privilege.id,
      })),
    });
  }


  const userRolePrivileges = await prismaClient.privilege.findMany({
    where: {
      type: PrivilegeType.BASE,
      group: {
        in: [PrivilegeGroup.POST, PrivilegeGroup.USER],
      },
      name: {
        in: [PrivilegeName.READ],
      }
    },
  });

  const memberShipAndWorkspacePrivileges = await prismaClient.privilege.findMany({
    where: {
      type: PrivilegeType.BASE,
      group: {
        in: [PrivilegeGroup.WORKSPACE, PrivilegeGroup.MEMBERSHIP],
      },
    },
  });

 

  // find user role
  const userRole = await prismaClient.role.findFirst({
    where: {
      type: RoleType.USER,
    },
  });
  

  if (userRole) {
    const memberShipAndWorkspacePrivilegesIds = memberShipAndWorkspacePrivileges.map((privilege) => ({
      roleId: userRole.id,
      privilegeId: privilege.id,
    }));

    const otherPrivilegesIds = userRolePrivileges.map((privilege) => ({
      roleId: userRole.id,
      privilegeId: privilege.id,
    }));

    // Attach all privileges to admin role
    await prismaClient.rolePrivilege.createMany({
      data: otherPrivilegesIds.concat(memberShipAndWorkspacePrivilegesIds),
    });
  }

}
