import fs from "fs/promises";
import path from "path";
import { IStorageProvider, StorageUploadOptions, UploadResult } from "./IStorageProvider";

export class LocalStorageProvider implements IStorageProvider {
  private readonly baseDir: string;
  private readonly baseUrl: string;

  constructor(baseDir?: string, baseUrl?: string) {
    this.baseDir = baseDir || path.resolve(process.cwd(), "uploads");
    this.baseUrl = baseUrl || "/uploads";
  }

  private getFilePath(key: string): string {
    const safeKey = key.replace(/\.\./g, "").replace(/^\/+/, "");
    return path.join(this.baseDir, safeKey);
  }

  async upload(
    key: string,
    buffer: Buffer,
    _options?: StorageUploadOptions
  ): Promise<UploadResult> {
    const filePath = this.getFilePath(key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);

    const cleanKey = key.replace(/^\/+/, "");
    return {
      key: cleanKey,
      url: `${this.baseUrl}/${cleanKey}`,
      sizeBytes: buffer.length,
    };
  }

  async getUrl(key: string): Promise<string> {
    const cleanKey = key.replace(/^\/+/, "");
    return `${this.baseUrl}/${cleanKey}`;
  }

  async delete(key: string): Promise<void> {
    const filePath = this.getFilePath(key);
    try {
      await fs.unlink(filePath);
    } catch (err: any) {
      if (err.code !== "ENOENT") {
        throw err;
      }
    }
  }

  async download(key: string): Promise<Buffer> {
    const filePath = this.getFilePath(key);
    return fs.readFile(filePath);
  }
}
