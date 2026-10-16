import { IEvaluationAgent } from "./IEvaluationAgent";
import { ILLMClient } from "../llm/ILLMClient";

import { InterviewSessionDocument } from "../../modules/interview-session/types/interview-session.types";
import { ConversationDocument } from "../../modules/conversation/types/conversation.types";
import { CompleteEvaluationDto } from "../../modules/evaluation/dtos/CompleteEvaluation.dto";

import {
  EVALUATION_PROMPT_VERSION,
  EVALUATION_SYSTEM_PROMPT,
  buildEvaluationUserPrompt,
} from "./prompts/buildEvaluationPrompt";
import { parseEvaluationResponse } from "./prompts/parseEvaluationResponse";

export interface LLMEvaluationAgentOptions {
  /**
   * Full generate+validate cycles to attempt if the model's response
   * fails schema validation. Distinct from the ILLMClient's own
   * network-level retries.
   */
  validationRetryAttempts?: number;
}

/**
 * The one evaluation agent for every real AI provider. It knows nothing
 * about Claude/OpenAI/Gemini specifically - it only depends on
 * ILLMClient, which is injected by whoever wires the container.
 *
 * Swapping providers, or fronting several providers behind a fallback
 * chain, never touches this class - only the ILLMClient passed in.
 */
export class LLMEvaluationAgent implements IEvaluationAgent {
  private readonly validationRetryAttempts: number;

  constructor(
    private readonly llmClient: ILLMClient,
    options: LLMEvaluationAgentOptions = {}
  ) {
    this.validationRetryAttempts = options.validationRetryAttempts ?? 2;
  }

  async evaluate(
    interview: InterviewSessionDocument,
    conversation: ConversationDocument[]
  ): Promise<CompleteEvaluationDto> {
    const userPrompt = buildEvaluationUserPrompt(interview, conversation);

    let lastError: unknown;

    for (
      let attempt = 1;
      attempt <= this.validationRetryAttempts;
      attempt++
    ) {
      const result = await this.llmClient.generate({
        system: EVALUATION_SYSTEM_PROMPT,
        prompt: userPrompt,
        promptId: "evaluation",
        promptVersion: EVALUATION_PROMPT_VERSION,
        interviewSessionId: interview.id,
        userId: interview.userId?.toString(),
      });

      try {
        return parseEvaluationResponse(result.text, {
          provider: result.provider,
          model: result.model,
          latencyMs: result.latencyMs,
          tokensUsed: result.tokensUsed,
        });
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError;
  }
}
