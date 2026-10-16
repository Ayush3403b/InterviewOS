import { IConversationAgent, ConversationSummaryResult } from "./IConversationAgent";
import { ILLMClient } from "../llm/ILLMClient";

import {
  CONVERSATION_SUMMARY_PROMPT_VERSION,
  CONVERSATION_SUMMARY_SYSTEM_PROMPT,
  buildConversationSummaryUserPrompt,
} from "./prompts/buildConversationSummaryPrompt";
import { parseConversationSummaryResponse } from "./prompts/parseConversationSummaryResponse";

export interface LLMConversationAgentOptions {
  validationRetryAttempts?: number;
}

/**
 * Keeps the interview's "AI memory" (InterviewContext.transcriptSummary
 * + topicsCovered) up to date after every answer, instead of every
 * agent re-reading the full raw transcript from scratch each time.
 * Same ILLMClient-only dependency pattern as the other LLM agents.
 */
export class LLMConversationAgent implements IConversationAgent {
  private readonly validationRetryAttempts: number;

  constructor(
    private readonly llmClient: ILLMClient,
    options: LLMConversationAgentOptions = {}
  ) {
    this.validationRetryAttempts = options.validationRetryAttempts ?? 2;
  }

  async summarizeTurn(
    previousSummary: string,
    question: string,
    answer: string
  ): Promise<ConversationSummaryResult> {
    const userPrompt = buildConversationSummaryUserPrompt(
      previousSummary,
      question,
      answer
    );

    let lastError: unknown;

    for (
      let attempt = 1;
      attempt <= this.validationRetryAttempts;
      attempt++
    ) {
      const result = await this.llmClient.generate({
        system: CONVERSATION_SUMMARY_SYSTEM_PROMPT,
        prompt: userPrompt,
        promptId: "conversationSummary",
        promptVersion: CONVERSATION_SUMMARY_PROMPT_VERSION,
      });

      try {
        return parseConversationSummaryResponse(result.text);
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError;
  }
}
