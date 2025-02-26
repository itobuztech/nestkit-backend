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
  RestoreMutation,
  RestoreMutationVariables,
  GetUserPermissionQuery,
  GetUserPermissionQueryVariables,
  UpdatePostMutation,
  UpdatePostMutationVariables,
} from '../../gql/graphql';
import { DELETE_POST_MUTATION } from '../../graphql/delete-post-mutation.gql';
import { GET_POST_QUERY } from '../../graphql/get-post-query.gql';
import { CREATE_POST_MUTATION } from '../../graphql/create-post-mutation.gql';
import { GET_POST_LIST_QUERY } from '../../graphql/get-post-list-query.gql';
import { UPDATE_POST_MUTATION } from '../../graphql/update-post-mutation.gql';
import { faker } from '@faker-js/faker';
import { CREATE_WORKSPACE_MUTATION } from '../../graphql/create-workspace-mutation.gql';
import { RESTORE_POST_MUTATION } from '../../graphql/restore-post-mutation.gql';
import { GET_USER_PERMISSION } from '../../graphql/get-user-permissions.gql';
import { testConfig } from '../../lib/test-config';

const userArrays = [UserType.SUPER_ADMIN, UserType.USER];
userArrays.forEach((userTypeRole) => {
  describe(`Post CRUD functionalities for ${userTypeRole}`, () => {
    let user: User | null;
    let postId: string | undefined;
    let workspaceId: string | undefined; // Declare workspaceId here.
    const content = faker.lorem.paragraph();
    const title = faker.lorem.word();
    const updatedContent = faker.lorem.paragraph();
    const updatedTitle = faker.lorem.word();
    let createFlag = false;
    let updateFlag = false;
    let deleteFlag = false;
    const workspaceName = faker.lorem.word();

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

    test(`Fetch User permissions - ${userTypeRole}`, async () => {
      const userPermissions = await api.graphql.query<
        GetUserPermissionQuery,
        GetUserPermissionQueryVariables
      >({
        query: GET_USER_PERMISSION,
        variables: {},
        context: {
          headers: {
            [testConfig.currentworkspaceid]: workspaceId,
          },
        },
      });

      for (const privilege of userPermissions.data.getUserPermission
        .privilege) {
        if (privilege.group === 'POST') {
          if (privilege.name === 'CREATE') {
            createFlag = true;
          } else if (privilege.name === 'DELETE') {
            deleteFlag = true;
          } else if (privilege.name === 'UPDATE') {
            updateFlag = true;
          }
        }
      }
    });

    test(`Create Post as ${userTypeRole}`, async () => {
      if (!user) return;
      if (createFlag) {
        const createPostResponse = await api.graphql.mutate<
          CreatePostMutation,
          CreatePostMutationVariables
        >({
          mutation: CREATE_POST_MUTATION,
          variables: {
            createPostInput: {
              authorId: user?.id,
              content: content,
              published: faker.datatype.boolean(),
              title: title,
            },
          },
          context: {
            headers: {
              [testConfig.currentworkspaceid]: workspaceId,
            },
          },
        });

        const data = createPostResponse.data;
        expect(data?.createPost.id).toBeDefined();

        postId = createPostResponse.data?.createPost.id;
        console.log('Post ID:', postId);
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
              id: postId,
            },
          },
        });

        const data = getPost.data;
        console.log(data.getPost?.id);
        expect(data.getPost?.id).toBe(postId);
        expect(data.getPost?.content).toBe(content);
        expect(data.getPost?.title).toBe(title);
      }
    });

    test('Update Post', async () => {
      if (updateFlag && postId) {
        const updatePostResponse = await api.graphql.mutate<
          UpdatePostMutation,
          UpdatePostMutationVariables
        >({
          mutation: UPDATE_POST_MUTATION,
          variables: {
            postId: postId,
            updatePostInput: {
              authorId: user?.id,
              content: updatedContent,
              published: faker.datatype.boolean(),
              title: updatedTitle,
            },
          },
          context: {
            headers: {
              [testConfig.currentworkspaceid]: workspaceId,
            },
          },
        });

        const data = updatePostResponse.data;
        expect(data?.updatePost.id).toBeDefined();
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
        });

        const data = postList.data;
        expect(data.getPostList.posts.length).toBeGreaterThan(0);
      }
    });

    test(`Delete post as ${userTypeRole} not from stash`, async () => {
      if (deleteFlag && postId) {
        const deletePostResponse = await api.graphql.mutate<
          DeletePostMutation,
          DeletePostMutationVariables
        >({
          mutation: DELETE_POST_MUTATION,
          variables: {
            postDeleteInput: {
              id: postId,
              fromStash: false,
            },
          },
          context: {
            headers: {
              [testConfig.currentworkspaceid]: workspaceId,
            },
          },
        });
        expect(deletePostResponse.data?.deletePost).toBe(true);
      }
    console.log('Post ID:', postId);

    });

    test(`Restore post as ${userTypeRole} not from stash`, async () => {
      if (deleteFlag && postId) {
        const restorePost = await api.graphql.mutate<
          RestoreMutation,
          RestoreMutationVariables
        >({
          mutation: RESTORE_POST_MUTATION,
          variables: {
            postRestoreInput: {
              id: postId,
            },
          },
          context: {
            headers: {
              [testConfig.currentworkspaceid]: workspaceId,
            },
          },
        });

        expect(restorePost.data?.restore).toBe(true);
      }
      console.log('Post ID:', postId);
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
              id: postId,
            },
          },
        });

        const data = getPost.data;
        console.log(data.getPost?.id);
        expect(data.getPost?.id).toBe(postId);
        console.log(data.getPost?.content);
        expect(data.getPost?.content).toBe(updatedContent);
        expect(data.getPost?.title).toBe(updatedTitle);
      }
    });

    test(`Delete post as ${userTypeRole} not from stash`, async () => {
      if (deleteFlag && postId) {
        const deletePostResponse = await api.graphql.mutate<
          DeletePostMutation,
          DeletePostMutationVariables
        >({
          mutation: DELETE_POST_MUTATION,
          variables: {
            postDeleteInput: {
              id: postId,
              fromStash: false,
            },
          },
          context: {
            headers: {
              [testConfig.currentworkspaceid]: workspaceId,
            },
          },
        });
        expect(deletePostResponse.data?.deletePost).toBe(true);
        console.log(deletePostResponse);
      }

    });


    test(`Delete post as ${userTypeRole} from stash`, async () => {
      if (!postId) return;

      if (deleteFlag) {
        const deletePostResponse = await api.graphql.mutate<
          DeletePostMutation,
          DeletePostMutationVariables
        >({
          mutation: DELETE_POST_MUTATION,
          variables: {
            postDeleteInput: {
              id: postId,
              fromStash: true,
            },
          },
          context: {
            headers: {
              [testConfig.currentworkspaceid]: workspaceId,
            },
          },
        });
        expect(deletePostResponse.data?.deletePost).toBe(true);

        const dbClient = new PrismaClient();
        const post = await dbClient.post.findUnique({
          where: {
            id: postId,
          },
        });
        expect(post).toBe(null);
      }
    });
  });
});
