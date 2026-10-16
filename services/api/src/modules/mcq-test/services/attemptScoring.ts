import {
  McqAttemptQuestion,
  McqAttemptResult,
  McqTest,
} from "../types/mcq-test.types";

/** Returns a float in [0, 1) - injectable so tests can shuffle deterministically. */
export type RandomSource = () => number;

/** Fisher-Yates; leaves the input untouched. */
export function shuffled<T>(items: readonly T[], random: RandomSource): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

/**
 * Snapshots a test's questions for one candidate, in that candidate's
 * question and option order. The correct answer stays as an index into
 * the *original* options array; `optionOrder` is only for display.
 */
export function buildAttemptQuestions(
  test: Pick<McqTest, "questions" | "shuffleQuestions" | "shuffleOptions">,
  random: RandomSource = Math.random
): McqAttemptQuestion[] {
  const questions = test.shuffleQuestions
    ? shuffled(test.questions, random)
    : [...test.questions];

  return questions.map((question) => {
    const naturalOrder = question.options.map((_, index) => index);

    return {
      questionId: question._id,
      text: question.text,
      options: [...question.options],
      correctOptionIndex: question.correctOptionIndex,
      optionOrder: test.shuffleOptions
        ? shuffled(naturalOrder, random)
        : naturalOrder,
      points: question.points ?? 1,
      topic: question.topic,
      explanation: question.explanation,
    };
  });
}

/**
 * Mongoose hands back a Map on hydrated documents and a plain object
 * on lean reads - normalise to a plain record either way.
 */
export function answersRecord(
  answers: Map<string, number> | Record<string, number> | undefined | null
): Record<string, number> {
  if (!answers) {
    return {};
  }

  return answers instanceof Map ? Object.fromEntries(answers) : { ...answers };
}

export function scoreAttempt(
  questions: Pick<McqAttemptQuestion, "questionId" | "correctOptionIndex" | "points">[],
  answers: Map<string, number> | Record<string, number> | undefined | null,
  passPercentage: number
): McqAttemptResult {
  const selected = answersRecord(answers);

  let score = 0;
  let maxScore = 0;
  let correctCount = 0;
  let answeredCount = 0;

  for (const question of questions) {
    maxScore += question.points;

    const choice = selected[question.questionId.toString()];

    if (choice === undefined) {
      continue;
    }

    answeredCount++;

    if (choice === question.correctOptionIndex) {
      score += question.points;
      correctCount++;
    }
  }

  const percentage =
    maxScore > 0 ? Math.round((score / maxScore) * 1000) / 10 : 0;

  return {
    score,
    maxScore,
    percentage,
    passed: percentage >= passPercentage,
    correctCount,
    answeredCount,
  };
}
