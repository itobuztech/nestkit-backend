import { PrismaClient, UserType } from '@prisma/client';
import { GraphQlApi } from '../../lib/graphql-api';
import { appEnv } from '../../lib/app-env';
// import { CREATE_USER } from '../../graphql/create-user.gql';

describe.skip('User List', () => {
  const api = new GraphQlApi();
  [UserType.SUPER_ADMIN].forEach((type) => {
    const dbClient = new PrismaClient();
    beforeAll(async () => {
      const user = await dbClient.user.findFirst({
        where: {
          userType: type,
        },
      });
      if (!user) {
        return;
      }
      await api.login({
        email: user.email,
        password: appEnv.SEED_PASSWORD,
      });
    });
  });

  test('Search new user in user list and exist', () => {});
});
