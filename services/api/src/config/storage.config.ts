import dotenv from "dotenv";
import { IStorageProvider } from "../shared/storage/IStorageProvider";
import { LocalStorageProvider } from "../shared/storage/LocalStorageProvider";
import { S3StorageProvider } from "../shared/storage/S3StorageProvider";

dotenv.config();

export type StorageDriver = "local" | "s3";

export interface StorageConfig {
  driver: StorageDriver;
  s3: {
    bucket: string;
    region: string;
    endpoint?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    publicBaseUrl?: string;
  };
}

export const storageConfig: StorageConfig = {
  driver: (process.env.STORAGE_DRIVER as StorageDriver) || "local",
  s3: {
    bucket: process.env.S3_BUCKET || "interviewos-uploads",
    region: process.env.S3_REGION || "us-east-1",
    endpoint: process.env.S3_ENDPOINT,
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    publicBaseUrl: process.env.S3_PUBLIC_BASE_URL,
  },
};

export function createStorageProvider(config: StorageConfig = storageConfig): IStorageProvider {
  if (config.driver === "s3") {
    return new S3StorageProvider(config.s3);
  }
  return new LocalStorageProvider();
}
