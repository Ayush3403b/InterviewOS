import { IQuestionAgent, GeneratedQuestion } from "./IQuestionAgent";
import { ILLMClient } from "../llm/ILLMClient";

import { InterviewSessionDocument } from "../../modules/interview-session/types/interview-session.types";
import { ConversationDocument } from "../../modules/conversation/types/conversation.types";
import { InterviewContextDocument } from "../../modules/interview-context/types/interview-context.types";
import { SectionName } from "../../modules/interview-session/types/interview-session.types";

import {
  QUESTION_PROMPT_VERSION,
  QUESTION_SYSTEM_PROMPT,
  buildQuestionUserPrompt,
} from "./prompts/buildQuestionPrompt";
import { parseQuestionResponse } from "./prompts/parseQuestionResponse";

export interface LLMQuestionAgentOptions {
  validationRetryAttempts?: number;
}

/**
 * The one dynamic question agent for every real AI provider - same
 * shape as LLMEvaluationAgent. Depends only on ILLMClient, so the
 * provider (or a fallback chain) is decided entirely by container
 * wiring, never by this class.
 */
export class LLMQuestionAgent implements IQuestionAgent {
  private readonly validationRetryAttempts: number;

  constructor(
    private readonly llmClient: ILLMClient,
    options: LLMQuestionAgentOptions = {}
  ) {
    this.validationRetryAttempts = options.validationRetryAttempts ?? 2;
  }

  async generateNextQuestion(
    interview: InterviewSessionDocument,
    context: InterviewContextDocument | null,
    previousTurns: ConversationDocument[],
    currentSection?: SectionName
  ): Promise<GeneratedQuestion> {
    const userPrompt = buildQuestionUserPrompt(
      interview,
      context,
      previousTurns,
      currentSection
    );

    let lastError: unknown;

    for (
      let attempt = 1;
      attempt <= this.validationRetryAttempts;
      attempt++
    ) {
      const result = await this.llmClient.generate({
        system: QUESTION_SYSTEM_PROMPT,
        prompt: userPrompt,
        promptId: "question",
        promptVersion: QUESTION_PROMPT_VERSION,
        interviewSessionId: interview.id,
        userId: interview.userId?.toString(),
      });

      try {
        return parseQuestionResponse(result.text);
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError;
  }
}

