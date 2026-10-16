export const GRAMMAR_CHECK_PROMPT_VERSION = "v1";

const RESPONSE_SCHEMA = `{
  "score": number (0-100, how clean/professional the writing is),
  "issues": [{
    "type": "passive_voice" | "weak_opener" | "no_quantification" | "personal_pronoun" | "repeated_word" | "sentence_too_long" | "other",
    "excerpt": string (optional - the specific phrase this issue applies to),
    "message": string (what's wrong, specific to this text),
    "suggestion": string (optional - a concrete fix)
  }]
}`;

export const GRAMMAR_CHECK_SYSTEM_PROMPT = `You are reviewing resume writing for grammar, tone, and resume-specific conventions (not general prose).

Flag real issues only - don't invent problems in text that reads fine. Common resume issues worth flagging: passive voice, weak opening verbs ("responsible for", "worked on"), missing quantified impact (numbers, percentages, scale), first-person pronouns ("I", "my"), repeated words, and overly long run-on sentences.

Respond with ONLY a single valid JSON object matching this exact shape, no markdown fences, no commentary:

${RESPONSE_SCHEMA}`;

export function buildGrammarCheckUserPrompt(text: string): string {
  return `Resume text to review:\n\n${text}\n\nReturn the JSON object described in the system prompt.`;
}
