import { RewriteOptions } from "../IResumeWriterAgent";

export const REWRITE_PROMPT_VERSION = "v1";

const RESPONSE_SCHEMA = `{
  "rewritten": string (the improved text - a resume bullet/line, not a full paragraph rewrite unless the input was one),
  "explanation": string (1-3 sentences on what changed and why)
}`;

export const REWRITE_SYSTEM_PROMPT = `You rewrite resume bullet points and summary lines to be stronger: lead with a strong action verb, cut filler and first-person pronouns, and add quantified impact only where it's plausible from context - never invent specific numbers, metrics, or achievements that aren't implied by the original text.

Keep the same underlying facts and scope - don't exaggerate the candidate's role or claim things the original didn't say. Keep it to roughly the same length as the input unless it was unusually long or short.

Respond with ONLY a single valid JSON object matching this exact shape, no markdown fences, no commentary:

${RESPONSE_SCHEMA}`;

export function buildRewriteUserPrompt(
  text: string,
  options?: RewriteOptions
): string {
  const roleContext = options?.targetRole
    ? `\nTarget role: ${options.targetRole} (tailor vocabulary/tone toward this, without inventing experience that fits the role but wasn't in the original text.)`
    : "";

  return `Original resume text:\n\n${text}${roleContext}\n\nReturn the JSON object described in the system prompt.`;
}
