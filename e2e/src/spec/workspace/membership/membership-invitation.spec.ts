import { SIGN_UP_MUTATION } from '../../../graphql/sign-up-mutation.gql';
import { VERIFY_EMAIL_MUTATION } from '../../../graphql/verify-email-mutation.gql';
import { GraphQlApi } from '../../../lib/graphql-api';
import { waitForTime } from '../../../lib/wait-for-time';
import { fetchEmailsImap } from '../../../lib/fetchEmailsImap';
import { appEnv } from '../../../lib/app-env';
import { PrismaClient, User, UserType } from '@prisma/client';
import {
  AcceptInvitationMutation,
  AcceptInvitationMutationVariables,
  CreateWorkspaceMutation,
  CreateWorkspaceMutationVariables,
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

describe('Membership invitation module', () => {
  let workspaceID: string | undefined;
  const workspaceName = faker.lorem.word();
  let invitationLink: string | undefined;
  let onboardingToken: string | undefined;
  let userId: string | undefined;
  const userEmail = appEnv.IMAP_EMAIL;
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
    userId = data?.id;
    expect(data?.id).not.toBe(null);
    await waitForTime(20000);
  }, 30000);

  test('Should create a verification URL', async () => {
    invitationLink = await fetchEmailsImap('Welcome to Nest Starter Template!');
    invitationLink = invitationLink?.replace(/=/g, '').replace(/[\r\n]+/gm, '');
    onboardingToken = invitationLink?.substring(49);
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
    expect(data?.refreshToken).not.toBe(null);
  }, 9000);

  test('Login with the user', async () => {
    user = await dbClient.user.findFirst({
      where: {
        userType: UserType.ADMIN,
        isVerified: true,
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

  test('Send invitation', async () => {
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
      expect(sendInvitation.data?.sendInvitation.success).toBe(true);
    }
    await waitForTime(40000);
  }, 50000);

  test('Get the invitation link', async () => {
    invitationLink = await fetchEmailsImap('New membership invitation!');
    invitationLink = invitationLink?.replace(/=/g, '').replace(/[\r\n]+/gm, '');
    onboardingToken = invitationLink?.substring(60);
    expect(invitationLink).toContain('membership-verify');
  }, 7000);

  test('Verify invitation', async () => {
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
      expect(verifyInvitation.data?.acceptInvitation).toBe(true);
    }

    await dbUserOperations.revertDbOperations();
  });
});
