import { graphql } from 'gql';

export const GET_ROLE_LIST_QUERY = graphql(`
  query RoleList($roleListInput: RoleListInput) {
    roleList(roleListInput: $roleListInput) {
      role {
        title
        type
        id
        deletedAt
      }
      pagination {
        totalPage
        currentPage
        perPage
      }
    }
  }
`);
