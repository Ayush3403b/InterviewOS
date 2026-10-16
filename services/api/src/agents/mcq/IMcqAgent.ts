import { LLMAttachment } from "../llm/ILLMClient";

export type McqDifficultyLevel = "EASY" | "MEDIUM" | "HARD";

/** "MIXED" asks for a spread across all three levels. */
export type McqDifficultyChoice = McqDifficultyLevel | "MIXED";

/**
 * How to treat uploaded material:
 *  - EXTRACT:  it already contains MCQs - copy them over faithfully
 *  - GENERATE: it's study material - write new questions from it
 *  - AUTO:     let the model decide which of the two it's looking at
 */
export type McqMaterialMode = "AUTO" | "EXTRACT" | "GENERATE";

export interface GeneratedMcq {
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  topic: string;
  difficulty: McqDifficultyLevel;
}

interface McqGenerationBase {
  /** Upper bound - extraction may find fewer questions than this. */
  count: number;
  difficulty: McqDifficultyChoice;
  /** Free-text guidance from the test author, e.g. "focus on chapter 3". */
  instructions?: string;
  /** Question texts already in the test, so the model doesn't repeat them. */
  existingQuestions?: string[];
  /** For cost-tracking attribution only. */
  userId?: string;
}

export interface McqFromTopicsInput extends McqGenerationBase {
  topics: string;
}

export interface McqFromMaterialInput extends McqGenerationBase {
  mode: McqMaterialMode;
  /** Text pulled out of text-based PDFs. */
  text?: string;
  /** Images and scanned PDFs, read by the model directly. */
  attachments?: LLMAttachment[];
}

export interface McqMaterialResult {
  /** What the model actually did - relevant when mode was AUTO. */
  mode: "EXTRACTED" | "GENERATED";
  questions: GeneratedMcq[];
}

export interface IMcqAgent {
  generateFromTopics(input: McqFromTopicsInput): Promise<GeneratedMcq[]>;

  generateFromMaterial(input: McqFromMaterialInput): Promise<McqMaterialResult>;
}
