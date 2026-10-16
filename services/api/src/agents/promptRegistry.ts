import { EVALUATION_PROMPT_VERSION } from "./evaluation/prompts/buildEvaluationPrompt";
import { QUESTION_PROMPT_VERSION } from "./question/prompts/buildQuestionPrompt";
import { CONVERSATION_SUMMARY_PROMPT_VERSION } from "./conversation/prompts/buildConversationSummaryPrompt";
import { MCQ_PROMPT_VERSION } from "./mcq/prompts/buildMcqPrompt";

/**
 * ================================================================
 * Prompt Registry
 * ================================================================
 *
 * One place to see every prompt id in the system and its current
 * version. Each prompt's actual text lives next to the agent that
 * uses it (co-location beats a giant prompts/ dump), but the id +
 * version pair is re-exported here so:
 *
 *  - it's obvious at a glance what prompts exist and how many times
 *    each has changed
 *  - AiCallLog rows (see modules/ai-usage) can be joined back to
 *    "what prompt, what version" without hunting through agent code
 *  - bumping a prompt's behavior is a one-line version bump next to
 *    the prompt itself, and shows up here automatically
 *
 * Bump the version constant next to a prompt's definition whenever
 * its instructions or expected response shape changes meaningfully -
 * that keeps past AiCallLog rows an honest record of what actually
 * produced them.
 */
export const PROMPT_REGISTRY = {
  evaluation: EVALUATION_PROMPT_VERSION,
  question: QUESTION_PROMPT_VERSION,
  conversationSummary: CONVERSATION_SUMMARY_PROMPT_VERSION,
  mcqGeneration: MCQ_PROMPT_VERSION,
} as const;

export type PromptId = keyof typeof PROMPT_REGISTRY;
