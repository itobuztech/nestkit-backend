import { appEnv } from '../../lib/app-env';
import { PrismaClient, UserType } from '@prisma/client';
import { GraphQlApi } from '../../lib/graphql-api';
import { CURRENT_USER_QUERY } from '../../graphql/current-user.gql';

describe('Login module', () => {
  [UserType.SUPER_ADMIN, UserType.USER].forEach((userType) => {
    const api = new GraphQlApi();
    test(`${userType.toUpperCase()} Login`, async () => {
      const dbClient = new PrismaClient();
      const user = await dbClient.user.findFirst({
        where: {
          userType: userType,
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

    test(`${userType.toUpperCase()} Get Current User`, async () => {
      const response = await api.graphql.query({
        query: CURRENT_USER_QUERY,
      });

      expect(response.data).toBeDefined();
    });
  });
});
