import { describe, expect, it } from "vitest";

import { MockResumeAgent } from "../../../agents/resume/MockResumeAgent";

describe("MockResumeAgent", () => {

  it("extracts known skills mentioned in the resume text", async () => {

    const agent = new MockResumeAgent();

    const result = await agent.analyze(
      "Experienced engineer skilled in TypeScript, React, and Docker. " +
      "Built CI/CD pipelines and worked extensively with PostgreSQL."
    );

    expect(result.extractedSkills).toEqual(
      expect.arrayContaining(["TypeScript", "React", "Docker", "PostgreSQL", "CI/CD"])
    );

  });

  it("scores higher when metrics, skills, and length are all present", async () => {

    const agent = new MockResumeAgent();

    const strong = await agent.analyze(
      "Senior engineer with 8 years of experience in TypeScript, React, Node.js, AWS, " +
      "Docker, Kubernetes and PostgreSQL. Reduced API latency by 40% and improved " +
      "deployment frequency by 3x through CI/CD automation. Led a team of 5 engineers " +
      "across multiple product lines, mentoring junior developers and driving agile " +
      "ceremonies. Shipped several customer-facing features end to end."
    );

    const weak = await agent.analyze(
      "Worked at a company. Did some programming tasks and helped the team."
    );

    expect(strong.atsScore).toBeGreaterThan(weak.atsScore);

  });

  it("clamps the score within 0-100", async () => {

    const agent = new MockResumeAgent();

    const result = await agent.analyze(
      "TypeScript React Node.js Python Java SQL AWS Docker Kubernetes Git REST GraphQL " +
      "improved performance by 90% reduced cost by 3x scaled to 1 million users " +
      "leadership mentoring agile scrum communication " + "word ".repeat(200)
    );

    expect(result.atsScore).toBeLessThanOrEqual(100);
    expect(result.atsScore).toBeGreaterThanOrEqual(0);

  });

  it("always returns at least one suggestion", async () => {

    const agent = new MockResumeAgent();

    const result = await agent.analyze(
      "A fairly complete resume mentioning TypeScript, React and AWS, with metrics " +
      "like a 25% improvement, ".repeat(10)
    );

    expect(result.suggestions.length).toBeGreaterThan(0);

  });

  it("reports no specific skills gracefully instead of crashing", async () => {

    const agent = new MockResumeAgent();

    const result = await agent.analyze(
      "I like long walks and helping people. I am a hard worker and team player."
    );

    expect(result.extractedSkills).toEqual([]);
    expect(result.summary).toContain("no specific technical skills detected");

  });

  it("extracts an education entry from a degree-mentioning line", async () => {

    const agent = new MockResumeAgent();

    const result = await agent.analyze(
      "EDUCATION\nBachelor of Technology in Computer Science, 2019\nSome University"
    );

    expect(result.education.length).toBeGreaterThan(0);
    expect(result.education[0].year).toBe("2019");

  });

  it("extracts a certification entry from a certification-mentioning line", async () => {

    const agent = new MockResumeAgent();

    const result = await agent.analyze(
      "CERTIFICATIONS\nAWS Certified Solutions Architect - Associate"
    );

    expect(result.certifications.length).toBeGreaterThan(0);
    expect(result.certifications[0]).toContain("AWS Certified");

  });

  it("extracts an experience entry from a line with a date range", async () => {

    const agent = new MockResumeAgent();

    const result = await agent.analyze(
      "EXPERIENCE\nSoftware Engineer at Acme Corp, 2020 - 2023\nBuilt things."
    );

    expect(result.experience.length).toBeGreaterThan(0);
    expect(result.experience[0].duration).toContain("2020");

  });

  it("extracts a project entry and its mentioned technologies", async () => {

    const agent = new MockResumeAgent();

    const result = await agent.analyze(
      "PROJECTS\nPersonal project: built a React and TypeScript dashboard."
    );

    expect(result.projects.length).toBeGreaterThan(0);
    expect(result.projects[0].technologies).toEqual(
      expect.arrayContaining(["React", "TypeScript"])
    );

  });

  it("lists commonly expected skills the resume doesn't mention as missingSkills", async () => {

    const agent = new MockResumeAgent();

    const result = await agent.analyze(
      "Experienced with React and TypeScript only, nothing else mentioned here at all."
    );

    expect(result.missingSkills).toEqual(
      expect.arrayContaining(["Git", "SQL"])
    );

  });

  it("caps each section to a bounded number of entries", async () => {

    const agent = new MockResumeAgent();

    const manyEducationLines = Array.from(
      { length: 10 },
      (_, i) => `Bachelor of Science, University ${i}, 20${10 + i}`
    ).join("\n");

    const result = await agent.analyze(manyEducationLines);

    expect(result.education.length).toBeLessThanOrEqual(5);

  });

});
