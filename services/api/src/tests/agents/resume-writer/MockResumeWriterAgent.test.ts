import { describe, expect, it } from "vitest";

import { MockResumeWriterAgent } from "../../../agents/resume-writer/MockResumeWriterAgent";

describe("MockResumeWriterAgent", () => {

  describe("checkGrammar", () => {

    it("delegates to the rule-based checks and returns a score", async () => {

      const agent = new MockResumeWriterAgent();

      const result = await agent.checkGrammar(
        "I was responsible for managing the release process."
      );

      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.score).toBeLessThan(100);
      expect(result.score).toBeGreaterThanOrEqual(0);

    });

    it("returns a perfect score for clean text", async () => {

      const agent = new MockResumeWriterAgent();

      const result = await agent.checkGrammar(
        "Led a team of 5 engineers, cutting deployment time by 60%."
      );

      expect(result.score).toBe(100);
      expect(result.issues).toHaveLength(0);

    });

  });

  describe("rewrite", () => {

    it("strips a leading personal pronoun and capitalizes the next word", async () => {

      const agent = new MockResumeWriterAgent();

      const result = await agent.rewrite("I managed a team of five engineers.");

      expect(result.rewritten).toBe("Managed a team of five engineers.");
      expect(result.explanation).toContain("Mock mode");

    });

    it("leaves text without a leading pronoun unchanged", async () => {

      const agent = new MockResumeWriterAgent();

      const result = await agent.rewrite("Managed a team of five engineers.");

      expect(result.rewritten).toBe("Managed a team of five engineers.");
      expect(result.explanation).toContain("no safe mechanical fix");

    });

    it("preserves the original text in the result", async () => {

      const agent = new MockResumeWriterAgent();

      const result = await agent.rewrite("My contribution was significant.");

      expect(result.original).toBe("My contribution was significant.");

    });

  });

});
