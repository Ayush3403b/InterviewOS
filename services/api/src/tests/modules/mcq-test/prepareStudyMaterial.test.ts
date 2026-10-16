import { describe, expect, it, vi } from "vitest";

vi.mock("pdf-parse", () => ({
  default: vi.fn(),
}));

import pdfParse from "pdf-parse";

import {
  MATERIAL_LIMITS,
  prepareStudyMaterial,
} from "../../../modules/mcq-test/services/prepareStudyMaterial";

function file(mimetype: string, originalname: string, size = 1000) {
  return { buffer: Buffer.from("bytes"), mimetype, originalname, size };
}

describe("prepareStudyMaterial", () => {

  it("uses the text of a text-based PDF instead of sending the file", async () => {

    vi.mocked(pdfParse).mockResolvedValueOnce({
      text: "A".repeat(500),
      numpages: 1,
    } as never);

    const result = await prepareStudyMaterial([file("application/pdf", "notes.pdf")]);

    expect(result.text).toContain("--- notes.pdf ---");
    expect(result.attachments).toHaveLength(0);

  });

  it("sends a scanned PDF (little text per page) to the model as a file", async () => {

    vi.mocked(pdfParse).mockResolvedValueOnce({ text: "p1 p2", numpages: 3 } as never);

    const result = await prepareStudyMaterial([file("application/pdf", "scan.pdf")]);

    expect(result.text).toBe("");
    expect(result.attachments).toEqual([
      expect.objectContaining({ mimeType: "application/pdf", filename: "scan.pdf" }),
    ]);

  });

  it("falls back to sending the file when a PDF can't be parsed", async () => {

    vi.mocked(pdfParse).mockRejectedValueOnce(new Error("encrypted"));

    const result = await prepareStudyMaterial([file("application/pdf", "locked.pdf")]);

    expect(result.attachments).toHaveLength(1);

  });

  it("always sends images as files", async () => {

    const result = await prepareStudyMaterial([
      file("image/jpeg", "page1.jpg"),
      file("image/png", "page2.png"),
    ]);

    expect(result.attachments.map((attachment) => attachment.mimeType)).toEqual([
      "image/jpeg",
      "image/png",
    ]);
    expect(result.attachments[0].base64).toBe(Buffer.from("bytes").toString("base64"));

  });

  it("rejects more images/scans than fit in one model request", async () => {

    const big = MATERIAL_LIMITS.maxAttachmentBytes / 2 + 1;

    await expect(
      prepareStudyMaterial([
        file("image/jpeg", "a.jpg", big),
        file("image/jpeg", "b.jpg", big),
      ])
    ).rejects.toMatchObject({ statusCode: 413 });

  });

  it("truncates very long extracted text and says so", async () => {

    vi.mocked(pdfParse).mockResolvedValueOnce({
      text: "B".repeat(MATERIAL_LIMITS.maxTextChars + 500),
      numpages: 1,
    } as never);

    const result = await prepareStudyMaterial([file("application/pdf", "book.pdf")]);

    expect(result.truncated).toBe(true);
    expect(result.text).toHaveLength(MATERIAL_LIMITS.maxTextChars);

  });

  it("rejects an empty upload", async () => {

    await expect(prepareStudyMaterial([])).rejects.toMatchObject({ statusCode: 400 });

  });

});
