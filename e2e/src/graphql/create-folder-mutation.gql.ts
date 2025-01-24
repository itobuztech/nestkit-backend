import { graphql } from 'gql';

export const CREATE_FOLDER_MUTATION = graphql(`
  mutation CreateFolder($createFolderInput: CreateFolderInput) {
    createFolder(createFolderInput: $createFolderInput) {
      id
      name
      parentId
    }
  }
`);
