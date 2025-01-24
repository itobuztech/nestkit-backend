import { graphql } from 'gql';

export const RESTORE_POST_MUTATION = graphql(`
  mutation Restore($postRestoreInput: PostRestoreInput) {
  restore(postRestoreInput: $postRestoreInput)
}
`);
