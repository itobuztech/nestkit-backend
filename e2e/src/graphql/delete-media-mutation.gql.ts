import { graphql } from 'gql';

export const DELETE_MEDIA_MUTATION = graphql(`
  mutation DeleteFile($fileDeleteInput: FileDeleteInput) {
  deleteFile(fileDeleteInput: $fileDeleteInput)
}
`)