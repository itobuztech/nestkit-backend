import { PrismaClient, User, UserType } from '@prisma/client';
import { GraphQlApi } from '../../lib/graphql-api';
import { appEnv } from '../../lib/app-env';
import {
  CreatePostMutation,
  CreatePostMutationVariables,
  CreateWorkspaceMutation,
  CreateWorkspaceMutationVariables,
  DeletePostMutation,
  DeletePostMutationVariables,
  GetPostListQuery,
  GetPostListQueryVariables,
  GetPostQuery,
  GetPostQueryVariables,
  GetUserPermissionQuery,
  GetUserPermissionQueryVariables,
  UpdatePostMutation,
  UpdatePostMutationVariables,
} from '../../gql/graphql';
import { GET_POST_QUERY } from '../../graphql/get-post-query.gql';
import { CREATE_POST_MUTATION } from '../../graphql/create-post-mutation.gql';
import { GET_POST_LIST_QUERY } from '../../graphql/get-post-list-query.gql';
import { UPDATE_POST_MUTATION } from '../../graphql/update-post-mutation.gql';
import { faker } from '@faker-js/faker';
import { sample } from 'lodash';
import { DELETE_POST_MUTATION } from '../../graphql/delete-post-mutation.gql';
import { CREATE_WORKSPACE_MUTATION } from '../../graphql/create-workspace-mutation.gql';
import { GET_USER_PERMISSION } from '../../graphql/get-user-permissions.gql';

const userArrays = [UserType.SUPER_ADMIN, UserType.USER];
userArrays.forEach((userTypeRole) => {
  describe(`Post CRUD functionalities negative testing for ${userTypeRole} - NST-42`, () => {
    let user: User | null;
    let postId: string | undefined;
    const title = faker.lorem.word();
    let createFlag = false;
    let updateFlag = false;
    let deleteFlag = false;
    const api = new GraphQlApi();
    let workspaceId: string | undefined;
    const workspaceName = faker.lorem.word();

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
    test('Get current user privileges', async () => {
      const userPermissions = await api.graphql.query<
        GetUserPermissionQuery,
        GetUserPermissionQueryVariables
      >({
        query: GET_USER_PERMISSION,
        variables: {},
        context: {
          headers: {
            current_workspace_id: workspaceId,
          },
        },
      });
      for (const privilege of userPermissions.data.getUserPermission
        .privilege) {
        if (privilege.group === 'POST') {
          if (privilege.name === 'CREATE') {
            createFlag = true;
          } else if (privilege.name === 'UPDATE') {
            updateFlag = true;
          } else if (privilege.name === 'DELETE') {
            deleteFlag = true;
          }
        }
      }
    });

    test(`Create Post as ${userTypeRole} with blank title`, async () => {
      if (!user) return;
      if (createFlag) {
        const createPostResponse = await api.graphql.mutate<
          CreatePostMutation,
          CreatePostMutationVariables
        >({
          mutation: CREATE_POST_MUTATION,
          variables: {
            createPostInput: {
              content: '',
              published: faker.datatype.boolean(),
              title: '',
            },
          },
          context: {
            headers: {
              current_workspace_id: workspaceId,
            },
          },
        });

        if (!createPostResponse.errors) {
          throw new Error('Expected an error, but none was returned');
        }
        expect(createPostResponse.errors[0].message).toContain(
          'title should not be empty',
        );
      }
    });

    test(`Get post as ${userTypeRole}`, async () => {
      if (postId) {
        const getPost = await api.graphql.query<
          GetPostQuery,
          GetPostQueryVariables
        >({
          query: GET_POST_QUERY,
          variables: {
            getPostInput: {
              id: crypto.randomUUID(),
            },
          },
          context: {
            headers: {
              current_workspace_id: workspaceId,
            },
          },
        });
        if (!getPost.errors) {
          throw new Error('Expected an error, but none was returned');
        }
        expect(getPost.errors[0].message).toBe('Post not found');
      }
    });

    test(`Get post list as ${userTypeRole}`, async () => {
      if (updateFlag) {
        const postList = await api.graphql.query<
          GetPostListQuery,
          GetPostListQueryVariables
        >({
          query: GET_POST_LIST_QUERY,
          variables: {
            getPostListInput: {
              fromStash: false,
            },
          },
          context: {
            headers: {
              current_workspace_id: workspaceId,
            },
          },
        });

        postId = sample(postList.data.getPostList.posts)?.id;
      }
    });

    test('Update Post with wrong post id', async () => {
      if (!postId) return;

      if (updateFlag) {
        const updatePostResponse = await api.graphql.mutate<
          UpdatePostMutation,
          UpdatePostMutationVariables
        >({
          mutation: UPDATE_POST_MUTATION,
          variables: {
            postId: crypto.randomUUID(),
            updatePostInput: {
              content: '',
              published: faker.datatype.boolean(),
              title: title,
            },
          },
          context: {
            headers: {
              current_workspace_id: workspaceId,
            },
          },
        });

        if (!updatePostResponse.errors) {
          throw new Error('Expected an error, but none was returned');
        }
        expect(updatePostResponse.errors[0].message).toContain(
          'Post not found',
        );
      }
    });

    test('Update Post with blank title', async () => {
      if (!postId) return;

      if (updateFlag) {
        const updatePostResponse = await api.graphql.mutate<
          UpdatePostMutation,
          UpdatePostMutationVariables
        >({
          mutation: UPDATE_POST_MUTATION,
          variables: {
            postId: postId,
            updatePostInput: {
              content: '',
              published: faker.datatype.boolean(),
              title: '',
            },
          },
          context: {
            headers: {
              current_workspace_id: workspaceId,
            },
          },
        });

        if (!updatePostResponse.errors) {
          throw new Error('Expected an error, but none was returned');
        }
        expect(updatePostResponse.errors[0].message).toContain(
          'title should not be empty',
        );
      }
    });

    test(`Delete post as ${userTypeRole} with wrong id`, async () => {
      if (!postId) return;

      if (deleteFlag) {
        const deletePostResponse = await api.graphql.mutate<
          DeletePostMutation,
          DeletePostMutationVariables
        >({
          mutation: DELETE_POST_MUTATION,
          variables: {
            postDeleteInput: {
              id: crypto.randomUUID(),
              fromStash: false,
            },
          },
          context: {
            headers: {
              current_workspace_id: workspaceId,
            },
          },
        });

        if (!deletePostResponse.errors) {
          throw new Error('Expected an error, but none was returned');
        }
        expect(deletePostResponse.errors[0].message).toContain(
          'Post not found',
        );
      }
    });
  });
});
