import { graphql } from 'gql';

export const GET_FOLDER_QUERY = graphql(`
  query GetFolder($getFolderInput: GetFolderInput!) {
    getFolder(getFolderInput: $getFolderInput) {
      name
      id
      parentId
      createdAt
      updatedAt
      deletedAt
      subFolders {
        name
        id
        createdAt
        updatedAt
        deletedAt
      }
    }
  }
`);
