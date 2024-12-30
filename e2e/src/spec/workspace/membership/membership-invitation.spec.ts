import { SIGN_UP_MUTATION } from '../../../graphql/sign-up-mutation.gql';
import { VERIFY_EMAIL_MUTATION } from '../../../graphql/verify-email-mutation.gql';
import { GraphQlApi } from '../../../lib/graphql-api';
import { waitForTime } from '../../../lib/wait-for-time';
import { appEnv } from '../../../lib/app-env';
import { PrismaClient, User, UserType } from '@prisma/client';
import {
  AcceptInvitationMutation,
  AcceptInvitationMutationVariables,
  CreateWorkspaceMutation,
  CreateWorkspaceMutationVariables,
  ListWorkSpaceQuery,
  ListWorkSpaceQueryVariables,
  SendInvitationMutation,
  SendInvitationMutationVariables,
  SignupMutation,
  SignupMutationVariables,
  VerifyEmailInput,
  VerifyEmailMutation,
  VerifyEmailMutationVariables,
} from '../../../gql/graphql';
import { SEND_INVITATION_MUTATION } from '../../../graphql/send-invitation-mutation.gql';
import { VERIFY_INVITATION_MUTATION } from '../../../graphql/verify-invitation-mutation.gql';
import { CREATE_WORKSPACE_MUTATION } from '../../../graphql/create-workspace-mutation.gql';
import { faker } from '@faker-js/faker';
import { DbUserOperations } from '../../../lib/dbUserOperations';
import { LIST_WORKSPACE_QUERY } from '../../../graphql/list-workspace-query.gql';
import { fetchEmailsMailHog } from '../../../lib/fetchEmailsMailHog';

describe('Membership invitation module', () => {
  let workspaceID: string | undefined;
  const workspaceName = faker.lorem.word();
  let invitationLink: string | undefined;
  let onboardingToken: string | undefined;
  let userId: string | undefined;
  const userEmail = appEnv.IMAP_EMAIL;
  let adminEmail: string | undefined;
  const api = new GraphQlApi();
  const prisma = new PrismaClient();
  const dbUserOperations = new DbUserOperations();
  let user: User | null;
  const dbClient = new PrismaClient();

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('Add a new user', async () => {
    await dbUserOperations.checkExistingUserAndUpdate();

    const signUpData = await api.graphql.mutate<
      SignupMutation,
      SignupMutationVariables
    >({
      mutation: SIGN_UP_MUTATION,
      variables: {
        signupInput: {
          email: userEmail,
          password: appEnv.SEED_PASSWORD,
        },
      },
    });

    const data = signUpData.data?.signup;
    console.log(signUpData);
    userId = data?.id;
    expect(data?.id).not.toBe(null);
    await waitForTime(60000);
  }, 80000);

  test('Should create a verification URL', async () => {
    invitationLink = await fetchEmailsMailHog('Welcome');
    invitationLink = invitationLink?.replace(/=/g, '').replace(/[\r\n]+/gm, '');
    onboardingToken = invitationLink?.substring(46);
    console.log(invitationLink, onboardingToken);
    expect(invitationLink).toContain('verify-email');
  }, 9000);

  test('Verify the email with onboarding token', async () => {
    const verifyEmailData = await api.graphql.mutate<
      VerifyEmailMutation,
      VerifyEmailMutationVariables
    >({
      mutation: VERIFY_EMAIL_MUTATION,
      variables: {
        verifyEmailInput: {
          token: onboardingToken,
        } as VerifyEmailInput,
      },
    });
    const data = verifyEmailData.data?.verifyEmail;
    console.log(verifyEmailData);
    expect(data?.refreshToken).not.toBe(null);
  }, 9000);

  test('Login with the admin', async () => {
    user = await dbClient.user.findFirst({
      where: {
        userType: UserType.ADMIN,
        isVerified: true,
      },
    });
    if (user) {
      adminEmail = user.email;
      const response = await api.login({
        email: user.email,
        password: appEnv.SEED_PASSWORD,
      });
      console.log(response);
      expect(response.data).toBeDefined();
    }
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
    console.log(createWorkspace);
    workspaceID = createWorkspace.data?.createWorkspace.id;
    expect(createWorkspace.data?.createWorkspace.id).not.toBeNull();
  });

  test('Send invitation to the user', async () => {
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
      console.log(sendInvitation);
      expect(sendInvitation.data?.sendInvitation.success).toBe(true);
    }
    await waitForTime(65000);
  }, 80000);

  test('Get the invitation link', async () => {
    invitationLink = await fetchEmailsMailHog('Membership Invitation');
    invitationLink = invitationLink?.replace(/=/g, '').replace(/[\r\n]+/gm, '');
    onboardingToken = invitationLink?.substring(51);
    console.log(invitationLink, onboardingToken);
    expect(invitationLink).toContain('membership-verify');
  }, 7000);

  test('Verify and deny the invitation', async () => {
    if (userId && workspaceID) {
      const verifyInvitation = await api.graphql.mutate<
        AcceptInvitationMutation,
        AcceptInvitationMutationVariables
      >({
        mutation: VERIFY_INVITATION_MUTATION,
        variables: {
          acceptInvitationInput: {
            token: onboardingToken as string,
            accept: false,
          },
        },
      });
      console.log(verifyInvitation);
      expect(verifyInvitation.data?.acceptInvitation).toBe(true);
    }
  });

  test(`Login as the assigned user`, async () => {
    const response = await api.login({
      email: userEmail,
      password: appEnv.SEED_PASSWORD,
    });
    console.log(response);
    expect(response.data).toBeDefined();
  });

  test(' View the List of Workspace and the user should not be able to view the workspace', async () => {
    const listWorkspace = await api.graphql.query<
      ListWorkSpaceQuery,
      ListWorkSpaceQueryVariables
    >({
      query: LIST_WORKSPACE_QUERY,
    });
    console.log(listWorkspace);

    const addedWorkspace = listWorkspace.data.listWorkSpace.workspace.find(
      (workspace) => workspace.id === workspaceID,
    );

    expect(addedWorkspace).toBe(undefined);
  });

  test(`Login as a ${UserType.ADMIN}`, async () => {
    if (adminEmail) {
      const response = await api.login({
        email: adminEmail,
        password: appEnv.SEED_PASSWORD,
      });

      expect(response.data).toBeDefined();
    }
  });

  test('Send invitation again', async () => {
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
      console.log(sendInvitation);
      expect(sendInvitation.data?.sendInvitation.success).toBe(true);
    }
    await waitForTime(65000);
  }, 80000);

  test('Get the invitation link', async () => {
    invitationLink = await fetchEmailsMailHog('Membership Invitation');
    invitationLink = invitationLink?.replace(/=/g, '').replace(/[\r\n]+/gm, '');
    onboardingToken = invitationLink?.substring(51);
    console.log(invitationLink, onboardingToken);
    expect(invitationLink).toContain('membership-verify');
  });

  test('Verify and accept invitation', async () => {
    if (userId && workspaceID) {
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
      console.log(verifyInvitation);
      expect(verifyInvitation.data?.acceptInvitation).toBe(true);
    }
  });

  test(`Login as the assigned user`, async () => {
    const response = await api.login({
      email: userEmail,
      password: appEnv.SEED_PASSWORD,
    });

    expect(response.data).toBeDefined();
  });

  //This test has an issue - NST-77
  test(' View the List of Workspace and the user should be able to view the workspace', async () => {
    const listWorkspace = await api.graphql.query<
      ListWorkSpaceQuery,
      ListWorkSpaceQueryVariables
    >({
      query: LIST_WORKSPACE_QUERY,
    });

    const addedWorkspace = listWorkspace.data.listWorkSpace.workspace.find(
      (workspace) => workspace.id === workspaceID,
    );

    expect(addedWorkspace?.name).toBe(workspaceName);
    await dbUserOperations.revertDbOperations();
  });
});
