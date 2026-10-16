import { z } from "zod";

export const MCQ_MIN_OPTIONS = 2;
export const MCQ_MAX_OPTIONS = 6;

/** Models sometimes answer "easy"/"Medium" - normalise before checking. */
const difficultySchema = z.preprocess(
  (value) => (typeof value === "string" ? value.trim().toUpperCase() : value),
  z.enum(["EASY", "MEDIUM", "HARD"])
);

export const generatedMcqSchema = z
  .object({
    question: z.string().trim().min(1).max(2000),
    options: z
      .array(z.string().trim().min(1).max(500))
      .min(MCQ_MIN_OPTIONS)
      .max(MCQ_MAX_OPTIONS),
    correctOptionIndex: z.number().int().min(0),
    explanation: z.string().trim().max(2000).optional().default(""),
    topic: z.string().trim().max(200).optional().default(""),
    difficulty: difficultySchema.optional().default("MEDIUM"),
  })
  .refine((mcq) => mcq.correctOptionIndex < mcq.options.length, {
    message: "correctOptionIndex must point at one of the options.",
    path: ["correctOptionIndex"],
  })
  .refine(
    (mcq) =>
      new Set(mcq.options.map((option) => option.toLowerCase())).size ===
      mcq.options.length,
    { message: "Options must be distinct.", path: ["options"] }
  );

/**
 * The envelope only - each question is validated separately so one
 * malformed question doesn't throw away a whole batch of good ones
 * (see parseMcqResponse).
 */
export const mcqEnvelopeSchema = z.object({
  mode: z
    .preprocess(
      (value) => (typeof value === "string" ? value.trim().toUpperCase() : value),
      z.enum(["EXTRACTED", "GENERATED"])
    )
    .optional(),
  questions: z.array(z.unknown()),
});
