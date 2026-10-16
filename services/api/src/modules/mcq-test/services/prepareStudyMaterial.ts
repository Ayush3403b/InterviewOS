import pdfParse from "pdf-parse";

import { ApiError } from "../../../shared/errors/ApiError";
import { ErrorCode } from "../../../shared/errors/ErrorCode";

import { LLMAttachment } from "../../../agents/llm/ILLMClient";

export const MATERIAL_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MATERIAL_LIMITS = {
  maxFiles: 10,
  maxFileBytes: 10 * 1024 * 1024,
  /**
   * Files sent to the model as-is (images, scanned PDFs) travel base64-
   * encoded inside one request, which grows them by a third. Gemini caps
   * a whole request at 20 MB, so ~14 MB of raw files is the safe ceiling.
   */
  maxAttachmentBytes: 14 * 1024 * 1024,
  /** Roughly 25k tokens of extracted PDF text. */
  maxTextChars: 100_000,
} as const;

/**
 * Below this many extracted characters per page, a PDF is treated as
 * scanned (images of text) and sent to the model as a file instead.
 */
const MIN_TEXT_CHARS_PER_PAGE = 200;

export interface UploadedMaterialFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

export interface PreparedMaterial {
  /** Text pulled from text-based PDFs, labelled per file. */
  text: string;
  /** Images and scanned PDFs, for the model to read directly. */
  attachments: LLMAttachment[];
  /** Whether `text` was cut to MATERIAL_LIMITS.maxTextChars. */
  truncated: boolean;
}

/**
 * A text-based PDF's text, or null when the PDF looks scanned (too
 * little text per page) or can't be parsed - either way the model gets
 * the file itself instead.
 */
async function readPdfText(buffer: Buffer): Promise<string | null> {
  try {
    const result = await pdfParse(buffer);

    const text = result.text
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    const pages = Math.max(1, result.numpages || 1);

    return text.length / pages >= MIN_TEXT_CHARS_PER_PAGE ? text : null;
  } catch {
    return null;
  }
}

/**
 * Splits an upload into what the model should read as text (cheaper,
 * works with every provider including mock) and what it has to see
 * (photos, screenshots, scanned PDFs).
 */
export async function prepareStudyMaterial(
  files: UploadedMaterialFile[]
): Promise<PreparedMaterial> {
  if (!files.length) {
    throw new ApiError(
      400,
      "Upload at least one PDF or image.",
      ErrorCode.BAD_REQUEST
    );
  }

  const textParts: string[] = [];
  const attachments: LLMAttachment[] = [];
  let attachmentBytes = 0;

  for (const file of files) {
    if (file.mimetype === "application/pdf") {
      const text = await readPdfText(file.buffer);

      if (text) {
        textParts.push(`--- ${file.originalname} ---\n${text}`);
        continue;
      }
    }

    attachmentBytes += file.size;

    attachments.push({
      mimeType: file.mimetype,
      base64: file.buffer.toString("base64"),
      filename: file.originalname,
    });
  }

  if (attachmentBytes > MATERIAL_LIMITS.maxAttachmentBytes) {
    throw new ApiError(
      413,
      "Images and scanned PDFs can add up to at most 14 MB per upload. Split them into smaller batches.",
      ErrorCode.BAD_REQUEST
    );
  }

  const fullText = textParts.join("\n\n");
  const truncated = fullText.length > MATERIAL_LIMITS.maxTextChars;

  return {
    text: truncated ? fullText.slice(0, MATERIAL_LIMITS.maxTextChars) : fullText,
    attachments,
    truncated,
  };
}
