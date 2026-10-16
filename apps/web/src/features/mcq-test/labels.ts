import type {
  McqDifficulty,
  McqDifficultyChoice,
  McqMaterialMode,
  McqQuestionSource,
  McqSubmitReason,
  McqTestStatus,
} from "./types";

/** Roles that can build tests and review results - mirrors TEST_AUTHOR_ROLES. */
export const TEST_AUTHOR_ROLES = ["recruiter", "faculty", "admin", "super_admin"];

/** Mirrors MCQ_LIMITS on the backend. */
export const MCQ_LIMITS = {
  maxQuestionsPerTest: 200,
  minOptions: 2,
  maxOptions: 6,
  maxPoints: 10,
  maxGeneratedPerRequest: 25,
  maxFiles: 10,
  maxFileBytes: 10 * 1024 * 1024,
} as const;

export const STATUS_LABELS: Record<McqTestStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  CLOSED: "Closed",
};

export const STATUS_STYLES: Record<McqTestStatus, string> = {
  DRAFT: "bg-ink-soft/10 text-ink-soft",
  PUBLISHED: "bg-live/10 text-live",
  CLOSED: "bg-warn/10 text-warn",
};

export const DIFFICULTY_LABELS: Record<McqDifficulty, string> = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
};

export const DIFFICULTY_CHOICE_LABELS: Record<McqDifficultyChoice, string> = {
  MIXED: "Mixed",
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
};

export const SOURCE_LABELS: Record<McqQuestionSource, string> = {
  MANUAL: "Manual",
  AI_TOPICS: "AI · topics",
  AI_MATERIAL: "AI · upload",
};

export const MATERIAL_MODE_LABELS: Record<McqMaterialMode, string> = {
  AUTO: "Detect automatically",
  EXTRACT: "Copy the questions already in the files",
  GENERATE: "Write new questions from the content",
};

export const SUBMIT_REASON_LABELS: Record<McqSubmitReason, string> = {
  MANUAL: "Submitted",
  TIME_UP: "Time ran out",
  PROCTORING: "Auto-submitted (fullscreen exits)",
};

export const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function takeTestUrl(accessCode: string): string {
  return `${window.location.origin}/app/take/${accessCode}`;
}
