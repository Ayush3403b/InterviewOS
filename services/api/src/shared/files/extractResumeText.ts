import pdfParse from "pdf-parse";
import mammoth from "mammoth";

import { ApiError } from "../errors/ApiError";
import { ErrorCode } from "../errors/ErrorCode";

export const SUPPORTED_RESUME_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

/**
 * Pulls plain text out of a PDF or DOCX buffer. Anything else (images,
 * .doc, .txt masquerading as a resume, etc.) is rejected up front - the
 * Resume Agent only ever sees text, never raw file bytes.
 */
export async function extractResumeText(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  if (mimeType === "application/pdf") {
    const result = await pdfParse(buffer);
    return result.text.trim();
  }

  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  throw new ApiError(
    415,
    `Unsupported resume file type "${mimeType}". Upload a PDF or DOCX file.`,
    ErrorCode.BAD_REQUEST
  );
}
