import { GraphQlApi } from '../../lib/graphql-api';
import { waitForTime } from '../../lib/wait-for-time';
import { appEnv } from '../../lib/app-env';
import { REQUEST_PASSWORD_RESET_MUTATION } from '../../graphql/request-password-reset-mutation.gql';
import { PASSWORD_RESET_MUTATION } from '../../graphql/password-reset-mutation.gql';
import { PrismaClient } from '@prisma/client';

import {
  PasswordResetInput,
  RequestPasswordResetMutation,
  RequestPasswordResetMutationVariables,
  ResetPasswordMutation,
  ResetPasswordMutationVariables,
} from '../../gql/graphql';
import { faker } from '@faker-js/faker';
import { fetchEmailsMailHog } from '../../lib/fetchEmailsMailHog';

describe('Password Reset', () => {
  let invitationLink: string | undefined;
  let onboardingToken: string | undefined;
  const api = new GraphQlApi();
  const dbClient = new PrismaClient();
  let userEmail: string;

  test('Should send a password reset email to the user', async () => {
    const user = await dbClient.user.findFirst({
      where: {
        isVerified: true,
      },
    });

    if (!user) {
      return;
    }

    userEmail = user.email;

    const passwordResetResponse = await api.graphql.mutate<
      RequestPasswordResetMutation,
      RequestPasswordResetMutationVariables
    >({
      mutation: REQUEST_PASSWORD_RESET_MUTATION,
      variables: {
        passwordReset: {
          email: userEmail,
        },
      },
    });

    expect(passwordResetResponse.data?.requestPasswordReset.message).toBe(
      'Password reset email sent',
    );

    await waitForTime(30000);
  }, 50000);

  // @Soumabha Use MAILHOG FOR TESTING
  test.skip('Should not return an error if the email is not registered', async () => {
    // const requestRandomUserPasswordReset = await api.graphql.mutate<
    //   RequestPasswordResetMutation,
    //   RequestPasswordResetMutationVariables
    // >({
    //   mutation: REQUEST_PASSWORD_RESET_MUTATION,
    //   variables: {
    //     passwordReset: {
    //       email: `${crypto.randomUUID()}@${appEnv.TESTINATOR_TEAM_ID}`,
    //     },
    //   },
    // });

    // expect(
    //   requestRandomUserPasswordReset.data?.requestPasswordReset.message,
    // ).toBe('Password reset email sent');
  });

  // @Soumabha Use MAILHOG FOR TESTING but use ENV variables
  test('Fetch emails from the inbox and extract the invitation link', async () => {
    invitationLink = await fetchEmailsMailHog('Password Reset Request');
    if (invitationLink) {
      invitationLink = invitationLink
        ?.replace(/=/g, '')
        .replace(/[\r\n]+/gm, '');
      onboardingToken = invitationLink?.replace(
        `${appEnv.FRONTEND_BASE_URL}/password-reset?token&#x3D;`,
        '',
      );

      expect(invitationLink).toContain('password-reset');
    }
  }, 10000);

  test('Should reset the password when provided with a valid token', async () => {
    if (onboardingToken) {
      api.setToken(onboardingToken);
    } else {
      return;
    }

    const resetPasswordMessage = await api.graphql.mutate<
      ResetPasswordMutation,
      ResetPasswordMutationVariables
    >({
      mutation: PASSWORD_RESET_MUTATION,
      variables: {
        resetPassword: {
          password: appEnv.SEED_PASSWORD,
        } as PasswordResetInput,
      },
    });

    expect(resetPasswordMessage.data?.resetPassword.message).toBe(
      'Password reset successful',
    );
  });

  test('Should return an error if the token is invalid or expired', async () => {
    api.setToken(faker.lorem.word());
    const response = await api.graphql.mutate<
      ResetPasswordMutation,
      ResetPasswordMutationVariables
    >({
      mutation: PASSWORD_RESET_MUTATION,
      variables: {
        resetPassword: {
          password: appEnv.SEED_PASSWORD,
        } as PasswordResetInput,
      },
    });
    expect(response.errors?.[0].message).toBe('jwt malformed');
  });

  test('Login with the user', async () => {
    const response = await api.login({
      email: userEmail,
      password: appEnv.SEED_PASSWORD,
    });
    expect(response.data).toBeDefined();
  });

  test('Should return an error if the new password does not meet criteria', async () => {
    // Not implemented in backend yet
  });
});
