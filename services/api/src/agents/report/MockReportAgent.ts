import { IReportAgent, ReportNarrative, ReportNarrativeInput } from "./IReportAgent";

const RECOMMENDATION_PHRASES: Record<string, string> = {
  STRONG_HIRE: "is a strong hire recommendation",
  HIRE: "is recommended for hire",
  BORDERLINE: "is a borderline case worth a second look",
  NO_HIRE: "is not recommended for hire at this time",
};

/**
 * No AI call, no API key required. A template-filled summary rather
 * than a generated one - keeps the report flow working end-to-end
 * when AI_EVALUATION_PROVIDER is "mock" or every real provider is
 * unavailable.
 */
export class MockReportAgent implements IReportAgent {
  async generateNarrative(
    input: ReportNarrativeInput
  ): Promise<ReportNarrative> {
    const recommendationPhrase =
      RECOMMENDATION_PHRASES[input.hiringRecommendation] ??
      "requires manual review";

    const strengthsPhrase =
      input.strengths.length > 0
        ? `Notable strengths included ${input.strengths.slice(0, 2).join(" and ").toLowerCase()}.`
        : "";

    const weaknessPhrase =
      input.weakTopics.length > 0
        ? `The clearest area to improve is ${input.weakTopics[0].toLowerCase()}.`
        : "";

    const executiveSummary = [
      `${input.candidateName} scored ${input.overallScore}/100 on a ${input.interviewLevel.toLowerCase()} ${input.interviewType.toLowerCase()} interview ("${input.interviewTitle}") and ${recommendationPhrase}.`,
      strengthsPhrase,
      weaknessPhrase,
    ]
      .filter(Boolean)
      .join(" ");

    return {
      executiveSummary,
      candidateFeedback: [
        `Thanks for completing the interview, ${input.candidateName}.`,
        strengthsPhrase,
        weaknessPhrase,
        "Keep practicing and you'll continue to improve.",
      ]
        .filter(Boolean)
        .join(" "),
      recruiterBrief: `${input.candidateName} ${recommendationPhrase} with a score of ${input.overallScore}/100. ${strengthsPhrase} ${weaknessPhrase}`.trim(),
      executiveDigest: `${input.candidateName} interviewed at ${input.interviewLevel.toLowerCase()} level and ${recommendationPhrase}. Overall score: ${input.overallScore}/100.`,
    };
  }
}
