export type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

const LEVELS: Difficulty[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

const ESCALATE_THRESHOLD = 75;
const DEESCALATE_THRESHOLD = 40;

/**
 * One-step-at-a-time difficulty adjustment from the most recent
 * answerQuality score: strong answer escalates, weak answer eases off,
 * anything in between holds steady. Falls back to the interview's base
 * level when there's no history yet.
 */
export function adaptDifficulty(
  baseLevel: Difficulty,
  difficultyHistory: string[],
  answerQualityHistory: number[]
): Difficulty {
  if (answerQualityHistory.length === 0) {
    return baseLevel;
  }

  const lastQuality = answerQualityHistory[answerQualityHistory.length - 1];

  const lastDifficulty =
    (difficultyHistory[difficultyHistory.length - 1] as Difficulty | undefined) ??
    baseLevel;

  const currentIndex = LEVELS.indexOf(lastDifficulty);

  if (currentIndex === -1) {
    return baseLevel;
  }

  if (lastQuality >= ESCALATE_THRESHOLD) {
    return LEVELS[Math.min(currentIndex + 1, LEVELS.length - 1)];
  }

  if (lastQuality <= DEESCALATE_THRESHOLD) {
    return LEVELS[Math.max(currentIndex - 1, 0)];
  }

  return lastDifficulty;
}
