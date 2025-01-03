import { graphql } from 'gql';

export const GET_ROLE_QUERY = graphql(`
  query GetRole($roleGetInput: RoleGetInput!) {
    getRole(roleGetInput: $roleGetInput) {
      id
      title
      type
      description
      createdAt
      updatedAt
      deletedAt
      privilege {
        name
        group
        id
        type
      }
    }
  }
`);
