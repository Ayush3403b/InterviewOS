import { z } from "zod";

import {
  MCQ_LIMITS,
  McqDifficulty,
  McqSubmitReason,
} from "../types/mcq-test.types";

/*
 * Request bodies are parsed in the controllers (see parseBody.ts)
 * rather than by the shared validate() middleware, so services get the
 * trimmed/coerced output instead of the raw body, and a failure comes
 * back as a specific message in the standard error envelope.
 */

/* -------------------------------------------------------------------------- */
/*                                Test settings                                */
/* -------------------------------------------------------------------------- */

const settingsShape = {
  title: z
    .string()
    .trim()
    .min(3, "Title must contain at least 3 characters.")
    .max(150, "Title cannot exceed 150 characters."),

  description: z.string().trim().max(2000).optional(),

  instructions: z.string().trim().max(4000).optional(),

  durationMinutes: z
    .number()
    .int()
    .min(MCQ_LIMITS.minDurationMinutes, "Duration must be at least 1 minute.")
    .max(MCQ_LIMITS.maxDurationMinutes, "Duration cannot exceed 300 minutes."),

  passPercentage: z.number().min(0).max(100).optional(),

  shuffleQuestions: z.boolean().optional(),

  shuffleOptions: z.boolean().optional(),

  showScoreToCandidate: z.boolean().optional(),
};

export const CreateMcqTestBody = z.object(settingsShape);


export const UpdateMcqTestBody = z
  .object(settingsShape)
  .partial()
  .refine((body) => Object.keys(body).length > 0, {
    message: "Nothing to update.",
  });


/* -------------------------------------------------------------------------- */
/*                                  Questions                                  */
/* -------------------------------------------------------------------------- */

export const McqQuestionInput = z
  .object({
    /** Present for questions that already exist - kept so ids stay stable. */
    id: z.string().optional(),

    text: z
      .string()
      .trim()
      .min(1, "Question text is required.")
      .max(MCQ_LIMITS.questionMaxLength),

    options: z
      .array(
        z
          .string()
          .trim()
          .min(1, "Options can't be empty.")
          .max(MCQ_LIMITS.optionMaxLength)
      )
      .min(MCQ_LIMITS.minOptions, "Add at least 2 options.")
      .max(MCQ_LIMITS.maxOptions, "At most 6 options."),

    correctOptionIndex: z.number().int().min(0),

    explanation: z.string().trim().max(MCQ_LIMITS.explanationMaxLength).optional(),

    topic: z.string().trim().max(200).optional(),

    difficulty: z.nativeEnum(McqDifficulty).optional(),

    points: z.number().int().min(1).max(MCQ_LIMITS.maxPoints).optional(),
  })
  .refine((question) => question.correctOptionIndex < question.options.length, {
    message: "Pick which option is correct.",
    path: ["correctOptionIndex"],
  })
  .refine(
    (question) =>
      new Set(question.options.map((option) => option.toLowerCase())).size ===
      question.options.length,
    { message: "Options must be different from each other.", path: ["options"] }
  );

export const ReplaceQuestionsBody = z.object({
  questions: z
    .array(McqQuestionInput)
    .max(
      MCQ_LIMITS.maxQuestionsPerTest,
      `A test can have at most ${MCQ_LIMITS.maxQuestionsPerTest} questions.`
    ),
});


/* -------------------------------------------------------------------------- */
/*                                AI generation                                */
/* -------------------------------------------------------------------------- */

const difficultyChoice = z.enum(["EASY", "MEDIUM", "HARD", "MIXED"]);

const generationCount = z.coerce
  .number()
  .int()
  .min(1, "Ask for at least 1 question.")
  .max(
    MCQ_LIMITS.maxGeneratedPerRequest,
    `At most ${MCQ_LIMITS.maxGeneratedPerRequest} questions per request - run it again for more.`
  );

export const GenerateFromTopicsBody = z.object({
  topics: z
    .string()
    .trim()
    .min(2, "Describe at least one topic.")
    .max(2000),

  count: generationCount,

  difficulty: difficultyChoice.default("MIXED"),

  instructions: z.string().trim().max(1000).optional(),
});


/** Multipart form fields - everything arrives as strings, hence coerce. */
export const ImportFromMaterialBody = z.object({
  count: generationCount,

  difficulty: difficultyChoice.default("MIXED"),

  mode: z.enum(["AUTO", "EXTRACT", "GENERATE"]).default("AUTO"),

  instructions: z.string().trim().max(1000).optional(),
});


/* -------------------------------------------------------------------------- */
/*                                   Attempts                                  */
/* -------------------------------------------------------------------------- */

export const SaveAnswerBody = z.object({
  questionId: z.string().min(1),

  /** Index into the question's original options; null clears the answer. */
  selectedOptionIndex: z
    .number()
    .int()
    .min(0)
    .max(MCQ_LIMITS.maxOptions - 1)
    .nullable(),
});


export const SubmitAttemptBody = z.object({
  reason: z.nativeEnum(McqSubmitReason).default(McqSubmitReason.MANUAL),
});

