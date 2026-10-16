import { IConversationAgent, ConversationSummaryResult } from "./IConversationAgent";

const MAX_SUMMARY_LENGTH = 1000;

function estimateAnswerQuality(answer: string): number {
  const trimmed = answer.trim();

  if (trimmed.length === 0) {
    return 0;
  }

  const wordCount = trimmed.split(/\s+/).length;

  if (wordCount < 5) return 20;
  if (wordCount < 15) return 45;
  if (wordCount < 40) return 65;
  return 75;
}

/**
 * No LLM call - appends a truncated version of each answer to the
 * running summary instead of a real abstractive summary, and extracts
 * no topics. Good enough to keep the pipeline functional end-to-end
 * without an API key; swapped for LLMConversationAgent for real use.
 */
export class MockConversationAgent implements IConversationAgent {
  async summarizeTurn(
    previousSummary: string,
    question: string,
    answer: string
  ): Promise<ConversationSummaryResult> {
    const snippet = `${question} -> ${(answer || "(no answer)").slice(0, 140)}`;

    const combined = previousSummary
      ? `${previousSummary}\n${snippet}`
      : snippet;

    return {
      summary: combined.slice(-MAX_SUMMARY_LENGTH),
      newTopics: [],
      answerQuality: estimateAnswerQuality(answer),
    };
  }
}
