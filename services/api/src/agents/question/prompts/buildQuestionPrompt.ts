import { InterviewSessionDocument } from "../../../modules/interview-session/types/interview-session.types";
import { ConversationDocument } from "../../../modules/conversation/types/conversation.types";
import { InterviewContextDocument } from "../../../modules/interview-context/types/interview-context.types";
import { SectionName } from "../../../modules/interview-session/types/interview-session.types";
import { adaptDifficulty } from "../adaptDifficulty";
import { findTemplateQuestions } from "../../planner/questionTemplates";

/** Bump whenever the instructions or response shape change meaningfully. */
export const QUESTION_PROMPT_VERSION = "v3";

const RESPONSE_SCHEMA = `{
  "question": string,
  "difficulty": "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
  "isFollowUp": boolean,
  "topic": string,
  "rationale": string
}`;

export const QUESTION_SYSTEM_PROMPT = `You are an expert interviewer conducting a live, adaptive interview.

Given the interview so far (resume context, topics already covered, and the running transcript), decide the single best next question to ask.

Rules:
- Prefer a natural follow-up on the candidate's last answer when it left something unresolved, vague, or worth going deeper on. Set "isFollowUp": true in that case.
- Otherwise, move to a new topic that hasn't been covered yet and fits the interview type and current section.
- Never repeat a question that's already been asked (see "Topics already covered" and the transcript).
- Adjust difficulty based on how the candidate has been performing: escalate after strong, detailed answers; hold steady or ease off after short or struggling answers. Difficulty must be one of BEGINNER, INTERMEDIATE, or ADVANCED.
- Keep the question concise (one or two sentences) and specific enough to answer without more context.
- If "Template seeds" are provided, strongly prefer asking one of them (adapted to the conversation) before generating a novel question.

Respond with ONLY a single valid JSON object matching this exact shape, no markdown fences, no commentary before or after it:

${RESPONSE_SCHEMA}`;

export function buildQuestionUserPrompt(
  interview: InterviewSessionDocument,
  context: InterviewContextDocument | null,
  previousTurns: ConversationDocument[],
  currentSection?: SectionName
): string {
  const transcript = previousTurns
    .filter((turn) => turn.question)
    .map((turn) => {
      const answer =
        turn.answer && turn.answer.trim().length > 0
          ? turn.answer
          : "(no answer provided)";
      return `Q${turn.turnNumber}: ${turn.question}\nA${turn.turnNumber}: ${answer}`;
    })
    .join("\n\n");

  const lastDifficulty =
    context?.difficultyHistory[context.difficultyHistory.length - 1] ??
    interview.level;

  const recentQualityScores = (context?.answerQualityHistory ?? []).slice(-3);

  const suggestedDifficulty = adaptDifficulty(
    interview.level,
    context?.difficultyHistory ?? [],
    context?.answerQualityHistory ?? []
  );

  // Template seeds — only when the session has a target role.
  const templateSeeds = currentSection
    ? findTemplateQuestions(interview.targetRole, interview.targetCompany, currentSection)
    : [];

  // Already-asked questions from the transcript to exclude duplicates from seeds.
  const askedQuestions = new Set(
    previousTurns.map((t) => t.question?.trim()).filter(Boolean)
  );
  const unusedSeeds = templateSeeds.filter((q) => !askedQuestions.has(q.trim()));

  const sectionLine = currentSection
    ? `Current section: ${currentSection}`
    : "";

  const targetLine =
    interview.targetRole || interview.targetCompany
      ? `Target: ${[interview.targetRole, interview.targetCompany].filter(Boolean).join(" at ")}`
      : "";

  const seedsLine =
    unusedSeeds.length > 0
      ? `Template seeds (prefer one of these, adapted to the conversation):\n${unusedSeeds.map((q, i) => `${i + 1}. ${q}`).join("\n")}`
      : "";

  return `Interview Details
Title: ${interview.title}
Type: ${interview.type}
Base level: ${interview.level}
Question ${previousTurns.length + 1} of ${interview.maxQuestions}
Current difficulty: ${lastDifficulty}
Recent answer quality scores (0-100, most recent last): ${
    recentQualityScores.length ? recentQualityScores.join(", ") : "none yet"
  }
Suggested next difficulty based on that trend: ${suggestedDifficulty} (a starting point, not a rule - weigh it against your own read of the transcript below)
${sectionLine}
${targetLine}

${context?.resumeSummary ? `Candidate resume summary:\n${context.resumeSummary}\n` : ""}Topics already covered: ${
    context?.topicsCovered.length ? context.topicsCovered.join(", ") : "none yet"
  }

${seedsLine}

Transcript so far:
${transcript || "(no questions asked yet)"}

Decide the next question and return the JSON object described in the system prompt.`;
}
