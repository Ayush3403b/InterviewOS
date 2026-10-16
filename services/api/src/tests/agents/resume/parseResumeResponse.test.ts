import { describe, expect, it } from "vitest";

import { parseResumeResponse } from "../../../agents/resume/prompts/parseResumeResponse";
import { ApiError } from "../../../shared/errors/ApiError";

const validPayload = {
  summary: "Backend-focused engineer with 5 years in distributed systems.",
  extractedSkills: ["Go", "Kubernetes", "PostgreSQL"],
  atsScore: 78,
  suggestions: ["Quantify the scale of systems you've built."],
  experience: [
    {
      title: "Backend Engineer",
      company: "Acme Corp",
      duration: "2021 - Present",
      highlights: ["Scaled the payments service to 10x throughput."],
    },
  ],
  education: [
    { degree: "B.Tech in Computer Science", institution: "State University", year: "2020" },
  ],
  projects: [
    {
      name: "Distributed job queue",
      description: "Built a Kubernetes-native job queue.",
      technologies: ["Go", "Kubernetes"],
    },
  ],
  certifications: ["AWS Certified Solutions Architect"],
  missingSkills: ["Terraform"],
};

describe("parseResumeResponse", () => {

  it("parses a well-formed response", () => {

    const result = parseResumeResponse(JSON.stringify(validPayload));

    expect(result.atsScore).toBe(78);
    expect(result.extractedSkills).toEqual(["Go", "Kubernetes", "PostgreSQL"]);

  });

  it("strips markdown code fences", () => {

    const fenced = "```json\n" + JSON.stringify(validPayload) + "\n```";

    expect(parseResumeResponse(fenced).summary).toContain("Backend-focused");

  });

  it("accepts an empty extractedSkills array", () => {

    const result = parseResumeResponse(
      JSON.stringify({ ...validPayload, extractedSkills: [] })
    );

    expect(result.extractedSkills).toEqual([]);

  });

  it("throws an ApiError when atsScore is out of range", () => {

    expect(() =>
      parseResumeResponse(JSON.stringify({ ...validPayload, atsScore: 150 }))
    ).toThrow(ApiError);

  });

  it("throws an ApiError when suggestions is empty", () => {

    expect(() =>
      parseResumeResponse(JSON.stringify({ ...validPayload, suggestions: [] }))
    ).toThrow(ApiError);

  });

  it("throws an ApiError when the text is not valid JSON", () => {

    expect(() => parseResumeResponse("nonsense")).toThrow(ApiError);

  });

  it("accepts empty arrays for experience/education/projects/certifications/missingSkills", () => {

    const result = parseResumeResponse(
      JSON.stringify({
        ...validPayload,
        experience: [],
        education: [],
        projects: [],
        certifications: [],
        missingSkills: [],
      })
    );

    expect(result.experience).toEqual([]);
    expect(result.education).toEqual([]);

  });

  it("throws an ApiError when experience is missing entirely", () => {

    const { experience, ...withoutExperience } = validPayload;
    void experience;

    expect(() =>
      parseResumeResponse(JSON.stringify(withoutExperience))
    ).toThrow(ApiError);

  });

  it("passes through structured experience/education/project entries", () => {

    const result = parseResumeResponse(JSON.stringify(validPayload));

    expect(result.experience[0]).toEqual({
      title: "Backend Engineer",
      company: "Acme Corp",
      duration: "2021 - Present",
      highlights: ["Scaled the payments service to 10x throughput."],
    });
    expect(result.education[0].degree).toBe("B.Tech in Computer Science");
    expect(result.projects[0].technologies).toEqual(["Go", "Kubernetes"]);
    expect(result.certifications).toEqual(["AWS Certified Solutions Architect"]);
    expect(result.missingSkills).toEqual(["Terraform"]);

  });

});
