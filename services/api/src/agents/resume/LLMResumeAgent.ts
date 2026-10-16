import { IResumeAgent, ResumeAnalysis } from "./IResumeAgent";
import { ILLMClient } from "../llm/ILLMClient";

import {
  RESUME_PROMPT_VERSION,
  RESUME_SYSTEM_PROMPT,
  buildResumeUserPrompt,
} from "./prompts/buildResumePrompt";
import { parseResumeResponse } from "./prompts/parseResumeResponse";

export interface LLMResumeAgentOptions {
  validationRetryAttempts?: number;
}

export class LLMResumeAgent implements IResumeAgent {
  private readonly validationRetryAttempts: number;

  constructor(
    private readonly llmClient: ILLMClient,
    options: LLMResumeAgentOptions = {}
  ) {
    this.validationRetryAttempts = options.validationRetryAttempts ?? 2;
  }

  async analyze(rawText: string): Promise<ResumeAnalysis> {
    const prompt = buildResumeUserPrompt(rawText);

    let lastError: unknown;

    for (
      let attempt = 1;
      attempt <= this.validationRetryAttempts;
      attempt++
    ) {
      const result = await this.llmClient.generate({
        system: RESUME_SYSTEM_PROMPT,
        prompt,
        promptId: "resume-analysis",
        promptVersion: RESUME_PROMPT_VERSION,
      });

      try {
        return parseResumeResponse(result.text);
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError;
  }
}
