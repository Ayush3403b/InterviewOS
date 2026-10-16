import { ReportNarrativeInput } from "../IReportAgent";

export const REPORT_PROMPT_VERSION = "v2";

const RESPONSE_SCHEMA = `{
  "executiveSummary": string (2-4 sentences written for a recruiter skimming this report, lead with hiring signal),
  "candidateFeedback": string (2-4 sentences written directly to the candidate in a warm, growth-oriented tone; acknowledge strengths before areas to improve),
  "recruiterBrief": string (2-3 sentences for a busy recruiter: lead with the hire/no-hire recommendation, support with strongest evidence, close with any key risk),
  "executiveDigest": string (one paragraph for a hiring manager or executive with no interview context; no jargon; focus on hiring signal and business fit)
}`;

export const REPORT_SYSTEM_PROMPT = `You are writing four audience-specific summaries for an interview report.

Base every summary strictly on the data given - do not invent details. Each summary must be clearly distinct in tone and content, tailored to its named audience. Be direct and specific, not generic.

Respond with ONLY a single valid JSON object matching this exact shape, no markdown fences, no commentary before or after it:

${RESPONSE_SCHEMA}`;

export function buildReportUserPrompt(input: ReportNarrativeInput): string {
  return `Candidate: ${input.candidateName}
Interview: ${input.interviewTitle} (${input.interviewType}, ${input.interviewLevel})
Overall Score: ${input.overallScore}/100
Hiring Recommendation: ${input.hiringRecommendation}

Strengths
${input.strengths.map((item) => `- ${item}`).join("\n") || "(none listed)"}

Weaknesses
${input.weaknesses.map((item) => `- ${item}`).join("\n") || "(none listed)"}

Weak Topics (from coaching analysis)
${input.weakTopics.map((item) => `- ${item}`).join("\n") || "(none listed)"}

Write all four narrative summaries and return the JSON object described in the system prompt.`;
}
