interface File {
  id: string;
  name: string;
  description?: any;
  size: number;
  mimeType: string;
  url: string;
  folderId?: any;
  authorId?: any;
  createdAt: string;
  updatedAt: string;
  deletedAt?: any;
}
interface ListMedia {
  file: File[];
}
interface Data {
  listMedia: ListMedia;
}
export interface MediaList {
  data: Data;
}