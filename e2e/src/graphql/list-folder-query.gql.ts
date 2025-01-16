import { graphql } from 'gql';

export const LIST_FOLDER_QUERY = graphql(`
  query ListFolder($listFolderInput: ListFolderInput) {
    listFolder(listFolderInput: $listFolderInput) {
      folder {
        name
        id
        parentId
        createdAt
        updatedAt
        deletedAt
      }
      pagination {
        totalPage
        currentPage
        perPage
        totalRows
      }
    }
  }
`);
