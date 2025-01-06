import { graphql } from 'gql';

export const GET_FILE_QUERY = graphql(`
query Query($getFileInput: GetFileInput) {
  getFile(getFileInput: $getFileInput) {
    id
    name
    description
    size
    mimeType
    url
    folderId
    authorId
    createdAt
    updatedAt
    deletedAt
    workspaceId
    resizeImages {
      id
      name
      description
      size
      mimeType
      url
      folderId
      authorId
      createdAt
      updatedAt
      deletedAt
      workspaceId
    }
  }
}   
`);
