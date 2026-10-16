import { InterviewSessionDocument } from "../../../modules/interview-session/types/interview-session.types";
import { ConversationDocument } from "../../../modules/conversation/types/conversation.types";

/**
 * One prompt builder shared by every provider (Claude, OpenAI, Gemini, ...).
 *
 * Keeping this in one place means every provider is scored against the
 * exact same instructions, so switching providers doesn't change what
 * "good" looks like.
 */

/**
 * Bump this whenever EVALUATION_SYSTEM_PROMPT or the response schema
 * changes meaningfully, so past evaluations' metadata.promptVersion
 * stays an honest record of what actually produced them.
 */
export const EVALUATION_PROMPT_VERSION = "v2";

const RESPONSE_SCHEMA = `{
  "overallScore": number (0-100),
  "skillScores": {
    "technical": number (0-100),
    "communication": number (0-100),
    "problemSolving": number (0-100),
    "confidence": number (0-100),
    "leadership": number (0-100, score on initiative, influence, ownership, decisiveness),
    "criticalThinking": number (0-100, score on reasoning quality, nuance, hypothesis testing, identifying assumptions)
  },
  "strengths": string[],
  "weaknesses": string[],
  "recommendations": string[],
  "overallSummary": string,
  "hiringRecommendation": "STRONG_HIRE" | "HIRE" | "BORDERLINE" | "NO_HIRE",
  "questionEvaluations": [
    {
      "turnNumber": number,
      "question": string,
      "answer": string,
      "score": number (0-100),
      "feedback": string
    }
  ],
  "skillGaps": [
    {
      "skill": string (name of the skill that needs improvement),
      "currentLevel": number (0-100, mirrors the skill score),
      "targetLevel": number (0-100, the benchmark a strong candidate at this level/role should meet),
      "priority": "high" | "medium" | "low",
      "actionableSteps": string[] (2-4 concrete, specific things the candidate can do to close this gap)
    }
  ]
}`;

export const EVALUATION_SYSTEM_PROMPT = `You are an expert technical interviewer evaluating a candidate's interview performance.

Evaluate the transcript strictly on its own merits. Be fair, specific, and evidence-based - every score and piece of feedback must be justified by something the candidate actually said.

For skillGaps: include one entry for every skill (technical, communication, problemSolving, confidence, leadership, criticalThinking) that scored below 70. Set targetLevel to the score a well-prepared candidate at the stated interview level would be expected to achieve. Omit skills that scored 70 or above - they are not gaps. If all skills score 70+, return an empty skillGaps array.

Respond with ONLY a single valid JSON object matching this exact shape, no markdown fences, no commentary before or after it:

${RESPONSE_SCHEMA}`;

export function buildEvaluationUserPrompt(
  interview: InterviewSessionDocument,
  conversation: ConversationDocument[]
): string {
  const transcript = conversation
    .filter((turn) => turn.question)
    .map((turn) => {
      const answer =
        turn.answer && turn.answer.trim().length > 0
          ? turn.answer
          : "(no answer provided)";

      return `Turn ${turn.turnNumber}
Question: ${turn.question}
Answer: ${answer}`;
    })
    .join("\n\n");

  return `Interview Details
Title: ${interview.title}
Type: ${interview.type}
Level: ${interview.level}
Questions Asked: ${interview.turnCount} / ${interview.maxQuestions}

Transcript
${transcript}

Evaluate this interview and return the JSON object described in the system prompt.`;
}
