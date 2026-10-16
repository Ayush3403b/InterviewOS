import { IReportAgent, ReportNarrative, ReportNarrativeInput } from "./IReportAgent";
import { ILLMClient } from "../llm/ILLMClient";

import {
  REPORT_PROMPT_VERSION,
  REPORT_SYSTEM_PROMPT,
  buildReportUserPrompt,
} from "./prompts/buildReportPrompt";
import { parseReportNarrative } from "./prompts/parseReportNarrative";

export interface LLMReportAgentOptions {
  validationRetryAttempts?: number;
}

export class LLMReportAgent implements IReportAgent {
  private readonly validationRetryAttempts: number;

  constructor(
    private readonly llmClient: ILLMClient,
    options: LLMReportAgentOptions = {}
  ) {
    this.validationRetryAttempts = options.validationRetryAttempts ?? 2;
  }

  async generateNarrative(
    input: ReportNarrativeInput
  ): Promise<ReportNarrative> {
    const prompt = buildReportUserPrompt(input);

    let lastError: unknown;

    for (
      let attempt = 1;
      attempt <= this.validationRetryAttempts;
      attempt++
    ) {
      const result = await this.llmClient.generate({
        system: REPORT_SYSTEM_PROMPT,
        prompt,
        promptId: "report-narrative",
        promptVersion: REPORT_PROMPT_VERSION,
      });

      try {
        return parseReportNarrative(result.text);
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError;
  }
}
