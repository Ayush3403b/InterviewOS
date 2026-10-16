/**
 * Rough USD-per-1K-token blended rates, used only to produce an
 * *estimate* for cost tracking/telemetry - not a billing-accurate
 * figure (real cost depends on the input/output split, which
 * ILLMClient doesn't currently report separately, and provider rate
 * cards change over time). Good enough to spot a runaway prompt or
 * compare providers at a glance; treat any single number as
 * approximate.
 */
const BLENDED_RATE_PER_1K_TOKENS: Record<string, number> = {
  claude: 0.006,
  openai: 0.003,
  gemini: 0.0015,
};

export function estimateCostUsd(
  provider: string,
  tokensUsed: number | undefined
): number | undefined {
  if (tokensUsed === undefined) {
    return undefined;
  }

  const rate = BLENDED_RATE_PER_1K_TOKENS[provider];

  if (rate === undefined) {
    return undefined;
  }

  return Number(((tokensUsed / 1000) * rate).toFixed(6));
}
