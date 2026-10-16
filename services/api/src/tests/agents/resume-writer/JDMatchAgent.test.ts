import { describe, expect, it } from "vitest";

import { MockResumeWriterAgent } from "../../../agents/resume-writer/MockResumeWriterAgent";
import { parseJDMatchResponse } from "../../../agents/resume-writer/prompts/parseJDMatchResponse";
import { buildJDMatchUserPrompt } from "../../../agents/resume-writer/prompts/buildJDMatchPrompt";

describe("JDMatchAgent & Prompts", () => {
  describe("buildJDMatchUserPrompt", () => {
    it("includes target role, JD, and resume text", () => {
      const prompt = buildJDMatchUserPrompt(
        "Experience in TypeScript and React",
        "Looking for a Senior Frontend Engineer with React, TypeScript, and Tailwind",
        { targetRole: "Senior Frontend Engineer" }
      );

      expect(prompt).toContain("Target Role Specified: Senior Frontend Engineer");
      expect(prompt).toContain("Looking for a Senior Frontend Engineer");
      expect(prompt).toContain("Experience in TypeScript and React");
    });
  });

  describe("parseJDMatchResponse", () => {
    it("parses valid JSON into JDMatchResult", () => {
      const raw = JSON.stringify({
        matchScore: 85,
        targetRole: "Full Stack Engineer",
        matchingKeywords: ["React", "TypeScript", "Node.js"],
        missingKeywords: ["Docker", "Kubernetes"],
        tailoredSummary: "Experienced engineer passionate about scalable systems.",
        tailoredBulletPoints: [
          {
            originalBullet: "Worked on frontend features",
            tailoredBullet: "Engineered scalable frontend modules using React & TypeScript, improving render speed by 40%.",
            highlightedKeywords: ["React", "TypeScript"],
            rationale: "Added quantifiable metric and highlighted core technologies.",
          },
        ],
        recommendations: [
          "Highlight Docker experience in project section.",
          "Add metrics to earlier engineering roles.",
        ],
      });

      const parsed = parseJDMatchResponse(raw);

      expect(parsed.matchScore).toBe(85);
      expect(parsed.targetRole).toBe("Full Stack Engineer");
      expect(parsed.matchingKeywords).toEqual(["React", "TypeScript", "Node.js"]);
      expect(parsed.missingKeywords).toEqual(["Docker", "Kubernetes"]);
      expect(parsed.tailoredBulletPoints).toHaveLength(1);
      expect(parsed.recommendations).toHaveLength(2);
    });

    it("parses JSON embedded in markdown blocks", () => {
      const raw = `Here is the analysis:
\`\`\`json
{
  "matchScore": 70,
  "targetRole": "Backend Developer",
  "matchingKeywords": ["Node.js", "Express"],
  "missingKeywords": ["AWS"],
  "tailoredSummary": "Backend specialist with strong Express skills.",
  "tailoredBulletPoints": [],
  "recommendations": ["Learn AWS cloud architecture."]
}
\`\`\``;

      const parsed = parseJDMatchResponse(raw);
      expect(parsed.matchScore).toBe(70);
      expect(parsed.matchingKeywords).toEqual(["Node.js", "Express"]);
    });

    it("throws ApiError on invalid schema", () => {
      const raw = JSON.stringify({
        matchScore: "not-a-number",
      });

      expect(() => parseJDMatchResponse(raw)).toThrow();
    });
  });

  describe("MockResumeWriterAgent matchJobDescription", () => {
    it("computes matching and missing keywords based on resume and JD", async () => {
      const agent = new MockResumeWriterAgent();

      const resume = "Experienced in React, TypeScript, and Node.js with 4 years building web apps.";
      const jd = "Looking for a Software Engineer skilled in React, TypeScript, Node.js, Docker, and Kubernetes.";

      const result = await agent.matchJobDescription(resume, jd, {
        targetRole: "Senior Software Engineer",
      });

      expect(result.targetRole).toBe("Senior Software Engineer");
      expect(result.matchingKeywords).toContain("React");
      expect(result.matchingKeywords).toContain("TypeScript");
      expect(result.matchingKeywords).toContain("Node.js");
      expect(result.missingKeywords).toContain("Docker");
      expect(result.missingKeywords).toContain("Kubernetes");
      expect(result.matchScore).toBeGreaterThan(0);
      expect(result.matchScore).toBeLessThanOrEqual(100);
      expect(result.tailoredBulletPoints.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });
});
