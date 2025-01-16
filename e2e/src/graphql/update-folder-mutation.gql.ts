import { graphql } from 'gql';

export const UPDATE_FOLDER_MUTATION = graphql(`
  mutation UpdateFolder($updateFolderInput: UpdateFolderInput!) {
    updateFolder(updateFolderInput: $updateFolderInput)
  }
`);
