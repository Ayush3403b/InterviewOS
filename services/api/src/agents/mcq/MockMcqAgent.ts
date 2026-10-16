import {
  GeneratedMcq,
  IMcqAgent,
  McqDifficultyChoice,
  McqDifficultyLevel,
  McqFromMaterialInput,
  McqFromTopicsInput,
  McqMaterialResult,
} from "./IMcqAgent";

const LEVELS: McqDifficultyLevel[] = ["EASY", "MEDIUM", "HARD"];

const MOCK_NOTE =
  "Mock question - set AI_EVALUATION_PROVIDER to a real provider to generate real ones.";

function levelFor(difficulty: McqDifficultyChoice, index: number): McqDifficultyLevel {
  return difficulty === "MIXED" ? LEVELS[index % LEVELS.length] : difficulty;
}

/** Puts `correct` at `correctIndex` among the distractors. */
function arrange(correct: string, distractors: string[], correctIndex: number) {
  const options = [...distractors];
  options.splice(correctIndex, 0, correct);
  return options;
}

function topicQuestion(
  topic: string,
  index: number,
  difficulty: McqDifficultyLevel
): GeneratedMcq {
  const correctOptionIndex = index % 4;

  return {
    question: `[Mock] Which statement about ${topic} is correct? (#${index + 1})`,
    options: arrange(
      `The correct statement about ${topic}`,
      ["first", "second", "third"].map(
        (ordinal) => `The ${ordinal} incorrect statement about ${topic}`
      ),
      correctOptionIndex
    ),
    correctOptionIndex,
    explanation: MOCK_NOTE,
    topic,
    difficulty,
  };
}

/** Sentences long enough to make a recognisable option. */
function sentencesOf(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 30 && sentence.length <= 300);
}

/**
 * Deterministic, offline stand-in (AI_EVALUATION_PROVIDER=mock) so the
 * whole test-building flow works in local dev and CI without API keys.
 * It can't read images, so image-only uploads get placeholder questions.
 */
export class MockMcqAgent implements IMcqAgent {
  async generateFromTopics(input: McqFromTopicsInput): Promise<GeneratedMcq[]> {
    const topics = input.topics
      .split(/[,\n;]+/)
      .map((topic) => topic.trim())
      .filter(Boolean);

    const topicList = topics.length ? topics : ["General knowledge"];

    return Array.from({ length: input.count }, (_, index) =>
      topicQuestion(
        topicList[index % topicList.length],
        index,
        levelFor(input.difficulty, index)
      )
    );
  }

  async generateFromMaterial(
    input: McqFromMaterialInput
  ): Promise<McqMaterialResult> {
    const sentences = sentencesOf(input.text ?? "");

    if (!sentences.length) {
      return {
        mode: "GENERATED",
        questions: await this.generateFromTopics({
          ...input,
          topics: "the uploaded material",
        }),
      };
    }

    const questions = sentences
      .slice(0, input.count)
      .map((sentence, index): GeneratedMcq => {
        const correctOptionIndex = index % 4;

        return {
          question: `[Mock] Which of these statements appears in the uploaded material? (#${index + 1})`,
          options: arrange(
            sentence,
            [1, 2, 3].map(
              (n) => `A statement that is not in the material (${index + 1}.${n})`
            ),
            correctOptionIndex
          ),
          correctOptionIndex,
          explanation: MOCK_NOTE,
          topic: "Uploaded material",
          difficulty: levelFor(input.difficulty, index),
        };
      });

    return { mode: "GENERATED", questions };
  }
}
