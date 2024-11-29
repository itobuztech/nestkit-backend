import { PrismaClient, User, UserType } from '@prisma/client';
import { GraphQlApi } from '../../lib/graphql-api';
import { appEnv } from '../../lib/app-env';
import {
  AssignRoleMutation,
  AssignRoleMutationVariables,
  CreateRoleMutation,
  CreateRoleMutationVariables,
  CreateWorkspaceMutation,
  CreateWorkspaceMutationVariables,
  CurrentUserQuery,
  CurrentUserQueryVariables,
  GetRoleQuery,
  GetRoleQueryVariables,
  GetUsersQuery,
  GetUsersQueryVariables,
  RoleQuery,
  RoleQueryVariables,
  UnAssignRoleMutation,
  UnAssignRoleMutationVariables,
} from '../../gql/graphql';
import { USER_LIST } from '../../graphql/get-user-list.gql';
import { CURRENT_USER_QUERY } from '../../graphql/current-user.gql';
import { ASSIGN_ROLE_MUTATION } from '../../graphql/assign-role-mutation.gql';
import { UNASSIGN_ROLE_MUTATION } from '../../graphql/unassign-role-mutation.gql';
import { sample } from 'lodash';
import { GET_ROLE_QUERY } from '../../graphql/get-role-query.gql';
import { CREATE_WORKSPACE_MUTATION } from '../../graphql/create-workspace-mutation.gql';
import { faker } from '@faker-js/faker';
import { CREATE_ROLE_MUTATION } from '../../graphql/create-role-mutation.gql';
import { PRIVILEGE_LIST } from '../../graphql/privilege-list-query.gql';

[UserType.ADMIN, UserType.SUPER_ADMIN].forEach((type) => {
  describe(`Assign Role functionalities for user : ${type}`, () => {
    let dbUser: User | null;
    let user: User | null;
    let userId: string | undefined;
    let privilegeArrayForCurrentUser: string[] | undefined;
    let privilegeArrayForAllRoles: string[] | undefined;
    const api = new GraphQlApi();
    const dbClient = new PrismaClient();
    let workspaceId: string | undefined;
    const workspaceName = faker.lorem.word();
    const title = faker.lorem.word();
    let randomPrivilege:
      | {
          name: string;
          group: string;
          id: string;
          type: string;
          createdAt: string;
          updatedAt: string;
          deletedAt?: any;
        }
      | undefined;
    let randomPrivilege2:
      | {
          name: string;
          group: string;
          id: string;
          type: string;
          createdAt: string;
          updatedAt: string;
          deletedAt?: any;
        }
      | undefined;
    let createdRoleId: string | undefined;
    let createdRoleId2: string | undefined;

    test(`Login as a ${type.toUpperCase()} `, async () => {
      dbUser = await dbClient.user.findFirst({
        where: {
          userType: type,
          isVerified: true,
        },
      });
      if (!dbUser) {
        return;
      }
      const response = await api.login({
        email: dbUser.email,
        password: appEnv.SEED_PASSWORD,
      });
      expect(response.data).toBeDefined();
    });

    test('New Workspace created', async () => {
      const createWorkspace = await api.graphql.mutate<
        CreateWorkspaceMutation,
        CreateWorkspaceMutationVariables
      >({
        mutation: CREATE_WORKSPACE_MUTATION,
        variables: {
          createWorkspaceInput: {
            name: workspaceName,
          },
        },
      });

      workspaceId = createWorkspace.data?.createWorkspace.id;
      expect(createWorkspace.data?.createWorkspace.id).not.toBeNull();
    });

    test('Fetch user list and store the user ID ', async () => {
      user = await dbClient.user.findFirst({
        where: {
          userType: UserType.USER,
          isVerified: true,
        },
      });

      const userList = await api.graphql.query<
        GetUsersQuery,
        GetUsersQueryVariables
      >({
        query: USER_LIST,
        variables: {
          getUsersInput: {
            search: '',
          },
        },
      });
      expect(userList.data.getUsers.length).toBeGreaterThan(0);

      const userToBeAssigned = userList.data.getUsers.find(
        (getUser) => getUser.email === user?.email,
      );
      userId = userToBeAssigned?.id;
    });

    test(`View the list of privileges for user - ${type}`, async () => {
      const privilegeList = await api.graphql.query<
        RoleQuery,
        RoleQueryVariables
      >({
        query: PRIVILEGE_LIST,
        variables: {},
      });

      expect(
        privilegeList.data.listBasePrivilege.privilege.length,
      ).toBeGreaterThan(0);

      privilegeList.data.listBasePrivilege.privilege.forEach((privilege) => {
        expect(privilege.id).toBeDefined();
        expect(privilege.group).toBeDefined();
        expect(privilege.name).toBeDefined();
      });

      randomPrivilege = sample(privilegeList.data.listBasePrivilege.privilege);
      randomPrivilege2 = sample(privilegeList.data.listBasePrivilege.privilege);

      for (const privilege of privilegeList.data.listBasePrivilege.privilege) {
        if (
          randomPrivilege?.id === randomPrivilege2?.id &&
          randomPrivilege2?.name === 'UPDATE'
        )
          randomPrivilege2 = privilege;
        else break;
      }
    });

    test(`Create Role for first privilege${type}`, async () => {
      if (!randomPrivilege) {
        throw new Error(
          'Random privilege id not found! The privilege list fetch might have failed!',
        );
      } else {
        const createRoleResponse = await api.graphql.mutate<
          CreateRoleMutation,
          CreateRoleMutationVariables
        >({
          mutation: CREATE_ROLE_MUTATION,
          variables: {
            roleCreateInput: {
              title,
              privileges: [randomPrivilege.id],
            },
          },
          context: {
            headers: {
              current_workspace_id: workspaceId,
            },
          },
        });

        createdRoleId = createRoleResponse.data?.createRole.id;
        expect(createRoleResponse.data?.createRole.id).toBeDefined();
      }
    });

    test(`Create Role for second privilege${type}`, async () => {
      if (!randomPrivilege2) {
        throw new Error(
          'Random privilege id not found! The privilege list fetch might have failed!',
        );
      } else {
        const createRoleResponse = await api.graphql.mutate<
          CreateRoleMutation,
          CreateRoleMutationVariables
        >({
          mutation: CREATE_ROLE_MUTATION,
          variables: {
            roleCreateInput: {
              title,
              privileges: [randomPrivilege2.id],
            },
          },
          context: {
            headers: {
              current_workspace_id: workspaceId,
            },
          },
        });

        createdRoleId2 = createRoleResponse.data?.createRole.id;
        expect(createRoleResponse.data?.createRole.id).toBeDefined();
      }
    });

    test('Assign the first created role to the user', async () => {
      if (createdRoleId && userId) {
        const assignRole = await api.graphql.mutate<
          AssignRoleMutation,
          AssignRoleMutationVariables
        >({
          mutation: ASSIGN_ROLE_MUTATION,
          variables: {
            assignRoleInput: {
              roleId: createdRoleId,
              userId,
            },
          },
        });
        expect(assignRole.data?.assignRole.success).toBe(true);
      } else {
        throw new Error(
          'Role ID and User ID not found! Role list and user list might not have been fetched properly',
        );
      }
    });

    test('Assign the second created role to the user', async () => {
      if (createdRoleId2 && userId) {
        const assignRole = await api.graphql.mutate<
          AssignRoleMutation,
          AssignRoleMutationVariables
        >({
          mutation: ASSIGN_ROLE_MUTATION,
          variables: {
            assignRoleInput: {
              roleId: createdRoleId2,
              userId,
            },
          },
        });
        expect(assignRole.data?.assignRole.success).toBe(true);
      } else {
        throw new Error(
          'Role ID and User ID not found! Role list and user list might not have been fetched properly',
        );
      }
    });

    test('Login with the assigned user', async () => {
      if (user) {
        const response = await api.login({
          email: user.email,
          password: appEnv.SEED_PASSWORD,
        });
        expect(response.data).toBeDefined();
      }
    });

    test(`Fetch current user roles for user - ${type}`, async () => {
      async function currentUserInfo() {
        const currentUser = await api.graphql.query<
          CurrentUserQuery,
          CurrentUserQueryVariables
        >({
          query: CURRENT_USER_QUERY,
          variables: {},
        });

        const privileges: string[] = [];
        currentUser.data.currentUser.privilege.forEach((privilege) => {
          privileges?.push(privilege.id);
        });
        expect(currentUser.data.currentUser.userType).toBe(UserType.USER);
        expect(currentUser.data.currentUser.roles).toContain(createdRoleId);
        expect(currentUser.data.currentUser.roles).toContain(createdRoleId2);

        return privileges;
      }

      privilegeArrayForCurrentUser = await currentUserInfo();
    });

    test('Login with the user who can unassign role', async () => {
      if (dbUser) {
        const response = await api.login({
          email: dbUser.email,
          password: appEnv.SEED_PASSWORD,
        });
        expect(response.data).toBeDefined();
      }
    });

    test('Assert the multiple role privileges', async () => {
      async function fetchPrivilege() {
        const privileges: string[] = [];
        if (createdRoleId && createdRoleId2) {
          for (const role of [createdRoleId, createdRoleId2]) {
            const getRoleResponse = await api.graphql.query<
              GetRoleQuery,
              GetRoleQueryVariables
            >({
              query: GET_ROLE_QUERY,
              variables: {
                roleGetInput: {
                  id: role,
                },
              },
              context: {
                headers: {
                  current_workspace_id: workspaceId,
                },
              },
            });

            getRoleResponse.data.getRole.privilege.forEach((privilege) => {
              privileges?.push(privilege.id);
            });
          }
          return privileges;
        }
      }
      privilegeArrayForAllRoles = await fetchPrivilege();

      if (privilegeArrayForAllRoles)
        expect(privilegeArrayForCurrentUser).toEqual(
          expect.arrayContaining(privilegeArrayForAllRoles),
        );
    });

    test('Unassign role which has been created', async () => {
      if (createdRoleId && userId) {
        const unAssignRole = await api.graphql.mutate<
          UnAssignRoleMutation,
          UnAssignRoleMutationVariables
        >({
          mutation: UNASSIGN_ROLE_MUTATION,
          variables: {
            unAssignRoleInput: {
              roleId: createdRoleId,
              userId,
            },
          },
        });
        expect(unAssignRole.data?.unAssignRole.success).toBe(true);
      } else {
        throw new Error(
          'Role ID and User ID not found! Role list and user list might not have been fetched properly',
        );
      }
    });

    test('Unassign role which has been created', async () => {
      if (createdRoleId2 && userId) {
        const unAssignRole = await api.graphql.mutate<
          UnAssignRoleMutation,
          UnAssignRoleMutationVariables
        >({
          mutation: UNASSIGN_ROLE_MUTATION,
          variables: {
            unAssignRoleInput: {
              roleId: createdRoleId2,
              userId,
            },
          },
        });
        expect(unAssignRole.data?.unAssignRole.success).toBe(true);
      } else {
        throw new Error(
          'Role ID and User ID not found! Role list and user list might not have been fetched properly',
        );
      }
    });
    test('Login with the assigned user again', async () => {
      if (user) {
        const response = await api.login({
          email: user.email,
          password: appEnv.SEED_PASSWORD,
        });
        expect(response.data).toBeDefined();
      }
    });

    test(`Fetch current user roles for user - ${type}`, async () => {
      const currentUser = await api.graphql.query<
        CurrentUserQuery,
        CurrentUserQueryVariables
      >({
        query: CURRENT_USER_QUERY,
        variables: {},
      });

      expect(currentUser.data.currentUser.userType).toBe(UserType.USER);
      expect(currentUser.data.currentUser.roles).not.toContain(createdRoleId);
      expect(currentUser.data.currentUser.roles).not.toContain(createdRoleId2);
    });
  });
});
