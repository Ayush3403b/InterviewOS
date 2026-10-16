import { describe, expect, it } from "vitest";
import { LocalStorageProvider } from "../../../shared/storage/LocalStorageProvider";
import { S3StorageProvider } from "../../../shared/storage/S3StorageProvider";
import { createStorageProvider } from "../../../config/storage.config";

describe("Storage Providers", () => {
  describe("LocalStorageProvider", () => {
    it("uploads, retrieves URL, downloads, and deletes files", async () => {
      const provider = new LocalStorageProvider();
      const testBuffer = Buffer.from("Hello InterviewOS Storage!");
      const key = "test/sample-resume.txt";

      const uploadResult = await provider.upload(key, testBuffer, {
        contentType: "text/plain",
      });

      expect(uploadResult.key).toBe(key);
      expect(uploadResult.url).toContain("sample-resume.txt");
      expect(uploadResult.sizeBytes).toBe(testBuffer.length);

      const downloaded = await provider.download(key);
      expect(downloaded.toString("utf-8")).toBe("Hello InterviewOS Storage!");

      await provider.delete(key);
    });
  });

  describe("S3StorageProvider", () => {
    it("returns valid S3 and custom endpoint URLs", async () => {
      const s3Provider = new S3StorageProvider({
        bucket: "my-interview-bucket",
        region: "us-west-2",
        publicBaseUrl: "https://cdn.interviewos.dev",
      });

      const result = await s3Provider.upload("resumes/123.pdf", Buffer.from("pdf-data"));
      expect(result.url).toBe("https://cdn.interviewos.dev/resumes/123.pdf");

      const url = await s3Provider.getUrl("resumes/123.pdf");
      expect(url).toBe("https://cdn.interviewos.dev/resumes/123.pdf");
    });
  });

  describe("createStorageProvider factory", () => {
    it("creates LocalStorageProvider by default", () => {
      const provider = createStorageProvider({
        driver: "local",
        s3: { bucket: "test", region: "us-east-1" },
      });
      expect(provider).toBeInstanceOf(LocalStorageProvider);
    });

    it("creates S3StorageProvider when driver is s3", () => {
      const provider = createStorageProvider({
        driver: "s3",
        s3: { bucket: "test", region: "us-east-1" },
      });
      expect(provider).toBeInstanceOf(S3StorageProvider);
    });
  });
});
