import { graphql } from 'gql';

export const RESIZE_MEDIA_MUTATION = graphql(`
  mutation ResizeFile($resizeFileInput: ResizeFileInput) {
  resizeFile(resizeFileInput: $resizeFileInput)
}

`);
