import { describe, expect, it } from "vitest";

import { runGrammarRules, scoreFromIssues } from "../../../agents/resume-writer/rules/grammarRules";

describe("runGrammarRules", () => {

  it("flags passive voice", () => {

    const issues = runGrammarRules("The project was completed by the team ahead of schedule.");

    expect(issues.some((issue) => issue.type === "passive_voice")).toBe(true);

  });

  it("flags a weak opener", () => {

    const issues = runGrammarRules("Responsible for managing a team of five engineers.");

    expect(issues.some((issue) => issue.type === "weak_opener")).toBe(true);

  });

  it("flags a personal pronoun", () => {

    const issues = runGrammarRules("I led the migration to a new backend architecture.");

    expect(issues.some((issue) => issue.type === "personal_pronoun")).toBe(true);

  });

  it("flags missing quantification on a long, number-free line", () => {

    const issues = runGrammarRules(
      "Led the migration to a new backend architecture across the whole engineering team."
    );

    expect(issues.some((issue) => issue.type === "no_quantification")).toBe(true);

  });

  it("does not flag quantification when a number is present", () => {

    const issues = runGrammarRules(
      "Led the migration to a new backend architecture, reducing latency by 40%."
    );

    expect(issues.some((issue) => issue.type === "no_quantification")).toBe(false);

  });

  it("does not flag quantification on a short line", () => {

    const issues = runGrammarRules("Led backend migrations.");

    expect(issues.some((issue) => issue.type === "no_quantification")).toBe(false);

  });

  it("flags an overly long line", () => {

    const longLine = Array.from({ length: 40 }, () => "word").join(" ");

    const issues = runGrammarRules(longLine);

    expect(issues.some((issue) => issue.type === "sentence_too_long")).toBe(true);

  });

  it("flags consecutive lines starting with the same word", () => {

    const issues = runGrammarRules("Managed the release process.\nManaged stakeholder communication.");

    expect(issues.some((issue) => issue.type === "repeated_word")).toBe(true);

  });

  it("does not flag clean, well-written text", () => {

    const issues = runGrammarRules("Led a team of 5 engineers, cutting deployment time by 60%.");

    expect(issues).toHaveLength(0);

  });

  it("returns no issues for empty input", () => {

    expect(runGrammarRules("")).toHaveLength(0);

  });

});

describe("scoreFromIssues", () => {

  it("returns 100 for no issues", () => {

    expect(scoreFromIssues([])).toBe(100);

  });

  it("deducts points per issue and floors at 0", () => {

    const manyIssues = Array.from({ length: 20 }, () => ({
      type: "other" as const,
      message: "test",
    }));

    expect(scoreFromIssues(manyIssues)).toBe(0);

  });

});
