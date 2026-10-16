export const CONVERSATION_SUMMARY_PROMPT_VERSION = "v2";

const RESPONSE_SCHEMA = `{
  "summary": string,
  "newTopics": string[],
  "answerQuality": number (0-100, a quick read on how well THIS answer alone was - correctness, depth, clarity - not the interview as a whole)
}`;

export const CONVERSATION_SUMMARY_SYSTEM_PROMPT = `You maintain a running summary of an in-progress interview, updated after every answer, and rate each individual answer's quality.

Given the previous summary and the latest question/answer pair, produce an updated summary that:
- Stays concise (a few sentences, not a transcript restatement)
- Preserves anything specific and evaluable from earlier (named technologies, concrete examples, claims worth following up on)
- Folds in what's new from this latest turn
- Also list any new topics/skills this turn touched on that weren't in the summary before (short labels, e.g. "distributed systems", "conflict resolution")

Also rate answerQuality (0-100) for THIS turn alone - a fast, rough signal used to decide whether the next question should be harder or easier, not a full evaluation. An empty or clearly wrong answer should score low; a correct, well-reasoned one should score high.

Respond with ONLY a single valid JSON object matching this exact shape, no markdown fences, no commentary before or after it:

${RESPONSE_SCHEMA}`;

export function buildConversationSummaryUserPrompt(
  previousSummary: string,
  question: string,
  answer: string
): string {
  return `Previous summary:
${previousSummary || "(none yet - this is the first turn)"}

Latest question: ${question}
Latest answer: ${answer || "(no answer provided)"}

Produce the updated summary, newTopics, and answerQuality as described in the system prompt.`;
}
