export interface BufferedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer | string;
}

export interface StoredFile extends HasFile, StoredFileMetadata {}

export interface HasFile {
  file: Buffer | string;
}

export interface StoredFileMetadata {
  id: string;
  name: string;
  encoding: string;
  mimetype: string;
  size: number;
  updatedAt: Date;
  fileSrc?: string;
}

export interface IFiles {
  id?: string;
  bucketName?: string;
  createdAt?: Date;
  createdBy?: string;
  isDeleted?: boolean;
  type: string;
  name: string;
  size: number;
}

export interface IDownloadFile {
  fileId: string;
}

export interface IDownloadHistory {
  userId: string;
  fileId: string;
}
