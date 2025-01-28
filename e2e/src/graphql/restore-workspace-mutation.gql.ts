import { graphql } from 'gql';

export const RESTORE_WORKSPACE_MUTATION = graphql(`
  mutation RestoreWorkSpace($restoreWorkspaceInput: WorkspaceRestoreInput) {
  restoreWorkSpace(restoreWorkspaceInput: $restoreWorkspaceInput)
}
`);
