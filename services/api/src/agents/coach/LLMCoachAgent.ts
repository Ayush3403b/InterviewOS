import { CoachingInput, CoachingPlan, ICoachAgent } from "./ICoachAgent";
import { ILLMClient } from "../llm/ILLMClient";

import {
  COACH_PROMPT_VERSION,
  COACH_SYSTEM_PROMPT,
  buildCoachUserPrompt,
} from "./prompts/buildCoachPrompt";
import { parseCoachResponse } from "./prompts/parseCoachResponse";

export interface LLMCoachAgentOptions {
  validationRetryAttempts?: number;
}

export class LLMCoachAgent implements ICoachAgent {
  private readonly validationRetryAttempts: number;

  constructor(
    private readonly llmClient: ILLMClient,
    options: LLMCoachAgentOptions = {}
  ) {
    this.validationRetryAttempts = options.validationRetryAttempts ?? 2;
  }

  async generateCoaching(input: CoachingInput): Promise<CoachingPlan> {
    const prompt = buildCoachUserPrompt(input);

    let lastError: unknown;

    for (
      let attempt = 1;
      attempt <= this.validationRetryAttempts;
      attempt++
    ) {
      const result = await this.llmClient.generate({
        system: COACH_SYSTEM_PROMPT,
        prompt,
        promptId: "coaching-plan",
        promptVersion: COACH_PROMPT_VERSION,
      });

      try {
        return parseCoachResponse(result.text);
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError;
  }
}
