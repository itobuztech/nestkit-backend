import { appEnv } from '../../lib/app-env';
import { PrismaClient, User, UserType } from '@prisma/client';
import { GraphQlApi } from '../../lib/graphql-api';
import { CreateWorkspaceMutation, CreateWorkspaceMutationVariables, FileQuery, FileQueryVariables, LoginQuery } from '../../gql/graphql';
import { CREATE_WORKSPACE_MUTATION } from '../../graphql/create-workspace-mutation.gql';
import { faker } from '@faker-js/faker';
import FormData from 'form-data';
import fs from "fs";
import path from 'path';
import { UploadFile } from '../../../interface/upload-media-interface';
import axios from 'axios';
import { ApolloQueryResult } from '@apollo/client';
import { FILE_LIST_QUERY } from '../../graphql/list-file-query.gql';


const userArrays = [UserType.SUPER_ADMIN];
userArrays.forEach((userTypeRole) => {
  describe(`File upload functionalities for ${userTypeRole}`, () => {
    let user: User | null;
    const workspaceName = faker.lorem.word();
    let workspaceId: string | undefined;
    const api = new GraphQlApi();
    let loginResponse: ApolloQueryResult<LoginQuery>;

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
      loginResponse = await api.login({
        email: user.email,
        password: appEnv.SEED_PASSWORD,
      });
      expect(loginResponse.data).toBeDefined();
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
      const imagePath = path.join(process.cwd(), "src/images/IMG_2060.jpeg");
      formData.append('file', fs.createReadStream(imagePath));
      
     try {
      const uploadFileResponse = await axios.post(`${appEnv.API_BASE_URL}/media/upload`, formData, {
        headers: {
          ...formData.getHeaders(),
          current_workspace_id: workspaceId,
          Authorization: `Bearer ${loginResponse.data.login.token}`
        },
      });
      const fileResponse: UploadFile = uploadFileResponse.data;
      console.log(fileResponse);    
      expect(fileResponse.id).toBeDefined();
     } catch (err) {
      console.error(err);
     }
    });

    test('List of media file', async () => {
              const fileList = await api.graphql.query<
              FileQuery,
              FileQueryVariables
              >({
                query: FILE_LIST_QUERY,
    
                context: {
                  headers: {
                    current_workspace_id: workspaceId,
                    Authorization: `Bearer ${loginResponse.data.login.token}`
                  },
                },
              });
      
              expect(fileList.data.listMedia.file).toBeDefined();
              expect(fileList.data.listMedia.file[0].id).not.toHaveLength(0);
          });
    });
    
  });