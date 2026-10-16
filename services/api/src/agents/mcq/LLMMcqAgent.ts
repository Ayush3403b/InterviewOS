import {
  GeneratedMcq,
  IMcqAgent,
  McqFromMaterialInput,
  McqFromTopicsInput,
  McqMaterialResult,
} from "./IMcqAgent";
import { ILLMClient, LLMAttachment } from "../llm/ILLMClient";

import {
  MCQ_MATERIAL_SYSTEM_PROMPT,
  MCQ_PROMPT_VERSION,
  MCQ_TOPICS_SYSTEM_PROMPT,
  buildMcqMaterialUserPrompt,
  buildMcqTopicsUserPrompt,
} from "./prompts/buildMcqPrompt";
import { ParsedMcqResponse, parseMcqResponse } from "./prompts/parseMcqResponse";

export interface LLMMcqAgentOptions {
  validationRetryAttempts?: number;
}

/**
 * A batch of ~25 questions with explanations is far past Claude's
 * 4096-token client default; every configured provider's current
 * models allow at least this much output.
 */
const MAX_OUTPUT_TOKENS = 16_384;

/**
 * Same shape as the other LLM agents: depends only on ILLMClient, so
 * which provider (or fallback chain) answers is decided by container
 * wiring. Material with images/scanned PDFs is passed straight to the
 * model as attachments - see ILLMClient's LLMAttachment.
 */
export class LLMMcqAgent implements IMcqAgent {
  private readonly validationRetryAttempts: number;

  constructor(
    private readonly llmClient: ILLMClient,
    options: LLMMcqAgentOptions = {}
  ) {
    this.validationRetryAttempts = options.validationRetryAttempts ?? 2;
  }

  async generateFromTopics(input: McqFromTopicsInput): Promise<GeneratedMcq[]> {
    const parsed = await this.generate(
      MCQ_TOPICS_SYSTEM_PROMPT,
      buildMcqTopicsUserPrompt(input),
      input.userId
    );

    return parsed.questions.slice(0, input.count);
  }

  async generateFromMaterial(
    input: McqFromMaterialInput
  ): Promise<McqMaterialResult> {
    const parsed = await this.generate(
      MCQ_MATERIAL_SYSTEM_PROMPT,
      buildMcqMaterialUserPrompt(input),
      input.userId,
      input.attachments
    );

    return {
      mode:
        parsed.mode ?? (input.mode === "EXTRACT" ? "EXTRACTED" : "GENERATED"),
      questions: parsed.questions.slice(0, input.count),
    };
  }

  private async generate(
    system: string,
    prompt: string,
    userId?: string,
    attachments?: LLMAttachment[]
  ): Promise<ParsedMcqResponse> {
    let lastError: unknown;

    for (
      let attempt = 1;
      attempt <= this.validationRetryAttempts;
      attempt++
    ) {
      const result = await this.llmClient.generate({
        system,
        prompt,
        attachments,
        maxTokens: MAX_OUTPUT_TOKENS,
        promptId: "mcqGeneration",
        promptVersion: MCQ_PROMPT_VERSION,
        userId,
      });

      try {
        return parseMcqResponse(result.text);
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError;
  }
}
