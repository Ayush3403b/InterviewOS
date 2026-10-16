export interface StorageUploadOptions {
  contentType?: string;
  isPublic?: boolean;
}

export interface UploadResult {
  key: string;
  url: string;
  sizeBytes: number;
}

export interface IStorageProvider {
  /**
   * Uploads a buffer to storage with the given key (e.g. "resumes/user123-resume.pdf").
   */
  upload(
    key: string,
    buffer: Buffer,
    options?: StorageUploadOptions
  ): Promise<UploadResult>;

  /**
   * Generates or returns the accessible URL for the given key.
   */
  getUrl(key: string): Promise<string>;

  /**
   * Deletes a file from storage.
   */
  delete(key: string): Promise<void>;

  /**
   * Retrieves a file buffer from storage.
   */
  download(key: string): Promise<Buffer>;
}
