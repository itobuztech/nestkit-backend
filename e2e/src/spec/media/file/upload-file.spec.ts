import { appEnv } from '../../../lib/app-env';
import { PrismaClient, User, UserType } from '@prisma/client';
import { GraphQlApi } from '../../../lib/graphql-api';
import {
  CreateWorkspaceMutation,
  CreateWorkspaceMutationVariables,
  DeleteFileMutation,
  DeleteFileMutationVariables,
  FileQuery,
  FileQueryVariables,
  LoginQuery,
  QueryQuery,
  QueryQueryVariables,
  ResizeFileMutation,
  ResizeFileMutationVariables,
} from '../../../gql/graphql';
import { CREATE_WORKSPACE_MUTATION } from '../../../graphql/create-workspace-mutation.gql';
import { faker } from '@faker-js/faker';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { UploadFile } from '../../../../interface/upload-media-interface';
import axios from 'axios';
import { ApolloQueryResult } from '@apollo/client';
import { FILE_LIST_QUERY } from '../../../graphql/list-file-query.gql';
import { GET_FILE_QUERY } from '../../../graphql/get-file-query.gql';
import { RESIZE_MEDIA_MUTATION } from '../../../graphql/resize-media-mutation.gql';
import { DELETE_MEDIA_MUTATION } from '../../../graphql/delete-media-mutation.gql';

describe(`File upload functionalities for ${UserType.SUPER_ADMIN}`, () => {
  let user: User | null;
  const workspaceName = faker.lorem.word();
  let workspaceId: string | undefined;
  const api = new GraphQlApi();
  let loginResponse: ApolloQueryResult<LoginQuery>;
  let fileId: any;
  let fileName: string | undefined;
  let resizeFileId: string | undefined;

  test(`Login as a ${UserType.SUPER_ADMIN.toUpperCase()}`, async () => {
    const dbClient = new PrismaClient();
    user = await dbClient.user.findFirst({
      where: {
        userType: UserType.SUPER_ADMIN,
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
    const imagePath = path.join(process.cwd(), 'src/images/IMG_2060.jpeg');
    formData.append('file', fs.createReadStream(imagePath));

    try {
      const uploadFileResponse = await axios.post(
        `${appEnv.API_BASE_URL}/media/upload`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            current_workspace_id: workspaceId,
            Authorization: `Bearer ${loginResponse.data.login.token}`,
          },
        },
      );
      const fileResponse: UploadFile = uploadFileResponse.data;
      console.log(fileResponse);
      fileId = fileResponse.id;
      fileName = fileResponse.name;
      console.log(fileId);
      expect(fileResponse.id).toBeDefined();
    } catch (err) {
      console.error(err);
    }
  });

  test('List of media file', async () => {
    const fileList = await api.graphql.query<FileQuery, FileQueryVariables>({
      query: FILE_LIST_QUERY,

      context: {
        headers: {
          current_workspace_id: workspaceId,
          Authorization: `Bearer ${loginResponse.data.login.token}`,
        },
      },
    });

    expect(fileList.data.listMedia.file).toBeDefined();
    expect(fileList.data.listMedia.file[0].id).not.toHaveLength(0);
    expect(fileList.data.listMedia.file[0].name).toContain(fileName);
  });

  test('Get media file', async () => {
    const getFile = await api.graphql.query<QueryQuery, QueryQueryVariables>({
      query: GET_FILE_QUERY,
      variables: {
        getFileInput: {
          id: fileId,
        },
      },
      context: {
        headers: {
          current_workspace_id: workspaceId,
          Authorization: `Bearer ${loginResponse.data.login.token}`,
        },
      },
    });

    expect(getFile.data.getFile?.id).toBeDefined();
    expect(getFile.data.getFile?.name).toContain(fileName);
  });

  test('Resize media file', async () => {
    const resizeFile = await api.graphql.mutate<
      ResizeFileMutation,
      ResizeFileMutationVariables
    >({
      mutation: RESIZE_MEDIA_MUTATION,
      variables: {
        resizeFileInput: {
          id: fileId,
          resizeOptions: {
            height: 293,
            width: 304,
            left: 216,
            top: 202,
          },
        },
      },
      context: {
        headers: {
          current_workspace_id: workspaceId,
          Authorization: `Bearer ${loginResponse.data.login.token}`,
        },
      },
    });
    resizeFileId = resizeFile.data?.resizeFile.id;
    console.log(resizeFileId);
    expect(resizeFile.data).toBeDefined();
    expect(resizeFile.data?.resizeFile.url).toBeDefined();
  });

  test('Get media file for assert the resize photo', async () => {
    const getFile = await api.graphql.query<QueryQuery, QueryQueryVariables>({
      query: GET_FILE_QUERY,
      variables: {
        getFileInput: {
          id: fileId,
        },
      },
      context: {
        headers: {
          current_workspace_id: workspaceId,
          Authorization: `Bearer ${loginResponse.data.login.token}`,
        },
      },
    });
    if (getFile.data.getFile?.resizeImages) {
      expect(getFile.data.getFile?.id).toBeDefined();
      expect(getFile.data.getFile?.resizeImages[0]?.id).toContain(resizeFileId);
    }
  });

  test('Delete media file', async () => {
    const deleteFile = await api.graphql.query<
      DeleteFileMutation,
      DeleteFileMutationVariables
    >({
      query: DELETE_MEDIA_MUTATION,
      variables: {
        fileDeleteInput: {
          id: fileId,
          fromStash: false,
        },
      },
      context: {
        headers: {
          current_workspace_id: workspaceId,
          Authorization: `Bearer ${loginResponse.data.login.token}`,
        },
      },
    });
    expect(deleteFile.data.deleteFile.valueOf()).toBeDefined();
  });

  test('After deleting with fromStash false then fetch the list and check the file will not exist', async () => {
    const fileList = await api.graphql.query<FileQuery, FileQueryVariables>({
      query: FILE_LIST_QUERY,

      context: {
        headers: {
          current_workspace_id: workspaceId,
          Authorization: `Bearer ${loginResponse.data.login.token}`,
        },
      },
    });

    expect(fileList.data.listMedia.file[0].id).not.toContain(fileId);
  });
});
