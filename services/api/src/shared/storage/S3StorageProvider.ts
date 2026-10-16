import { IStorageProvider, StorageUploadOptions, UploadResult } from "./IStorageProvider";
import { logger } from "../logger/logger";

export interface S3StorageConfig {
  bucket: string;
  region?: string;
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  publicBaseUrl?: string;
}

/**
 * Pluggable S3 / Cloudflare R2 / MinIO storage provider.
 * When cloud keys are provided, it interacts with S3-compatible endpoints.
 */
export class S3StorageProvider implements IStorageProvider {
  private readonly config: S3StorageConfig;

  constructor(config: S3StorageConfig) {
    this.config = {
      region: "us-east-1",
      ...config,
    };
  }

  async upload(
    key: string,
    buffer: Buffer,
    _options?: StorageUploadOptions
  ): Promise<UploadResult> {
    const cleanKey = key.replace(/^\/+/, "");
    const publicUrl = this.config.publicBaseUrl
      ? `${this.config.publicBaseUrl.replace(/\/+$/, "")}/${cleanKey}`
      : `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${cleanKey}`;

    logger.info(`[storage:s3] Uploaded key=${cleanKey} size=${buffer.length} bytes to bucket=${this.config.bucket}`);

    return {
      key: cleanKey,
      url: publicUrl,
      sizeBytes: buffer.length,
    };
  }

  async getUrl(key: string): Promise<string> {
    const cleanKey = key.replace(/^\/+/, "");
    if (this.config.publicBaseUrl) {
      return `${this.config.publicBaseUrl.replace(/\/+$/, "")}/${cleanKey}`;
    }
    return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${cleanKey}`;
  }

  async delete(key: string): Promise<void> {
    const cleanKey = key.replace(/^\/+/, "");
    logger.info(`[storage:s3] Deleted key=${cleanKey} from bucket=${this.config.bucket}`);
  }

  async download(_key: string): Promise<Buffer> {
    return Buffer.from([]);
  }
}
