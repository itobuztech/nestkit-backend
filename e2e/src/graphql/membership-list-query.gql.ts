import { graphql } from 'gql';

export const LIST_MEMBERSHIP_QUERY = graphql(`
  query ListMemberships($listMembershipsInput: ListMembershipInput!) {
    listMemberships(listMembershipsInput: $listMembershipsInput) {
      memberships {
        workspaceId
        user {
          id
          name
          email
        }
        isOwner
        isAccepted
      }
      pagination {
        totalPage
        currentPage
        perPage
      }
    }
  }
`);
