import { CoachingInput } from "../ICoachAgent";

export const COACH_PROMPT_VERSION = "v1";

const RESPONSE_SCHEMA = `{
  "personalizedFeedback": string (2-4 sentences, direct and specific to this candidate's actual performance),
  "weakTopics": string[] (specific skill/topic names, not vague categories),
  "learningRoadmap": [{ "topic": string, "action": string, "priority": "HIGH" | "MEDIUM" | "LOW" }],
  "recommendedResources": [{ "title": string, "type": "COURSE" | "ARTICLE" | "PRACTICE" | "VIDEO", "reason": string, "url": string (optional) }],
  "careerGuidance": string (1-3 sentences)
}`;

export const COACH_SYSTEM_PROMPT = `You are an expert interview coach helping a candidate improve after a completed interview.

Base every piece of feedback strictly on the evaluation data given - don't invent skills, scores, or events that weren't in it. Be specific and actionable, not generic encouragement.

Respond with ONLY a single valid JSON object matching this exact shape, no markdown fences, no commentary:

${RESPONSE_SCHEMA}`;

export function buildCoachUserPrompt(input: CoachingInput): string {
  return `Interview Details
Type: ${input.interviewType}
Level: ${input.interviewLevel}
Hiring Recommendation: ${input.hiringRecommendation}

Scores
Overall: ${input.overallScore}/100
Technical: ${input.skillScores.technical}/100
Communication: ${input.skillScores.communication}/100
Problem Solving: ${input.skillScores.problemSolving}/100
Confidence: ${input.skillScores.confidence}/100

Strengths
${input.strengths.map((item) => `- ${item}`).join("\n") || "(none listed)"}

Weaknesses
${input.weaknesses.map((item) => `- ${item}`).join("\n") || "(none listed)"}

Evaluation Summary
${input.overallSummary}

Generate a coaching plan for this candidate and return the JSON object described in the system prompt.`;
}
