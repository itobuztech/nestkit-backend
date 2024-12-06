import { appEnv } from '../../lib/app-env';
import { PrismaClient, User, UserType } from '@prisma/client';
import { GraphQlApi } from '../../lib/graphql-api';
import { default as axios } from 'axios';
import { CreateWorkspaceMutation, CreateWorkspaceMutationVariables } from '../../gql/graphql';
import { CREATE_WORKSPACE_MUTATION } from '../../graphql/create-workspace-mutation.gql';
import { faker } from '@faker-js/faker';
import FormData from 'form-data';
import fs from "fs";

const userArrays = [UserType.ADMIN, UserType.SUPER_ADMIN, UserType.USER];
userArrays.forEach((userTypeRole) => {
  describe(`Post CRUD functionalities for ${userTypeRole}`, () => {
    let user: User | null;
    const workspaceName = faker.lorem.word();
    let workspaceId: string | undefined;
    const api = new GraphQlApi();

    test(`Login as a ${userTypeRole.toUpperCase()}`, async () => {
      const dbClient = new PrismaClient();
      user = await dbClient.user.findFirst({
        where: {
          userType: UserType[userTypeRole],
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

    test('Upload media', async () => {
      const formData = new FormData();
      formData.append('file', fs.createReadStream('/src/lib/IMG_2060.jpeg'));
    
      formData.append('description', 'Example description for the media');
      const response = await axios.post(`${appEnv.API_BASE_URL}/media/upload`, formData, {
        headers: {
          ...formData.getHeaders(),
          current_workspace_id: workspaceId,
        },
      });
    
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('fileUrl');
    });
  });
});
