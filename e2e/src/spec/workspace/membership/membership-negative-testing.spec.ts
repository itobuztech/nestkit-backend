import { GraphQlApi } from '../../../lib/graphql-api';
import { appEnv } from '../../../lib/app-env';
import { PrismaClient, User, UserType } from '@prisma/client';
import {
  AcceptInvitationMutation,
  AcceptInvitationMutationVariables,
  CreateWorkspaceMutation,
  CreateWorkspaceMutationVariables,
  GetUsersQuery,
  GetUsersQueryVariables,
  ListWorkSpaceQuery,
  ListWorkSpaceQueryVariables,
  SendInvitationMutation,
  SendInvitationMutationVariables,
} from '../../../gql/graphql';
import { LIST_WORKSPACE_QUERY } from '../../../graphql/list-workspace-query.gql';
import { SEND_INVITATION_MUTATION } from '../../../graphql/send-invitation-mutation.gql';
import { VERIFY_INVITATION_MUTATION } from '../../../graphql/verify-invitation-mutation.gql';
import { USER_LIST } from '../../../graphql/get-user-list.gql';
import { sample } from 'lodash';
import { faker } from '@faker-js/faker';
import { CREATE_WORKSPACE_MUTATION } from '../../../graphql/create-workspace-mutation.gql';

describe('Membership invitation module', () => {
  let workspaceID: string | undefined;
  const onboardingToken: string =
    '$2b$10$u0wMXxOHe1mJEy2S18zgU.z73msGf9FVaep46wG2vZYFy3WJLWiKu';
  let user: User | null;
  let userId: string | undefined;
  const api = new GraphQlApi();
  const prisma = new PrismaClient();
  const dbClient = new PrismaClient();
  const workspaceName = faker.lorem.word();

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test(`Login as a Admin`, async () => {
    user = await dbClient.user.findFirst({
      where: {
        userType: UserType.ADMIN,
        isVerified: true,
      },
    });

    if (!user) {
      return;
    }

    const response = await api.login({
      email: user.email,
      password: appEnv.SEED_PASSWORD,
    });

    expect(response.data).toBeDefined();
  });

  test(`Get user list and fetch a random user id Admin`, async () => {
    const userList = await api.graphql.query<
      GetUsersQuery,
      GetUsersQueryVariables
    >({
      query: USER_LIST,
    });
    userId = sample(userList.data.getUsers)?.id;
    expect(userList.data.getUsers.length).not.toBe(0);
  });

  test(`Send invitation with a user Id who is already in the workspace Admin`, async () => {
    const workspace = await dbClient.workspaceMembership.findFirst({
      where: {
        userId: userId,
      },
    });
    workspaceID = workspace?.workspaceId;
    if (workspaceID && userId) {
      const sendInvitation = await api.graphql.mutate<
        SendInvitationMutation,
        SendInvitationMutationVariables
      >({
        mutation: SEND_INVITATION_MUTATION,
        variables: {
          sendInvitationInput: {
            userId: userId,
            workspaceId: workspaceID,
          },
        },
      });
      if (!sendInvitation.errors) {
        throw new Error('Expected an error, but none was returned');
      }
      expect(sendInvitation.errors[0].message).toContain(
        'User already a member of this workspace',
      );
    }
  });

  test(`Send invitation with a workspace which is not available for the logged in user`, async () => {
    const excludedWorkspaceIds = await dbClient.workspaceMembership.findMany({
      where: { userId: userId },
      select: { workspaceId: true },
    });

    const workspace = await dbClient.workspaceMembership.findFirst({
      where: {
        workspaceId: {
          notIn: excludedWorkspaceIds.map((wm) => wm.workspaceId),
        },
      },
    });

    workspaceID = workspace?.workspaceId;
    if (userId && workspaceID) {
      const sendInvitation = await api.graphql.mutate<
        SendInvitationMutation,
        SendInvitationMutationVariables
      >({
        mutation: SEND_INVITATION_MUTATION,
        variables: {
          sendInvitationInput: {
            userId: userId,
            workspaceId: workspaceID,
          },
        },
      });
      if (!sendInvitation.errors) {
        throw new Error('Expected an error, but none was returned');
      }
      expect(sendInvitation.errors[0].message).toContain(
        'Membership not available for this workspace',
      );
    }
  });

  test(`Verify invitation Admin`, async () => {
    const verifyInvitation = await api.graphql.mutate<
      AcceptInvitationMutation,
      AcceptInvitationMutationVariables
    >({
      mutation: VERIFY_INVITATION_MUTATION,
      variables: {
        acceptInvitationInput: {
          token: onboardingToken as string,
          accept: true,
        },
      },
    });
    if (!verifyInvitation.errors) {
      throw new Error('Expected an error, but none was returned');
    }
    expect(verifyInvitation.errors[0].message).toContain(
      'Invalid invitation token!',
    );
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

    workspaceID = createWorkspace.data?.createWorkspace.id;
    expect(createWorkspace.data?.createWorkspace.id).not.toBeNull();
  });

  test(`Send invitation to a user `, async () => {
    if (workspaceID && userId) {
      const sendInvitation = await api.graphql.mutate<
        SendInvitationMutation,
        SendInvitationMutationVariables
      >({
        mutation: SEND_INVITATION_MUTATION,
        variables: {
          sendInvitationInput: {
            userId: userId,
            workspaceId: workspaceID,
          },
        },
      });

      expect(sendInvitation.data?.sendInvitation.success).toBe(true);
    }
  });

  test(`Login as the user who has been invited`, async () => {
    user = await dbClient.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (user) {
      const response = await api.login({
        email: user.email,
        password: appEnv.SEED_PASSWORD,
      });
      expect(response.data).toBeDefined();
    }
  });

  test('Check whether the user can access the workspace', async () => {
    if (workspaceID) {
      const listWorkspace = await api.graphql.query<
        ListWorkSpaceQuery,
        ListWorkSpaceQueryVariables
      >({
        query: LIST_WORKSPACE_QUERY,
      });

      const addedWorkspace = listWorkspace.data.listWorkSpace.workspace.find(
        (workspace) => workspace.id === workspaceID,
      );

      expect(addedWorkspace).toBe(undefined);
    }
  });
});
