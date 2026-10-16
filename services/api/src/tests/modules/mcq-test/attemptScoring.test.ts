import { describe, expect, it } from "vitest";
import { Types } from "mongoose";

import {
  answersRecord,
  buildAttemptQuestions,
  scoreAttempt,
  shuffled,
} from "../../../modules/mcq-test/services/attemptScoring";
import {
  McqDifficulty,
  McqQuestion,
  McqQuestionSource,
} from "../../../modules/mcq-test/types/mcq-test.types";

function makeQuestion(overrides: Partial<McqQuestion> = {}): McqQuestion {
  return {
    _id: new Types.ObjectId(),
    text: "What is 2 + 2?",
    options: ["3", "4", "5", "22"],
    correctOptionIndex: 1,
    difficulty: McqDifficulty.EASY,
    points: 1,
    source: McqQuestionSource.MANUAL,
    ...overrides,
  };
}

/** Deterministic stand-in for Math.random. */
function seeded(values: number[]) {
  let i = 0;
  return () => values[i++ % values.length];
}

describe("shuffled", () => {

  it("returns a permutation and leaves the input untouched", () => {

    const input = [1, 2, 3, 4, 5];

    const result = shuffled(input, seeded([0.9, 0.1, 0.5, 0.3]));

    expect([...result].sort()).toEqual([1, 2, 3, 4, 5]);
    expect(input).toEqual([1, 2, 3, 4, 5]);

  });

});

describe("buildAttemptQuestions", () => {

  it("keeps the authored order and natural option order when shuffling is off", () => {

    const questions = [makeQuestion({ text: "A" }), makeQuestion({ text: "B" })];

    const snapshot = buildAttemptQuestions({
      questions,
      shuffleQuestions: false,
      shuffleOptions: false,
    });

    expect(snapshot.map((question) => question.text)).toEqual(["A", "B"]);
    expect(snapshot[0].optionOrder).toEqual([0, 1, 2, 3]);
    expect(snapshot[0].questionId).toBe(questions[0]._id);

  });

  it("shuffles option display order without moving the correct answer's index", () => {

    const question = makeQuestion();

    const [snapshot] = buildAttemptQuestions(
      { questions: [question], shuffleQuestions: false, shuffleOptions: true },
      seeded([0, 0, 0])
    );

    expect(snapshot.optionOrder).not.toEqual([0, 1, 2, 3]);
    expect([...snapshot.optionOrder].sort()).toEqual([0, 1, 2, 3]);
    // The key still points at "4" in the original options.
    expect(snapshot.options[snapshot.correctOptionIndex]).toBe("4");

  });

});

describe("scoreAttempt", () => {

  const q1 = makeQuestion({ correctOptionIndex: 1, points: 1 });
  const q2 = makeQuestion({ correctOptionIndex: 0, points: 2 });
  const q3 = makeQuestion({ correctOptionIndex: 2, points: 1 });

  const snapshot = buildAttemptQuestions({
    questions: [q1, q2, q3],
    shuffleQuestions: false,
    shuffleOptions: false,
  });

  it("scores by points, counting unanswered questions as wrong", () => {

    const result = scoreAttempt(
      snapshot,
      new Map([
        [q1._id.toString(), 1], // correct, 1pt
        [q2._id.toString(), 3], // wrong
      ]),
      50
    );

    expect(result).toEqual({
      score: 1,
      maxScore: 4,
      percentage: 25,
      passed: false,
      correctCount: 1,
      answeredCount: 2,
    });

  });

  it("passes at exactly the pass percentage", () => {

    const result = scoreAttempt(
      snapshot,
      { [q2._id.toString()]: 0 },
      50
    );

    expect(result.percentage).toBe(50);
    expect(result.passed).toBe(true);

  });

  it("rounds the percentage to one decimal place", () => {

    const thirds = buildAttemptQuestions({
      questions: [makeQuestion(), makeQuestion(), makeQuestion()],
      shuffleQuestions: false,
      shuffleOptions: false,
    });

    const result = scoreAttempt(
      thirds,
      { [thirds[0].questionId.toString()]: 1 },
      0
    );

    expect(result.percentage).toBe(33.3);

  });

  it("handles an attempt with no questions without dividing by zero", () => {

    expect(scoreAttempt([], {}, 50).percentage).toBe(0);

  });

});

describe("answersRecord", () => {

  it("normalises Maps, plain objects and missing values", () => {

    expect(answersRecord(new Map([["a", 1]]))).toEqual({ a: 1 });
    expect(answersRecord({ b: 2 })).toEqual({ b: 2 });
    expect(answersRecord(undefined)).toEqual({});

  });

});
