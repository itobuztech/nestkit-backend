export interface UploadFile {
  id: string;
  name: string;
  description?: any;
  size: number;
  mimeType: string;
  url: string;
  folderId?: any;
  accessLevel: string;
  authorId?: any;
  createdAt: string;
  updatedAt: string;
  deletedAt?: any;
  workspaceId: string;
}