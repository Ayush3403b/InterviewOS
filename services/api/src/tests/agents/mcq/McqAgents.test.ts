import { describe, expect, it, vi } from "vitest";

import { LLMMcqAgent } from "../../../agents/mcq/LLMMcqAgent";
import { MockMcqAgent } from "../../../agents/mcq/MockMcqAgent";
import { generatedMcqSchema } from "../../../agents/mcq/schemas/mcqResponseSchema";

function llmReturning(...texts: string[]) {
  const generate = vi.fn();
  for (const text of texts) {
    generate.mockResolvedValueOnce({ text, provider: "fake", model: "fake", latencyMs: 1 });
  }
  return { provider: "fake", generate };
}

const VALID_BATCH = JSON.stringify({
  mode: "EXTRACTED",
  questions: [
    {
      question: "2 + 2?",
      options: ["3", "4", "5", "6"],
      correctOptionIndex: 1,
      explanation: "",
      topic: "Arithmetic",
      difficulty: "EASY",
    },
  ],
});

describe("LLMMcqAgent", () => {

  it("passes attachments and a generous output budget through to the client", async () => {

    const client = llmReturning(VALID_BATCH);
    const agent = new LLMMcqAgent(client);
    const attachment = { mimeType: "image/png", base64: "aW1n" };

    const result = await agent.generateFromMaterial({
      mode: "AUTO",
      count: 5,
      difficulty: "MIXED",
      attachments: [attachment],
    });

    expect(result.mode).toBe("EXTRACTED");
    expect(result.questions).toHaveLength(1);
    expect(client.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        attachments: [attachment],
        maxTokens: expect.any(Number),
        promptId: "mcqGeneration",
      })
    );

  });

  it("retries once when the first response fails validation", async () => {

    const client = llmReturning("not json at all", VALID_BATCH);
    const agent = new LLMMcqAgent(client, { validationRetryAttempts: 2 });

    const questions = await agent.generateFromTopics({
      topics: "Arithmetic",
      count: 1,
      difficulty: "EASY",
    });

    expect(questions).toHaveLength(1);
    expect(client.generate).toHaveBeenCalledTimes(2);

  });

  it("never returns more questions than were asked for", async () => {

    const many = JSON.stringify({
      questions: Array.from({ length: 5 }, (_, i) => ({
        question: `Q${i}?`,
        options: ["a", "b"],
        correctOptionIndex: 0,
      })),
    });

    const agent = new LLMMcqAgent(llmReturning(many));

    const questions = await agent.generateFromTopics({
      topics: "x",
      count: 2,
      difficulty: "MIXED",
    });

    expect(questions).toHaveLength(2);

  });

});

describe("MockMcqAgent", () => {

  it("produces the requested number of schema-valid questions, cycling through topics", async () => {

    const questions = await new MockMcqAgent().generateFromTopics({
      topics: "Closures, Promises",
      count: 4,
      difficulty: "MIXED",
    });

    expect(questions).toHaveLength(4);
    expect(questions.map((question) => question.topic)).toEqual([
      "Closures",
      "Promises",
      "Closures",
      "Promises",
    ]);

    for (const question of questions) {
      expect(generatedMcqSchema.safeParse(question).success).toBe(true);
    }

  });

  it("builds questions from material text when there is some", async () => {

    const result = await new MockMcqAgent().generateFromMaterial({
      mode: "AUTO",
      count: 2,
      difficulty: "EASY",
      text: "Photosynthesis converts light energy into chemical energy. Mitochondria are the site of cellular respiration in most cells.",
    });

    expect(result.questions).toHaveLength(2);
    expect(result.questions[0].options).toContain(
      "Photosynthesis converts light energy into chemical energy."
    );

  });

});
