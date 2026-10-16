import { describe, expect, it } from "vitest";

import {
  analyzeCertifications,
  analyzeEducation,
  analyzeExperience,
  analyzeProjects,
  analyzeSkillsGap,
  deriveResumeInsights,
  parseDurationYears,
} from "../../../agents/resume/analysis/deriveResumeInsights";

describe("parseDurationYears", () => {

  it("parses a simple year range", () => {
    expect(parseDurationYears("2019-2022")).toEqual({ start: 2019, end: 2022 });
  });

  it("parses an ongoing role as ending in the current year", () => {
    expect(parseDurationYears("2021 - Present", 2026)).toEqual({ start: 2021, end: 2026 });
  });

  it("handles a single bare year as a same-year entry", () => {
    expect(parseDurationYears("2020")).toEqual({ start: 2020, end: 2020 });
  });

  it("returns null when no year can be found", () => {
    expect(parseDurationYears("a while back")).toBeNull();
  });

  it("orders start/end even if the string lists them reversed", () => {
    expect(parseDurationYears("2022-2019")).toEqual({ start: 2019, end: 2022 });
  });

});

describe("analyzeExperience", () => {

  it("computes career span as earliest start to latest end, not a sum", () => {
    const result = analyzeExperience([
      { title: "A", company: "X", duration: "2018-2020", highlights: [] },
      // Overlaps with the entry above - a naive sum would double-count
      // 2019-2020.
      { title: "B", company: "Y", duration: "2019-2021", highlights: [] },
    ]);

    expect(result.totalYearsExperience).toBe(3); // 2018 -> 2021
    expect(result.entriesWithParsedDates).toBe(2);

  });

  it("classifies seniority from total years", () => {
    const entry = (duration: string) => ({ title: "A", company: "X", duration, highlights: [] });

    expect(analyzeExperience([entry("2024-2025")]).seniorityLevel).toBe("entry");
    expect(analyzeExperience([entry("2023-2026")]).seniorityLevel).toBe("mid");
    expect(analyzeExperience([entry("2020-2026")]).seniorityLevel).toBe("senior");
    expect(analyzeExperience([entry("2015-2026")]).seniorityLevel).toBe("lead");

  });

  it("detects a gap of a year or more between roles", () => {
    const result = analyzeExperience([
      { title: "A", company: "X", duration: "2015-2017", highlights: [] },
      { title: "B", company: "Y", duration: "2019-2021", highlights: [] },
    ]);

    expect(result.employmentGaps).toEqual([
      { afterYear: 2017, beforeYear: 2019, gapYears: 2 },
    ]);

  });

  it("does not report a gap for back-to-back roles", () => {
    const result = analyzeExperience([
      { title: "A", company: "X", duration: "2015-2017", highlights: [] },
      { title: "B", company: "Y", duration: "2017-2019", highlights: [] },
    ]);

    expect(result.employmentGaps).toHaveLength(0);

  });

  it("returns a zeroed-out result when nothing is parseable", () => {
    const result = analyzeExperience([
      { title: "A", company: "X", duration: "a long time", highlights: [] },
    ]);

    expect(result).toEqual({
      totalYearsExperience: 0,
      seniorityLevel: "entry",
      averageTenureYears: 0,
      employmentGaps: [],
      entriesWithParsedDates: 0,
    });

  });

});

describe("analyzeEducation", () => {

  it("picks the highest degree level across multiple entries", () => {
    const result = analyzeEducation([
      { degree: "Bachelor of Science in Computer Science", institution: "", year: "2018" },
      { degree: "Master of Technology", institution: "", year: "2020" },
    ]);

    expect(result.highestDegreeLevel).toBe("master");
    expect(result.degreeCount).toBe(2);

  });

  it("recognizes a PhD as the highest level", () => {
    const result = analyzeEducation([{ degree: "Ph.D in Physics", institution: "", year: "2021" }]);
    expect(result.highestDegreeLevel).toBe("phd");
  });

  it("returns unknown for unrecognized or empty education", () => {
    expect(analyzeEducation([]).highestDegreeLevel).toBe("unknown");
    expect(
      analyzeEducation([{ degree: "Some certificate program", institution: "", year: "" }])
        .highestDegreeLevel
    ).toBe("unknown");
  });

});

describe("analyzeProjects", () => {

  it("detects quantified impact from project text", () => {
    const result = analyzeProjects([
      { name: "Perf project", description: "Reduced load time by 30%", technologies: ["React"] },
    ]);
    expect(result.hasQuantifiedImpact).toBe(true);
  });

  it("dedupes technologies case-insensitively across projects", () => {
    const result = analyzeProjects([
      { name: "A", description: "", technologies: ["React", "Node.js"] },
      { name: "B", description: "", technologies: ["react", "Docker"] },
    ]);
    expect(result.distinctTechnologiesUsed).toBe(3);
  });

  it("caps complexity score at 100", () => {
    const manyProjects = Array.from({ length: 20 }, (_, i) => ({
      name: `Project ${i}`,
      description: "improved throughput by 50%",
      technologies: [`Tech${i}`],
    }));
    expect(analyzeProjects(manyProjects).complexityScore).toBe(100);
  });

  it("returns zeros for no projects", () => {
    const result = analyzeProjects([]);
    expect(result.totalProjects).toBe(0);
    expect(result.hasQuantifiedImpact).toBe(false);
    expect(result.complexityScore).toBe(0);
  });

});

describe("analyzeCertifications", () => {

  it("flags a known credential as recognized", () => {
    const result = analyzeCertifications(["AWS Certified Solutions Architect"]);
    expect(result.recognizedCertifications).toEqual(["AWS Certified Solutions Architect"]);
    expect(result.recommendation).toContain("relevant and recognized");
  });

  it("recommends adding certifications when there are none", () => {
    const result = analyzeCertifications([]);
    expect(result.recommendation).toContain("No certifications detected");
  });

  it("flags unrecognized certifications distinctly from having none", () => {
    const result = analyzeCertifications(["Certificate of completion, internal training"]);
    expect(result.recognizedCertifications).toHaveLength(0);
    expect(result.recommendation).toContain("don't match well-known industry credentials");
  });

});

describe("analyzeSkillsGap", () => {

  it("infers the best-matching role family and lists its gaps", () => {
    const result = analyzeSkillsGap(["React", "TypeScript", "JavaScript"]);
    expect(result.inferredRoleFamily).toBe("Frontend Engineer");
    expect(result.matchedSkillsForRole).toEqual(
      expect.arrayContaining(["React", "TypeScript", "JavaScript"])
    );
    expect(result.missingSkillsForRole).toEqual(expect.arrayContaining(["Angular", "Git"]));
  });

  it("returns null role family when nothing matches any profile", () => {
    const result = analyzeSkillsGap(["Mentoring", "Communication"]);
    expect(result.inferredRoleFamily).toBeNull();
    expect(result.matchedSkillsForRole).toHaveLength(0);
    expect(result.missingSkillsForRole).toHaveLength(0);
  });

});

describe("deriveResumeInsights", () => {

  it("assembles all five analyses from raw extracted data", () => {
    const insights = deriveResumeInsights({
      experience: [{ title: "Engineer", company: "Acme", duration: "2019-2023", highlights: [] }],
      education: [{ degree: "Bachelor of Technology", institution: "X", year: "2019" }],
      projects: [{ name: "P1", description: "grew revenue 20%", technologies: ["React"] }],
      certifications: ["AWS Certified Developer"],
      extractedSkills: ["React", "TypeScript"],
    });

    expect(insights.experienceAnalysis.totalYearsExperience).toBe(4);
    expect(insights.educationAnalysis.highestDegreeLevel).toBe("bachelor");
    expect(insights.projectAnalysis.totalProjects).toBe(1);
    expect(insights.certificationAnalysis.recognizedCertifications).toHaveLength(1);
    expect(insights.skillsGapAnalysis.inferredRoleFamily).toBe("Frontend Engineer");

  });

});
