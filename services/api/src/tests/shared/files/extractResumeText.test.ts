import { describe, expect, it, vi } from "vitest";

vi.mock("pdf-parse", () => ({
  default: vi.fn().mockResolvedValue({ text: "  PDF resume text  " }),
}));

vi.mock("mammoth", () => ({
  default: {
    extractRawText: vi.fn().mockResolvedValue({ value: "  DOCX resume text  " }),
  },
}));

import { extractResumeText } from "../../../shared/files/extractResumeText";
import { ApiError } from "../../../shared/errors/ApiError";

describe("extractResumeText", () => {

  it("extracts and trims text from a PDF buffer", async () => {

    const result = await extractResumeText(Buffer.from("fake"), "application/pdf");

    expect(result).toBe("PDF resume text");

  });

  it("extracts and trims text from a DOCX buffer", async () => {

    const result = await extractResumeText(
      Buffer.from("fake"),
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    expect(result).toBe("DOCX resume text");

  });

  it("throws an ApiError for an unsupported mime type", async () => {

    await expect(
      extractResumeText(Buffer.from("fake"), "image/png")
    ).rejects.toThrow(ApiError);

  });

});
