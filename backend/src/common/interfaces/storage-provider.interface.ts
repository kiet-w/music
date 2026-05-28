export interface IStorageProvider {
  upload(
    filePath: string,
    bucketName: string,
    destinationPath: string,
  ): Promise<string>;
  uploadBuffer(
    buffer: Buffer,
    bucketName: string,
    destinationPath: string,
    contentType?: string,
  ): Promise<string>;
  getPublicUrl(bucketName: string, path: string): Promise<string>;
  delete(bucketName: string, path: string): Promise<void>;
}
