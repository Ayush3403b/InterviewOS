export interface LLMGenerateOptions {
  /** System/instruction prompt. */
  system: string;

  /** The actual task prompt (e.g. the interview transcript to evaluate). */
  prompt: string;

  /** Upper bound on output tokens. Providers may apply their own default. */
  maxTokens?: number;

  /**
   * Identifies which prompt this call is for (e.g. "evaluation",
   * "question"). Purely for telemetry/cost-tracking - providers
   * ignore it. See PersistingLLMClient.
   */
  promptId?: string;

  promptVersion?: string;

  /** For attributing cost-tracking rows to a session/user. Ignored by providers. */
  interviewSessionId?: string;

  userId?: string;
}

export interface LLMGenerateResult {
  /** Raw text returned by the model - callers are responsible for parsing it. */
  text: string;

  /** Which provider actually produced this result (useful with fallback chains). */
  provider: string;

  /** The specific model that answered. */
  model: string;

  /** Wall-clock time for the call, in milliseconds. */
  latencyMs: number;

  /** Combined input+output tokens, when the provider reports it. */
  tokensUsed?: number;
}

/**
 * A single, provider-agnostic way to talk to an LLM.
 *
 * Business logic (evaluation, question generation, coaching, etc.) should
 * only ever depend on this interface - never on a specific provider's
 * client or SDK. That's what makes providers swappable via DI instead of
 * a factory: whoever wires up the container decides which ILLMClient
 * implementation(s) to construct.
 */
export interface ILLMClient {
  /** Identifies this client in logs/telemetry, e.g. "claude", "openai". */
  readonly provider: string;

  generate(options: LLMGenerateOptions): Promise<LLMGenerateResult>;
}
