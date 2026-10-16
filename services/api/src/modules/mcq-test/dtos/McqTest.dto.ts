import { z } from "zod";

import {
  CreateMcqTestBody,
  GenerateFromTopicsBody,
  ImportFromMaterialBody,
  McqQuestionInput,
  SaveAnswerBody,
  SubmitAttemptBody,
  UpdateMcqTestBody,
} from "../validations/McqTest.validation";

/*
 * Derived from the validation schemas (rather than hand-written
 * interfaces) because controllers pass the *parsed* body through -
 * these are exactly what services receive.
 */

export type CreateMcqTestDto = z.infer<typeof CreateMcqTestBody>;

export type UpdateMcqTestDto = z.infer<typeof UpdateMcqTestBody>;

export type McqQuestionInputDto = z.infer<typeof McqQuestionInput>;

export type GenerateFromTopicsDto = z.infer<typeof GenerateFromTopicsBody>;

export type ImportFromMaterialDto = z.infer<typeof ImportFromMaterialBody>;

export type SaveAnswerDto = z.infer<typeof SaveAnswerBody>;

export type SubmitAttemptDto = z.infer<typeof SubmitAttemptBody>;
