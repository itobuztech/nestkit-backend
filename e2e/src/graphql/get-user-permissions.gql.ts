import { graphql } from 'gql';

export const GET_USER_PERMISSION = graphql(`
  query GetUserPermission {
    getUserPermission {
      roles {
        id
        title
      }

      privilege {
        group
        name
        id
        type
      }
    }
  }
`);
