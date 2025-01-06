import { graphql } from 'gql';

export const DELETE_FOLDER_MUTATION = graphql(`
  mutation DeleteFolder($folderDeleteInput: DeleteFolderInput!) {
    deleteFolder(folderDeleteInput: $folderDeleteInput)
  }
`);
