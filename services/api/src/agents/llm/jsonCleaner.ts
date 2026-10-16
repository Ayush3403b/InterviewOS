/**
 * services/api/src/agents/llm/jsonCleaner.ts
 *
 * Robust JSON extraction & fallback cleaning for LLM outputs.
 * Handles free-tier LLM quirks (Gemini / GPT / Claude):
 * - Strips <thought> and <thinking> tags
 * - Strips markdown code blocks (```json ... ```)
 * - Locates outermost balanced JSON object or array even with preambles
 * - Cleans trailing commas and minor syntax errors before JSON.parse
 */

export function cleanJsonString(raw: string): string {
  if (!raw || typeof raw !== "string") {
    return "{}";
  }

  let text = raw.trim();

  // 1. Strip thought/thinking tags
  text = text.replace(/<thought[\s\S]*?<\/thought>/gi, "");
  text = text.replace(/<thinking[\s\S]*?<\/thinking>/gi, "");

  // 2. Extract content from code fences if present
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    text = fenceMatch[1].trim();
  }

  // 3. Find outermost matching braces { ... } or [ ... ]
  const firstBrace = text.indexOf("{");
  const firstBracket = text.indexOf("[");

  let startIndex = -1;
  let endIndex = -1;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIndex = firstBrace;
    endIndex = text.lastIndexOf("}");
  } else if (firstBracket !== -1) {
    startIndex = firstBracket;
    endIndex = text.lastIndexOf("]");
  }

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    text = text.slice(startIndex, endIndex + 1);
  }

  // 4. Clean trailing commas before closing braces/brackets
  text = text.replace(/,\s*([}\]])/g, "$1");

  return text.trim();
}

/**
 * Safely parses an LLM response string into a typed object with fallback cleaning.
 */
export function safeExtractJson<T = unknown>(raw: string): T {
  const cleaned = cleanJsonString(raw);

  try {
    return JSON.parse(cleaned) as T;
  } catch (firstErr) {
    // Secondary fallback: remove any unescaped control characters
    const sanitized = cleaned.replace(/[\u0000-\u001F\u007F-\u009F]/g, (c) =>
      c === "\n" || c === "\r" || c === "\t" ? c : ""
    );

    try {
      return JSON.parse(sanitized) as T;
    } catch {
      throw new Error(`Failed to parse cleaned LLM response as JSON: ${cleaned.slice(0, 100)}...`);
    }
  }
}
