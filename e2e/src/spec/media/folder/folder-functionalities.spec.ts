import { appEnv } from '../../../lib/app-env';
import { PrismaClient, User, UserType } from '@prisma/client';
import { GraphQlApi } from '../../../lib/graphql-api';
import {
  CreateFolderMutation,
  CreateFolderMutationVariables,
  CreateWorkspaceMutation,
  CreateWorkspaceMutationVariables,
  DeleteFolderMutation,
  DeleteFolderMutationVariables,
  GetFolderQuery,
  GetFolderQueryVariables,
  ListFolderQuery,
  ListFolderQueryVariables,
  LoginQuery,
  UpdateFolderMutation,
  UpdateFolderMutationVariables,
} from '../../../gql/graphql';
import { CREATE_WORKSPACE_MUTATION } from '../../../graphql/create-workspace-mutation.gql';
import { CREATE_FOLDER_MUTATION } from '../../../graphql/create-folder-mutation.gql';
import { UPDATE_FOLDER_MUTATION } from '../../../graphql/update-folder-mutation.gql';
import { LIST_FOLDER_QUERY } from '../../../graphql/list-folder-query.gql';
import { GET_FOLDER_QUERY } from '../../../graphql/get-folder-query.gql';
import { DELETE_FOLDER_MUTATION } from '../../../graphql/delete-folder-mutation.gql';
import { faker } from '@faker-js/faker';
import { ApolloQueryResult } from '@apollo/client';
import { testConfig } from '../../../lib/test-config';

describe(`Folder module functionalities for ${UserType.SUPER_ADMIN}`, () => {
  let user: User | null;
  const workspaceName = faker.lorem.word();
  let workspaceId: string | undefined;
  const api = new GraphQlApi();
  let loginResponse: ApolloQueryResult<LoginQuery>;
  const name = faker.lorem.word();
  const updatedName = faker.lorem.word();
  let folderId: string | undefined;

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

  test(`New Workspace created as a ${UserType.SUPER_ADMIN.toUpperCase()}`, async () => {
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

  test(`Create a folder as a ${UserType.SUPER_ADMIN.toUpperCase()}`, async () => {
    const createFolder = await api.graphql.mutate<
      CreateFolderMutation,
      CreateFolderMutationVariables
    >({
      mutation: CREATE_FOLDER_MUTATION,
      variables: {
        createFolderInput: {
          name,
        },
      },
      context: {
        headers: {
          Authorization: `Bearer ${loginResponse.data?.login.token}`,
          [testConfig.currentworkspaceid]: workspaceId,
        },
      },
    });
    folderId = createFolder.data?.createFolder.id;

    expect(createFolder.data?.createFolder.id).not.toBeNull();
    expect(createFolder.data?.createFolder.name).toBe(name);
  });

  test(`List folder as a ${UserType.SUPER_ADMIN.toUpperCase()}`, async () => {
    const listFolder = await api.graphql.query<
      ListFolderQuery,
      ListFolderQueryVariables
    >({
      query: LIST_FOLDER_QUERY,
      context: {
        headers: {
          Authorization: `Bearer ${loginResponse.data?.login.token}`,
          [testConfig.currentworkspaceid]: workspaceId,
        },
      },
    });

    const createdFolder = listFolder.data.listFolder.folder.find(
      (folder) => folder.id === folderId,
    );

    expect(createdFolder).toBeDefined();
    expect(createdFolder?.name).toBe(name);
    expect(listFolder.data.listFolder.folder.length).toBeGreaterThan(0);
  });

  test(`Update the folder as a ${UserType.SUPER_ADMIN.toUpperCase()}`, async () => {
    if (folderId) {
      const updateFolder = await api.graphql.mutate<
        UpdateFolderMutation,
        UpdateFolderMutationVariables
      >({
        mutation: UPDATE_FOLDER_MUTATION,
        variables: {
          updateFolderInput: {
            id: folderId,
            name: updatedName,
          },
        },
        context: {
          headers: {
            Authorization: `Bearer ${loginResponse.data?.login.token}`,
            [testConfig.currentworkspaceid]: workspaceId,
          },
        },
      });

      expect(updateFolder.data?.updateFolder).toBe(true);
    }
  });

  test(`Get folder as a ${UserType.SUPER_ADMIN.toUpperCase()}`, async () => {
    if (folderId) {
      const getFolder = await api.graphql.query<
        GetFolderQuery,
        GetFolderQueryVariables
      >({
        query: GET_FOLDER_QUERY,
        variables: {
          getFolderInput: {
            id: folderId,
          },
        },
        context: {
          headers: {
            Authorization: `Bearer ${loginResponse.data?.login.token}`,
            [testConfig.currentworkspaceid]: workspaceId,
          },
        },
      });

      expect(getFolder.data.getFolder.name).toBe(updatedName);
      expect(getFolder.data.getFolder.id).toBe(folderId);
    }
  });

  test(`Delete the folder not from stash as a ${UserType.SUPER_ADMIN.toUpperCase()}`, async () => {
    if (folderId) {
      const deleteFolder = await api.graphql.mutate<
        DeleteFolderMutation,
        DeleteFolderMutationVariables
      >({
        mutation: DELETE_FOLDER_MUTATION,
        variables: {
          folderDeleteInput: {
            id: folderId,
            fromStash: false,
          },
        },
        context: {
          headers: {
            Authorization: `Bearer ${loginResponse.data?.login.token}`,
            [testConfig.currentworkspaceid]: workspaceId,
          },
        },
      });

      expect(deleteFolder.data?.deleteFolder).toBe(true);
    }
  });

  test(`List folder as a ${UserType.SUPER_ADMIN.toUpperCase()}`, async () => {
    const listFolder = await api.graphql.query<
      ListFolderQuery,
      ListFolderQueryVariables
    >({
      query: LIST_FOLDER_QUERY,
      context: {
        headers: {
          Authorization: `Bearer ${loginResponse.data?.login.token}`,
          [testConfig.currentworkspaceid]: workspaceId,
        },
      },
    });

    const createdFolder = listFolder.data.listFolder.folder.find(
      (folder) => folder.id === folderId,
    );

    expect(createdFolder).not.toBeDefined();
  });

  test(`Delete the folder from stash as a ${UserType.SUPER_ADMIN.toUpperCase()}`, async () => {
    if (folderId) {
      const deleteFolder = await api.graphql.mutate<
        DeleteFolderMutation,
        DeleteFolderMutationVariables
      >({
        mutation: DELETE_FOLDER_MUTATION,
        variables: {
          folderDeleteInput: {
            id: folderId,
            fromStash: true,
          },
        },
        context: {
          headers: {
            Authorization: `Bearer ${loginResponse.data?.login.token}`,
            [testConfig.currentworkspaceid]: workspaceId,
          },
        },
      });

      expect(deleteFolder.data?.deleteFolder).toBe(true);

      const dbClient = new PrismaClient();
      const post = await dbClient.folder.findUnique({
        where: {
          id: folderId,
        },
      });
      expect(post).toBe(null);
    }
  });
});
