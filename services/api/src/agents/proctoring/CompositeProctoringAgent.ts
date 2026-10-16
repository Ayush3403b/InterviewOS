import {
  IProctoringAgent,
  ProctoringAnalysisResult,
  ProctoringSignalInput,
} from "./IProctoringAgent";

/**
 * Runs several IProctoringAgent implementations in parallel and
 * merges their output into a single result.
 *
 * This is the extension point for scaling up detection quality over
 * time without touching ProctoringService, the controller, or the
 * socket gateway: e.g.
 *
 *   new CompositeProctoringAgent([
 *     new RuleBasedProctoringAgent(),
 *     new MediaPipeAssistedProctoringAgent(),
 *     new HostedVisionProctoringAgent(),   // snapshot-based, low frequency
 *   ])
 *
 * Each agent only needs to know how to read a ProctoringSignalInput
 * and return flags - they don't need to know about each other, the
 * database, or the socket layer.
 */
export class CompositeProctoringAgent implements IProctoringAgent {
  public readonly provider: string;

  constructor(private readonly agents: IProctoringAgent[]) {
    this.provider = agents.length
      ? `composite(${agents.map((a) => a.provider).join("+")})`
      : "composite(empty)";
  }

  async analyze(
    input: ProctoringSignalInput
  ): Promise<ProctoringAnalysisResult> {
    const results = await Promise.allSettled(
      this.agents.map((agent) => agent.analyze(input))
    );

    const flags: ProctoringAnalysisResult["flags"] = [];
    let trustScoreDelta = 0;

    for (const result of results) {
      if (result.status === "fulfilled") {
        flags.push(...result.value.flags);
        trustScoreDelta += result.value.trustScoreDelta;
      }
      // A single failing agent (e.g. a hosted vision API timeout)
      // should never break continuous tracking for the rest.
    }

    return {
      flags,
      trustScoreDelta,
      metadata: { provider: this.provider },
    };
  }
}
