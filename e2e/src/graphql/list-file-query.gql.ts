import { graphql } from 'gql';

export const FILE_LIST_QUERY = graphql(`
   query File($listMediaInput: ListMediaInput) {
  listMedia(listMediaInput: $listMediaInput) {
    file {
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
    }
  }
}
`);
