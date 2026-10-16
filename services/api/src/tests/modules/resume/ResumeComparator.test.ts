import { describe, expect, it } from "vitest";

import { compareResumes } from "../../../modules/resume/services/ResumeComparator";
import type { ResumeDocument } from "../../../modules/resume/types/resume.types";
import type {
  ExperienceAnalysis,
  EducationAnalysis,
  ProjectAnalysis,
  CertificationAnalysis,
  SkillsGapAnalysis,
} from "../../../agents/resume/analysis/resumeInsights.types";

function makeExperience(overrides: Partial<ExperienceAnalysis> = {}): ExperienceAnalysis {
  return {
    totalYearsExperience: 2,
    seniorityLevel: "entry",
    averageTenureYears: 2,
    employmentGaps: [],
    entriesWithParsedDates: 1,
    ...overrides,
  };
}

function makeEducation(overrides: Partial<EducationAnalysis> = {}): EducationAnalysis {
  return {
    highestDegreeLevel: "bachelor",
    degreeCount: 1,
    ...overrides,
  };
}

function makeProjects(overrides: Partial<ProjectAnalysis> = {}): ProjectAnalysis {
  return {
    totalProjects: 2,
    hasQuantifiedImpact: false,
    distinctTechnologiesUsed: 3,
    complexityScore: 40,
    ...overrides,
  };
}

function makeCertifications(
  overrides: Partial<CertificationAnalysis> = {}
): CertificationAnalysis {
  return {
    totalCertifications: 1,
    recognizedCertifications: ["AWS Certified Cloud Practitioner"],
    recommendation: "",
    ...overrides,
  };
}

function makeSkillsGap(overrides: Partial<SkillsGapAnalysis> = {}): SkillsGapAnalysis {
  return {
    inferredRoleFamily: "frontend",
    matchedSkillsForRole: ["JavaScript", "React"],
    missingSkillsForRole: ["TypeScript", "Docker", "Kubernetes"],
    ...overrides,
  };
}

function makeResumeFixture(
  overrides: Partial<ResumeDocument> = {}
): ResumeDocument {
  return {
    id: "resume-1",
    fileName: "resume-v1.pdf",
    extractedSkills: ["JavaScript", "React"],
    atsScore: 60,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    experienceAnalysis: makeExperience(),
    educationAnalysis: makeEducation(),
    projectAnalysis: makeProjects(),
    certificationAnalysis: makeCertifications(),
    skillsGapAnalysis: makeSkillsGap(),
    ...overrides,
  } as unknown as ResumeDocument;
}

describe("compareResumes", () => {

  it("detects skills added and removed, case-insensitively", () => {

    const from = makeResumeFixture({ extractedSkills: ["JavaScript", "React"] });
    const to = makeResumeFixture({ extractedSkills: ["javascript", "TypeScript", "Node.js"] });

    const result = compareResumes(from, to);

    expect(result.skillsAdded).toEqual(["TypeScript", "Node.js"]);
    expect(result.skillsRemoved).toEqual(["React"]);

  });

  it("computes the ATS score delta", () => {

    const from = makeResumeFixture({ atsScore: 60 });
    const to = makeResumeFixture({ atsScore: 75 });

    const result = compareResumes(from, to);

    expect(result.atsScoreDelta).toBe(15);

  });

  it("returns a null ATS delta when either score is missing", () => {

    const from = makeResumeFixture({ atsScore: undefined });
    const to = makeResumeFixture({ atsScore: 75 });

    const result = compareResumes(from, to);

    expect(result.atsScoreDelta).toBeNull();

  });

  it("detects a seniority level change", () => {

    const from = makeResumeFixture({
      experienceAnalysis: makeExperience({ totalYearsExperience: 2, seniorityLevel: "entry" }),
    });
    const to = makeResumeFixture({
      experienceAnalysis: makeExperience({ totalYearsExperience: 5, seniorityLevel: "mid" }),
    });

    const result = compareResumes(from, to);

    expect(result.seniorityChanged).toBe(true);
    expect(result.seniorityFrom).toBe("entry");
    expect(result.seniorityTo).toBe("mid");
    expect(result.experienceYearsDelta).toBe(3);

  });

  it("does not flag a seniority change when it stayed the same", () => {

    const from = makeResumeFixture();
    const to = makeResumeFixture({ extractedSkills: ["JavaScript", "React", "Vue"] });

    const result = compareResumes(from, to);

    expect(result.seniorityChanged).toBe(false);

  });

  it("finds newly recognized certifications, not just a count delta", () => {

    const from = makeResumeFixture({
      certificationAnalysis: makeCertifications({
        totalCertifications: 1,
        recognizedCertifications: ["AWS Certified Cloud Practitioner"],
      }),
    });
    const to = makeResumeFixture({
      certificationAnalysis: makeCertifications({
        totalCertifications: 2,
        recognizedCertifications: [
          "AWS Certified Cloud Practitioner",
          "Certified Kubernetes Administrator",
        ],
      }),
    });

    const result = compareResumes(from, to);

    expect(result.certificationsCountDelta).toBe(1);
    expect(result.newRecognizedCertifications).toEqual([
      "Certified Kubernetes Administrator",
    ]);

  });

  it("computes a negative missing-skills delta when the gap narrows", () => {

    const from = makeResumeFixture({
      skillsGapAnalysis: makeSkillsGap({
        missingSkillsForRole: ["TypeScript", "Docker", "Kubernetes"],
      }),
    });
    const to = makeResumeFixture({
      skillsGapAnalysis: makeSkillsGap({ missingSkillsForRole: ["Kubernetes"] }),
    });

    const result = compareResumes(from, to);

    expect(result.missingSkillsForRoleDelta).toBe(-2);

  });

  it("produces a non-empty, human-readable summary", () => {

    const from = makeResumeFixture({ atsScore: 60 });
    const to = makeResumeFixture({
      atsScore: 80,
      extractedSkills: ["JavaScript", "React", "TypeScript"],
    });

    const result = compareResumes(from, to);

    expect(result.summary.length).toBeGreaterThan(0);
    expect(result.summary).toContain("improved");

  });

  it("falls back to a neutral summary when nothing meaningfully changed", () => {

    const from = makeResumeFixture();
    const to = makeResumeFixture();

    const result = compareResumes(from, to);

    expect(result.summary).toContain("ATS score is unchanged.");

  });

});
